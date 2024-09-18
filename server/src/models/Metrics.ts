import client from "prom-client";

// Models
import { Entities } from "./Entities";
import { Users } from "./Users";
import { Workspaces } from "./Workspaces";

export class Metrics {
  /**
   * Setup server Prometheus gauges
   */
  static setupPrometheus = async (): Promise<void> => {
    // Setup total Entity count
    const entities = await Entities.all();
    EntityCounterAll.inc(entities.length);

    // Setup total User count
    const users = await Users.all();
    UserCounterAll.inc(users.length);

    // Setup total Workspace count
    const workspaces = await Workspaces.all();
    WorkspaceCounterAll.inc(workspaces.length);
  };
}

export const EntityCounterAll = new client.Gauge({
  name: "entity_counter_all",
  help: "entity_counter_all",
});

export const UserCounterAll = new client.Gauge({
  name: "user_counter_all",
  help: "user_counter_all",
});

export const WorkspaceCounterAll = new client.Gauge({
  name: "workspace_counter_all",
  help: "workspace_counter_all",
});
