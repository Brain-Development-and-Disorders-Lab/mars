// React
import React, { useEffect, useState } from "react";

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
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Select,
  Spacer,
  Stack,
  Table,
  TableContainer,
  Tag,
  TagCloseButton,
  TagLabel,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Linky from "@components/Linky";

// Existing and custom types
import { ProjectHistory, ProjectModel, EntityModel, DataTableAction } from "@types";

// Routing and navigation
import { useParams, useNavigate } from "react-router-dom";

// Utility functions and libraries
import { deleteData, getData, postData } from "@database/functions";
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

  // History drawer
  const {
    isOpen: isHistoryOpen,
    onOpen: onHistoryOpen,
    onClose: onHistoryClose,
  } = useDisclosure();

  // Page state
  const [editing, setEditing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [exportAll, setExportAll] = useState(false);

  const [projectData, setProjectData] = useState({} as ProjectModel);
  const [projectEntities, setProjectEntities] = useState([] as string[]);
  const [projectDescription, setProjectDescription] = useState("");
  const [projectHistory, setProjectHistory] = useState(
    [] as ProjectHistory[]
  );

  // Entities that can be added
  const [allEntities, setAllEntities] = useState(
    [] as { name: string; id: string }[]
  );
  const [selectedEntities, setSelectedEntities] = useState([] as string[]);

  const {
    isOpen: isExportOpen,
    onOpen: onExportOpen,
    onClose: onExportClose,
  } = useDisclosure();
  const [exportFields, setExportFields] = useState([] as string[]);

  useEffect(() => {
    // Populate Project data
    getData(`/projects/${id}`)
      .then((response) => {
        setProjectData(response);
        setProjectDescription(response.description);
        setProjectEntities(response.entities);
        setProjectHistory(response.history);
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Could not retrieve Project data.",
          status: "error",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      })
      .finally(() => {
        setIsLoaded(true);
      });

    // Populate Entity data
    getData(`/entities`)
      .then((response) => {
        setAllEntities(
          response.map((e: EntityModel) => {
            return { name: e.name, id: e._id };
          })
        );
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Could not retrieve Entity data.",
          status: "error",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, [id, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      // Update the state of editable data fields
      setProjectEntities(projectData.entities);
    }
  }, [isLoaded]);

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
  const handleEditClick = () => {
    if (editing) {
      setIsUpdating(true);

      // Collate update data
      const updateData: ProjectModel = {
        _id: projectData._id,
        name: projectData.name,
        description: projectDescription,
        owner: projectData.owner,
        shared: projectData.shared,
        created: projectData.created,
        entities: projectEntities,
        history: projectHistory,
      };

      // Update data
      postData(`/projects/update`, updateData)
        .then((_response) => {
          toast({
            title: "Saved!",
            status: "success",
            duration: 2000,
            position: "bottom-right",
            isClosable: true,
          });
        })
        .catch(() => {
          toast({
            title: "Error",
            description: "An error occurred when saving updates.",
            status: "error",
            duration: 2000,
            position: "bottom-right",
            isClosable: true,
          });
        })
        .finally(() => {
          setEditing(false);
          setIsUpdating(false);
        });
    } else {
      setEditing(true);
    }
  };

  // Delete the Project when confirmed
  const handleDeleteClick = () => {
    // Update data
    deleteData(`/projects/${id}`)
      .then((_response) => {
        toast({
          title: "Deleted!",
          status: "success",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: `An error occurred when deleting Project "${projectData.name}".`,
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .finally(() => {
        setEditing(false);
        navigate("/projects");
      });
  };

  /**
   * Restore a Project from an earlier point in time
   * @param {ProjectHistory} projectVersion historical Project data to restore
   */
  const handleRestoreFromHistoryClick = (
    projectVersion: ProjectHistory
  ) => {
    const updateData: ProjectModel = {
      _id: projectData._id,
      name: projectData.name,
      created: projectData.created,
      owner: projectData.owner,
      shared: projectData.shared,
      description: projectVersion.description,
      entities: projectVersion.entities,
      history: projectData.history,
    };

    setIsLoaded(false);

    // Update data
    postData(`/projects/update`, updateData)
      .then((_response) => {
        toast({
          title: "Saved!",
          status: "success",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "An error occurred when saving updates.",
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .finally(() => {
        // Close the drawer
        onHistoryClose();

        // Apply updated state
        setProjectData(updateData);
        setProjectDescription(updateData.description);
        setProjectEntities(updateData.entities);
        setProjectHistory(updateData.history);
        setIsLoaded(true);
      });
  };

  // Handle clicking the "Export" button
  const handleExportClick = () => {
    setProjectData(projectData);
    onExportOpen();
  };

  // A list of all fields that can be exported, generated when the interface is opened
  const allExportFields = ["name", "created", "owner", "description"];

  // Handle clicking the "Download" button
  const handleDownloadClick = (format: "json" | "csv" | "txt") => {
    // Send POST data to generate file
    postData(`/projects/export`, {
      id: id,
      fields: exportAll ? allExportFields : exportFields,
      format: format,
    })
      .then((response) => {
        let responseData = response;

        // Clean the response data if required
        if (_.isEqual(format, "json")) {
          responseData = JSON.stringify(responseData, null, "  ");
        }

        FileSaver.saveAs(
          new Blob([responseData]),
          slugify(`${projectData.name.replace(" ", "")}_export.${format}`)
        );

        // Close the "Export" modal
        onExportClose();

        // Reset the export state
        setExportFields([]);

        toast({
          title: "Info",
          description: `Generated ${format.toUpperCase()} file.`,
          status: "info",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .catch((_error) => {
        toast({
          title: "Error",
          description: "An error occurred when exporting this Project.",
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      });
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
                  console.warn("Not implemented");
                }}
              />
            ) : (
              <Button
                key={`view-entity-${info.row.original}`}
                colorScheme={"gray"}
                rightIcon={<Icon name={"c_right"} />}
                onClick={() => navigate(`/entities/${info.row.original}`)}
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
        console.warn("Not implemented");
      },
    },
  ];

  return (
    <Content isError={isError} isLoaded={isLoaded}>
      <Flex direction={"column"} gap={"4"}>
        <Flex
          gap={"4"}
          p={"4"}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
          wrap={"wrap"}
        >
          <Flex
            align={"center"}
            gap={"4"}
            shadow={"lg"}
            p={"2"}
            border={"2px"}
            rounded={"md"}
          >
            <Icon name={"project"} size={"lg"} />
            <Heading fontWeight={"semibold"}>{projectData.name}</Heading>
          </Flex>

          {/* Buttons */}
          <Flex direction={"row"} gap={"4"}>
            <Flex
              direction={"row"}
              gap={"4"}
              wrap={"wrap"}
              p={"4"}
              rounded={"md"}
            >
              {editing && (
                <Popover>
                  <PopoverTrigger>
                    <Button
                      colorScheme={"red"}
                      rightIcon={<Icon name={"delete"} />}
                      disabled={isUpdating}
                    >
                      Delete
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader>Confirmation</PopoverHeader>
                    <PopoverBody>
                      Are you sure you want to delete this Project?
                      <Flex direction={"row"} p={"2"} justify={"center"}>
                        <Button
                          colorScheme={"green"}
                          rightIcon={<Icon name={"check"} />}
                          onClick={handleDeleteClick}
                        >
                          Confirm
                        </Button>
                      </Flex>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              )}
              <Button
                colorScheme={editing ? "green" : "gray"}
                rightIcon={
                  editing ? <Icon name={"check"} /> : <Icon name={"edit"} />
                }
                onClick={handleEditClick}
                loadingText={"Saving..."}
                isLoading={isUpdating}
              >
                {editing ? "Done" : "Edit"}
              </Button>
            </Flex>

            <Flex
              direction={"row"}
              gap={"4"}
              wrap={"wrap"}
              p={"4"}
              rounded={"md"}
            >
              <Button
                rightIcon={<Icon name={"clock"} />}
                onClick={onHistoryOpen}
              >
                History
              </Button>
              <Button
                onClick={handleExportClick}
                rightIcon={<Icon name={"download"} />}
                colorScheme={"blue"}
                isDisabled={editing}
              >
                Export
              </Button>
            </Flex>
          </Flex>
        </Flex>

        <Flex direction={"row"} gap={"4"} p={"4"} wrap={"wrap"}>
          <Flex
            direction={"column"}
            p={"4"}
            gap={"4"}
            grow={"1"}
            h={"fit-content"}
            bg={"white"}
            rounded={"md"}
            border={"1px"}
            borderColor={"gray.100"}
          >
            {/* Details */}
            <Flex gap={"2"} grow={"1"} direction={"column"} minH={"32"}>
              <Heading fontWeight={"semibold"} size={"lg"}>
                Details
              </Heading>
              <TableContainer>
                <Table variant={"simple"} colorScheme={"gray"}>
                  <Thead>
                    <Tr>
                      <Th>Field</Th>
                      <Th>Value</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td>Owner</Td>
                      <Td>
                        <Tag colorScheme={"green"}>
                          <TagLabel>
                            {projectData.owner}
                          </TagLabel>
                        </Tag>
                      </Td>
                    </Tr>
                    <Tr>
                      <Td>Description</Td>
                      <Td>
                        <Textarea
                          value={projectDescription}
                          onChange={(event) => {
                            setProjectDescription(event.target.value);
                          }}
                          disabled={!editing}
                        />
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            </Flex>
          </Flex>

          {/* Display Entities and Projects */}
          <Flex direction={"column"} gap={"4"} grow={"2"}>
            <Flex
              direction={"column"}
              p={"4"}
              gap={"4"}
              h={"fit-content"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.100"}
            >
              <Flex direction={"row"} justify={"space-between"}>
                {/* Entities in the Project */}
                <Heading fontWeight={"semibold"} size={"lg"}>
                  Entities
                </Heading>
                {editing && (
                  <Button
                    leftIcon={<Icon name={"add"} />}
                    onClick={onEntitiesOpen}
                    colorScheme={"green"}
                  >
                    Add
                  </Button>
                )}
              </Flex>
              <Flex gap={"2"} grow={"1"} direction={"column"} minH={"32"}>
                {projectEntities && projectEntities.length > 0 ? (
                  <DataTable
                    data={projectEntities}
                    columns={entitiesColumns}
                    visibleColumns={{}}
                    viewOnly={!editing}
                    showSelection={editing}
                    actions={entitiesTableActions}
                  />
                ) : (
                  <Text>No Entities.</Text>
                )}
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
                    {isLoaded &&
                      allEntities.map((entity) => {
                        return (
                          <option key={entity.id} value={entity.id}>
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
                                })
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
          <ModalContent p={"2"} gap={"4"} w={["lg", "xl", "2xl"]}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Export Project</ModalHeader>
            <ModalCloseButton />

            <ModalBody p={"2"}>
              {/* Selection content */}
              <Flex direction={"row"} gap={"4"}>
                <Flex direction={"column"} gap={"2"}>
                  <FormControl>
                    <FormLabel>Details</FormLabel>
                    {isLoaded ? (
                      <CheckboxGroup>
                        <Stack spacing={2} direction={"column"}>
                          <Checkbox disabled defaultChecked>
                            Name: {projectData.name}
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
                            {dayjs(projectData.created).format("DD MMM YYYY")}
                          </Checkbox>
                          <Checkbox
                            isChecked={
                              exportAll || _.includes(exportFields, "owner")
                            }
                            onChange={(event) =>
                              handleExportCheck("owner", event.target.checked)
                            }
                          >
                            Owner: {projectData.owner}
                          </Checkbox>
                          <Checkbox
                            isChecked={
                              exportAll || _.includes(exportFields, "description")
                            }
                            onChange={(event) =>
                              handleExportCheck(
                                "description",
                                event.target.checked
                              )
                            }
                            disabled={_.isEqual(projectDescription, "")}
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
                      <Text>Loading details</Text>
                    )}
                  </FormControl>
                </Flex>

                <Flex direction={"column"} gap={"2"}>
                  <FormControl>
                    <FormLabel>Entities</FormLabel>
                    {isLoaded && projectEntities.length > 0 ? (
                      <Stack spacing={2} direction={"column"}>
                        {projectEntities.map((entity) => {
                          allExportFields.push(`entity_${entity}`);
                          return (
                            <Checkbox
                              key={entity}
                              isChecked={
                                exportAll ||
                                _.includes(exportFields, `entity_${entity}`)
                              }
                              onChange={(event) =>
                                handleExportCheck(
                                  `entity_${entity}`,
                                  event.target.checked
                                )
                              }
                            >
                              Entity: <Linky type={"entities"} id={entity} />
                            </Checkbox>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Text>No Entities.</Text>
                    )}
                  </FormControl>
                </Flex>
              </Flex>
            </ModalBody>

            <ModalFooter p={"2"}>
              {/* "Download" buttons */}
              <Flex
                direction={"row"}
                w={"100%"}
                gap={"4"}
                justify={"center"}
                align={"center"}
              >
                <Checkbox
                  onChange={(event) => setExportAll(event.target.checked)}
                >
                  Select All
                </Checkbox>

                <Spacer />

                <Text>Download as:</Text>
                <Button
                  colorScheme={"blue"}
                  onClick={() => handleDownloadClick(`json`)}
                  rightIcon={<Icon name={"download"} />}
                >
                  JSON
                </Button>
                <Button
                  colorScheme={"blue"}
                  onClick={() => handleDownloadClick(`csv`)}
                  rightIcon={<Icon name={"download"} />}
                >
                  CSV
                </Button>
                <Button
                  colorScheme={"blue"}
                  onClick={() => handleDownloadClick(`txt`)}
                  rightIcon={<Icon name={"download"} />}
                >
                  TXT
                </Button>
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
                                handleRestoreFromHistoryClick(
                                  projectVersion
                                );
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
                              <Tag
                                key={`v_p_${projectVersion.timestamp}`}
                              >
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
