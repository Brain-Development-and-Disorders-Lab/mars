// Existing and custom types
import { AuthToken } from "@types";

// Utility libraries
import _ from "lodash";
import consola from "consola";
import crypto from "node:crypto";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

export class Authentication {
  /**
   * Validate the password submitted by the user
   * @param {string} password hashed password value submitted by the user
   * @return {Promise<AuthToken>}
   */
  static login = (password: string): Promise<AuthToken> => {
    consola.start("Performing login...");
    return new Promise((resolve, reject) => {
      const encoder = new TextEncoder();
      const defaultPassword = encoder.encode(
        process.env.DEFAULT_PASSWORD || "default"
      );

      // Hash the default password
      const hashDefault = new Promise<Buffer>((resolve, reject) => {
        crypto.pbkdf2(
          defaultPassword,
          "",
          310000,
          32,
          "sha256",
          (error, hashed) => {
            if (error) {
              reject();
            }
            resolve(hashed);
          }
        );
      });

      const hashRecieved = new Promise<Buffer>((resolve, reject) => {
        crypto.pbkdf2(password, "", 310000, 32, "sha256", (error, hashed) => {
          if (error) {
            reject();
          }
          resolve(hashed);
        });
      });

      // Perform hash comparison after resolving all Promises
      Promise.all([hashDefault, hashRecieved]).then((hashes: Buffer[]) => {
        if (!crypto.timingSafeEqual(hashes[0], hashes[1])) {
          consola.warn("Invalid login attempt");
          reject("");
        } else {
          consola.success("Successful login attempt");
          resolve({
            username: "User",
            token: `auth_${nanoid(10)}_${Date.now().toFixed()}`,
            lastLogin: dayjs(Date.now()).toString(),
            valid: true,
          });
        }
      });
    });
  };
}
