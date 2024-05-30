import { IProject, ProjectModel } from "@types";
import { Projects } from "src/models/Projects"

export const ProjectsResolvers = {
  Query: {
    // Retrieve all Projects
    projects: async (_parent: any, args: { limit: 100 }) => {
      const projects = await Projects.all();
      return projects.slice(0, args.limit);
    },

    // Retrieve one Project by _id
    project: async (_parent: any, args: { _id: string }) => {
      return await Projects.getOne(args._id);
    },
  },
  Mutation: {
    createProject: async (_parent: any, args: { project: IProject }) => {
      return await Projects.create(args.project)
    },
    updateProject: async (_parent: any, args: { project: ProjectModel }) => {
      return await Projects.update(args.project)
    },
    addProjectEntity: async (_parent: any, args: { _id: string, entity: string }) => {
      return await Projects.addEntity(args._id, args.entity);
    },
    addProjectEntities: async (_parent: any, args: { _id: string, entities: string[] }) => {
      return await Projects.addEntities(args._id, args.entities);
    },
    removeProjectEntity: async (_parent: any, args: { _id: string, entity: string }) => {
      return await Projects.removeEntity(args._id, args.entity);
    }
  }
}
