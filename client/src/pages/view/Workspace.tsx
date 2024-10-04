// React and Chakra UI components
import React, { useEffect, useState } from "react";
import {
  Flex,
  Spacer,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  IconButton,
  Textarea,
  Text,
  useToast,
  Tooltip,
  useBreakpoint,
  Heading,
} from "@chakra-ui/react";

// Custom components
import Icon from "@components/Icon";
import DataTable from "@components/DataTable";
import { Content } from "@components/Container";
import ActorTag from "@components/ActorTag";

// Custom types
import {
  DataTableAction,
  IGenericItem,
  IResponseMessage,
  WorkspaceModel,
} from "@types";

// GraphQL imports
import { gql, useLazyQuery, useMutation } from "@apollo/client";

// Navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import { createColumnHelper } from "@tanstack/react-table";
import _ from "lodash";

// Contexts
import { useWorkspace } from "src/hooks/useWorkspace";
import { useAuthentication } from "src/hooks/useAuthentication";

const Workspace = () => {
  const toast = useToast();
  const breakpoint = useBreakpoint();
  const navigate = useNavigate();

  // Authentication
  const { token } = useAuthentication();

  // Query to get a Workspace
  const GET_WORKSPACE = gql`
    query GetWorkspace($_id: String) {
      workspace(_id: $_id) {
        _id
        name
        owner
        description
        collaborators
      }
    }
  `;
  const [getWorkspace, { loading: workspaceLoading, error: workspaceError }] =
    useLazyQuery<{
      workspace: WorkspaceModel;
    }>(GET_WORKSPACE, { fetchPolicy: "network-only" });

  // Queries
  const GET_WORKSPACE_DATA = gql`
    query GetWorkspaceData($archived: Boolean) {
      projects {
        _id
        name
        archived
      }
      entities(archived: $archived) {
        _id
        name
        archived
      }
      attributes {
        _id
        name
        archived
      }
    }
  `;
  const [
    getWorkspaceData,
    { loading: workspaceDataLoading, error: workspaceDataError },
  ] = useLazyQuery<{
    entities: (IGenericItem & { archived: boolean })[];
    projects: (IGenericItem & { archived: boolean })[];
    attributes: (IGenericItem & { archived: boolean })[];
  }>(GET_WORKSPACE_DATA, {
    fetchPolicy: "network-only",
    variables: {
      archived: true,
    },
  });

  // Mutation to archive Entities
  const ARCHIVE_ENTITIES = gql`
    mutation ArchiveEntities($toArchive: [String], $state: Boolean) {
      archiveEntities(toArchive: $toArchive, state: $state) {
        success
        message
      }
    }
  `;
  const [
    archiveEntitiesQuery,
    { error: archiveEntitiesError, loading: archiveEntitiesLoading },
  ] = useMutation(ARCHIVE_ENTITIES);

  // Mutation to archive Projects
  const ARCHIVE_PROJECTS = gql`
    mutation ArchiveProjects($toArchive: [String], $state: Boolean) {
      archiveProjects(toArchive: $toArchive, state: $state) {
        success
        message
      }
    }
  `;
  const [
    archiveProjectsQuery,
    { error: archiveProjectsError, loading: archiveProjectsLoading },
  ] = useMutation(ARCHIVE_PROJECTS);

  // Mutation to archive Attributes
  const ARCHIVE_ATTRIBUTES = gql`
    mutation ArchiveAttributes($toArchive: [String], $state: Boolean) {
      archiveAttributes(toArchive: $toArchive, state: $state) {
        success
        message
      }
    }
  `;
  const [
    archiveAttributesQuery,
    { error: archiveAttributesError, loading: archiveAttributesLoading },
  ] = useMutation(ARCHIVE_ATTRIBUTES);

  // Mutation to update Workspace
  const UPDATE_WORKSPACE = gql`
    mutation UpdateWorkspace($workspace: WorkspaceUpdateInput) {
      updateWorkspace(workspace: $workspace) {
        success
        message
      }
    }
  `;
  const [
    updateWorkspace,
    { loading: workspaceUpdateLoading, error: workspaceUpdateError },
  ] = useMutation<IResponseMessage>(UPDATE_WORKSPACE);

  // State for Workspace details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");

  // State for Workspace contents
  const [entities, setEntities] = useState(
    [] as (IGenericItem & { archived: boolean })[],
  );
  const [projects, setProjects] = useState(
    [] as (IGenericItem & { archived: boolean })[],
  );
  const [attributes, setAttributes] = useState(
    [] as (IGenericItem & { archived: boolean })[],
  );
  const [shownEntities, setShownEntities] = useState(
    [] as (IGenericItem & { archived: boolean })[],
  );
  const [selectedEntities, setSelectedEntities] = useState({});
  const [shownProjects, setShownProjects] = useState(
    [] as (IGenericItem & { archived: boolean })[],
  );
  const [selectedProjects, setSelectedProjects] = useState({});
  const [shownAttributes, setShownAttributes] = useState(
    [] as (IGenericItem & { archived: boolean })[],
  );
  const [selectedAttributes, setSelectedAttributes] = useState({});

  // State for Workspace content presentation (show archived or not)
  const [showArchived, setShowArchived] = useState(false);

  // State for Workspace collaborators
  const [collaborator, setCollaborator] = useState("");
  const [collaborators, setCollaborators] = useState([] as string[]);

  const { workspace } = useWorkspace();

  useEffect(() => {
    const refreshWorkspace = async () => {
      // Get the Workspace information
      const workspaceResult = await getWorkspace({
        variables: {
          _id: workspace,
        },
      });
      if (workspaceResult.data?.workspace) {
        setName(workspaceResult.data.workspace.name);
        setOwner(workspaceResult.data.workspace.owner);
        setDescription(workspaceResult.data.workspace.description);
        setCollaborators(workspaceResult.data.workspace.collaborators);
      }

      // Get all Workspace data
      const workspaceData = await getWorkspaceData();
      if (workspaceData.data?.entities) {
        setEntities(workspaceData.data.entities);
        setShownEntities([
          ...workspaceData.data.entities.filter(
            (entity) => entity.archived === showArchived,
          ),
        ]);
        setSelectedEntities({});
      }
      if (workspaceData.data?.projects) {
        setProjects(workspaceData.data.projects);
        setShownProjects([
          ...workspaceData.data.projects.filter(
            (project) => project.archived === showArchived,
          ),
        ]);
        setSelectedProjects({});
      }
      if (workspaceData.data?.attributes) {
        setAttributes(workspaceData.data.attributes);
        setShownAttributes([
          ...workspaceData.data.attributes.filter(
            (attribute) => attribute.archived === showArchived,
          ),
        ]);
        setSelectedAttributes({});
      }

      if (workspaceError || workspaceDataError) {
        toast({
          title: "Error",
          description: "Unable to refresh Workspace information",
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      }
    };

    // Refresh the Workspace information when the identifier changes
    refreshWorkspace();
  }, [workspace]);

  // Effect to manage what contents are shown when `showArchived` is changed or archive state changed
  useEffect(() => {
    setShownEntities([
      ...entities.filter((entity) => entity.archived === showArchived),
    ]);
    setSelectedEntities({});
    setShownProjects([
      ...projects.filter((project) => project.archived === showArchived),
    ]);
    setSelectedProjects({});
    setShownAttributes([
      ...attributes.filter((attribute) => attribute.archived === showArchived),
    ]);
    setSelectedAttributes({});
  }, [entities, projects, attributes, showArchived]);

  /**
   * Handler function for modal `Done` button, apply updates to the Workspace
   */
  const handleUpdateClick = async () => {
    await updateWorkspace({
      variables: {
        workspace: {
          _id: workspace,
          name: name,
          description: description,
          owner: owner,
          collaborators: collaborators,
          entities: entities.map((e) => e._id),
          projects: projects.map((p) => p._id),
          attributes: attributes.map((a) => a._id),
        },
      },
    });

    // Update Entity archive state
    await archiveEntitiesQuery({
      variables: {
        toArchive: entities
          .filter((entity) => entity.archived === true)
          .map((entity) => entity._id),
        state: true,
      },
    });
    await archiveEntitiesQuery({
      variables: {
        toArchive: entities
          .filter((entity) => entity.archived === false)
          .map((entity) => entity._id),
        state: false,
      },
    });

    // Update Project archive state
    await archiveProjectsQuery({
      variables: {
        toArchive: projects
          .filter((project) => project.archived === true)
          .map((project) => project._id),
        state: true,
      },
    });
    await archiveProjectsQuery({
      variables: {
        toArchive: projects
          .filter((project) => project.archived === false)
          .map((project) => project._id),
        state: false,
      },
    });

    // Update Attribute archive state
    await archiveAttributesQuery({
      variables: {
        toArchive: attributes
          .filter((attribute) => attribute.archived === true)
          .map((attribute) => attribute._id),
        state: true,
      },
    });
    await archiveAttributesQuery({
      variables: {
        toArchive: attributes
          .filter((attribute) => attribute.archived === false)
          .map((attribute) => attribute._id),
        state: false,
      },
    });

    if (workspaceUpdateError) {
      toast({
        title: "Error",
        description: "Unable to update Workspace",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    } else if (archiveEntitiesError) {
      toast({
        title: "Error",
        description: "Unable to apply archive state to Entities",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    } else if (archiveProjectsError) {
      toast({
        title: "Error",
        description: "Unable to apply archive state to Projects",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    } else if (archiveAttributesError) {
      toast({
        title: "Error",
        description: "Unable to apply archive state to Attributes",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    } else {
      navigate("/");
    }
  };

  const truncateTableText =
    _.isEqual(breakpoint, "sm") ||
    _.isEqual(breakpoint, "base") ||
    _.isUndefined(breakpoint);

  // Utility functions for archiving or restoring Workspace contents
  const archiveEntity = async (_id: string, state: boolean) => {
    // Clone and update the local collection of Entities
    const updated = _.cloneDeep(entities);
    updated.map((entity) => {
      if (_.isEqual(entity._id, _id)) {
        entity.archived = state;
      }
    });
    setEntities(updated);
  };

  const archiveEntities = (toArchive: string[], state: boolean) => {
    const updated = _.cloneDeep(entities);
    updated.map((entity) => {
      if (_.includes(toArchive, entity._id)) {
        entity.archived = state;
      }
    });
    setEntities(updated);
  };

  const archiveProject = async (_id: string, state: boolean) => {
    // Clone and update the local collection of Projects
    const updated = _.cloneDeep(projects);
    updated.map((project) => {
      if (_.isEqual(project._id, _id)) {
        project.archived = state;
      }
    });
    setProjects(updated);
  };

  const archiveProjects = (toArchive: string[], state: boolean) => {
    const updated = _.cloneDeep(projects);
    updated.map((project) => {
      if (_.includes(toArchive, project._id)) {
        project.archived = state;
      }
    });
    setProjects(updated);
  };

  const archiveAttribute = async (_id: string, state: boolean) => {
    // Clone and update the local collection of Attributes
    const updated = _.cloneDeep(attributes);
    updated.map((attribute) => {
      if (_.isEqual(attribute._id, _id)) {
        attribute.archived = state;
      }
    });
    setAttributes(updated);
  };

  const archiveAttributes = (toArchive: string[], state: boolean) => {
    const updated = _.cloneDeep(attributes);
    updated.map((attribute) => {
      if (_.includes(toArchive, attribute._id)) {
        attribute.archived = state;
      }
    });
    setAttributes(updated);
  };

  // Setup `DataTable` components
  const entitiesTableColumnHelper = createColumnHelper<IGenericItem>();
  const entitiesTableColumns = [
    entitiesTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Tooltip label={info.getValue()} hasArrow>
            <Text>
              {_.truncate(info.getValue(), {
                length: truncateTableText ? 12 : 24,
              })}
            </Text>
          </Tooltip>
        );
      },
      header: "Name",
    }),
    entitiesTableColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex w={"100%"} justify={"end"} p={"0.5"} gap={"2"}>
            <IconButton
              icon={<Icon name={"view"} />}
              size={"sm"}
              aria-label={"View Entity"}
              onClick={() => navigate(`/entities/${info.row.original._id}`)}
            />
            <IconButton
              icon={<Icon name={showArchived ? "rewind" : "archive"} />}
              size={"sm"}
              aria-label={"Archive Entity"}
              colorScheme={"orange"}
              onClick={() =>
                archiveEntity(info.row.original._id, !showArchived)
              }
            />
          </Flex>
        );
      },
      header: "",
    }),
  ];
  const entitiesTableActions: DataTableAction[] = [
    {
      label: showArchived ? "Restore Entities" : "Archive Entities",
      icon: showArchived ? "rewind" : "archive",
      action(table, rows) {
        const entitiesToArchive: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          entitiesToArchive.push(table.getRow(rowIndex).original._id);
        }
        archiveEntities(entitiesToArchive, !showArchived);
      },
    },
  ];

  const projectsTableColumnHelper = createColumnHelper<IGenericItem>();
  const projectsTableColumns = [
    projectsTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Tooltip label={info.getValue()} hasArrow>
            <Text>
              {_.truncate(info.getValue(), {
                length: truncateTableText ? 12 : 24,
              })}
            </Text>
          </Tooltip>
        );
      },
      header: "Name",
    }),
    projectsTableColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex w={"100%"} justify={"end"} p={"0.5"} gap={"2"}>
            <IconButton
              icon={<Icon name={"view"} />}
              size={"sm"}
              aria-label={"View Project"}
              onClick={() => navigate(`/projects/${info.row.original._id}`)}
            />
            <IconButton
              icon={<Icon name={showArchived ? "rewind" : "archive"} />}
              size={"sm"}
              aria-label={"Archive Project"}
              colorScheme={"orange"}
              onClick={() =>
                archiveProject(info.row.original._id, !showArchived)
              }
            />
          </Flex>
        );
      },
      header: "",
    }),
  ];
  const projectsTableActions: DataTableAction[] = [
    {
      label: showArchived ? "Restore Projects" : "Archive Projects",
      icon: showArchived ? "rewind" : "archive",
      action(table, rows) {
        const projectsToArchive: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          projectsToArchive.push(table.getRow(rowIndex).original._id);
        }
        archiveProjects(projectsToArchive, !showArchived);
      },
    },
  ];

  const attributesTableColumnHelper = createColumnHelper<IGenericItem>();
  const attributesTableColumns = [
    attributesTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Tooltip label={info.getValue()} hasArrow>
            <Text>
              {_.truncate(info.getValue(), {
                length: truncateTableText ? 12 : 24,
              })}
            </Text>
          </Tooltip>
        );
      },
      header: "Name",
    }),
    attributesTableColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex w={"100%"} justify={"end"} p={"0.5"} gap={"2"}>
            <IconButton
              icon={<Icon name={"view"} />}
              size={"sm"}
              aria-label={"View Attribute"}
              onClick={() => navigate(`/attributes/${info.row.original._id}`)}
            />
            <IconButton
              icon={<Icon name={showArchived ? "rewind" : "archive"} />}
              size={"sm"}
              aria-label={"Archive Attribute"}
              colorScheme={"orange"}
              onClick={() =>
                archiveAttribute(info.row.original._id, !showArchived)
              }
            />
          </Flex>
        );
      },
      header: "",
    }),
  ];
  const attributesTableActions: DataTableAction[] = [
    {
      label: showArchived ? "Restore Attributes" : "Archive Attributes",
      icon: showArchived ? "rewind" : "archive",
      action(table, rows) {
        const attributesToArchive: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          attributesToArchive.push(table.getRow(rowIndex).original._id);
        }
        archiveAttributes(attributesToArchive, !showArchived);
      },
    },
  ];

  return (
    <Content
      isError={
        !_.isUndefined(workspaceDataError) || !_.isUndefined(workspaceError)
      }
      isLoaded={!workspaceDataLoading && !workspaceLoading}
    >
      <Flex
        gap={"2"}
        p={"2"}
        pb={{ base: "2", lg: "0" }}
        direction={"row"}
        justify={"space-between"}
        align={"center"}
        wrap={"wrap"}
      >
        <Flex align={"center"} gap={"2"} p={"2"} border={"2px"} rounded={"md"}>
          <Icon name={"workspace"} size={"md"} />
          <Heading fontWeight={"semibold"} size={"md"}>
            {name}
          </Heading>
        </Flex>
        <Flex direction={"row"} align={"center"} gap={"2"}>
          <Button
            size={"sm"}
            rightIcon={<Icon name={"archive"} />}
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? "Hide" : "Show"} Archive
          </Button>
          <Button
            size={"sm"}
            colorScheme={"red"}
            rightIcon={<Icon name={"cross"} />}
            onClick={() => navigate("/")}
          >
            Cancel
          </Button>
          <Button
            id={"modalWorkspaceCreateButton"}
            size={"sm"}
            colorScheme={"green"}
            rightIcon={<Icon name={"check"} />}
            isDisabled={name === ""}
            isLoading={
              workspaceUpdateLoading ||
              archiveEntitiesLoading ||
              archiveProjectsLoading ||
              archiveAttributesLoading
            }
            onClick={() => handleUpdateClick()}
          >
            Done
          </Button>
        </Flex>
      </Flex>

      <Flex direction={"column"} gap={"2"} p={"2"}>
        <Flex direction={"row"} gap={"2"}>
          <Flex direction={"column"} p={"0"} gap={"2"} grow={"1"} basis={"50%"}>
            {/* Workspace name */}
            <Flex
              direction={"column"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.300"}
            >
              <FormControl isRequired>
                <FormLabel fontSize={"sm"} fontWeight={"semibold"}>
                  Name
                </FormLabel>
                <Input
                  id={"modalWorkspaceName"}
                  size={"sm"}
                  rounded={"md"}
                  placeholder={"Name"}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize={"sm"} fontWeight={"semibold"}>
                  Owner
                </FormLabel>
                <Flex>
                  <ActorTag orcid={owner} fallback={"Unkown User"} />
                </Flex>
              </FormControl>
            </Flex>

            {/* Workspace collaborators */}
            <Flex
              direction={"column"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.300"}
            >
              <Text fontSize={"sm"} fontWeight={"semibold"}>
                Collaborators
              </Text>
              <Text fontSize={"sm"} fontWeight={"semibold"} color={"gray.400"}>
                Add Collaborators by their ORCiD, and they will have access to
                this Workspace when they next sign into Metadatify.
              </Text>
              <Flex direction={"row"} gap={"2"} align={"center"}>
                <FormControl>
                  <Input
                    placeholder={"ORCiD"}
                    rounded={"md"}
                    size={"sm"}
                    value={collaborator}
                    onChange={(event) => setCollaborator(event.target.value)}
                  />
                </FormControl>
                <Spacer />
                <Button
                  colorScheme={"green"}
                  rightIcon={<Icon name={"add"} />}
                  size={"sm"}
                  isDisabled={collaborator === ""}
                  onClick={() => {
                    // Prevent adding empty or duplicate collaborator
                    if (collaborator && !collaborators.includes(collaborator)) {
                      setCollaborators((collaborators) => [
                        ...collaborators,
                        collaborator,
                      ]);
                      setCollaborator("");
                    }
                  }}
                >
                  Add
                </Button>
              </Flex>
              <Flex
                w={"100%"}
                justify={collaborators.length === 0 ? "center" : ""}
                align={"center"}
                minH={collaborators.length > 0 ? "fit-content" : "200px"}
              >
                {collaborators.length === 0 ? (
                  <Text color={"gray.400"} fontWeight={"semibold"}>
                    No Collaborators
                  </Text>
                ) : (
                  <VStack w={"100%"} spacing={"0"}>
                    {collaborators.map((collaborator, index) => (
                      <Flex
                        key={index}
                        align={"center"}
                        gap={"2"}
                        py={"2"}
                        w={"100%"}
                      >
                        <Flex>
                          <ActorTag
                            orcid={collaborator}
                            fallback={"Unknown Collaborator"}
                          />
                        </Flex>
                        <Spacer />
                        <IconButton
                          size={"sm"}
                          aria-label={"Remove collaborator"}
                          icon={
                            <Icon
                              name={
                                token.orcid === collaborator
                                  ? "b_right"
                                  : "delete"
                              }
                            />
                          }
                          colorScheme={
                            token.orcid === collaborator ? "orange" : "red"
                          }
                          onClick={() =>
                            setCollaborators((collaborators) =>
                              collaborators.filter(
                                (existing) => existing !== collaborator,
                              ),
                            )
                          }
                          isDisabled={
                            collaborator === owner && token.orcid !== owner
                          }
                        />
                      </Flex>
                    ))}
                  </VStack>
                )}
              </Flex>
            </Flex>

            {/* Workspace Attributes */}
            <Flex
              direction={"column"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.300"}
            >
              <FormControl>
                <FormLabel fontSize={"sm"} fontWeight={"semibold"}>
                  {showArchived ? "Archived " : ""}Attributes
                </FormLabel>
                <Flex
                  w={"100%"}
                  justify={"center"}
                  align={shownAttributes.length > 0 ? "" : "center"}
                  minH={shownAttributes.length > 0 ? "fit-content" : "200px"}
                >
                  {shownAttributes.length > 0 ? (
                    <DataTable
                      data={shownAttributes}
                      columns={attributesTableColumns}
                      visibleColumns={{}}
                      selectedRows={selectedAttributes}
                      actions={attributesTableActions}
                      showPagination
                      showSelection
                    />
                  ) : (
                    <Text color={"gray.400"} fontWeight={"semibold"}>
                      No {showArchived ? "archived " : ""}Attributes
                    </Text>
                  )}
                </Flex>
              </FormControl>
            </Flex>
          </Flex>

          <Flex direction={"column"} p={"0"} gap={"2"} grow={"1"} basis={"50%"}>
            {/* Workspace description */}
            <Flex
              direction={"column"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.300"}
            >
              <FormControl>
                <FormLabel fontSize={"sm"} fontWeight={"semibold"}>
                  Description
                </FormLabel>
                <Textarea
                  id={"modalWorkspaceDescription"}
                  size={"sm"}
                  rounded={"md"}
                  placeholder={"Description"}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </FormControl>
            </Flex>

            {/* Workspace Entities */}
            <Flex
              direction={"column"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.300"}
            >
              <FormControl>
                <FormLabel fontSize={"sm"} fontWeight={"semibold"}>
                  {showArchived ? "Archived " : ""}Entities
                </FormLabel>
                <Flex
                  w={"100%"}
                  justify={"center"}
                  align={shownEntities.length > 0 ? "" : "center"}
                  minH={shownEntities.length > 0 ? "fit-content" : "200px"}
                >
                  {shownEntities.length > 0 ? (
                    <DataTable
                      data={shownEntities}
                      columns={entitiesTableColumns}
                      visibleColumns={{}}
                      selectedRows={selectedEntities}
                      actions={entitiesTableActions}
                      showPagination
                      showSelection
                    />
                  ) : (
                    <Text color={"gray.400"} fontWeight={"semibold"}>
                      No {showArchived ? "archived " : ""}Entities
                    </Text>
                  )}
                </Flex>
              </FormControl>
            </Flex>

            {/* Workspace Projects */}
            <Flex
              direction={"column"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.300"}
            >
              <FormControl>
                <FormLabel fontSize={"sm"} fontWeight={"semibold"}>
                  {showArchived ? "Archived " : ""}Projects
                </FormLabel>
                <Flex
                  w={"100%"}
                  justify={"center"}
                  align={shownProjects.length > 0 ? "" : "center"}
                  minH={shownProjects.length > 0 ? "fit-content" : "200px"}
                >
                  {shownProjects.length > 0 ? (
                    <DataTable
                      data={shownProjects}
                      columns={projectsTableColumns}
                      visibleColumns={{}}
                      selectedRows={selectedProjects}
                      actions={projectsTableActions}
                      showPagination
                      showSelection
                    />
                  ) : (
                    <Text color={"gray.400"} fontWeight={"semibold"}>
                      No {showArchived ? "archived " : ""}Projects
                    </Text>
                  )}
                </Flex>
              </FormControl>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Workspace;
