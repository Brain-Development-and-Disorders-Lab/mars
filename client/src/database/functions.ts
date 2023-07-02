// Utility functions and libraries
import consola from "consola";
import _ from "lodash";
import axios from "axios";

// Get the URL of the database
import { SERVER_URL } from "src/variables";

/**
 * Get data from the Lab API using the JavaScript `fetch` API
 * @param {string} path exact API path to get data from
 * @return {Promise<any>} an object containing information from the database
 */
export const getData = (path: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    fetch(`${SERVER_URL}${path}`)
      .then((response) => {
        // Check response status
        if (!response.ok) {
          consola.error("GET:", path);
          reject("Invalid response from database");
        }

        // Check the contents of the response
        response.json().then((parsed) => {
          if (!parsed) {
            consola.error("GET:", path);
            reject("Response contents were empty");
          } else {
            resolve(parsed);
          }
        });
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
export const postData = async (path: string, data: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    axios
      .post(`${SERVER_URL}${path}`, data)
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
 * Check if an Entity, Collection, or Attribute still exists in MARS
 * @param {string} id Identifier of the Entity, Collection, or Attribute
 * @param {"entities" | "collections" | "attributes"} type Specify whether an Entity, Collection, or Attribute is being checked
 * @return {Promise<boolean>}
 */
export const doesExist = async (
  id: string,
  type: "entities" | "collections" | "attributes"
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
