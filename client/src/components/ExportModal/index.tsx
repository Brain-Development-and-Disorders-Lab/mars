// React
import React, { useEffect, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Fieldset,
  Flex,
  Portal,
  Select,
  Separator,
  Stack,
  Text,
  createListCollection,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";

// Custom and existing types
import { AttributeModel, ExportModalProps, IRelationship } from "@types";

// GraphQL
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Utility functions and libraries
import { ignoreAbort } from "@lib/util";
import { GLOBAL_STYLES } from "@variables";
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

const EXPORT_TEMPLATE = gql`
  query ExportTemplate($_id: String) {
    exportTemplate(_id: $_id)
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

const ExportModal = (props: ExportModalProps) => {
  const { open, setOpen, dataType, id, ids } = props;

  const [format, setFormat] = useState<"json" | "csv" | "xlsx">("json");
  const [includeHistory, setIncludeHistory] = useState(false);
  const [includeAttributes, setIncludeAttributes] = useState(true);
  const [exportFields, setExportFields] = useState<string[]>([]);

  const formatSelectRef = useRef<HTMLDivElement>(null);

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
    } else {
      // Reset state when the modal closes
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
      const response = await exportTemplate({ variables: { _id: id } }).catch(ignoreAbort);
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

  const entity = entityData?.entity;
  const project = projectData?.project;
  const dataLoading = entityLoading || projectLoading;

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
          <Dialog.Header p={"2"} bg={GLOBAL_STYLES.dialog.headerColor} roundedTop={"md"}>
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

          <Dialog.Body p={"1"} gap={"1"}>
            {/* Format selector */}
            <Flex w={"100%"} direction={"row"} p={"1"} gap={"1"} align={"center"} ref={formatSelectRef}>
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                Format:
              </Text>
              <Select.Root
                key={"select-export-format"}
                w={"120px"}
                size={"xs"}
                collection={createListCollection({ items: formatOptions })}
                defaultValue={["JSON"]}
                onValueChange={(details) => {
                  setFormat(details.items[0].toLowerCase() as "json" | "csv" | "xlsx");
                }}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger rounded={"md"}>
                    <Select.ValueText placeholder={"Select format"} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal container={formatSelectRef}>
                  <Select.Positioner>
                    <Select.Content zIndex={9999}>
                      {formatOptions.map((option) => (
                        <Select.Item item={option} key={option}>
                          {option}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Flex>

            {/* Single entity field selection */}
            {dataType === "entity" && (
              <Flex
                direction={"column"}
                p={"1"}
                gap={"1"}
                rounded={"md"}
                border={GLOBAL_STYLES.border.style}
                borderColor={GLOBAL_STYLES.border.color}
              >
                <Flex direction={"row"} gap={"1"}>
                  {/* Details fieldset */}
                  <Fieldset.Root>
                    <Fieldset.Content gap={"1"}>
                      <Fieldset.Legend fontSize={"xs"} fontWeight={"semibold"}>
                        Entity Details
                      </Fieldset.Legend>
                      {!dataLoading && entity ? (
                        <Stack gap={"1"} direction={"column"}>
                          <Checkbox.Root disabled defaultChecked fontSize={"xs"} size={"xs"}>
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
                            fontSize={"xs"}
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
                          <Checkbox.Root checked disabled fontSize={"xs"} size={"xs"}>
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label>
                              <Flex direction={"row"} gap={"0.5"} align={"center"}>
                                Owner:
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
                                    ? "No Description"
                                    : _.truncate(entity.description, { length: 32 })}
                                </Text>
                              </Flex>
                            </Checkbox.Label>
                          </Checkbox.Root>
                        </Stack>
                      ) : (
                        <Text fontSize={"xs"}>Loading details...</Text>
                      )}
                    </Fieldset.Content>
                  </Fieldset.Root>

                  {/* Linked projects fieldset */}
                  <Fieldset.Root>
                    <Fieldset.Content gap={"1"}>
                      <Fieldset.Legend fontSize={"xs"} fontWeight={"semibold"}>
                        Linked Projects
                      </Fieldset.Legend>
                      {!dataLoading && entity && entity.projects.length > 0 ? (
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
                        <Text fontSize={"xs"}>No Projects</Text>
                      )}
                    </Fieldset.Content>
                  </Fieldset.Root>
                </Flex>

                <Separator />

                {/* Relationships fieldset */}
                <Flex direction={"row"} gap={"1"}>
                  <Fieldset.Root>
                    <Fieldset.Content gap={"1"}>
                      <Fieldset.Legend fontSize={"xs"} fontWeight={"semibold"}>
                        Entity Relationships
                      </Fieldset.Legend>
                      {!dataLoading && entity && entity.relationships.length > 0 ? (
                        <Stack gap={"1"} direction={"column"}>
                          {entity.relationships.map((relationship) => (
                            <Checkbox.Root
                              size={"xs"}
                              fontSize={"xs"}
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
                                  {relationship.type === "general" ? (
                                    <Text fontWeight={"semibold"}>Related to:</Text>
                                  ) : (
                                    <Text fontWeight={"semibold"}>{_.capitalize(relationship.type)} of:</Text>
                                  )}
                                  <Linky id={relationship.target._id} type={"entities"} size={"xs"} />
                                </Flex>
                              </Checkbox.Label>
                            </Checkbox.Root>
                          ))}
                        </Stack>
                      ) : (
                        <Text fontSize={"xs"}>No Relationships</Text>
                      )}
                    </Fieldset.Content>
                  </Fieldset.Root>
                </Flex>

                <Separator />

                {/* Attributes fieldset */}
                <Flex direction={"row"} gap={"1"}>
                  <Fieldset.Root>
                    <Fieldset.Content gap={"1"}>
                      <Fieldset.Legend fontSize={"xs"} fontWeight={"semibold"}>
                        Entity Attributes
                      </Fieldset.Legend>
                      {!dataLoading && entity && entity.attributes.length > 0 ? (
                        <Stack gap={"1"} direction={"column"}>
                          {entity.attributes.map((attribute) => (
                            <Checkbox.Root
                              size={"xs"}
                              fontSize={"xs"}
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
                                <Flex direction={"row"} gap={"0.5"} align={"center"}>
                                  <Text fontWeight={"semibold"}>Attribute:</Text>
                                  <Text>{attribute.name}</Text>
                                </Flex>
                              </Checkbox.Label>
                            </Checkbox.Root>
                          ))}
                        </Stack>
                      ) : (
                        <Text fontSize={"xs"}>No Attributes</Text>
                      )}
                    </Fieldset.Content>
                  </Fieldset.Root>
                </Flex>
              </Flex>
            )}

            {/* Multi-entity summary */}
            {dataType === "entities" && (
              <Flex
                direction={"column"}
                p={"1"}
                gap={"1"}
                rounded={"md"}
                border={GLOBAL_STYLES.border.style}
                borderColor={GLOBAL_STYLES.border.color}
              >
                <Flex align={"center"} gap={"1"} p={"1"}>
                  <Icon name={"entity"} size={"sm"} color={GLOBAL_STYLES.entity.iconColor} />
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    {ids !== undefined
                      ? `${ids.length} ${ids.length === 1 ? "Entity" : "Entities"} selected`
                      : "All Entities will be exported"}
                  </Text>
                </Flex>

                {/* Include Attributes toggle for spreadsheet formats */}
                {format !== "json" && (
                  <Flex px={"1"}>
                    <Checkbox.Root
                      size={"xs"}
                      checked={includeAttributes}
                      onCheckedChange={(details) => setIncludeAttributes(details.checked as boolean)}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                      <Checkbox.Label>
                        <Text fontSize={"xs"}>Include Attribute columns</Text>
                      </Checkbox.Label>
                    </Checkbox.Root>
                  </Flex>
                )}
              </Flex>
            )}

            {/* Single project field selection */}
            {dataType === "project" && (
              <Flex
                direction={"row"}
                p={"1"}
                gap={"1"}
                rounded={"md"}
                border={GLOBAL_STYLES.border.style}
                borderColor={GLOBAL_STYLES.border.color}
              >
                {/* Details fieldset */}
                <Fieldset.Root>
                  <Fieldset.Content gap={"1"}>
                    <Fieldset.Legend fontSize={"xs"}>Details</Fieldset.Legend>
                    {!dataLoading && project ? (
                      <Stack gap={"1"} direction={"column"}>
                        <Checkbox.Root disabled defaultChecked size={"xs"} rounded={"md"} fontSize={"xs"}>
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
                          rounded={"md"}
                          fontSize={"xs"}
                          checked={_.includes(exportFields, "created")}
                          onCheckedChange={(details) =>
                            setExportFields(toggleField(exportFields, "created", details.checked as boolean))
                          }
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label fontSize={"xs"}>
                            <Flex fontSize={"xs"} gap={"1"} direction={"row"}>
                              <Text fontWeight={"semibold"}>Created:</Text>
                              <Text>{dayjs(project.created).format("DD MMM YYYY")}</Text>
                            </Flex>
                          </Checkbox.Label>
                        </Checkbox.Root>
                        <Checkbox.Root
                          size={"xs"}
                          rounded={"md"}
                          checked={_.includes(exportFields, "owner")}
                          onCheckedChange={(details) =>
                            setExportFields(toggleField(exportFields, "owner", details.checked as boolean))
                          }
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>
                            <Flex direction={"row"} gap={"0.5"} align={"center"}>
                              Owner:
                              <ActorTag identifier={project.owner} inlineNoAvatar fallback={""} size={"sm"} />
                            </Flex>
                          </Checkbox.Label>
                        </Checkbox.Root>
                        <Checkbox.Root
                          size={"xs"}
                          rounded={"md"}
                          checked={_.includes(exportFields, "description")}
                          onCheckedChange={(details) =>
                            setExportFields(toggleField(exportFields, "description", details.checked as boolean))
                          }
                          disabled={_.isEqual(project.description, "")}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label fontSize={"xs"}>
                            <Flex fontSize={"xs"} gap={"1"} direction={"row"}>
                              <Text fontWeight={"semibold"}>Description:</Text>
                              <Text lineClamp={1}>
                                {_.isEqual(project.description, "")
                                  ? "No Description"
                                  : _.truncate(project.description, { length: 32 })}
                              </Text>
                            </Flex>
                          </Checkbox.Label>
                        </Checkbox.Root>
                      </Stack>
                    ) : (
                      <Text fontSize={"xs"}>Loading details...</Text>
                    )}
                  </Fieldset.Content>
                </Fieldset.Root>

                {/* Entities fieldset */}
                <Fieldset.Root>
                  <Fieldset.Content gap={"1"}>
                    <Fieldset.Legend fontSize={"xs"}>Entities</Fieldset.Legend>
                    {!dataLoading && project ? (
                      <Tooltip
                        content={"Entities cannot be included when exporting to CSV"}
                        disabled={format === "json"}
                        showArrow
                      >
                        <Checkbox.Root
                          size={"xs"}
                          rounded={"md"}
                          checked={_.includes(exportFields, "entities")}
                          onCheckedChange={(details) =>
                            setExportFields(toggleField(exportFields, "entities", details.checked as boolean))
                          }
                          disabled={project.entities.length === 0 || format === "csv"}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label fontSize={"xs"}>
                            <Text fontSize={"xs"}>Export all Entities</Text>
                          </Checkbox.Label>
                        </Checkbox.Root>
                      </Tooltip>
                    ) : (
                      <Text fontSize={"xs"}>Loading details...</Text>
                    )}
                  </Fieldset.Content>
                </Fieldset.Root>
              </Flex>
            )}

            {/* Include History toggle */}
            {dataType !== "template" && (
              <Flex px={"1"} pt={"1"}>
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
                      <Text fontSize={"xs"}>Include History</Text>
                    </Checkbox.Label>
                  </Checkbox.Root>
                </Tooltip>
              </Flex>
            )}
          </Dialog.Body>

          {/* Footer */}
          <Dialog.Footer p={"1"} bg={GLOBAL_STYLES.dialog.footerColor} roundedBottom={"md"}>
            <Flex direction={"row"} w={"100%"} justify={"right"} align={"center"}>
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

export default ExportModal;
