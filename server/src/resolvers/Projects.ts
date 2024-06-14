import { Context, IProject, ProjectModel } from "@types";
import { GraphQLError } from "graphql";
import _ from "lodash";
import { Projects } from "src/models/Projects";

export const ProjectsResolvers = {
  Query: {
    // Retrieve all Projects
    projects: async (_parent: any, args: { limit: 100 }, context: Context) => {
      const projects = await Projects.all();
      return projects
        .filter((p) => p.owner === context.user)
        .slice(0, args.limit);
    },

    // Retrieve one Project by _id
    project: async (_parent: any, args: { _id: string }, context: Context) => {
      const project = await Projects.getOne(args._id);
      if (_.isNull(project)) {
        throw new GraphQLError("Project does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      if (project.owner === context.user) {
        return project;
      } else {
        throw new GraphQLError(
          "You do not have permission to access this Project",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }
    },

    exportProject: async (
      _parent: any,
      args: { _id: string; format: "json" | "csv"; fields?: string[] },
      context: Context,
    ) => {
      const project = await Projects.getOne(args._id);
      if (_.isNull(project)) {
        throw new GraphQLError("Project does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      if (project.owner === context.user) {
        return await Projects.export(args._id, args.format, args.fields);
      } else {
        throw new GraphQLError(
          "You do not have permission to access this Project",
          {
            extensions: {
              code: "UNAUTHORIZED",
            },
          },
        );
      }
    },
  },

  Mutation: {
    createProject: async (_parent: any, args: { project: IProject }) => {
      return await Projects.create(args.project);
    },
    updateProject: async (_parent: any, args: { project: ProjectModel }) => {
      return await Projects.update(args.project);
    },
    deleteProject: async (_parent: any, args: { _id: string }) => {
      return await Projects.delete(args._id);
    },
    addProjectEntity: async (
      _parent: any,
      args: { _id: string; entity: string },
    ) => {
      return await Projects.addEntity(args._id, args.entity);
    },
    addProjectEntities: async (
      _parent: any,
      args: { _id: string; entities: string[] },
    ) => {
      return await Projects.addEntities(args._id, args.entities);
    },
    removeProjectEntity: async (
      _parent: any,
      args: { _id: string; entity: string },
    ) => {
      return await Projects.removeEntity(args._id, args.entity);
    },
  },
};
