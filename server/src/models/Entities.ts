import { EntityModel, IEntity, IGenericItem, ResponseMessage } from "@types";
import _ from "lodash";
import { getDatabase } from "src/connectors/database";
import { getIdentifier } from "src/util";

const ENTITIES_COLLECTION = "entities"; // Collection name

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

    const projectCollection = entity.projects;
    if (_.includes(projectCollection, project_id)) {
      return {
        success: false,
        message: "Entity already associated with Project",
      };
    }
    projectCollection.push(project_id);

    // To-Do: Need to invoke corresponding function for Project, adding Entity to Project

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

    const projectCollection = entity.projects;
    if (!_.includes(projectCollection, project_id)) {
      return {
        success: false,
        message: "Entity not associated with Project",
      };
    }
    _.remove(projectCollection, project_id);

    // To-Do: Need to invoke corresponding function for Project, removing Entity from Project

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

    const productCollection = entity.associations.products;
    if (_.includes(productCollection, product)) {
      return {
        success: false,
        message: "Entity already associated with Product",
      };
    }
    productCollection.push(product);

    // To-Do: Need to invoke corresponding function for Entity, adding Entity as Product Origin

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
    const updatedProductCollection = _.union(entity.associations.products, products);

    // To-Do: Need to invoke corresponding function for each Product Entity, adding this Entity as Product Origin

    const update = {
      $set: {
        associations: {
          origins: entity.associations.origins,
          products: updatedProductCollection,
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

    const productCollection = entity.associations.products;
    if (_.includes(productCollection, product)) {
      return {
        success: false,
        message: "Entity already associated with Product",
      };
    }
    productCollection.push(product);

    // To-Do: Need to invoke corresponding function for Entity, adding Entity as Product Origin

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

    const originCollection = entity.associations.origins;
    if (_.includes(originCollection, origin)) {
      return {
        success: false,
        message: "Entity already associated with Origin",
      };
    }
    originCollection.push(origin);

    // To-Do: Need to invoke corresponding function for Entity, adding Entity as Origin Product

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

    // To-Do: Need to invoke corresponding function for each Origin Entity, adding this Entity as Origin Product

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

    const originCollection = entity.associations.origins;
    if (_.includes(originCollection, origin)) {
      return {
        success: false,
        message: "Entity already associated with Origin",
      };
    }
    originCollection.push(origin);

    // To-Do: Need to invoke corresponding function for Entity, adding Entity as Origin Product

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
      message: successStatus ? "Removed Origin successfully" : "Unable to remove Origin",
    };
  };

  // Existing functions:
  // * addAttribute (id, id)
  // * removeAttribute (id, id)
  // * updateAttribute (id, Attribute)
  // * addAttachment (id, id)
  // * removeAttachment (id, id)
  // * update (Entity)
};
