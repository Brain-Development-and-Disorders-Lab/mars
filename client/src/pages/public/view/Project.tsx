// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Flex } from "@chakra-ui/react";
import { Content } from "@components/Container";
import ProjectBreadcrumb from "@components/ProjectBreadcrumb";
import ProjectOverviewCard from "@components/ProjectOverviewCard";
import ProjectEntitiesTable from "@components/ProjectEntitiesTable";
import { toaster } from "@components/Toast";

// Existing and custom types
import { ProjectModel, IGenericItem, EntityModel } from "@types";

// Apollo client imports
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Routing and navigation
import { useParams, useNavigate } from "react-router-dom";

// Utility functions and libraries
import _ from "lodash";
import { getPublicWorkspaceUrl } from "@lib/util";

export const Project = () => {
  const { id: workspace, project } = useParams();

  // Workspace information
  const [workspaceName, setWorkspaceName] = useState("");

  // Navigation and routing
  const navigate = useNavigate();

  // Project state
  const [projectName, setProjectName] = useState("");
  const [projectArchived, setProjectArchived] = useState(false);
  const [projectOwner, setProjectOwner] = useState("");
  const [projectCreated, setProjectCreated] = useState("");
  const [projectEntities, setProjectEntities] = useState([] as string[]);
  const [projectEntitiesData, setProjectEntitiesData] = useState<EntityModel[]>([]);
  const [projectDescription, setProjectDescription] = useState("");

  // Execute GraphQL query both on page load and navigation
  const GET_PROJECT_WITH_ENTITIES = gql`
    query GetProjectWithEntities($_id: String, $workspace: String) {
      project(_id: $_id) {
        _id
        name
        archived
        created
        description
        owner
        entities
        history {
          message
          author
          name
          timestamp
          version
          created
          description
          entities
        }
      }
      projectEntities(_id: $_id) {
        _id
        name
        description
        attributes {
          _id
          name
        }
      }
      workspace(_id: $workspace) {
        _id
        name
      }
    }
  `;
  const { loading, error, data } = useQuery<{
    project: ProjectModel;
    projectEntities: EntityModel[];
    workspace: IGenericItem;
  }>(GET_PROJECT_WITH_ENTITIES, {
    variables: {
      _id: project,
      workspace: workspace,
    },
    fetchPolicy: "no-cache",
    context: {
      uri: getPublicWorkspaceUrl(workspace ?? ""),
    },
  });

  // Manage data once retrieved
  useEffect(() => {
    if (data?.project) {
      setProjectName(data.project.name);
      setProjectArchived(data.project.archived);
      setProjectOwner(data.project.owner);
      setProjectCreated(data.project.created);
      setProjectDescription(data.project.description);
      setProjectEntities(data.project.entities);
    }

    if (data?.projectEntities) {
      setProjectEntitiesData(data.projectEntities);
    }

    if (data?.workspace) {
      setWorkspaceName(data.workspace.name);
    }
  }, [data]);

  // Display error messages from GraphQL usage
  useEffect(() => {
    if ((!loading && _.isUndefined(data)) || error) {
      // Raised GraphQL error
      toaster.create({
        title: "Error",
        description: "Unable to retrieve Project information",
        type: "error",
        duration: 4000,
        closable: true,
      });
    }
  }, [loading, error]);

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading}>
      <Flex direction={"column"}>
        <Flex gap={"2"} p={"1"} direction={"row"} justify={"space-between"} align={"center"} wrap={"wrap"}>
          <ProjectBreadcrumb
            loading={loading}
            workspaceName={workspaceName}
            onNavigateHome={() => navigate(`/public/${workspace}`)}
            onNavigateProjects={() => navigate(`/public/${workspace}/projects`)}
            archived={projectArchived}
            name={projectName}
          />
        </Flex>

        <Flex direction={"column"} gap={"2"} pt={"0"} p={"1"}>
          {/* Project Overview and Description */}
          <ProjectOverviewCard
            name={projectName}
            nameReadOnly
            owner={projectOwner}
            created={projectCreated}
            visibilityIsPublic={true}
            description={projectDescription}
            descriptionReadOnly
            workspace={workspace}
            isPublic
          />

          {/* Project Entities */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
            <ProjectEntitiesTable
              entities={projectEntitiesData}
              entityCount={projectEntities.length}
              editing={false}
              workspace={workspace}
              isPublic
              onView={(entityId) => navigate(`/public/${workspace}/entities/${entityId}`)}
            />
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Project;
