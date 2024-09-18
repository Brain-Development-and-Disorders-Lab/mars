import client from "prom-client";

// Models
import { Entities } from "./Entities";

export class Statistics {
  /**
   * Get all User entries from the Users collection
   * @returns Collection of all User entries
   */
  static setup = async (): Promise<void> => {
    // Setup total Entity count
    const entities = await Entities.all();
    EntityCounterAll.inc(entities.length);
  };
}

export const EntityCounterAll = new client.Counter({
  name: "entity_counter_all",
  help: "entity_counter_all",
});
