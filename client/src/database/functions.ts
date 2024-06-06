// Utility functions and libraries
import consola from "consola";
import _ from "lodash";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

// Custom types
import { RequestMethod, ServerResponse } from "@types";

// Get the URL of the database
import { SERVER_URL, TOKEN_KEY } from "src/variables";

// Token for request authorization
import { getToken } from "src/util";

export const request = async (
  type: RequestMethod,
  path: string,
  data?: any,
  options?: AxiosRequestConfig,
): Promise<ServerResponse> => {
  // Merge in options if specified
  const requestOptions: AxiosRequestConfig = {
    ...options,
  };

  // Configure authorization
  if (!_.isUndefined(getToken(TOKEN_KEY))) {
    requestOptions.headers = {
      id_token: getToken(TOKEN_KEY).id_token,
      ...requestOptions.headers,
    };
  }

  // Execute request and store response if successful
  let response: AxiosResponse;
  switch (type) {
    case "GET":
      try {
        response = await axios.get(`${SERVER_URL}${path}`, requestOptions);
      } catch {
        return {
          success: false,
          message: "Error while making request, check connectivity",
          data: {},
        };
      }
      if (!response) {
        return {
          success: false,
          message: "No response received from server",
          data: {},
        };
      }
      break;
    case "POST":
      // POST request
      try {
        response = await axios.post(
          `${SERVER_URL}${path}`,
          data,
          requestOptions,
        );
      } catch {
        return {
          success: false,
          message: "Error while making request, check connectivity",
          data: {},
        };
      }
      const contentTypeHeader = response.headers["content-type"];
      if (_.isNull(contentTypeHeader)) {
        return {
          success: false,
          message: "Invalid response received from server",
          data: {},
        };
      } else if (
        _.startsWith(contentTypeHeader, "application/json") &&
        !_.isEqual(response.statusText, "OK")
      ) {
        return {
          success: false,
          message: "Invalid JSON response received from server",
          data: {},
        };
      }
      break;
  }

  // Return an object containing the response data and status
  return {
    success: true,
    message: "Recieved response from server",
    data: response.data,
  };
};

/**
 * Get data from the Lab API using the JavaScript `fetch` API
 * @param {string} path exact API path to get data from
 * @returns {Promise<any>} an object containing information from the database
 */
export const getData = (
  path: string,
  options?: AxiosRequestConfig,
): Promise<any> => {
  // Configure authorization
  const requestOptions: AxiosRequestConfig = {
    ...options,
  };

  if (!_.isUndefined(getToken(TOKEN_KEY))) {
    requestOptions.headers = {
      id_token: getToken(TOKEN_KEY).id_token,
      ...requestOptions.headers,
    };
  }

  return new Promise((resolve, reject) => {
    axios
      .get(`${SERVER_URL}${path}`, requestOptions)
      .then((response) => {
        // Check response status
        if (!response) {
          consola.error("GET:", path);
          reject("Invalid response");
        }

        // Resolve with the response data
        resolve(response.data);
      })
      .catch((error) => {
        consola.error("GET:", path);
        reject(error);
      });
  });
};

/**
 * Post data to the Lab API using the JavaScript `fetch` API
 * @param {string} path exact API path to post data to
 * @param {any} data the data to be posted to Lab
 */
export const postData = async (
  path: string,
  data: any,
  options?: AxiosRequestConfig,
): Promise<any> => {
  // Configure authorization
  const requestOptions: AxiosRequestConfig = {
    ...options,
  };

  if (!_.isUndefined(getToken(TOKEN_KEY))) {
    requestOptions.headers = {
      id_token: getToken(TOKEN_KEY).id_token,
      ...requestOptions.headers,
    };
  }

  return new Promise((resolve, reject) => {
    axios
      .post(`${SERVER_URL}${path}`, data, requestOptions)
      .then((response) => {
        const contentType = response.headers["content-type"];
        if (_.isNull(contentType)) {
          reject("Invalid response");
        } else if (_.startsWith(contentType, "application/json")) {
          if (!_.isEqual(response.statusText, "OK")) {
            reject("Invalid response");
          } else {
            resolve(response.data);
          }
        } else {
          resolve(response.data);
        }
      })
      .catch((error) => {
        consola.error("POST:", path);
        reject(error);
      });
  });
};

/**
 * Delete data to the Lab API using the JavaScript `fetch` API
 * @param {string} path the path of the database objected to be deleted
 */
export const deleteData = async (
  path: string,
  options?: AxiosRequestConfig,
): Promise<any> => {
  // Configure authorization
  const requestOptions: AxiosRequestConfig = {
    ...options,
  };

  if (!_.isUndefined(getToken(TOKEN_KEY))) {
    requestOptions.headers = {
      id_token: getToken(TOKEN_KEY).id_token,
      ...requestOptions.headers,
    };
  }
  return new Promise((resolve, reject) => {
    axios
      .delete(`${SERVER_URL}${path}`, requestOptions)
      .then((response) => {
        // Check response status
        if (!response) {
          consola.error("GET:", path);
          reject("Invalid response");
        }

        // Resolve with the response data
        resolve(response.data);
      })
      .catch((error) => {
        consola.error("DELETE:", path);
        reject(error);
      });
  });
};

/**
 * Check if an Entity, Project, or Attribute still exists in MARS
 * @param {string} id Identifier of the Entity, Project, or Attribute
 * @param {"entities" | "projects" | "attributes"} type Specify whether an Entity, Project, or Attribute is being checked
 * @returns {Promise<boolean>}
 */
export const doesExist = async (
  id: string,
  type: "entities" | "projects" | "attributes",
): Promise<boolean> => {
  return new Promise((resolve, _reject) => {
    getData(`/${type}/${id}`).then((result) => {
      if (result.status === "error") {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};
