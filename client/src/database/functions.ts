// Utility functions and libraries
import consola from "consola";
import _ from "lodash";
import axios, { AxiosRequestConfig } from "axios";

// Get the URL of the database
import { SERVER_URL } from "src/variables";

/**
 * Get data from the Lab API using the JavaScript `fetch` API
 * @param {string} path exact API path to get data from
 * @return {Promise<any>} an object containing information from the database
 */
export const getData = (
  path: string,
  options?: AxiosRequestConfig
): Promise<any> => {
  return new Promise((resolve, reject) => {
    axios
      .get(`${SERVER_URL}${path}`, options)
      .then((response) => {
        // Check response status
        if (!response) {
          consola.error("GET:", path);
          reject("Invalid response from database");
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
  options?: AxiosRequestConfig
): Promise<any> => {
  return new Promise((resolve, reject) => {
    axios
      .post(`${SERVER_URL}${path}`, data, options)
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
export const deleteData = async (path: string): Promise<any> => {
  return await fetch(`${SERVER_URL}${path}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (_.isEqual(response.ok, true)) {
        return { status: "success" };
      }
      throw new Error("Failed to DELETE");
    })
    .catch((error) => {
      consola.error("DELETE:", path);
      return { status: "error", error: error };
    });
};

/**
 * Check if an Entity, Project, or Attribute still exists in MARS
 * @param {string} id Identifier of the Entity, Project, or Attribute
 * @param {"entities" | "projects" | "attributes"} type Specify whether an Entity, Project, or Attribute is being checked
 * @return {Promise<boolean>}
 */
export const doesExist = async (
  id: string,
  type: "entities" | "projects" | "attributes"
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
