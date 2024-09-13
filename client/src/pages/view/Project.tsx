// React
import React, { useContext, useEffect, useRef, useState } from "react";

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
import SearchSelect from "@components/SearchSelect";

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

// Workspace context
import { WorkspaceContext } from "../../Context";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";
import DataTable from "@components/DataTable";
import FileSaver from "file-saver";
import slugify from "slugify";

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

  // State for dialog confirming if user should archive Project
  const archiveDialogRef = useRef();
  const {
    isOpen: isArchiveDialogOpen,
    onOpen: onArchiveDialogOpen,
    onClose: onArchiveDialogClose,
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
  const [projectArchived, setProjectArchived] = useState(false);
  const [projectEntities, setProjectEntities] = useState([] as string[]);
  const [projectDescription, setProjectDescription] = useState("");
  const [projectHistory, setProjectHistory] = useState([] as ProjectHistory[]);
  const [projectCollaborators, setProjectCollaborators] = useState(
    [] as string[],
  );
  const [newCollaborator, setNewCollaborator] = useState("");

  // Entities that can be added
  const [selectedEntity, setSelectedEntity] = useState({} as IGenericItem);

  // Export modal state and data
  const {
    isOpen: isExportOpen,
    onOpen: onExportOpen,
    onClose: onExportClose,
  } = useDisclosure();
  const [exportFields, setExportFields] = useState([] as string[]);
  const [exportFormat, setExportFormat] = useState("json");

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
        archived
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

  // Mutation to archive Project
  const ARCHIVE_PROJECT = gql`
    mutation ArchiveProject($_id: String, $state: Boolean) {
      archiveProject(_id: $_id, state: $state) {
        success
        message
      }
    }
  `;
  const [archiveProject, { loading: archiveLoading }] =
    useMutation(ARCHIVE_PROJECT);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.project) {
      setProject(data.project);
      setProjectArchived(data.project.archived);
      setProjectDescription(data.project.description);
      setProjectEntities(data.project.entities);
      setProjectHistory(data.project.history);
      setProjectCollaborators(data.project.collaborators || []);
    }
  }, [data]);

  const { workspace, workspaceLoading } = useContext(WorkspaceContext);

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, [workspace]);

  // Display error messages from GraphQL usage
  useEffect(() => {
    if ((!loading && _.isUndefined(data)) || error) {
      // Raised GraphQL error
      toast({
        title: "Error",
        description: "Unable to retrieve Project information",
        status: "error",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  }, [loading, error]);

  /**
   * Callback function to add Entities to a Project
   * @param {IGenericItem} entity Entity to add
   */
  const addEntities = (entity: IGenericItem): void => {
    setProjectEntities([...projectEntities, entity._id]);
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
        archived: projectArchived,
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

  // Archive the Project when confirmed
  const handleArchiveClick = async () => {
    const response = await archiveProject({
      variables: {
        _id: project._id,
        state: true,
      },
    });
    if (response.data.archiveProject.success) {
      toast({
        title: "Archived Successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
      setProjectArchived(true);
      onArchiveDialogClose();
    } else {
      toast({
        title: "Error",
        description: "An error occurred when archiving Project",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }
    setEditing(false);
  };

  // Restore the Project
  const handleRestoreClick = async () => {
    const response = await archiveProject({
      variables: {
        _id: project._id,
        state: false,
      },
    });
    if (response.data.archiveProject.success) {
      toast({
        title: "Restored Successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
      setProjectArchived(false);
    } else {
      toast({
        title: "Error",
        description: "An error occurred when restoring Project",
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
      archived: project.archived,
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
          `export_${project._id}_entities_${dayjs(Date.now()).format(
            "YYYY_MM_DD",
          )}.json`,
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

  // Handle clicking the "Download" button
  const handleDownloadClick = async (format: string) => {
    // Send query to generate data
    const response = await exportProject({
      variables: {
        _id: id,
        fields: exportFields,
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

  /**
   * Remove an Entity from the Project
   * @param _id Identifier of Entity to remove
   */
  const handleRemoveEntity = (_id: string) => {
    // Filter out the removed Entity
    const updatedEntities = projectEntities.filter((entity) => {
      return !_.isEqual(entity, _id);
    });
    setProjectEntities(updatedEntities);
  };

  /**
   * Remove multiple Entities from a Project
   * @param entities Identifiers of Entities to remove
   */
  const handleRemoveEntities = (entities: string[]) => {
    // Filter out the removed Entities
    const updatedEntities = projectEntities.filter((entity) => {
      return !_.includes(entities, entity);
    });
    setProjectEntities(updatedEntities);
  };

  // Define the columns for Entities listing
  const entitiesColumns = [
    {
      id: (info: any) => info.row.original,
      cell: (info: any) => (
        <Linky id={info.row.original} type={"entities"} size={"sm"} />
      ),
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
                onClick={() => handleRemoveEntity(info.row.original)}
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
        for (const rowIndex of Object.keys(rows)) {
          entitiesToRemove.push(table.getRow(rowIndex).original);
        }
        handleRemoveEntities(entitiesToRemove);
      },
    },
  ];

  return (
    <Content
      isError={!_.isUndefined(error)}
      isLoaded={
        !loading && !archiveLoading && !updateLoading && !workspaceLoading
      }
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
            {projectArchived ? (
              <Button
                onClick={handleRestoreClick}
                size={"sm"}
                colorScheme={"orange"}
                rightIcon={<Icon name={"rewind"} />}
              >
                Restore
              </Button>
            ) : (
              <Flex gap={"2"}>
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
              </Flex>
            )}

            {/* Archive Dialog */}
            <Dialog
              dialogRef={archiveDialogRef}
              header={"Archive Project"}
              rightButtonAction={handleArchiveClick}
              isOpen={isArchiveDialogOpen}
              onOpen={onArchiveDialogOpen}
              onClose={onArchiveDialogClose}
            >
              <Text>
                Are you sure you want to archive this Project? No Entities will
                be deleted. This Project will be moved to the Workspace archive.
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
                  isDisabled={exportLoading || projectArchived}
                >
                  Export Project
                </MenuItem>
                <Tooltip
                  isDisabled={projectEntities?.length > 0 || projectArchived}
                  label={"This Project does not contain any Entities."}
                >
                  <MenuItem
                    onClick={handleExportEntitiesClick}
                    icon={<Icon name={"download"} />}
                    isDisabled={
                      projectEntities?.length === 0 ||
                      exportEntitiesLoading ||
                      projectArchived
                    }
                  >
                    Export Entities
                  </MenuItem>
                </Tooltip>
                <MenuItem
                  icon={<Icon name={"archive"} />}
                  onClick={onArchiveDialogOpen}
                  isDisabled={projectArchived}
                >
                  Archive
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
                    <Flex align={"center"} gap={"1"}>
                      <Icon name={"v_date"} size={"sm"} />
                      <Text fontSize={"sm"}>
                        {dayjs(project.created).format("DD MMM YYYY")}
                      </Text>
                    </Flex>
                    <Text fontWeight={"bold"}>Owner</Text>
                    <Flex>
                      <Tag colorScheme={"green"}>
                        <TagLabel fontSize={"sm"}>{project.owner}</TagLabel>
                      </Tag>
                    </Flex>
                  </Flex>

                  <Flex gap={"2"} direction={"column"} basis={"60%"}>
                    <Text fontWeight={"bold"}>Description</Text>
                    <Textarea
                      size={"sm"}
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
          <ModalContent p={"2"} gap={"0"} w={["md", "lg", "xl"]}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Add Entity</ModalHeader>
            <ModalCloseButton />

            <ModalBody p={"2"}>
              <SearchSelect
                value={selectedEntity}
                onChange={setSelectedEntity}
              />
            </ModalBody>

            <ModalFooter p={"2"}>
              <Button
                colorScheme={"red"}
                size={"sm"}
                variant={"outline"}
                rightIcon={<Icon name={"cross"} />}
                onClick={onEntitiesClose}
              >
                Cancel
              </Button>

              <Spacer />

              <Button
                colorScheme={"green"}
                size={"sm"}
                rightIcon={<Icon name={"check"} />}
                onClick={() => {
                  if (id) {
                    // Add the Origin to the Entity
                    addEntities(selectedEntity);
                  }
                }}
              >
                Done
              </Button>
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
                <Text fontSize={"sm"}>
                  Select the Project information to include in the exported
                  file.
                </Text>
              </Flex>

              {/* Selection content */}
              <Flex
                direction={"row"}
                p={"2"}
                gap={"4"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.200"}
              >
                <Flex direction={"column"} gap={"2"}>
                  <FormControl>
                    <FormLabel>Details</FormLabel>
                    {!loading ? (
                      <CheckboxGroup>
                        <Stack spacing={2} direction={"column"}>
                          <Checkbox disabled defaultChecked size={"sm"}>
                            Name: {project.name}
                          </Checkbox>
                          <Checkbox
                            size={"sm"}
                            isChecked={_.includes(exportFields, "created")}
                            onChange={(event) =>
                              handleExportCheck("created", event.target.checked)
                            }
                          >
                            Created:{" "}
                            {dayjs(project.created).format("DD MMM YYYY")}
                          </Checkbox>
                          <Checkbox
                            size={"sm"}
                            isChecked={_.includes(exportFields, "owner")}
                            onChange={(event) =>
                              handleExportCheck("owner", event.target.checked)
                            }
                          >
                            Owner: {project.owner}
                          </Checkbox>
                          <Checkbox
                            size={"sm"}
                            isChecked={_.includes(exportFields, "description")}
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
                      <Text fontSize={"sm"}>Loading details...</Text>
                    )}
                  </FormControl>
                </Flex>
              </Flex>
            </ModalBody>

            <ModalFooter p={"2"}>
              <Flex
                direction={"row"}
                w={"70%"}
                gap={"2"}
                align={"center"}
                justifySelf={"left"}
              >
                <Icon name={"info"} />
                {_.isEqual(exportFormat, "json") && (
                  <Text fontSize={"sm"}>
                    JSON files can be re-imported into Metadatify.
                  </Text>
                )}
                {_.isEqual(exportFormat, "csv") && (
                  <Text fontSize={"sm"}>
                    CSV spreadsheets can be used by other applications.
                  </Text>
                )}
              </Flex>
              <Flex direction={"column"} w={"30%"} gap={"2"} p={"0"}>
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
                        size={"sm"}
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
                    size={"sm"}
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
