import consola from "consola";

// Get the URL of the database
import { DATABASE_URL } from "src/variables";

/**
 * Post data to the Lab API using the JavaScript `fetch` API
 * @param {string} path exact API path to post data to
 * @param {any} data the data to be posted to Lab
 */
export const postData = async (path: string, data: any): Promise<any> => {
  consola.debug("Posting data:", path, data);

  await fetch(`${DATABASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }).catch((error) => {
    consola.error("Error posting data to database");
    return { error: error };
  });

  consola.success("Successfully posted data:", path, data);
  return;
};
