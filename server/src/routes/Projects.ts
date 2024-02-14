// Libraries
import express from "express";
import _ from "lodash";

// Database connection
import { ProjectModel, IProject } from "@types";

// Operations
import { Projects } from "../operations/Projects";
import { Authentication } from "../operations/Authentication";

// Utility functions and libraries
// Middleware to check project ownership
export const checkProjectOwnership = async (req: any, res: any, next: any) => {
  try {
    if (_.isEqual(process.env.NODE_ENV, "development")) {
      next();
      return;
    }
    console.log("Checking project ownership for user:");
    const projectId = req.params.id; // Assuming the project ID is passed as a URL parameter
    let userId = req?.user?._id; // Assuming the user's ID is attached to the request object
    const token = req.headers['id_token']; // Bearer <token>
    console.log("userId:", userId);

    if (!userId) {
      // Validate the token
      if (!token) {
        return res.status(401).json({ message: 'No token provided.' });
      }
      const isUser = await Authentication.validate(token) as any;
      if (!isUser) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
      }
      userId = isUser?._id;
      if (!userId) {

        return res.status(400).json({ message: "User not provided." });
      }
    }
    const project = await Projects.getOne(projectId); // Fetch the project details

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    if (project.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: "User is not the owner of this project." });
    }

    // If checks pass, attach project to request and proceed
    req.project = project;
    next();
  } catch (error) {
    console.error("Error checking project ownership:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const ProjectsRoute = express.Router();

// View all Projects
ProjectsRoute.route("/projects").get(
  (_request: any, response: any) => {
    console.log("Getting all projects");
    Projects.getAll().then((projects: ProjectModel[]) => {
      response.json(projects);
    });
  }
);

// View a specific Project
ProjectsRoute.route("/projects/:id").get(
  checkProjectOwnership,
  (request: any, response: any) => {
    Projects.getOne(request.params.id).then((project: ProjectModel) => {
      response.json(project);
    });
  }
);

// Create a new Project, expects Project data
ProjectsRoute.route("/projects/create").post(
  (request: { body: IProject }, response: any) => {
    Projects.create(request.body).then((project: ProjectModel) => {
      response.json({
        id: project._id,
        name: project.name,
        status: "success",
      });
    });
  }
);

// Route: Add an Entity to a Project, expects Entity and Project ID data.
ProjectsRoute.route("/projects/add").post(
  (request: { body: { project: string; entity: string } }, response: any) => {
    Projects.addEntity(request.body.project, request.body.entity).then(
      (entity) => {
        response.json({
          id: entity,
          status: "success",
        });
      }
    );
  }
);

// Route: Update a Project
ProjectsRoute.route("/projects/update").post(
  (request: { body: ProjectModel }, response: any) => {
    Projects.update(request.body).then((updatedProject: ProjectModel) => {
      response.json({
        id: updatedProject._id,
        name: updatedProject.name,
        status: "success",
      });
    });
  }
);

// Get JSON-formatted data of the Entity
ProjectsRoute.route("/projects/export").post(
  (
    request: {
      body: { id: string; fields: string[]; format: "json" | "csv" | "txt" };
    },
    response: any
  ) => {
    Projects.getData(request.body).then((path: string) => {
      response.setHeader("Content-Type", `application/${request.body.format}`);
      response.download(
        path,
        `export_${request.body.id}.${request.body.format}`
      );
    });
  }
);

// Route: Remove an Entity from a Project, expects Entity and Project ID data.
ProjectsRoute.route("/projects/remove").post(
  (request: { body: { entity: string; project: string } }, response: any) => {
    Projects.removeEntity(request.body.project, request.body.entity).then(
      (project) => {
        response.json({
          id: project,
          name: project,
          status: "success",
        });
      }
    );
  }
);

// Route: Remove a Project
ProjectsRoute.route("/projects/:id").delete(
  (request: { params: { id: any } }, response: any) => {
    Projects.delete(request.params.id).then((project) => {
      response.json({
        id: project._id,
        name: project.name,
        status: "success",
      });
    });
  }
);

export default ProjectsRoute;
