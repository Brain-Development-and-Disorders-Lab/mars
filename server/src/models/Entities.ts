import { AttributeModel, EntityModel, IEntity, IGenericItem, ResponseMessage } from "@types";
import _ from "lodash";
import { getDatabase } from "src/connectors/database";
import { getIdentifier } from "src/util";
import { Projects } from "./Projects";
import consola from "consola";
import dayjs from "dayjs";
import Papa from "papaparse";
import * as tmp from "tmp";
import * as fs from "fs";

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
  }

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
   * Create a new Entity
   * @param {IEntity} entity Entity information
   * @returns {ResponseMessage}
   */
  static create = async (entity: IEntity): Promise<ResponseMessage> => {
    // Allocate a new identifier and join with IEntity data
    const joinedEntity: EntityModel = {
      _id: getIdentifier("entity"), // Generate new identifier
      timestamp: new Date().toISOString(), // Add created timestamp
      ...entity // Unpack existing IEntity fields
    };

    // To-Do: Perform operations for origins, products, projects, and add Activity operation

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .insertOne(joinedEntity);
    const successStatus = _.isEqual(response.insertedId, joinedEntity._id);

    return {
      success: successStatus,
      message: successStatus ? "Created Entity successfully" : "Unable to create Entity",
    };
  };

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
      }
    };

    // Description
    if (updated.description) {
      update.$set.description = updated.description;
    }

    // Projects
    if (updated.projects) {
      const addProjects = _.difference(updated.projects, entity.projects);
      for (let project of addProjects) {
        await this.addProject(updated._id, project);
        await Projects.addEntity(project, updated._id);
      }
      const removeProjects = _.difference(entity.projects, updated.projects);
      for (let project of removeProjects) {
        await this.removeProject(updated._id, project);
        await Projects.removeEntity(project, updated._id);
      }
      update.$set.projects = updated.projects;
    }

    // Origins
    if (updated.associations && updated.associations.origins) {
      const addOrigins = _.difference(updated.associations.origins, entity.associations.origins);
      for (let origin of addOrigins) {
        await this.addOrigin(updated._id, origin);
        await this.addProduct(origin._id, { _id: updated._id, name: updated.name });
      }
      const removeOrigins = _.difference(entity.associations.origins, updated.associations.origins);
      for (let origin of removeOrigins) {
        await this.removeOrigin(updated._id, origin);
        await this.removeProduct(origin._id, { _id: updated._id, name: updated.name });
      }
      update.$set.associations.origins = updated.associations.origins;
    }

    // Products
    if (updated.associations && updated.associations.products) {
      const addProducts = _.difference(updated.associations.products, entity.associations.products);
      for (let product of addProducts) {
        await this.addProduct(updated._id, product);
        await this.addOrigin(product._id, { _id: updated._id, name: updated.name });
      }
      const removeProducts = _.difference(entity.associations.products, updated.associations.products);
      for (let product of removeProducts) {
        await this.removeProduct(updated._id, product);
        await this.removeOrigin(product._id, { _id: updated._id, name: updated.name });
      }
      update.$set.associations.products = updated.associations.products;
    }

    // Attributes
    if (updated.attributes) {
      const addAttributes = _.difference(updated.attributes, entity.attributes);
      for (let attribute of addAttributes) {
        await this.addAttribute(updated._id, attribute);
      }
      const removeAttributes = _.difference(entity.attributes, updated.attributes);
      for (let attribute of removeAttributes) {
        await this.removeAttribute(updated._id, attribute._id);
      }
      update.$set.attributes = updated.attributes;
    }

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: updated._id }, update);

    return {
      success: true,
      message: response.modifiedCount == 1 ? "Updated Entity": "No changes made to Entity",
    };
  };

  /**
   * Add a Project to an Entity
   * @param _id Target Entity identifier
   * @param project_id Project identifier to associate with Entity
   * @returns {Promise<ResponseMessage>}
   */
  static addProject = async (_id: string, project_id: string): Promise<ResponseMessage> => {
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
      message: successStatus ? "Added Project successfully" : "Unable to add Project",
    };
  };

  /**
   * Remove a Project from an Entity
   * @param _id Target Entity identifier
   * @param project_id Project identifier to remove from Entity
   * @returns {Promise<ResponseMessage>}
   */
  static removeProject = async (_id: string, project_id: string): Promise<ResponseMessage> => {
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
      message: successStatus ? "Removed Project successfully" : "Unable to remove Project",
    };
  };

  /**
   * Update the Entity description
   * @param {string} _id Entity identifier
   * @param {string} description Update Entity description
   * @returns {ResponseMessage}
   */
  static setDescription = async (_id: string, description: string): Promise<ResponseMessage> => {
    const update = {
      $set: {
        description: description,
      }
    };

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus ? "Set description successfully" : "Unable to set description",
    };
  };

  /**
   * Add a Product association to an Entity
   * @param _id Target Entity identifier
   * @param product Generic format for Product to associate with Entity
   * @returns {Promise<ResponseMessage>}
   */
  static addProduct = async (_id: string, product: IGenericItem): Promise<ResponseMessage> => {
    const entity = await this.getOne(_id);

    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    const productCollection = _.cloneDeep(entity.associations.products);
    if (productCollection.filter((p) => _.isEqual(p._id, product._id)).length > 0) {
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
      message: successStatus ? "Added Product successfully" : "Unable to add Product",
    };
  };

  /**
   * Add multiple Product associations to an Entity
   * @param _id Target Entity identifier
   * @param products Set of Products to associate with Entity
   * @returns {Promise<ResponseMessage>}
   */
  static addProducts = async (_id: string, products: IGenericItem[]): Promise<ResponseMessage> => {
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
      message: successStatus ? "Added Products successfully" : "Unable to add Products",
    };
  };

  /**
   * Remove a Product association from an Entity
   * @param _id Target Entity identifier
   * @param product Generic format for Product to associate with Entity
   * @returns {Promise<ResponseMessage>}
   */
  static removeProduct = async (_id: string, product: IGenericItem): Promise<ResponseMessage> => {
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
          products: productCollection.filter((p) => !_.isEqual(p._id, product._id)),
        },
      },
    };

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount == 1;

    return {
      success: successStatus,
      message: successStatus ? "Removed Product successfully" : "Unable to remove Product",
    };
  };

  /**
   * Add a Origin association to an Entity
   * @param _id Target Entity identifier
   * @param origin Generic format for Origin to associate with Entity
   * @returns {Promise<ResponseMessage>}
   */
  static addOrigin = async (_id: string, origin: IGenericItem): Promise<ResponseMessage> => {
    const entity = await this.getOne(_id);

    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    const originCollection = _.cloneDeep(entity.associations.origins);
    if (originCollection.filter((o) => _.isEqual(o._id, origin._id)).length > 0) {
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
      message: successStatus ? "Added Origin successfully" : "Unable to add Origin",
    };
  };

  /**
   * Add multiple Origin associations to an Entity
   * @param _id Target Entity identifier
   * @param origins Set of Origins to associate with Entity
   * @returns {Promise<ResponseMessage>}
   */
  static addOrigins = async (_id: string, origins: IGenericItem[]): Promise<ResponseMessage> => {
    const entity = await this.getOne(_id);

    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    // Create a union set from the existing set of Origins and the set of Origins to add
    const updatedOriginCollection = _.union(entity.associations.origins, origins);

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
      message: successStatus ? "Added Origins successfully" : "Unable to add Origins",
    };
  };

  /**
   * Remove an Origin association from an Entity
   * @param _id Target Entity identifier
   * @param origin Generic format for Origin to associate with Entity
   * @returns {Promise<ResponseMessage>}
   */
  static removeOrigin = async (_id: string, origin: IGenericItem): Promise<ResponseMessage> => {
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
          origins: originCollection.filter((o) => !_.isEqual(o._id, origin._id)),
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
      message: successStatus ? "Removed Origin successfully" : "Unable to remove Origin",
    };
  };

  /**
   * Add an Attibute to an Entity
   * @param _id Target Entity identifier
   * @param attribute Attribute data
   * @returns {Promise<ResponseMessage>}
   */
  static addAttribute = async (_id: string, attribute: AttributeModel): Promise<ResponseMessage> => {
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
      }
    };

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);
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
   * @returns {Promise<ResponseMessage>}
   */
  static removeAttribute = async (_id: string, attribute: string): Promise<ResponseMessage> => {
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
      }
    };

    const response = await getDatabase()
      .collection<EntityModel>(ENTITIES_COLLECTION)
      .updateOne({ _id: _id }, update);
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
   * @returns {Promise<ResponseMessage>}
   */
  static updateAttribute = async (_id: string, attribute: AttributeModel): Promise<ResponseMessage> => {
    const entity = await this.getOne(_id);

    if (_.isNull(entity)) {
      return {
        success: false,
        message: "Entity not found",
      };
    }

    if (!_.findIndex(entity.attributes, { _id: attribute._id })) {
      return {
        success: false,
        message: "Entity does not contain Attribute to update",
      };
    }

    // Create new collection of Attributes, subsituting the original Attribute with the updated Attribute
    const attributeCollection = _.map(_.cloneDeep(entity.attributes), (a) => _.isEqual(a._id, attribute._id) ? attribute : a);

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
      message: successStatus ? "Updated Attribute successfully" : "Unable to update Attribute",
    };
  };

  /**
   * Generate export data for the Entity
   * @param _id Entity identifier
   * @returns {Promise<string>}
   */
  static export = async (_id: string, format: "json" | "csv", fields?: string[]): Promise<string> => {
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
        for (let origin of entity.associations.origins) {
          exportFields.push(`origin_${origin._id}`);
        }
        for (let product of entity.associations.products) {
          exportFields.push(`product_${product._id}`);
        }
        for (let project of entity.projects) {
          exportFields.push(`project_${project}`);
        }
        for (let attribute of entity.attributes) {
          exportFields.push(`attribute_${attribute._id}`);
        }
      }

      // Iterate through the list of "fields" and create row representation
      for (let field of exportFields) {
        console.info("Generating information for field:", field);
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
          const origin = await Entities.getOne(field.slice(ORIGIN_PREFIX_LENGTH));
          if (!_.isNull(origin)) {
            headers.push(`Origin (${origin.name})`);
            row.push(origin.name);
          }
        } else if (_.startsWith(field, "product_")) {
          // "products" data field
          const product = await Entities.getOne(field.slice(PRODUCT_PREFIX_LENGTH));
          if (!_.isNull(product)) {
            headers.push(`Product (${product.name})`);
            row.push(product.name);
          }
        } else if (_.startsWith(field, "attribute_")) {
          // "attributes" data field
          const attributeId = field.slice(ATTRIBUTE_PREFIX_LENGTH);
          entity.attributes.map((attribute) => {
            if (_.isEqual(attribute._id, attributeId)) {
              for (let value of attribute.values) {
                headers.push(`${value?.name} (${attribute?.name})`);
                row.push(value.data);
              }
            }
          });
        }
      }

      // Collate and format data as a CSV string
      const collated = [headers, row];
      const formatted = Papa.unparse(collated);

      // Create a temporary file, passing the filename as a response
      tmp.file((error, path: string, _fd: number) => {
        if (error) {
          throw error;
        }

        fs.writeFileSync(path, formatted);
        consola.success(
          "Generated CSV data for  Entity (id):",
          entity._id
        );

        consola.info("File path:", path);
        consola.info("Formatted:", formatted);
      });
      return "csv";
    } else {
      return "Invalid format";
    }
  };

  // Remaining functions:
  // * addAttachment (id, id)
  // * removeAttachment (id, id)
};
