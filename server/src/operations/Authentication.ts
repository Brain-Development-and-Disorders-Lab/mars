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
const REDIRECT_URI = "https://mars.reusable.bio";

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
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        }
      }).then((response: AuthToken) => {
        consola.success("Valid token");
        consola.start("Checking access...");
        Users.get(response.orcid).then(() => {
          consola.info("id_token:", response.id_token);
          resolve({
            name: response.name,
            orcid: response.orcid,
            id_token: response.id_token,
          });
        }).catch((_error: any) => {
          consola.error(`ORCiD "${response.orcid}" does not have access. Please contact the administrator.`);
          reject(`ORCiD "${response.orcid}" does not have access. Please contact the administrator.`);
        });
      }).catch((error: any) => {
        consola.error(error.response.data.error_description);
        reject(error.response.data.error_description);
      });
    });
  };

  static validate = (id_token: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const client = new JwksClient({
        jwksUri: "https://orcid.org/oauth/jwks",
        requestHeaders: {},
        timeout: 30000,
      });

      client.getSigningKey("production-orcid-org-7hdmdswarosg3gjujo8agwtazgkp1ojs").then((result) => {
        const orcid = verify(id_token, result.getPublicKey()).sub;

        if (_.isUndefined(orcid)) {
          resolve(false);
        } else {
          Users.get(orcid.toString()).then((result) => {
            if (_.isEqual(result.status, "success")) {
              // User exists and is valid
              resolve(true);
            } else {
              // Invalid user
              resolve(false);
            }
          });
        }
      }).catch((error) => {
        consola.error("Error validating token:", error);
        reject("Error validating token");
      })
    });
  };
}
