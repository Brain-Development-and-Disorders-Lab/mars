// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  Input,
  Text,
  Tag,
  IconButton,
  Field,
  Portal,
  EmptyState,
  Textarea,
  Breadcrumb,
  SkeletonText,
  Select,
  createListCollection,
  Checkbox,
  ListCollection,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import { EmptyTag, ValueTag } from "@components/FieldTag";
import FieldTagList from "@components/FieldTagList";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import PreviewDialog from "@components/PreviewDialog";
import ViewAttributeDialog from "@components/ViewAttributeDialog";
import TimestampTag from "@components/TimestampTag";
import VisibilityTag from "@components/VisibilityTag";
import Relationships from "@components/Relationships";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";
import { Cell, createColumnHelper } from "@tanstack/react-table";

// Existing and custom types
import {
  AttributeModel,
  DataTableAction,
  EntityModel,
  IdentifierFormatModel,
  IGenericItem,
  IRelationship,
} from "@types";

// Utility functions and libraries
import { requestStatic } from "@database/functions";
import {
  getBaseIdentifierFormatHelperText,
  getCustomIdentifierFormatHelperText,
  getPublicWorkspaceUrl,
  isValidBaseIdentifierFormat,
  isValidCustomIdentifierFormat,
} from "@lib/util";
import _, { groupBy } from "lodash";
import FileSaver from "file-saver";
import slugify from "slugify";

// Apollo client imports
import { gql } from "@apollo/client";
import { useQuery, useLazyQuery } from "@apollo/client/react";

// Routing and navigation
import { useParams, useNavigate } from "react-router-dom";

// Contexts and hooks
import { useBreakpoint } from "@hooks/useBreakpoint";

// Variables
import { BASE_IDENTIFIER_FORMATS, STYLES } from "@variables";

// Events
import { usePostHog } from "posthog-js/react";

export const Entity = () => {
  const { id: workspace, entity } = useParams();
  const { breakpoint } = useBreakpoint();
  const posthog = usePostHog();

  // Navigation and routing
  const navigate = useNavigate();

  // Breakpoint
  const { isBreakpointActive } = useBreakpoint();

  // Workspace information
  const [workspaceName, setWorkspaceName] = useState("");

  // Archive state
  const [entityArchived, setEntityArchived] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<AttributeModel[]>([]);

  // Secondary identifier
  const [showSecondaryIdentifier, setShowSecondaryIdentifier] = useState(false);
  const [identifierFormats, setIdentifierFormats] = useState<ListCollection>(
    createListCollection({
      items: BASE_IDENTIFIER_FORMATS,
    }),
  );
  const [customIdentifierFormats, setCustomIdentifierFormats] = useState<IdentifierFormatModel[]>([]);
  const [identifierFormat, setIdentifierFormat] = useState<string[]>([]);
  const [secondaryIdentifier, setSecondaryIdentifier] = useState("");

  const isValidSecondaryIdentifierField = (): boolean => {
    if (identifierFormat.length > 0) {
      if (
        _.includes(
          BASE_IDENTIFIER_FORMATS.map((format) => format.value),
          identifierFormat[0],
        )
      ) {
        return isValidBaseIdentifierFormat(secondaryIdentifier, identifierFormat[0]);
      } else {
        const formatParameters = customIdentifierFormats.filter((format) => format._id === identifierFormat[0]);
        return isValidCustomIdentifierFormat(secondaryIdentifier, formatParameters[0]);
      }
    }
    return false;
  };

  const getIdentifierFormatHelperText = (format: string): string => {
    if (
      _.includes(
        BASE_IDENTIFIER_FORMATS.map((baseFormat) => baseFormat.value),
        format,
      )
    ) {
      return getBaseIdentifierFormatHelperText(format);
    } else {
      const formatParameters = customIdentifierFormats.filter((customFormat) => customFormat._id === format);
      return getCustomIdentifierFormatHelperText(formatParameters[0]);
    }
  };

  // Query to retrieve Entity data and associated data for editing
  const GET_ENTITY = gql`
    query GetEntityData($_id: String, $workspace: String) {
      entity(_id: $_id) {
        _id
        name
        owner
        created
        archived
        description
        projects
        secondaryIdentifier {
          value
          format
        }
        relationships {
          source {
            _id
            name
          }
          target {
            _id
            name
          }
          type
        }
        attributes {
          _id
          name
          description
          owner
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
          author
          message
          timestamp
          version
          _id
          name
          created
          archived
          owner
          description
          projects
          secondaryIdentifier {
            value
            format
          }
          relationships {
            source {
              _id
              name
            }
            target {
              _id
              name
            }
            type
          }
          attributes {
            _id
            name
            owner
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
      projects {
        _id
        name
      }
      templates {
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
      workspace(_id: $workspace) {
        _id
        name
      }
      identifierFormats {
        _id
        name
        fixedLength
        alphanumericOnly
        lettersOnly
        numbersOnly
        allowSpecialCharacters
        uppercaseRequired
      }
    }
  `;
  const { loading, error, data } = useQuery<{
    entity: EntityModel;
    projects: IGenericItem[];
    templates: AttributeModel[];
    workspace: IGenericItem;
    identifierFormats: IdentifierFormatModel[];
  }>(GET_ENTITY, {
    variables: {
      _id: entity,
      workspace: workspace,
    },
    fetchPolicy: "no-cache",
    context: {
      uri: getPublicWorkspaceUrl(workspace ?? ""),
    },
  });

  const GET_FILE_URL = gql`
    query GetFileURL($_id: String) {
      downloadFile(_id: $_id)
    }
  `;
  const [getFile] = useLazyQuery<{ downloadFile: string }>(GET_FILE_URL);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.entity) {
      // Unpack all the Entity data
      setEntityName(data.entity.name);
      setEntityArchived(data.entity.archived);
      setEntityOwner(data.entity.owner);
      setEntityCreated(data.entity.created);
      setEntityDescription(data.entity.description || "");
      setEntityProjects(data.entity.projects || []);
      setEntityRelationships(data.entity.relationships || []);
      setEntityAttributes(data.entity.attributes || []);
      setShowSecondaryIdentifier(!!data.entity.secondaryIdentifier?.value);
      setSecondaryIdentifier(data.entity.secondaryIdentifier?.value || "");
      setIdentifierFormat(data.entity.secondaryIdentifier?.format ? [data.entity.secondaryIdentifier.format] : []);
      setEntityAttachments(data.entity.attachments);
    }

    // Unpack Template data
    if (data?.templates) {
      setTemplates(data.templates);
    }

    // Store Workspace information
    if (data?.workspace) {
      setWorkspaceName(data.workspace.name);
    }

    // Store Identifier Format information
    if (data?.identifierFormats) {
      setCustomIdentifierFormats(data.identifierFormats);
      const customFormats = data.identifierFormats.map((format) => {
        return {
          label: format.name,
          value: format._id,
          category: "Custom",
        };
      });
      const updatedIdentifierFormats = createListCollection({
        items: [...BASE_IDENTIFIER_FORMATS, ...customFormats],
      });
      setIdentifierFormats(updatedIdentifierFormats);
    }
  }, [data]);

  useEffect(() => {
    posthog.capture("client.entity.viewed");
  }, [entity]);

  // Display any GraphQL errors
  useEffect(() => {
    if (error) {
      toaster.create({
        title: "Error",
        description: "Unable to retrieve Entity information",
        type: "error",
        closable: true,
      });
    }
  }, [error]);

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
      context: {
        uri: getPublicWorkspaceUrl(workspace ?? ""),
      },
    });

    if (!response.data?.downloadFile) {
      toaster.create({
        title: "Error",
        description: "Unable to retrieve file for download",
        type: "error",
        duration: 4000,
        closable: true,
      });
    } else if (response.data.downloadFile) {
      // Perform the "GET" request to retrieve the data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fileResponse = await requestStatic<any>(response.data.downloadFile, {
        responseType: "blob",
      });

      // Attempt to download the received data
      if (fileResponse.data) {
        FileSaver.saveAs(new Blob([fileResponse.data]), slugify(filename));
      } else {
        toaster.create({
          title: "Error",
          type: "error",
          description: `Error creating download for file "${filename}"`,
          duration: 4000,
          closable: true,
        });
      }
    }
  };

  // Break up entity data into editable fields
  const [entityName, setEntityName] = useState("");
  const [entityDescription, setEntityDescription] = useState("");
  const [entityOwner, setEntityOwner] = useState("");
  const [entityCreated, setEntityCreated] = useState("");
  const [entityProjects, setEntityProjects] = useState<string[]>([]);
  const [entityRelationships, setEntityRelationships] = useState<IRelationship[]>([]);
  const [entityAttributes, setEntityAttributes] = useState<AttributeModel[]>([]);
  const [entityAttachments, setEntityAttachments] = useState<IGenericItem[]>([]);

  // Configure Projects table columns and data
  const projectsTableColumns = [
    {
      id: "projectId",
      accessorFn: (row: string) => row,
      cell: (info: Cell<string, string>) => {
        const projectId = info.getValue();
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Tooltip content={projectId} disabled={projectId.length < 32} showArrow>
              <Linky id={projectId} type={"projects"} size={"xs"} truncate={false} workspace={workspace} isPublic />
            </Tooltip>
            <Button
              size="2xs"
              mx={"1"}
              variant="subtle"
              colorPalette="gray"
              aria-label={"View Project"}
              onClick={() => navigate(`/public/${workspace}/projects/${projectId}`)}
            >
              View
              <Icon name={"a_right"} size={"xs"} />
            </Button>
          </Flex>
        );
      },
      header: "Name",
    },
  ];
  const projectsTableActions: DataTableAction[] = [];

  // Utility function to check if Attribute is an instance of a known Template
  const isKnownTemplate = (_id: string, templates: AttributeModel[]): boolean => {
    for (const attribute of templates) {
      if (_.startsWith(_id, attribute._id) || _.isEqual(_id, attribute._id)) {
        // Template / Attribute ID matches
        return true;
      }
    }
    // No matches
    return false;
  };

  // Configure attribute table columns and data
  const attributeTableColumnHelper = createColumnHelper<AttributeModel>();
  const attributeTableColumns = [
    attributeTableColumnHelper.accessor("name", {
      cell: (info) => {
        const attribute = info.row.original;
        const [viewAttributeDialogOpen, setViewAttributeDialogOpen] = useState(false);
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 16} showArrow>
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), { length: 16 })}
              </Text>
            </Tooltip>
            <Flex direction={"row"} gap={"1"} align={"center"}>
              <Button
                size="2xs"
                variant="subtle"
                rounded="md"
                colorPalette="gray"
                aria-label={"View Attribute"}
                onClick={() => setViewAttributeDialogOpen(true)}
              >
                {"Expand"}
                <Icon name={"expand"} size={"xs"} />
              </Button>
              <ViewAttributeDialog
                open={viewAttributeDialogOpen}
                setOpen={setViewAttributeDialogOpen}
                editing={false}
                entityName={entityName}
                attribute={attribute}
                isTemplate={isKnownTemplate(attribute._id, templates)}
                onAttributeUpdate={() => {}}
                workspace={workspace}
                isPublic
              />
            </Flex>
          </Flex>
        );
      },
      header: "Name",
      meta: {
        minWidth: 240,
      },
    }),
    attributeTableColumnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return <EmptyTag label={"Description"} />;
        }
        return (
          <Flex>
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 32} showArrow>
              <Text fontSize={"xs"}>{_.truncate(info.getValue(), { length: 32 })}</Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Description",
    }),
    attributeTableColumnHelper.accessor("values", {
      cell: (info) => (
        <FieldTagList
          items={info.row.original.values}
          max={2}
          emptyLabel={"Values"}
          getKey={(value) => value._id}
          renderTag={(value) => <ValueTag value={value} />}
        />
      ),
      header: "Values",
      meta: {
        minWidth: 300,
      },
    }),
  ];
  const [visibleAttributeTableColumns, setVisibleAttributeTableColumns] = useState({});

  // Effect to adjust column visibility
  useEffect(() => {
    if (_.isEqual(breakpoint, "sm") || _.isEqual(breakpoint, "base") || _.isUndefined(breakpoint)) {
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
        const attachmentId = info.row.original._id;
        const attachmentName = info.row.original.name;

        const handleDownload = async () => {
          await getDownload(attachmentId, attachmentName);
        };

        return (
          <Flex w={"100%"} justify={"space-between"} gap={"1"} align={"center"}>
            <Tooltip content={attachmentName} showArrow>
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(attachmentName, { length: 36 })}
              </Text>
            </Tooltip>
            <Flex gap={"1"} align={"center"}>
              <PreviewDialog
                attachment={{
                  _id: attachmentId,
                  name: attachmentName,
                }}
                workspace={workspace}
                isPublic
              />
              <IconButton
                aria-label={"Download attachment"}
                size={"2xs"}
                variant={"subtle"}
                key={`download-file-${attachmentId}`}
                colorPalette={"blue"}
                onClick={() => handleDownload()}
              >
                <Icon name={"download"} size={"xs"} />
              </IconButton>
            </Flex>
          </Flex>
        );
      },
      header: "Name",
      meta: {
        minWidth: 360,
      },
    }),
    {
      id: "type",
      accessorFn: (row: IGenericItem) => row.name,
      cell: (info: Cell<IGenericItem, string>) => {
        const fileExtension = _.upperCase(_.last(info.row.original.name.split(".")));
        let fileColorScheme = "yellow";
        if (_.isEqual(fileExtension, "PDF")) {
          fileColorScheme = "red";
        } else if (_.isEqual(fileExtension, "DNA")) {
          fileColorScheme = "green";
        } else if (_.isEqual(fileExtension, "PNG") || _.isEqual(fileExtension, "JPEG")) {
          fileColorScheme = "blue";
        }

        return (
          <Tag.Root colorPalette={fileColorScheme}>
            <Tag.Label>{fileExtension}</Tag.Label>
          </Tag.Root>
        );
      },
      header: "File Format",
    },
  ];
  const attachmentTableActions: DataTableAction[] = [];

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
                  onClick={() => navigate(`/public/${workspace}/entities`)}
                  _hover={{
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  <Icon size={"xs"} name={"entity"} color={STYLES.entity.color.icon} />
                  Entities
                </Breadcrumb.Item>
                <Breadcrumb.Separator />
              </Breadcrumb.List>
            </Breadcrumb.Root>

            <Flex direction={"row"} gap={"2"} align={"center"} p={"0"} m={"0"}>
              <Flex
                id={"entityNameTag"}
                align={"center"}
                gap={"1"}
                p={"1"}
                border={"2px solid"}
                borderColor={entityArchived ? "gray.500" : STYLES.entity.color.icon}
                bg={entityArchived ? STYLES.card.bg : STYLES.entity.color.light}
                rounded={"md"}
              >
                <Icon name={"entity"} size={"sm"} color={entityArchived ? "gray.500" : STYLES.entity.color.icon} />
                <Tooltip content={`${entityArchived ? "Archived: " : ""}${entityName}`} showArrow>
                  <Heading fontWeight={"semibold"} size={"sm"}>
                    {_.truncate(entityName, { length: 30 })}
                  </Heading>
                </Tooltip>
                {entityArchived && <Icon name={"archive"} size={"sm"} color={"text.subtle"} />}
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        <Flex direction={"column"} gap={"2"} pt={"0"} p={"1"}>
          {/* Entity Overview and Description */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
            {/* Entity Overview */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              bg={"surface.card"}
              rounded={"md"}
              grow={"1"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              {/* "Name" field */}
              <Flex gap={"2"} direction={"row"} wrap={"wrap"}>
                <Flex direction={"column"} gap={"2"} grow={"1"}>
                  <Flex direction={"row"} align={"center"} justify={"space-between"}>
                    <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                      Name
                    </Text>
                    <Tooltip
                      content={
                        "If your Entity has an external identifier (such as a GUID or other identifier) associated with it, you can specify it here."
                      }
                      showArrow
                    >
                      <Checkbox.Root
                        size={"xs"}
                        colorPalette={"blue"}
                        checked={showSecondaryIdentifier}
                        onCheckedChange={(event) => setShowSecondaryIdentifier(!!event.checked)}
                        disabled={true}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                        <Checkbox.Label>
                          <Flex direction={"row"} gap={"1"} align={"center"}>
                            <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                              Specify Secondary Identifier
                            </Text>
                            <Icon name={"info"} size={"xs"} color={STYLES.font.secondaryHeader.color} />
                          </Flex>
                        </Checkbox.Label>
                      </Checkbox.Root>
                    </Tooltip>
                  </Flex>
                  <Input
                    id={"entityNameInput"}
                    size={"xs"}
                    value={entityName}
                    onChange={(event) => {
                      setEntityName(event.target.value || "");
                    }}
                    rounded={"md"}
                    border={STYLES.border.style}
                    borderColor={STYLES.border.color}
                    bg={"white"}
                    readOnly
                  />
                </Flex>
              </Flex>

              {/* Secondary Identifier */}
              {showSecondaryIdentifier && (
                <Flex gap={"2"} direction={"row"} wrap={"wrap"}>
                  <Flex direction={"column"} gap={"2"} grow={"3"}>
                    <Field.Root invalid={showSecondaryIdentifier && !isValidSecondaryIdentifierField()}>
                      <Text
                        fontSize={"xs"}
                        fontWeight={"semibold"}
                        color={STYLES.font.secondaryHeader.color}
                        ml={"0.5"}
                      >
                        Secondary Identifier
                      </Text>
                      <Input
                        id={"entitySecondaryIdentifierInput"}
                        size={"xs"}
                        value={secondaryIdentifier}
                        onChange={(event) => setSecondaryIdentifier(event.target.value)}
                        readOnly={true}
                        rounded={"md"}
                        border={STYLES.border.style}
                        borderColor={STYLES.border.color}
                        bg={"white"}
                        disabled={true}
                      />
                      {isValidSecondaryIdentifierField() && (
                        <Field.HelperText>
                          <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                            {getIdentifierFormatHelperText(identifierFormat[0])}
                          </Text>
                        </Field.HelperText>
                      )}
                    </Field.Root>
                  </Flex>

                  <Flex direction={"column"} gap={"2"} grow={"1"}>
                    <Field.Root invalid={showSecondaryIdentifier && identifierFormat.length === 0}>
                      <Text
                        fontSize={"xs"}
                        fontWeight={"semibold"}
                        color={STYLES.font.secondaryHeader.color}
                        ml={"0.5"}
                      >
                        Identifier Format
                      </Text>
                      <Select.Root
                        value={identifierFormat}
                        onValueChange={(event) => setIdentifierFormat(event.value)}
                        collection={identifierFormats}
                        size={"xs"}
                        width={"100%"}
                        disabled={true}
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder={"Select Identifier Format"} />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content>
                              {Object.entries(groupBy(identifierFormats.items, (item) => item.category)).map(
                                ([category, items]) => (
                                  <Select.ItemGroup key={category}>
                                    <Select.ItemGroupLabel>{category}</Select.ItemGroupLabel>
                                    {items.map((format) => (
                                      <Select.Item item={format} key={format.value}>
                                        {format.label}
                                        <Select.ItemIndicator />
                                      </Select.Item>
                                    ))}
                                  </Select.ItemGroup>
                                ),
                              )}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                      <Field.ErrorText>
                        <Text fontSize={"xs"} ml={"0.5"}>
                          Please select an Identifier Format
                        </Text>
                      </Field.ErrorText>
                    </Field.Root>
                  </Flex>
                </Flex>
              )}

              {/* "Owner", "Timestamp", and "Visibility" fields */}
              <Flex gap={"2"} direction={"row"} w={"100%"} wrap={"wrap"}>
                {/* Owner */}
                <Flex direction={"column"} gap={"2"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Owner
                  </Text>
                  <ActorTag identifier={entityOwner} fallback={"Unknown User"} size={"sm"} isPublic />
                </Flex>

                {/* Timestamp */}
                <Flex direction={"column"} gap={"2"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Timestamp
                  </Text>
                  <TimestampTag timestamp={entityCreated} description={"Created"} />
                </Flex>

                {/* Visibility */}
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
                id={"entityDescriptionInput"}
                value={entityDescription}
                readOnly={true}
                onChange={(event) => setEntityDescription(event.target.value)}
                h={"100%"}
                size={"xs"}
              />
            </Flex>
          </Flex>

          {/* Attributes and Projects */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
            {/* Attributes */}
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
                <Flex direction={"row"} gap={"0.5"} align={"center"}>
                  <Icon name={"attribute"} size={"xs"} color={STYLES.template.color.icon} />
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Attributes ({entityAttributes.length})
                  </Text>
                </Flex>
              </Flex>

              <Flex
                w={"100%"}
                justify={"center"}
                align={"center"}
                minH={entityAttributes.length > 0 ? "fit-content" : "120px"}
              >
                {entityAttributes.length === 0 ? (
                  <EmptyState.Root>
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <Icon name={"attribute"} size={"lg"} color={STYLES.template.color.light} />
                      </EmptyState.Indicator>
                      <EmptyState.Description>No Attributes</EmptyState.Description>
                    </EmptyState.Content>
                  </EmptyState.Root>
                ) : (
                  <DataTable
                    data={entityAttributes}
                    columns={attributeTableColumns}
                    visibleColumns={visibleAttributeTableColumns}
                    selectedRows={{}}
                    viewOnly={true}
                    showPagination
                    showSelection
                  />
                )}
              </Flex>
            </Flex>

            {/* Projects */}
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
                <Flex direction={"row"} gap={"0.5"} align={"center"}>
                  <Icon name={"project"} size={"xs"} color={STYLES.project.color.icon} />
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Projects ({entityProjects.length})
                  </Text>
                </Flex>
              </Flex>
              <Flex
                w={"100%"}
                justify={"center"}
                align={"center"}
                minH={entityProjects.length > 0 ? "fit-content" : "120px"}
              >
                {entityProjects.length === 0 ? (
                  <EmptyState.Root>
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <Icon name={"project"} size={"lg"} color={STYLES.project.color.default} />
                      </EmptyState.Indicator>
                      <EmptyState.Description>No Projects</EmptyState.Description>
                    </EmptyState.Content>
                  </EmptyState.Root>
                ) : (
                  <DataTable
                    data={entityProjects}
                    columns={projectsTableColumns}
                    visibleColumns={{}}
                    selectedRows={{}}
                    viewOnly={true}
                    actions={projectsTableActions}
                    showPagination
                    showSelection
                  />
                )}
              </Flex>
            </Flex>
          </Flex>

          {/* Relationships and Attachments */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
            {/* Relationships */}
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
              <Flex gap={"2"} direction={"column"}>
                <Flex direction={"row"} justify={"space-between"} align={"center"}>
                  <Flex direction={"row"} gap={"0.5"} align={"center"}>
                    <Icon name={"graph"} size={"xs"} color={STYLES.font.secondaryHeader.color} />
                    <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                      Relationships ({entityRelationships.length})
                    </Text>
                  </Flex>
                </Flex>
                <Relationships
                  relationships={entityRelationships}
                  setRelationships={setEntityRelationships}
                  viewOnly={true}
                />
              </Flex>
            </Flex>

            {/* Attachments */}
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
              <Flex gap={"1"} direction={"column"}>
                <Flex direction={"row"} justify={"space-between"} align={"center"}>
                  <Flex direction={"row"} gap={"0.5"} align={"center"}>
                    <Icon name={"attachment"} size={"xs"} color={STYLES.font.secondaryHeader.color} />
                    <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                      Attachments ({entityAttachments.length})
                    </Text>
                  </Flex>
                </Flex>

                <Flex
                  w={"100%"}
                  justify={"center"}
                  align={"center"}
                  minH={entityAttachments.length > 0 ? "fit-content" : "120px"}
                >
                  {entityAttachments.length === 0 ? (
                    <EmptyState.Root>
                      <EmptyState.Content>
                        <EmptyState.Indicator>
                          <Icon name={"attachment"} size={"lg"} />
                        </EmptyState.Indicator>
                        <EmptyState.Description>No Attachments</EmptyState.Description>
                      </EmptyState.Content>
                    </EmptyState.Root>
                  ) : (
                    <DataTable
                      data={entityAttachments}
                      columns={attachmentTableColumns}
                      visibleColumns={{}}
                      selectedRows={{}}
                      actions={attachmentTableActions}
                      showPagination
                      showSelection
                      viewOnly
                    />
                  )}
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Entity;
