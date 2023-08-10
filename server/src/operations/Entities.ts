// Utility libraries
import _, { reject } from "lodash";
import consola from "consola";

// Utility functions
import {
  getAttachments,
  getDatabase,
  getIdentifier,
} from "../database/connection";
import { Activity } from "./Activity";
import { Collections } from "./Collections";

// File generation
import fs from "fs";
import { Readable } from "stream";
import Papa from "papaparse";
import tmp from "tmp";
import dayjs from "dayjs";

// Custom types
import { AttributeModel, EntityModel } from "@types";

// Constants
const ENTITIES_COLLECTION = "entities";

/**
 * Class defining the set of operations to apply for Entities
 */
export class Entities {
  /**
   * Check if an Entity exists in the system
   * @param {string} id the Entity identifier
   * @return {boolean}
   */
  static exists = (id: string): Promise<boolean> => {
    consola.start("Checking if Entity (id):", id.toString(), "exists");
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: id }, (_error: any, result: any) => {
          if (_.isNull(result)) {
            consola.warn("Entity (id):", id.toString(), "does not exist");
            resolve(false);
          }

          consola.success("Entity (id):", id.toString(), "exists");
          resolve(true);
        });
    });
  };

  /**
   * Create a new Entity
   * @param {any} entity all data associated with the new Entity
   * @return {Promise<EntityModel>}
   */
  static create = (entity: any): Promise<EntityModel> => {
    consola.start("Creating new Entity:", entity.name);

    // Allocate a new identifier and join with Entity data
    entity["_id"] = getIdentifier("entity");

    // Push data to database
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .insertOne(entity, (error: any, _result: any) => {
          if (error) {
            throw error;
          }

          // Database operations to perform outside of creating a new Entity
          const operations: Promise<any>[] = [];

          if (entity.associations.origins.length > 0) {
            // If this Entity has an origin, add this Entity as a product of that origin Entity
            entity.associations.origins.forEach(
              (origin: { name: string; id: string }) => {
                operations.push(
                  Entities.addProduct(origin, {
                    name: entity.name,
                    id: entity._id,
                  })
                );
              }
            );
          }

          if (entity.associations.products.length > 0) {
            // If this Entity has products, set this Entity as the origin of each product Entity-
            entity.associations.products.forEach(
              (product: { name: string; id: string }) => {
                operations.push(
                  Entities.addOrigin(product, {
                    name: entity.name,
                    id: entity._id,
                  })
                );
              }
            );
          }

          if (entity.collections.length > 0) {
            // If this Entity has been added to Collections, add the Entity to each Collection
            entity.collections.forEach((collection: string) => {
              operations.push(Collections.addEntity(collection, entity._id));
            });
          }

          // Add Update operation
          operations.push(
            Activity.create({
              timestamp: new Date(Date.now()),
              type: "create",
              details: "Created new Entity",
              target: {
                type: "entities",
                id: entity._id,
                name: entity.name,
              },
            })
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations)
            .then((_result) => {
              consola.success("Created Entity:", entity._id, entity.name);
              resolve(entity);
            })
            .catch((_error) => {
              consola.error("Error creating Entity:", entity._id, entity.name);
              reject("Error creating Entity");
            });
        });
    });
  };

  /**
   * Update an Entity, comparing a new version with the existing version
   * @param {EntityModel} updatedEntity updated Entity
   * @return {Promise<EntityModel>}
   */
  static update = (updatedEntity: EntityModel): Promise<EntityModel> => {
    consola.start("Updating Entity:", updatedEntity.name);
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: updatedEntity._id }, (error: any, result: any) => {
          if (error) {
            throw error;
          }
          // Cast and store current state of the Entity
          const currentEntity = result as EntityModel;

          // List of operations to perform the update
          const operations = [];

          // Collections
          const collectionsToKeep = currentEntity.collections.filter(
            (collection) => updatedEntity.collections.includes(collection)
          );
          const collectionsToAdd = updatedEntity.collections.filter(
            (collection) => !collectionsToKeep.includes(collection)
          );
          if (collectionsToAdd.length > 0) {
            operations.push(
              collectionsToAdd.map((collection: string) => {
                Collections.addEntity(collection, updatedEntity._id);
              })
            );
          }
          const collectionsToRemove = currentEntity.collections.filter(
            (collection) => !collectionsToKeep.includes(collection)
          );
          if (collectionsToRemove.length > 0) {
            operations.push(
              collectionsToRemove.map((collection: string) => {
                Collections.removeEntity(collection, updatedEntity._id);
              })
            );
          }

          // Products
          const productsToKeep = currentEntity.associations.products
            .map((product) => product.id)
            .filter((product) =>
              updatedEntity.associations.products
                .map((product) => product.id)
                .includes(product)
            );
          const productsToAdd = updatedEntity.associations.products.filter(
            (product) => !productsToKeep.includes(product.id)
          );
          if (productsToAdd.length > 0) {
            operations.push(
              productsToAdd.map((product: { id: string; name: string }) => {
                Entities.addOrigin(product, {
                  name: updatedEntity.name,
                  id: updatedEntity._id,
                });
                Entities.addProduct(
                  { name: updatedEntity.name, id: updatedEntity._id },
                  product
                );
              })
            );
          }
          const productsToRemove = currentEntity.associations.products.filter(
            (product) => !productsToKeep.includes(product.id)
          );
          if (productsToRemove.length > 0) {
            operations.push(
              productsToRemove.map((product: { id: string; name: string }) => {
                Entities.removeOrigin(product, {
                  name: updatedEntity.name,
                  id: updatedEntity._id,
                });
                Entities.removeProduct(
                  { name: updatedEntity.name, id: updatedEntity._id },
                  product
                );
              })
            );
          }

          // Origins
          const originsToKeep = currentEntity.associations.origins
            .map((origin) => origin.id)
            .filter((origin) =>
              updatedEntity.associations.origins
                .map((origin) => origin.id)
                .includes(origin)
            );
          const originsToAdd = updatedEntity.associations.origins.filter(
            (origin) => !originsToKeep.includes(origin.id)
          );
          if (originsToAdd.length > 0) {
            operations.push(
              originsToAdd.map((origin: { id: string; name: string }) => {
                Entities.addOrigin(
                  { name: updatedEntity.name, id: updatedEntity._id },
                  origin
                );
                Entities.addProduct(origin, {
                  name: updatedEntity.name,
                  id: updatedEntity._id,
                });
              })
            );
          }
          const originsToRemove = currentEntity.associations.origins.filter(
            (origin) => !originsToKeep.includes(origin.id)
          );
          if (originsToRemove.length > 0) {
            operations.push(
              originsToRemove.map((origin: { id: string; name: string }) => {
                Entities.removeOrigin(
                  { name: updatedEntity.name, id: updatedEntity._id },
                  origin
                );
                Entities.removeProduct(origin, {
                  name: updatedEntity.name,
                  id: updatedEntity._id,
                });
              })
            );
          }

          // Attributes
          const attributesToKeep = currentEntity.attributes
            .map((attribute) => attribute._id)
            .filter((attribute) =>
              updatedEntity.attributes
                .map((attribute) => attribute._id)
                .includes(attribute)
            );
          operations.push(
            attributesToKeep.map((attribute: string) => {
              const updatedAttribute = updatedEntity.attributes.filter(
                (updatedAttribute) => _.isEqual(attribute, updatedAttribute._id)
              )[0];
              Entities.updateAttribute(updatedEntity._id, updatedAttribute);
            })
          );
          const attributesToAdd = updatedEntity.attributes.filter(
            (attribute) => !attributesToKeep.includes(attribute._id)
          );
          if (attributesToAdd.length > 0) {
            operations.push(
              attributesToAdd.map((attribute: AttributeModel) => {
                Entities.addAttribute(updatedEntity._id, attribute);
              })
            );
          }
          const attributesToRemove = currentEntity.attributes.filter(
            (attribute) => !attributesToKeep.includes(attribute._id)
          );
          if (attributesToRemove.length > 0) {
            operations.push(
              attributesToRemove.map((attribute) => {
                Entities.removeAttribute(updatedEntity._id, attribute._id);
              })
            );
          }

          // Attachments
          const attachmentsToKeep = currentEntity.attachments
            .map((attachment) => attachment.id)
            .filter((attachment) =>
              updatedEntity.attachments
                .map((attachment) => attachment.id)
                .includes(attachment)
            );
          const attachmentsToRemove = currentEntity.attachments.filter(
            (attachment) => !attachmentsToKeep.includes(attachment.id)
          );
          if (attachmentsToRemove.length > 0) {
            operations.push(
              attachmentsToRemove.map((attachment) => {
                Entities.removeAttachment(updatedEntity._id, attachment);
              })
            );
          }

          // Add Update operation
          operations.push(
            Activity.create({
              timestamp: new Date(Date.now()),
              type: "update",
              details: "Updated Entity",
              target: {
                type: "entities",
                id: currentEntity._id,
                name: currentEntity.name,
              },
            })
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations).then((_result) => {
            const updates = {
              $set: {
                deleted: updatedEntity.deleted,
                description: updatedEntity.description,
                collections: [...collectionsToKeep, ...collectionsToAdd],
                associations: {
                  origins: [
                    ...currentEntity.associations.origins.filter((origin) =>
                      originsToKeep.includes(origin.id)
                    ),
                    ...originsToAdd,
                  ],
                  products: [
                    ...currentEntity.associations.products.filter((product) =>
                      productsToKeep.includes(product.id)
                    ),
                    ...productsToAdd,
                  ],
                },
                history: [
                  {
                    timestamp: dayjs(Date.now()).toISOString(),
                    deleted: currentEntity.deleted,
                    owner: currentEntity.owner,
                    description: currentEntity.description,
                    collections: currentEntity.collections,
                    associations: {
                      origins: currentEntity.associations.origins,
                      products: currentEntity.associations.products,
                    },
                    attributes: currentEntity.attributes,
                  },
                  ...currentEntity.history,
                ],
              },
            };

            getDatabase()
              .collection(ENTITIES_COLLECTION)
              .updateOne(
                { _id: updatedEntity._id },
                updates,
                (error: any, _response: any) => {
                  if (error) {
                    throw error;
                  }

                  // Resolve the Promise
                  consola.success("Updated Entity:", updatedEntity.name);
                  resolve(updatedEntity);
                }
              );
          });
        });
    });
  };

  /**
   * Restore a version of an Entity
   * @param {EntityModel} entity the Entity data to restore
   * @return {Promise<EntityModel>}
   */
  static restore = (entity: EntityModel): Promise<EntityModel> => {
    consola.start("Restoring Entity:", entity.name);
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .insertOne(entity as any, (error: any, _result: any) => {
          if (error) {
            throw error;
          }

          // Database operations to perform outside of creating a new Entity
          const operations: Promise<any>[] = [];

          // Add Update operation
          operations.push(
            Activity.create({
              timestamp: new Date(Date.now()),
              type: "create",
              details: "Restored Entity",
              target: {
                type: "entities",
                id: entity._id,
                name: entity.name,
              },
            })
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations)
            .then((_result) => {
              consola.success("Restored Entity:", entity._id, entity.name);
              resolve(entity);
            })
            .catch((_error) => {
              consola.error("Error restoring Entity:", entity._id, entity.name);
              reject("Error restoring Entity");
            });
        });
    });
  };

  static addCollection = (
    entity: string,
    collection: string
  ): Promise<string> => {
    consola.start(
      "Adding Entity (id):",
      entity.toString(),
      "to Collection (id):",
      collection.toString()
    );
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: entity }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Update the collection of Collections associated with the Entity to include this extra Collection
          const updates = {
            $set: {
              collections: [...(result as EntityModel).collections, collection],
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne(
              { _id: entity },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                consola.success(
                  "Added Entity (id):",
                  entity.toString(),
                  "to Collection (id):",
                  collection.toString()
                );
                resolve(entity);
              }
            );
        });
    });
  };

  static removeCollection = (
    entity: string,
    collection: string
  ): Promise<string> => {
    consola.start(
      "Removing Entity (id):",
      entity.toString(),
      "from Collection (id):",
      collection.toString()
    );
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: entity }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Update the collection of Collections associated with the Entity to remove this Collection
          const updates = {
            $set: {
              collections: [
                ...(result as EntityModel).collections.filter(
                  (content) => !_.isEqual(content, collection)
                ),
              ],
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne(
              { _id: entity },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                consola.success(
                  "Removed Entity (id):",
                  entity.toString(),
                  "from Collection (id):",
                  collection.toString()
                );
                resolve(entity);
              }
            );
        });
    });
  };

  /**
   * Add another Entity to a collection of "product" associations
   * @param {{ name: string, id: string }} entity the Entity of interest
   * @param {{ name: string, id: string }} product an Entity to add as a "product" association
   * @return {Promise<{ name: string, id: string }>}
   */
  static addProduct = (
    entity: { name: string; id: string },
    product: { name: string; id: string }
  ): Promise<{ name: string; id: string }> => {
    consola.start("Adding Product", product.name, "to Entity", entity.name);
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: entity.id }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Update the collection of Products associated with the Entity to include this extra product
          const updates = {
            $set: {
              associations: {
                origins: result.associations.origins,
                products: _.uniq(
                  _.concat(result.associations.products, product)
                ),
              },
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne(
              { _id: entity.id },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                consola.success(
                  "Added Product",
                  product.name,
                  "to Entity",
                  entity.name
                );
                resolve(entity);
              }
            );
        });
    });
  };

  /**
   * Add another Entity to a collection of "product" associations
   * @param {{ name: string, id: string }} entity the Entity of interest
   * @param {{ name: string, id: string }[]} products Entities to add as a "product" association
   * @return {Promise<{ name: string, id: string }[]>}
   */
  static addProducts = (
    entity: { name: string; id: string },
    products: { name: string; id: string }[]
  ): Promise<{ name: string; id: string }> => {
    consola.start("Adding", products.length, "Products to Entity", entity.name);
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: entity.id }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Update the collection of Products associated with the Entity to include this extra product
          const updates = {
            $set: {
              associations: {
                origins: result.associations.origins,
                products: _.uniq(
                  _.concat(result.associations.products, products)
                ),
              },
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne(
              { _id: entity.id },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                consola.start(
                  "Added",
                  products.length,
                  "Products to Entity",
                  entity.name
                );
                resolve(entity);
              }
            );
        });
    });
  };

  static removeProduct = (
    entity: { name: string; id: string },
    product: { name: string; id: string }
  ): Promise<{ name: string; id: string }> => {
    consola.start("Removing Product", product.name, "from Entity", entity.name);
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: entity.id }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Update the collection of Products associated with the Entity to remove this Product
          const updates = {
            $set: {
              associations: {
                origins: (result as EntityModel).associations.origins,
                products: (result as EntityModel).associations.products.filter(
                  (content) => !_.isEqual(product.id, content.id)
                ),
              },
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne(
              { _id: entity.id },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                consola.info(
                  "Removed Product",
                  product.name,
                  "from Entity",
                  entity.name
                );
                resolve(entity);
              }
            );
        });
    });
  };

  /**
   * Specify an Entity acting as an Origin
   * @param {{ name: string, id: string }} entity the Entity of interest
   * @param {{ name: string, id: string }} origin an Entity to add as an "origin" association
   * @return {Promise<{ name: string, id: string }>}
   */
  static addOrigin = (
    entity: { name: string; id: string },
    origin: { name: string; id: string }
  ): Promise<{ name: string; id: string }> => {
    consola.start("Adding Origin", origin.name, "to Entity", entity.name);
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: entity.id }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Add the Origin to this Entity
          const updates = {
            $set: {
              associations: {
                origins: [
                  ...result.associations.origins,
                  {
                    name: origin.name,
                    id: origin.id,
                  },
                ],
                products: result.associations.products,
              },
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne(
              { _id: entity.id },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                consola.success(
                  "Added Origin",
                  origin.name,
                  "to Entity",
                  entity.name
                );
                resolve(entity);
              }
            );
        });
    });
  };

  /**
   * Specify an Entity acting as an Origin
   * @param {{ name: string, id: string }} entity the Entity of interest
   * @param {{ name: string, id: string }[]} origins Entities to add as "origin" associations
   * @return {Promise<{ name: string, id: string }[]>}
   */
  static addOrigins = (
    entity: { name: string; id: string },
    origins: { name: string; id: string }[]
  ): Promise<{ name: string; id: string }> => {
    consola.start("Adding", origins.length, "Origins to Entity", entity.name);
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: entity.id }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Add the Origin to this Entity
          const updates = {
            $set: {
              associations: {
                origins: _.uniq(_.concat(result.associations.origins, origins)),
                products: result.associations.products,
              },
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne(
              { _id: entity.id },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                consola.success(
                  "Added",
                  origins.length,
                  "Origins to Entity",
                  entity.name
                );
                resolve(entity);
              }
            );
        });
    });
  };

  static removeOrigin = (
    entity: { name: string; id: string },
    origin: { name: string; id: string }
  ): Promise<{ name: string; id: string }> => {
    consola.start("Removing Origin", origin.name, "from Entity", entity.name);
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: entity.id }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Update the collection of Origins associated with the Entity to remove this Origin
          const updates = {
            $set: {
              associations: {
                origins: (result as EntityModel).associations.origins.filter(
                  (content) => !_.isEqual(origin.id, content.id)
                ),
                products: (result as EntityModel).associations.products,
              },
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne(
              { _id: entity.id },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                consola.success(
                  "Removed Origin",
                  origin.name,
                  "from Entity",
                  entity.name
                );
                resolve(entity);
              }
            );
        });
    });
  };

  static addAttribute = (
    entity: string,
    attribute: AttributeModel
  ): Promise<string> => {
    consola.start(
      "Adding Attribute:",
      attribute.name.toString(),
      "to Entity (id):",
      entity.toString()
    );
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: entity }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Update the collection of Attributes associated with the Entity to remove this Attribute
          const updates = {
            $set: {
              attributes: [...(result as EntityModel).attributes, attribute],
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne(
              { _id: entity },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                consola.success(
                  "Added Attribute:",
                  attribute.name.toString(),
                  "to Entity (id):",
                  entity.toString()
                );
                resolve(entity);
              }
            );
        });
    });
  };

  static removeAttribute = (
    entity: string,
    attribute: string
  ): Promise<string> => {
    consola.start(
      "Removing Attribute (id):",
      attribute.toString(),
      "from Entity (id):",
      entity.toString()
    );
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: entity }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Update the collection of Attributes associated with the Entity to remove this Attribute
          const updates = {
            $set: {
              attributes: [
                ...(result as EntityModel).attributes.filter(
                  (content) => !_.isEqual(content._id, attribute)
                ),
              ],
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne(
              { _id: entity },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                consola.success(
                  "Removed Attribute (id):",
                  attribute.toString(),
                  "from Entity (id):",
                  entity.toString()
                );
                resolve(entity);
              }
            );
        });
    });
  };

  static updateAttribute = (
    entity: string,
    updatedAttribute: AttributeModel
  ): Promise<string> => {
    consola.start(
      "Update Attribute (id):",
      updatedAttribute._id.toString(),
      "from Entity (id):",
      entity.toString()
    );
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: entity }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          (result as EntityModel).attributes.forEach((attribute) => {
            if (_.isEqual(updatedAttribute._id, attribute._id)) {
              consola.info("Updating an Attribute");
              attribute.name = updatedAttribute.name;
              attribute.description = updatedAttribute.description;
              attribute.values = updatedAttribute.values;
            }
          });

          // Update the collection of Attributes associated with the Entity to remove this Attribute
          const updates = {
            $set: {
              attributes: [...(result as EntityModel).attributes],
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne(
              { _id: entity },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                consola.success(
                  "Updated Attribute (id):",
                  updatedAttribute._id.toString(),
                  "from Entity (id):",
                  entity.toString()
                );
                resolve(entity);
              }
            );
        });
    });
  };

  /**
   * Update the description of an Entity
   * @param entity the Entity of interest
   * @param description an updated description
   * @return {Promise<{ name: string, id: string }>}
   */
  static setDescription = (
    entity: { name: string; id: string },
    description: string
  ): Promise<{ name: string; id: string }> => {
    consola.start(
      "Setting description of Entity",
      entity.name,
      "to",
      description
    );
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: entity.id }, (error: any, _result: any) => {
          if (error) {
            throw error;
          }

          // Update the description of this Entity
          const updates = {
            $set: {
              description: description,
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne(
              { _id: entity.id },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  throw error;
                }

                // Resolve the Promise
                consola.success(
                  "Set description of Entity",
                  entity.name,
                  "to",
                  description
                );
                resolve(entity);
              }
            );
        });
    });
  };

  static addAttachment = (
    id: string,
    attachment: { name: string; id: string }
  ): Promise<{ name: string; id: string }> => {
    consola.start("Adding Attachment", attachment.name, "to Entity (id):", id);
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: id }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Add the Origin to this Entity
          const updates = {
            $set: {
              attachments: [
                ...result.attachments,
                {
                  name: attachment.name,
                  id: attachment.id,
                },
              ],
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne({ _id: id }, updates, (error: any, _response: any) => {
              if (error) {
                throw error;
              }

              // Resolve the Promise
              consola.success(
                "Added Attachment",
                attachment.name,
                "to Entity (id):",
                id
              );
              resolve(attachment);
            });
        });
    });
  };

  static removeAttachment = (
    id: string,
    attachment: { name: string; id: string }
  ): Promise<{ name: string; id: string }> => {
    consola.start(
      "Removing Attachment",
      attachment.name,
      "from Entity (id):",
      id
    );
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: id }, (error: any, result: any) => {
          if (error) {
            throw error;
          }

          // Add the Origin to this Entity
          const updates = {
            $set: {
              attachments: [
                ...(result as EntityModel).attachments.filter(
                  (existing) => !_.isEqual(existing.id, attachment.id)
                ),
              ],
            },
          };

          getDatabase()
            .collection(ENTITIES_COLLECTION)
            .updateOne({ _id: id }, updates, (error: any, _response: any) => {
              if (error) {
                throw error;
              }

              // Resolve the Promise
              consola.success(
                "Removed Attachment",
                attachment.name,
                "from Entity (id):",
                id
              );
              resolve(attachment);
            });
        });
    });
  };

  /**
   * Update the lock state of an Entity
   * @param {{ entity: { name: string; id: string }; lockState: boolean; }} entityLockData the Entity of interest and a flag if the Entity is "locked", or editable
   * @return {Promise<{ name: string, id: string }>}
   */
  static setLock = (entityLockData: {
    entity: { name: string; id: string };
    lockState: boolean;
  }): Promise<{ name: string; id: string }> => {
    consola.start(
      "Setting lock state of Entity",
      entityLockData.entity.name,
      "to",
      entityLockData.lockState ? "locked" : "unlocked"
    );
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne(
          { _id: entityLockData.entity.id },
          (error: any, _result: any) => {
            if (error) {
              throw error;
            }

            // Update the lock state of this Entity
            // Note: This feature is temporarily disabled
            entityLockData.lockState = false;
            consola.warn("Edit locking temporarily disabled");

            const updates = {
              $set: {
                locked: entityLockData.lockState,
              },
            };

            getDatabase()
              .collection(ENTITIES_COLLECTION)
              .updateOne(
                { _id: entityLockData.entity.id },
                updates,
                (error: any, _response: any) => {
                  if (error) {
                    throw error;
                  }

                  // Update automatic unlock operation after 30 seconds
                  if (entityLockData.lockState === true) {
                    setTimeout(() => {
                      this.setLock({
                        entity: entityLockData.entity,
                        lockState: false,
                      });
                    }, 30000);
                  }

                  // Resolve the Promise
                  consola.success(
                    "Set lock state of Entity",
                    entityLockData.entity.name,
                    "to",
                    entityLockData.lockState ? "locked" : "unlocked"
                  );
                  resolve(entityLockData.entity);
                }
              );
          }
        );
    });
  };

  /**
   * Retrieve all Entities
   * @return {Promise<EntityModel[]>}
   */
  static getAll = (): Promise<EntityModel[]> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .find({
          deleted: false,
        })
        .toArray((error: any, result: any) => {
          if (error) {
            throw error;
          }

          consola.success("Retrieved all Entities");
          resolve(result as EntityModel[]);
        });
    });
  };

  /**
   * Get a single Entity
   * @param {string} id the Entity identifier
   * @return {Promise<EntityModel>}
   */
  static getOne = (id: string): Promise<EntityModel> => {
    consola.start("Retrieving Entity (id):", id.toString());
    return new Promise((resolve, reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: id }, (error: any, result: any) => {
          if (error) {
            reject(error);
            throw error;
          }

          consola.success("Retrieved Entity (id):", id.toString());
          resolve(result as EntityModel);
        });
    });
  };

  /**
   * Collate and generate a data string containing all data pertaining to
   * an Entity
   * @param {{ id: string, fields: string[] }} entityExportData the export data of the Entity
   * @return {Promise<string>}
   */
  static getData = (entityExportData: {
    id: string;
    fields: string[];
    format: "json" | "csv" | "txt";
  }): Promise<string> => {
    consola.start(
      "Generating data for Entity (id):",
      entityExportData.id.toString()
    );
    return new Promise((resolve, reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: entityExportData.id }, (error: any, result: any) => {
          if (error) {
            reject(error);
            throw error;
          }

          const entity = result as EntityModel;

          if (_.isEqual(entityExportData.format, "csv")) {
            const headers = ["ID", "Name"];
            const row: Promise<string>[] = [
              Promise.resolve(entity._id),
              Promise.resolve(entity.name),
            ];

            // Iterate over fields and generate a CSV export file
            entityExportData.fields.map((field) => {
              if (_.isEqual(field, "created")) {
                // "created" data field
                headers.push("Created");
                row.push(
                  Promise.resolve(
                    dayjs(entity.created).format("DD MMM YYYY").toString()
                  )
                );
              } else if (_.isEqual(field, "owner")) {
                // "owner" data field
                headers.push("Owner");
                row.push(Promise.resolve(entity.owner));
              } else if (_.isEqual(field, "description")) {
                // "description" data field
                headers.push("Description");
                row.push(Promise.resolve(entity.description));
              } else if (_.startsWith(field, "origin_")) {
                // "origins" data field
                row.push(
                  Entities.getOne(_.split(field, "_")[1]).then((entity) => {
                    headers.push(`Origin (${entity.name})`);
                    return entity.name;
                  })
                );
              } else if (_.startsWith(field, "product_")) {
                // "products" data field
                row.push(
                  Entities.getOne(_.split(field, "_")[1]).then((entity) => {
                    headers.push(`Product (${entity.name})`);
                    return entity.name;
                  })
                );
              } else if (_.startsWith(field, "attribute_")) {
                // "attributes" data field
                const attributeId = field.split("_")[1];
                entity.attributes.map((attribute) => {
                  if (_.isEqual(attribute._id, attributeId)) {
                    for (let value of attribute.values) {
                      headers.push(`${value.name} (${attribute.name})`);
                      row.push(Promise.resolve(`${value.data}`));
                    }
                  }
                });
              }
            });

            // Collate and format data as a CSV string
            Promise.all(row).then((rowData) => {
              const collated = [headers, rowData];
              const formattedOutput = Papa.unparse(collated);

              // Create a temporary file, passing the filename as a response
              tmp.file((error, path: string, _fd: number) => {
                if (error) {
                  reject(error);
                  throw error;
                }

                fs.writeFileSync(path, formattedOutput);
                consola.success(
                  "Generated CSV data for  Entity (id):",
                  entityExportData.id.toString()
                );
                resolve(path);
              });
            });
          } else if (_.isEqual(entityExportData.format, "json")) {
            // JSON export
            const tempStructure = {
              _id: entity._id,
              name: entity.name,
              created: "",
              owner: "",
              description: "",
              associations: {},
              collections: [],
              attributes: [],
            } as { [key: string]: any };
            const exportOperations = [] as Promise<string>[];

            entityExportData.fields.map((field) => {
              if (_.isEqual(field, "created")) {
                // "created" data field
                tempStructure["created"] = dayjs(entity.created)
                  .format("DD MMM YYYY")
                  .toString();
              } else if (_.isEqual(field, "owner")) {
                // "owner" data field
                tempStructure["owner"] = entity.owner;
              } else if (_.isEqual(field, "description")) {
                // "description" data field
                tempStructure["description"] = entity.description;
              } else if (_.startsWith(field, "collection")) {
                // "collections" data field
                tempStructure["collections"] = [];
                exportOperations.push(
                  Collections.getOne(_.split(field, "_")[1]).then(
                    (collection) => {
                      tempStructure["collections"].push(collection.name);
                      return collection.name;
                    }
                  )
                );
              } else if (_.startsWith(field, "origin_")) {
                // "origins" data field
                tempStructure.associations["origins"] = [];
                exportOperations.push(
                  Entities.getOne(_.split(field, "_")[1]).then((entity) => {
                    tempStructure.associations["origins"].push(entity.name);
                    return entity.name;
                  })
                );
              } else if (_.startsWith(field, "product_")) {
                // "products" data field
                tempStructure.associations["products"] = [];
                exportOperations.push(
                  Entities.getOne(_.split(field, "_")[1]).then((entity) => {
                    tempStructure.associations["products"].push(entity.name);
                    return entity.name;
                  })
                );
              } else if (_.startsWith(field, "attribute_")) {
                // "attributes" data field
                tempStructure["attributes"] = [];
                const attributeId = field.split("_")[1];
                entity.attributes.map((attribute) => {
                  if (_.isEqual(attribute._id, attributeId)) {
                    // Extract all values
                    const attributeStruct = {} as { [value: string]: any };
                    for (let value of attribute.values) {
                      attributeStruct[value.name] = value.data;
                    }

                    // Add the Attribute to the exported set
                    tempStructure["attributes"].push({
                      [attribute.name]: attributeStruct,
                    });
                  }
                });
              }
            });

            // Run all export operations
            Promise.all(exportOperations).then((_values) => {
              // Create a temporary file, passing the filename as a response
              tmp.file((error, path: string, _fd: number) => {
                if (error) {
                  reject(error);
                  throw error;
                }

                fs.writeFileSync(
                  path,
                  JSON.stringify(tempStructure, null, "  ")
                );
                consola.success(
                  "Generated JSON data for  Entity (id):",
                  entityExportData.id.toString()
                );
                resolve(path);
              });
            });
          } else {
            // Text export
            const exportOperations = [] as Promise<string>[];

            // Structures to collate data
            const textDetails = [`ID: ${entity._id}`, `Name: ${entity.name}`];
            const textOrigins = [] as string[];
            const textProducts = [] as string[];
            const textAttributes = [] as string[];

            entityExportData.fields.map((field) => {
              if (_.isEqual(field, "created")) {
                // "created" data field
                textDetails.push(
                  `Created: ${dayjs(entity.created)
                    .format("DD MMM YYYY")
                    .toString()}`
                );
              } else if (_.isEqual(field, "owner")) {
                // "owner" data field
                textDetails.push(`Owner: ${entity.owner}`);
              } else if (_.isEqual(field, "description")) {
                // "description" data field
                textDetails.push(`Description: ${entity.description}`);
              } else if (_.startsWith(field, "origin_")) {
                // "origins" data field
                exportOperations.push(
                  Entities.getOne(_.split(field, "_")[1]).then((entity) => {
                    textOrigins.push(entity.name);
                    return entity.name;
                  })
                );
              } else if (_.startsWith(field, "product_")) {
                // "products" data field
                exportOperations.push(
                  Entities.getOne(_.split(field, "_")[1]).then((entity) => {
                    textProducts.push(entity.name);
                    return entity.name;
                  })
                );
              } else if (_.startsWith(field, "attribute_")) {
                // "attributes" data field
                const attributeId = field.split("_")[1];
                entity.attributes.map((attribute) => {
                  if (_.isEqual(attribute._id, attributeId)) {
                    // Extract all values
                    const attributeValues = [];
                    for (let value of attribute.values) {
                      attributeValues.push(`    ${value.name}: ${value.data}`);
                    }

                    // Add the Attribute to the exported set
                    textAttributes.push(
                      `  ${attribute.name}:\n${attributeValues.join("\n")}`
                    );
                  }
                });
              }
            });

            // Run all export operations
            Promise.all(exportOperations).then((_values) => {
              // Create a temporary file, passing the filename as a response
              tmp.file((error, path: string, _fd: number) => {
                if (error) {
                  reject(error);
                  throw error;
                }

                if (textOrigins.length > 0) {
                  textDetails.push(`Origins: ${textOrigins.join(", ")}`);
                }
                if (textProducts.length > 0) {
                  textDetails.push(`Products: ${textProducts.join(", ")}`);
                }
                if (textAttributes.length > 0) {
                  textDetails.push(`Attributes:`);
                  textDetails.push(...textAttributes);
                }

                fs.writeFileSync(path, textDetails.join("\n"));
                consola.success(
                  "Generated text data for  Entity (id):",
                  entityExportData.id.toString()
                );
                resolve(path);
              });
            });
          }
        });
    });
  };

  /**
   * Handle uploading and assigning an attachment to an Entity
   * @param {any} files image to be attached to the Entity
   * @param {string} target Entity identifier to receive the image
   * @return {Promise<{ status: boolean; message: string; data?: any }>}
   */
  static upload = (
    files: any,
    target: string
  ): Promise<{ status: boolean; message: string; data?: any }> => {
    return new Promise((resolve, reject) => {
      if (files.file) {
        const receivedFile = files.file;
        const receivedFileData = receivedFile.data as Buffer;
        consola.start("Received file:", receivedFile.name);

        // Access bucket and create open stream to write to storage
        const bucket = getAttachments();

        // Create stream from buffer
        const streamedFile = Readable.from(receivedFileData);
        const uploadStream = bucket.openUploadStream(receivedFile.name, {
          metadata: { type: receivedFile.mimetype },
        });
        streamedFile
          .pipe(uploadStream)
          .on("error", (_error: Error) => {
            reject("Error occurred uploading file");
          })
          .on("finish", () => {
            // Once the upload is finished, register attachment with Entity
            Entities.addAttachment(target, {
              name: receivedFile.name,
              id: uploadStream.id.toString(),
            });
            resolve({ status: true, message: "Uploaded file" });
          });
      }
    });
  };

  static delete = (id: string): Promise<EntityModel> => {
    consola.start("Deleting Entity (id):", id.toString());
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(ENTITIES_COLLECTION)
        .findOne({ _id: id }, (error: any, result: any) => {
          if (error) {
            throw error;
          }
          // Store the Entity data
          const entity: EntityModel = result;

          const operations: Promise<any>[] = [];

          // Add Update operation
          operations.push(
            Activity.create({
              timestamp: new Date(Date.now()),
              type: "delete",
              details: "Deleted Entity",
              target: {
                type: "entities",
                id: entity._id,
                name: entity.name,
              },
            })
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations).then((_result) => {
            // Set the deleted flag
            const updates = {
              $set: {
                deleted: true,
              },
            };

            getDatabase()
              .collection(ENTITIES_COLLECTION)
              .updateOne(
                { _id: entity._id },
                updates,
                (error: any, _response: any) => {
                  if (error) {
                    throw error;
                  }

                  // Resolve the Promise
                  consola.success("Deleted Entity:", entity.name);
                  resolve(entity);
                }
              );
          });
        });
    });
  };
}
