// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Flex, Text } from "@chakra-ui/react";
import { Content } from "@components/Container";
import Values from "@components/Values";
import TemplateBreadcrumb from "@components/TemplateBreadcrumb";
import TemplateOverviewCard from "@components/TemplateOverviewCard";
import TemplateUsageTable from "@components/TemplateUsageTable";
import { toaster } from "@components/Toast";

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

// Variables
import { STYLES } from "@variables";

export const Template = () => {
  const navigate = useNavigate();
  const { id: workspace, template } = useParams();
  const [workspaceName, setWorkspaceName] = useState("");

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

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading}>
      <Flex direction={"column"}>
        <Flex gap={"2"} p={"1"} direction={"row"} justify={"space-between"} align={"center"} wrap={"wrap"}>
          <TemplateBreadcrumb
            loading={loading}
            workspaceName={workspaceName}
            onNavigateHome={() => navigate(`/public/${workspace}`)}
            onNavigateTemplates={() => navigate(`/public/${workspace}/templates`)}
            archived={templateArchived}
            name={templateName}
          />
        </Flex>

        <Flex direction={"column"} gap={"2"} pt={"0"} p={"1"}>
          {/* Template Overview and Description */}
          <TemplateOverviewCard
            name={templateName}
            nameReadOnly
            owner={templateOwner}
            timestamp={templateTimestamp}
            visibilityIsPublic={true}
            description={templateDescription}
            descriptionReadOnly
            workspace={workspace}
            isPublic
          />

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
            <TemplateUsageTable
              templateUsage={templateUsage}
              onViewEntity={(entityId) => navigate(`/public/${workspace}/entities/${entityId}`)}
              workspace={workspace}
              isPublic
            />
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Template;
