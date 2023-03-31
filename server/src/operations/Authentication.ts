// Utility libraries
import _, { reject } from "underscore";
import consola from "consola";
import crypto from "node:crypto";

export class Authentication {
  /**
   * Validate the password submitted by the user
   * @param {string} _password hashed password value submitted by the user
   * @return {Promise<string>}
   */
  static login = (password: string): Promise<string> => {
    consola.info("Performing login...");
    return new Promise((resolve, _reject) => {
      const encoder = new TextEncoder();
      const defaultPassword = encoder.encode(process.env.DEFAULT_PASSWORD || "");

      crypto.pbkdf2(password, "", 310000, 32, "sha256", ((error, hashed) => {
        if (error) {
          reject("Error performing login");
        }

        if (!crypto.timingSafeEqual(defaultPassword, hashed)) {
          reject("Incorrect password");
        } else {
          resolve("Correct password")
        }
      }));
      resolve("test1234");
    });
  };
};
