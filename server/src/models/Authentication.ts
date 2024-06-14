import { IAuth } from "@types";
import axios, { AxiosResponse } from "axios";
import _ from "lodash";

// Variables
const TOKEN_URL = "https://orcid.org/oauth/token";
const CLIENT_ID = process.env.CLIENT_ID as string;
const CLIENT_SECRET = process.env.CLIENT_SECRET as string;
const REDIRECT_URI =
  process.env.NODE_ENV !== "production"
    ? "http://127.0.0.1:8080"
    : "https://mars.reusable.bio";

export class Authentication {
  /**
   * Perform login operation
   * @returns Authentication information including name, ORCID, and a token
   */
  static login = async (code: string): Promise<IAuth> => {
    // Format login data for POST request
    const loginData = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: REDIRECT_URI,
    }).toString();

    // If non-production, resolve with test user
    if (process.env.NODE_ENV !== "production") {
      return {
        orcid: "XXXX-0000-DEMO-1111",
        name: "Test User",
        token: "test_token_value",
      };
    }

    const response: AxiosResponse = await axios.post(TOKEN_URL, loginData, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (response.status === 200) {
      return response.data as IAuth;
    } else {
      throw new Error("Invlid");
    }
    // return new Promise((resolve, reject) => {

    //   postData(TOKEN_URL, loginData, {
    //     headers: {
    //       Accept: "application/json",
    //       "Content-Type": "application/x-www-form-urlencoded",
    //     },
    //   })
    //     .then(async (response: AuthToken) => {
    //       try {
    //         let user = await Users.exists(response.orcid);
    //         if (user) {
    //           // If user exists, update the existing record with any new data
    //           consola.debug("User found for ORCiD:", response.orcid);
    //           await Users.update(response.orcid, {
    //             _id: response.orcid,
    //             name: response.name,
    //             token: response.token,
    //           });
    //           consola.debug("User data updated for ORCiD:", response.orcid);
    //         } else {
    //           // If user does not exist, create a new record
    //           consola.debug("New user creation for ORCiD:", response.orcid);
    //           await Users.create({
    //             _id: response.orcid,
    //             name: response.name,
    //             token: response.token,
    //           });
    //           consola.debug("New user created for ORCiD:", response.orcid);
    //           await bootstrapUserData(response.orcid); // Here we pass the ORCiD as the userId
    //         }

    //         // Resolve with updated or new user data
    //         resolve({
    //           name: response.name,
    //           orcid: response.orcid,
    //           token: response.token,
    //         });
    //       } catch (error) {
    //         consola.error(
    //           `Error processing ORCiD "${response.orcid}": ${JSON.stringify(
    //             error,
    //           )}`,
    //         );
    //         reject(
    //           `Error processing ORCiD "${response.orcid}". Please contact the administrator.`,
    //         );
    //       }
    //     })
    //     .catch((error: any) => {
    //       consola.error("Error performing login:", JSON.stringify(error));
    //       reject(JSON.stringify(error));
    //     });
    // });
  };
}
