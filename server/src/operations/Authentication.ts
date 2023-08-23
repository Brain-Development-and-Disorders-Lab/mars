// Existing and custom types
import { AuthInfo, AuthToken } from "@types";

// Utility libraries
import { postData } from "src/util";
import _ from "lodash";
import consola from "consola";
import { Users } from "./Users";

const TOKEN_URL = "https://orcid.org/oauth/token";
const CLIENT_ID = process.env.CLIENT_ID as string;
const CLIENT_SECRET = process.env.CLIENT_SECRET as string;
const REDIRECT_URI = "https://reusable.bio";

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
        consola.error(`Error authenticating with ORCiD:`, error.message);
        reject(`Error authenticating with ORCiD`);
      });
    });
  };
}
