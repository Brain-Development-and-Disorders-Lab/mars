// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Flex, Text } from "@chakra-ui/react";
import { Content } from "@components/Container";
import Values from "@components/Values";
import AttributeBreadcrumb from "@components/AttributeBreadcrumb";
import AttributeOverviewCard from "@components/AttributeOverviewCard";
import AttributeUsageTable from "@components/AttributeUsageTable";
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

export const Attribute = () => {
  const navigate = useNavigate();
  const { id: workspace, attribute } = useParams();
  const [workspaceName, setWorkspaceName] = useState("");

  const [attributeName, setAttributeName] = useState("");
  const [attributeDescription, setAttributeDescription] = useState("");
  const [attributeOwner, setAttributeOwner] = useState("");
  const [attributeTimestamp, setAttributeTimestamp] = useState("");
  const [attributeArchived, setAttributeArchived] = useState(false);
  const [attributeValues, setAttributeValues] = useState<IValue[]>([]);
  const [attributeUsage, setAttributeUsage] = useState<AttributeUsage[]>([]);

  // GraphQL operations
  const GET_ATTRIBUTE = gql`
    query GetAttribute($_id: String, $workspace: String) {
      attribute(_id: $_id) {
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
    attribute: AttributeModel;
    workspace: IGenericItem;
  }>(GET_ATTRIBUTE, {
    variables: {
      _id: attribute,
      workspace: workspace,
    },
    fetchPolicy: "no-cache",
    context: {
      uri: getPublicWorkspaceUrl(workspace ?? ""),
    },
  });

  const GET_ATTRIBUTE_USAGE = gql`
    query GetAttributeUsage($_id: String) {
      attributeUsage(_id: $_id) {
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
    attributeUsage: AttributeUsage[];
  }>(GET_ATTRIBUTE_USAGE, {
    variables: {
      _id: attribute,
    },
    fetchPolicy: "no-cache",
    context: {
      uri: getPublicWorkspaceUrl(workspace ?? ""),
    },
  });

  // Manage data once retrieved
  useEffect(() => {
    if (data?.attribute) {
      setAttributeName(data.attribute.name);
      setAttributeArchived(data.attribute.archived);
      setAttributeOwner(data.attribute.owner);
      setAttributeTimestamp(data.attribute.timestamp);
      setAttributeDescription(data.attribute.description || "");
      setAttributeValues(data.attribute.values);
    }

    if (data?.workspace) {
      setWorkspaceName(data.workspace.name);
    }

    if (usageData?.attributeUsage) {
      setAttributeUsage(usageData.attributeUsage);
    }
  }, [loading, usageLoading]);

  useEffect(() => {
    if (error || usageError) {
      toaster.create({
        title: "Error",
        type: "error",
        description: "Unable to retrieve Attribute information",
        duration: 4000,
        closable: true,
      });
    }
  }, [error]);

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading}>
      <Flex direction={"column"}>
        <Flex gap={"2"} p={"1"} direction={"row"} justify={"space-between"} align={"center"} wrap={"wrap"}>
          <AttributeBreadcrumb
            loading={loading}
            workspaceName={workspaceName}
            onNavigateHome={() => navigate(`/public/${workspace}`)}
            onNavigateAttributes={() => navigate(`/public/${workspace}/attributes`)}
            archived={attributeArchived}
            name={attributeName}
          />
        </Flex>

        <Flex direction={"column"} gap={"2"} pt={"0"} p={"1"}>
          {/* Attribute Overview and Description */}
          <AttributeOverviewCard
            name={attributeName}
            nameReadOnly
            owner={attributeOwner}
            timestamp={attributeTimestamp}
            visibilityIsPublic={true}
            description={attributeDescription}
            descriptionReadOnly
            workspace={workspace}
            isPublic
          />

          {/* Attribute Values and Usage */}
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
                Values ({attributeValues.length})
              </Text>
              <Values
                key={"current"}
                viewOnly={true}
                values={attributeValues}
                setValues={setAttributeValues}
                workspace={workspace}
                isPublic
              />
            </Flex>

            {/* Usage */}
            <AttributeUsageTable
              attributeUsage={attributeUsage}
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

export default Attribute;
