// Utility functions
import { getDatabase } from "../connectors/database";
import { Entities } from "./Entities";
import { Activity } from "./Activity";
import { getIdentifier } from "src/util";

// Custom types
import { ProjectModel, IProject } from "@types";

// Utility libraries
import _ from "lodash";
import consola from "consola";
import dayjs from "dayjs";
import fs from "fs";
import Papa from "papaparse";
import tmp from "tmp";

const PROJECTS = "projects";

export class Projects {
  /**
   * Check if a Project exists in the system
   * @param {string} id the Project identifier
   * @returns {boolean}
   */
  static exists = (id: string): Promise<boolean> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection<ProjectModel>(PROJECTS)
        .findOne({ _id: id }, (_error: any, result: any) => {
          if (_.isNull(result)) {
            consola.warn("Project (id):", id.toString(), "does not exist");
            resolve(false);
          }

          consola.debug("Project (id):", id.toString(), "exists");
          resolve(true);
        });
    });
  };

  /**
   * Create a new Project
   * @param {any} project all data associated with the new Project
   * @returns {Promise<ProjectModel>}
   */
  static create = (project: any): Promise<ProjectModel> => {
    // Allocate a new identifier and join with Project data
    project["_id"] = getIdentifier("project");

    // Push data to database
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(PROJECTS)
        .insertOne(project, (error: any, result: any) => {
          if (error) {
            consola.error("Error creating Project:", error);
            throw error;
          }

          // Database operations to perform
          const operations: Promise<any>[] = [];

          // Add any Entities to the Project
          for (const entity of (project as IProject).entities) {
            operations.push(Projects.addEntity(result.insertedId, entity));
          }

          // Add Update operation
          operations.push(
            Activity.create({
              timestamp: new Date(Date.now()),
              type: "create",
              details: "Created new Project",
              target: {
                type: "projects",
                _id: project._id,
                name: project.name,
              },
            }),
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations).then((_result) => {
            consola.debug("Created new Project:", project._id, project.name);
            resolve(project as ProjectModel);
          });
        });
    });
  };

  /**
   * Asynchronously updates a Project with new information.
   * @param {ProjectModel} updatedProject The updated Project model containing the changes.
   * @returns {Promise<ProjectModel>} Resolves with the updated Project model.
   * @throws {Error} Throws an error if there are issues with the database operation or update process.
   */
  static update = (updatedProject: ProjectModel): Promise<ProjectModel> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(PROJECTS)
        .findOne({ _id: updatedProject._id }, (error: any, result: any) => {
          if (error) {
            consola.error(
              `Error while finding Project "${updatedProject.name}"`,
              error,
            );
            throw error;
          }

          // Database operations to perform
          const operations: Promise<any>[] = [];

          // Cast and store current state of the Project
          const currentProject = result as ProjectModel;

          // Entities
          const entitiesToKeep = currentProject.entities.filter((entity) =>
            updatedProject.entities.includes(entity),
          );
          const entitiesToAdd = updatedProject.entities.filter(
            (entity) => !currentProject.entities.includes(entity),
          );
          entitiesToAdd.map((entity: string) => {
            operations.push(Entities.addProject(entity, currentProject._id));
          });
          const entitiesToRemove = currentProject.entities.filter(
            (entity) => !entitiesToKeep.includes(entity),
          );
          entitiesToRemove.map((entity: string) => {
            operations.push(Entities.removeProject(entity, currentProject._id));
          });

          const updates = {
            $set: {
              description: updatedProject.description,
              entities: [...entitiesToKeep, ...entitiesToAdd],
              collaborators: updatedProject?.collaborators || [],
              history: [
                {
                  timestamp: dayjs(Date.now()).toISOString(),
                  name: currentProject.name,
                  created: currentProject.created,
                  owner: currentProject.owner,
                  shared: currentProject.shared,
                  description: currentProject.description,
                  entities: currentProject.entities,
                },
                ...(currentProject.history || []),
              ],
            },
          };

          // Add Update operation
          operations.push(
            Activity.create({
              timestamp: new Date(Date.now()),
              type: "update",
              details: "Updated Project",
              target: {
                type: "projects",
                _id: updatedProject._id,
                name: updatedProject.name,
              },
            }),
          );

          getDatabase()
            .collection(PROJECTS)
            .updateOne(
              { _id: updatedProject._id },
              updates,
              (error: any, _response: any) => {
                if (error) {
                  consola.error(
                    `Error while updating Project "${updatedProject.name}"`,
                    error,
                  );
                  throw error;
                }

                // Resolve all operations then resolve overall Promise
                Promise.all(operations).then((_result) => {
                  consola.debug("Updated Project:", updatedProject.name);

                  // Resolve the Promise
                  resolve(updatedProject);
                });
              },
            );
        });
    });
  };

  /**
   * Create a new Project
   * @param {any} project Data associated with the new Project
   * @returns {Promise<ProjectModel>}
   */
  static restore = (project: any): Promise<ProjectModel> => {
    // Push data to database
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(PROJECTS)
        .insertOne(project, (error: any, _result: any) => {
          if (error) {
            consola.error("Error while restoring Project:", error);
            throw error;
          }

          // Database operations to perform
          const operations: Promise<any>[] = [];

          // Add Update operation
          operations.push(
            Activity.create({
              timestamp: new Date(Date.now()),
              type: "create",
              details: "Created new Project",
              target: {
                type: "projects",
                _id: project._id,
                name: project.name,
              },
            }),
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations).then((_result) => {
            consola.debug("Restored Project:", project._id, project.name);
            resolve(project as ProjectModel);
          });
        });
    });
  };

  /**
   * Add an Entity to a Project
   * @param {string} project Target Project identifier
   * @param {string} entity Entity identifier to add to target Project
   * @returns {Promise<string>}
   */
  static addEntity = (project: string, entity: string): Promise<string> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(PROJECTS)
        .findOne({ _id: project }, (error: any, result: any) => {
          if (error) {
            // Error occuring during database request
            consola.error("Error while finding Project:", error);
            throw error;
          } else if (_.isNull(result)) {
            // Project potentially does not exist
            consola.warn(
              "Provided Project identifier returns `null`:",
              project,
            );
            resolve(project);
          } else {
            // Update the collection to include the Entity
            const updatedValues = {
              $set: {
                entities: _.concat(result.entities, entity),
              },
            };

            getDatabase()
              .collection(PROJECTS)
              .updateOne(
                { _id: project },
                updatedValues,
                (error: any, _response: any) => {
                  if (error) {
                    consola.error(
                      "Error while updating Project Entities:",
                      error,
                    );
                    throw error;
                  }
                  consola.debug(
                    "Added Entity",
                    entity.toString(),
                    "to Project",
                    result.name,
                  );

                  // Resolve the Promise
                  resolve(result._id);
                },
              );
          }
        });
    });
  };

  /**
   * Add multiple Entities to a Project
   * @param project Target Project identifier
   * @param entities List of Entity identifiers to add to the Project
   * @returns {Promise<string>}
   */
  static addEntities = (
    project: string,
    entities: string[],
  ): Promise<string> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(PROJECTS)
        .findOne({ _id: project }, (error: any, result: any) => {
          if (error) {
            consola.error("Error while finding Project:", error);
            throw error;
          } else if (_.isNull(result)) {
            consola.warn(
              "Provided Project identifier returns `null`:",
              project,
            );
            resolve(project);
          } else {
            // Update the collection to include the Entity
            const updatedValues = {
              $set: {
                entities: _.uniq(_.concat(result.entities, entities)),
              },
            };

            getDatabase()
              .collection(PROJECTS)
              .updateOne(
                { _id: project },
                updatedValues,
                (error: any, _response: any) => {
                  if (error) {
                    consola.error(
                      "Error while adding multiple Entites to Project:",
                      error,
                    );
                    throw error;
                  }
                  consola.debug(
                    "Added",
                    entities.length,
                    "Entities to Project",
                    project.toString(),
                  );

                  // Resolve the Promise
                  resolve(result._id);
                },
              );
          }
        });
    });
  };

  /**
   * Remove an Entity from a Project
   * @param project Target Project identifier
   * @param entity Entity identifier to remove from Project
   * @returns {Promise<string>}
   */
  static removeEntity = (project: string, entity: string): Promise<string> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(PROJECTS)
        .findOne({ _id: project }, (error: any, result: any) => {
          if (error) {
            consola.error("Error while finding Project:", error);
            throw error;
          } else if (_.isNull(result)) {
            consola.warn(
              "Provided Project identifier returns `null`:",
              project,
            );
            resolve(project);
          } else {
            // Update the collection to remove the Entity
            const updatedValues = {
              $set: {
                entities: (result as ProjectModel)?.entities.filter(
                  (content) =>
                    !_.isEqual(content.toString(), entity.toString()),
                ),
              },
            };

            getDatabase()
              .collection(PROJECTS)
              .updateOne(
                { _id: project },
                updatedValues,
                (error: any, _response: any) => {
                  if (error) {
                    consola.error(
                      "Error while removing Entity from Project:",
                      error,
                    );
                    throw error;
                  }
                  consola.debug(
                    "Removed Entity",
                    entity.toString(),
                    "from Project",
                    project.toString(),
                  );

                  // Resolve the Promise
                  resolve(project);
                },
              );
          }
        });
    });
  };

  /**
   * Retrieve a collection of all Projects
   * @returns {Promise<ProjectModel>}
   */
  static getAll = (): Promise<ProjectModel[]> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(PROJECTS)
        .find({})
        .toArray((error: any, result: any) => {
          if (error) {
            consola.error("Error retrieving all Projects:", error);
            throw error;
          }
          consola.debug("Retrieved all Projects");
          resolve(result as ProjectModel[]);
        });
    });
  };

  /**
   * Get a single Project
   * @param {string} id Target Project identifier
   * @returns {Promise<ProjectModel>}
   */
  static getOne = async (id: string): Promise<ProjectModel> => {
    try {
      const entities = await Entities.getAll();
      const filteredEntities = entities
        .filter((entity) => entity?.projects?.includes(id))
        .map((entity) => entity._id);

      const project = await getDatabase()
        .collection(PROJECTS)
        .findOne({ _id: id });

      if (!project) {
        consola.error("Project not found");
        throw new Error("Project not found");
      }

      project.entities = filteredEntities;

      consola.debug("Retrieved Project (id):", id.toString());
      return project as unknown as ProjectModel;
    } catch (error) {
      consola.error("Error while retrieving Project:", error);
      throw error;
    }
  };

  /**
   * Collate and generate a data string containing all data pertaining to
   * a Project
   * @param {{ id: string, fields: string[] }} projectExportData the export data of the Project
   * @returns {Promise<string>}
   */
  static getData = (projectExportData: {
    _id: string;
    fields: string[];
    format: "json" | "csv" | "txt";
  }): Promise<string> => {
    return new Promise((resolve, reject) => {
      getDatabase()
        .collection(PROJECTS)
        .findOne({ _id: projectExportData._id }, (error: any, result: any) => {
          if (error) {
            consola.error("Error while finding Project for export:", error);
            reject(error);
            throw error;
          }

          const project = result as ProjectModel;

          if (_.isEqual(projectExportData.format, "csv")) {
            const headers = ["ID", "Name"];
            const row: Promise<string>[] = [
              Promise.resolve(project._id),
              Promise.resolve(project.name),
            ];

            const entities: Promise<string>[] = [];
            const projects: Promise<string>[] = [];

            // Iterate over fields and generate a CSV export file
            projectExportData.fields.map((field: string) => {
              if (_.isEqual(field, "created")) {
                // "created" data field
                headers.push("Created");
                row.push(
                  Promise.resolve(
                    dayjs(project.created).format("DD MMM YYYY").toString(),
                  ),
                );
              } else if (_.isEqual(field, "owner")) {
                // "owner" data field
                headers.push("Owner");
                row.push(Promise.resolve(project.owner));
              } else if (_.isEqual(field, "description")) {
                // "description" data field
                headers.push("Description");
                row.push(Promise.resolve(project.description));
              } else if (_.startsWith(field, "project_")) {
                // "project" data fields
                projects.push(
                  Projects.getOne(field.slice(8)).then((project) => {
                    return project.name;
                  }),
                );
              } else if (_.startsWith(field, "entity_")) {
                // "entity" data fields
                entities.push(
                  Entities.getOne(field.slice(7)).then((entity) => {
                    return entity?.name ?? "";
                  }),
                );
              }
            });

            Promise.all([Promise.all(entities), Promise.all(projects)]).then(
              ([entities, projects]) => {
                // Collate and format data as a CSV string
                Promise.all(row).then((rowData) => {
                  // Append Entities
                  if (entities.length > 0) {
                    headers.push("Entities");
                    rowData.push(entities.join(", "));
                  }

                  // Append Projects
                  if (projects.length > 0) {
                    headers.push("Projects");
                    rowData.push(projects.join(", "));
                  }

                  const collated = [headers, rowData];
                  const formattedOutput = Papa.unparse(collated);

                  // Create a temporary file, passing the filename as a response
                  tmp.file((error, path: string, _fd: number) => {
                    if (error) {
                      reject(error);
                      throw error;
                    }

                    fs.writeFileSync(path, formattedOutput);
                    consola.debug(
                      "Generated CSV data for  Project (id):",
                      projectExportData._id.toString(),
                    );
                    resolve(path);
                  });
                });
              },
            );
          } else if (_.isEqual(projectExportData.format, "json")) {
            // JSON export
            const tempStructure = {
              _id: project._id,
              name: project.name,
              created: "",
              owner: "",
              description: "",
              projects: [],
              entities: [],
            } as { [key: string]: any };
            const exportOperations = [] as Promise<string>[];

            projectExportData.fields.map((field: string) => {
              if (_.isEqual(field, "created")) {
                // "created" data field
                tempStructure["created"] = dayjs(project.created)
                  .format("DD MMM YYYY")
                  .toString();
              } else if (_.isEqual(field, "owner")) {
                // "owner" data field
                tempStructure["owner"] = project.owner;
              } else if (_.isEqual(field, "description")) {
                // "description" data field
                tempStructure["description"] = project.description;
              } else if (_.startsWith(field, "project_")) {
                // "project" data fields
                tempStructure["projects"] = [];
                exportOperations.push(
                  Projects.getOne(field.slice(8)).then((project) => {
                    tempStructure["projects"].push(project.name);
                    return project.name;
                  }),
                );
              } else if (_.startsWith(field, "entity_")) {
                // "entity" data fields
                exportOperations.push(
                  Entities.getOne(field.slice(7)).then((entity) => {
                    tempStructure["entities"].push(entity.name);
                    return entity.name;
                  }),
                );
              }
            });

            // Run all export operations
            Promise.all(exportOperations).then((_values) => {
              // Create a temporary file, passing the filename as a response
              tmp.file((error, path: string, _fd: number) => {
                if (error) {
                  consola.error(
                    "Error while generating temporary file for Project export:",
                    error,
                  );
                  reject(error);
                  throw error;
                }

                fs.writeFileSync(
                  path,
                  JSON.stringify(tempStructure, null, "  "),
                );
                consola.debug(
                  "Generated JSON data for Project (id):",
                  projectExportData._id.toString(),
                );
                resolve(path);
              });
            });
          } else {
            // Text export
            const exportOperations = [] as Promise<string>[];

            // Structures to collate data
            const textDetails = [`ID: ${project._id}`, `Name: ${project.name}`];
            const textProjects = [] as string[];
            const textEntities = [] as string[];

            projectExportData.fields.map((field: string) => {
              if (_.isEqual(field, "created")) {
                // "created" data field
                textDetails.push(
                  `Created: ${dayjs(project.created)
                    .format("DD MMM YYYY")
                    .toString()}`,
                );
              } else if (_.isEqual(field, "owner")) {
                // "owner" data field
                textDetails.push(`Owner: ${project.owner}`);
              } else if (_.isEqual(field, "description")) {
                // "description" data field
                textDetails.push(`Description: ${project.description}`);
              } else if (_.startsWith(field, "project_")) {
                // "project" data fields
                exportOperations.push(
                  Projects.getOne(field.slice(8)).then((project) => {
                    textProjects.push(project.name);
                    return project.name;
                  }),
                );
              } else if (_.startsWith(field, "entity_")) {
                // "entity" data fields
                exportOperations.push(
                  Entities.getOne(field.slice(7)).then((entity) => {
                    textEntities.push(entity.name);
                    return entity.name;
                  }),
                );
              }
            });

            // Run all export operations
            Promise.all(exportOperations).then((_values) => {
              // Create a temporary file, passing the filename as a response
              tmp.file((error, path: string, _fd: number) => {
                if (error) {
                  consola.error(
                    "Error while generating file for Project export:",
                    error,
                  );
                  reject(error);
                  throw error;
                }

                if (textProjects.length > 0) {
                  textDetails.push(`Projects: ${textProjects.join(", ")}`);
                }
                if (textEntities.length > 0) {
                  textDetails.push(`Entities: ${textEntities.join(", ")}`);
                }

                fs.writeFileSync(path, textDetails.join("\n"));
                consola.debug(
                  "Generated text data for  Entity (id):",
                  projectExportData._id.toString(),
                );
                resolve(path);
              });
            });
          }
        });
    });
  };

  /**
   * Delete a Project, also removing Entities from Project
   * @param id Target Project identifier
   * @returns {Promise<ProjectModel>}
   */
  static delete = (id: string): Promise<ProjectModel> => {
    return new Promise((resolve, _reject) => {
      getDatabase()
        .collection(PROJECTS)
        .findOne({ _id: id }, (error: any, result: any) => {
          if (error) {
            consola.error("Error while finding Project for deletion:", error);
            throw error;
          }
          // Store the Project data
          const project: ProjectModel = result;

          const operations: Promise<any>[] = [];

          // Remove the Entities from the Project
          project.entities.map((entity) => {
            operations.push(Entities.removeProject(entity, project._id));
          });

          // Add Update operation
          operations.push(
            Activity.create({
              timestamp: new Date(Date.now()),
              type: "delete",
              details: "Deleted Project",
              target: {
                type: "projects",
                _id: project._id,
                name: project.name,
              },
            }),
          );

          // Resolve all operations then resolve overall Promise
          Promise.all(operations).then((_result) => {
            // Delete the Project
            getDatabase()
              .collection(PROJECTS)
              .deleteOne({ _id: id }, (error: any, _content: any) => {
                if (error) {
                  consola.error("Error while deleting Project:", error);
                  throw error;
                }

                consola.debug("Deleted Project (id):", id.toString());
                resolve(result);
              });
          });
        });
    });
  };
}
