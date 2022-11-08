// Consola
import consola from "consola";

export const logUpdate = (user: string, updateType: "modified" | "created" | "deleted", target: "entity" | "collection" | "attribute", targetState: { before: any, after: any }) => {
  consola.info(user, updateType, target);
  consola.debug(targetState);
};