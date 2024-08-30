// Custom types
import { Context, IProject, ProjectModel } from "@types";

// Utility functions and libraries
import { GraphQLError } from "graphql";
import _ from "lodash";

// Models
import { Projects } from "../models/Projects";
import { Workspaces } from "../models/Workspaces";

export const ProjectsResolvers = {
  Query: {
    // Retrieve all Projects
    projects: async (_parent: any, args: { limit: 100 }, context: Context) => {
      // Check Workspace exists
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Filter by ownership and Workspace membership
      const projects = await Projects.all();
      return projects
        .filter((project) => _.includes(workspace.projects, project._id))
        .slice(0, args.limit);
    },

    // Retrieve one Project by _id
    project: async (_parent: any, args: { _id: string }, context: Context) => {
      // Check Workspace exists
      const workspace = await Workspaces.getOne(context.workspace);
      if (_.isNull(workspace)) {
        throw new GraphQLError("Workspace does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Check that Project exists
      const project = await Projects.getOne(args._id);
      if (_.isNull(project)) {
        throw new GraphQLError("Project does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      if (
        project.owner === context.user &&
        _.includes(workspace.projects, project._id)
      ) {
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

    exportProjectEntities: async (
      _parent: any,
      args: { _id: string; format: "json" },
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
        return await Projects.exportEntities(args._id, args.format);
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
    createProject: async (
      _parent: any,
      args: { project: IProject },
      context: Context,
    ) => {
      return await Projects.create(args.project, context.workspace);
    },
    updateProject: async (
      _parent: any,
      args: { project: ProjectModel },
      context: Context,
    ) => {
      return await Projects.update(args.project, context.workspace);
    },
    deleteProject: async (
      _parent: any,
      args: { _id: string },
      context: Context,
    ) => {
      return await Projects.delete(args._id, context.workspace);
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
