import axios, { AxiosRequestConfig } from "axios";
import { consola } from "consola";
import _ from "lodash";

// Authentication methods
import { Authentication } from "./operations/Authentication";

/**
 * Get data from an API using the JavaScript `fetch` function
 * @param {string} url exact URL to GET data from
 * @returns {Promise<any>} an object containing the resource response
 */
export const getData = (
  url: string,
  options?: AxiosRequestConfig,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    axios
      .get(url, options)
      .then((response) => {
        // Check response status
        if (!response) {
          consola.error("GET:", url);
          reject("Invalid response from resource");
        }
        // Resolve with the response data
        resolve(response.data);
      })
      .catch((error) => {
        consola.error("GET:", url);
        reject(error);
      });
  });
};

/**
 * Post data from an API using the JavaScript `fetch` function
 * @param {string} url exact URL to POST data to
 * @param {any} data the data to include in the request body
 * @returns {Promise<any>} an object containing the resource response
 */
export const postData = async (
  url: string,
  data: any,
  options?: AxiosRequestConfig,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    axios
      .post(url, data, options)
      .then((response) => {
        const contentType = response.headers["content-type"];
        if (_.isNull(contentType)) {
          reject('"content-type" is null');
        } else if (_.startsWith(contentType, "application/json")) {
          if (_.isEqual(response.status, 200)) {
            resolve(response.data);
          } else {
            reject(`Response: ${response.status}`);
          }
        } else {
          resolve(response.data);
        }
      })
      .catch((error) => {
        reject(`Error: ${error}`);
      });
  });
};

/**
 * Perform authentication operation. Authentication can only be bypassed in development mode.
 * @param {any} request Request for authentication
 * @param {any} response Response object
 * @param {function(): void} next Function to execute upon valid authentication
 */
export const authenticate = (request: any, response: any, next: () => void) => {
  // Bypass authentication in development mode
  if (_.isEqual(process.env.NODE_ENV, "development")) {
    request.user = { _id: "XXXX-1234-ABCD-0000" };
    // Bypass authentication in development mode
    next();
  } else {
    Authentication.validate(request.headers["id_token"])
      .then((result) => {
        if (result) {
          request.user = result;
          next();
        } else {
          response.status(403);
          response.json("Not authenticated");
        }
      })
      .catch((_error) => {
        response.status(403);
        response.json("Invalid token");
      });
  }
};
