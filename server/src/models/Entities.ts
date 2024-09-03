// Custom types
import {
  AttributeModel,
  EntityModel,
  IEntity,
  IGenericItem,
  ResponseMessage,
} from "@types";

// Models
import { Projects } from "./Projects";

// Custom functions
import { getDatabase } from "../connectors/database";
import { getIdentifier } from "../util";

// External libraries
import _ from "lodash";
import dayjs from "dayjs";
import Papa from "papaparse";

const ENTITIES_COLLECTION = "entities"; // Collection name

// Constants for parsing strings
const ORIGIN_PREFIX_LENGTH = 7;
const PRODUCT_PREFIX_LENGTH = 8;
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
      .toArray();
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
      .findOne({ name: name, deleted: false });

    return !_.isNull(entity);
  };

  static getByName = async (name: string): Promise<EntityModel | null> => {
    return await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .findOne({ name: name, deleted: false });
  };

  /**
   * Create a new Entity
   * @param {IEntity} entity Entity information
   * @returns {ResponseMessage}
   */
  static create = async (entity: IEntity): Promise<ResponseMessage> => {
    // Allocate a new identifier and join with IEntity data
    const joinedEntity: EntityModel = {
      _id: getIdentifier("entity"), // Generate new identifier
      timestamp: new Date().toISOString(), // Add created timestamp
      ...entity, // Unpack existing IEntity fields
    };

    for (const origin of entity.associations.origins) {
      // Add new Entity as a Product
      await Entities.addProduct(origin._id, {
        _id: joinedEntity._id,
        name: joinedEntity.name,
      });
    }

    for (const product of entity.associations.products) {
      // Add new Entity as an Origin
      await Entities.addOrigin(product._id, {
        _id: joinedEntity._id,
        name: joinedEntity.name,
      });
    }

    for (const project of entity.projects) {
      // Add Entity to Project
      await Projects.addEntity(project, joinedEntity._id);
    }

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .insertOne(joinedEntity);
    const successStatus = _.isEqual(response.insertedId, joinedEntity._id);

    return {
      success: successStatus,
      message: successStatus
        ? response.insertedId.toString()
        : "Unable to create Entity",
    };
  };

  /**
   * Apply updates to an existing Entity
   * @param updated Updated Entity information
   * @return {Promise<ResponseMessage>}
   */
  static update = async (updated: EntityModel): Promise<ResponseMessage> => {
    const entity = await this.getOne(updated._id);

    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    const update: { $set: IEntity } = {
      $set: {
        ...entity,
      },
    };

    // Description
    if (!_.isUndefined(updated.description)) {
      update.$set.description = updated.description;
    }

    // Projects
    if (!_.isUndefined(updated.projects)) {
      const addProjects = _.difference(updated.projects, entity.projects);
      for (const project of addProjects) {
        await this.addProject(updated._id, project);
        await Projects.addEntity(project, updated._id);
      }
      const removeProjects = _.difference(entity.projects, updated.projects);
      for (const project of removeProjects) {
        await this.removeProject(updated._id, project);
        await Projects.removeEntity(project, updated._id);
      }
      update.$set.projects = updated.projects;
    }

    // Origins
    if (
      !_.isUndefined(updated.associations) &&
      !_.isUndefined(updated.associations.origins)
    ) {
      const addOrigins = _.difference(
        updated.associations.origins,
        entity.associations.origins,
      );
      for (const origin of addOrigins) {
        await this.addOrigin(updated._id, origin);
        await this.addProduct(origin._id, {
          _id: updated._id,
          name: updated.name,
        });
      }
      const removeOrigins = _.difference(
        entity.associations.origins,
        updated.associations.origins,
      );
      for (const origin of removeOrigins) {
        await this.removeOrigin(updated._id, origin);
        await this.removeProduct(origin._id, {
          _id: updated._id,
          name: updated.name,
        });
      }
      update.$set.associations.origins = updated.associations.origins;
    }

    // Products
    if (
      !_.isUndefined(updated.associations) &&
      !_.isUndefined(updated.associations.products)
    ) {
      const addProducts = _.difference(
        updated.associations.products,
        entity.associations.products,
      );
      for (const product of addProducts) {
        await this.addProduct(updated._id, product);
        await this.addOrigin(product._id, {
          _id: updated._id,
          name: updated.name,
        });
      }
      const removeProducts = _.difference(
        entity.associations.products,
        updated.associations.products,
      );
      for (const product of removeProducts) {
        await this.removeProduct(updated._id, product);
        await this.removeOrigin(product._id, {
          _id: updated._id,
          name: updated.name,
        });
      }
      update.$set.associations.products = updated.associations.products;
    }

    // Attributes
    if (!_.isUndefined(updated.attributes)) {
      const addAttributes = _.difference(updated.attributes, entity.attributes);
      for (const attribute of addAttributes) {
        await this.addAttribute(updated._id, attribute);
      }
      const removeAttributes = _.difference(
        entity.attributes,
        updated.attributes,
      );
      for (const attribute of removeAttributes) {
        await this.removeAttribute(updated._id, attribute._id);
      }
      update.$set.attributes = updated.attributes;
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
   * Delete an Entity
   * @param _id Entity identifier to delete
   * @return {ResponseMessage}
   */
  static delete = async (_id: string): Promise<ResponseMessage> => {
    const entity = await Entities.getOne(_id);
    if (entity) {
      // Remove Origins
      for (const origin of entity.associations.origins) {
        await Entities.removeProduct(origin._id, {
          _id: entity._id,
          name: entity.name,
        });
      }

      // Remove Products
      for (const product of entity.associations.products) {
        await Entities.removeOrigin(product._id, {
          _id: entity._id,
          name: entity.name,
        });
      }

      // Remove Projects
      for (const project of entity.projects) {
        await Projects.removeEntity(project, entity._id);
      }
    }

    // Execute delete operation
    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .deleteOne({ _id: _id });

    return {
      success: response.deletedCount > 0,
      message:
        response.deletedCount > 0
          ? "Deleted Entity successfully"
          : "Unable to delete Entity",
    };
  };

  /**
   * Add a Project to an Entity
   * @param _id Target Entity identifier
   * @param project_id Project identifier to associate with Entity
   * @returns {Promise<ResponseMessage>}
   */
  static addProject = async (
    _id: string,
    project_id: string,
  ): Promise<ResponseMessage> => {
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
   * @returns {Promise<ResponseMessage>}
   */
  static removeProject = async (
    _id: string,
    project_id: string,
  ): Promise<ResponseMessage> => {
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
   * @returns {ResponseMessage}
   */
  static setDescription = async (
    _id: string,
    description: string,
  ): Promise<ResponseMessage> => {
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
   * Add a Product association to an Entity
   * @param _id Target Entity identifier
   * @param product Generic format for Product to associate with Entity
   * @returns {Promise<ResponseMessage>}
   */
  static addProduct = async (
    _id: string,
    product: IGenericItem,
  ): Promise<ResponseMessage> => {
    const entity = await this.getOne(_id);

    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    const productCollection = _.cloneDeep(entity.associations.products);
    if (
      productCollection.filter((p) => _.isEqual(p._id, product._id)).length > 0
    ) {
      return {
        success: false,
        message: "Entity already associated with Product",
      };
    }
    productCollection.push(product);

    const update = {
      $set: {
        associations: {
          origins: entity.associations.origins,
          products: productCollection,
        },
      },
    };

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Added Product successfully"
        : "Unable to add Product",
    };
  };

  /**
   * Add multiple Product associations to an Entity
   * @param _id Target Entity identifier
   * @param products Set of Products to associate with Entity
   * @returns {Promise<ResponseMessage>}
   */
  static addProducts = async (
    _id: string,
    products: IGenericItem[],
  ): Promise<ResponseMessage> => {
    const entity = await this.getOne(_id);

    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    // Create a union set from the existing set of products and the set of products to add
    const update = {
      $set: {
        associations: {
          origins: entity.associations.origins,
          products: _.union(entity.associations.products, products),
        },
      },
    };

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Added Products successfully"
        : "Unable to add Products",
    };
  };

  /**
   * Remove a Product association from an Entity
   * @param _id Target Entity identifier
   * @param product Generic format for Product to associate with Entity
   * @returns {Promise<ResponseMessage>}
   */
  static removeProduct = async (
    _id: string,
    product: IGenericItem,
  ): Promise<ResponseMessage> => {
    const entity = await this.getOne(_id);

    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    const productCollection = _.cloneDeep(entity.associations.products);
    const update = {
      $set: {
        associations: {
          origins: entity.associations.origins,
          products: productCollection.filter(
            (p) => !_.isEqual(p._id, product._id),
          ),
        },
      },
    };

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Removed Product successfully"
        : "Unable to remove Product",
    };
  };

  /**
   * Add a Origin association to an Entity
   * @param _id Target Entity identifier
   * @param origin Generic format for Origin to associate with Entity
   * @returns {Promise<ResponseMessage>}
   */
  static addOrigin = async (
    _id: string,
    origin: IGenericItem,
  ): Promise<ResponseMessage> => {
    const entity = await this.getOne(_id);

    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    const originCollection = _.cloneDeep(entity.associations.origins);
    if (
      originCollection.filter((o) => _.isEqual(o._id, origin._id)).length > 0
    ) {
      return {
        success: false,
        message: "Entity already associated with Origin",
      };
    }
    originCollection.push(origin);

    const update = {
      $set: {
        associations: {
          origins: originCollection,
          products: entity.associations.products,
        },
      },
    };

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Added Origin successfully"
        : "Unable to add Origin",
    };
  };

  /**
   * Add multiple Origin associations to an Entity
   * @param _id Target Entity identifier
   * @param origins Set of Origins to associate with Entity
   * @returns {Promise<ResponseMessage>}
   */
  static addOrigins = async (
    _id: string,
    origins: IGenericItem[],
  ): Promise<ResponseMessage> => {
    const entity = await this.getOne(_id);

    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    // Create a union set from the existing set of Origins and the set of Origins to add
    const updatedOriginCollection = _.union(
      entity.associations.origins,
      origins,
    );

    const update = {
      $set: {
        associations: {
          origins: updatedOriginCollection,
          products: entity.associations.products,
        },
      },
    };

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Added Origins successfully"
        : "Unable to add Origins",
    };
  };

  /**
   * Remove an Origin association from an Entity
   * @param _id Target Entity identifier
   * @param origin Generic format for Origin to associate with Entity
   * @returns {Promise<ResponseMessage>}
   */
  static removeOrigin = async (
    _id: string,
    origin: IGenericItem,
  ): Promise<ResponseMessage> => {
    const entity = await this.getOne(_id);

    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    const originCollection = _.cloneDeep(entity.associations.origins);
    const update = {
      $set: {
        associations: {
          origins: originCollection.filter(
            (o) => !_.isEqual(o._id, origin._id),
          ),
          products: entity.associations.products,
        },
      },
    };

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus
        ? "Removed Origin successfully"
        : "Unable to remove Origin",
    };
  };

  /**
   * Add an Attibute to an Entity
   * @param _id Target Entity identifier
   * @param attribute Attribute data
   * @returns {Promise<ResponseMessage>}
   */
  static addAttribute = async (
    _id: string,
    attribute: AttributeModel,
  ): Promise<ResponseMessage> => {
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
   * @returns {Promise<ResponseMessage>}
   */
  static removeAttribute = async (
    _id: string,
    attribute: string,
  ): Promise<ResponseMessage> => {
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
   * @returns {Promise<ResponseMessage>}
   */
  static updateAttribute = async (
    _id: string,
    attribute: AttributeModel,
  ): Promise<ResponseMessage> => {
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
    const entity = await this.getOne(_id);

    if (_.isNull(entity)) {
      return "";
    }

    // Remove `history` field
    delete (entity as any)["history"];

    if (_.isEqual(format, "json")) {
      // Handle JSON format
      return JSON.stringify(entity);
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
        for (const origin of entity.associations.origins) {
          exportFields.push(`origin_${origin._id}`);
        }
        for (const product of entity.associations.products) {
          exportFields.push(`product_${product._id}`);
        }
        for (const project of entity.projects) {
          exportFields.push(`project_${project}`);
        }
        for (const attribute of entity.attributes) {
          exportFields.push(`attribute_${attribute._id}`);
        }
      }

      // Iterate through the list of "fields" and create row representation
      for (const field of exportFields) {
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
        } else if (_.startsWith(field, "origin_")) {
          // "origins" data field
          const origin = await Entities.getOne(
            field.slice(ORIGIN_PREFIX_LENGTH),
          );
          if (!_.isNull(origin)) {
            headers.push(`Origin (${origin.name})`);
            row.push(origin.name);
          }
        } else if (_.startsWith(field, "product_")) {
          // "products" data field
          const product = await Entities.getOne(
            field.slice(PRODUCT_PREFIX_LENGTH),
          );
          if (!_.isNull(product)) {
            headers.push(`Product (${product.name})`);
            row.push(product.name);
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
                  row.push(JSON.parse(value.data).name);
                } else if (value.type === "select") {
                  row.push(JSON.parse(value.data).selected);
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
   * Generate a JSON representation of multiple Entities for export
   * @param entities Set of Entity identifiers for export
   * @return {Promise<string>}
   */
  static exportMany = async (entities: string[]): Promise<string> => {
    const collection = [];
    for (const entity of entities) {
      const result = await Entities.getOne(entity);
      if (result) {
        collection.push(result);
      }
    }

    return JSON.stringify(collection, null, "  ");
  };

  static addAttachment = async (
    _id: string,
    attachment: IGenericItem,
  ): Promise<ResponseMessage> => {
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

  static setLock = async (
    _id: string,
    locked: boolean,
  ): Promise<ResponseMessage> => {
    const update = {
      $set: {
        locked: locked,
      },
    };

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);

    return {
      success: response.modifiedCount > 0,
      message:
        response.modifiedCount > 0
          ? "Set lock status successfully"
          : "Error setting lock status",
    };
  };

  // Remaining functions:
  // * removeAttachment (id, id)
}
