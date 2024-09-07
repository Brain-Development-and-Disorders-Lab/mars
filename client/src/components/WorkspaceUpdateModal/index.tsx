// React and Chakra UI components
import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Flex,
  Heading,
  Spacer,
  ModalBody,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  Tag,
  IconButton,
  Textarea,
  Text,
  ModalFooter,
  useToast,
  Tooltip,
  useBreakpoint,
} from "@chakra-ui/react";

// Custom components
import Icon from "@components/Icon";
import DataTable from "@components/DataTable";

// Custom types
import {
  DataTableAction,
  IGenericItem,
  ResponseMessage,
  WorkspaceModel,
  WorkspaceUpdateProps,
} from "@types";

// GraphQL imports
import { gql, useLazyQuery, useMutation } from "@apollo/client";

// Utility functions and libraries
import { createColumnHelper } from "@tanstack/react-table";
import _ from "lodash";

const WorkspaceUpdateModal = (props: WorkspaceUpdateProps) => {
  const toast = useToast();
  const breakpoint = useBreakpoint();

  // Query to get a Workspace
  const GET_WORKSPACE = gql`
    query GetWorkspace($_id: String) {
      workspace(_id: $_id) {
        _id
        name
        owner
        description
      }
    }
  `;
  const [getWorkspace, { error: workspaceError }] = useLazyQuery<{
    workspace: WorkspaceModel;
  }>(GET_WORKSPACE, { fetchPolicy: "network-only" });

  // Queries
  const GET_WORKSPACE_DATA = gql`
    query GetWorkspaceData {
      projects {
        _id
        name
      }
      entities {
        _id
        name
      }
      attributes {
        _id
        name
      }
    }
  `;
  const [getWorkspaceData, { error: workspaceDataError }] = useLazyQuery<{
    entities: IGenericItem[];
    projects: IGenericItem[];
    attributes: IGenericItem[];
  }>(GET_WORKSPACE_DATA, { fetchPolicy: "network-only" });

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
  ] = useMutation<ResponseMessage>(UPDATE_WORKSPACE);

  // State for Workspace details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("");

  // State for Workspace contents
  const [entities, setEntities] = useState([] as IGenericItem[]);
  const [projects, setProjects] = useState([] as IGenericItem[]);
  const [attributes, setAttributes] = useState([] as IGenericItem[]);

  // State for Workspace collaborators
  const [collaborator, setCollaborator] = useState("");
  const [collaborators, setCollaborators] = useState([] as string[]);

  useEffect(() => {
    const refreshWorkspace = async () => {
      // Get the Workspace information
      const workspaceResult = await getWorkspace({
        variables: {
          _id: props.workspaceIdentifier,
        },
      });
      if (workspaceResult.data?.workspace) {
        setName(workspaceResult.data.workspace.name);
        setOwner(workspaceResult.data.workspace.owner);
        setDescription(workspaceResult.data.workspace.description);
      }

      // Get all Workspace data
      const workspaceData = await getWorkspaceData();
      if (workspaceData.data?.entities) {
        setEntities(workspaceData.data.entities);
      }
      if (workspaceData.data?.projects) {
        setProjects(workspaceData.data.projects);
      }
      if (workspaceData.data?.attributes) {
        setAttributes(workspaceData.data.attributes);
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
  }, [props.workspaceIdentifier]);

  /**
   * Handler function for modal `Done` button, apply updates to the Workspace
   */
  const handleUpdateClick = async () => {
    await updateWorkspace({
      variables: {
        workspace: {
          _id: props.workspaceIdentifier,
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

    if (workspaceUpdateError) {
      toast({
        title: "Error",
        description: "Unable to update Workspace",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    } else {
      // Run the `onUpdate` function
      await props.onUpdate();

      // Close the modal if updated
      props.onClose();
    }
  };

  const truncateTableText =
    _.isEqual(breakpoint, "sm") ||
    _.isEqual(breakpoint, "base") ||
    _.isUndefined(breakpoint);

  // Setup `DataTable` components
  const entitiesTableColumnHelper = createColumnHelper<IGenericItem>();
  const entitiesTableColumns = [
    entitiesTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Tooltip label={info.getValue()}>
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
          <Flex w={"100%"} justify={"end"} p={"0.5"}>
            <IconButton
              icon={<Icon name={"delete"} />}
              size={"sm"}
              aria-label={"Remove Entity"}
              colorScheme={"red"}
              onClick={() => {
                console.info("Remove:", info.row.original._id);
              }}
            />
          </Flex>
        );
      },
      header: "",
    }),
  ];
  const entitiesTableActions: DataTableAction[] = [
    {
      label: "Remove Entity",
      icon: "delete",
      action(table, rows) {
        const entitiesToRemove: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          entitiesToRemove.push(table.getRow(rowIndex).original._id);
        }
        // removeEntities(entitiesToRemove);
      },
    },
  ];

  const projectsTableColumnHelper = createColumnHelper<IGenericItem>();
  const projectsTableColumns = [
    projectsTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Tooltip label={info.getValue()}>
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
          <Flex w={"100%"} justify={"end"} p={"0.5"}>
            <IconButton
              icon={<Icon name={"delete"} />}
              size={"sm"}
              aria-label={"Remove Project"}
              colorScheme={"red"}
              onClick={() => {
                console.info("Remove:", info.row.original._id);
              }}
            />
          </Flex>
        );
      },
      header: "",
    }),
  ];
  const projectsTableActions: DataTableAction[] = [
    {
      label: "Remove Project",
      icon: "delete",
      action(table, rows) {
        const projectsToRemove: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          projectsToRemove.push(table.getRow(rowIndex).original._id);
        }
        // removeProjects(projectsToRemove);
      },
    },
  ];

  const attributesTableColumnHelper = createColumnHelper<IGenericItem>();
  const attributesTableColumns = [
    attributesTableColumnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Tooltip label={info.getValue()}>
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
          <Flex w={"100%"} justify={"end"} p={"0.5"}>
            <IconButton
              icon={<Icon name={"delete"} />}
              size={"sm"}
              aria-label={"Remove Attribute"}
              colorScheme={"red"}
              onClick={() => {
                console.info("Remove:", info.row.original._id);
              }}
            />
          </Flex>
        );
      },
      header: "",
    }),
  ];
  const attributesTableActions: DataTableAction[] = [
    {
      label: "Remove Attribute",
      icon: "delete",
      action(table, rows) {
        const attributesToRemove: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          attributesToRemove.push(table.getRow(rowIndex).original._id);
        }
        // removeAttributes(attributesToRemove);
      },
    },
  ];

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} size={"full"}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p={"2"}>
          <Flex align={"center"} gap={"2"} w={"100%"}>
            <Icon name={"workspace"} size={"md"} />
            <Heading size={"md"}>Update Workspace</Heading>
            <Spacer />
          </Flex>
        </ModalHeader>
        <ModalBody p={"2"}>
          <Flex gap={"2"} direction={"column"}>
            <Flex direction={"row"} gap={"2"}>
              {/* Workspace name */}
              <Flex
                direction={"column"}
                p={"0"}
                gap={"2"}
                grow={"1"}
                basis={"50%"}
              >
                <Flex
                  direction={"column"}
                  p={"2"}
                  gap={"2"}
                  rounded={"md"}
                  border={"1px"}
                  borderColor={"gray.200"}
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
                </Flex>

                <Flex
                  direction={"column"}
                  p={"2"}
                  gap={"2"}
                  rounded={"md"}
                  border={"1px"}
                  borderColor={"gray.200"}
                >
                  <Text fontSize={"sm"} fontWeight={"semibold"}>
                    Collaborators
                  </Text>
                  <Text
                    fontSize={"sm"}
                    fontWeight={"semibold"}
                    color={"gray.400"}
                  >
                    Add Collaborators by their ORCiD, and they will have access
                    to this Workspace when they next sign into Metadatify.
                  </Text>
                  <Flex direction={"row"} gap={"2"} align={"center"}>
                    <FormControl>
                      <Input
                        placeholder={"ORCiD"}
                        rounded={"md"}
                        size={"sm"}
                        value={collaborator}
                        onChange={(event) =>
                          setCollaborator(event.target.value)
                        }
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
                        if (
                          collaborator &&
                          !collaborators.includes(collaborator)
                        ) {
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
                      <VStack w={"100%"}>
                        {collaborators.map((collaborator, index) => (
                          <Flex
                            key={index}
                            align={"center"}
                            gap={"2"}
                            py={"2"}
                            w={"100%"}
                          >
                            <Tag colorScheme={"green"}>{collaborator}</Tag>
                            <Spacer />
                            <IconButton
                              size={"sm"}
                              aria-label={"Remove collaborator"}
                              icon={<Icon name="delete" />}
                              colorScheme={"red"}
                              onClick={() =>
                                setCollaborators((collaborators) =>
                                  collaborators.filter(
                                    (existing) => existing !== collaborator,
                                  ),
                                )
                              }
                            />
                          </Flex>
                        ))}
                      </VStack>
                    )}
                  </Flex>
                </Flex>

                <Flex
                  direction={"column"}
                  p={"2"}
                  gap={"2"}
                  rounded={"md"}
                  border={"1px"}
                  borderColor={"gray.200"}
                >
                  <FormControl>
                    <FormLabel fontSize={"sm"} fontWeight={"semibold"}>
                      Attributes
                    </FormLabel>
                    <Flex
                      w={"100%"}
                      justify={"center"}
                      align={attributes.length > 0 ? "" : "center"}
                      minH={attributes.length > 0 ? "fit-content" : "200px"}
                    >
                      {attributes.length > 0 ? (
                        <DataTable
                          data={attributes}
                          columns={attributesTableColumns}
                          visibleColumns={{}}
                          actions={attributesTableActions}
                          showPagination
                          showSelection
                        />
                      ) : (
                        <Text color={"gray.400"} fontWeight={"semibold"}>
                          No Attributes
                        </Text>
                      )}
                    </Flex>
                  </FormControl>
                </Flex>
              </Flex>

              {/* Workspace description */}
              <Flex
                direction={"column"}
                p={"0"}
                gap={"2"}
                grow={"1"}
                basis={"50%"}
              >
                <Flex
                  direction={"column"}
                  p={"2"}
                  gap={"2"}
                  rounded={"md"}
                  border={"1px"}
                  borderColor={"gray.200"}
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

                <Flex
                  direction={"column"}
                  p={"2"}
                  gap={"2"}
                  rounded={"md"}
                  border={"1px"}
                  borderColor={"gray.200"}
                >
                  <FormControl>
                    <FormLabel fontSize={"sm"} fontWeight={"semibold"}>
                      Entities
                    </FormLabel>
                    <Flex
                      w={"100%"}
                      justify={"center"}
                      align={entities.length > 0 ? "" : "center"}
                      minH={entities.length > 0 ? "fit-content" : "200px"}
                    >
                      {entities.length > 0 ? (
                        <DataTable
                          data={entities}
                          columns={entitiesTableColumns}
                          visibleColumns={{}}
                          actions={entitiesTableActions}
                          showPagination
                          showSelection
                        />
                      ) : (
                        <Text color={"gray.400"} fontWeight={"semibold"}>
                          No Entities
                        </Text>
                      )}
                    </Flex>
                  </FormControl>
                </Flex>

                <Flex
                  direction={"column"}
                  p={"2"}
                  gap={"2"}
                  rounded={"md"}
                  border={"1px"}
                  borderColor={"gray.200"}
                >
                  <FormControl>
                    <FormLabel fontSize={"sm"} fontWeight={"semibold"}>
                      Projects
                    </FormLabel>
                    <Flex
                      w={"100%"}
                      justify={"center"}
                      align={projects.length > 0 ? "" : "center"}
                      minH={projects.length > 0 ? "fit-content" : "200px"}
                    >
                      {projects.length > 0 ? (
                        <DataTable
                          data={projects}
                          columns={projectsTableColumns}
                          visibleColumns={{}}
                          actions={projectsTableActions}
                          showPagination
                          showSelection
                        />
                      ) : (
                        <Text color={"gray.400"} fontWeight={"semibold"}>
                          No Projects
                        </Text>
                      )}
                    </Flex>
                  </FormControl>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </ModalBody>

        <ModalFooter p={"2"}>
          <Button
            size={"sm"}
            colorScheme={"red"}
            onClick={() => props.onClose()}
          >
            Cancel
          </Button>
          <Spacer />
          <Button
            id={"modalWorkspaceCreateButton"}
            size={"sm"}
            colorScheme={"green"}
            leftIcon={<Icon name={"check"} />}
            isDisabled={name === ""}
            isLoading={workspaceUpdateLoading}
            onClick={() => handleUpdateClick()}
          >
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default WorkspaceUpdateModal;
