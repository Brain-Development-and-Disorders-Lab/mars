// Existing and custom types
import { AuthInfo, AuthToken, ProjectModel } from "@types";

// Operations
import { Users } from "./Users";

// Utility libraries
import { postData } from "../util";
import _ from "lodash";
import consola from "consola";
import { JwksClient } from "jwks-rsa";
import { verify } from "jsonwebtoken";
import { Projects } from "./Projects";
import { Entities } from "./Entities";
import { Attributes } from "./Attributes";
import dayjs from "dayjs";

// Constants
const TOKEN_URL = "https://orcid.org/oauth/token";
const CLIENT_ID = process.env.CLIENT_ID as string;
const CLIENT_SECRET = process.env.CLIENT_SECRET as string;
const REDIRECT_URI = _.isEqual(process.env.NODE_ENV, "test")
  ? "http://127.0.0.1:8080"
  : "https://mars.reusable.bio";

async function createDefaultProjectForUser(
  userId: any,
): Promise<ProjectModel | undefined> {
  // This is a simplistic example. You'll need to adapt it to your project's schema.
  const defaultProject = {
    name: "My First Project",
    description:
      "This is your first Project. Feel free to explore and modify it!",
    owner: userId,
    entities: [], // Assuming you can add entities later
    collaborators: [], // Assuming you might want collaborators
    // Add other project fields as necessary
  };

  consola.debug(`Creating default Project for user: ${userId}`);
  try {
    // Assuming you have a Projects module with a create function
    const project = await Projects.create(defaultProject);
    consola.success(
      `Default Project created for user "${userId}": ${project._id}`,
    );
    return project;
  } catch (error) {
    consola.error(
      `Error creating default Project for user "${userId}": ${error}`,
    );
    return undefined;
  }
}

async function createDefaultEntitiesForUser(userId: any, projectId: any) {
  // Example default entities. Adapt to your needs.
  const defaultEntities = [
    {
      name: "Sample Entity 1",
      description: "Description for Sample Entity 1",
      owner: userId,
      projects: [projectId],
      deleted: false,
      locked: false,
      created: dayjs(Date.now()).toISOString(),
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
      attachments: [],
      history: [],
      // Add other entity fields as necessary
    },
    {
      name: "Sample Entity 2",
      description: "Description for Sample Entity 2",
      owner: userId,
      projects: [projectId],
      deleted: false,
      locked: false,
      created: dayjs(Date.now()).toISOString(),
      associations: {
        origins: [],
        products: [],
      },
      attributes: [],
      attachments: [],
      history: [],
      // Add other entity fields as necessary
    },
  ];

  const createdEntityIds: string[] = [];

  consola.start(`Creating default Entities for user: ${userId}`);
  try {
    for (const entity of defaultEntities) {
      const createdEntity = await Entities.create(entity);
      if (createdEntity && createdEntity._id) {
        consola.debug(`Entity created with ID: ${createdEntity._id}`);
        createdEntityIds.push(createdEntity._id); // Store the ID of the created entity
      }
    }
    consola.success(`Default Entities created for user: ${userId}`);
  } catch (error) {
    consola.error(
      `Error creating default Entities for user "${userId}": ${error}`,
    );
  }
  return createdEntityIds; // Return the list of created entity IDs
}

async function createDefaultTemplatesForUser(userId: any) {
  // Example of a more detailed and contextual default template
  const defaultExperimentTemplate = {
    name: "Experiment Protocol",
    description: "Standard template for documenting experiment protocols.",
    values: [
      {
        identifier: "protocol_overview",
        name: "Protocol Overview",
        type: "text",
        data: "Brief description of the experiment protocol and objectives.",
      },
      {
        identifier: "materials_and_methods",
        name: "Materials and Methods",
        type: "text",
        data: "Detailed list of materials and methods used in the experiment.",
      },
      {
        identifier: "expected_results",
        name: "Expected Results",
        type: "text",
        data: "Description of expected results and outcomes from the experiment.",
      },
      {
        identifier: "safety_precautions",
        name: "Safety Precautions",
        type: "text",
        data: "List of safety precautions and measures to be aware of during the experiment.",
      },
    ],
    owner: userId, // Assign the new user as the owner of this template
  };

  try {
    const template = await Attributes.create(defaultExperimentTemplate);
    consola.success(
      `Default Template created for user "${userId}": ${template._id}`,
    );
  } catch (error) {
    consola.error(
      `Error creating default Template for user "${userId}": ${error}`,
    );
  }
}

/**
 * Bootstrap the account of a new user, perform setup tasks and generate default data
 * @param {string} userId Identifier of the new user
 */
async function bootstrapUserData(userId: string) {
  // Example of creating default project, entities, templates for the new user
  const project: any = await createDefaultProjectForUser(userId);

  const entities: any = await createDefaultEntitiesForUser(
    userId,
    project?._id,
  );
  if (entities && entities[0] && entities[1]) {
    const entity1 = await Entities.getOne(entities[0]);
    const entity2 = await Entities.getOne(entities[1]);
    Entities.addProduct(
      { name: entity1.name, id: entity1._id },
      { name: entity2.name, id: entity2._id },
    );
    Entities.addOrigin(
      { name: entity2.name, id: entity2._id },
      { name: entity1.name, id: entity1._id },
    );
  }
  await createDefaultTemplatesForUser(userId);

  // Add other default setup tasks as needed
}

/**
 * Authentication operations
 */
export class Authentication {
  /**
   * Validate the ORCiD login submitted by the user
   * @param {string} code authentication code provided by ORCiD
   * @returns {Promise<AuthInfo>}
   */
  static login = (code: string): Promise<AuthInfo> => {
    // Retrieve a token
    return new Promise((resolve, reject) => {
      const tokenRequestData = `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=authorization_code&code=${code}&redirect_uri=${REDIRECT_URI}`;
      postData(TOKEN_URL, tokenRequestData, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })
        .then(async (response: AuthToken) => {
          consola.debug("Checking access...");

          try {
            let user = await Users.exists(response.orcid);
            if (user) {
              // If user exists, update the existing record with any new data
              consola.debug("User found for ORCiD:", response.orcid);
              await Users.update(response.orcid, {
                name: response.name,
                _id: response.orcid,
                id_token: response.id_token,
              });
              consola.debug("User data updated for ORCiD:", response.orcid);
            } else {
              // If user does not exist, create a new record
              consola.debug("New user creation for ORCiD:", response.orcid);
              await Users.create({
                name: response.name,
                _id: response.orcid,
                id_token: response.id_token,
              });
              consola.debug("New user created for ORCiD:", response.orcid);
              await bootstrapUserData(response.orcid); // Here we pass the ORCiD as the userId
            }

            // Resolve with updated or new user data
            resolve({
              name: response.name,
              orcid: response.orcid,
              id_token: response.id_token,
            });
          } catch (error) {
            consola.error(
              `Error processing ORCiD "${response.orcid}": ${JSON.stringify(
                error,
              )}`,
            );
            reject(
              `Error processing ORCiD "${response.orcid}". Please contact the administrator.`,
            );
          }
        })
        .catch((error: any) => {
          consola.error("Error performing login:", JSON.stringify(error));
          reject(JSON.stringify(error));
        });
    });
  };

  /**
   * Validate a login token
   * @param id_token ID token contents
   * @returns {Promise<boolean>}
   */
  static validate = (id_token: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (_.isEqual(process.env.NODE_ENV, "development")) {
        resolve({ _id: "XXXX-1234-ABCD-0000" } as any);
      }

      const client = new JwksClient({
        jwksUri: "https://orcid.org/oauth/jwks",
        requestHeaders: {},
        timeout: 30000,
      });

      client
        .getSigningKey("production-orcid-org-7hdmdswarosg3gjujo8agwtazgkp1ojs")
        .then((result) => {
          const orcid = verify(id_token, result.getPublicKey()).sub;

          if (_.isUndefined(orcid)) {
            consola.error("ORCiD could not be retrieved from login token");
            resolve(false);
          } else {
            Users.get(orcid.toString()).then((result) => {
              if (_.isEqual(result.status, "success")) {
                // User exists and is valid
                consola.debug(`ORCiD "${orcid}" is a valid user`);
                resolve(result?.user as any);
              } else {
                // Invalid user
                consola.error(
                  `ORCiD "${orcid}" is not a valid user, they may not exist in the system`,
                );
                resolve(result?.user as any);
              }
            });
          }
        })
        .catch((error) => {
          if (_.isEqual(process.env.NODE_ENV, "development")) {
            // Development mode token validation bypass
            consola.debug("Successfully validated login token");
            return resolve(true);
          }
          consola.error(`Error validating login token "${id_token}":`, error);
          reject("Error validating login token");
        });
    });
  };
}
