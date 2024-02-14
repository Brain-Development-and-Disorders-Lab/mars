// Existing and custom types
import { AuthInfo, AuthToken } from "@types";

// Operations
import { Users } from "./Users";

// Utility libraries
import { postData } from "src/util";
import _ from "lodash";
import consola from "consola";
import { JwksClient } from "jwks-rsa";
import { verify } from "jsonwebtoken";

const TOKEN_URL = "https://orcid.org/oauth/token";
const CLIENT_ID = process.env.CLIENT_ID as string;
const CLIENT_SECRET = process.env.CLIENT_SECRET as string;
const REDIRECT_URI = _.isEqual(process.env.NODE_ENV, "test") ? "http://127.0.0.1:8080" : "https://mars.reusable.bio";

/**
 * Authentication operations
 */
export class Authentication {
  /**
   * Validate the ORCiD login submitted by the user
   * @param {string} code authentication code provided by ORCiD
   * @return {Promise<AuthInfo>}
   */
  static login = (code: string): Promise<AuthInfo> => {
    consola.start("Performing login...");

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
          consola.success("Valid token");
          consola.start("Checking access...");

          try {
            let user = await Users.exists(response.orcid);
            if (user) {
              // If user exists, update the existing record with any new data
              consola.info("User found for ORCiD:", response.orcid);
              await Users.update(response.orcid, {
                name: response.name,
                _id: response.orcid,
                id_token: response.id_token,
              });
              consola.info("User data updated for ORCiD:", response.orcid);
            } else {
              // If user does not exist, create a new record
              consola.info("New user creation for ORCiD:", response.orcid);
              await Users.create({
                name: response.name,
                _id: response.orcid,
                id_token: response.id_token,
              });
              consola.info("New user created for ORCiD:", response.orcid);
            }

            // Resolve with updated or new user data
            resolve({
              name: response.name,
              orcid: response.orcid,
              id_token: response.id_token,
            });
          } catch (error) {
            consola.error(`Error processing ORCiD "${response.orcid}": ${JSON.stringify(error)}`);
            reject(`Error processing ORCiD "${response.orcid}". Please contact the administrator.`);
          }
        }
        )
        .catch((error: any) => {
          consola.error(JSON.stringify(error));
          reject(JSON.stringify(error));
        });
    });
  };

  static validate = (id_token: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {

      if (_.isEqual(process.env.NODE_ENV, "development")) {
        resolve(true);
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
            resolve(false);
          } else {
            Users.get(orcid.toString()).then((result) => {
              if (_.isEqual(result.status, "success")) {
                // User exists and is valid
                resolve(result?.user as any);
              } else {
                // Invalid user
                resolve(result?.user as any);
              }
            });
          }
        })
        .catch((error) => {
          consola.error("Error validating token:", error);
          reject("Error validating token");
        });
    });
  };
}
