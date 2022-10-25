import consola from "consola";

// Get the URL of the database
import { DATABASE_URL } from "src/variables";

/**
 * Get data from the Lab API using the JavaScript `fetch` API
 * @param {string} path exact API path to get data from
 * @return {Promise<any>} an object containing information from the database
 */
export const getData = async (path: string): Promise<any> => {
  consola.debug("Running query:", path);
  const response = await fetch(`${DATABASE_URL}${path}`);

  // Check response status
  if (!response.ok) {
    consola.error("Invalid response from database");
    return { error: "Invalid response from database" };
  }

  // Check the contents of the response
  const record = await response.json();
  if (!record) {
    consola.warn("Response contents were empty");
    return { error: "Response contents were empty" };
  }

  consola.success("Successful database query:", path);
  return record;
};
