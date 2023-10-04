// Libraries
import express from "express";
import _ from "lodash";

// Database connection
import { ProjectModel, IProject } from "@types";

// Operations
import { Projects } from "../operations/Projects";

// Utility functions and libraries
import { authenticate } from "src/util";

const ProjectsRoute = express.Router();

// View all Projects
ProjectsRoute.route("/projects").get(
  authenticate,
  (_request: any, response: any) => {
    Projects.getAll().then((projects: ProjectModel[]) => {
      response.json(projects);
    });
  }
);

// View a specific Project
ProjectsRoute.route("/projects/:id").get(
  authenticate,
  (request: any, response: any) => {
    Projects.getOne(request.params.id).then((project: ProjectModel) => {
      response.json(project);
    });
  }
);

// Create a new Project, expects Project data
ProjectsRoute.route("/projects/create").post(
  authenticate,
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
  authenticate,
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
  authenticate,
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
  authenticate,
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
  authenticate,
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
  authenticate,
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
