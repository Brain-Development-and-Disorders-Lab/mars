import consola from "consola";

import { DATABASE_URL } from "src/variables";

/**
 * Get data from the SampleFlow API using the JavaScript `fetch` API
 * @param {string} path exact API path to get data from
 * @return {Promise<any>} an object containing information from the database
 */
export const getData = async (path: string): Promise<any> => {
  const response = await fetch(`${DATABASE_URL}${path}`);

  // Check response status
  if (!response.ok) {
    consola.error("Response from database not OK");
    return {
      error: "Received an invalid response from the database",
    };
  }

  // Check the contents of the response
  const record = await response.json();
  if (!record) {
    consola.warn("No records received");
    return {
      error: "Did not receive any records",
    };
  }

  consola.success("Successful database query");
  return record;
}
