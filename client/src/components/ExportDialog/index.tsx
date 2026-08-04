// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Button, Checkbox, CloseButton, Dialog, Flex, Stack, Text } from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";

// Custom and existing types
import { AttributeModel, ExportDialogProps, IRelationship } from "@types";

// GraphQL
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Utility functions and libraries
import { ignoreAbort } from "@lib/util";
import { STYLES } from "@variables";
import _ from "lodash";
import dayjs from "dayjs";
import FileSaver from "file-saver";
import slugify from "slugify";

// MIME types
const XLSX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Format options per data type
const FORMAT_OPTIONS: Record<string, string[]> = {
  entity: ["JSON", "CSV", "XLSX"],
  entities: ["JSON", "CSV", "XLSX"],
  project: ["JSON", "CSV"],
  template: ["JSON"],
};

// Labels shown in the dialog header
const DIALOG_TITLE: Record<string, string> = {
  entity: "Export Entity",
  entities: "Export Entities",
  project: "Export Project",
  template: "Export Template",
};

// GraphQL documents hoisted to module scope so they are not recreated on each render
const GET_ENTITY_FOR_EXPORT = gql`
  query GetEntityForExport($_id: String) {
    entity(_id: $_id) {
      _id
      name
      owner
      created
      description
      projects
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
      }
    }
  }
`;

const GET_PROJECT_FOR_EXPORT = gql`
  query GetProjectForExport($_id: String) {
    project(_id: $_id) {
      _id
      name
      owner
      created
      description
      entities
    }
  }
`;

const EXPORT_ENTITY = gql`
  query ExportEntity($_id: String, $format: String, $fields: [String], $includeHistory: Boolean) {
    exportEntity(_id: $_id, format: $format, fields: $fields, includeHistory: $includeHistory)
  }
`;

const EXPORT_ENTITIES = gql`
  query ExportEntities($entities: [String], $format: String, $includeAttributes: Boolean, $includeHistory: Boolean) {
    exportEntities(
      entities: $entities
      format: $format
      includeAttributes: $includeAttributes
      includeHistory: $includeHistory
    )
  }
`;

const EXPORT_ENTITIES_ALL = gql`
  query ExportEntitiesAll($format: String, $includeAttributes: Boolean, $includeHistory: Boolean) {
    exportEntitiesAll(format: $format, includeAttributes: $includeAttributes, includeHistory: $includeHistory)
  }
`;

const EXPORT_PROJECT = gql`
  query ExportProject($_id: String, $format: String, $fields: [String], $includeHistory: Boolean) {
    exportProject(_id: $_id, format: $format, fields: $fields, includeHistory: $includeHistory)
  }
`;

const GET_TEMPLATE_FOR_EXPORT = gql`
  query GetTemplateForExport($_id: String) {
    template(_id: $_id) {
      _id
      name
      owner
      timestamp
      description
      archived
      values {
        _id
        name
        type
      }
    }
  }
`;

const EXPORT_TEMPLATE = gql`
  query ExportTemplate($_id: String, $fields: [String], $includeHistory: Boolean) {
    exportTemplate(_id: $_id, fields: $fields, includeHistory: $includeHistory)
  }
`;

/** Decode a base64 string to a Blob for XLSX download in browser context. */
const base64ToBlob = (base64: string): Blob => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: XLSX_MIME_TYPE });
};

/** Toggle a field key in or out of the export fields array. */
const toggleField = (fields: string[], key: string, checked: boolean): string[] => {
  if (checked) {
    return fields.includes(key) ? fields : [...fields, key];
  }
  return fields.filter((f) => f !== key);
};

const ExportDialog = (props: ExportDialogProps) => {
  const { open, setOpen, dataType, id, ids } = props;

  const [format, setFormat] = useState<"json" | "csv" | "xlsx">("json");
  const [includeHistory, setIncludeHistory] = useState(false);
  const [includeAttributes, setIncludeAttributes] = useState(true);
  const [exportFields, setExportFields] = useState<string[]>([]);

  // Fetch entity or project details for single-item field selection
  const [getEntity, { data: entityData, loading: entityLoading }] = useLazyQuery<{
    entity: {
      _id: string;
      name: string;
      owner: string;
      created: string;
      description: string;
      projects: string[];
      relationships: IRelationship[];
      attributes: AttributeModel[];
    };
  }>(GET_ENTITY_FOR_EXPORT);

  const [getProject, { data: projectData, loading: projectLoading }] = useLazyQuery<{
    project: {
      _id: string;
      name: string;
      owner: string;
      created: string;
      description: string;
      entities: string[];
    };
  }>(GET_PROJECT_FOR_EXPORT);

  const [getTemplate, { data: templateData, loading: templateLoading }] = useLazyQuery<{
    template: {
      _id: string;
      name: string;
      owner: string;
      timestamp: string;
      description: string;
      archived: boolean;
      values: { _id: string; name: string; type: string }[];
    };
  }>(GET_TEMPLATE_FOR_EXPORT);

  // Export queries
  const [exportEntity, { loading: exportEntityLoading }] = useLazyQuery<{ exportEntity: string }>(EXPORT_ENTITY);
  const [exportEntities, { loading: exportEntitiesLoading }] = useLazyQuery<{ exportEntities: string }>(
    EXPORT_ENTITIES,
  );
  const [exportEntitiesAll, { loading: exportEntitiesAllLoading }] = useLazyQuery<{ exportEntitiesAll: string }>(
    EXPORT_ENTITIES_ALL,
  );
  const [exportProject, { loading: exportProjectLoading }] = useLazyQuery<{ exportProject: string }>(EXPORT_PROJECT);
  const [exportTemplate, { loading: exportTemplateLoading }] = useLazyQuery<{ exportTemplate: string }>(
    EXPORT_TEMPLATE,
  );

  const isLoading =
    exportEntityLoading ||
    exportEntitiesLoading ||
    exportEntitiesAllLoading ||
    exportProjectLoading ||
    exportTemplateLoading;

  useEffect(() => {
    if (open) {
      if (dataType === "entity" && id) {
        getEntity({ variables: { _id: id } });
      }
      if (dataType === "project" && id) {
        getProject({ variables: { _id: id } });
      }
      if (dataType === "template" && id) {
        getTemplate({ variables: { _id: id } });
      }
    } else {
      // Reset state when the dialog closes
      setFormat("json");
      setIncludeHistory(false);
      setIncludeAttributes(true);
      setExportFields([]);
    }
  }, [open]);

  const handleDownload = async () => {
    let responseData: string | undefined;
    let filename = "";

    const datestamp = dayjs().format("YYYY_MM_DD");

    if (dataType === "entity" && id) {
      const response = await exportEntity({
        variables: { _id: id, format, fields: exportFields.length > 0 ? exportFields : undefined, includeHistory },
      }).catch(ignoreAbort);
      responseData = response?.data?.exportEntity;
      filename = slugify(`export_entity_${datestamp}.${format}`);
    } else if (dataType === "entities") {
      if (ids !== undefined) {
        const response = await exportEntities({
          variables: { entities: ids, format, includeAttributes, includeHistory },
        }).catch(ignoreAbort);
        responseData = response?.data?.exportEntities;
      } else {
        const response = await exportEntitiesAll({
          variables: { format, includeAttributes, includeHistory },
        }).catch(ignoreAbort);
        responseData = response?.data?.exportEntitiesAll;
      }
      filename = slugify(`export_entities_${datestamp}.${format}`);
    } else if (dataType === "project" && id) {
      const response = await exportProject({
        variables: { _id: id, format, fields: exportFields.length > 0 ? exportFields : undefined, includeHistory },
      }).catch(ignoreAbort);
      responseData = response?.data?.exportProject;
      filename = slugify(`export_project_${datestamp}.${format}`);
    } else if (dataType === "template" && id) {
      const response = await exportTemplate({
        variables: { _id: id, fields: exportFields.length > 0 ? exportFields : undefined, includeHistory },
      }).catch(ignoreAbort);
      responseData = response?.data?.exportTemplate;
      filename = slugify(`export_template_${datestamp}.json`);
    }

    if (!responseData) {
      toaster.create({
        title: "Error",
        description: `Unable to export ${dataType}`,
        type: "error",
        duration: 2000,
        closable: true,
      });
      return;
    }

    const blob = format === "xlsx" ? base64ToBlob(responseData) : new Blob([responseData]);
    FileSaver.saveAs(blob, filename);
    setOpen(false);
  };

  const handleCopyJson = async () => {
    if (dataType !== "template" || !id) return;
    const response = await exportTemplate({
      variables: { _id: id, fields: exportFields.length > 0 ? exportFields : undefined, includeHistory },
    }).catch(ignoreAbort);
    const responseData = response?.data?.exportTemplate;
    if (!responseData) {
      toaster.create({
        title: "Error",
        description: "Unable to copy template JSON",
        type: "error",
        duration: 2000,
        closable: true,
      });
      return;
    }
    await navigator.clipboard.writeText(responseData);
    toaster.create({
      title: "Copied",
      description: "Template JSON copied to clipboard",
      type: "success",
      duration: 2000,
      closable: true,
    });
  };

  const entity = entityData?.entity;
  const project = projectData?.project;
  const template = templateData?.template;
  const dataLoading = entityLoading || projectLoading || templateLoading;

  const title = DIALOG_TITLE[dataType];
  const formatOptions = FORMAT_OPTIONS[dataType];

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => setOpen(details.open)}
      size={"xl"}
      placement={"center"}
      closeOnEscape
      closeOnInteractOutside
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content w={["lg", "xl", "2xl"]} gap={"0"}>
          {/* Header */}
          <Dialog.Header p={"2"} bg={"surface.emphasized"} color={"text.default"} roundedTop={"md"}>
            <Flex direction={"row"} gap={"1"} align={"center"}>
              <Icon name={"download"} size={"xs"} />
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {title}
              </Text>
            </Flex>
            <Dialog.CloseTrigger asChild>
              <CloseButton size={"2xs"} top={"6px"} onClick={() => setOpen(false)} />
            </Dialog.CloseTrigger>
          </Dialog.Header>

          <Dialog.Body p={"2"} display={"flex"} flexDirection={"column"} gap={"2"}>
            {/* Format */}
            <Flex direction={"column"} gap={"1.5"}>
              <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                Format
              </Text>
              <Flex gap={"1"}>
                {formatOptions.map((opt) => {
                  const val = opt.toLowerCase() as typeof format;
                  return (
                    <Button
                      key={opt}
                      size={"xs"}
                      rounded={"md"}
                      variant={format === val ? "solid" : "outline"}
                      colorPalette={format === val ? "blue" : "gray"}
                      onClick={() => setFormat(val)}
                    >
                      {opt}
                    </Button>
                  );
                })}
              </Flex>
            </Flex>

            {/* Entity field selection */}
            {dataType === "entity" && (
              <Flex
                direction={"column"}
                gap={"2"}
                p={"2"}
                rounded={"md"}
                bg={STYLES.card.bg}
                border={STYLES.border.style}
                borderColor={STYLES.border.color}
              >
                <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                  Fields
                </Text>
                {dataLoading || !entity ? (
                  <Text fontSize={"xs"} color={"text.subtle"}>
                    Loading fields...
                  </Text>
                ) : (
                  <>
                    <Flex direction={"row"} gap={"6"} wrap={"wrap"}>
                      {/* Details */}
                      <Flex direction={"column"} gap={"1"} grow={"1"}>
                        <Text fontSize={"xs"} fontWeight={"semibold"}>
                          Details
                        </Text>
                        <Stack gap={"1"} direction={"column"}>
                          <Checkbox.Root disabled defaultChecked size={"xs"}>
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label>
                              <Flex fontSize={"xs"} gap={"1"} direction={"row"}>
                                <Text fontWeight={"semibold"}>Name:</Text>
                                <Text>{entity.name}</Text>
                              </Flex>
                            </Checkbox.Label>
                          </Checkbox.Root>
                          <Checkbox.Root
                            checked={_.includes(exportFields, "created")}
                            onCheckedChange={(details) =>
                              setExportFields(toggleField(exportFields, "created", details.checked as boolean))
                            }
                            size={"xs"}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label>
                              <Flex fontSize={"xs"} gap={"1"} direction={"row"}>
                                <Text fontWeight={"semibold"}>Created:</Text>
                                <Text>{dayjs(entity.created).format("DD MMM YYYY")}</Text>
                              </Flex>
                            </Checkbox.Label>
                          </Checkbox.Root>
                          <Checkbox.Root checked disabled size={"xs"}>
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label>
                              <Flex direction={"row"} gap={"0.5"} align={"center"}>
                                <Text fontSize={"xs"} fontWeight={"semibold"}>
                                  Owner:
                                </Text>
                                <ActorTag identifier={entity.owner} inlineNoAvatar fallback={""} size={"sm"} />
                              </Flex>
                            </Checkbox.Label>
                          </Checkbox.Root>
                          <Checkbox.Root
                            checked={_.includes(exportFields, "description")}
                            onCheckedChange={(details) =>
                              setExportFields(toggleField(exportFields, "description", details.checked as boolean))
                            }
                            disabled={_.isEqual(entity.description, "")}
                            size={"xs"}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label>
                              <Flex fontSize={"xs"} gap={"1"} direction={"row"}>
                                <Text fontWeight={"semibold"}>Description:</Text>
                                <Text lineClamp={1}>
                                  {_.isEqual(entity.description, "")
                                    ? "No description"
                                    : _.truncate(entity.description, { length: 32 })}
                                </Text>
                              </Flex>
                            </Checkbox.Label>
                          </Checkbox.Root>
                        </Stack>
                      </Flex>

                      {/* Projects */}
                      <Flex direction={"column"} gap={"1"} grow={"1"}>
                        <Text fontSize={"xs"} fontWeight={"semibold"}>
                          Projects
                        </Text>
                        {entity.projects.length > 0 ? (
                          <Stack gap={"1"} direction={"column"}>
                            {entity.projects.map((projectId) => (
                              <Checkbox.Root
                                size={"xs"}
                                key={projectId}
                                checked={_.includes(exportFields, `project_${projectId}`)}
                                onCheckedChange={(details) =>
                                  setExportFields(
                                    toggleField(exportFields, `project_${projectId}`, details.checked as boolean),
                                  )
                                }
                              >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control />
                                <Checkbox.Label>
                                  <Linky id={projectId} type={"projects"} size={"xs"} />
                                </Checkbox.Label>
                              </Checkbox.Root>
                            ))}
                          </Stack>
                        ) : (
                          <Text fontSize={"xs"} color={"text.subtle"}>
                            No projects
                          </Text>
                        )}
                      </Flex>
                    </Flex>

                    {/* Relationships */}
                    {entity.relationships.length > 0 && (
                      <Flex direction={"column"} gap={"1"}>
                        <Text fontSize={"xs"} fontWeight={"semibold"}>
                          Relationships
                        </Text>
                        <Stack gap={"1"} direction={"column"}>
                          {entity.relationships.map((relationship) => (
                            <Checkbox.Root
                              size={"xs"}
                              key={`${relationship.target._id}_${relationship.type}`}
                              checked={_.includes(
                                exportFields,
                                `relationship_${relationship.target._id}_${relationship.type}`,
                              )}
                              onCheckedChange={(details) =>
                                setExportFields(
                                  toggleField(
                                    exportFields,
                                    `relationship_${relationship.target._id}_${relationship.type}`,
                                    details.checked as boolean,
                                  ),
                                )
                              }
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                              <Checkbox.Label>
                                <Flex direction={"row"} gap={"1"} align={"center"}>
                                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                                    {relationship.type === "general"
                                      ? "Related to:"
                                      : `${_.capitalize(relationship.type)} of:`}
                                  </Text>
                                  <Linky id={relationship.target._id} type={"entities"} size={"xs"} />
                                </Flex>
                              </Checkbox.Label>
                            </Checkbox.Root>
                          ))}
                        </Stack>
                      </Flex>
                    )}

                    {/* Attributes */}
                    {entity.attributes.length > 0 && (
                      <Flex direction={"column"} gap={"1"}>
                        <Text fontSize={"xs"} fontWeight={"semibold"}>
                          Attributes
                        </Text>
                        <Stack gap={"1"} direction={"column"}>
                          {entity.attributes.map((attribute) => (
                            <Checkbox.Root
                              size={"xs"}
                              key={attribute._id}
                              checked={_.includes(exportFields, `attribute_${attribute._id}`)}
                              onCheckedChange={(details) =>
                                setExportFields(
                                  toggleField(exportFields, `attribute_${attribute._id}`, details.checked as boolean),
                                )
                              }
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                              <Checkbox.Label>
                                <Text fontSize={"xs"}>{attribute.name}</Text>
                              </Checkbox.Label>
                            </Checkbox.Root>
                          ))}
                        </Stack>
                      </Flex>
                    )}
                  </>
                )}
              </Flex>
            )}

            {/* Multi-entity summary */}
            {dataType === "entities" && (
              <Flex
                direction={"row"}
                gap={"2"}
                p={"2"}
                align={"center"}
                rounded={"md"}
                bg={"purple.50"}
                border={"1px solid"}
                borderColor={"purple.200"}
              >
                <Icon name={"entity"} size={"sm"} color={STYLES.entity.color.icon} />
                <Flex direction={"column"} gap={"0.5"} grow={"1"}>
                  <Text fontSize={"xs"} fontWeight={"bold"}>
                    {ids !== undefined ? `${ids.length} ${ids.length === 1 ? "Entity" : "Entities"}` : "All Entities"}
                  </Text>
                  <Text fontSize={"xs"} color={"text.subtle"}>
                    {ids !== undefined
                      ? "Selected entities will be exported"
                      : "All entities in this workspace will be exported"}
                  </Text>
                </Flex>
              </Flex>
            )}

            {/* Project field selection */}
            {dataType === "project" && (
              <Flex
                direction={"column"}
                gap={"2"}
                p={"2"}
                rounded={"md"}
                bg={STYLES.card.bg}
                border={STYLES.border.style}
                borderColor={STYLES.border.color}
              >
                <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                  Fields
                </Text>
                {dataLoading || !project ? (
                  <Text fontSize={"xs"} color={"text.subtle"}>
                    Loading fields...
                  </Text>
                ) : (
                  <Flex direction={"row"} gap={"6"} wrap={"wrap"}>
                    {/* Details */}
                    <Flex direction={"column"} gap={"1"} grow={"1"}>
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        Details
                      </Text>
                      <Stack gap={"1"} direction={"column"}>
                        <Checkbox.Root disabled defaultChecked size={"xs"}>
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>
                            <Flex fontSize={"xs"} gap={"1"} direction={"row"}>
                              <Text fontWeight={"semibold"}>Name:</Text>
                              <Text>{project.name}</Text>
                            </Flex>
                          </Checkbox.Label>
                        </Checkbox.Root>
                        <Checkbox.Root
                          size={"xs"}
                          checked={_.includes(exportFields, "created")}
                          onCheckedChange={(details) =>
                            setExportFields(toggleField(exportFields, "created", details.checked as boolean))
                          }
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>
                            <Flex fontSize={"xs"} gap={"1"} direction={"row"}>
                              <Text fontWeight={"semibold"}>Created:</Text>
                              <Text>{dayjs(project.created).format("DD MMM YYYY")}</Text>
                            </Flex>
                          </Checkbox.Label>
                        </Checkbox.Root>
                        <Checkbox.Root
                          size={"xs"}
                          checked={_.includes(exportFields, "owner")}
                          onCheckedChange={(details) =>
                            setExportFields(toggleField(exportFields, "owner", details.checked as boolean))
                          }
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>
                            <Flex direction={"row"} gap={"0.5"} align={"center"}>
                              <Text fontSize={"xs"} fontWeight={"semibold"}>
                                Owner:
                              </Text>
                              <ActorTag identifier={project.owner} inlineNoAvatar fallback={""} size={"sm"} />
                            </Flex>
                          </Checkbox.Label>
                        </Checkbox.Root>
                        <Checkbox.Root
                          size={"xs"}
                          checked={_.includes(exportFields, "description")}
                          onCheckedChange={(details) =>
                            setExportFields(toggleField(exportFields, "description", details.checked as boolean))
                          }
                          disabled={_.isEqual(project.description, "")}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>
                            <Flex fontSize={"xs"} gap={"1"} direction={"row"}>
                              <Text fontWeight={"semibold"}>Description:</Text>
                              <Text lineClamp={1}>
                                {_.isEqual(project.description, "")
                                  ? "No description"
                                  : _.truncate(project.description, { length: 32 })}
                              </Text>
                            </Flex>
                          </Checkbox.Label>
                        </Checkbox.Root>
                      </Stack>
                    </Flex>

                    {/* Entities */}
                    <Flex direction={"column"} gap={"1"} grow={"1"}>
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        Entities
                      </Text>
                      <Tooltip
                        content={"Entities cannot be included when exporting to CSV"}
                        disabled={format === "json"}
                        showArrow
                      >
                        <Checkbox.Root
                          size={"xs"}
                          checked={_.includes(exportFields, "entities")}
                          onCheckedChange={(details) =>
                            setExportFields(toggleField(exportFields, "entities", details.checked as boolean))
                          }
                          disabled={project.entities.length === 0 || format === "csv"}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>
                            <Text fontSize={"xs"}>
                              {project.entities.length === 0
                                ? "No entities"
                                : `Export all ${project.entities.length} ${project.entities.length === 1 ? "entity" : "entities"}`}
                            </Text>
                          </Checkbox.Label>
                        </Checkbox.Root>
                      </Tooltip>
                    </Flex>
                  </Flex>
                )}
              </Flex>
            )}

            {/* Template field selection */}
            {dataType === "template" && (
              <Flex
                direction={"column"}
                gap={"2"}
                p={"2"}
                rounded={"md"}
                bg={STYLES.card.bg}
                border={STYLES.border.style}
                borderColor={STYLES.border.color}
              >
                <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                  Fields
                </Text>
                {dataLoading || !template ? (
                  <Text fontSize={"xs"} color={"text.subtle"}>
                    Loading fields...
                  </Text>
                ) : (
                  <Flex direction={"row"} gap={"6"} wrap={"wrap"}>
                    {/* Details */}
                    <Flex direction={"column"} gap={"1"} grow={"1"}>
                      <Text fontSize={"xs"} fontWeight={"semibold"}>
                        Details
                      </Text>
                      <Stack gap={"1"} direction={"column"}>
                        <Checkbox.Root disabled defaultChecked size={"xs"}>
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>
                            <Flex fontSize={"xs"} gap={"1"} direction={"row"}>
                              <Text fontWeight={"semibold"}>Name:</Text>
                              <Text>{template.name}</Text>
                            </Flex>
                          </Checkbox.Label>
                        </Checkbox.Root>
                        <Checkbox.Root disabled defaultChecked size={"xs"}>
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>
                            <Flex fontSize={"xs"} gap={"1"} direction={"row"}>
                              <Text fontWeight={"semibold"}>Values:</Text>
                              <Text>
                                {template.values.length} {template.values.length === 1 ? "value" : "values"}
                              </Text>
                            </Flex>
                          </Checkbox.Label>
                        </Checkbox.Root>
                        <Checkbox.Root
                          size={"xs"}
                          checked={_.includes(exportFields, "timestamp")}
                          onCheckedChange={(details) =>
                            setExportFields(toggleField(exportFields, "timestamp", details.checked as boolean))
                          }
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>
                            <Flex fontSize={"xs"} gap={"1"} direction={"row"}>
                              <Text fontWeight={"semibold"}>Created:</Text>
                              <Text>{dayjs(template.timestamp).format("DD MMM YYYY")}</Text>
                            </Flex>
                          </Checkbox.Label>
                        </Checkbox.Root>
                        <Checkbox.Root
                          size={"xs"}
                          checked={_.includes(exportFields, "owner")}
                          onCheckedChange={(details) =>
                            setExportFields(toggleField(exportFields, "owner", details.checked as boolean))
                          }
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>
                            <Flex direction={"row"} gap={"0.5"} align={"center"}>
                              <Text fontSize={"xs"} fontWeight={"semibold"}>
                                Owner:
                              </Text>
                              <ActorTag identifier={template.owner} inlineNoAvatar fallback={""} size={"sm"} />
                            </Flex>
                          </Checkbox.Label>
                        </Checkbox.Root>
                        <Checkbox.Root
                          size={"xs"}
                          checked={_.includes(exportFields, "description")}
                          onCheckedChange={(details) =>
                            setExportFields(toggleField(exportFields, "description", details.checked as boolean))
                          }
                          disabled={_.isEqual(template.description, "")}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>
                            <Flex fontSize={"xs"} gap={"1"} direction={"row"}>
                              <Text fontWeight={"semibold"}>Description:</Text>
                              <Text lineClamp={1}>
                                {_.isEqual(template.description, "")
                                  ? "No description"
                                  : _.truncate(template.description, { length: 32 })}
                              </Text>
                            </Flex>
                          </Checkbox.Label>
                        </Checkbox.Root>
                        <Checkbox.Root
                          size={"xs"}
                          checked={_.includes(exportFields, "archived")}
                          onCheckedChange={(details) =>
                            setExportFields(toggleField(exportFields, "archived", details.checked as boolean))
                          }
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>
                            <Flex fontSize={"xs"} gap={"1"} direction={"row"}>
                              <Text fontWeight={"semibold"}>Archived:</Text>
                              <Text>{template.archived ? "Yes" : "No"}</Text>
                            </Flex>
                          </Checkbox.Label>
                        </Checkbox.Root>
                      </Stack>
                    </Flex>
                  </Flex>
                )}
              </Flex>
            )}

            {/* Options */}
            <Flex
              direction={"column"}
              gap={"2"}
              p={"2"}
              rounded={"md"}
              bg={STYLES.card.bg}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
            >
              <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                Options
              </Text>
              <Tooltip content={"History is only included in JSON exports"} disabled={format === "json"} showArrow>
                <Checkbox.Root
                  size={"xs"}
                  checked={includeHistory}
                  onCheckedChange={(details) => setIncludeHistory(details.checked as boolean)}
                  disabled={format !== "json"}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label>
                    <Text fontSize={"xs"}>Include version history</Text>
                  </Checkbox.Label>
                </Checkbox.Root>
              </Tooltip>
              {dataType === "entities" && format !== "json" && (
                <Checkbox.Root
                  size={"xs"}
                  checked={includeAttributes}
                  onCheckedChange={(details) => setIncludeAttributes(details.checked as boolean)}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label>
                    <Text fontSize={"xs"}>Include attribute columns</Text>
                  </Checkbox.Label>
                </Checkbox.Root>
              )}
            </Flex>
          </Dialog.Body>

          {/* Footer */}
          <Dialog.Footer p={"2"} bg={STYLES.dialog.footer.bg} roundedBottom={"md"}>
            <Flex direction={"row"} w={"100%"} justify={"right"} align={"center"} gap={"2"}>
              {dataType === "template" && (
                <Button
                  colorPalette={"blue"}
                  variant={"solid"}
                  size={"xs"}
                  rounded={"md"}
                  onClick={handleCopyJson}
                  loading={isLoading}
                  loadingText={"Copying..."}
                >
                  Copy JSON
                  <Icon name={"copy"} size={"xs"} />
                </Button>
              )}
              <Button
                colorPalette={"blue"}
                size={"xs"}
                rounded={"md"}
                onClick={handleDownload}
                loading={isLoading}
                loadingText={"Exporting..."}
              >
                Download
                <Icon name={"download"} size={"xs"} />
              </Button>
            </Flex>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default ExportDialog;
