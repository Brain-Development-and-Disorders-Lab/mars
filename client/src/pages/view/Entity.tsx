// React
import React, { useEffect, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Link,
  Heading,
  Input,
  Text,
  useToast,
  Modal,
  Textarea,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  Container,
  Tag,
  TagLabel,
  FormControl,
  FormLabel,
  Select,
  TagCloseButton,
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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import Graph from "@components/Graph";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Uploader from "@components/Uploader";
import Values from "@components/Values";
import Preview from "@components/Preview";
import AttributeViewButton from "@components/AttributeViewButton";
import { createColumnHelper } from "@tanstack/react-table";

// Existing and custom types
import {
  AttributeModel,
  DataTableAction,
  EntityHistory,
  EntityModel,
  IAttribute,
  IGenericItem,
  IValue,
  ProjectModel,
} from "@types";

// Utility functions and libraries
import { request, requestStatic } from "src/database/functions";
import { isValidValues } from "src/util";
import _, { debounce } from "lodash";
import dayjs from "dayjs";
import FileSaver from "file-saver";
import slugify from "slugify";
import { nanoid } from "nanoid";

// Apollo client imports
import { useQuery, gql, useMutation, useLazyQuery } from "@apollo/client";

// Routing and navigation
import { useParams, useNavigate } from "react-router-dom";
import Dialog from "@components/Dialog";
import { Warning } from "@components/Label";

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
  const [selectedProjects, setSelectedProjects] = useState([] as string[]);

  const [minimalEntities, setMinimalEntities] = useState([] as IGenericItem[]);

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
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState([] as IGenericItem[]);

  // Query to retrieve Entity data and associated data for editing
  const GET_ENTITY = gql`
    query GetEntityData($_id: String) {
      entity(_id: $_id) {
        _id
        name
        owner
        deleted
        locked
        description
        projects
        associations {
          origins {
            _id
            name
          }
          products {
            _id
            name
          }
        }
        attributes {
          _id
          name
          description
          values {
            _id
            name
            type
            data
          }
        }
        attachments {
          _id
          name
        }
        history {
          timestamp
          deleted
          owner
          description
          projects
          associations {
            origins {
              _id
              name
            }
            products {
              _id
              name
            }
          }
          attributes {
            _id
            name
            description
            values {
              _id
              name
              type
              data
            }
          }
        }
      }
      entities {
        _id
        name
      }
      projects {
        _id
        name
      }
      attributes {
        _id
        name
        description
        values {
          _id
          name
          type
          data
        }
      }
    }
  `;
  const { loading, error, data, refetch } = useQuery(GET_ENTITY, {
    variables: {
      _id: id,
    },
  });

  const GET_FILE_URL = gql`
    query GetFileURL($_id: String) {
      downloadFile(_id: $_id)
    }
  `;
  const [getFile, { loading: fileLoading, error: fileError }] =
    useLazyQuery(GET_FILE_URL);

  // Query to search Entities
  const SEARCH_ENTITIES = gql`
    query SearchEntities($search: String, $limit: Int) {
      searchEntities(search: $search, limit: $limit) {
        _id
        name
      }
    }
  `;
  const [searchEntities, { loading: searchLoading, error: searchError }] =
    useLazyQuery(SEARCH_ENTITIES);

  // Query to create a template Attribute
  const CREATE_ATTRIBUTE = gql`
    mutation CreateAttribute($attribute: AttributeCreateInput) {
      createAttribute(attribute: $attribute) {
        success
        message
      }
    }
  `;
  const [
    createAttribute,
    { loading: loadingAttributeCreate, error: errorAttributeCreate },
  ] = useMutation(CREATE_ATTRIBUTE);

  // Mutation to update Entity
  const UPDATE_ENTITY = gql`
    mutation UpdateEntity($entity: EntityUpdateInput) {
      updateEntity(entity: $entity) {
        success
        message
      }
    }
  `;
  const [updateEntity, { loading: updateLoading }] = useMutation(UPDATE_ENTITY);

  // Mutation to delete Entity
  const DELETE_ENTITY = gql`
    mutation DeleteEntity($_id: String) {
      deleteEntity(_id: $_id) {
        success
        message
      }
    }
  `;
  const [deleteEntity, { loading: deleteLoading }] = useMutation(DELETE_ENTITY);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.entity) {
      // Unpack all the Entity data
      setEntityData(data.entity);
      setEntityDescription(data.entity.description || "");
      setEntityProjects(data.entity.projects || []);
      setEntityOrigins(data.entity.associations.origins || []);
      setEntityProducts(data.entity.associations.products || []);
      setEntityAttributes(data.entity.attributes || []);
      setEntityAttachments(data.entity.attachments);
      setEntityHistory(data.entity.history || []);
    }
    if (data?.entities) {
      setMinimalEntities(
        data.entities.filter(
          (entity: EntityModel) => !_.isEqual(entityData._id, entity._id),
        ),
      );
    }
    if (data?.projects) {
      setProjectData(data.projects);
    }
  }, [loading]);

  // Display any GraphQL errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        position: "bottom-right",
        isClosable: true,
      });
    }
  }, [error]);

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, []);

  // Debounced fetch function
  const fetchEntities = debounce(async (query) => {
    const results = await searchEntities({
      variables: {
        search: query,
        limit: 100,
      },
    });
    if (results.data.searchEntities) {
      setSearchResults(results.data.searchEntities);
    }

    if (searchError) {
      toast({
        title: "Error",
        status: "error",
        description: searchError.message,
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  }, 150);

  /**
   * Utility function to retrieve a file from the server for download
   * @param id File identifier, generated by server
   * @param filename Name of downloaded file, slugified prior to download
   */
  const getDownload = async (_id: string, filename: string) => {
    // Get the static path to the resource for download
    const response = await getFile({
      variables: {
        _id: _id,
      },
    });

    // Perform the "GET" request to retrieve the data
    const fileResponse = await requestStatic<any>(response.data.downloadFile, {
      responseType: "blob",
    });

    // Attempt to download the received data
    if (fileResponse.data) {
      FileSaver.saveAs(new Blob([fileResponse.data]), slugify(filename));
    } else {
      toast({
        title: "Error",
        status: "error",
        description: `Error creating download for file "${filename}"`,
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  };

  const getAttachmentFile = async (_id: string, name: string) => {
    const response = await getFile({
      variables: {
        _id: _id,
      },
    });

    if (response.data?.downloadFile) {
      const fileResponse = await requestStatic<any>(
        response.data.downloadFile,
        {
          responseType: "blob",
        },
      );

      if (fileResponse.success) {
        setPreviewSource(URL.createObjectURL(fileResponse.data));
        if (_.endsWith(name, ".pdf")) {
          setPreviewType("application/pdf");
        }
      }

      if (fileError) {
        toast({
          title: "Error",
          status: "error",
          description: fileError.message,
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      }
      setIsPreviewLoaded(true);
    } else {
      toast({
        title: "Error",
        status: "error",
        description: "Could not retrieve attachment preview",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  };

  const handleInputChange = (event: any) => {
    const value = event.target.value;
    setInputValue(value);
    if (value.length > 2) {
      fetchEntities(value);
    } else {
      setSearchResults([]);
    }
  };

  const onSaveAsTemplate = async () => {
    const attributeData: IAttribute = {
      name: attributeName,
      description: attributeDescription,
      values: attributeValues,
    };

    // Execute the GraphQL mutation
    const response = await createAttribute({
      variables: {
        attribute: attributeData,
      },
    });

    if (response.data.createAttribute.success) {
      toast({
        title: "Saved!",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
      setAttributes(() => [...attributes, attributeData as AttributeModel]);
    }

    if (errorAttributeCreate) {
      toast({
        title: "Error",
        description: errorAttributeCreate.message,
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    setIsAttributeValueError(
      !isValidValues(attributeValues) || attributeValues.length === 0,
    );
  }, [attributeValues]);

  // Toggles
  const [isUpdating, setIsUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [exportAll, setExportAll] = useState(false);

  // Break up entity data into editable fields
  const [entityData, setEntityData] = useState({} as EntityModel);
  const [entityDescription, setEntityDescription] = useState("");
  const [entityProjects, setEntityProjects] = useState([] as string[]);
  const [entityOrigins, setEntityOrigins] = useState([] as IGenericItem[]);
  const [entityProducts, setEntityProducts] = useState([] as IGenericItem[]);
  const [entityAttributes, setEntityAttributes] = useState(
    [] as AttributeModel[],
  );
  const [entityHistory, setEntityHistory] = useState([] as EntityHistory[]);
  const [entityAttachments, setEntityAttachments] = useState(
    [] as IGenericItem[],
  );
  const [toUploadAttachments, setToUploadAttachments] = useState(
    [] as string[],
  );

  // State for dialog confirming if user should delete
  const deleteDialogRef = useRef();
  const {
    isOpen: isDeleteDialogOpen,
    onOpen: onDeleteDialogOpen,
    onClose: onDeleteDialogClose,
  } = useDisclosure();

  // Manage the tab index between "Entity Origins" and "Entity Products"
  const [relationsIndex, setRelationsIndex] = useState(0);

  const {
    isOpen: isExportOpen,
    onOpen: onExportOpen,
    onClose: onExportClose,
  } = useDisclosure();
  const [exportFields, setExportFields] = useState(["owner"] as string[]);
  const [exportFormat, setExportFormat] = useState("json");
  const validExportFormats = ["json", "csv", "txt"];

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

  // Toggle editing status
  const handleEditClick = async () => {
    if (editing) {
      setIsUpdating(updateLoading);
      try {
        await updateEntity({
          variables: {
            entity: {
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
            },
          },
        });
        toast({
          title: "Updated Successfully",
          status: "success",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: `Entity could not be updated`,
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      }

      // Unlock Entity
      await request<any>("POST", `/entities/lock/${id}`, {
        entity: {
          _id: entityData._id,
          name: entityData.name,
        },
        lockState: false,
      });
      setEditing(false);
      setIsUpdating(false);
    } else {
      // Lock Entity
      await request<any>("POST", `/entities/lock/${id}`, {
        entity: {
          _id: entityData._id,
          name: entityData.name,
        },
        lockState: true,
      });
      setEditing(true);
    }
  };

  /**
   * Restore an Entity from a deleted status
   */
  const handleRestoreFromDeleteClick = async () => {
    try {
      await updateEntity({
        variables: {
          entity: {
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
          },
        },
      });
      toast({
        title: "Restored Successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Entity could not be restored`,
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  };

  const truncateTableText =
    _.isEqual(breakpoint, "sm") ||
    _.isEqual(breakpoint, "base") ||
    _.isUndefined(breakpoint);

  // Configure Projects table columns and data
  const projectsTableColumns = [
    {
      id: (info: any) => info.row.original,
      cell: (info: any) => <Linky id={info.row.original} type={"projects"} />,
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
                size={"sm"}
              />
            ) : (
              <Button
                key={`view-${info.row.original}`}
                rightIcon={<Icon name={"c_right"} />}
                colorScheme={"gray"}
                onClick={() => navigate(`/projects/${info.row.original}`)}
                isDisabled={_.isUndefined(info.row.original)}
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
  const projectsTableActions: DataTableAction[] = [
    {
      label: "Remove Projects",
      icon: "delete",
      action(table, rows) {
        const projectsToRemove: string[] = [];
        for (let rowIndex of Object.keys(rows)) {
          projectsToRemove.push(table.getRow(rowIndex).original);
        }
        removeProjects(projectsToRemove);
      },
    },
  ];

  // Configure origins table columns and data
  const originTableColumnHelper = createColumnHelper<IGenericItem>();
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
    originTableColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex w={"100%"} justify={"end"} p={"0.5"}>
            {editing ? (
              <IconButton
                icon={<Icon name={"delete"} />}
                size={"sm"}
                aria-label={"Remove origin"}
                colorScheme={"red"}
                onClick={() => {
                  removeOrigin(info.row.original._id);
                }}
              />
            ) : (
              <Button
                key={`view-${info.row.original._id}`}
                size={"sm"}
                rightIcon={<Icon name={"c_right"} />}
                colorScheme={"gray"}
                onClick={() => navigate(`/entities/${info.row.original._id}`)}
                isDisabled={_.isUndefined(info.row.original._id)}
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
  const originTableActions: DataTableAction[] = [
    {
      label: "Remove Origins",
      icon: "delete",
      action(table, rows) {
        const originsToRemove: string[] = [];
        for (let rowIndex of Object.keys(rows)) {
          originsToRemove.push(table.getRow(rowIndex).original._id);
        }
        removeOrigins(originsToRemove);
      },
    },
  ];

  // Configure products table columns and data
  const productTableColumnHelper = createColumnHelper<IGenericItem>();
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
    productTableColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex w={"100%"} justify={"end"}>
            {editing ? (
              <IconButton
                icon={<Icon name={"delete"} />}
                size={"sm"}
                aria-label={"Remove product"}
                colorScheme={"red"}
                onClick={() => {
                  removeProduct(info.row.original._id);
                }}
              />
            ) : (
              <Button
                key={`view-${info.row.original._id}`}
                size={"sm"}
                rightIcon={<Icon name={"c_right"} />}
                colorScheme={"gray"}
                onClick={() => navigate(`/entities/${info.row.original._id}`)}
                isDisabled={_.isUndefined(info.row.original._id)}
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
  const productTableActions: DataTableAction[] = [
    {
      label: "Remove Products",
      icon: "delete",
      action(table, rows) {
        const productsToRemove: string[] = [];
        for (let rowIndex of Object.keys(rows)) {
          productsToRemove.push(table.getRow(rowIndex).original._id);
        }
        removeProducts(productsToRemove);
      },
    },
  ];

  // Configure attribute table columns and data
  const attributeTableColumnHelper = createColumnHelper<AttributeModel>();
  const attributeTableColumns = [
    attributeTableColumnHelper.accessor("name", {
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
    attributeTableColumnHelper.accessor("description", {
      cell: (info) => {
        return (
          <Tooltip label={info.getValue()}>
            <Text>{_.truncate(info.getValue(), { length: 12 })}</Text>
          </Tooltip>
        );
      },
      header: "Description",
    }),
    attributeTableColumnHelper.accessor("values", {
      cell: (info) => {
        const tooltipLabelValue: string = `${info.row.original.values
          .slice(0, 5)
          .map((value) => value.name)
          .join(", ")}${info.row.original.values.length > 5 ? "..." : ""}`;
        return (
          <Tooltip label={tooltipLabelValue}>
            <Tag colorScheme={"purple"}>{info.row.original.values.length}</Tag>
          </Tooltip>
        );
      },
      header: "Values",
    }),
    attributeTableColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex w={"100%"} justify={"end"} gap={"4"}>
            <AttributeViewButton
              attribute={info.row.original}
              editing={editing}
              doneCallback={handleUpdateAttribute}
              cancelCallback={handleCancelAttribute}
              removeCallback={() => {
                removeAttribute(info.row.original._id);
              }}
            />
          </Flex>
        );
      },
      header: "",
    }),
  ];
  const [visibleAttributeTableColumns, setVisibleAttributeTableColumns] =
    useState({});

  // Effect to adjust column visibility
  useEffect(() => {
    if (
      _.isEqual(breakpoint, "sm") ||
      _.isEqual(breakpoint, "base") ||
      _.isUndefined(breakpoint)
    ) {
      setVisibleAttributeTableColumns({ description: false });
    } else {
      setVisibleAttributeTableColumns({});
    }
  }, [breakpoint]);

  // Configure attachment table columns and data
  const attachmentTableColumnHelper = createColumnHelper<IGenericItem>();
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
    {
      id: (info: any) => `type_${info.row.original.name}`,
      cell: (info: any) => {
        let fileExtension = _.upperCase(
          _.last(info.row.original.name.split(".")),
        );
        const fileColorScheme = _.isEqual(fileExtension, "PDF")
          ? "red"
          : "yellow";
        return <Tag colorScheme={fileColorScheme}>{fileExtension}</Tag>;
      },
      header: "Type",
    },
    attachmentTableColumnHelper.accessor("_id", {
      cell: (info) => {
        const handleDownload = async () => {
          await getDownload(info.getValue(), info.row.original.name);
        };

        const handlePreview = async () => {
          setIsPreviewLoaded(false);
          onPreviewOpen();

          // Retrieve the attachment file from the serve
          await getAttachmentFile(info.getValue(), info.row.original.name);
        };

        return (
          <Flex w={"100%"} justify={"end"} gap={"4"}>
            <IconButton
              aria-label={"Preview attachment"}
              size={"sm"}
              key={`preview-file-${info.getValue()}`}
              colorScheme={"gray"}
              icon={<Icon name={"view"} />}
              onClick={() => handlePreview()}
            />
            {editing ? (
              <IconButton
                aria-label={"Delete attachment"}
                size={"sm"}
                key={`delete-file-${info.getValue()}`}
                colorScheme={"red"}
                icon={<Icon name={"delete"} />}
                onClick={() => removeAttachment(info.getValue())}
              />
            ) : (
              <IconButton
                aria-label={"Download attachment"}
                size={"sm"}
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
  const attachmentTableActions: DataTableAction[] = [
    {
      label: "Remove Attachments",
      icon: "delete",
      action(table, rows) {
        const attachmentsToRemove: string[] = [];
        for (let rowIndex of Object.keys(rows)) {
          attachmentsToRemove.push(table.getRow(rowIndex).original._id);
        }
        removeAttachments(attachmentsToRemove);
      },
    },
  ];

  /**
   * Restore an Entity from an earlier point in time
   * @param {EntityHistory} entityVersion historical Entity data to restore
   */
  const handleRestoreFromHistoryClick = async (
    entityVersion: EntityHistory,
  ) => {
    try {
      await updateEntity({
        variables: {
          entity: {
            _id: entityData._id,
            name: entityData.name,
            created: entityData.created,
            deleted: entityVersion.deleted,
            locked: entityData.locked,
            owner: entityVersion.owner,
            description: entityVersion.description || "",
            projects: entityVersion.projects || [],
            associations: {
              origins: entityVersion.associations.origins || [],
              products: entityVersion.associations.products || [],
            },
            attributes: entityVersion.attributes || [],
            attachments: entityVersion.attachments || [],
          },
        },
      });
      toast({
        title: "Restored Successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });

      // Update the state (safely)
      setEntityDescription(entityVersion.description || "");
      setEntityProjects(entityVersion.projects || []);
      setEntityOrigins(entityVersion.associations.origins || []);
      setEntityProducts(entityVersion.associations.products || []);
      setEntityAttributes(entityVersion.attributes || []);
      setEntityAttachments(entityVersion.attachments || []);

      // Close the sidebar
      onHistoryClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Entity could not be restored`,
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  };

  // Handle clicking the "Export" button
  const handleExportClick = () => {
    setEntityData(entityData);
    onExportOpen();
  };

  // Handle clicking the "Download" button
  const handleDownloadClick = async (format: string) => {
    if (_.includes(validExportFormats, format)) {
      // Send POST data to generate file
      const response = await request<any>("POST", `/entities/export/${id}`, {
        fields: exportAll ? allExportFields : exportFields,
        format: format,
      });
      if (response.success) {
        let responseData = response.data;
        // Clean the response data if required
        if (_.isEqual(format, "json")) {
          responseData = JSON.stringify(responseData, null, "  ");
        }

        FileSaver.saveAs(
          new Blob([responseData]),
          slugify(`${entityData.name.replace(" ", "")}_export.${format}`),
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
      } else {
        toast({
          title: "Error",
          description: "An error occurred when exporting this Entity",
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
  const handleDeleteClick = async () => {
    const response = await deleteEntity({
      variables: {
        _id: entityData._id,
      },
    });
    if (response.data.deleteEntity.success) {
      toast({
        title: "Deleted Successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
      navigate("/entities");
    } else {
      toast({
        title: "Error",
        description: "An error occurred when deleting Entity",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    }
    setEditing(false);
  };

  const handleEntityNodeClick = (id: string) => {
    onGraphClose();
    navigate(`/entities/${id}`);
  };

  // Add Products to the Entity state
  const addProducts = (products: string[]): void => {
    setEntityProducts([
      ...entityProducts,
      ...minimalEntities.filter((entity) => products.includes(entity._id)),
    ]);
    setSelectedProducts([]);
    onAddProductsClose();
  };

  // Remove Products from the Entity state
  const removeProduct = (_id: string) => {
    setEntityProducts(
      entityProducts.filter((product) => {
        return product._id !== _id;
      }),
    );
  };

  const removeProducts = (ids: string[]) => {
    setEntityProducts(
      entityProducts.filter((product) => {
        return !_.includes(ids, product._id);
      }),
    );
  };

  // Add Origins to the Entity state
  const addOrigins = (origins: string[]): void => {
    setEntityOrigins([
      ...entityOrigins,
      ...minimalEntities.filter((entity) => origins.includes(entity._id)),
    ]);
    setSelectedOrigins([]);
    onAddOriginsClose();
  };

  // Remove Origins from the Entity state
  const removeOrigin = (id: string) => {
    setEntityOrigins(
      entityOrigins.filter((origin) => {
        return origin._id !== id;
      }),
    );
  };

  const removeOrigins = (ids: string[]) => {
    setEntityOrigins(
      entityOrigins.filter((origin) => {
        return !_.includes(ids, origin._id);
      }),
    );
  };

  // Remove a Project from the Entity state
  const removeProject = (id: string) => {
    setEntityProjects(
      entityProjects.filter((project) => {
        return project !== id;
      }),
    );
  };

  const removeProjects = (ids: string[]) => {
    setEntityProjects(
      entityProjects.filter((project) => {
        return !_.includes(ids, project);
      }),
    );
  };

  // Remove Attachments from the Entity state
  const removeAttachment = (id: string) => {
    setEntityAttachments(
      entityAttachments.filter((attachment) => {
        return attachment._id !== id;
      }),
    );
  };

  const removeAttachments = (ids: string[]) => {
    setEntityAttachments(
      entityAttachments.filter((attachment) => {
        return !_.includes(ids, attachment._id);
      }),
    );
  };

  // Remove Attributes from the Entity state
  const removeAttribute = (id: string) => {
    setEntityAttributes(
      entityAttributes.filter((attribute) => {
        return attribute._id !== id;
      }),
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
          return _.cloneDeep(updated);
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
    <Content
      isError={!_.isUndefined(error)}
      isLoaded={!loading && !deleteLoading}
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
            <Icon name={"entity"} size={"md"} />
            <Heading fontWeight={"semibold"} size={"md"}>
              {entityData.name}
            </Heading>
            {entityData.deleted && <Icon name={"delete"} size={"md"} />}
          </Flex>

          {/* Buttons */}
          <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
            {editing && (
              <Button
                onClick={() => setEditing(false)}
                size={"sm"}
                colorScheme={"red"}
                rightIcon={<Icon name={"cross"} />}
              >
                Cancel
              </Button>
            )}
            {entityData.deleted ? (
              <Button
                onClick={handleRestoreFromDeleteClick}
                size={"sm"}
                colorScheme={"orange"}
                rightIcon={<Icon name={"rewind"} />}
              >
                Restore
              </Button>
            ) : (
              <Flex gap={"2"}>
                {entityData.locked ? (
                  <Tooltip label={"Currently being edited by another user"}>
                    <Button
                      colorScheme={"blue"}
                      size={"sm"}
                      rightIcon={<Icon name={"lock"} />}
                      isDisabled={entityData.locked}
                    >
                      Edit
                    </Button>
                  </Tooltip>
                ) : (
                  <Button
                    onClick={handleEditClick}
                    size={"sm"}
                    colorScheme={editing ? "green" : "blue"}
                    rightIcon={
                      editing ? <Icon name={"check"} /> : <Icon name={"edit"} />
                    }
                    isDisabled={entityData.locked}
                    loadingText={"Saving..."}
                    isLoading={isUpdating}
                  >
                    {editing ? "Done" : "Edit"}
                  </Button>
                )}
              </Flex>
            )}

            {/* Actions Menu */}
            <Menu>
              <MenuButton
                as={Button}
                size={"sm"}
                colorScheme={"blue"}
                rightIcon={<Icon name={"c_down"} />}
              >
                Actions
              </MenuButton>
              <MenuList>
                <MenuItem
                  icon={<Icon name={"graph"} />}
                  onClick={onGraphOpen}
                  isDisabled={editing || entityData.deleted}
                >
                  Visualize
                </MenuItem>
                <MenuItem
                  icon={<Icon name={"clock"} />}
                  onClick={onHistoryOpen}
                >
                  History
                </MenuItem>
                <MenuItem
                  onClick={handleExportClick}
                  icon={<Icon name={"download"} />}
                  isDisabled={editing || entityData.deleted}
                >
                  Export
                </MenuItem>
                <MenuItem
                  onClick={onDeleteDialogOpen}
                  icon={<Icon name={"delete"} />}
                >
                  Delete
                </MenuItem>
              </MenuList>
            </Menu>

            {/* Delete Dialog */}
            <Dialog
              dialogRef={deleteDialogRef}
              header={"Delete Entity"}
              rightButtonAction={handleDeleteClick}
              isOpen={isDeleteDialogOpen}
              onOpen={onDeleteDialogOpen}
              onClose={onDeleteDialogClose}
            >
              <Flex gap={"2"} direction={"column"}>
                <Text fontWeight={"semibold"}>
                  Are you sure you want to delete this Entity?
                </Text>
                <Text>
                  It will be removed from all Projects, all relationships to
                  Origins and Products will be removed, Attribute data removed,
                  and all Attachments deleted.
                </Text>
                <Warning text={"This is a destructive operation"} />
              </Flex>
            </Dialog>
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
            {/* Entity Overview */}
            <Flex
              direction={"column"}
              p={"2"}
              border={"1px"}
              borderColor={"gray.200"}
              rounded={"md"}
            >
              <Flex gap={"2"} direction={"column"}>
                <Flex gap={"2"} direction={"row"}>
                  {/* "Created" and "Owner" fields */}
                  <Flex gap={"2"} direction={"column"} basis={"40%"}>
                    <Text fontWeight={"bold"}>Created</Text>
                    <Flex align={"center"} gap={"2"}>
                      <Icon name={"v_date"} size={"sm"} />
                      <Text>
                        {dayjs(entityData.created).format("DD MMM YYYY")}
                      </Text>
                    </Flex>
                    <Text fontWeight={"bold"}>Owner</Text>
                    <Flex>
                      <Tag colorScheme={"green"}>
                        <TagLabel>{entityData.owner}</TagLabel>
                      </Tag>
                    </Flex>
                  </Flex>
                  {/* "Description" field */}
                  <Flex gap={"2"} direction={"column"} basis={"60%"}>
                    <Text fontWeight={"bold"}>Description</Text>
                    <Flex>
                      <Textarea
                        value={entityDescription}
                        onChange={(event) => {
                          setEntityDescription(event.target.value || "");
                        }}
                        isReadOnly={!editing}
                        border={"1px"}
                        borderColor={"gray.200"}
                        bg={"white"}
                      />
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>

            {/* Projects */}
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
                <Heading size={"sm"}>Projects</Heading>
                <Button
                  size={"sm"}
                  rightIcon={<Icon name={"add"} />}
                  isDisabled={!editing}
                  onClick={onAddProjectsOpen}
                >
                  Add
                </Button>
              </Flex>
              <Flex
                w={"100%"}
                justify={"center"}
                align={"center"}
                minH={entityProjects.length > 0 ? "fit-content" : "200px"}
              >
                {entityProjects.length === 0 ? (
                  <Text color={"gray.400"} fontWeight={"semibold"}>
                    No Projects
                  </Text>
                ) : (
                  <DataTable
                    data={entityProjects}
                    columns={projectsTableColumns}
                    visibleColumns={{}}
                    viewOnly={!editing}
                    actions={projectsTableActions}
                    showPagination
                    showSelection
                  />
                )}
              </Flex>
            </Flex>

            {/* Attachments */}
            <Flex
              direction={"column"}
              p={"2"}
              gap={"2"}
              rounded={"md"}
              border={"1px"}
              borderColor={"gray.200"}
            >
              <Flex gap={"2"} direction={"column"}>
                <Flex
                  direction={"row"}
                  justify={"space-between"}
                  align={"center"}
                >
                  <Heading size={"sm"}>Attachments</Heading>
                  <Button
                    size={"sm"}
                    rightIcon={<Icon name={"upload"} />}
                    onClick={onUploadOpen}
                  >
                    Upload
                  </Button>
                </Flex>

                <Flex
                  w={"100%"}
                  justify={"center"}
                  align={"center"}
                  minH={entityAttachments.length > 0 ? "fit-content" : "200px"}
                >
                  {entityAttachments.length === 0 ? (
                    <Text color={"gray.400"} fontWeight={"semibold"}>
                      No Attachments
                    </Text>
                  ) : (
                    <DataTable
                      data={entityAttachments}
                      columns={attachmentTableColumns}
                      visibleColumns={{}}
                      viewOnly={!editing}
                      actions={attachmentTableActions}
                      showPagination
                      showSelection
                    />
                  )}
                </Flex>
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
            {/* Origins and Products */}
            <Tabs
              variant={"enclosed"}
              colorScheme={"gray"}
              onChange={(index) => setRelationsIndex(index)}
            >
              <TabList>
                <Tab>
                  <Heading size={"sm"}>Origins</Heading>
                </Tab>
                <Tab>
                  <Heading size={"sm"}>Products</Heading>
                </Tab>
                <Spacer />
                <Button
                  size={"sm"}
                  rightIcon={<Icon name={"add"} />}
                  isDisabled={!editing}
                  onClick={() => {
                    _.isEqual(relationsIndex, 0)
                      ? onAddOriginsOpen()
                      : onAddProductsOpen();
                  }}
                >
                  Add
                </Button>
              </TabList>
              <TabPanels>
                <TabPanel
                  p={"2"}
                  borderLeft={"1px"}
                  borderRight={"1px"}
                  borderBottom={"1px"}
                  borderColor={"gray.200"}
                  roundedBottom={"md"}
                >
                  <Flex
                    w={"100%"}
                    justify={"center"}
                    align={entityOrigins.length > 0 ? "" : "center"}
                    minH={entityOrigins.length > 0 ? "fit-content" : "200px"}
                  >
                    {entityOrigins.length > 0 ? (
                      <DataTable
                        data={entityOrigins}
                        columns={originTableColumns}
                        visibleColumns={{}}
                        viewOnly={!editing}
                        actions={originTableActions}
                        showPagination
                        showSelection
                      />
                    ) : (
                      <Text color={"gray.400"} fontWeight={"semibold"}>
                        No Origins
                      </Text>
                    )}
                  </Flex>
                </TabPanel>
                <TabPanel
                  p={"2"}
                  borderLeft={"1px"}
                  borderRight={"1px"}
                  borderBottom={"1px"}
                  borderColor={"gray.200"}
                  roundedBottom={"md"}
                >
                  <Flex
                    w={"100%"}
                    justify={"center"}
                    align={entityProducts.length > 0 ? "" : "center"}
                    minH={entityProducts.length > 0 ? "fit-content" : "200px"}
                  >
                    {entityProducts.length > 0 ? (
                      <DataTable
                        data={entityProducts}
                        columns={productTableColumns}
                        visibleColumns={{}}
                        viewOnly={!editing}
                        actions={productTableActions}
                        showPagination
                        showSelection
                      />
                    ) : (
                      <Text color={"gray.400"} fontWeight={"semibold"}>
                        No Products
                      </Text>
                    )}
                  </Flex>
                </TabPanel>
              </TabPanels>
            </Tabs>

            {/* Attributes */}
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
                <Heading size={"sm"}>Attributes</Heading>
                <Button
                  size={"sm"}
                  rightIcon={<Icon name={"add"} />}
                  isDisabled={!editing}
                  onClick={onAddAttributesOpen}
                >
                  Add
                </Button>
              </Flex>

              <Flex
                w={"100%"}
                justify={"center"}
                align={"center"}
                minH={entityAttributes.length > 0 ? "fit-content" : "200px"}
              >
                {entityAttributes.length === 0 ? (
                  <Text color={"gray.400"} fontWeight={"semibold"}>
                    No Attributes
                  </Text>
                ) : (
                  <DataTable
                    data={entityAttributes}
                    columns={attributeTableColumns}
                    visibleColumns={visibleAttributeTableColumns}
                    viewOnly={!editing}
                    showPagination
                    showSelection
                  />
                )}
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        {/* Add Attributes modal */}
        <Modal
          isOpen={isAddAttributesOpen}
          onClose={onAddAttributesClose}
          size={"4xl"}
          isCentered
        >
          <ModalOverlay />
          <ModalContent p={"2"} gap={"4"}>
            <ModalHeader p={"2"}>Add Attribute</ModalHeader>
            <ModalCloseButton />

            <ModalBody p={"2"}>
              {/* Attribute creation */}
              <Flex justify={"center"}>
                <Flex
                  direction={"column"}
                  gap={"6"}
                  pb={"6"}
                  justify={"center"}
                >
                  <Flex direction={"column"}>
                    <Heading fontWeight={"semibold"} size={"md"}>
                      Details
                    </Heading>
                    <Text>
                      Specify some basic details about this Attribute. The
                      metadata associated with this Entity should be specified
                      using Values.
                    </Text>
                  </Flex>

                  <Stack>
                    <Select
                      placeholder={"Use template"}
                      onChange={(event) => {
                        if (!_.isEqual(event.target.value.toString(), "")) {
                          for (let attribute of attributes) {
                            if (
                              _.isEqual(
                                event.target.value.toString(),
                                attribute._id,
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
                      {!loading &&
                        attributes.map((attribute) => {
                          return (
                            <option key={attribute._id} value={attribute._id}>
                              {attribute.name}
                            </option>
                          );
                        })}
                      ;
                    </Select>
                    <Text fontSize="sm">
                      Don't see the attribute you're looking for? You can
                      <Link
                        onClick={() => navigate("/create/attribute")}
                        style={{
                          color: "#3182ce",
                          marginLeft: "5px",
                          marginRight: "5px",
                          textDecoration: "underline",
                        }}
                      >
                        create a new attribute template
                      </Link>
                      here.
                    </Text>
                  </Stack>

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
                          id="formName"
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
                          id="formDescription"
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

                  {/* "Cancel" button */}
                  <Flex direction={"row"} p={"md"} justify={"center"} gap={"8"}>
                    <Button
                      colorScheme={"red"}
                      size={"sm"}
                      variant={"outline"}
                      rightIcon={<Icon name={"cross"} />}
                      onClick={onAddAttributesClose}
                    >
                      Cancel
                    </Button>

                    <Button
                      colorScheme={"blue"}
                      size={"sm"}
                      variant={"outline"}
                      rightIcon={<Icon name={"add"} />}
                      onClick={onSaveAsTemplate}
                      isDisabled={isAttributeError}
                      isLoading={loadingAttributeCreate}
                    >
                      Save as Template
                    </Button>

                    <Button
                      colorScheme={"green"}
                      size={"sm"}
                      rightIcon={<Icon name={"check"} />}
                      isDisabled={isAttributeError}
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
                    {!loading &&
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
              {/* "Cancel" button */}
              <Flex direction={"row"} gap={"8"} justify={"center"}>
                <Button
                  colorScheme={"red"}
                  size={"sm"}
                  variant={"outline"}
                  rightIcon={<Icon name={"cross"} />}
                  onClick={onAddProjectsClose}
                >
                  Cancel
                </Button>

                <Button
                  colorScheme={"green"}
                  size={"sm"}
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
          <ModalContent maxW={"4xl"} p={"2"} gap={"4"} w={["lg", "xl", "2xl"]}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Add Products</ModalHeader>
            <ModalCloseButton />

            <ModalBody p={"2"}>
              <FormControl isInvalid={inputValue.length < 3} mb={"2"}>
                <Input
                  placeholder="Search for Products"
                  value={inputValue}
                  onChange={handleInputChange}
                />
                <FormErrorMessage>Enter 3 or more characters.</FormErrorMessage>
              </FormControl>

              <Flex direction={"column"} gap={"2"}>
                {inputValue.length >= 3 && (
                  <Text fontWeight={"semibold"}>Results:</Text>
                )}
                <Flex direction={"row"} wrap={"wrap"} gap={"2"}>
                  {searchResults.length > 0 &&
                    searchResults.map((entity: IGenericItem) => (
                      <Button
                        key={entity._id}
                        size={"sm"}
                        onClick={() => {
                          addProducts([entity._id]);
                          setInputValue("");
                          setSearchResults([]);
                        }}
                        variant={"solid"}
                      >
                        {entity.name}
                      </Button>
                    ))}
                  {searchLoading && (
                    <Flex width={"100%"} justify={"center"}>
                      <Spinner />
                    </Flex>
                  )}
                  {inputValue.length >= 3 &&
                    !searchLoading &&
                    searchResults.length === 0 && (
                      <Flex width={"100%"} justify={"center"}>
                        <Text fontWeight={"semibold"} color={"gray.400"}>
                          No Entities matching "{inputValue}"
                        </Text>
                      </Flex>
                    )}
                </Flex>
              </Flex>
            </ModalBody>

            <ModalFooter p={"2"}>
              {/* "Done" button */}
              <Flex direction={"row"} gap={"8"} justify={"center"}>
                <Button
                  colorScheme={"red"}
                  size={"sm"}
                  variant={"outline"}
                  rightIcon={<Icon name={"cross"} />}
                  onClick={onAddProductsClose}
                >
                  Cancel
                </Button>

                <Button
                  colorScheme={"green"}
                  size={"sm"}
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
          <ModalContent maxW={"4xl"} p={"2"} gap={"4"} w={["lg", "xl", "2xl"]}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Add Origins</ModalHeader>
            <ModalCloseButton />

            <ModalBody p={"2"}>
              <FormControl isInvalid={inputValue.length < 3} mb={"2"}>
                <Input
                  placeholder="Search for Origins"
                  value={inputValue}
                  onChange={handleInputChange}
                />
                <FormErrorMessage>Enter 3 or more characters.</FormErrorMessage>
              </FormControl>
              <Flex direction={"column"} gap={"2"}>
                {inputValue.length >= 3 && (
                  <Text fontWeight={"semibold"}>Results:</Text>
                )}
                <Flex direction={"row"} wrap={"wrap"} gap={"2"}>
                  {searchResults.length > 0 &&
                    searchResults.map((entity: IGenericItem) => (
                      <Button
                        key={entity._id}
                        size={"sm"}
                        onClick={() => {
                          addOrigins([entity._id]);
                          setInputValue("");
                          setSearchResults([]);
                        }}
                        variant={"solid"}
                      >
                        {entity.name}
                      </Button>
                    ))}
                  {searchLoading && (
                    <Flex width={"100%"} justify={"center"}>
                      <Spinner />
                    </Flex>
                  )}
                  {inputValue.length >= 3 &&
                    !searchLoading &&
                    searchResults.length === 0 && (
                      <Flex width={"100%"} justify={"center"}>
                        <Text fontWeight={"semibold"} color={"gray.400"}>
                          No Entities matching "{inputValue}"
                        </Text>
                      </Flex>
                    )}
                </Flex>
              </Flex>
            </ModalBody>

            <ModalFooter p={"2"}>
              {/* "Done" button */}
              <Flex direction={"row"} gap={"8"} justify={"center"}>
                <Button
                  colorScheme={"red"}
                  size={"sm"}
                  variant={"outline"}
                  rightIcon={<Icon name={"cross"} />}
                  onClick={onAddOriginsClose}
                >
                  Cancel
                </Button>

                <Button
                  colorScheme={"green"}
                  size={"sm"}
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
          <ModalContent p={"2"} w={["lg", "xl", "2xl"]}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Export Entity</ModalHeader>
            <ModalCloseButton />

            <ModalBody px={"2"}>
              <Flex w={"100%"} direction={"column"} py={"1"} gap={"2"}>
                <Text>
                  Select the Entity information to include in the exported file.
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
                gap={"2"}
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
                          <Checkbox isChecked={true} isDisabled>
                            Owner: {entityData.owner}
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
                            isDisabled={_.isEqual(entityDescription, "")}
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
                    {!loading && entityProjects.length > 0 ? (
                      <Stack spacing={2} direction={"column"}>
                        {entityProjects.map((project) => {
                          allExportFields.push(`project_${project}`);
                          return (
                            <Checkbox
                              key={project}
                              isChecked={
                                exportAll ||
                                _.includes(exportFields, `project_${project}`)
                              }
                              onChange={(event) =>
                                handleExportCheck(
                                  `project_${project}`,
                                  event.target.checked,
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
                    {!loading && entityOrigins?.length > 0 ? (
                      <Stack spacing={2} direction={"column"}>
                        {entityOrigins.map((origin) => {
                          allExportFields.push(`origin_${origin._id}`);
                          return (
                            <Checkbox
                              key={origin._id}
                              isChecked={
                                exportAll ||
                                _.includes(exportFields, `origin_${origin._id}`)
                              }
                              onChange={(event) =>
                                handleExportCheck(
                                  `origin_${origin._id}`,
                                  event.target.checked,
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
                    {!loading && entityProducts?.length > 0 ? (
                      <Stack spacing={2} direction={"column"}>
                        {entityProducts.map((product) => {
                          allExportFields.push(`product_${product._id}`);
                          return (
                            <Checkbox
                              key={product._id}
                              isChecked={
                                exportAll ||
                                _.includes(
                                  exportFields,
                                  `product_${product._id}`,
                                )
                              }
                              onChange={(event) =>
                                handleExportCheck(
                                  `product_${product._id}`,
                                  event.target.checked,
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
                    {!loading && entityAttributes.length > 0 ? (
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
                                  `attribute_${attribute._id}`,
                                )
                              }
                              onChange={(event) =>
                                handleExportCheck(
                                  `attribute_${attribute._id}`,
                                  event.target.checked,
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
                {_.isEqual(exportFormat, "txt") && (
                  <Text>TXT files can be viewed and shared easily.</Text>
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
                        <option key={"txt"} value={"txt"}>
                          TXT
                        </option>
                      </Select>
                    </FormControl>
                  </Flex>
                  <IconButton
                    colorScheme={"blue"}
                    size={"sm"}
                    aria-label={"Download"}
                    onClick={() => handleDownloadClick(exportFormat)}
                    icon={<Icon name={"download"} />}
                  />
                </Flex>
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
            <ModalHeader>Visualize: {entityData.name}</ModalHeader>
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
                {!isPreviewLoaded || fileLoading ? (
                  <Spinner />
                ) : _.isEqual(previewType, "application/pdf") ? (
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
                              size={"sm"}
                              rightIcon={<Icon name={"rewind"} />}
                              onClick={() => {
                                handleRestoreFromHistoryClick(entityVersion);
                              }}
                              isDisabled={entityData.deleted}
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
                                        <Linky type={"projects"} id={project} />
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
                                      <TagLabel>{attribute.name}</TagLabel>
                                    </Tag>
                                  );
                                })
                              ) : (
                                <Text>None</Text>
                              )}
                            </Flex>
                            <Flex direction={"row"} wrap={"wrap"} gap={"2"}>
                              <Text fontWeight={"bold"}>Origins:</Text>
                              <Tag key={`v_o_${entityVersion.timestamp}`}>
                                <TagLabel>
                                  {entityVersion?.associations?.origins?.length}
                                </TagLabel>
                              </Tag>
                            </Flex>
                            <Flex direction={"row"} wrap={"wrap"} gap={"2"}>
                              <Text fontWeight={"bold"}>Products:</Text>
                              <Tag key={`v_o_${entityVersion.timestamp}`}>
                                <TagLabel>
                                  {
                                    entityVersion?.associations?.products
                                      ?.length
                                  }
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
                size={"sm"}
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
