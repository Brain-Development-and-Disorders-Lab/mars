// Custom types
import {
  AttributeModel,
  EntityHistory,
  EntityModel,
  IEntity,
  IGenericItem,
  ILink,
  IResponseMessage,
  LinkType,
  ResponseData,
} from "@types";

// Models
import { Projects } from "@models/Projects";

// Custom functions
import { getDatabase } from "@connectors/database";
import { getIdentifier } from "@lib/util";

// Generate history version IDs
import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("1234567890abcdef", 10);

// External libraries
import _ from "lodash";
import dayjs from "dayjs";
import Papa from "papaparse";
import XLSX from "xlsx";
import { logger } from "@lib/logger";

const ENTITIES_COLLECTION = "entities"; // Collection name

// Constants for parsing strings
const ATTRIBUTE_PREFIX_LENGTH = 10;

export class Entities {
  /**
   * Get all Entity entries from the Entities collection
   * @returns Collection of all Entity entries
   */
  static all = async (): Promise<EntityModel[]> => {
    return await getDatabase().collection<EntityModel>(ENTITIES_COLLECTION).find().sort({ timestamp: 1 }).toArray();
  };

  /**
   * Get an Entity by identifier
   * @param _id Entity identifier
   * @returns `null` if the Entity does not exist
   */
  static getOne = async (_id: string): Promise<EntityModel | null> => {
    return await getDatabase().collection<EntityModel>(ENTITIES_COLLECTION).findOne({ _id: _id });
  };

  /**
   * Get multiple Entities from identifiers
   * @param entities Collection of Entity identifiers
   * @return {Promise<EntityModel[]>}
   */
  static getMany = async (entities: string[]): Promise<EntityModel[]> => {
    return await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .find({ _id: { $in: entities } })
      .sort({ timestamp: 1 })
      .toArray();
  };

  /**
   * Get multiple Entities from identifiers with pagination, filtering, and sorting
   * @param entities Collection of Entity identifiers
   * @param skip Number of entities to skip
   * @param limit Maximum number of entities to return
   * @param archived Filter by archived status (undefined = all, true = archived only, false = non-archived only)
   * @param reverse Reverse the sort order (deprecated, use sort instead)
   * @param filter Additional filters
   * @param sort Sort configuration
   * @return {Promise<EntityModel[]>}
   */
  static getManyPaginated = async (
    entities: string[],
    skip: number = 0,
    limit: number = 0,
    archived?: boolean,
    reverse: boolean = false,
    filter?: {
      startDate?: string;
      endDate?: string;
      owners?: string[];
      hasAttachments?: boolean;
      hasAttributes?: boolean;
      hasLinks?: boolean;
      attributeCountRanges?: string[];
    },
    sort?: { field: string; direction: string },
  ): Promise<EntityModel[]> => {
    const queryFilter: Record<string, unknown> = { _id: { $in: entities } };

    // Add archived filter if specified
    if (archived !== undefined) {
      queryFilter.archived = archived === true;
    }

    // Add date range filters
    if (filter?.startDate || filter?.endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (filter.startDate) {
        dateFilter.$gte = new Date(filter.startDate).toISOString();
      }
      if (filter.endDate) {
        const endDate = new Date(filter.endDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = endDate.toISOString();
      }
      if (Object.keys(dateFilter).length > 0) {
        queryFilter.created = dateFilter;
      }
    }

    // Add owner filter
    if (filter?.owners && filter.owners.length > 0) {
      queryFilter.owner = { $in: filter.owners };
    }

    // Add has attachments filter
    if (filter?.hasAttachments === true) {
      queryFilter["attachments.0"] = { $exists: true };
    }

    // Add has Attributes filter
    if (filter?.hasAttributes === true) {
      queryFilter["attributes.0"] = { $exists: true };
    }

    // Add has links filter
    if (filter?.hasLinks === true) {
      queryFilter["links.0"] = { $exists: true };
    }

    let query = getDatabase().collection<EntityModel>(ENTITIES_COLLECTION).find(queryFilter);

    // Determine sort field and direction
    let sortField = "timestamp";
    let sortDirection: 1 | -1 = reverse ? -1 : 1;

    if (sort) {
      // Map client field names to database field names
      const fieldMap: Record<string, string> = {
        name: "name",
        description: "description",
        owner: "owner",
        created: "created",
        timestamp: "timestamp",
      };
      sortField = fieldMap[sort.field] || sort.field || "timestamp";
      sortDirection = sort.direction === "desc" ? -1 : 1;
    }

    // Only sort by database field if it's not an array field (array fields sorted after fetch)
    if (sort && sort.field !== "attributes" && sort.field !== "attachments") {
      const sortObj: Record<string, 1 | -1> = { [sortField]: sortDirection };
      query = query.sort(sortObj);
    } else if (!sort) {
      const sortObj: Record<string, 1 | -1> = { [sortField]: sortDirection };
      query = query.sort(sortObj);
    }

    // For array fields (attributes, attachments), we need to sort by length
    // This is handled after fetching by sorting the results

    // If attribute count filtering is active, we need to fetch more results
    // to ensure we can fill a full page after filtering
    const needsAttributeFilter = filter?.attributeCountRanges && filter.attributeCountRanges.length > 0;

    if (needsAttributeFilter) {
      // When filtering by attribute count, fetch a large batch, filter, then paginate
      // Fetch enough to likely fill multiple pages after filtering
      const fetchLimit = limit > 0 ? limit * 50 : 10000; // Fetch 50x page size or up to 10k
      query = query.limit(fetchLimit);
    } else {
      // Normal pagination
      if (skip > 0) {
        query = query.skip(skip);
      }
      if (limit > 0) {
        query = query.limit(limit);
      }
    }

    let results = await query.toArray();

    // Apply attribute count range filter (client-side as it requires counting)
    if (needsAttributeFilter) {
      results = results.filter((entity) => {
        const attributeCount = entity.attributes.length;
        return filter.attributeCountRanges!.some((range) => {
          if (range === "0") return attributeCount === 0;
          if (range === "1-5") return attributeCount >= 1 && attributeCount <= 5;
          if (range === "6-10") return attributeCount >= 6 && attributeCount <= 10;
          if (range === "11+") return attributeCount >= 11;
          return false;
        });
      });

      // After filtering, apply pagination
      if (skip > 0) {
        results = results.slice(skip);
      }
      if (limit > 0) {
        results = results.slice(0, limit);
      }
    }

    // Handle sorting for array fields (attributes, attachments) by length
    if (sort && (sort.field === "attributes" || sort.field === "attachments")) {
      results.sort((a, b) => {
        const aLength = sort.field === "attributes" ? a.attributes.length : a.attachments.length;
        const bLength = sort.field === "attributes" ? b.attributes.length : b.attachments.length;
        const direction = sort.direction === "desc" ? -1 : 1;
        return (aLength - bLength) * direction;
      });
    }

    return results;
  };

  /**
   * Count Entities matching identifiers and filters
   * @param entities Collection of Entity identifiers
   * @param archived Filter by archived status (undefined = all, true = archived only, false = non-archived only)
   * @param filter Additional filters
   * @return {Promise<number>}
   */
  static countMany = async (
    entities: string[],
    archived?: boolean,
    filter?: {
      startDate?: string;
      endDate?: string;
      owners?: string[];
      hasAttachments?: boolean;
      hasAttributes?: boolean;
      hasLinks?: boolean;
      attributeCountRanges?: string[];
    },
  ): Promise<number> => {
    const queryFilter: Record<string, unknown> = { _id: { $in: entities } };

    // Add archived filter if specified
    if (archived !== undefined) {
      queryFilter.archived = archived === true;
    }

    // Add date range filters
    if (filter?.startDate || filter?.endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (filter.startDate) {
        dateFilter.$gte = new Date(filter.startDate).toISOString();
      }
      if (filter.endDate) {
        const endDate = new Date(filter.endDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = endDate.toISOString();
      }
      if (Object.keys(dateFilter).length > 0) {
        queryFilter.created = dateFilter;
      }
    }

    // Add owner filter
    if (filter?.owners && filter.owners.length > 0) {
      queryFilter.owner = { $in: filter.owners };
    }

    // Add has attachments filter
    if (filter?.hasAttachments === true) {
      queryFilter["attachments.0"] = { $exists: true };
    }

    // Add has attributes filter
    if (filter?.hasAttributes === true) {
      queryFilter["attributes.0"] = { $exists: true };
    }

    // Add has links filter
    if (filter?.hasLinks === true) {
      queryFilter["links.0"] = { $exists: true };
    }

    let count = await getDatabase().collection<EntityModel>(ENTITIES_COLLECTION).countDocuments(queryFilter);

    // Apply attribute count range filter (client-side as it requires counting)
    if (filter?.attributeCountRanges && filter.attributeCountRanges.length > 0) {
      const allEntities = await getDatabase().collection<EntityModel>(ENTITIES_COLLECTION).find(queryFilter).toArray();
      count = allEntities.filter((entity) => {
        const attributeCount = entity.attributes.length;
        return filter.attributeCountRanges!.some((range) => {
          if (range === "0") return attributeCount === 0;
          if (range === "1-5") return attributeCount >= 1 && attributeCount <= 5;
          if (range === "6-10") return attributeCount >= 6 && attributeCount <= 10;
          if (range === "11+") return attributeCount >= 11;
          return false;
        });
      }).length;
    }

    return count;
  };

  static exists = async (_id: string): Promise<boolean> => {
    const entity = await getDatabase().collection<EntityModel>(ENTITIES_COLLECTION).findOne({ _id: _id });

    return !_.isNull(entity);
  };

  static existByName = async (name: string): Promise<boolean> => {
    const entity = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .findOne({ name: name, archived: false });

    return !_.isNull(entity);
  };

  static getByName = async (name: string): Promise<EntityModel | null> => {
    return await getDatabase().collection<EntityModel>(ENTITIES_COLLECTION).findOne({ name: name, archived: false });
  };

  /**
   * Create a new Entity
   * @param {IEntity} entity Entity information
   * @returns {Promise<ResponseData<string>>}
   */
  static create = async (entity: IEntity): Promise<ResponseData<string>> => {
    // Clean the Entity input data
    entity.name = entity.name.toString().trim();
    entity.description = entity.description.toString().trim();

    // Allocate a new identifier and join with IEntity data
    const joinedEntity: EntityModel = {
      _id: getIdentifier("entity"), // Generate new identifier
      secondaryIdentifier: entity.secondaryIdentifier || { value: "", format: "" },
      timestamp: dayjs(Date.now()).toISOString(), // Add created timestamp
      ...entity, // Unpack existing IEntity fields
      history: [],
    };

    // Create reciprocal links between Entities
    for await (const link of joinedEntity.links) {
      // Update the `source` component to include Entity information
      link.source = {
        _id: joinedEntity._id,
        name: joinedEntity.name,
      };

      await Entities.addLink(link);
    }

    for await (const project of entity.projects) {
      // Add Entity to Project
      await Projects.addEntity(project, joinedEntity._id);
    }

    const response = await getDatabase().collection<EntityModel>(ENTITIES_COLLECTION).insertOne(joinedEntity);
    const successStatus = _.isEqual(response.insertedId, joinedEntity._id);

    return {
      success: successStatus,
      message: successStatus ? "Created new Entity" : "Unable to create Entity",
      data: response.insertedId.toString(),
    };
  };

  /**
   * Apply updates to an existing Entity
   * @param updated Updated Entity information
   * @return {Promise<IResponseMessage>}
   */
  static update = async (updated: EntityModel): Promise<IResponseMessage> => {
    const entity = await Entities.getOne(updated._id);

    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    // Construct an update object from the original Entity, and merge in the changes
    const update: { $set: IEntity } = {
      $set: {
        name: entity.name,
        secondaryIdentifier: entity.secondaryIdentifier || { value: "", format: "" },
        owner: entity.owner,
        created: entity.created,
        archived: entity.archived,
        description: entity.description,
        projects: entity.projects,
        links: entity.links,
        attributes: entity.attributes,
        attachments: entity.attachments,
        history: entity.history,
      },
    };

    // Name
    if (!_.isUndefined(updated.name)) {
      update.$set.name = updated.name;
    }

    // Description
    if (!_.isUndefined(updated.description)) {
      update.$set.description = updated.description;
    }

    // Secondary Identifier
    if (!_.isUndefined(updated.secondaryIdentifier)) {
      update.$set.secondaryIdentifier = updated.secondaryIdentifier;
    }

    // Projects
    if (!_.isUndefined(updated.projects)) {
      update.$set.projects = updated.projects;

      // Projects added in updated Entity
      const addProjects = _.difference(updated.projects, entity.projects);
      for await (const project of addProjects) {
        await Entities.addProject(updated._id, project);
        await Projects.addEntity(project, updated._id);
      }

      // Projects removed in updated Entity
      const removeProjects = _.difference(entity.projects, updated.projects);
      for await (const project of removeProjects) {
        await Entities.removeProject(updated._id, project);
        await Projects.removeEntity(project, updated._id);
      }
    }

    // Links
    if (!_.isUndefined(updated.links)) {
      update.$set.links = updated.links;

      // Create the collection of links added in the updated Entity
      const addLinks = updated.links.filter((link) => {
        // Filter by links not in the original Entity
        return !Entities.linkExists(link, entity.links);
      });
      for await (const link of addLinks) {
        await Entities.addLink(link);
      }

      // Create the collection of links to be removed from the Entity
      const removeLinks = entity.links.filter((r) => {
        return !Entities.linkExists(r, updated.links);
      });
      for await (const link of removeLinks) {
        await Entities.removeLink(link);
      }
    }

    // Attributes
    if (!_.isUndefined(updated.attributes)) {
      update.$set.attributes = updated.attributes;
      const updatedAttributes = updated.attributes.map((a) => a._id);
      const entityAttributes = entity.attributes.map((a) => a._id);

      // Attributes added in updated Entity
      const addAttributeIdentifiers = _.difference(updatedAttributes, entityAttributes);
      const addAttributes = updated.attributes.filter((a) => _.includes(addAttributeIdentifiers, a._id));
      for await (const attribute of addAttributes) {
        await this.addAttribute(updated._id, attribute);
      }

      // Attributes removed in updated Entity
      const removeAttributeIdentifiers = _.difference(entityAttributes, updatedAttributes);
      const removeAttributes = entity.attributes.filter((a) => _.includes(removeAttributeIdentifiers, a._id));
      for await (const attribute of removeAttributes) {
        await this.removeAttribute(updated._id, attribute._id);
      }
    }

    // Attachments
    if (!_.isUndefined(updated.attachments)) {
      update.$set.attachments = updated.attachments;
    }

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: updated._id }, update);

    return {
      success: true,
      message: response.modifiedCount == 1 ? "Updated Entity" : "No changes made to Entity",
    };
  };

  /**
   * Add a history entry to an Entity based on provided Entity state
   * @param historyEntity Existing Entity state to add to Entity history
   * @param author Identifier of User who authored changes
   * @param message Changelog message associated with changes
   * @return {Promise<IResponseMessage>}
   */
  static addHistory = async (
    historyEntity: EntityModel,
    author?: string,
    message?: string,
  ): Promise<IResponseMessage> => {
    const entity = await Entities.getOne(historyEntity._id);
    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    const historyEntityModel: EntityHistory = {
      author: author || "",
      message: message || "",
      version: nanoid(),
      timestamp: dayjs(Date.now()).toISOString(), // Timestamp on history creation

      _id: historyEntity._id,
      name: historyEntity.name,
      secondaryIdentifier: historyEntity.secondaryIdentifier || { value: "", format: "" },
      owner: historyEntity.owner,
      archived: historyEntity.archived,
      created: historyEntity.created,
      description: historyEntity.description,
      projects: historyEntity.projects,
      links: historyEntity.links,
      attributes: historyEntity.attributes,
      attachments: historyEntity.attachments,
    };

    const update: { $set: Partial<EntityModel> } = {
      $set: {
        history: [historyEntityModel, ...(entity.history || [])],
      },
    };

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: historyEntity._id }, update);
    if (response.modifiedCount > 0) {
      logger.info({ entityId: historyEntity._id }, "Added history to Entity");
    }

    return {
      success: true,
      message: response.modifiedCount === 1 ? "Added history to Entity" : "No history added to Entity",
    };
  };

  /**
   * Set the archive state of an Entity
   * @param _id Entity identifier to archive
   * @param state Entity archive state
   * @return {Promise<IResponseMessage>}
   */
  static setArchived = async (_id: string, state: boolean): Promise<IResponseMessage> => {
    logger.debug({ entityId: _id, archived: state }, "Setting archive state of Entity");
    const entity = await Entities.getOne(_id);
    if (_.isNull(entity)) {
      logger.error({ entityId: _id }, "Unable to retrieve Entity");
      return {
        success: false,
        message: "Error retrieving existing Entity",
      };
    }

    // Update the archived state
    entity.archived = state;
    const update: { $set: IEntity } = {
      $set: {
        ...entity,
      },
    };

    const response = await getDatabase().collection<EntityModel>(ENTITIES_COLLECTION).updateOne({ _id: _id }, update);
    if (response.modifiedCount > 0) {
      logger.info({ entityId: _id, archived: state }, "Set archive state of Entity");
    }

    return {
      success: true,
      message: response.modifiedCount === 1 ? "Set archive state of Entity" : "No changes made to Entity",
    };
  };

  /**
   * Add a Project to an Entity
   * @param _id Target Entity identifier
   * @param project_id Project identifier to associate with Entity
   * @returns {Promise<IResponseMessage>}
   */
  static addProject = async (_id: string, project_id: string): Promise<IResponseMessage> => {
    const entity = await this.getOne(_id);

    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    const projectCollection = _.cloneDeep(entity.projects);
    if (projectCollection.filter((p) => _.isEqual(p, project_id)).length > 0) {
      return {
        success: false,
        message: "Entity already associated with Project",
      };
    }
    projectCollection.push(project_id);

    const update = {
      $set: {
        projects: projectCollection,
      },
    };

    const response = await getDatabase().collection<EntityModel>(ENTITIES_COLLECTION).updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus ? "Added Project successfully" : "Unable to add Project",
    };
  };

  /**
   * Remove a Project from an Entity
   * @param _id Target Entity identifier
   * @param project_id Project identifier to remove from Entity
   * @returns {Promise<IResponseMessage>}
   */
  static removeProject = async (_id: string, project_id: string): Promise<IResponseMessage> => {
    const entity = await this.getOne(_id);

    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    const projectCollection = _.cloneDeep(entity.projects);
    const update = {
      $set: {
        projects: projectCollection.filter((p) => !_.isEqual(p, project_id)),
      },
    };

    const response = await getDatabase().collection<EntityModel>(ENTITIES_COLLECTION).updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus ? "Removed Project successfully" : "Unable to remove Project",
    };
  };

  /**
   * Update the Entity description
   * @param {string} _id Entity identifier
   * @param {string} description Update Entity description
   * @returns {IResponseMessage}
   */
  static setDescription = async (_id: string, description: string): Promise<IResponseMessage> => {
    const update = {
      $set: {
        description: description,
      },
    };

    const response = await getDatabase().collection<EntityModel>(ENTITIES_COLLECTION).updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus ? "Set description successfully" : "Unable to set description",
    };
  };

  /**
   * Compare two `ILink` structures and determine if they are describing
   * the same link or not
   * @param a Link
   * @param b Link
   * @return {boolean}
   */
  private static linkIsEqual = (a: ILink, b: ILink): boolean => {
    return _.isEqual(a.source._id, b.source._id) && _.isEqual(a.target._id, b.target._id) && _.isEqual(a.type, b.type);
  };

  /**
   * Search a collection of existing `ILink` structures to find if another
   * `ILink` already exists in the collection or not
   * @param {ILink} link Link structure to search for
   * @param {ILink[]} links Collection of existing Links
   * @return {boolean}
   */
  private static linkExists = (link: ILink, links: ILink[]): boolean => {
    for (const l of links) {
      if (Entities.linkIsEqual(l, link)) {
        return true;
      }
    }
    return false;
  };

  /**
   * Add a new link to a target Entity
   * @param {ILink} link Link data containing the source Entity, target Entity, and link type
   * @return {Promise<IResponseMessage>}
   */
  static addLink = async (link: ILink): Promise<IResponseMessage> => {
    // Create a clone of the `ILink` instance for the target Entity
    const targetLink = _.cloneDeep(link);
    const targetEntity = await Entities.getOne(targetLink.target._id);

    if (_.isNull(targetEntity)) {
      return {
        success: false,
        message: "Target Entity not found",
      };
    }

    // Switch the source and target
    const source = _.cloneDeep(link.source);
    const target = _.cloneDeep(link.target);
    targetLink.source = target;
    targetLink.target = source;

    // Amend the link depending on the link type
    if (link.type === "child") {
      // Flip to "parent" type if "child" being added
      targetLink.type = "parent";
    } else if (link.type === "parent") {
      // Flip to "child" type if "parent" being added
      targetLink.type = "child";
    }

    // Confirm that the link does not exist on the target Entity
    if (Entities.linkExists(targetLink, targetEntity.links)) {
      return {
        success: false,
        message: "Link between Entities already exists",
      };
    }

    // Add the new `ILink` to the target Entity
    const links: ILink[] = _.cloneDeep(targetEntity.links);
    links.push(targetLink);

    const update: { $set: Partial<EntityModel> } = {
      $set: {
        links: links,
      },
    };

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: targetLink.source._id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus ? "Added link successfully" : "Unable to add link",
    };
  };

  /**
   * Remove a link from a target Entity
   * @param {ILink} link Link data containing the source Entity, target Entity, and link type
   * @return {Promise<IResponseMessage>}
   */
  static removeLink = async (link: ILink): Promise<IResponseMessage> => {
    // Create a clone of the `ILink` instance for the target Entity
    const targetLink = _.cloneDeep(link);
    const targetEntity = await Entities.getOne(targetLink.target._id);

    if (_.isNull(targetEntity)) {
      return {
        success: false,
        message: "Target Entity not found",
      };
    }

    // Switch the source and target
    const source = _.cloneDeep(link.source);
    const target = _.cloneDeep(link.target);
    targetLink.source = target;
    targetLink.target = source;

    // Amend the link depending on the link type
    if (link.type === "child") {
      // Flip to "parent" type if "child" being added
      targetLink.type = "parent";
    } else if (link.type === "parent") {
      // Flip to "child" type if "parent" being added
      targetLink.type = "child";
    }

    // Confirm that the link to remove currently exists on the target Entity
    if (!Entities.linkExists(targetLink, targetEntity.links)) {
      return {
        success: false,
        message: "Link between Entities does not exist",
      };
    }

    // Remove the existing `ILink`
    const links: ILink[] = _.cloneDeep(targetEntity.links).filter((l) => {
      return !Entities.linkIsEqual(l, targetLink);
    });

    const update: { $set: Partial<EntityModel> } = {
      $set: {
        links: links,
      },
    };

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: targetLink.source._id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus ? "Removed link successfully" : "Unable to remove link",
    };
  };

  /**
   * Add an Attibute to an Entity
   * @param _id Target Entity identifier
   * @param attribute Attribute data
   * @returns {Promise<IResponseMessage>}
   */
  static addAttribute = async (_id: string, attribute: AttributeModel): Promise<IResponseMessage> => {
    const entity = await this.getOne(_id);

    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    const attributeCollection = _.cloneDeep(entity.attributes);
    attributeCollection.push(attribute);

    const update = {
      $set: {
        attributes: attributeCollection,
      },
    };

    const response = await getDatabase().collection<EntityModel>(ENTITIES_COLLECTION).updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus ? "Added Attribute successfully" : "Unable to add Attribute",
    };
  };

  /**
   * Remove an Attribute from an Entity by the Attribute identifier
   * @param _id Target Entity identifier
   * @param attribute Attribute identifier to remove
   * @returns {Promise<IResponseMessage>}
   */
  static removeAttribute = async (_id: string, attribute: string): Promise<IResponseMessage> => {
    const entity = await this.getOne(_id);

    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    // Exclude the Attribute identifier
    const attributeCollection = _.cloneDeep(entity.attributes).filter((a) => a._id != attribute);
    if (attributeCollection.length === entity.attributes.length) {
      return {
        success: false,
        message: "Entity does not have Attribute to remove",
      };
    }

    const update = {
      $set: {
        attributes: attributeCollection,
      },
    };

    const response = await getDatabase().collection<EntityModel>(ENTITIES_COLLECTION).updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus ? "Removed Attribute successfully" : "Unable to remove Attribute",
    };
  };

  /**
   * Update an Attribute associated with an Entity
   * @param _id Target Entity identifier
   * @param attribute Updated Attribute
   * @returns {Promise<IResponseMessage>}
   */
  static updateAttribute = async (_id: string, attribute: AttributeModel): Promise<IResponseMessage> => {
    const entity = await this.getOne(_id);

    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    if (_.findIndex(entity.attributes, { _id: attribute._id }) == -1) {
      return {
        success: false,
        message: "Entity does not contain Attribute to update",
      };
    }

    // Create new collection of Attributes, subsituting the original Attribute with the updated Attribute
    const attributeCollection = _.map(_.cloneDeep(entity.attributes), (a) =>
      _.isEqual(a._id, attribute._id) ? attribute : a,
    );

    const update = {
      $set: {
        attributes: attributeCollection,
      },
    };

    const response = await getDatabase().collection<EntityModel>(ENTITIES_COLLECTION).updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus ? "Updated Attribute successfully" : "Unable to update Attribute",
    };
  };

  /**
   * Generate export data for the Entity
   * @param _id Entity identifier
   * @param format File format of exported data, either JSON or CSV
   * @param fields Optional argument to specify Entity data fields for export
   * @returns {Promise<string>}
   */
  static export = async (
    _id: string,
    format: "json" | "csv" | "xlsx",
    fields?: string[],
    includeHistory = false,
  ): Promise<string> => {
    const entity = await Entities.getOne(_id);

    if (_.isNull(entity)) {
      return "";
    }

    if (!includeHistory) {
      delete (entity as never)["history"];
    }

    if (_.isEqual(format, "json")) {
      // Handle JSON format
      if (_.isUndefined(fields)) {
        // Export the entire Entity
        return JSON.stringify(entity, null, "  ");
      } else {
        const formatted: Partial<EntityModel> = {
          _id: entity._id,
          name: entity.name,
          owner: entity.owner,
        };

        // Assemble exported object using specified fields
        for await (const field of fields) {
          if (_.isEqual(field, "created")) {
            formatted["created"] = dayjs(entity.created).format("DD MMM YYYY").toString();
          } else if (_.isEqual(field, "description")) {
            // "description" data field
            formatted["description"] = entity.description;
          } else if (_.startsWith(field, "link_")) {
            // "link" data field
            // Create an empty links structure
            if (_.isUndefined(formatted.links)) {
              formatted.links = [];
            }

            const target = await Entities.getOne(field.split("_")[1]);
            if (!_.isNull(target)) {
              // Get the link details and add to the collection of exported links
              const link = entity.links.find((link) => {
                return Entities.linkIsEqual(link, {
                  source: {
                    _id: entity._id,
                    name: entity.name,
                  },
                  target: {
                    _id: target._id,
                    name: target.name,
                  },
                  type: field.split("_")[2] as LinkType,
                });
              });
              if (link) {
                formatted.links.push(link);
              }
            }
          } else if (_.startsWith(field, "attribute_")) {
            // "attributes" data field
            if (_.isUndefined(formatted.attributes)) {
              formatted["attributes"] = [];
            }

            // Get the Attribute details and add to the collection of exported Attributes
            const attribute = entity.attributes.find((attribute) => {
              return _.isEqual(attribute._id, field.slice(ATTRIBUTE_PREFIX_LENGTH));
            });
            if (attribute) {
              formatted.attributes.push(attribute);
            }
          }
        }

        return JSON.stringify(formatted, null, "  ");
      }
    } else if (_.isEqual(format, "csv") || _.isEqual(format, "xlsx")) {
      let exportFields = fields;

      // Headers and row for spreadsheet output
      const headers: string[] = ["ID", "Name"];
      const row: string[] = [entity._id, entity.name];

      // Default behavior is to export all fields
      if (_.isUndefined(exportFields)) {
        exportFields = ["created", "owner", "description"];

        for await (const link of entity.links) {
          exportFields.push(`link_${link.target._id}_${link.type}`);
        }
        for await (const project of entity.projects) {
          exportFields.push(`project_${project}`);
        }
        for await (const attribute of entity.attributes) {
          exportFields.push(`attribute_${attribute._id}`);
        }
      }

      for await (const field of exportFields) {
        if (_.isEqual(field, "created")) {
          headers.push("Created");
          row.push(dayjs(entity.created).format("DD MMM YYYY").toString());
        } else if (_.isEqual(field, "owner")) {
          headers.push("Owner");
          row.push(entity.owner);
        } else if (_.isEqual(field, "description")) {
          headers.push("Description");
          row.push(entity.description);
        } else if (_.startsWith(field, "link_")) {
          const target = await Entities.getOne(field.split("_")[1]);
          if (!_.isNull(target)) {
            headers.push(`Link (${field.split("_")[2]})`);
            row.push(target.name);
          }
        } else if (_.startsWith(field, "attribute_")) {
          const attributeId = field.slice(ATTRIBUTE_PREFIX_LENGTH);
          entity.attributes.map((attribute) => {
            if (_.isEqual(attribute._id, attributeId)) {
              for (const value of attribute.values) {
                headers.push(`${value?.name} (${attribute?.name})`);

                if (value.type === "entity") {
                  const entityData = JSON.parse(value.data) as { _id: string; name: string };
                  row.push(entityData.name);
                } else if (value.type === "select") {
                  const selectData = JSON.parse(value.data) as { selected: string; options: string[] };
                  row.push(selectData.selected);
                } else {
                  row.push(value.data);
                }
              }
            }
          });
        }
      }

      if (_.isEqual(format, "xlsx")) {
        const ws = XLSX.utils.aoa_to_sheet([headers, row]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Export");
        const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
        return buffer.toString("base64");
      }

      return Papa.unparse([headers, row]);
    } else {
      return "Invalid format";
    }
  };

  /**
   * Serialise a single attribute value to a plain string for spreadsheet export.
   */
  private static serialiseValue = (value: { type: string; data: string }): string => {
    if (value.type === "entity") {
      return (JSON.parse(value.data) as { name: string }).name;
    }
    if (value.type === "select") {
      return (JSON.parse(value.data) as { selected: string }).selected;
    }
    return value.data;
  };

  /**
   * Generate a string-based representation of multiple Entities for export.
   * For CSV and XLSX, attribute columns are built from the union of all attributes
   * across the provided entities, with empty cells where an entity lacks a given attribute.
   * @param entities Set of Entity identifiers for export
   * @param format The format to generate (json, csv, or xlsx)
   * @param includeAttributes Whether to include attribute columns in spreadsheet output
   * @param includeHistory Whether to include the history field in JSON output
   * @return {Promise<string>}
   */
  static exportMany = async (
    entities: string[],
    format: string,
    includeAttributes = true,
    includeHistory = false,
  ): Promise<string> => {
    if (format === "json") {
      const collection = [];
      for await (const entityId of entities) {
        const result = await Entities.getOne(entityId);
        if (result) {
          if (!includeHistory) {
            delete (result as never)["history"];
          }
          collection.push(result);
        }
      }

      return JSON.stringify(collection, null, "  ");
    }

    // CSV or XLSX: build union of attribute columns across all fetched entities
    const fetched: EntityModel[] = [];
    for await (const entityId of entities) {
      const entity = await Entities.getOne(entityId);
      if (entity) {
        fetched.push(entity);
      }
    }

    // Collect the ordered union of attributes seen across all entities
    const allAttributes: AttributeModel[] = [];
    if (includeAttributes) {
      for (const entity of fetched) {
        for (const attribute of entity.attributes) {
          if (!allAttributes.some((a) => a._id === attribute._id)) {
            allAttributes.push(attribute);
          }
        }
      }
    }

    // Build header row
    const headers = ["ID", "Name", "Created", "Owner", "Description"];
    for (const attribute of allAttributes) {
      for (const value of attribute.values) {
        headers.push(`${value.name} (${attribute.name})`);
      }
    }

    // Build one data row per entity
    const rows: string[][] = [];
    for (const entity of fetched) {
      const row = [
        entity._id,
        entity.name,
        dayjs(entity.created).format("DD MMM YYYY").toString(),
        entity.owner,
        entity.description || "",
      ];

      for (const attribute of allAttributes) {
        const entityAttr = entity.attributes.find((a) => a._id === attribute._id);
        for (const value of attribute.values) {
          if (entityAttr) {
            const entityValue = entityAttr.values.find((v) => v._id === value._id);
            row.push(entityValue ? Entities.serialiseValue(entityValue) : "");
          } else {
            row.push("");
          }
        }
      }

      rows.push(row);
    }

    if (format === "xlsx") {
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Export");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
      return buffer.toString("base64");
    }

    return Papa.unparse([headers, ...rows]);
  };

  static addAttachment = async (_id: string, attachment: IGenericItem): Promise<IResponseMessage> => {
    const entity = await Entities.getOne(_id);
    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    const attachments = _.cloneDeep(entity.attachments);
    if (!_.includes(attachments, attachment)) {
      attachments.push(attachment);
    }
    const update = {
      $set: {
        attachments: attachments,
      },
    };
    const response = await getDatabase().collection<EntityModel>(ENTITIES_COLLECTION).updateOne({ _id: _id }, update);

    return {
      success: response.modifiedCount > 0,
      message: response.modifiedCount > 0 ? "Added attachment successfully" : "Error adding attachment",
    };
  };

  // Remaining functions:
  // * removeAttachment (id, id)
}
