// Utility libraries
import _, { reject } from "underscore";
import consola from "consola";
import crypto from "node:crypto";

export class Authentication {
  /**
   * Validate the password submitted by the user
   * @param {string} password hashed password value submitted by the user
   * @return {Promise<string>}
   */
  static login = (password: string): Promise<string> => {
    consola.info("Performing login...");
    return new Promise((resolve, _reject) => {
      const encoder = new TextEncoder();
      const defaultPassword = encoder.encode(process.env.DEFAULT_PASSWORD || "");

      // Hash the default password
      const hashDefault = new Promise<Buffer>((resolve, reject) => {
        crypto.pbkdf2(defaultPassword, "", 310000, 32, "sha256", ((error, hashed) => {
          if (error) {
            reject();
          }
          resolve(hashed);
        }));
      });

      const hashRecieved = new Promise<Buffer>((resolve, reject) => {
        crypto.pbkdf2(password, "", 310000, 32, "sha256", ((error, hashed) => {
          if (error) {
            reject();
          }
          resolve(hashed);
        }));
      });

      // Perform hash comparison after resolving all Promises
      Promise.all([hashDefault, hashRecieved]).then((hashes: Buffer[]) => {
        if (!crypto.timingSafeEqual(hashes[0], hashes[1])) {
          reject("Incorrect password");
        } else {
          resolve("Correct password")
        }
      });
    });
  };
};
