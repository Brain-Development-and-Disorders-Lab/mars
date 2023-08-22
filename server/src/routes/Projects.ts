// Libraries
import express from "express";
import _ from "lodash";

// Database connection
import { ProjectModel, IProject } from "@types";

// Operations
import { Projects } from "../operations/Projects";

const ProjectsRoute = express.Router();

// View all Projects
ProjectsRoute.route("/projects").get((_request: any, response: any) => {
  Projects.getAll().then((projects: ProjectModel[]) => {
    response.json(projects);
  });
});

// View a specific Project
ProjectsRoute.route("/projects/:id").get(
  (request: any, response: any) => {
    Projects.getOne(request.params.id).then(
      (project: ProjectModel) => {
        response.json(project);
      }
    );
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

/**
 * Route: Add an Entity to a Project, expects Entity and Project ID data.
 */
ProjectsRoute.route("/projects/add").post(
  (
    request: { body: { project: string; entity: string } },
    response: any
  ) => {
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
    Projects.update(request.body).then(
      (updatedProject: ProjectModel) => {
        response.json({
          id: updatedProject._id,
          name: updatedProject.name,
          status: "success",
        });
      }
    );
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

/**
 * Route: Remove an Entity from a Project, expects Entity and Project ID data.
 */
ProjectsRoute.route("/projects/remove").post(
  (
    request: { body: { entity: string; project: string } },
    response: any
  ) => {
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
