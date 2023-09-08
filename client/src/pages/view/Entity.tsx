// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  Input,
  Table,
  TableContainer,
  Tbody,
  Th,
  Text,
  Tr,
  useToast,
  Modal,
  Thead,
  Td,
  Textarea,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  Container,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  Tag,
  TagLabel,
  FormControl,
  FormLabel,
  Select,
  TagCloseButton,
  SimpleGrid,
  CheckboxGroup,
  Checkbox,
  Stack,
  FormErrorMessage,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerFooter,
  DrawerBody,
  DrawerHeader,
  VStack,
  Card,
  CardHeader,
  CardBody,
  Spacer,
  Tooltip,
  IconButton,
  Spinner,
  useBreakpoint,
  ModalFooter,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import AttributeCard from "@components/AttributePreview";
import DataTable from "@components/DataTable";
import Graph from "@components/Graph";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Uploader from "@components/Uploader";
import Values from "@components/Values";
import Preview from "@components/Preview";
import { createColumnHelper } from "@tanstack/react-table";

// Existing and custom types
import {
  AttributeModel,
  EntityHistory,
  EntityModel,
  IValue,
  ProjectModel,
} from "@types";

// Utility functions and libraries
import { deleteData, getData, postData } from "src/database/functions";
import { isValidValues } from "src/util";
import _ from "lodash";
import dayjs from "dayjs";
import FileSaver from "file-saver";
import slugify from "slugify";
import { nanoid } from "nanoid";

// Routing and navigation
import { useParams, useNavigate } from "react-router-dom";

const Entity = () => {
  const { id } = useParams();
  const breakpoint = useBreakpoint();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    isOpen: isGraphOpen,
    onOpen: onGraphOpen,
    onClose: onGraphClose,
  } = useDisclosure();

  const {
    isOpen: isAddProjectsOpen,
    onOpen: onAddProjectsOpen,
    onClose: onAddProjectsClose,
  } = useDisclosure();
  const [projectData, setProjectData] = useState([] as ProjectModel[]);
  const [selectedProjects, setSelectedProjects] = useState(
    [] as string[]
  );

  const [allEntities, setAllEntities] = useState(
    [] as { name: string; id: string }[]
  );

  const {
    isOpen: isAddProductsOpen,
    onOpen: onAddProductsOpen,
    onClose: onAddProductsClose,
  } = useDisclosure();
  const {
    isOpen: isAddOriginsOpen,
    onOpen: onAddOriginsOpen,
    onClose: onAddOriginsClose,
  } = useDisclosure();
  const [selectedProducts, setSelectedProducts] = useState([] as string[]);
  const [selectedOrigins, setSelectedOrigins] = useState([] as string[]);

  // History drawer
  const {
    isOpen: isHistoryOpen,
    onOpen: onHistoryOpen,
    onClose: onHistoryClose,
  } = useDisclosure();

  // Adding Attributes to existing Entity
  const {
    isOpen: isAddAttributesOpen,
    onOpen: onAddAttributesOpen,
    onClose: onAddAttributesClose,
  } = useDisclosure();
  const [attributeName, setAttributeName] = useState("");
  const [attributeDescription, setAttributeDescription] = useState("");
  const [attributeValues, setAttributeValues] = useState([] as IValue<any>[]);

  const isAttributeNameError = attributeName === "";
  const isAttributeDescriptionError = attributeDescription === "";
  const [isAttributeValueError, setIsAttributeValueError] = useState(false);
  const isAttributeError =
    isAttributeNameError ||
    isAttributeDescriptionError ||
    isAttributeValueError;

  const [attributes, setAttributes] = useState([] as AttributeModel[]);

  useEffect(() => {
    // Get all Attributes
    getData(`/attributes`)
      .then((response) => {
        setAttributes(response);
      })
      .catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Attributes data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  useEffect(() => {
    setIsAttributeValueError(
      !isValidValues(attributeValues) || attributeValues.length === 0
    );
  }, [attributeValues]);

  // Toggles
  const [isError, setIsError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [exportAll, setExportAll] = useState(false);

  // Break up entity data into editable fields
  const [entityData, setEntityData] = useState({} as EntityModel);
  const [entityDescription, setEntityDescription] = useState("");
  const [entityProjects, setEntityProjects] = useState([] as string[]);
  const [entityOrigins, setEntityOrigins] = useState(
    [] as { name: string; id: string }[]
  );
  const [entityProducts, setEntityProducts] = useState(
    [] as { name: string; id: string }[]
  );
  const [entityAttributes, setEntityAttributes] = useState(
    [] as AttributeModel[]
  );
  const [entityHistory, setEntityHistory] = useState([] as EntityHistory[]);
  const [entityAttachments, setEntityAttachments] = useState(
    [] as { name: string; id: string }[]
  );
  const [toUploadAttachments, setToUploadAttachments] = useState(
    [] as string[]
  );

  const {
    isOpen: isExportOpen,
    onOpen: onExportOpen,
    onClose: onExportClose,
  } = useDisclosure();
  const [exportFields, setExportFields] = useState([] as string[]);

  const {
    isOpen: isUploadOpen,
    onOpen: onUploadOpen,
    onClose: onUploadClose,
  } = useDisclosure();

  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);
  const [previewSource, setPreviewSource] = useState("");
  const [previewType, setPreviewType] = useState("");
  const {
    isOpen: isPreviewOpen,
    onOpen: onPreviewOpen,
    onClose: onPreviewClose,
  } = useDisclosure();

  useEffect(() => {
    getData(`/entities/${id}`)
      .then((response) => {
        // Store all received data and assign to specific fields
        setEntityData(response);
        setEntityDescription(response.description || "");
        setEntityProjects(response.projects);
        setEntityOrigins(response.associations.origins);
        setEntityProducts(response.associations.products);
        setEntityAttributes(response.attributes);
        setEntityAttachments(response.attachments);
        setEntityHistory(response.history);
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

    // Populate Project data
    getData(`/projects`)
      .then((response) => {
        setProjectData(response);
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

    // Populate Entities data
    getData(`/entities`)
      .then((response) => {
        setAllEntities(
          (response as EntityModel[])
            .filter((entity) => !_.isEqual(entityData._id, entity._id))
            .map((entity) => {
              return { id: entity._id, name: entity.name };
            })
        );
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Could not retrieve Entities data.",
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
  }, [id]);

  // Toggle editing status
  const handleEditClick = () => {
    if (editing) {
      setIsUpdating(true);

      // Collate Entity update data
      const updateData: EntityModel = {
        _id: entityData._id,
        name: entityData.name,
        created: entityData.created,
        deleted: entityData.deleted,
        locked: entityData.locked,
        owner: entityData.owner,
        description: entityDescription,
        projects: entityProjects,
        associations: {
          origins: entityOrigins,
          products: entityProducts,
        },
        attributes: entityAttributes,
        attachments: entityAttachments,
        history: entityHistory,
      };

      // Update data
      postData(`/entities/update`, updateData)
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
          postData(`/entities/lock/${id}`, {
            entity: {
              name: entityData.name,
              id: entityData._id,
            },
            lockState: false,
          }).then((_response) => {
            setEditing(false);
          });
          setIsUpdating(false);
        });
    } else {
      postData(`/entities/lock/${id}`, {
        entity: {
          name: entityData.name,
          id: entityData._id,
        },
        lockState: true,
      }).then((_response) => {
        setEditing(true);
      });
    }
  };

  /**
   * Restore an Entity from a deleted status
   */
  const handleRestoreFromDeleteClick = () => {
    // Collate data for updating
    const updateData: EntityModel = {
      _id: entityData._id,
      name: entityData.name,
      created: entityData.created,
      deleted: false,
      locked: false,
      owner: entityData.owner,
      description: entityDescription,
      projects: entityProjects,
      associations: {
        origins: entityOrigins,
        products: entityProducts,
      },
      attributes: entityAttributes,
      attachments: entityAttachments,
      history: entityData.history,
    };

    setIsLoaded(false);

    // Update data
    postData(`/entities/update`, updateData)
      .then((_response) => {
        toast({
          title: "Restored!",
          status: "success",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "An error occurred when restoring this Entity.",
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .finally(() => {
        // Apply updated state
        setEntityData(updateData);
        setEntityDescription(updateData.description || "");
        setEntityProjects(updateData.projects);
        setEntityOrigins(updateData.associations.origins);
        setEntityProducts(updateData.associations.products);
        setEntityAttributes(updateData.attributes);
        setEntityHistory(updateData.history);
        setIsLoaded(true);
      });
  };

  const truncateTableText =
    _.isEqual(breakpoint, "sm") ||
    _.isEqual(breakpoint, "base") ||
    _.isUndefined(breakpoint);

  // Configure Projects table columns and data
  const projectsTableColumns = [
    {
      id: (info: any) => info.row.original,
      cell: (info: any) => (
        <Linky id={info.row.original} type={"projects"} />
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
                aria-label={"Remove project"}
                colorScheme={"red"}
                onClick={() => {
                  removeProject(info.row.original);
                }}
              />
            ) : (
              <Button
                key={`view-${info.row.original}`}
                rightIcon={<Icon name={"c_right"} />}
                colorScheme={"gray"}
                onClick={() => navigate(`/projects/${info.row.original}`)}
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

  // Configure origins table columns and data
  const originTableColumnHelper = createColumnHelper<{
    id: string;
    name: string;
  }>();
  const originTableColumns = [
    originTableColumnHelper.accessor("name", {
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
    originTableColumnHelper.accessor("id", {
      cell: (info) => {
        return (
          <Flex w={"100%"} justify={"end"}>
            {editing ? (
              <IconButton
                icon={<Icon name={"delete"} />}
                aria-label={"Remove origin"}
                colorScheme={"red"}
                onClick={() => {
                  removeOrigin(info.row.original.id);
                }}
              />
            ) : (
              <Button
                key={`view-${info.row.original.id}`}
                rightIcon={<Icon name={"c_right"} />}
                colorScheme={"gray"}
                onClick={() => navigate(`/entities/${info.row.original.id}`)}
              >
                View
              </Button>
            )}
          </Flex>
        );
      },
      header: "",
    }),
  ];

  // Configure products table columns and data
  const productTableColumnHelper = createColumnHelper<{
    id: string;
    name: string;
  }>();
  const productTableColumns = [
    productTableColumnHelper.accessor("name", {
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
    productTableColumnHelper.accessor("id", {
      cell: (info) => {
        return (
          <Flex w={"100%"} justify={"end"}>
            {editing ? (
              <IconButton
                icon={<Icon name={"delete"} />}
                aria-label={"Remove product"}
                colorScheme={"red"}
                onClick={() => {
                  removeProduct(info.row.original.id);
                }}
              />
            ) : (
              <Button
                key={`view-${info.row.original.id}`}
                rightIcon={<Icon name={"c_right"} />}
                colorScheme={"gray"}
                onClick={() => navigate(`/entities/${info.row.original.id}`)}
              >
                View
              </Button>
            )}
          </Flex>
        );
      },
      header: "",
    }),
  ];

  // Configure attachment table columns and data
  const attachmentTableColumnHelper = createColumnHelper<{
    id: string;
    name: string;
  }>();
  const attachmentTableColumns = [
    attachmentTableColumnHelper.accessor("name", {
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
    attachmentTableColumnHelper.accessor("id", {
      cell: (info) => {
        const handleDownload = () => {
          getData(`/system/download/${info.getValue()}`, {
            responseType: "blob",
          })
            .then((response) => {
              FileSaver.saveAs(
                new Blob([response], { type: "image/jpeg" }),
                slugify(info.row.original.name)
              );
            })
            .catch((error) => {
              console.error(error);
            });
        };

        const handlePreview = () => {
          setIsPreviewLoaded(false);
          onPreviewOpen();

          getData(`/system/file/${info.getValue()}`)
            .then((response: { status: boolean; data: any[] }) => {
              // Set attachment type
              setPreviewType(response.data[0].metadata.type);

              // Get attachment
              getData(`/system/download/${info.getValue()}`, {
                responseType: "blob",
              })
                .then((response) => {
                  setPreviewSource(URL.createObjectURL(response));
                  setIsPreviewLoaded(true);
                })
                .catch((error) => {
                  console.error(error);
                });
            })
            .catch((error) => {
              console.error(error);
            });
        };

        return (
          <Flex w={"100%"} justify={"end"} gap={"4"}>
            <IconButton
              aria-label={"Preview attachment"}
              key={`preview-file-${info.getValue()}`}
              colorScheme={"gray"}
              icon={<Icon name={"view"} />}
              onClick={() => handlePreview()}
            />
            {editing ? (
              <IconButton
                aria-label={"Delete attachment"}
                key={`delete-file-${info.getValue()}`}
                colorScheme={"red"}
                icon={<Icon name={"delete"} />}
                onClick={() => removeAttachment(info.getValue())}
              />
            ) : (
              <IconButton
                aria-label={"Download attachment"}
                key={`download-file-${info.getValue()}`}
                colorScheme={"blue"}
                icon={<Icon name={"download"} />}
                onClick={() => handleDownload()}
              />
            )}
          </Flex>
        );
      },
      header: "",
    }),
  ];

  /**
   * Restore an Entity from an earlier point in time
   * @param {EntityHistory} entityVersion historical Entity data to restore
   */
  const handleRestoreFromHistoryClick = (entityVersion: EntityHistory) => {
    const updateData: EntityModel = {
      _id: entityData._id,
      name: entityData.name,
      created: entityData.created,
      deleted: entityVersion.deleted,
      locked: entityData.locked,
      owner: entityVersion.owner,
      description: entityVersion.description,
      projects: entityVersion.projects,
      associations: {
        origins: entityVersion.associations.origins,
        products: entityVersion.associations.products,
      },
      attributes: entityVersion.attributes,
      attachments: entityVersion.attachments,
      history: entityData.history,
    };

    setIsLoaded(false);

    // Update data
    postData(`/entities/update`, updateData)
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
        setEntityData(updateData);
        setEntityDescription(updateData.description || "");
        setEntityProjects(updateData.projects);
        setEntityOrigins(updateData.associations.origins);
        setEntityProducts(updateData.associations.products);
        setEntityAttributes(updateData.attributes);
        setEntityHistory(updateData.history);
        setIsLoaded(true);
      });
  };

  // Handle clicking the "Export" button
  const handleExportClick = () => {
    setEntityData(entityData);
    onExportOpen();
  };

  // Handle clicking the "Download" button
  const handleDownloadClick = (format: "json" | "csv" | "txt") => {
    // Send POST data to generate file
    postData(`/entities/export/${id}`, {
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
          slugify(`${entityData.name.replace(" ", "")}_export.${format}`)
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
          description: "An error occurred when exporting this Entity.",
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      });
  };

  // A list of all fields that can be exported, generated when the interface is opened
  const allExportFields = ["name", "created", "owner", "description"];

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

  // Delete the Entity when confirmed
  const handleDeleteClick = () => {
    // Update data
    deleteData(`/entities/${id}`)
      .then((_response) => {
        setEditing(false);
        navigate("/entities");

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
          description: `An error occurred when deleting Entity "${entityData.name}"`,
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      });
  };

  const handleEntityNodeClick = (id: string) => {
    onGraphClose();
    navigate(`/entities/${id}`);
  };

  // Add Products to the Entity state
  const addProducts = (products: string[]): void => {
    setEntityProducts([
      ...entityProducts,
      ...allEntities.filter((entity) => products.includes(entity.id)),
    ]);
    setSelectedProducts([]);
    onAddProductsClose();
  };

  // Remove Products from the Entity state
  const removeProduct = (id: string) => {
    setEntityProducts(
      entityProducts.filter((product) => {
        return product.id !== id;
      })
    );
  };

  // Add Origins to the Entity state
  const addOrigins = (origins: string[]): void => {
    setEntityOrigins([
      ...entityOrigins,
      ...allEntities.filter((entity) => origins.includes(entity.id)),
    ]);
    setSelectedOrigins([]);
    onAddOriginsClose();
  };

  // Remove Origins from the Entity state
  const removeOrigin = (id: string) => {
    setEntityOrigins(
      entityOrigins.filter((origin) => {
        return origin.id !== id;
      })
    );
  };

  // Remove a Project from the Entity state
  const removeProject = (id: string) => {
    setEntityProjects(
      entityProjects.filter((project) => {
        return project !== id;
      })
    );
  };

  // Remove Attachments from the Entity state
  const removeAttachment = (id: string) => {
    setEntityAttachments(
      entityAttachments.filter((attachment) => {
        return attachment.id !== id;
      })
    );
  };

  // Remove Attributes from the Entity state
  const removeAttribute = (id: string) => {
    setEntityAttributes(
      entityAttributes.filter((attribute) => {
        return attribute._id !== id;
      })
    );
  };

  // Add Attributes to the Entity state
  const addAttribute = () => {
    setEntityAttributes(() => [
      ...entityAttributes,
      {
        _id: `a-${entityData._id}-${nanoid(6)}`,
        name: attributeName,
        description: attributeDescription,
        values: attributeValues,
      },
    ]);
    onAddAttributesClose();

    // Reset state of creating an Attribute
    setAttributeName("");
    setAttributeDescription("");
    setAttributeValues([]);
  };

  // Handle updates to Attributes
  const handleUpdateAttribute = (updated: AttributeModel) => {
    // Find the Attribute and update the state
    setEntityAttributes([
      ...entityAttributes.map((attribute) => {
        if (_.isEqual(attribute._id, updated._id)) {
          attribute.description = updated.description;
          attribute.values = _.cloneDeep(updated.values);
        }
        return attribute;
      }),
    ]);
  };

  // Handle cancelling adding an Attribute by clearing the state
  const handleCancelAttribute = () => {
    onAddAttributesClose();

    // Reset state of creating an Attribute
    setAttributeName("");
    setAttributeDescription("");
    setAttributeValues([]);
  };

  /**
   * Callback function to the Entity to Projects
   * @param {string[]} projects List of Projects to add the Entities to
   */
  const addProjects = (projects: string[]): void => {
    setEntityProjects([
      ...entityProjects,
      ...projects.filter((project) => !_.isEqual("", project)),
    ]);
    setSelectedProjects([]);
    onAddProjectsClose();
  };

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
            <Icon name={"entity"} size={"lg"} />
            <Heading fontWeight={"semibold"}>{entityData.name}</Heading>
            {entityData.deleted && <Icon name={"delete"} size={"lg"} />}
          </Flex>

          {/* Buttons */}
          <Flex gap={"4"}>
            <Flex
              direction={"row"}
              align={"center"}
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
                    >
                      Delete
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader>Confirmation</PopoverHeader>
                    <PopoverBody>
                      Are you sure you want to delete this Entity?
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
              {entityData.deleted ? (
                <Button
                  onClick={handleRestoreFromDeleteClick}
                  colorScheme={"orange"}
                  rightIcon={<Icon name={"rewind"} />}
                >
                  Restore
                </Button>
              ) : (
                <Flex gap={"4"}>
                  {entityData.locked ? (
                    <Tooltip label={"Currently being edited by another user"}>
                      <Button
                        colorScheme={"gray"}
                        rightIcon={<Icon name={"lock"} />}
                        disabled={entityData.locked}
                      >
                        Edit
                      </Button>
                    </Tooltip>
                  ) : (
                    <Button
                      onClick={handleEditClick}
                      colorScheme={editing ? "green" : "gray"}
                      rightIcon={
                        editing ? (
                          <Icon name={"check"} />
                        ) : (
                          <Icon name={"edit"} />
                        )
                      }
                      disabled={entityData.locked}
                      loadingText={"Saving..."}
                      isLoading={isUpdating}
                    >
                      {editing ? "Done" : "Edit"}
                    </Button>
                  )}
                </Flex>
              )}
            </Flex>

            <Flex
              direction={"row"}
              align={"center"}
              gap={"4"}
              wrap={"wrap"}
              p={"4"}
              rounded={"md"}
            >
              <Button
                colorScheme={"gray"}
                rightIcon={<Icon name={"clock"} />}
                onClick={onHistoryOpen}
              >
                History
              </Button>
              <Button
                onClick={onGraphOpen}
                rightIcon={<Icon name={"graph"} />}
                colorScheme={"orange"}
                isDisabled={editing || entityData.deleted}
              >
                Visualize
              </Button>
              <Button
                onClick={handleExportClick}
                rightIcon={<Icon name={"download"} />}
                colorScheme={"blue"}
                isDisabled={editing || entityData.deleted}
              >
                Export
              </Button>
            </Flex>
          </Flex>
        </Flex>

        <Flex direction={"row"} gap={"4"} wrap={"wrap"}>
          <Flex
            direction={"column"}
            p={"4"}
            gap={"4"}
            grow={"1"}
            h={"fit-content"}
            bg={"white"}
            rounded={"md"}
          >
            {/* Details */}
            <Flex
              gap={"2"}
              p={"4"}
              grow={"1"}
              direction={"column"}
              minH={"32"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.100"}
            >
              <Heading size={"lg"}>Details</Heading>
              <TableContainer>
                <Table variant={"simple"} colorScheme={"gray"}>
                  <Thead>
                    <Tr>
                      <Th maxW={"xs"}>Field</Th>
                      <Th>Value</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td>Created</Td>
                      <Td>
                        <Text>
                          {dayjs(entityData.created).format("DD MMM YYYY")}
                        </Text>
                      </Td>
                    </Tr>

                    <Tr>
                      <Td>Owner</Td>
                      <Td>
                        <Tag colorScheme={"green"}>
                          <TagLabel>
                            {entityData.owner}
                          </TagLabel>
                        </Tag>
                      </Td>
                    </Tr>

                    <Tr>
                      <Td>Description</Td>
                      <Td>
                        <Textarea
                          value={entityDescription}
                          onChange={(event) => {
                            setEntityDescription(event.target.value || "");
                          }}
                          disabled={!editing}
                        />
                      </Td>
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            </Flex>

            {/* Projects */}
            <Flex
              gap={"2"}
              p={"4"}
              grow={"1"}
              direction={"column"}
              minH={"32"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.100"}
            >
              <Flex direction={"row"} justify={"space-between"}>
                <Heading size={"lg"}>Projects</Heading>
                {editing ? (
                  <Button
                    colorScheme={"green"}
                    rightIcon={<Icon name={"add"} />}
                    disabled={!editing}
                    onClick={onAddProjectsOpen}
                  >
                    Add
                  </Button>
                ) : null}
              </Flex>

              {entityProjects.length === 0 ? (
                <Text>No Projects.</Text>
              ) : (
                <DataTable
                  data={entityProjects}
                  columns={projectsTableColumns}
                  visibleColumns={{}}
                  viewOnly={!editing}
                  showSelection={editing}
                />
              )}
            </Flex>
          </Flex>

          <Flex
            direction={"column"}
            p={"4"}
            gap={"4"}
            grow={"2"}
            h={"fit-content"}
            bg={"white"}
            rounded={"md"}
          >
            {/* Origins */}
            <Flex
              gap={"2"}
              p={"4"}
              grow={"1"}
              direction={"column"}
              minH={"32"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.100"}
            >
              <Flex direction={"row"} justify={"space-between"}>
                <Heading size={"lg"}>Origins</Heading>
                {editing ? (
                  <Button
                    colorScheme={"green"}
                    rightIcon={<Icon name={"add"} />}
                    disabled={!editing}
                    onClick={onAddOriginsOpen}
                  >
                    Add
                  </Button>
                ) : null}
              </Flex>

              {entityOrigins.length === 0 ? (
                <Text>No Origins.</Text>
              ) : (
                <DataTable
                  data={entityOrigins}
                  columns={originTableColumns}
                  visibleColumns={{}}
                  viewOnly={!editing}
                  showSelection={editing}
                />
              )}
            </Flex>

            {/* Products */}
            <Flex
              gap={"2"}
              p={"4"}
              grow={"1"}
              direction={"column"}
              minH={"32"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.100"}
            >
              <Flex direction={"row"} justify={"space-between"}>
                <Heading size={"lg"}>Products</Heading>
                {editing ? (
                  <Button
                    colorScheme={"green"}
                    rightIcon={<Icon name={"add"} />}
                    disabled={!editing}
                    onClick={onAddProductsOpen}
                  >
                    Add
                  </Button>
                ) : null}
              </Flex>

              {entityProducts.length === 0 ? (
                <Text>No Products.</Text>
              ) : (
                <DataTable
                  data={entityProducts}
                  columns={productTableColumns}
                  visibleColumns={{}}
                  viewOnly={!editing}
                  showSelection={editing}
                />
              )}
            </Flex>
          </Flex>
        </Flex>

        <Flex direction={"row"} gap={"4"} p={"4"} wrap={"wrap"}>
          {/* Attributes */}
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
            <Flex direction={"row"} justify={"space-between"}>
              <Heading size={"lg"}>Attributes</Heading>
              {editing ? (
                <Button
                  colorScheme={"green"}
                  rightIcon={<Icon name={"add"} />}
                  disabled={!editing}
                  onClick={onAddAttributesOpen}
                >
                  Add
                </Button>
              ) : null}
            </Flex>

            <SimpleGrid
              spacing={"4"}
              templateColumns={"repeat(auto-fill, minmax(300px, 1fr))"}
            >
              {entityAttributes.length > 0 ? (
                entityAttributes.map((attribute) => {
                  return (
                    <Flex
                      key={`${attribute._id}`}
                      direction={"column"}
                      gap={"2"}
                      width={"100%"}
                    >
                      <AttributeCard
                        attribute={attribute}
                        editing={editing}
                        doneCallback={handleUpdateAttribute}
                        cancelCallback={handleCancelAttribute}
                        removeCallback={() => {
                          removeAttribute(attribute._id);
                        }}
                      />
                    </Flex>
                  );
                })
              ) : (
                <Text>No Attributes.</Text>
              )}
            </SimpleGrid>
          </Flex>

          {/* Attachments */}
          <Flex
            direction={"column"}
            p={"4"}
            gap={"4"}
            maxW={"2xl"}
            grow={"1"}
            h={"fit-content"}
            bg={"white"}
            rounded={"md"}
            border={"1px"}
            borderColor={"gray.100"}
          >
            <Flex gap={"2"} direction={"column"} minH={"32"}>
              <Flex direction={"row"} justify={"space-between"}>
                <Heading size={"lg"}>Attachments</Heading>
                <Button
                  colorScheme={"green"}
                  rightIcon={<Icon name={"upload"} />}
                  onClick={onUploadOpen}
                >
                  Upload
                </Button>
              </Flex>

              {entityAttachments.length === 0 ? (
                <Text>No Attachments.</Text>
              ) : (
                <DataTable
                  data={entityAttachments}
                  columns={attachmentTableColumns}
                  visibleColumns={{}}
                  viewOnly={!editing}
                  showSelection={editing}
                />
              )}
            </Flex>
          </Flex>
        </Flex>

        {/* Add Attributes modal */}
        <Modal
          isOpen={isAddAttributesOpen}
          onClose={onAddAttributesClose}
          size={"3xl"}
          isCentered
        >
          <ModalOverlay />
          <ModalContent p={"2"} gap={"4"} w={["auto"]}>
            <ModalHeader p={"2"}>Add Attribute</ModalHeader>
            <ModalCloseButton />

            <ModalBody p={"2"}>
              {/* Attribute creation */}
              <Flex justify={"center"}>
                <Flex
                  direction={"column"}
                  gap={"6"}
                  pb={"6"}
                  mb={["12", "8"]}
                  maxW={"7xl"}
                  justify={"center"}
                >
                  <Flex direction={"column"}>
                    <Heading fontWeight={"semibold"} size={"lg"}>
                      Details
                    </Heading>
                    <Text>
                      Specify some basic details about this Attribute. The
                      metadata associated with this Entity should be specified
                      using Values.
                    </Text>
                  </Flex>

                  <Flex>
                    <Select
                      placeholder={"Use template Attribute"}
                      onChange={(event) => {
                        if (!_.isEqual(event.target.value.toString(), "")) {
                          for (let attribute of attributes) {
                            if (
                              _.isEqual(
                                event.target.value.toString(),
                                attribute._id
                              )
                            ) {
                              setAttributeName(attribute.name);
                              setAttributeDescription(attribute.description);
                              setAttributeValues(() => [...attribute.values]);
                              break;
                            }
                          }
                        }
                      }}
                    >
                      {isLoaded &&
                        attributes.map((attribute) => {
                          return (
                            <option key={attribute._id} value={attribute._id}>
                              {attribute.name}
                            </option>
                          );
                        })}
                      ;
                    </Select>
                  </Flex>

                  <Flex
                    direction={"column"}
                    gap={"2"}
                    w={"100%"}
                    justify={"center"}
                  >
                    <Flex direction={"row"} gap={"4"} wrap={["wrap", "nowrap"]}>
                      <FormControl isRequired>
                        <FormLabel>Name</FormLabel>
                        <Input
                          placeholder={"Name"}
                          value={attributeName}
                          onChange={(event) =>
                            setAttributeName(event.target.value)
                          }
                          required
                        />
                        {isAttributeNameError && (
                          <FormErrorMessage>
                            A name must be specified for the Attribute.
                          </FormErrorMessage>
                        )}
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Description</FormLabel>
                        <Textarea
                          value={attributeDescription}
                          placeholder={"Attribute Description"}
                          onChange={(event) =>
                            setAttributeDescription(event.target.value)
                          }
                        />
                        {isAttributeDescriptionError && (
                          <FormErrorMessage>
                            A description should be provided for the Attribute.
                          </FormErrorMessage>
                        )}
                      </FormControl>
                    </Flex>

                    <Flex>
                      <FormControl isRequired isInvalid={isAttributeValueError}>
                        <FormLabel>Values</FormLabel>
                        <Values
                          viewOnly={false}
                          values={attributeValues}
                          setValues={setAttributeValues}
                        />
                      </FormControl>
                    </Flex>
                  </Flex>

                  {/* "Done" button */}
                  <Flex direction={"row"} p={"md"} justify={"center"} gap={"8"}>
                    <Button
                      colorScheme={"red"}
                      variant={"outline"}
                      rightIcon={<Icon name={"cross"} />}
                      onClick={onAddAttributesClose}
                    >
                      Cancel
                    </Button>

                    <Button
                      colorScheme={"green"}
                      rightIcon={<Icon name={"check"} />}
                      disabled={isAttributeError}
                      onClick={() => {
                        addAttribute();
                      }}
                    >
                      Done
                    </Button>
                  </Flex>
                </Flex>
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Add Projects modal */}
        <Modal
          isOpen={isAddProjectsOpen}
          onClose={onAddProjectsClose}
          isCentered
        >
          <ModalOverlay />
          <ModalContent p={"2"} gap={"4"} w={["lg", "xl", "2xl"]}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Add to Project</ModalHeader>
            <ModalCloseButton />

            <ModalBody p={"2"}>
              {/* Select component for Projects */}
              <Flex direction={"column"} gap={"2"}>
                <FormControl>
                  <FormLabel>Add Entity to Projects</FormLabel>
                  <Select
                    title="Select Project"
                    placeholder={"Select Project"}
                    onChange={(event) => {
                      const selectedProject = event.target.value.toString();
                      if (selectedProjects.includes(selectedProject)) {
                        toast({
                          title: "Warning",
                          description: "Project has already been selected.",
                          status: "warning",
                          duration: 2000,
                          position: "bottom-right",
                          isClosable: true,
                        });
                      } else {
                        setSelectedProjects([
                          ...selectedProjects,
                          selectedProject,
                        ]);
                      }
                    }}
                  >
                    {isLoaded &&
                      projectData.map((project) => {
                        return (
                          <option key={project._id} value={project._id}>
                            {project.name}
                          </option>
                        );
                      })}
                    ;
                  </Select>
                </FormControl>

                <Flex direction={"row"} p={"2"} gap={"2"}>
                  {selectedProjects.map((project) => {
                    if (!_.isEqual(project, "")) {
                      return (
                        <Tag key={`tag-${project}`}>
                          <TagLabel>
                            <Linky id={project} type={"projects"} />
                          </TagLabel>
                          <TagCloseButton
                            onClick={() => {
                              setSelectedProjects(
                                selectedProjects.filter((selected) => {
                                  return !_.isEqual(project, selected);
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
              <Flex direction={"row"} gap={"8"} justify={"center"}>
                <Button
                  colorScheme={"red"}
                  variant={"outline"}
                  rightIcon={<Icon name={"cross"} />}
                  onClick={onAddProjectsClose}
                >
                  Cancel
                </Button>

                <Button
                  colorScheme={"green"}
                  rightIcon={<Icon name={"check"} />}
                  onClick={() => {
                    addProjects(selectedProjects);
                  }}
                >
                  Done
                </Button>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Add Products modal */}
        <Modal
          isOpen={isAddProductsOpen}
          onClose={onAddProductsClose}
          isCentered
        >
          <ModalOverlay />
          <ModalContent p={"2"} gap={"4"} w={["lg", "xl", "2xl"]}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Add Products</ModalHeader>
            <ModalCloseButton />

            <ModalBody p={"2"}>
              {/* Select component for Entities */}
              <Flex direction={"column"} gap={"2"}>
                <FormControl>
                  <FormLabel>Add Products</FormLabel>
                  <Select
                    title="Select Products"
                    placeholder={"Select Product"}
                    onChange={(event) => {
                      if (
                        entityProducts
                          .map((product) => product.id)
                          .includes(event.target.value.toString())
                      ) {
                        toast({
                          title: "Warning",
                          description: "Product has already been selected.",
                          status: "warning",
                          duration: 2000,
                          position: "bottom-right",
                          isClosable: true,
                        });
                      } else {
                        setSelectedProducts([
                          ...selectedProducts,
                          event.target.value.toString(),
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
                  {selectedProducts.map((entity) => {
                    if (!_.isEqual(entity, "")) {
                      return (
                        <Tag key={`tag-${entity}`}>
                          <TagLabel>
                            <Linky id={entity} type={"entities"} />
                          </TagLabel>
                          <TagCloseButton
                            onClick={() => {
                              setSelectedProducts(
                                selectedProducts.filter((selected) => {
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
              <Flex direction={"row"} gap={"8"} justify={"center"}>
                <Button
                  colorScheme={"red"}
                  variant={"outline"}
                  rightIcon={<Icon name={"cross"} />}
                  onClick={onAddProductsClose}
                >
                  Cancel
                </Button>

                <Button
                  colorScheme={"green"}
                  rightIcon={<Icon name={"check"} />}
                  onClick={() => {
                    if (id) {
                      // Add the Entities to the Project
                      addProducts(selectedProducts);
                    }
                  }}
                >
                  Done
                </Button>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Add Origins modal */}
        <Modal isOpen={isAddOriginsOpen} onClose={onAddOriginsClose} isCentered>
          <ModalOverlay />
          <ModalContent p={"2"} gap={"4"} w={["lg", "xl", "2xl"]}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Add Origins</ModalHeader>
            <ModalCloseButton />

            <ModalBody p={"2"}>
              {/* Select component for Entities */}
              <Flex direction={"column"} gap={"2"}>
                <FormControl>
                  <FormLabel>Add Origins</FormLabel>
                  <Select
                    title="Select Origins"
                    placeholder={"Select Origin"}
                    onChange={(event) => {
                      if (
                        entityOrigins
                          .map((origin) => origin.id)
                          .includes(event.target.value.toString())
                      ) {
                        toast({
                          title: "Warning",
                          description: "Origin has already been selected.",
                          status: "warning",
                          duration: 2000,
                          position: "bottom-right",
                          isClosable: true,
                        });
                      } else {
                        setSelectedOrigins([
                          ...selectedOrigins,
                          event.target.value.toString(),
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
                  {selectedOrigins.map((entity) => {
                    if (!_.isEqual(entity, "")) {
                      return (
                        <Tag key={`tag-${entity}`}>
                          <TagLabel>
                            <Linky id={entity} type={"entities"} />
                          </TagLabel>
                          <TagCloseButton
                            onClick={() => {
                              setSelectedOrigins(
                                selectedOrigins.filter((selected) => {
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
              <Flex direction={"row"} gap={"8"} justify={"center"}>
                <Button
                  colorScheme={"red"}
                  variant={"outline"}
                  rightIcon={<Icon name={"cross"} />}
                  onClick={onAddOriginsClose}
                >
                  Cancel
                </Button>

                <Button
                  colorScheme={"green"}
                  rightIcon={<Icon name={"check"} />}
                  onClick={() => {
                    if (id) {
                      // Add the Entities to the Project
                      addOrigins(selectedOrigins);
                    }
                  }}
                >
                  Done
                </Button>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Upload modal */}
        <Uploader
          isOpen={isUploadOpen}
          onOpen={onUploadOpen}
          onClose={onUploadClose}
          uploads={toUploadAttachments}
          setUploads={setToUploadAttachments}
          target={entityData._id}
        />

        {/* Export modal */}
        <Modal
          isOpen={isExportOpen}
          onClose={onExportClose}
          size={"2xl"}
          isCentered
        >
          <ModalOverlay />
          <ModalContent p={"2"} gap={"4"} w={["lg", "xl", "2xl"]}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Export Entity</ModalHeader>
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
                            Name: {entityData.name}
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
                            {dayjs(entityData.created).format("DD MMM YYYY")}
                          </Checkbox>
                          <Checkbox
                            isChecked={
                              exportAll || _.includes(exportFields, "owner")
                            }
                            onChange={(event) =>
                              handleExportCheck("owner", event.target.checked)
                            }
                          >
                            Owner: {entityData.owner}
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
                            disabled={_.isEqual(entityDescription, "")}
                          >
                            <Text noOfLines={1}>
                              Description:{" "}
                              {_.isEqual(entityDescription, "")
                                ? "No description"
                                : entityDescription}
                            </Text>
                          </Checkbox>
                        </Stack>
                      </CheckboxGroup>
                    ) : (
                      <Text>Loading details</Text>
                    )}
                  </FormControl>
                  <FormControl>
                    <FormLabel>Projects</FormLabel>
                    {isLoaded && entityProjects.length > 0 ? (
                      <Stack spacing={2} direction={"column"}>
                        {entityProjects.map((project) => {
                          allExportFields.push(`project_${project}`);
                          return (
                            <Checkbox
                              key={project}
                              isChecked={
                                exportAll ||
                                _.includes(
                                  exportFields,
                                  `project_${project}`
                                )
                              }
                              onChange={(event) =>
                                handleExportCheck(
                                  `project_${project}`,
                                  event.target.checked
                                )
                              }
                            >
                              Project:{" "}
                              {<Linky id={project} type={"projects"} />}
                            </Checkbox>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Text>No Projects.</Text>
                    )}
                  </FormControl>
                </Flex>

                <Flex direction={"column"} gap={"2"}>
                  <FormControl>
                    <FormLabel>Associations: Origins</FormLabel>
                    {isLoaded && entityOrigins.length > 0 ? (
                      <Stack spacing={2} direction={"column"}>
                        {entityOrigins.map((origin) => {
                          allExportFields.push(`origin_${origin.id}`);
                          return (
                            <Checkbox
                              key={origin.id}
                              isChecked={
                                exportAll ||
                                _.includes(exportFields, `origin_${origin.id}`)
                              }
                              onChange={(event) =>
                                handleExportCheck(
                                  `origin_${origin.id}`,
                                  event.target.checked
                                )
                              }
                            >
                              Origin: {origin.name}
                            </Checkbox>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Text>No Origins.</Text>
                    )}
                  </FormControl>
                  <FormControl>
                    <FormLabel>Associations: Products</FormLabel>
                    {isLoaded && entityProducts.length > 0 ? (
                      <Stack spacing={2} direction={"column"}>
                        {entityProducts.map((product) => {
                          allExportFields.push(`product_${product.id}`);
                          return (
                            <Checkbox
                              key={product.id}
                              isChecked={
                                exportAll ||
                                _.includes(exportFields, `product_${product.id}`)
                              }
                              onChange={(event) =>
                                handleExportCheck(
                                  `product_${product.id}`,
                                  event.target.checked
                                )
                              }
                            >
                              Product: {product.name}
                            </Checkbox>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Text>No Products.</Text>
                    )}
                  </FormControl>
                </Flex>

                <Flex direction={"column"} gap={"2"}>
                  <FormControl>
                    <FormLabel>Attributes</FormLabel>
                    {isLoaded && entityAttributes.length > 0 ? (
                      <Stack spacing={2} direction={"column"}>
                        {entityAttributes.map((attribute) => {
                          allExportFields.push(`attribute_${attribute._id}`);
                          return (
                            <Checkbox
                              key={attribute._id}
                              isChecked={
                                exportAll ||
                                _.includes(
                                  exportFields,
                                  `attribute_${attribute._id}`
                                )
                              }
                              onChange={(event) =>
                                handleExportCheck(
                                  `attribute_${attribute._id}`,
                                  event.target.checked
                                )
                              }
                            >
                              {attribute.name}
                            </Checkbox>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Text>No Attributes</Text>
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

        {/* Graph modal */}
        <Modal
          size={"full"}
          onEsc={onGraphClose}
          onClose={onGraphClose}
          isOpen={isGraphOpen}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Relations: {entityData.name}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Container h={"90vh"} minW={"90vw"}>
                <Graph
                  id={entityData._id}
                  entityNavigateHook={handleEntityNodeClick}
                />
              </Container>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Preview attachments */}
        <Modal isOpen={isPreviewOpen} onClose={onPreviewClose}>
          <ModalOverlay />
          <ModalContent minW={"3xl"}>
            <ModalHeader>Preview Attachment</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Flex
                w={"100%"}
                h={"100%"}
                justify={"center"}
                align={"center"}
                pb={"2"}
              >
                {!isPreviewLoaded ? (
                  <Spinner />
                ) : _.isEqual("application/pdf", previewType) ? (
                  <Preview src={previewSource} type={"document"} />
                ) : (
                  <Preview src={previewSource} type={"image"} />
                )}
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Version history */}
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
                {entityHistory && entityHistory.length > 0 ? (
                  entityHistory.map((entityVersion) => {
                    return (
                      <Card w={"100%"} key={`v_${entityVersion.timestamp}`}>
                        <CardHeader>
                          <Flex align={"center"}>
                            <Text fontStyle={"italic"}>
                              {dayjs(entityVersion.timestamp).fromNow()}
                            </Text>
                            <Spacer />
                            <Button
                              colorScheme={"orange"}
                              rightIcon={<Icon name={"rewind"} />}
                              onClick={() => {
                                handleRestoreFromHistoryClick(entityVersion);
                              }}
                              disabled={entityData.deleted}
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
                                {_.isEqual(entityVersion.description, "")
                                  ? "None"
                                  : entityVersion.description}
                              </Text>
                            </Flex>
                            <Flex direction={"row"} wrap={"wrap"} gap={"2"}>
                              <Text fontWeight={"bold"}>Projects:</Text>
                              {entityVersion.projects.length > 0 ? (
                                entityVersion.projects.map((project) => {
                                  return (
                                    <Tag
                                      key={`v_c_${entityVersion.timestamp}_${project}`}
                                    >
                                      <TagLabel>
                                        <Linky
                                          type={"projects"}
                                          id={project}
                                        />
                                      </TagLabel>
                                    </Tag>
                                  );
                                })
                              ) : (
                                <Text>None</Text>
                              )}
                            </Flex>
                            <Flex direction={"row"} wrap={"wrap"} gap={"2"}>
                              <Text fontWeight={"bold"}>Attributes:</Text>
                              {entityVersion.attributes.length > 0 ? (
                                entityVersion.attributes.map((attribute) => {
                                  return (
                                    <Tag
                                      key={`v_a_${entityVersion.timestamp}_${attribute._id}`}
                                    >
                                      <TagLabel>
                                        {attribute.name}
                                      </TagLabel>
                                    </Tag>
                                  );
                                })
                              ) : (
                                <Text>None</Text>
                              )}
                            </Flex>
                            <Flex direction={"row"} wrap={"wrap"} gap={"2"}>
                              <Text fontWeight={"bold"}>Origins:</Text>
                              <Tag
                                key={`v_o_${entityVersion.timestamp}`}
                              >
                                <TagLabel>
                                  {entityVersion.associations.origins.length}
                                </TagLabel>
                              </Tag>
                            </Flex>
                            <Flex direction={"row"} wrap={"wrap"} gap={"2"}>
                              <Text fontWeight={"bold"}>Products:</Text>
                              <Tag
                                key={`v_o_${entityVersion.timestamp}`}
                              >
                                <TagLabel>
                                  {entityVersion.associations.products.length}
                                </TagLabel>
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

export default Entity;
