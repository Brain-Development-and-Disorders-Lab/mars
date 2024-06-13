// Libraries
import express from "express";
import _ from "lodash";

// Import types from the client to enforce structure
import { EntityModel, IEntity, IGenericItem } from "@types";

// Utility functions and libraries
import { Entities } from "../operations/Entities";
import { restAuthenticationWrapper } from "../middleware/Authentication";
import { Projects } from "../operations/Projects";

// Middleware to check entity ownership
export const checkEntitiesOwnership = async (req: any, res: any, next: any) => {
  let userId = req.user?._id;
  const entityId = req.params.id || req?.body?._id;
  const entityName = req.params.name;

  if (_.isEqual(process.env.NODE_ENV, "development")) {
    userId = "XXXX-1234-ABCD-0000";
  }

  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    let entity: EntityModel | null = null;
    if (entityId) {
      entity = await Entities.getOne(entityId);
    } else if (entityName) {
      entity = await Entities.entityByNameExist(entityName);
    }

    if (!entity) {
      return res.status(404).json({ message: "Entity not found" });
    }

    let isOwnerOrProjectOwner = entity.owner === userId;

    // Check if the entity belongs to any project that the user owns
    if (entity.projects && entity.projects.length > 0) {
      for (const projectId of entity.projects) {
        const project = await Projects.getOne(projectId);
        if (
          project &&
          (project.owner === userId || project?.collaborators?.includes(userId))
        ) {
          isOwnerOrProjectOwner = true;
          break; // Break the loop as soon as ownership is confirmed
        }
      }
    }

    if (!isOwnerOrProjectOwner) {
      return res.status(403).json({
        message: "User does not have permission to access this entity",
      });
    }

    req.entity = entity; // Attach the entity to the request object for further use
    next();
  } catch (error) {
    console.error("Error checking entity ownership:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while checking entity ownership" });
  }
};

const EntitiesRoute = express.Router();

// View all Entities
EntitiesRoute.route("/entities").get(
  restAuthenticationWrapper,
  async (_request: any, response: any) => {
    try {
      let userId = _request?.user?._id;
      if (_.isEqual(process.env.NODE_ENV, "development")) {
        userId = "XXXX-1234-ABCD-0000";
      }
      if (!userId) {
        return response
          .status(401)
          .json({ message: "Authentication required" });
      }

      const entities = await Entities.getAll();
      const filteredEntities = [];

      for (let entity of entities) {
        let isOwnerOrProjectOwner = entity.owner === userId;
        if (isOwnerOrProjectOwner) {
          filteredEntities.push(entity);
          continue;
        }

        let isProjectOwned = false;
        for (let projectId of entity.projects || []) {
          const project = await Projects.getOne(projectId);
          if (project && project.owner === userId) {
            isProjectOwned = true;
            break; // Exit the loop early if ownership is confirmed
          }
        }

        // If the user is a project owner, include the entity
        if (isProjectOwned) {
          filteredEntities.push(entity);
        }
      }

      response.json(filteredEntities);
    } catch (error) {
      console.error("Error fetching entities:", error);
      response
        .status(500)
        .json({ message: "An error occurred while fetching entities" });
    }
  },
);

EntitiesRoute.route("/entities/search").post(
  restAuthenticationWrapper,
  async (request: any, response: any) => {
    const searchText = request.body.query;
    const userId = request.user?._id;

    try {
      if (!searchText.trim()) {
        return response
          .status(400)
          .json({ message: "Search text is required." });
      }

      const entities = await Entities.searchByText(userId, searchText);
      response.json(entities);
    } catch (error) {
      console.error("Error performing search:", error);
      response
        .status(500)
        .json({ message: "An error occurred during the search" });
    }
  },
);

// View specific Entity
EntitiesRoute.route("/entities/:id").get(
  restAuthenticationWrapper,
  checkEntitiesOwnership,
  (request: any, response: any) => {
    Entities.getOne(request.params.id).then((entity: EntityModel) => {
      response.json(entity);
    });
  },
);

// View specific Entity
EntitiesRoute.route("/entities/byName/:name").get(
  restAuthenticationWrapper,
  (request: any, response: any) => {
    Entities.entityByNameExist(request.params.name).then(
      (entity: EntityModel | null) => {
        response.json(!!entity);
      },
    );
  },
);

// Lock specific entity
EntitiesRoute.route("/entities/lock/:id").post(
  restAuthenticationWrapper,
  checkEntitiesOwnership,
  (
    request: {
      body: { entity: IGenericItem; lockState: boolean };
    },
    response: any,
  ) => {
    Entities.setLock(request.body).then((entity: IGenericItem) => {
      response.json(entity);
    });
  },
);

// Get formatted data of one Entity
EntitiesRoute.route("/entities/export/:id").post(
  restAuthenticationWrapper,
  checkEntitiesOwnership,
  (
    request: {
      params: { id: string };
      body: { fields: string[]; format: "json" | "csv" | "txt" };
    },
    response: any,
  ) => {
    Entities.getData(request.params.id, request.body).then((path: string) => {
      response.setHeader("Content-Type", `application/${request.body.format}`);
      response.download(
        path,
        `export_${request.params.id}.${request.body.format}`,
      );
    });
  },
);

// Get formatted data of multiple Entities
EntitiesRoute.route("/entities/export").post(
  restAuthenticationWrapper,
  (
    request: {
      body: { entities: string[]; format: "json" | "csv" | "txt" };
    },
    response: any,
  ) => {
    const tmp = require("tmp");
    const fs = require("fs");
    const dayjs = require("dayjs");

    if (request.body?.format === "json") {
      Entities.getDataMultipleJSON(request.body.entities).then(
        (data: string) => {
          // Create a temporary file and write the JSON data to it
          tmp.file({ postfix: ".json" }, (err: any, path: any) => {
            if (err) {
              return response.status(500).send("Error creating file");
            }
            fs.writeFile(path, JSON.stringify(data), (err: any) => {
              if (err) {
                return response.status(500).send("Error writing to file");
              }

              response.setHeader("Content-Type", `application/json`);
              response.download(
                path,
                `export_entities_${dayjs(Date.now()).format(
                  "YYYY_MM_DD",
                )}.json`,
                (err: any) => {
                  // cleanupCallback(); // Cleanup the temp file
                  if (err) {
                    // Handle error, but don't re-throw if it's just the client aborting the download.
                    if (!response.headersSent) {
                      response.status(500).send("Error sending file");
                    }
                  }
                },
              );
            });
          });
        },
      );
    } else {
      Entities.getDataMultiple(request.body.entities).then((path: string) => {
        response.setHeader("Content-Type", `application/csv`);
        response.download(
          path,
          `export_entities_${dayjs(Date.now()).format("YYYY_MM_DD")}.csv`,
        );
      });
    }
  },
);

// Get formatted data of all Entities
EntitiesRoute.route("/entities/export_all").post(
  restAuthenticationWrapper,
  (request: { body?: { project: string } }, response: any) => {
    const projectId = request?.body?.project; // get warning to go away
    const tmp = require("tmp");
    const fs = require("fs");
    const dayjs = require("dayjs");

    Entities.getAll().then((data: EntityModel[]) => {
      // Create a temporary file and write the JSON data to it
      tmp.file({ postfix: ".json" }, (err: any, path: any) => {
        if (err) {
          return response.status(500).send("Error creating file");
        }

        let entities = data;
        if (projectId) {
          entities = entities.filter((entity) =>
            entity.projects.includes(projectId),
          );
        }

        let modifiedEntities = {
          entities: entities.map((entity) => {
            const plainEntity = JSON.parse(JSON.stringify(entity)); // Converts MongoDB types to plain objects
            delete plainEntity.history;

            return plainEntity;
          }),
        };
        const jsonData = JSON.stringify(modifiedEntities, null, 4);

        fs.writeFile(path, JSON.stringify(jsonData), (err: any) => {
          if (err) {
            return response.status(500).send("Error writing to file");
          }

          response.setHeader("Content-Type", `application/json`);
          response.download(
            path,
            `export_entities_${dayjs(Date.now()).format("YYYY_MM_DD")}.json`,
            (err: any) => {
              if (err) {
                if (!response.headersSent) {
                  response.status(500).send("Error sending file");
                }
              }
            },
          );
        });
      });
    });
  },
);

// Create a new Entity, expects Entity data
EntitiesRoute.route("/entities/create").post(
  restAuthenticationWrapper,
  (request: { body: IEntity }, response: any) => {
    Entities.create(request.body).then((entity: EntityModel) => {
      response.json({
        id: entity._id,
        name: entity.name,
        status: "success",
      });
    });
  },
);

// Update an Entity
EntitiesRoute.route("/entities/update").post(
  restAuthenticationWrapper,
  checkEntitiesOwnership,
  (request: { body: EntityModel }, response: any) => {
    Entities.update(request.body).then((updatedEntity: EntityModel) => {
      response.json({
        id: updatedEntity._id,
        name: updatedEntity.name,
        status: "success",
      });
    });
  },
);

// Delete an Entity
EntitiesRoute.route("/entities/:id").delete(
  restAuthenticationWrapper,
  (request: { params: { id: string } }, response: any) => {
    Entities.delete(request.params.id).then((entity) => {
      response.json({
        id: entity._id,
        name: entity.name,
        status: "success",
      });
    });
  },
);

EntitiesRoute.route("/entities/searchByTerm").post(
  restAuthenticationWrapper,
  async (request: any, response: any) => {
    const searchText = request.body.query;
    const userId = request.user?._id;

    if (!searchText.trim()) {
      return response.status(400).json({ message: "Search text is required." });
    }

    try {
      const entities = await Entities.searchByTerm(userId, searchText);
      response.json(entities || []);
    } catch (error) {
      console.error("Error performing search:", error);
      response
        .status(500)
        .json({ message: "An error occurred during the search" });
    }
  },
);

export default EntitiesRoute;
