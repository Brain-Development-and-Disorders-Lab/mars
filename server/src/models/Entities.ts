// Custom types
import {
  AttributeModel,
  EntityHistory,
  EntityModel,
  IEntity,
  IGenericItem,
  IRelationship,
  IResponseMessage,
  RelationshipType,
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
import consola from "consola";

const ENTITIES_COLLECTION = "entities"; // Collection name

// Constants for parsing strings
const ATTRIBUTE_PREFIX_LENGTH = 10;

export class Entities {
  /**
   * Get all Entity entries from the Entities collection
   * @returns Collection of all Entity entries
   */
  static all = async (): Promise<EntityModel[]> => {
    return await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .find()
      .sort({ timestamp: 1 })
      .toArray();
  };

  /**
   * Get an Entity by identifier
   * @param _id Entity identifier
   * @returns `null` if the Entity does not exist
   */
  static getOne = async (_id: string): Promise<EntityModel | null> => {
    return await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .findOne({ _id: _id });
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
      hasRelationships?: boolean;
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
        dateFilter.$gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        const endDate = new Date(filter.endDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = endDate;
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

    // Add has relationships filter
    if (filter?.hasRelationships === true) {
      queryFilter["relationships.0"] = { $exists: true };
    }

    let query = getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .find(queryFilter);

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
    const needsAttributeFilter =
      filter?.attributeCountRanges && filter.attributeCountRanges.length > 0;

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
          if (range === "1-5")
            return attributeCount >= 1 && attributeCount <= 5;
          if (range === "6-10")
            return attributeCount >= 6 && attributeCount <= 10;
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
        const aLength =
          sort.field === "attributes"
            ? a.attributes.length
            : a.attachments.length;
        const bLength =
          sort.field === "attributes"
            ? b.attributes.length
            : b.attachments.length;
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
      hasRelationships?: boolean;
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
        dateFilter.$gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        const endDate = new Date(filter.endDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = endDate;
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

    // Add has relationships filter
    if (filter?.hasRelationships === true) {
      queryFilter["relationships.0"] = { $exists: true };
    }

    let count = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .countDocuments(queryFilter);

    // Apply attribute count range filter (client-side as it requires counting)
    if (
      filter?.attributeCountRanges &&
      filter.attributeCountRanges.length > 0
    ) {
      const allEntities = await getDatabase()
        .collection<EntityModel>(ENTITIES_COLLECTION)
        .find(queryFilter)
        .toArray();
      count = allEntities.filter((entity) => {
        const attributeCount = entity.attributes.length;
        return filter.attributeCountRanges!.some((range) => {
          if (range === "0") return attributeCount === 0;
          if (range === "1-5")
            return attributeCount >= 1 && attributeCount <= 5;
          if (range === "6-10")
            return attributeCount >= 6 && attributeCount <= 10;
          if (range === "11+") return attributeCount >= 11;
          return false;
        });
      }).length;
    }

    return count;
  };

  static exists = async (_id: string): Promise<boolean> => {
    const entity = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .findOne({ _id: _id });

    return !_.isNull(entity);
  };

  static existByName = async (name: string): Promise<boolean> => {
    const entity = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .findOne({ name: name, archived: false });

    return !_.isNull(entity);
  };

  static getByName = async (name: string): Promise<EntityModel | null> => {
    return await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .findOne({ name: name, archived: false });
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

    // Iterate over all Attributes, casting `number` values to floats
    entity.attributes.forEach((attribute) => {
      attribute.values.forEach((value) => {
        if (value.type === "number") {
          value.data = parseFloat(value.data);
        }
      });
    });

    // Allocate a new identifier and join with IEntity data
    const joinedEntity: EntityModel = {
      _id: getIdentifier("entity"), // Generate new identifier
      timestamp: dayjs(Date.now()).toISOString(), // Add created timestamp
      ...entity, // Unpack existing IEntity fields
      history: [],
    };

    // Create reciprocal relationships between Entities
    for await (const relationship of joinedEntity.relationships) {
      // Update the `source` component to include Entity information
      relationship.source = {
        _id: joinedEntity._id,
        name: joinedEntity.name,
      };

      await Entities.addRelationship(relationship);
    }

    for await (const project of entity.projects) {
      // Add Entity to Project
      await Projects.addEntity(project, joinedEntity._id);
    }

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .insertOne(joinedEntity);
    const successStatus = _.isEqual(response.insertedId, joinedEntity._id);

    // Apply updated statistics
    if (successStatus) {
      // Entity counter removed - was Prometheus-specific
    }

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
        owner: entity.owner,
        created: entity.created,
        archived: entity.archived,
        description: entity.description,
        projects: entity.projects,
        relationships: entity.relationships,
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

    // Relationships
    if (!_.isUndefined(updated.relationships)) {
      update.$set.relationships = updated.relationships;

      // Create the collection of relationships added in the updated Entity
      const addRelationships = updated.relationships.filter((r) => {
        // Filter by relationships not in the original Entity
        return !Entities.relationshipExists(r, entity.relationships);
      });
      for await (const relationship of addRelationships) {
        await Entities.addRelationship(relationship);
      }

      // Create the collection of relationships to be removed from the Entity
      const removeRelationships = entity.relationships.filter((r) => {
        return !Entities.relationshipExists(r, updated.relationships);
      });
      for await (const relationship of removeRelationships) {
        await Entities.removeRelationship(relationship);
      }
    }

    // Attributes
    if (!_.isUndefined(updated.attributes)) {
      update.$set.attributes = updated.attributes;
      const updatedAttributes = updated.attributes.map((a) => a._id);
      const entityAttributes = entity.attributes.map((a) => a._id);

      // Iterate over all Attributes, casting `number` values to floats
      update.$set.attributes.forEach((attribute) => {
        attribute.values.forEach((value) => {
          if (value.type === "number") {
            value.data = parseFloat(value.data);
          }
        });
      });

      // Attributes added in updated Entity
      const addAttributeIdentifiers = _.difference(
        updatedAttributes,
        entityAttributes,
      );
      const addAttributes = updated.attributes.filter((a) =>
        _.includes(addAttributeIdentifiers, a._id),
      );
      for await (const attribute of addAttributes) {
        await this.addAttribute(updated._id, attribute);
      }

      // Attributes removed in updated Entity
      const removeAttributeIdentifiers = _.difference(
        entityAttributes,
        updatedAttributes,
      );
      const removeAttributes = entity.attributes.filter((a) =>
        _.includes(removeAttributeIdentifiers, a._id),
      );
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
      message:
        response.modifiedCount == 1
          ? "Updated Entity"
          : "No changes made to Entity",
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
      owner: historyEntity.owner,
      archived: historyEntity.archived,
      created: historyEntity.created,
      description: historyEntity.description,
      projects: historyEntity.projects,
      relationships: historyEntity.relationships,
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
      consola.info("Added history to Entity:", historyEntity._id);
    }

    return {
      success: true,
      message:
        response.modifiedCount === 1
          ? "Added history to Entity"
          : "No history added to Entity",
    };
  };

  /**
   * Set the archive state of an Entity
   * @param _id Entity identifier to archive
   * @param state Entity archive state
   * @return {Promise<IResponseMessage>}
   */
  static setArchived = async (
    _id: string,
    state: boolean,
  ): Promise<IResponseMessage> => {
    consola.debug("Setting archive state of Entity:", _id, "Archived:", state);
    const entity = await Entities.getOne(_id);
    if (_.isNull(entity)) {
      consola.error("Unable to retrieve Entity:", _id);
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

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);
    if (response.modifiedCount > 0) {
      consola.info("Set archive state of Entity:", _id, "Archived:", state);
    }

    return {
      success: true,
      message:
        response.modifiedCount === 1
          ? "Set archive state of Entity"
          : "No changes made to Entity",
    };
  };

  /**
   * Add a Project to an Entity
   * @param _id Target Entity identifier
   * @param project_id Project identifier to associate with Entity
   * @returns {Promise<IResponseMessage>}
   */
  static addProject = async (
    _id: string,
    project_id: string,
  ): Promise<IResponseMessage> => {
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

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Added Project successfully"
        : "Unable to add Project",
    };
  };

  /**
   * Remove a Project from an Entity
   * @param _id Target Entity identifier
   * @param project_id Project identifier to remove from Entity
   * @returns {Promise<IResponseMessage>}
   */
  static removeProject = async (
    _id: string,
    project_id: string,
  ): Promise<IResponseMessage> => {
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

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Removed Project successfully"
        : "Unable to remove Project",
    };
  };

  /**
   * Update the Entity description
   * @param {string} _id Entity identifier
   * @param {string} description Update Entity description
   * @returns {IResponseMessage}
   */
  static setDescription = async (
    _id: string,
    description: string,
  ): Promise<IResponseMessage> => {
    const update = {
      $set: {
        description: description,
      },
    };

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Set description successfully"
        : "Unable to set description",
    };
  };

  /**
   * Compare two `IRelationship` structures and determine if they are describing
   * the same relationship or not
   * @param a Relationship
   * @param b Relationship
   * @return {boolean}
   */
  private static relationshipIsEqual = (
    a: IRelationship,
    b: IRelationship,
  ): boolean => {
    return (
      _.isEqual(a.source._id, b.source._id) &&
      _.isEqual(a.target._id, b.target._id) &&
      _.isEqual(a.type, b.type)
    );
  };

  /**
   * Search a collection of existing `IRelationship` structures to find if another
   * `IRelationship` already exists in the collection or not
   * @param relationship Relationship structure to search for
   * @param relationships Collection of existing Relationships
   * @return {boolean}
   */
  private static relationshipExists = (
    relationship: IRelationship,
    relationships: IRelationship[],
  ): boolean => {
    for (const r of relationships) {
      if (Entities.relationshipIsEqual(r, relationship)) {
        return true;
      }
    }
    return false;
  };

  /**
   * Add a new relationship to a target Entity
   * @param relationship Relationship data containing the source Entity, target Entity, and relationship type
   * @return {Promise<IResponseMessage>}
   */
  static addRelationship = async (
    relationship: IRelationship,
  ): Promise<IResponseMessage> => {
    // Create a clone of the `IRelationship` instance for the target Entity
    const targetRelationship = _.cloneDeep(relationship);
    const targetEntity = await Entities.getOne(targetRelationship.target._id);

    if (_.isNull(targetEntity)) {
      return {
        success: false,
        message: "Target Entity not found",
      };
    }

    // Switch the source and target
    const source = _.cloneDeep(relationship.source);
    const target = _.cloneDeep(relationship.target);
    targetRelationship.source = target;
    targetRelationship.target = source;

    // Amend the relationship depending on the relationship type
    if (relationship.type === "child") {
      // Flip to "parent" type if "child" being added
      targetRelationship.type = "parent";
    } else if (relationship.type === "parent") {
      // Flip to "child" type if "parent" being added
      targetRelationship.type = "child";
    }

    // Confirm that the relationship does not exist on the target Entity
    if (
      Entities.relationshipExists(
        targetRelationship,
        targetEntity.relationships,
      )
    ) {
      return {
        success: false,
        message: "Relationship between Entities already exists",
      };
    }

    // Add the new `IRelationship` to the target Entity
    const relationships: IRelationship[] = _.cloneDeep(
      targetEntity.relationships,
    );
    relationships.push(targetRelationship);

    const update: { $set: Partial<EntityModel> } = {
      $set: {
        relationships: relationships,
      },
    };

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: targetRelationship.source._id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Added relationship successfully"
        : "Unable to add relationship",
    };
  };

  /**
   * Remove a relationship from a target Entity
   * @param relationship Relationship data containing the source Entity, target Entity, and relationship type
   * @return {Promise<IResponseMessage>}
   */
  static removeRelationship = async (
    relationship: IRelationship,
  ): Promise<IResponseMessage> => {
    // Create a clone of the `IRelationship` instance for the target Entity
    const targetRelationship = _.cloneDeep(relationship);
    const targetEntity = await Entities.getOne(targetRelationship.target._id);

    if (_.isNull(targetEntity)) {
      return {
        success: false,
        message: "Target Entity not found",
      };
    }

    // Switch the source and target
    const source = _.cloneDeep(relationship.source);
    const target = _.cloneDeep(relationship.target);
    targetRelationship.source = target;
    targetRelationship.target = source;

    // Amend the relationship depending on the relationship type
    if (relationship.type === "child") {
      // Flip to "parent" type if "child" being added
      targetRelationship.type = "parent";
    } else if (relationship.type === "parent") {
      // Flip to "child" type if "parent" being added
      targetRelationship.type = "child";
    }

    // Confirm that the relationship to remove currently exists on the target Entity
    if (
      !Entities.relationshipExists(
        targetRelationship,
        targetEntity.relationships,
      )
    ) {
      return {
        success: false,
        message: "Relationship between Entities does not exist",
      };
    }

    // Remove the existing `IRelationship`
    const relationships: IRelationship[] = _.cloneDeep(
      targetEntity.relationships,
    ).filter((r) => {
      return !Entities.relationshipIsEqual(r, targetRelationship);
    });

    const update: { $set: Partial<EntityModel> } = {
      $set: {
        relationships: relationships,
      },
    };

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: targetRelationship.source._id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Removed relationship successfully"
        : "Unable to remove relationship",
    };
  };

  /**
   * Add an Attibute to an Entity
   * @param _id Target Entity identifier
   * @param attribute Attribute data
   * @returns {Promise<IResponseMessage>}
   */
  static addAttribute = async (
    _id: string,
    attribute: AttributeModel,
  ): Promise<IResponseMessage> => {
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

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Added Attribute successfully"
        : "Unable to add Attribute",
    };
  };

  /**
   * Remove an Attribute from an Entity by the Attribute identifier
   * @param _id Target Entity identifier
   * @param attribute Attribute identifier to remove
   * @returns {Promise<IResponseMessage>}
   */
  static removeAttribute = async (
    _id: string,
    attribute: string,
  ): Promise<IResponseMessage> => {
    const entity = await this.getOne(_id);

    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    // Exclude the Attribute identifier
    const attributeCollection = _.cloneDeep(entity.attributes).filter(
      (a) => a._id != attribute,
    );
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

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Removed Attribute successfully"
        : "Unable to remove Attribute",
    };
  };

  /**
   * Update an Attribute associated with an Entity
   * @param _id Target Entity identifier
   * @param attribute Updated Attribute
   * @returns {Promise<IResponseMessage>}
   */
  static updateAttribute = async (
    _id: string,
    attribute: AttributeModel,
  ): Promise<IResponseMessage> => {
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

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Updated Attribute successfully"
        : "Unable to update Attribute",
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
    format: "json" | "csv",
    fields?: string[],
  ): Promise<string> => {
    const entity = await Entities.getOne(_id);

    if (_.isNull(entity)) {
      return "";
    }

    // Remove `history` field
    delete (entity as never)["history"];

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
            formatted["created"] = dayjs(entity.created)
              .format("DD MMM YYYY")
              .toString();
          } else if (_.isEqual(field, "description")) {
            // "description" data field
            formatted["description"] = entity.description;
          } else if (_.startsWith(field, "relationship_")) {
            // "relationship" data field
            // Create an empty relationships structure
            if (_.isUndefined(formatted.relationships)) {
              formatted.relationships = [];
            }

            const target = await Entities.getOne(field.split("_")[1]);
            if (!_.isNull(target)) {
              // Get the relationship details and add to the collection of exported relationships
              const relationship = entity.relationships.find((relationship) => {
                return Entities.relationshipIsEqual(relationship, {
                  source: {
                    _id: entity._id,
                    name: entity.name,
                  },
                  target: {
                    _id: target._id,
                    name: target.name,
                  },
                  type: field.split("_")[2] as RelationshipType,
                });
              });
              if (relationship) {
                formatted.relationships.push(relationship);
              }
            }
          } else if (_.startsWith(field, "attribute_")) {
            // "attributes" data field
            if (_.isUndefined(formatted.attributes)) {
              formatted["attributes"] = [];
            }

            // Get the Attribute details and add to the collection of exported Attributes
            const attribute = entity.attributes.find((attribute) => {
              return _.isEqual(
                attribute._id,
                field.slice(ATTRIBUTE_PREFIX_LENGTH),
              );
            });
            if (attribute) {
              formatted.attributes.push(attribute);
            }
          }
        }

        return JSON.stringify(formatted, null, "  ");
      }
    } else if (_.isEqual(format, "csv")) {
      let exportFields = fields;

      // Handle CSV format
      const headers: string[] = ["ID", "Name"]; // Headers for CSV file
      const row: string[] = [entity._id, entity.name]; // First row containing export data

      // Default behavior is to export all fields
      if (_.isUndefined(exportFields)) {
        // Add standard string fields
        exportFields = ["created", "owner", "description"];

        // Iterate and generate fields for Origins, Products, Projects, and Attributes
        for await (const relationship of entity.relationships) {
          exportFields.push(
            `relationship_${relationship.target._id}_${relationship.type}`,
          );
        }
        for await (const project of entity.projects) {
          exportFields.push(`project_${project}`);
        }
        for await (const attribute of entity.attributes) {
          exportFields.push(`attribute_${attribute._id}`);
        }
      }

      // Iterate through the list of "fields" and create row representation
      for await (const field of exportFields) {
        if (_.isEqual(field, "created")) {
          headers.push("Created");
          row.push(dayjs(entity.created).format("DD MMM YYYY").toString());
        } else if (_.isEqual(field, "owner")) {
          headers.push("Owner");
          row.push(entity.owner);
        } else if (_.isEqual(field, "description")) {
          // "description" data field
          headers.push("Description");
          row.push(entity.description);
        } else if (_.startsWith(field, "relationship_")) {
          // "relationship" data field
          const target = await Entities.getOne(field.split("_")[1]);
          if (!_.isNull(target)) {
            headers.push(`Relationship (${field.split("_")[2]})`);
            row.push(target.name);
          }
        } else if (_.startsWith(field, "attribute_")) {
          // "attributes" data field
          const attributeId = field.slice(ATTRIBUTE_PREFIX_LENGTH);
          entity.attributes.map((attribute) => {
            if (_.isEqual(attribute._id, attributeId)) {
              for (const value of attribute.values) {
                headers.push(`${value?.name} (${attribute?.name})`);

                // Some values are JSON data stored as strings
                if (value.type === "entity") {
                  row.push(value.data.name);
                } else if (value.type === "select") {
                  row.push(value.data.selected);
                } else {
                  row.push(value.data);
                }
              }
            }
          });
        }
      }

      // Collate and format data as a CSV string
      const collated = [headers, row];
      const formatted = Papa.unparse(collated);

      return formatted;
    } else {
      return "Invalid format";
    }
  };

  /**
   * Generate a string-based representation of multiple Entities for export
   * @param entities Set of Entity identifiers for export
   * @param format The format to generate (JSON or CSV)
   * @return {Promise<string>}
   */
  static exportMany = async (
    entities: string[],
    format: string,
  ): Promise<string> => {
    if (format === "json") {
      // Handle JSON format
      const collection = [];
      for await (const entity of entities) {
        const result = await Entities.getOne(entity);
        if (result) {
          // Remove `history` field
          delete (result as never)["history"];

          // Add to collection for export
          collection.push(result);
        }
      }

      return JSON.stringify(collection, null, "  ");
    } else {
      // Handle CSV format (default)
      const headers = ["ID", "Name", "Created", "Owner", "Description"];
      const rows: string[][] = [];

      for await (const entityId of entities) {
        const entity = await Entities.getOne(entityId);
        if (entity) {
          // Format the row data
          const row = [
            entity._id,
            entity.name,
            dayjs(entity.created).format("DD MMM YYYY").toString(),
            entity.owner,
            entity.description || "",
          ];
          rows.push(row);
        }
      }

      // Combine headers and rows, and format as CSV
      const collated = [headers, ...rows];
      const formatted = Papa.unparse(collated);

      return formatted;
    }
  };

  static addAttachment = async (
    _id: string,
    attachment: IGenericItem,
  ): Promise<IResponseMessage> => {
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
    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);

    return {
      success: response.modifiedCount > 0,
      message:
        response.modifiedCount > 0
          ? "Added attachment successfully"
          : "Error adding attachment",
    };
  };

  // Remaining functions:
  // * removeAttachment (id, id)
}
