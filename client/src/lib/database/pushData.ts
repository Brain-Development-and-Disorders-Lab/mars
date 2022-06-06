import consola from "consola";

import { DATABASE_URL } from "src/variables";

/**
 * Push data to the Lab API using the JavaScript `fetch` API
 * @param {string} path exact API path to push data to
 * @param {any} data the data to be pushed to Lab
 */
export const pushData = async (path: string, data: any): Promise<any> => {
  await fetch(`${DATABASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }).catch((error) => {
    consola.error("Error when pushing data");
    return {
      error: error,
    };
  });
  return;
};
