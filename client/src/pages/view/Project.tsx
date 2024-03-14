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
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  Textarea,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Linky from "@components/Linky";

// Existing and custom types
import {
  ProjectHistory,
  ProjectModel,
  EntityModel,
  DataTableAction,
} from "@types";

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

  const [projectData, setProjectData] = useState({} as ProjectModel);
  const [projectEntities, setProjectEntities] = useState([] as string[]);
  const [projectDescription, setProjectDescription] = useState("");
  const [projectHistory, setProjectHistory] = useState([] as ProjectHistory[]);

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
  const [exportAll, setExportAll] = useState(false);
  const [exportFormat, setExportFormat] = useState("json");
  const validExportFormats = ["json", "csv", "txt"];

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
  const handleRestoreFromHistoryClick = (projectVersion: ProjectHistory) => {
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

  // Handle clicking the "Export" button
  const handleExportJsonClick = () => {
    postData(`/entities/export_all`, { project: projectData._id }).then(
      (response) => {
        FileSaver.saveAs(
          new Blob([response]),
          slugify(
            `export_entities_${dayjs(Date.now()).format("YYYY_MM_DD")}.json`
          )
        );
      }
    );
  };

  // A list of all fields that can be exported, generated when the interface is opened
  const allExportFields = ["name", "created", "owner", "description"];

  // Handle clicking the "Download" button
  const handleDownloadClick = (format: string) => {
    if (_.includes(validExportFormats, format)) {
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
            p={"2"}
            border={"2px"}
            rounded={"md"}
          >
            <Icon name={"project"} size={"lg"} />
            <Heading fontWeight={"semibold"}>{projectData.name}</Heading>
          </Flex>

          {/* Buttons */}
          <Flex direction={"row"} gap={"4"} wrap={"wrap"}>
            {editing && (
              <Popover>
                <PopoverTrigger>
                  <Button
                    colorScheme={"red"}
                    rightIcon={<Icon name={"delete"} />}
                    isDisabled={isUpdating}
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
              colorScheme={editing ? "green" : "blue"}
              rightIcon={
                editing ? <Icon name={"check"} /> : <Icon name={"edit"} />
              }
              onClick={handleEditClick}
              loadingText={"Saving..."}
              isLoading={isUpdating}
            >
              {editing ? "Done" : "Edit"}
            </Button>

            {/* Actions Menu */}
            <Menu>
              <MenuButton
                as={Button}
                colorScheme={"blue"}
                rightIcon={<Icon name={"c_down"} />}
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
                {/* disabled project export as this feature is not ready yet */}
                <MenuItem
                  onClick={handleExportClick}
                  icon={<Icon name={"download"} />}
                >
                  Export
                </MenuItem>
                <MenuItem
                  onClick={handleExportJsonClick}
                  icon={<Icon name={"download"} />}
                >
                  Export Project Entities Json
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Flex>

        <Flex direction={"row"} wrap={"wrap"}>
          <Flex
            direction={"column"}
            p={"4"}
            gap={"4"}
            grow={"1"}
            basis={"50%"}
            h={"fit-content"}
            bg={"white"}
            rounded={"md"}
          >
            <Flex
              direction={"column"}
              p={"4"}
              h={"fit-content"}
              grow={"1"}
              bg={"gray.50"}
              rounded={"md"}
            >
              {/* Project Overview */}
              <Flex gap={"4"} grow={"1"} direction={"column"} minH={"32"}>
                <Flex gap={"2"} direction={"row"}>
                  <Flex gap={"2"} direction={"column"} basis={"40%"}>
                    <Text fontWeight={"semibold"}>Created</Text>
                    <Flex align={"center"} gap={"2"}>
                      <Icon name={"v_date"} size={"sm"} />
                      <Text>
                        {dayjs(projectData.created).format("DD MMM YYYY")}
                      </Text>
                    </Flex>
                    <Text fontWeight={"semibold"}>Owner</Text>
                    <Flex>
                      <Tag colorScheme={"green"}>
                        <TagLabel>{projectData.owner}</TagLabel>
                      </Tag>
                    </Flex>
                  </Flex>

                  <Flex gap={"2"} direction={"column"} basis={"60%"}>
                    <Text fontWeight={"semibold"}>Description</Text>
                    <Textarea
                      value={projectDescription}
                      onChange={(event) => {
                        setProjectDescription(event.target.value);
                      }}
                      isReadOnly={!editing}
                      bg={"white"}
                      border={"2px"}
                      borderColor={"gray.200"}
                    />
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          </Flex>

          {/* Display Entities and Projects */}
          <Flex
            direction={"column"}
            p={"4"}
            gap={"4"}
            grow={"1"}
            basis={"50%"}
            h={"fit-content"}
            bg={"white"}
            rounded={"md"}
          >
            <Flex
              direction={"column"}
              p={"4"}
              h={"fit-content"}
              grow={"1"}
              rounded={"md"}
              border={"2px"}
              borderColor={"gray.200"}
            >
              <Flex
                direction={"row"}
                justify={"space-between"}
                align={"center"}
              >
                {/* Entities in the Project */}
                <Heading fontWeight={"semibold"} size={"md"} pt={"2"} pb={"2"}>
                  Entities
                </Heading>
                {editing && (
                  <Button
                    rightIcon={<Icon name={"add"} />}
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
                    showPagination
                  />
                ) : (
                  <Flex w={"100%"} justify={"center"} align={"center"} minH={"100px"}>
                    <Text color={"gray.400"} fontWeight={"semibold"}>This Project does not contain any Entities.</Text>
                  </Flex>
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
          <ModalContent p={"2"} w={["lg", "xl", "2xl"]}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Export Project</ModalHeader>
            <ModalCloseButton />

            <ModalBody px={"2"}>
              <Flex w={"100%"} direction={"column"} py={"1"} gap={"2"}>
                <Text>Select the Project information to include in the exported file.</Text>
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
                              exportAll ||
                              _.includes(exportFields, "description")
                            }
                            onChange={(event) =>
                              handleExportCheck(
                                "description",
                                event.target.checked
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
                      <Text>Loading details</Text>
                    )}
                  </FormControl>
                </Flex>

                <Flex direction={"column"} gap={"2"}>
                  <FormControl>
                    <FormLabel>Entities</FormLabel>
                    {isLoaded && projectEntities?.length > 0 ? (
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
              <Flex direction={"row"} w={"70%"} gap={"4"} align={"center"} justifySelf={"left"}>
                <Icon name={"info"} />
                {_.isEqual(exportFormat, "json") &&
                  <Text>JSON files can be re-imported into MARS.</Text>
                }
                {_.isEqual(exportFormat, "csv") &&
                  <Text>CSV spreadsheets can be used by other applications.</Text>
                }
                {_.isEqual(exportFormat, "txt") &&
                  <Text>TXT files can be viewed and shared easily.</Text>
                }
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
                        onChange={(event) => setExportFormat(event.target.value)}
                      >
                        <option key={"json"} value={"json"}>JSON</option>
                        <option key={"csv"} value={"csv"}>CSV</option>
                        <option key={"txt"} value={"txt"}>TXT</option>
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
