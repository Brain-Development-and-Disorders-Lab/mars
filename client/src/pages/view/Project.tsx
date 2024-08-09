// React
import React, { useEffect, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  CheckboxGroup,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spacer,
  Stack,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  Textarea,
  Tooltip,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Dialog from "@components/Dialog";

// Existing and custom types
import {
  ProjectHistory,
  ProjectModel,
  DataTableAction,
  IGenericItem,
} from "@types";

// Apollo client imports
import { useQuery, gql, useMutation, useLazyQuery } from "@apollo/client";

// Routing and navigation
import { useParams, useNavigate } from "react-router-dom";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";
import DataTable from "@components/DataTable";
import FileSaver from "file-saver";
import slugify from "slugify";
import consola from "consola";

const Project = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Add Entities
  const {
    isOpen: isEntitiesOpen,
    onOpen: onEntitiesOpen,
    onClose: onEntitiesClose,
  } = useDisclosure();

  // State for dialog confirming if user should delete
  const deleteDialogRef = useRef();
  const {
    isOpen: isDeleteDialogOpen,
    onOpen: onDeleteDialogOpen,
    onClose: onDeleteDialogClose,
  } = useDisclosure();

  // History drawer
  const {
    isOpen: isHistoryOpen,
    onOpen: onHistoryOpen,
    onClose: onHistoryClose,
  } = useDisclosure();

  // Page state
  const [editing, setEditing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Project state
  const [project, setProject] = useState({} as ProjectModel);
  const [projectEntities, setProjectEntities] = useState([] as string[]);
  const [projectDescription, setProjectDescription] = useState("");
  const [projectHistory, setProjectHistory] = useState([] as ProjectHistory[]);
  const [projectCollaborators, setProjectCollaborators] = useState(
    [] as string[],
  );
  const [newCollaborator, setNewCollaborator] = useState("");

  // Entities that can be added
  const [minimalEntities, setMinimalEntities] = useState([] as IGenericItem[]);
  const [selectedEntities, setSelectedEntities] = useState([] as string[]);

  // Export modal state and data
  const {
    isOpen: isExportOpen,
    onOpen: onExportOpen,
    onClose: onExportClose,
  } = useDisclosure();
  const [exportFields, setExportFields] = useState([] as string[]);
  const [exportAll, setExportAll] = useState(false);
  const [exportFormat, setExportFormat] = useState("json");
  const validExportFormats = ["json", "csv", "txt"];

  useEffect(() => {
    if (isLoaded) {
      // Update the state of editable data fields
      setProjectEntities(project.entities);
    }
  }, [isLoaded]);

  // Execute GraphQL query both on page load and navigation
  const GET_PROJECT_WITH_ENTITIES = gql`
    query GetProjectWithEntities($_id: String) {
      project(_id: $_id) {
        _id
        name
        description
        owner
        entities
      }
      entities {
        _id
        name
      }
    }
  `;
  const { loading, error, data, refetch } = useQuery(
    GET_PROJECT_WITH_ENTITIES,
    {
      variables: {
        _id: id,
      },
      fetchPolicy: "network-only",
    },
  );

  // Query to get Project Entities export contents
  const GET_PROJECT_ENTITIES_EXPORT = gql`
    query GetProjectEntitiesExport($_id: String, $format: String) {
      exportProjectEntities(_id: $_id, format: $format)
    }
  `;
  const [
    exportProjectEntities,
    { loading: exportEntitiesLoading, error: exportEntitiesError },
  ] = useLazyQuery(GET_PROJECT_ENTITIES_EXPORT);

  // Query to get Project Entities export contents
  const GET_PROJECT_EXPORT = gql`
    query GetProjectExport($_id: String, $format: String, $fields: [String]) {
      exportProject(_id: $_id, format: $format, fields: $fields)
    }
  `;
  const [exportProject, { loading: exportLoading, error: exportError }] =
    useLazyQuery(GET_PROJECT_EXPORT);

  // Mutation to update Project
  const UPDATE_PROJECT = gql`
    mutation UpdateProject($project: ProjectUpdateInput) {
      updateProject(project: $project) {
        success
        message
      }
    }
  `;
  const [updateProject, { loading: updateLoading, error: updateError }] =
    useMutation(UPDATE_PROJECT);

  // Mutation to delete Project
  const DELETE_PROJECT = gql`
    mutation DeleteProject($_id: String) {
      deleteProject(_id: $_id) {
        success
        message
      }
    }
  `;
  const [deleteProject, { loading: deleteLoading }] =
    useMutation(DELETE_PROJECT);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.project) {
      setProject(data.project);
      setProjectDescription(data.project?.description);
      setProjectEntities(data.project?.entities);
      setProjectHistory(data.project?.history);
      setProjectCollaborators(data.project?.collaborators || []);
    }
    if (data?.entities) {
      setMinimalEntities(data.entities);
    }
  }, [data]);

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, []);

  // Display error messages from GraphQL usage
  useEffect(() => {
    if (!loading && _.isUndefined(data)) {
      // Raised if invalid query
      toast({
        title: "Error",
        description: "Could not retrieve data.",
        status: "error",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    } else if (error) {
      // Raised GraphQL error
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  }, [loading, error]);

  /**
   * Callback function to add Entities to a Project
   * @param {string[]} entities List of Entities to add
   */
  const addEntities = (entities: string[]): void => {
    setProjectEntities([
      ...projectEntities,
      ...entities.filter((entity) => !_.isEqual("", entity)),
    ]);
    setSelectedEntities([]);
    onEntitiesClose();
  };

  /**
   * Handle the edit button being clicked
   */
  const handleEditClick = async () => {
    if (editing) {
      setIsUpdating(true);

      // Collate update data
      const updateData: ProjectModel = {
        _id: project._id,
        name: project.name,
        description: projectDescription,
        owner: project.owner,
        collaborators: projectCollaborators || [],
        shared: project.shared,
        created: project.created,
        entities: projectEntities,
        history: projectHistory,
      };

      try {
        await updateProject({
          variables: {
            project: updateData,
          },
        });
        toast({
          title: "Updated Successfully",
          status: "success",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      } catch {
        if (updateError) {
          toast({
            title: "Error",
            description: updateError.message,
            status: "error",
            duration: 2000,
            position: "bottom-right",
            isClosable: true,
          });
        }
      }
      setEditing(false);
      setIsUpdating(false);
    } else {
      setEditing(true);
    }
  };

  // Delete the Project when confirmed
  const handleDeleteClick = async () => {
    const response = await deleteProject({
      variables: {
        _id: project._id,
      },
    });
    if (response.data.deleteProject.success) {
      toast({
        title: "Deleted Successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
      navigate("/projects");
    } else {
      toast({
        title: "Error",
        description: "An error occurred when deleting Project",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }
    setEditing(false);
  };

  const handleCancelClick = () => {
    // Disable editing
    setEditing(false);

    // Reset Project state values
    setProject(project);
    setProjectDescription(projectDescription);
    setProjectEntities(projectEntities);
    setProjectHistory(projectHistory);
    setProjectCollaborators(projectCollaborators);

    // Reload the page for maximum effect
    window.location.reload();
  };

  /**
   * Restore a Project from an earlier point in time
   * @param {ProjectHistory} projectVersion historical Project data to restore
   */
  const handleRestoreFromHistoryClick = async (
    projectVersion: ProjectHistory,
  ) => {
    // Reconstruct a `ProjectModel` instance from the prior version
    const updateData: ProjectModel = {
      _id: project._id,
      name: project.name,
      created: project.created,
      owner: project.owner,
      collaborators: project.collaborators || [],
      shared: project.shared,
      description: projectVersion.description,
      entities: projectVersion.entities,
      history: project.history,
    };
    setIsLoaded(false);

    try {
      await updateProject({
        variables: {
          project: updateData,
        },
      });
      toast({
        title: "Success",
        description: "Restored Project successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Project could not be restored",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }

    // Close the drawer
    onHistoryClose();

    // Apply updated state
    setProject(updateData);
    setProjectDescription(updateData.description);
    setProjectEntities(updateData.entities);
    setProjectHistory(updateData?.history || []);
    setProjectCollaborators(updateData?.collaborators || []);
    setIsLoaded(true);
  };

  // Handle clicking the "Export" button
  const handleExportClick = () => {
    setProject(project);
    onExportOpen();
  };

  // Handle clicking the "Export" button
  const handleExportEntitiesClick = async () => {
    const response = await exportProjectEntities({
      variables: { _id: project._id, format: "json" },
    });
    if (response.data.exportProjectEntities) {
      FileSaver.saveAs(
        new Blob([response.data.exportProjectEntities]),
        slugify(
          `export_${project._id}_entities_${dayjs(Date.now()).format("YYYY_MM_DD")}.json`,
        ),
      );
    }

    if (exportEntitiesError) {
      toast({
        title: "Error",
        description: "Project Entities could not be exported",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  };

  // A list of all fields that can be exported, generated when the interface is opened
  const allExportFields = [
    "name",
    "created",
    "owner",
    "collaborators",
    "description",
  ];

  // Handle clicking the "Download" button
  const handleDownloadClick = async (format: string) => {
    if (_.includes(validExportFormats, format)) {
      // Send POST data to generate file
      const response = await exportProject({
        variables: {
          _id: id,
          fields: exportAll ? allExportFields : exportFields,
          format: format,
        },
      });

      if (response.data.exportProject) {
        FileSaver.saveAs(
          new Blob([response.data.exportProject]),
          slugify(`${project.name.replace(" ", "")}_export.${format}`),
        );

        // Close the "Export" modal
        onExportClose();

        // Reset the export state
        setExportFields([]);

        toast({
          title: "Info",
          description: `Generated ${format.toUpperCase()} file`,
          status: "info",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      }

      if (exportError) {
        toast({
          title: "Error",
          description: "An error occurred exporting this Project",
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      }
    } else {
      toast({
        title: "Warning",
        description: `Unsupported export format: ${format}`,
        status: "warning",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  };

  // Handle checkbox selection on the export modal
  const handleExportCheck = (field: string, checkState: boolean) => {
    if (_.isEqual(checkState, true)) {
      // If checked after click, add field to exportFields
      if (!exportFields.includes(field)) {
        const updatedFields = [...exportFields, field];
        setExportFields(updatedFields);
      }
    } else {
      // If unchecked after click, remove the field from exportFields
      if (exportFields.includes(field)) {
        const updatedFields = exportFields.filter((existingField) => {
          if (!_.isEqual(existingField, field)) {
            return existingField;
          }
          return;
        });
        setExportFields(updatedFields);
      }
    }
  };

  // Define the columns for Entities listing
  const entitiesColumns = [
    {
      id: (info: any) => info.row.original,
      cell: (info: any) => <Linky id={info.row.original} type={"entities"} />,
      header: "Name",
    },
    {
      id: "view",
      cell: (info: any) => {
        return (
          <Flex w={"100%"} justify={"end"}>
            {editing ? (
              <IconButton
                icon={<Icon name={"delete"} />}
                aria-label={"Remove entity"}
                colorScheme={"red"}
                onClick={() => {
                  consola.warn(
                    "Removing Entities from a Project has not been implemented!",
                  );
                }}
                size={"sm"}
              />
            ) : (
              <Button
                key={`view-entity-${info.row.original}`}
                colorScheme={"gray"}
                rightIcon={<Icon name={"c_right"} />}
                onClick={() => navigate(`/entities/${info.row.original}`)}
                size={"sm"}
              >
                View
              </Button>
            )}
          </Flex>
        );
      },
      header: "",
    },
  ];
  const entitiesTableActions: DataTableAction[] = [
    {
      label: "Remove Entities",
      icon: "delete",
      action(table, rows) {
        const entitiesToRemove: string[] = [];
        for (let rowIndex of Object.keys(rows)) {
          entitiesToRemove.push(table.getRow(rowIndex).original.id);
        }
        consola.warn(
          "Removing Entities from a Project has not been implemented!",
        );
      },
    },
  ];

  return (
    <Content
      isError={!_.isUndefined(error)}
      isLoaded={!loading && !deleteLoading && !updateLoading}
    >
      <Flex direction={"column"}>
        <Flex
          gap={"2"}
          p={"2"}
          pb={{ base: "2", lg: "0" }}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
          wrap={"wrap"}
        >
          <Flex
            align={"center"}
            gap={"2"}
            p={"2"}
            border={"2px"}
            rounded={"md"}
          >
            <Icon name={"project"} size={"md"} />
            <Heading fontWeight={"semibold"} size={"md"}>
              {project.name}
            </Heading>
          </Flex>

          {/* Buttons */}
          <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
            {editing && (
              <Button
                onClick={handleCancelClick}
                size={"sm"}
                colorScheme={"red"}
                rightIcon={<Icon name={"cross"} />}
              >
                Cancel
              </Button>
            )}
            <Button
              colorScheme={editing ? "green" : "blue"}
              rightIcon={
                editing ? <Icon name={"check"} /> : <Icon name={"edit"} />
              }
              onClick={handleEditClick}
              loadingText={"Saving..."}
              isLoading={isUpdating}
              size={"sm"}
            >
              {editing ? "Done" : "Edit"}
            </Button>

            {/* Delete Dialog */}
            <Dialog
              dialogRef={deleteDialogRef}
              header={"Delete Project"}
              rightButtonAction={handleDeleteClick}
              isOpen={isDeleteDialogOpen}
              onOpen={onDeleteDialogOpen}
              onClose={onDeleteDialogClose}
            >
              <Text>
                Are you sure you want to delete this Project? No Entities will
                be deleted.
              </Text>
            </Dialog>

            {/* Actions Menu */}
            <Menu>
              <MenuButton
                as={Button}
                colorScheme={"blue"}
                rightIcon={<Icon name={"c_down"} />}
                size={"sm"}
              >
                Actions
              </MenuButton>
              <MenuList>
                <MenuItem
                  icon={<Icon name={"clock"} />}
                  onClick={onHistoryOpen}
                >
                  History
                </MenuItem>
                <MenuItem
                  onClick={handleExportClick}
                  icon={<Icon name={"download"} />}
                  isDisabled={exportLoading}
                >
                  Export Project
                </MenuItem>
                <Tooltip
                  isDisabled={projectEntities?.length > 0}
                  label={"This Project does not contain any Entities."}
                >
                  <MenuItem
                    onClick={handleExportEntitiesClick}
                    icon={<Icon name={"download"} />}
                    isDisabled={
                      projectEntities?.length === 0 || exportEntitiesLoading
                    }
                  >
                    Export Entities
                  </MenuItem>
                </Tooltip>
                <MenuItem
                  icon={<Icon name={"delete"} />}
                  onClick={onDeleteDialogOpen}
                >
                  Delete
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Flex>

        <Flex direction={"row"} gap={"0"} wrap={"wrap"}>
          <Flex
            direction={"column"}
            p={"2"}
            pt={{ base: "0", lg: "2" }}
            gap={"2"}
            grow={"1"}
            basis={"50%"}
            rounded={"md"}
          >
            <Flex
              direction={"column"}
              p={"2"}
              border={"1px"}
              borderColor={"gray.200"}
              rounded={"md"}
            >
              {/* Project Overview */}
              <Flex gap={"4"} grow={"1"} direction={"column"}>
                <Flex gap={"2"} direction={"row"}>
                  <Flex gap={"2"} direction={"column"} basis={"40%"}>
                    <Text fontWeight={"bold"}>Created</Text>
                    <Flex align={"center"} gap={"2"}>
                      <Icon name={"v_date"} size={"sm"} />
                      <Text>
                        {dayjs(project.created).format("DD MMM YYYY")}
                      </Text>
                    </Flex>
                    <Text fontWeight={"bold"}>Owner</Text>
                    <Flex>
                      <Tag colorScheme={"green"}>
                        <TagLabel>{project.owner}</TagLabel>
                      </Tag>
                    </Flex>
                  </Flex>

                  <Flex gap={"2"} direction={"column"} basis={"60%"}>
                    <Text fontWeight={"bold"}>Description</Text>
                    <Textarea
                      value={projectDescription}
                      onChange={(event) => {
                        setProjectDescription(event.target.value);
                      }}
                      isReadOnly={!editing}
                      bg={"white"}
                      border={"1px"}
                      borderColor={"gray.200"}
                    />
                  </Flex>
                </Flex>
              </Flex>
            </Flex>

            {/* Display Entities */}
            <Flex
              direction={"column"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.200"}
            >
              <Flex
                direction={"row"}
                justify={"space-between"}
                align={"center"}
              >
                {/* Entities in the Project */}
                <Heading size={"sm"}>Entities</Heading>
                <Button
                  rightIcon={<Icon name={"add"} />}
                  onClick={onEntitiesOpen}
                  size={"sm"}
                  isDisabled={!editing}
                >
                  Add
                </Button>
              </Flex>
              <Flex
                w={"100%"}
                justify={"center"}
                align={"center"}
                minH={projectEntities.length > 0 ? "fit-content" : "200px"}
              >
                {projectEntities && projectEntities.length > 0 ? (
                  <DataTable
                    data={projectEntities}
                    columns={entitiesColumns}
                    visibleColumns={{}}
                    viewOnly={!editing}
                    showSelection={true}
                    actions={entitiesTableActions}
                    showPagination
                  />
                ) : (
                  <Flex w={"100%"} justify={"center"} align={"center"}>
                    <Text color={"gray.400"} fontWeight={"semibold"}>
                      This Project does not contain any Entities.
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Flex>
          </Flex>

          <Flex
            direction={"column"}
            p={"2"}
            pl={{ base: "2", lg: "0" }}
            pt={{ base: "0", lg: "2" }}
            gap={"2"}
            grow={"1"}
            basis={"50%"}
            rounded={"md"}
          >
            <Flex
              direction={"column"}
              gap={"2"}
              p={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.200"}
            >
              {/* Collaborators display */}
              <Flex direction={"column"}>
                <Heading size={"sm"} mb={"2"}>
                  Collaborators
                </Heading>
                <Flex direction={"row"} gap={"2"} align={"center"}>
                  <FormControl>
                    <Input
                      placeholder={"ORCiD"}
                      rounded={"md"}
                      size={"sm"}
                      value={newCollaborator}
                      onChange={(e) => setNewCollaborator(e.target.value)}
                      isDisabled={!editing}
                    />
                  </FormControl>
                  <Spacer />
                  <Button
                    colorScheme={"green"}
                    rightIcon={<Icon name={"add"} />}
                    size={"sm"}
                    isDisabled={!editing}
                    onClick={() => {
                      // Prevent adding empty or duplicate collaborator
                      if (
                        newCollaborator &&
                        !projectCollaborators.includes(newCollaborator)
                      ) {
                        setProjectCollaborators((collaborators) => [
                          ...collaborators,
                          newCollaborator,
                        ]);
                        setNewCollaborator(""); // Clear the input after adding
                      }
                    }}
                  >
                    Add
                  </Button>
                </Flex>
                <Flex
                  w={"100%"}
                  justify={"center"}
                  align={"center"}
                  minH={
                    projectCollaborators.length > 0 ? "fit-content" : "200px"
                  }
                >
                  {projectCollaborators.length === 0 ? (
                    <Text color={"gray.400"} fontWeight={"semibold"}>
                      No Collaborators
                    </Text>
                  ) : (
                    <VStack align="start">
                      {projectCollaborators.map((collaborator, index) => (
                        <Flex key={index} align="center">
                          <Text mr="4">{collaborator}</Text>
                          {editing && (
                            <IconButton
                              aria-label="Remove collaborator"
                              icon={<Icon name="delete" />}
                              onClick={() =>
                                setProjectCollaborators((collaborators) =>
                                  collaborators.filter(
                                    (c) => c !== collaborator,
                                  ),
                                )
                              }
                            />
                          )}
                        </Flex>
                      ))}
                    </VStack>
                  )}
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        {/* Modal to add Entities */}
        <Modal isOpen={isEntitiesOpen} onClose={onEntitiesClose} isCentered>
          <ModalOverlay />
          <ModalContent p={"2"} gap={"4"} w={["lg", "xl", "2xl"]}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Add Entities</ModalHeader>
            <ModalCloseButton />

            <ModalBody p={"2"}>
              {/* Select component for Entities */}
              <Flex direction={"column"} p={"4"} gap={"2"}>
                <FormControl>
                  <FormLabel>Add Entities</FormLabel>
                  <Select
                    title="Select Entity"
                    placeholder={"Select Entity"}
                    onChange={(event) => {
                      const selectedEntity = event.target.value.toString();
                      if (selectedEntities.includes(selectedEntity)) {
                        toast({
                          title: "Warning",
                          description: "Entity has already been selected.",
                          status: "warning",
                          duration: 2000,
                          position: "bottom-right",
                          isClosable: true,
                        });
                      } else {
                        setSelectedEntities((selectedEntities) => [
                          ...selectedEntities,
                          selectedEntity,
                        ]);
                      }
                    }}
                  >
                    {!loading &&
                      minimalEntities.map((entity) => {
                        return (
                          <option key={entity._id} value={entity._id}>
                            {entity.name}
                          </option>
                        );
                      })}
                    ;
                  </Select>
                </FormControl>

                <Flex direction={"row"} p={"2"} gap={"2"}>
                  {selectedEntities.map((entity) => {
                    if (!_.isEqual(entity, "")) {
                      return (
                        <Tag key={`tag-${entity}`}>
                          <Linky id={entity} type={"entities"} />
                          <TagCloseButton
                            onClick={() => {
                              setSelectedEntities(
                                selectedEntities.filter((selected) => {
                                  return !_.isEqual(entity, selected);
                                }),
                              );
                            }}
                          />
                        </Tag>
                      );
                    } else {
                      return null;
                    }
                  })}
                </Flex>
              </Flex>
            </ModalBody>

            <ModalFooter p={"2"}>
              {/* "Done" button */}
              <Flex direction={"row"} p={"md"} justify={"center"}>
                <Button
                  colorScheme={"green"}
                  onClick={() => {
                    if (id) {
                      // Add the Entities to the Project
                      addEntities(selectedEntities);
                    }
                  }}
                >
                  Done
                </Button>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal
          isOpen={isExportOpen}
          onClose={onExportClose}
          size={"2xl"}
          isCentered
        >
          <ModalOverlay />
          <ModalContent p={"2"} w={["lg", "xl", "2xl"]}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Export Project</ModalHeader>
            <ModalCloseButton />

            <ModalBody px={"2"}>
              <Flex w={"100%"} direction={"column"} py={"1"} gap={"2"}>
                <Text>
                  Select the Project information to include in the exported
                  file.
                </Text>
                <Checkbox
                  onChange={(event) => setExportAll(event.target.checked)}
                >
                  Select All
                </Checkbox>
              </Flex>

              {/* Selection content */}
              <Flex
                direction={"row"}
                p={"2"}
                gap={"4"}
                rounded={"md"}
                border={"2px"}
                borderColor={"gray.200"}
              >
                <Flex direction={"column"} gap={"2"}>
                  <FormControl>
                    <FormLabel>Details</FormLabel>
                    {!loading ? (
                      <CheckboxGroup>
                        <Stack spacing={2} direction={"column"}>
                          <Checkbox disabled defaultChecked>
                            Name: {project.name}
                          </Checkbox>
                          <Checkbox
                            isChecked={
                              exportAll || _.includes(exportFields, "created")
                            }
                            onChange={(event) =>
                              handleExportCheck("created", event.target.checked)
                            }
                          >
                            Created:{" "}
                            {dayjs(project.created).format("DD MMM YYYY")}
                          </Checkbox>
                          <Checkbox
                            isChecked={
                              exportAll || _.includes(exportFields, "owner")
                            }
                            onChange={(event) =>
                              handleExportCheck("owner", event.target.checked)
                            }
                          >
                            Owner: {project.owner}
                          </Checkbox>
                          <Checkbox
                            isChecked={
                              exportAll ||
                              _.includes(exportFields, "description")
                            }
                            onChange={(event) =>
                              handleExportCheck(
                                "description",
                                event.target.checked,
                              )
                            }
                            isDisabled={_.isEqual(projectDescription, "")}
                          >
                            <Text noOfLines={1}>
                              Description:{" "}
                              {_.isEqual(projectDescription, "")
                                ? "No description"
                                : projectDescription}
                            </Text>
                          </Checkbox>
                        </Stack>
                      </CheckboxGroup>
                    ) : (
                      <Text>Loading details...</Text>
                    )}
                  </FormControl>
                </Flex>
              </Flex>
            </ModalBody>

            <ModalFooter p={"2"}>
              <Flex
                direction={"row"}
                w={"70%"}
                gap={"4"}
                align={"center"}
                justifySelf={"left"}
              >
                <Icon name={"info"} />
                {_.isEqual(exportFormat, "json") && (
                  <Text>JSON files can be re-imported into Storacuity.</Text>
                )}
                {_.isEqual(exportFormat, "csv") && (
                  <Text>
                    CSV spreadsheets can be used by other applications.
                  </Text>
                )}
              </Flex>
              <Flex direction={"column"} w={"30%"} gap={"2"}>
                {/* "Download" button */}
                <Flex
                  direction={"row"}
                  w={"100%"}
                  gap={"4"}
                  justify={"right"}
                  align={"center"}
                >
                  <Flex>
                    <FormControl>
                      <Select
                        value={exportFormat}
                        onChange={(event) =>
                          setExportFormat(event.target.value)
                        }
                      >
                        <option key={"json"} value={"json"}>
                          JSON
                        </option>
                        <option key={"csv"} value={"csv"}>
                          CSV
                        </option>
                      </Select>
                    </FormControl>
                  </Flex>
                  <IconButton
                    colorScheme={"blue"}
                    aria-label={"Download"}
                    onClick={() => handleDownloadClick(exportFormat)}
                    icon={<Icon name={"download"} />}
                  />
                </Flex>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Drawer
          isOpen={isHistoryOpen}
          placement={"right"}
          onClose={onHistoryClose}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Version History</DrawerHeader>

            <DrawerBody>
              <VStack spacing={"4"}>
                {projectHistory && projectHistory.length > 0 ? (
                  projectHistory.map((projectVersion) => {
                    return (
                      <Card w={"100%"} key={`v_${projectVersion.timestamp}`}>
                        <CardHeader>
                          <Flex align={"center"}>
                            <Text fontStyle={"italic"}>
                              {dayjs(projectVersion.timestamp).fromNow()}
                            </Text>
                            <Spacer />
                            <Button
                              colorScheme={"orange"}
                              rightIcon={<Icon name={"rewind"} />}
                              onClick={() => {
                                handleRestoreFromHistoryClick(projectVersion);
                              }}
                            >
                              Restore
                            </Button>
                          </Flex>
                        </CardHeader>
                        <CardBody>
                          <VStack gap={"1"} align={"baseline"}>
                            <Flex direction={"row"} wrap={"wrap"} gap={"2"}>
                              <Text fontWeight={"bold"}>Description:</Text>
                              <Text noOfLines={2}>
                                {_.isEqual(projectVersion.description, "")
                                  ? "None"
                                  : projectVersion.description}
                              </Text>
                            </Flex>
                            <Flex direction={"row"} wrap={"wrap"} gap={"2"}>
                              <Text fontWeight={"bold"}>Entities:</Text>
                              <Tag key={`v_p_${projectVersion.timestamp}`}>
                                {projectVersion.entities.length}
                              </Tag>
                            </Flex>
                          </VStack>
                        </CardBody>
                      </Card>
                    );
                  })
                ) : (
                  <Text>No previous versions.</Text>
                )}
              </VStack>
            </DrawerBody>

            <DrawerFooter>
              <Button
                colorScheme={"red"}
                onClick={onHistoryClose}
                rightIcon={<Icon name={"cross"} />}
              >
                Close
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </Flex>
    </Content>
  );
};

export default Project;
