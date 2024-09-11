import { IAuth, UserModel } from "@types";
import axios, { AxiosResponse } from "axios";
import { verify } from "jsonwebtoken";
import { JwksClient } from "jwks-rsa";
import _ from "lodash";
import { Users } from "./Users";

// Variables
const TOKEN_URL = "https://orcid.org/oauth/token";
const CLIENT_ID = process.env.CLIENT_ID as string;
const CLIENT_SECRET = process.env.CLIENT_SECRET as string;
const REDIRECT_URI =
  process.env.NODE_ENV !== "production"
    ? "http://127.0.0.1:8080"
    : "https://app.metadatify.com";

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

    // Generate the authentication payload
    let authenticationPayload: IAuth;
    if (process.env.NODE_ENV === "production") {
      // If production, obtain the ORCiD token data
      const response: AxiosResponse = await axios.post(TOKEN_URL, loginData, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      if (response.status !== 200) {
        throw new Error("Invalid");
      }
      authenticationPayload = response.data;
    } else {
      // If non-production, resolve with test user
      authenticationPayload = {
        orcid: "XXXX-0000-DEMO-1111",
        name: "Test User",
        token: "test_token_value",
        workspace: "",
      };
    }

    // Check if the User exists, and create a new User if not
    const exists = await Users.exists(authenticationPayload.orcid);
    if (!exists) {
      await Users.create({
        _id: authenticationPayload.orcid,
        name: authenticationPayload.name,
        email: "",
        token: authenticationPayload.token,
        workspaces: [],
      });
    }

    return authenticationPayload;
  };

  static validate = async (token: string): Promise<UserModel> => {
    if (process.env.NODE_ENV === "production") {
      // Validate the token and obtain the ORCiD
      const client = new JwksClient({
        jwksUri: "https://orcid.org/oauth/jwks",
        requestHeaders: {},
        timeout: 30000,
      });

      const result = await client.getSigningKey(
        "production-orcid-org-7hdmdswarosg3gjujo8agwtazgkp1ojs",
      );
      const orcid = verify(token, result.getPublicKey()).sub;

      if (_.isUndefined(orcid)) {
        throw new Error("ORCiD could not be retrieved from login token");
      }

      const user = await Users.getOne(orcid.toString());
      if (user) {
        return user;
      }
    } else {
      // Return the test user account
      const user = await Users.getOne("XXXX-0000-DEMO-1111");
      if (user) {
        return user;
      }
    }

    throw new Error(`Could not validate token`);
  };
}
