// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Flex, Text, createListCollection, ListCollection } from "@chakra-ui/react";
import { Content } from "@components/Container";
import EntityBreadcrumb from "@components/EntityBreadcrumb";
import EntityOverviewCard from "@components/EntityOverviewCard";
import EntityAttributesTable from "@components/EntityAttributesTable";
import EntityProjectsTable from "@components/EntityProjectsTable";
import EntityAttachmentsTable from "@components/EntityAttachmentsTable";
import Icon from "@components/Icon";
import Relationships from "@components/Relationships";
import { toaster } from "@components/Toast";

// Existing and custom types
import { AttributeModel, EntityModel, IdentifierFormatModel, IGenericItem, IRelationship } from "@types";

// Utility functions and libraries
import { requestStatic } from "@database/functions";
import { getPublicWorkspaceUrl } from "@lib/util";
import _ from "lodash";
import FileSaver from "file-saver";
import slugify from "slugify";

// Apollo client imports
import { gql } from "@apollo/client";
import { useQuery, useLazyQuery } from "@apollo/client/react";

// Routing and navigation
import { useParams, useNavigate } from "react-router-dom";

// Variables
import { BASE_IDENTIFIER_FORMATS, STYLES } from "@variables";

// Events
import { usePostHog } from "posthog-js/react";

export const Entity = () => {
  const { id: workspace, entity } = useParams();
  const posthog = usePostHog();

  // Navigation and routing
  const navigate = useNavigate();

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

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading}>
      <Flex direction={"column"}>
        <Flex gap={"2"} p={"1"} direction={"row"} justify={"space-between"} align={"center"} wrap={"wrap"}>
          <EntityBreadcrumb
            loading={loading}
            workspaceName={workspaceName}
            onNavigateHome={() => navigate(`/public/${workspace}`)}
            onNavigateEntities={() => navigate(`/public/${workspace}/entities`)}
            archived={entityArchived}
            name={entityName}
          />
        </Flex>

        <Flex direction={"column"} gap={"2"} pt={"0"} p={"1"}>
          {/* Entity Overview and Description */}
          <EntityOverviewCard
            name={entityName}
            nameReadOnly
            showSecondaryIdentifier={showSecondaryIdentifier}
            showSecondaryIdentifierDisabled
            secondaryIdentifierValue={secondaryIdentifier}
            secondaryIdentifierReadOnly
            secondaryIdentifierDisabled
            identifierFormat={identifierFormat}
            identifierFormatDisabled
            identifierFormats={identifierFormats}
            customIdentifierFormats={customIdentifierFormats}
            showValidationErrors={false}
            owner={entityOwner}
            created={entityCreated}
            visibilityIsPublic={true}
            description={entityDescription}
            descriptionReadOnly
            workspace={workspace}
            isPublic
          />

          {/* Attributes and Projects */}
          <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
            <EntityAttributesTable
              attributes={entityAttributes}
              editing={false}
              entityName={entityName}
              templates={templates}
              onUpdate={() => {}}
              workspace={workspace}
              isPublic
            />

            <EntityProjectsTable
              projects={entityProjects}
              editing={false}
              workspace={workspace}
              isPublic
              onView={(projectId) => navigate(`/public/${workspace}/projects/${projectId}`)}
            />
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

            <EntityAttachmentsTable
              attachments={entityAttachments}
              editing={false}
              workspace={workspace}
              isPublic
              onDownload={getDownload}
            />
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Entity;
