import consola from "consola";
import _ from "underscore";

// Get the URL of the database
import { DATABASE_URL } from "src/variables";

/**
 * Generate a mixed-format ID:
 *   `id_ABCDE_123`
 * @return {string}
 */
export const pseudoId = (): string => {
  return (
    "id_" +
    Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, "")
      .slice(0, 5) +
    "_" +
    Math.round(Math.random() * 1000)
  );
};

/**
 * Get data from the Lab API using the JavaScript `fetch` API
 * @param {string} path exact API path to get data from
 * @return {Promise<any>} an object containing information from the database
 */
export const getData = async (path: string): Promise<any> => {
  return await fetch(`${DATABASE_URL}${path}`).then(async (response) => {
    // Check response status
    if (!response.ok) {
      consola.error("GET:", path);
      throw new Error("Invalid response from database");
    }

    // Check the contents of the response
    const record = await response.json();
    if (!record) {
      consola.error("GET:", path);
      throw new Error("Response contents were empty");
    } else {
      consola.success("GET:", path);
      return record;
    }
  }).catch((error) => {
    consola.error("GET:", path);
    return { status: "error", error: error };
  });
};

/**
 * Post data to the Lab API using the JavaScript `fetch` API
 * @param {string} path exact API path to post data to
 * @param {any} data the data to be posted to Lab
 */
export const postData = async (path: string, data: any): Promise<any> => {
  return await fetch(`${DATABASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }).then((response) => {
    if (_.isEqual(response.ok, true)) {
      consola.success("POST:", path, data);
      return { status: "success" };
    }
    throw new Error("Failed to POST data");
  }).catch((error) => {
    consola.error("POST:", path, data);
    return { status: "error", error: error };
  });
};

/**
 * Delete data to the Lab API using the JavaScript `fetch` API
 * @param {string} path the path of the database objected to be deleted
 */
 export const deleteData = async (path: string): Promise<any> => {
  return await fetch(`${DATABASE_URL}${path}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((response) => {
    if (_.isEqual(response.ok, true)) {
      consola.success("DELETE:", path);
      return { status: "success" };
    }
    throw new Error("Failed to DELETE");
  }).catch((error) => {
    consola.error("DELETE:", path);
    return { status: "error", error: error };
  });
};
