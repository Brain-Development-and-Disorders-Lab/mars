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
  DrawerBody,
  DrawerHeader,
  VStack,
  Card,
  CardHeader,
  CardBody,
  Spacer,
  Tooltip,
  IconButton,
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
  CardFooter,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import Graph from "@components/Graph";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Uploader from "@components/Uploader";
import Values from "@components/Values";
import PreviewModal from "@components/PreviewModal";
import AttributeViewButton from "@components/AttributeViewButton";
import SearchSelect from "@components/SearchSelect";
import Dialog from "@components/Dialog";
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
import { requestStatic } from "src/database/functions";
import { isValidValues } from "src/util";
import _ from "lodash";
import dayjs from "dayjs";
import FileSaver from "file-saver";
import slugify from "slugify";
import { nanoid } from "nanoid";

// Apollo client imports
import { useQuery, gql, useMutation, useLazyQuery } from "@apollo/client";

// Routing and navigation
import { useParams, useNavigate } from "react-router-dom";

// Contexts
import { useWorkspace } from "src/hooks/useWorkspace";
import { useAuthentication } from "src/hooks/useAuthentication";

const Entity = () => {
  const { id } = useParams();
  const breakpoint = useBreakpoint();
  const navigate = useNavigate();
  const toast = useToast();

  // Authentication
  const { token } = useAuthentication();

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
  const [selectedProducts, setSelectedProducts] = useState([] as string[]);
  const [selectedProduct, setSelectedProduct] = useState({} as IGenericItem);

  useEffect(() => {
    if (selectedProduct && !_.includes(selectedProducts, selectedProduct._id)) {
      // Append the selected Product
      setSelectedProducts([...selectedProducts, selectedProduct._id]);
    }
  }, [selectedProduct]);

  const {
    isOpen: isAddOriginsOpen,
    onOpen: onAddOriginsOpen,
    onClose: onAddOriginsClose,
  } = useDisclosure();
  const [selectedOrigins, setSelectedOrigins] = useState([] as string[]);
  const [selectedOrigin, setSelectedOrigin] = useState({} as IGenericItem);

  useEffect(() => {
    if (selectedOrigin && !_.includes(selectedOrigins, selectedOrigin._id)) {
      // Append the selected Origin
      setSelectedOrigins([...selectedOrigins, selectedOrigin._id]);
    }
  }, [selectedOrigin]);

  // History drawer
  const {
    isOpen: isHistoryOpen,
    onOpen: onHistoryOpen,
    onClose: onHistoryClose,
  } = useDisclosure();

  // Archive state
  const [entityArchived, setEntityArchived] = useState(false);

  // Adding Attributes to existing Entity
  const {
    isOpen: isAddAttributesOpen,
    onOpen: onAddAttributesOpen,
    onClose: onAddAttributesClose,
  } = useDisclosure();
  const [attributes, setAttributes] = useState([] as AttributeModel[]);
  const [attributeName, setAttributeName] = useState("");
  const [attributeDescription, setAttributeDescription] = useState("");
  const [attributeValues, setAttributeValues] = useState([] as IValue<any>[]);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const isAttributeNameError = attributeName === "";
  const isAttributeDescriptionError = attributeDescription === "";
  const [isAttributeValueError, setIsAttributeValueError] = useState(false);
  const isAttributeError =
    isAttributeNameError ||
    isAttributeDescriptionError ||
    isAttributeValueError;

  // Query to retrieve Entity data and associated data for editing
  const GET_ENTITY = gql`
    query GetEntityData($_id: String) {
      entity(_id: $_id) {
        _id
        name
        owner
        archived
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
          _id
          version
          name
          created
          timestamp
          archived
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
          attachments {
            _id
            name
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
    fetchPolicy: "network-only",
  });

  const GET_FILE_URL = gql`
    query GetFileURL($_id: String) {
      downloadFile(_id: $_id)
    }
  `;
  const [getFile] = useLazyQuery(GET_FILE_URL);

  // Query to export an Entity, returning the string contents of a file for download
  const EXPORT_ENTITY = gql`
    query ExportEntity($_id: String, $format: String, $fields: [String]) {
      exportEntity(_id: $_id, format: $format, fields: $fields)
    }
  `;
  const [exportEntity, { loading: exportLoading, error: exportError }] =
    useLazyQuery(EXPORT_ENTITY);

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

  // Mutation to archive Entity
  const ARCHIVE_ENTITY = gql`
    mutation ArchiveEntity($_id: String, $state: Boolean) {
      archiveEntity(_id: $_id, state: $state) {
        success
        message
      }
    }
  `;
  const [archiveEntity, { error: archiveError, loading: archiveLoading }] =
    useMutation(ARCHIVE_ENTITY);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.entity) {
      // Unpack all the Entity data
      setEntityData(data.entity);
      setEntityName(data.entity.name);
      setEntityArchived(data.entity.archived);
      setEntityDescription(data.entity.description || "");
      setEntityProjects(data.entity.projects || []);
      setEntityOrigins(data.entity.associations.origins || []);
      setEntityProducts(data.entity.associations.products || []);
      setEntityAttributes(data.entity.attributes || []);
      setEntityAttachments(data.entity.attachments);
      setEntityHistory(data.entity.history || []);
    }
    if (data?.entities) {
      // Unpack the minimal Entity data
      setMinimalEntities(
        data.entities.filter(
          (entity: EntityModel) => !_.isEqual(entityData._id, entity._id),
        ),
      );
    }
    // Unpack Project data
    if (data?.projects) {
      setProjectData(data.projects);
    }
    // Unpack Attribute data
    if (data?.attributes) {
      setAttributes(data.attributes);
    }
  }, [data]);

  // Display any GraphQL errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Unable to retrieve Entity information",
        status: "error",
        position: "bottom-right",
        isClosable: true,
      });
    }
  }, [error]);

  const { workspace } = useWorkspace();

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, [workspace]);

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

  const onSaveAsTemplate = async () => {
    const attributeData: IAttribute = {
      name: attributeName,
      archived: false,
      owner: token.orcid,
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

  // Break up entity data into editable fields
  const [entityData, setEntityData] = useState({} as EntityModel);
  const [entityName, setEntityName] = useState("");
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

  // State for dialog confirming if user should archive
  const archiveDialogRef = useRef();
  const {
    isOpen: isArchiveDialogOpen,
    onOpen: onArchiveDialogOpen,
    onClose: onArchiveDialogClose,
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

  const {
    isOpen: isUploadOpen,
    onOpen: onUploadOpen,
    onClose: onUploadClose,
  } = useDisclosure();

  const [previewAttachment, setPreviewAttachment] = useState(
    {} as IGenericItem,
  );
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
              name: entityName,
              archived: entityArchived,
              created: entityData.created,
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

      // Run a refetch operation
      await refetch();

      setEditing(false);
      setIsUpdating(false);
    } else {
      setEditing(true);
    }
  };

  /**
   * Handle cancelling an Edit operation
   */
  const handleCancelClick = () => {
    // Disable editing
    setEditing(false);

    // Reset all Entity states
    setEntityData(entityData);
    setEntityName(entityName);
    setEntityDescription(entityDescription);
    setEntityProjects(entityProjects);
    setEntityOrigins(entityOrigins);
    setEntityProducts(entityProducts);
    setEntityAttributes(entityAttributes);
    setEntityAttachments(entityAttachments);
    setEntityHistory(entityHistory);

    // Reload the page for maximum effect
    window.location.reload();
  };

  /**
   * Restore an Entity from an archived status
   */
  const handleRestoreFromArchiveClick = async () => {
    await archiveEntity({
      variables: {
        _id: entityData._id,
        state: false,
      },
    });

    if (archiveError) {
      toast({
        title: "Error while restoring Entity",
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    } else {
      toast({
        title: "Entity restored successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
      setEntityArchived(false);
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
      cell: (info: any) => (
        <Linky id={info.row.original} type={"projects"} size={"sm"} />
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
        for (const rowIndex of Object.keys(rows)) {
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
        for (const rowIndex of Object.keys(rows)) {
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
        for (const rowIndex of Object.keys(rows)) {
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
    attributeTableColumnHelper.accessor("description", {
      cell: (info) => {
        return (
          <Tooltip label={info.getValue()} hasArrow>
            <Text>{_.truncate(info.getValue(), { length: 12 })}</Text>
          </Tooltip>
        );
      },
      header: "Description",
    }),
    attributeTableColumnHelper.accessor("values", {
      cell: (info) => {
        const tooltipLabelValue = `${info.row.original.values
          .slice(0, 5)
          .map((value) => value.name)
          .join(", ")}${info.row.original.values.length > 5 ? "..." : ""}`;
        return (
          <Tooltip label={tooltipLabelValue} hasArrow>
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
    {
      id: (info: any) => `type_${info.row.original.name}`,
      cell: (info: any) => {
        const fileExtension = _.upperCase(
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
          // Update the attachment state
          setPreviewAttachment({
            _id: info.getValue(),
            name: info.row.original.name,
          });

          // Open the preview modal
          onPreviewOpen();
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
                aria-label={"Remove attachment"}
                size={"sm"}
                key={`remove-file-${info.getValue()}`}
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
        for (const rowIndex of Object.keys(rows)) {
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
            name: entityVersion.name,
            created: entityData.created,
            archived: entityVersion.archived,
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
    // Execute query to export the Entity
    const response = await exportEntity({
      variables: {
        _id: id,
        format: format,
        fields: exportFields,
      },
    });

    if (response.data) {
      let exportData = response.data.exportEntity;
      // Clean the response data if required
      if (_.isEqual(format, "json")) {
        exportData = JSON.stringify(JSON.parse(exportData), null, "  ");
      }

      FileSaver.saveAs(
        new Blob([exportData]),
        slugify(`${entityName.replace(" ", "")}_export.${format}`),
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
        description: "An error occurred when exporting this Entity",
        status: "error",
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

  // Archive the Entity when confirmed
  const handleArchiveClick = async () => {
    const response = await archiveEntity({
      variables: {
        _id: entityData._id,
        state: true,
      },
    });

    if (response.data.archiveEntity.success) {
      toast({
        title: "Archived Successfully",
        status: "success",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
      setEntityArchived(true);
      onArchiveDialogClose();
    } else {
      toast({
        title: "Error",
        description: "An error occurred while archiving Entity",
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
        owner: entityData.owner,
        timestamp: dayjs(Date.now()).toISOString(),
        archived: false,
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

  /**
   * Click handler for "Cancel" button when adding Entities to a Project
   */
  const onCancelAddProjectsClick = () => {
    setSelectedProjects([]);
    onAddProjectsClose();
  };

  return (
    <Content
      isError={!_.isUndefined(error)}
      isLoaded={!loading && !updateLoading && !archiveLoading}
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
            {entityArchived && <Icon name={"archive"} size={"md"} />}
          </Flex>

          {/* Buttons */}
          <Flex direction={"row"} gap={"2"} wrap={"wrap"} align={"center"}>
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
            {entityArchived ? (
              <Button
                id={"restoreEntityButton"}
                onClick={handleRestoreFromArchiveClick}
                size={"sm"}
                colorScheme={"orange"}
                rightIcon={<Icon name={"rewind"} />}
              >
                Restore
              </Button>
            ) : (
              <Flex gap={"2"}>
                <Button
                  id={"editEntityButton"}
                  onClick={handleEditClick}
                  size={"sm"}
                  colorScheme={editing ? "green" : "blue"}
                  rightIcon={
                    editing ? <Icon name={"check"} /> : <Icon name={"edit"} />
                  }
                  loadingText={"Saving..."}
                  isLoading={isUpdating}
                >
                  {editing ? "Done" : "Edit"}
                </Button>
              </Flex>
            )}

            {/* History button */}
            <Button
              size={"sm"}
              colorScheme={"green"}
              rightIcon={<Icon name={"clock"} />}
              onClick={onHistoryOpen}
            >
              History
            </Button>

            {/* Actions Menu */}
            <Menu>
              <MenuButton
                as={Button}
                size={"sm"}
                colorScheme={"yellow"}
                rightIcon={<Icon name={"lightning"} />}
              >
                Actions
              </MenuButton>
              <MenuList>
                <MenuItem icon={<Icon name={"print"} />} isDisabled>
                  Print
                </MenuItem>
                <MenuItem
                  icon={<Icon name={"graph"} />}
                  onClick={onGraphOpen}
                  isDisabled={editing || entityArchived}
                >
                  Visualize
                </MenuItem>
                <MenuItem
                  onClick={handleExportClick}
                  icon={<Icon name={"download"} />}
                  isDisabled={editing || entityArchived}
                >
                  Export
                </MenuItem>
                <MenuItem
                  onClick={onArchiveDialogOpen}
                  icon={<Icon name={"archive"} />}
                  isDisabled={entityArchived}
                >
                  Archive
                </MenuItem>
              </MenuList>
            </Menu>

            {/* Archive Dialog */}
            <Dialog
              dialogRef={archiveDialogRef}
              header={"Archive Entity"}
              rightButtonAction={handleArchiveClick}
              isOpen={isArchiveDialogOpen}
              onOpen={onArchiveDialogOpen}
              onClose={onArchiveDialogClose}
            >
              <Flex gap={"2"} direction={"column"}>
                <Text fontWeight={"semibold"}>
                  Are you sure you want to archive this Entity?
                </Text>
                <Text>
                  This Entity will be moved to the Workspace archive. All
                  relationships will be preserved, however it will not be
                  visible. It can be restored at any time.
                </Text>
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
              gap={"2"}
              border={"1px"}
              borderColor={"gray.300"}
              rounded={"md"}
            >
              {/* "Name" and "Created" field */}
              <Flex gap={"2"} direction={"row"}>
                <Flex direction={"column"} gap={"1"} basis={"60%"}>
                  <Text fontWeight={"bold"}>Name</Text>
                  <Flex>
                    <Input
                      size={"sm"}
                      value={entityName}
                      onChange={(event) => {
                        setEntityName(event.target.value || "");
                      }}
                      isReadOnly={!editing}
                      rounded={"md"}
                      border={"1px"}
                      borderColor={"gray.300"}
                      bg={"white"}
                    />
                  </Flex>
                </Flex>

                <Flex direction={"column"} gap={"1"}>
                  <Text fontWeight={"bold"}>Created</Text>
                  <Flex align={"center"} gap={"1"}>
                    <Icon name={"v_date"} size={"sm"} />
                    <Text fontSize={"sm"}>
                      {dayjs(entityData.created).format("DD MMM YYYY")}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>

              {/* "Created" and "Owner" fields */}
              <Flex gap={"2"} direction={"row"}>
                <Flex direction={"column"} gap={"1"} basis={"60%"}>
                  <Text fontWeight={"bold"}>Description</Text>
                  <Flex>
                    <Textarea
                      size={"sm"}
                      value={entityDescription}
                      onChange={(event) => {
                        setEntityDescription(event.target.value || "");
                      }}
                      isReadOnly={!editing}
                      rounded={"md"}
                      border={"1px"}
                      borderColor={"gray.300"}
                      bg={"white"}
                    />
                  </Flex>
                </Flex>
                <Flex direction={"column"} gap={"1"}>
                  <Text fontWeight={"bold"}>Owner</Text>
                  <Flex>
                    <ActorTag
                      orcid={entityData.owner}
                      fallback={"Unknown User"}
                    />
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
              borderColor={"gray.300"}
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
                    selectedRows={{}}
                    viewOnly={!editing}
                    actions={projectsTableActions}
                    showPagination
                    showItemCount
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
              borderColor={"gray.300"}
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
                      selectedRows={{}}
                      viewOnly={!editing}
                      actions={attachmentTableActions}
                      showPagination
                      showItemCount
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
                  borderColor={"gray.300"}
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
                        selectedRows={{}}
                        viewOnly={!editing}
                        actions={originTableActions}
                        showPagination
                        showItemCount
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
                  borderColor={"gray.300"}
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
                        selectedRows={{}}
                        viewOnly={!editing}
                        actions={productTableActions}
                        showPagination
                        showItemCount
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
              borderColor={"gray.300"}
            >
              <Flex
                direction={"row"}
                justify={"space-between"}
                align={"center"}
              >
                <Heading size={"sm"}>Attributes</Heading>
                <Button
                  id={"addAttributeModalButton"}
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
                    selectedRows={{}}
                    viewOnly={!editing}
                    showPagination
                    showItemCount
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
          <ModalContent p={"2"} gap={"2"}>
            <ModalHeader p={"2"}>Add Attribute</ModalHeader>
            <ModalCloseButton />

            <ModalBody p={"2"}>
              {/* Attribute creation */}
              <Flex direction={"column"} gap={"2"} pb={"2"} justify={"center"}>
                <Select
                  size={"sm"}
                  placeholder={"Select Template"}
                  value={selectedTemplate}
                  onChange={(event) => {
                    if (!_.isEqual(event.target.value.toString(), "")) {
                      setSelectedTemplate(event.target.value);
                      for (const attribute of attributes) {
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
                  Don't see the Template you're looking for? You can
                  <Link
                    onClick={() => navigate("/create/attribute")}
                    style={{
                      color: "#3182ce",
                      marginLeft: "5px",
                      marginRight: "5px",
                      textDecoration: "underline",
                    }}
                  >
                    create
                  </Link>
                  a new Template here.
                </Text>

                <Flex
                  direction={"column"}
                  gap={"2"}
                  w={"100%"}
                  justify={"center"}
                >
                  <Flex direction={"row"} gap={"2"} wrap={["wrap", "nowrap"]}>
                    <FormControl isRequired>
                      <FormLabel fontSize={"sm"}>Name</FormLabel>
                      <Input
                        size={"sm"}
                        placeholder={"Name"}
                        id="formName"
                        rounded={"md"}
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
                      <FormLabel fontSize={"sm"}>Description</FormLabel>
                      <Textarea
                        size={"sm"}
                        rounded={"md"}
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
                      <Values
                        viewOnly={false}
                        values={attributeValues}
                        setValues={setAttributeValues}
                      />
                    </FormControl>
                  </Flex>
                </Flex>
              </Flex>

              {/* Modal buttons */}
              <Flex direction={"row"} justify={"center"} gap={"2"}>
                {/* "Cancel" button */}
                <Button
                  colorScheme={"red"}
                  size={"sm"}
                  variant={"outline"}
                  rightIcon={<Icon name={"cross"} />}
                  onClick={onAddAttributesClose}
                >
                  Cancel
                </Button>

                <Spacer />

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
          <ModalContent p={"2"} gap={"2"} w={["lg", "xl", "2xl"]}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Add Entity to Projects</ModalHeader>
            <ModalCloseButton />

            <ModalBody p={"2"}>
              {/* Select component for Projects */}
              <Flex direction={"column"} gap={"2"}>
                <FormControl>
                  <Select
                    size={"sm"}
                    title={"Select Project"}
                    placeholder={"Select Project"}
                    onChange={(event) => {
                      const selectedProject = event.target.value.toString();
                      if (selectedProjects.includes(selectedProject)) {
                        // Check that the selected Project has not already been selected
                        toast({
                          title: "Warning",
                          description: "Project has already been selected.",
                          status: "warning",
                          duration: 2000,
                          position: "bottom-right",
                          isClosable: true,
                        });
                      } else if (!_.isEqual(selectedProject, "")) {
                        // Add the selected Project if not the default option
                        setSelectedProjects([
                          ...selectedProjects,
                          selectedProject,
                        ]);
                      }
                    }}
                  >
                    {!loading &&
                      projectData.map((project: IGenericItem) => {
                        if (
                          !_.includes(selectedProjects, project._id) &&
                          !_.includes(entityProjects, project._id)
                        ) {
                          // Only include Projects that haven't been selected or the Entity is currently present in
                          return (
                            <option key={project._id} value={project._id}>
                              {project.name}
                            </option>
                          );
                        } else {
                          return null;
                        }
                      })}
                  </Select>
                </FormControl>

                <Flex
                  direction={"row"}
                  gap={"2"}
                  p={"2"}
                  align={"center"}
                  justify={"center"}
                  rounded={"md"}
                  border={"1px"}
                  borderColor={"gray.300"}
                  minH={"100px"}
                >
                  {selectedProjects.length > 0 ? (
                    selectedProjects.map((project) => {
                      if (!_.isEqual(project, "")) {
                        return (
                          <Tag key={`tag-${project}`}>
                            <TagLabel>
                              <Linky
                                id={project}
                                type={"projects"}
                                size={"sm"}
                              />
                            </TagLabel>
                            <TagCloseButton
                              onClick={() => {
                                setSelectedProjects([
                                  ...selectedProjects.filter((selected) => {
                                    return !_.isEqual(project, selected);
                                  }),
                                ]);
                              }}
                            />
                          </Tag>
                        );
                      } else {
                        return null;
                      }
                    })
                  ) : (
                    <Text
                      fontSize={"sm"}
                      fontWeight={"semibold"}
                      color={"gray.400"}
                    >
                      No Projects selected
                    </Text>
                  )}
                </Flex>
              </Flex>
            </ModalBody>

            <ModalFooter p={"2"}>
              {/* "Cancel" button */}
              <Flex direction={"row"} justify={"center"} w={"100%"}>
                <Button
                  colorScheme={"red"}
                  size={"sm"}
                  variant={"outline"}
                  rightIcon={<Icon name={"cross"} />}
                  onClick={onCancelAddProjectsClick}
                >
                  Cancel
                </Button>

                <Spacer />

                <Button
                  colorScheme={"green"}
                  size={"sm"}
                  rightIcon={<Icon name={"check"} />}
                  onClick={() => {
                    addProjects(selectedProjects);
                  }}
                  isDisabled={selectedProjects.length === 0}
                >
                  Add Entity to {selectedProjects.length} Project
                  {selectedProjects.length === 1 ? "" : "s"}
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
          <ModalContent p={"2"} gap={"0"} w={["md", "lg", "xl"]}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Add Products</ModalHeader>
            <ModalCloseButton />

            <ModalBody p={"2"}>
              <SearchSelect
                resultType={"entity"}
                value={selectedProduct}
                onChange={setSelectedProduct}
              />
            </ModalBody>

            <ModalFooter p={"2"}>
              <Button
                colorScheme={"red"}
                size={"sm"}
                variant={"outline"}
                rightIcon={<Icon name={"cross"} />}
                onClick={onAddProductsClose}
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
                    // Add the Product to the Entity
                    addProducts(selectedProducts);
                  }
                }}
              >
                Done
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Add Origins modal */}
        <Modal isOpen={isAddOriginsOpen} onClose={onAddOriginsClose} isCentered>
          <ModalOverlay />
          <ModalContent p={"2"} gap={"0"} w={["md", "lg", "xl"]}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Add Origins</ModalHeader>
            <ModalCloseButton />

            <ModalBody p={"2"}>
              <SearchSelect
                resultType={"entity"}
                value={selectedOrigin}
                onChange={setSelectedOrigin}
              />
            </ModalBody>

            <ModalFooter p={"2"}>
              <Button
                colorScheme={"red"}
                size={"sm"}
                variant={"outline"}
                rightIcon={<Icon name={"cross"} />}
                onClick={onAddOriginsClose}
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
                    addOrigins(selectedOrigins);
                  }
                }}
              >
                Done
              </Button>
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
          <ModalContent p={"2"} w={["lg", "xl", "2xl"]} gap={"0"}>
            {/* Heading and close button */}
            <ModalHeader p={"2"}>Export Entity</ModalHeader>
            <ModalCloseButton />

            <ModalBody px={"2"}>
              <Flex w={"100%"} direction={"column"} py={"1"} gap={"2"}>
                <Text fontSize={"sm"}>
                  Select the Entity information to include in the exported file.
                </Text>
              </Flex>

              {/* Selection content */}
              <Flex
                direction={"row"}
                p={"2"}
                gap={"2"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.300"}
              >
                <Flex direction={"column"} gap={"2"}>
                  <FormControl>
                    <FormLabel>Details</FormLabel>
                    {!loading ? (
                      <CheckboxGroup size={"sm"}>
                        <Stack spacing={2} direction={"column"}>
                          <Checkbox disabled defaultChecked>
                            Name: {entityName}
                          </Checkbox>
                          <Checkbox
                            isChecked={_.includes(exportFields, "created")}
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
                            isChecked={_.includes(exportFields, "description")}
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
                    <FormLabel fontSize={"md"}>Projects</FormLabel>
                    {!loading && entityProjects.length > 0 ? (
                      <Stack spacing={2} direction={"column"}>
                        {entityProjects.map((project) => {
                          allExportFields.push(`project_${project}`);
                          return (
                            <Checkbox
                              size={"sm"}
                              key={project}
                              isChecked={_.includes(
                                exportFields,
                                `project_${project}`,
                              )}
                              onChange={(event) =>
                                handleExportCheck(
                                  `project_${project}`,
                                  event.target.checked,
                                )
                              }
                            >
                              Project:{" "}
                              {
                                <Linky
                                  id={project}
                                  type={"projects"}
                                  size={"sm"}
                                />
                              }
                            </Checkbox>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Text fontSize={"sm"}>No Projects</Text>
                    )}
                  </FormControl>
                </Flex>

                <Flex direction={"column"} gap={"2"}>
                  <FormControl>
                    <FormLabel fontSize={"md"}>Origins</FormLabel>
                    {!loading && entityOrigins?.length > 0 ? (
                      <Stack spacing={2} direction={"column"}>
                        {entityOrigins.map((origin) => {
                          allExportFields.push(`origin_${origin._id}`);
                          return (
                            <Checkbox
                              size={"sm"}
                              key={origin._id}
                              isChecked={_.includes(
                                exportFields,
                                `origin_${origin._id}`,
                              )}
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
                      <Text fontSize={"sm"}>No Origins</Text>
                    )}
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize={"md"}>Products</FormLabel>
                    {!loading && entityProducts?.length > 0 ? (
                      <Stack spacing={2} direction={"column"}>
                        {entityProducts.map((product) => {
                          allExportFields.push(`product_${product._id}`);
                          return (
                            <Checkbox
                              size={"sm"}
                              key={product._id}
                              isChecked={_.includes(
                                exportFields,
                                `product_${product._id}`,
                              )}
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
                      <Text fontSize={"sm"}>No Products</Text>
                    )}
                  </FormControl>
                </Flex>

                <Flex direction={"column"} gap={"2"}>
                  <FormControl>
                    <FormLabel fontSize={"md"}>Attributes</FormLabel>
                    {!loading && entityAttributes.length > 0 ? (
                      <Stack spacing={2} direction={"column"}>
                        {entityAttributes.map((attribute) => {
                          allExportFields.push(`attribute_${attribute._id}`);
                          return (
                            <Checkbox
                              size={"sm"}
                              key={attribute._id}
                              isChecked={_.includes(
                                exportFields,
                                `attribute_${attribute._id}`,
                              )}
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
                      <Text fontSize={"sm"}>No Attributes</Text>
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
              <Flex direction={"column"} w={"30%"} gap={"2"}>
                {/* "Download" button */}
                <Flex
                  direction={"row"}
                  w={"100%"}
                  gap={"2"}
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
                    icon={<Icon name={"download"} />}
                    colorScheme={"blue"}
                    size={"sm"}
                    aria-label={"Download"}
                    onClick={() => handleDownloadClick(exportFormat)}
                    isLoading={exportLoading}
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
          <ModalContent p={"2"}>
            <ModalHeader p={"2"} gap={"2"}>
              Visualize: {entityName}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody p={"2"}>
              <Graph
                id={entityData._id}
                entityNavigateHook={handleEntityNodeClick}
              />
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Attachment preview modal */}
        <Modal isOpen={isPreviewOpen} onClose={onPreviewClose}>
          <ModalOverlay />
          <ModalContent minW={"3xl"}>
            <ModalHeader>Attachment Preview</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Flex
                w={"100%"}
                h={"100%"}
                justify={"center"}
                align={"center"}
                pb={"2"}
              >
                <PreviewModal attachment={previewAttachment} />
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Version history */}
        <Drawer
          isOpen={isHistoryOpen}
          placement={"right"}
          size={"md"}
          onClose={onHistoryClose}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>
              <Flex direction={"row"} w={"100%"} gap={"2"}>
                <Heading size={"md"} fontWeight={"semibold"}>
                  Entity History
                </Heading>
                <Spacer />
                <Flex direction={"column"} gap={"1"}>
                  <Text fontSize={"sm"}>Versions: {entityHistory.length}</Text>
                  <Text fontSize={"sm"}>
                    Last modified:{" "}
                    {entityHistory.length > 0
                      ? dayjs(entityHistory[0].timestamp).fromNow()
                      : "never"}
                  </Text>
                </Flex>
              </Flex>
            </DrawerHeader>
            <DrawerBody>
              <VStack spacing={"4"}>
                {entityHistory.length > 0 ? (
                  entityHistory.map((entityVersion) => {
                    return (
                      <Card
                        w={"100%"}
                        key={`v_${entityVersion.timestamp}`}
                        variant={"simple"}
                        rounded={"md"}
                        border={"1px"}
                        borderColor={"gray.300"}
                      >
                        <CardHeader p={"0"}>
                          <Flex w={"100%"} align={"center"} gap={"2"} p={"2"}>
                            <Text
                              fontWeight={"semibold"}
                              fontSize={"md"}
                              color={"gray.700"}
                            >
                              {entityVersion.name}
                            </Text>
                            <Spacer />
                            <Flex
                              direction={"column"}
                              gap={"1"}
                              justify={"right"}
                            >
                              <Text
                                fontWeight={"semibold"}
                                fontSize={"sm"}
                                color={"gray.700"}
                              >
                                {entityVersion.version}
                              </Text>
                              <Text
                                fontWeight={"semibold"}
                                fontSize={"sm"}
                                color={"gray.400"}
                              >
                                {dayjs(entityVersion.timestamp).fromNow()}
                              </Text>
                            </Flex>
                          </Flex>
                        </CardHeader>
                        <CardBody px={"2"} py={"0"}>
                          <Flex
                            direction={"column"}
                            gap={"1"}
                            p={"2"}
                            rounded={"md"}
                            border={"1px"}
                            borderColor={"gray.300"}
                          >
                            <Flex
                              direction={"row"}
                              wrap={"wrap"}
                              gap={"2"}
                              align={"center"}
                            >
                              <Text fontSize={"sm"} fontWeight={"semibold"}>
                                Description:
                              </Text>
                              <Tooltip
                                label={entityVersion.description}
                                isDisabled={_.isEqual(
                                  entityVersion.description,
                                  "",
                                )}
                                hasArrow
                              >
                                <Text fontSize={"sm"}>
                                  {_.isEqual(entityVersion.description, "")
                                    ? "None"
                                    : _.truncate(entityVersion.description, {
                                        length: 56,
                                      })}
                                </Text>
                              </Tooltip>
                            </Flex>
                            <Flex
                              direction={"row"}
                              wrap={"wrap"}
                              gap={"2"}
                              align={"center"}
                            >
                              <Text fontSize={"sm"} fontWeight={"semibold"}>
                                Projects:
                              </Text>
                              {entityVersion.projects.length > 0 ? (
                                <Flex
                                  direction={"row"}
                                  gap={"2"}
                                  align={"center"}
                                >
                                  <Tag
                                    key={`v_c_${entityVersion.timestamp}_${entityVersion.projects[0]}`}
                                    size={"sm"}
                                  >
                                    <TagLabel>
                                      <Linky
                                        type={"projects"}
                                        id={entityVersion.projects[0]}
                                        size={"sm"}
                                      />
                                    </TagLabel>
                                  </Tag>
                                  {entityVersion.projects.length > 1 && (
                                    <Text
                                      fontWeight={"semibold"}
                                      fontSize={"sm"}
                                    >
                                      and {entityVersion.projects.length - 1}{" "}
                                      others
                                    </Text>
                                  )}
                                </Flex>
                              ) : (
                                <Text fontSize={"sm"}>No Projects</Text>
                              )}
                            </Flex>
                            <Flex direction={"row"} wrap={"wrap"} gap={"2"}>
                              <Text fontWeight={"semibold"} fontSize={"sm"}>
                                Origins:
                              </Text>
                              <Tag
                                key={`v_o_${entityVersion.timestamp}`}
                                size={"sm"}
                              >
                                <TagLabel>
                                  {entityVersion?.associations?.origins?.length}
                                </TagLabel>
                              </Tag>
                            </Flex>
                            <Flex direction={"row"} wrap={"wrap"} gap={"2"}>
                              <Text fontWeight={"semibold"} fontSize={"sm"}>
                                Products:
                              </Text>
                              <Tag
                                key={`v_o_${entityVersion.timestamp}`}
                                size={"sm"}
                              >
                                <TagLabel>
                                  {
                                    entityVersion?.associations?.products
                                      ?.length
                                  }
                                </TagLabel>
                              </Tag>
                            </Flex>
                            <Flex direction={"row"} wrap={"wrap"} gap={"2"}>
                              <Text fontSize={"sm"} fontWeight={"semibold"}>
                                Attributes:
                              </Text>
                              {entityVersion.attributes.length > 0 ? (
                                <Flex
                                  direction={"row"}
                                  gap={"2"}
                                  align={"center"}
                                >
                                  <Tooltip
                                    label={
                                      "Values: " +
                                      entityVersion.attributes[0].values.length
                                    }
                                    hasArrow
                                  >
                                    <Tag
                                      key={`v_a_${entityVersion.timestamp}_${entityVersion.attributes[0]._id}`}
                                      size={"sm"}
                                    >
                                      <TagLabel>
                                        {entityVersion.attributes[0].name}
                                      </TagLabel>
                                    </Tag>
                                  </Tooltip>
                                  {entityVersion.attributes.length > 1 && (
                                    <Text fontSize={"sm"}>
                                      and {entityVersion.attributes.length - 1}{" "}
                                      other
                                      {entityVersion.attributes.length > 2
                                        ? "s"
                                        : ""}
                                    </Text>
                                  )}
                                </Flex>
                              ) : (
                                <Text fontSize={"sm"}>None</Text>
                              )}
                            </Flex>
                            <Flex direction={"row"} wrap={"wrap"} gap={"2"}>
                              <Text fontSize={"sm"} fontWeight={"semibold"}>
                                Attachments:
                              </Text>
                              {entityVersion.attachments.length > 0 ? (
                                <Flex
                                  direction={"row"}
                                  gap={"2"}
                                  align={"center"}
                                >
                                  <Tooltip
                                    label={entityVersion.attachments[0].name}
                                    hasArrow
                                  >
                                    <Tag
                                      key={`v_at_${entityVersion.timestamp}_${entityVersion.attachments[0]._id}`}
                                      size={"sm"}
                                    >
                                      <TagLabel>
                                        {_.truncate(
                                          entityVersion.attachments[0].name,
                                          { length: 24 },
                                        )}
                                      </TagLabel>
                                    </Tag>
                                  </Tooltip>
                                  {entityVersion.attachments.length > 1 && (
                                    <Text fontSize={"sm"}>
                                      and {entityVersion.attachments.length - 1}{" "}
                                      other
                                      {entityVersion.attachments.length > 2
                                        ? "s"
                                        : ""}
                                    </Text>
                                  )}
                                </Flex>
                              ) : (
                                <Text fontSize={"sm"}>None</Text>
                              )}
                            </Flex>
                          </Flex>
                        </CardBody>
                        <CardFooter p={"0"}>
                          <Flex
                            w={"100%"}
                            justify={"right"}
                            align={"center"}
                            p={"2"}
                          >
                            <Button
                              colorScheme={"orange"}
                              size={"sm"}
                              rightIcon={<Icon name={"rewind"} />}
                              onClick={() => {
                                handleRestoreFromHistoryClick(entityVersion);
                              }}
                              isDisabled={entityArchived}
                            >
                              Restore
                            </Button>
                          </Flex>
                        </CardFooter>
                      </Card>
                    );
                  })
                ) : (
                  <Text>No previous versions.</Text>
                )}
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Flex>
    </Content>
  );
};

export default Entity;
