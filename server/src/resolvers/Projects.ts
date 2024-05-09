import { Projects } from "src/models/Projects"

export const ProjectsResolvers = {
  Query: {
    // Retrieve all Projects
    projects: async () => await Projects.all(),

    // Retrieve one Project by _id
    project: async (_parent: any, args: { _id: string }) => {
      const projects = await Projects.all();
      return projects.find((project) => project._id.toString() === args._id);
    },
  }
}
