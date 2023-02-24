// .env configuration
import "dotenv/config";

// Jest imports
import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";

// Entity operations and types
import { Entities } from "../src/operations/Entities";

import { connect, disconnect } from "../src/database/connection";

import consola from "consola";

beforeEach((done) => {
  connect((error: any) => {
    if (error) {
      consola.error(error);
    }
    done();
  });
});

afterAll(() => {
  return disconnect();
});

describe("GET /entities", () => {
  it("should return 0 Entities with an empty database", async () => {
    return Entities.getAll().then((result) => {
      expect(result.length).toBe(0);
    });
  });
});
