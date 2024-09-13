// Custom types
import { Context, IProject, ProjectModel } from "@types";

// Utility functions and libraries
import { GraphQLError } from "graphql";
import _ from "lodash";

// Models
import { Activity } from "../models/Activity";
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
      // Apply create operation
      const result = await Projects.create(args.project);

      if (result.success) {
        // Add the Project to the Workspace
        await Workspaces.addProject(context.workspace, result.message);

        // Create a new Activity entry
        const activity = await Activity.create({
          timestamp: new Date(),
          type: "create",
          actor: context.user,
          details: "Created new Project",
          target: {
            _id: result.message,
            type: "projects",
            name: args.project.name,
          },
        });

        // Add Activity to Workspace
        await Workspaces.addActivity(context.workspace, activity.message);
      }

      return result;
    },

    updateProject: async (
      _parent: any,
      args: { project: ProjectModel },
      context: Context,
    ) => {
      const project = await Projects.getOne(args.project._id);
      if (_.isNull(project)) {
        throw new GraphQLError("Project does not exist", {
          extensions: {
            code: "NON_EXIST",
          },
        });
      }

      // Apply update operation
      const result = await Projects.update(args.project);

      if (result.success) {
        const activity = await Activity.create({
          timestamp: new Date(),
          type: "update",
          actor: context.user,
          details: "Updated existing Project",
          target: {
            _id: project._id,
            type: "projects",
            name: project.name,
          },
        });

        // Add Activity to Workspace
        await Workspaces.addActivity(context.workspace, activity.message);
      }

      return result;
    },

    archiveProject: async (
      _parent: any,
      args: { _id: string; state: boolean },
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

      const result = await Projects.setArchived(args._id, args.state);

      if (result.success) {
        const activity = await Activity.create({
          timestamp: new Date(),
          type: "archived",
          actor: context.user,
          details: args.state ? "Archived Project" : "Restored Project",
          target: {
            _id: project._id,
            type: "projects",
            name: project.name,
          },
        });

        // Add Activity to Workspace
        await Workspaces.addActivity(context.workspace, activity.message);
      }

      return result;
    },

    deleteProject: async (
      _parent: any,
      args: { _id: string },
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

      const result = await Projects.delete(args._id);

      if (result.success) {
        const activity = await Activity.create({
          timestamp: new Date(),
          type: "delete",
          actor: context.user,
          details: "Deleted Project",
          target: {
            _id: project._id,
            type: "projects",
            name: project.name,
          },
        });

        // Add Activity to Workspace
        await Workspaces.addActivity(context.workspace, activity.message);
      }

      return result;
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
