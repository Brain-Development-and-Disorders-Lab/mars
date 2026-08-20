// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Breadcrumb,
  Button,
  EmptyState,
  Flex,
  Heading,
  Input,
  SkeletonText,
  Tag,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Values from "@components/Values";
import ActorTag from "@components/ActorTag";
import DataTable from "@components/DataTable";
import Linky from "@components/Linky";
import TimestampTag from "@components/TimestampTag";
import { toaster } from "@components/Toast";
import Tooltip from "@components/Tooltip";
import VisibilityTag from "@components/VisibilityTag";

// Existing and custom types
import { AttributeModel, AttributeUsage, IGenericItem, IValue } from "@types";

// Utility functions and libraries
import _ from "lodash";
import { getPublicWorkspaceUrl } from "@lib/util";

// Routing and navigation
import { useNavigate, useParams } from "react-router-dom";

// GraphQL imports
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Hooks
import { useBreakpoint } from "@hooks/useBreakpoint";

// Variables
import { STYLES } from "@variables";

export const Template = () => {
  const navigate = useNavigate();
  const { id: workspace, template } = useParams();
  const [workspaceName, setWorkspaceName] = useState("");

  // Breakpoint
  const { isBreakpointActive } = useBreakpoint();

  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateOwner, setTemplateOwner] = useState("");
  const [templateTimestamp, setTemplateTimestamp] = useState("");
  const [templateArchived, setTemplateArchived] = useState(false);
  const [templateValues, setTemplateValues] = useState<IValue[]>([]);
  const [templateUsage, setTemplateUsage] = useState<AttributeUsage[]>([]);

  // GraphQL operations
  const GET_TEMPLATE = gql`
    query GetTemplate($_id: String, $workspace: String) {
      template(_id: $_id) {
        _id
        name
        timestamp
        owner
        archived
        description
        values {
          _id
          name
          type
          data
        }
        history {
          author
          message
          timestamp
          version
          _id
          name
          owner
          archived
          description
          values {
            _id
            name
            type
            data
          }
        }
      }
      workspace(_id: $workspace) {
        _id
        name
      }
    }
  `;
  const { loading, error, data } = useQuery<{
    template: AttributeModel;
    workspace: IGenericItem;
  }>(GET_TEMPLATE, {
    variables: {
      _id: template,
      workspace: workspace,
    },
    fetchPolicy: "no-cache",
    context: {
      uri: getPublicWorkspaceUrl(workspace ?? ""),
    },
  });

  const GET_TEMPLATE_USAGE = gql`
    query GetTemplateUsage($_id: String) {
      templateUsage(_id: $_id) {
        entity
        modifications
      }
    }
  `;
  const {
    loading: usageLoading,
    error: usageError,
    data: usageData,
  } = useQuery<{
    templateUsage: AttributeUsage[];
  }>(GET_TEMPLATE_USAGE, {
    variables: {
      _id: template,
    },
    fetchPolicy: "no-cache",
    context: {
      uri: getPublicWorkspaceUrl(workspace ?? ""),
    },
  });

  // Manage data once retrieved
  useEffect(() => {
    if (data?.template) {
      setTemplateName(data.template.name);
      setTemplateArchived(data.template.archived);
      setTemplateOwner(data.template.owner);
      setTemplateTimestamp(data.template.timestamp);
      setTemplateDescription(data.template.description || "");
      setTemplateValues(data.template.values);
    }

    if (data?.workspace) {
      setWorkspaceName(data.workspace.name);
    }

    if (usageData?.templateUsage) {
      setTemplateUsage(usageData.templateUsage);
    }
  }, [loading, usageLoading]);

  useEffect(() => {
    if (error || usageError) {
      toaster.create({
        title: "Error",
        type: "error",
        description: "Unable to retrieve Template information",
        duration: 4000,
        closable: true,
      });
    }
  }, [error]);

  // Define the columns for Template usage
  const usageColumnHelper = createColumnHelper<AttributeUsage>();
  const usageColumns = [
    usageColumnHelper.accessor("entity", {
      cell: (info) => {
        const entityId = info.cell.getValue();
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Tooltip content={entityId} disabled={entityId.length < 20} showArrow>
              <Linky id={entityId} type={"entities"} size={"xs"} workspace={workspace} isPublic />
            </Tooltip>

            <Button
              size="2xs"
              mx={"1"}
              variant="subtle"
              colorPalette="gray"
              aria-label={"View Entity"}
              onClick={() => navigate(`/public/${workspace}/entities/${entityId}`)}
            >
              View
              <Icon name={"a_right"} size={"xs"} />
            </Button>
          </Flex>
        );
      },
      header: "Entity",
      meta: {
        minWidth: 300,
      },
    }),
    usageColumnHelper.accessor("modifications", {
      cell: (info) => {
        const modifications = info.cell.getValue();
        if (modifications.length > 0) {
          return (
            <Flex direction={"row"} gap={"1"} align={"center"}>
              {modifications.map((modification) => {
                return (
                  <Tag.Root colorPalette={"orange"}>
                    <Tag.Label fontSize={"xs"}>{_.capitalize(modification)}</Tag.Label>
                  </Tag.Root>
                );
              })}
            </Flex>
          );
        } else {
          return (
            <Tag.Root colorPalette={"green"}>
              <Tag.Label fontSize={"xs"}>None</Tag.Label>
            </Tag.Root>
          );
        }
      },
      header: "Modifications",
    }),
  ];

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
                  onClick={() => navigate(`/public/${workspace}/templates`)}
                  _hover={{
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  <Icon size={"xs"} name={"template"} color={STYLES.template.color.icon} />
                  Templates
                </Breadcrumb.Item>
                <Breadcrumb.Separator />
              </Breadcrumb.List>
            </Breadcrumb.Root>

            <Flex direction={"row"} gap={"2"} align={"center"} p={"0"} m={"0"}>
              <Flex
                id={"templateNameTag"}
                align={"center"}
                gap={"1"}
                p={"1"}
                border={"2px solid"}
                borderColor={templateArchived ? "gray.500" : STYLES.template.color.icon}
                bg={templateArchived ? STYLES.card.bg : STYLES.template.color.light}
                rounded={"md"}
              >
                <Icon
                  name={"template"}
                  size={"sm"}
                  color={templateArchived ? "gray.500" : STYLES.template.color.icon}
                />
                <Tooltip content={`${templateArchived ? "Archived: " : ""}${templateArchived}`} showArrow>
                  <Heading fontWeight={"semibold"} size={"sm"}>
                    {_.truncate(templateName, { length: 30 })}
                  </Heading>
                </Tooltip>
                {templateArchived && <Icon name={"archive"} size={"sm"} color={"text.subtle"} />}
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        <Flex direction={"column"} gap={"2"} pt={"0"} p={"1"}>
          {/* Template Overview and Description */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
            {/* Overview */}
            <Flex
              direction={"column"}
              p={"2"}
              h={"fit-content"}
              gap={"2"}
              rounded={"md"}
              grow={"1"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={"surface.card"}
              basis={{ base: "100%", md: "calc(50% - 4px)" }}
              minW={{ base: "100%", md: "calc(50% - 4px)" }}
            >
              <Flex direction={"row"} gap={"1"} align={"center"}>
                <Flex direction={"column"} gap={"1"} grow={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Name
                  </Text>
                  <Input
                    id={"attributeNameInput"}
                    size={"xs"}
                    value={templateName}
                    readOnly={true}
                    bg={"white"}
                    rounded={"md"}
                    border={STYLES.border.style}
                    borderColor={STYLES.border.color}
                  />
                </Flex>
              </Flex>

              <Flex gap={"2"} direction={"row"} wrap={"wrap"}>
                <Flex direction={"column"} gap={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Owner
                  </Text>
                  <ActorTag
                    identifier={templateOwner}
                    fallback={"No Owner"}
                    size={"sm"}
                    workspace={workspace}
                    isPublic
                  />
                </Flex>

                <Flex direction={"column"} gap={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Timestamp
                  </Text>
                  <TimestampTag timestamp={templateTimestamp} description={"Created"} />
                </Flex>

                <Flex direction={"column"} gap={"1"}>
                  <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                    Visibility
                  </Text>
                  <VisibilityTag isPublic={true} isInherited />
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
                id={"attributeDescriptionInput"}
                value={templateDescription}
                size={"xs"}
                h={"100%"}
                readOnly={true}
              />
            </Flex>
          </Flex>

          {/* Template Values and Usage */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
            {/* Values */}
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
              <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                Values ({templateValues.length})
              </Text>
              <Values
                key={"current"}
                viewOnly={true}
                values={templateValues}
                setValues={setTemplateValues}
                workspace={workspace}
                isPublic
              />
            </Flex>

            {/* Usage */}
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
              <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
                Usage ({templateUsage.length} {templateUsage.length !== 1 ? "Entities" : "Entity"})
              </Text>
              {templateUsage.length > 0 ? (
                <DataTable
                  data={templateUsage}
                  columns={usageColumns}
                  visibleColumns={{}}
                  selectedRows={{}}
                  viewOnly={true}
                  showSelection={true}
                  showPagination
                />
              ) : (
                <EmptyState.Root>
                  <EmptyState.Content>
                    <EmptyState.Indicator>
                      <Icon name={"template"} size={"lg"} color={STYLES.template.color.default} />
                    </EmptyState.Indicator>
                    <EmptyState.Description>No Usage</EmptyState.Description>
                  </EmptyState.Content>
                </EmptyState.Root>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Template;
