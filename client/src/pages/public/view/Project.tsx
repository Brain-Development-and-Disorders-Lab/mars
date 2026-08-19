// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, EmptyState, Flex, Heading, Input, Text, Textarea, Breadcrumb, SkeletonText } from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import { AttributeTag, EmptyTag } from "@components/FieldTag";
import FieldTagList from "@components/FieldTagList";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import DataTable from "@components/DataTable";
import TimestampTag from "@components/TimestampTag";
import VisibilityTag from "@components/VisibilityTag";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";
import { createColumnHelper } from "@tanstack/react-table";

// Existing and custom types
import { ProjectModel, DataTableAction, IGenericItem, EntityModel, AttributeModel } from "@types";

// Apollo client imports
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Routing and navigation
import { useParams, useNavigate } from "react-router-dom";

// Hooks
import { useBreakpoint } from "@hooks/useBreakpoint";

// Utility functions and libraries
import _ from "lodash";
import { getPublicWorkspaceUrl } from "@lib/util";

// Variables
import { STYLES } from "@variables";

// Row shape for the Entities table; description and attributes are undefined until fetched
type EntityTableRow = {
  _id: string;
  description?: string;
  attributes?: AttributeModel[];
};

export const Project = () => {
  const { id: workspace, project } = useParams();

  // Workspace information
  const [workspaceName, setWorkspaceName] = useState("");

  // Breakpoints
  const { isBreakpointActive } = useBreakpoint();

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

  // Define the columns for Entities listing
  const columnHelper = createColumnHelper<EntityTableRow>();
  const entitiesColumns = [
    columnHelper.accessor("_id", {
      cell: (info) => {
        const entityId = info.getValue();
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Linky id={entityId} type={"entities"} workspace={workspace} isPublic />
            <Button
              size="2xs"
              mx={"1"}
              variant="subtle"
              colorPalette="gray"
              aria-label={"View Entity"}
              onClick={() => navigate(`/public/${workspace}/entities/${entityId}`)}
            >
              View
              <Icon name={"a_right"} size={"xs"} />
            </Button>
          </Flex>
        );
      },
      header: "Name",
      meta: {
        minWidth: 360,
      },
    }),
    columnHelper.accessor("description", {
      cell: (info) => {
        const description = info.getValue();
        if (_.isUndefined(description)) {
          return <SkeletonText noOfLines={1} />;
        }
        if (_.isEqual(description, "")) {
          return <EmptyTag label={"Description"} />;
        }
        return (
          <Flex>
            <Tooltip content={description} disabled={description.length < 64} showArrow>
              <Text fontSize={"xs"}>{_.truncate(description, { length: 64 })}</Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Description",
      enableHiding: true,
      meta: {
        minWidth: 400,
      },
    }),
    columnHelper.accessor("attributes", {
      cell: (info) => {
        const attributes = info.getValue();
        if (_.isUndefined(attributes)) {
          return <SkeletonText noOfLines={1} />;
        }
        return (
          <FieldTagList
            items={attributes}
            max={2}
            emptyLabel={"Attributes"}
            getKey={(attribute) => attribute._id}
            renderTag={(attribute) => <AttributeTag attribute={attribute} />}
          />
        );
      },
      header: "Attributes",
      meta: {
        minWidth: 120,
      },
    }),
  ];
  const entitiesTableActions: DataTableAction[] = [];

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading}>
      <Flex direction={"column"}>
        <Flex gap={"2"} p={"1"} direction={"row"} justify={"space-between"} align={"center"} wrap={"wrap"}>
          {/* Breadcrumbs */}
          <Flex align={"center"} gap={"2"} ml={"0.5"}>
            <Breadcrumb.Root>
              <Breadcrumb.List>
                <Breadcrumb.Item
                  gap={"1"}
                  onClick={() => navigate(`/public/${workspace}`)}
                  _hover={{
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  <Icon name={"workspace"} size={"xs"} color={"black"} />
                  {loading ? (
                    <SkeletonText noOfLines={1} w={"80px"} my={"0.5"} h={"16px"} loading={loading} />
                  ) : (
                    _.truncate(workspaceName, { length: isBreakpointActive("md", "down") ? 12 : 24 })
                  )}
                </Breadcrumb.Item>
                <Breadcrumb.Separator />
                <Breadcrumb.Item
                  gap={"1"}
                  onClick={() => navigate(`/public/${workspace}/projects`)}
                  _hover={{
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  <Icon size={"xs"} name={"project"} color={STYLES.project.color.icon} />
                  Projects
                </Breadcrumb.Item>
                <Breadcrumb.Separator />
              </Breadcrumb.List>
            </Breadcrumb.Root>

            <Flex direction={"row"} gap={"2"} align={"center"} p={"0"} m={"0"}>
              <Flex
                id={"projectNameTag"}
                align={"center"}
                gap={"1"}
                p={"1"}
                border={"2px solid"}
                borderColor={projectArchived ? "gray.500" : STYLES.project.color.icon}
                bg={projectArchived ? STYLES.card.bg : STYLES.project.color.light}
                rounded={"md"}
              >
                <Icon name={"project"} size={"sm"} color={projectArchived ? "gray.500" : STYLES.project.color.icon} />
                <Tooltip content={`${projectArchived ? "Archived: " : ""}${projectName}`} showArrow>
                  <Heading fontWeight={"semibold"} size={"sm"}>
                    {_.truncate(projectName, { length: 30 })}
                  </Heading>
                </Tooltip>
                {projectArchived && <Icon name={"archive"} size={"sm"} color={"text.subtle"} />}
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        <Flex direction={"column"} gap={"2"} pt={"0"} p={"1"}>
          {/* Project Overview and Description */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
            {/* Overview */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              rounded={"md"}
              grow={"1"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={"surface.card"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              {/* "Name" field */}
              <Flex gap={"2"} direction={"row"} wrap={"wrap"}>
                <Flex direction={"column"} gap={"2"} grow={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Name
                  </Text>
                  <Input
                    id={"projectNameInput"}
                    size={"xs"}
                    rounded={"md"}
                    value={projectName}
                    readOnly={true}
                    bg={"white"}
                    border={STYLES.border.style}
                    borderColor={STYLES.border.color}
                  />
                </Flex>
              </Flex>

              <Flex gap={"2"} direction={"row"} wrap={"wrap"}>
                <Flex direction={"column"} gap={"2"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Owner
                  </Text>
                  <ActorTag identifier={projectOwner} fallback={"Unknown User"} size={"sm"} isPublic />
                </Flex>

                <Flex direction={"column"} gap={"2"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Timestamp
                  </Text>
                  <TimestampTag timestamp={projectCreated} description={"Created"} />
                </Flex>

                <Flex direction={"column"} gap={"2"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Visibility
                  </Text>
                  <VisibilityTag isPublic={false} isInherited />
                </Flex>
              </Flex>
            </Flex>

            {/* Description */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"100%"}
              gap={"2"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={"surface.card"}
              rounded={"md"}
              grow={"1"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                Description
              </Text>
              <Textarea
                id={"projectDescriptionInput"}
                value={projectDescription}
                size={"xs"}
                h={"100%"}
                readOnly={true}
              />
            </Flex>
          </Flex>

          {/* Project Entities */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
            {/* Entities */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              rounded={"md"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={"surface.card"}
              grow={"1"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Flex direction={"row"} justify={"space-between"} align={"center"}>
                {/* Entities in the Project */}
                <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
                  <Icon name={"entity"} size={"xs"} color={STYLES.entity.color.icon} />
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                    Entities ({projectEntities.length})
                  </Text>
                </Flex>
              </Flex>
              <Flex
                w={"100%"}
                justify={"center"}
                align={"center"}
                minH={projectEntities.length > 0 ? "fit-content" : "200px"}
              >
                {projectEntities && projectEntities.length > 0 ? (
                  <DataTable
                    data={projectEntitiesData}
                    columns={entitiesColumns}
                    visibleColumns={{}}
                    selectedRows={{}}
                    viewOnly={true}
                    showSelection={true}
                    actions={entitiesTableActions}
                    showPagination
                  />
                ) : (
                  <EmptyState.Root>
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <Icon name={"entity"} size={"lg"} color={STYLES.entity.color.default} />
                      </EmptyState.Indicator>
                      <EmptyState.Description>No Entities</EmptyState.Description>
                    </EmptyState.Content>
                  </EmptyState.Root>
                )}
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Project;
