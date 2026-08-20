// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import { Flex, IconButton, Image, Button, Text, Menu, Spacer } from "@chakra-ui/react";
import Icon from "@components/Icon";
import ImportDialog from "@components/ImportDialog";
import ScanDialog from "@components/ScanDialog";
import ReportDialog from "@components/ReportDialog";
import Tooltip from "@components/Tooltip";
import WorkspaceSwitcher from "@components/WorkspaceSwitcher";

// Custom types
import { NavigationProps, WorkspaceModel } from "@types";

// Routing and navigation
import { useLocation, useNavigate } from "react-router-dom";

// Utility functions and libraries
import _ from "lodash";
import { useQuery } from "@apollo/client/react";

// Events
import { usePostHog } from "posthog-js/react";

// Hooks
import { useWorkspace } from "@hooks/useWorkspace";
import { usePermissions } from "@hooks/usePermissions";

// GraphQL
import { gql } from "@apollo/client";

// Variables
import { STYLES } from "@variables";

// Static assets
import favicon from "@img/Favicon.png";
import { getPublicWorkspaceUrl } from "@lib/util";

// Queries
const GET_WORKSPACE = gql`
  query GetWorkspace($workspace: String) {
    workspace(_id: $workspace) {
      _id
      name
    }
  }
`;

const Navigation = (props: NavigationProps) => {
  const posthog = usePostHog();
  const navigate = useNavigate();
  const location = useLocation();

  // Permissions
  const { globalPermissions } = usePermissions();

  // Workspace context value, overridden by the route param on unauthenticated public pages
  const { workspace: activeWorkspace } = useWorkspace();
  const workspace = props.isPublic ? props.workspace : activeWorkspace;

  // Display state
  const [workspaceName, setWorkspaceName] = useState<string>("");

  // Dialog open states
  const [importOpen, setImportOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Shared styling for the primary sidebar links
  const navLinkStyle = (isActive: boolean) => ({
    bg: isActive ? "nav.hoverBg" : "transparent",
    color: "nav.text",
    fontWeight: isActive ? "bold" : "medium",
    borderLeft: isActive ? "8px solid" : "none",
    borderLeftColor: isActive ? "white" : "transparent",
    _hover: { bg: "nav.hoverBg" },
  });

  // Execute GraphQL query both on page load and navigation
  const { data } = useQuery<{
    workspace: WorkspaceModel;
  }>(GET_WORKSPACE, {
    variables: {
      workspace: workspace,
    },
    // Send this query to the public Workspace endpoint
    context: {
      uri: getPublicWorkspaceUrl(workspace ?? ""),
    },
    fetchPolicy: "network-only",
    skip: !workspace,
  });

  // Assign data
  useEffect(() => {
    if (data?.workspace) {
      setWorkspaceName(data.workspace.name);
    }
  }, [data]);

  return (
    <Flex w={"100%"} p={"2"} bg={"nav.bg"}>
      {/* Desktop navigation group */}
      <Flex direction={"column"} display={{ base: "none", lg: "flex" }} gap={"2"} w={"100%"}>
        {/* Heading */}
        <Flex direction={"row"} gap={"1"} p={"1"} align={"center"} justify={"center"}>
          <Image src={favicon} boxSize={"32px"} />
          <Text fontWeight={"semibold"} fontSize={"lg"} color={"nav.text"}>
            Metadatify
          </Text>
        </Flex>

        {props.isPublic && (
          <Flex direction={"column"} gap={"2"}>
            <Flex
              direction={"column"}
              rounded={"md"}
              p={"2"}
              gap={"1.5"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={STYLES.card.bg}
            >
              <Flex direction={"row"} gap={"1"} align={"center"} justify={"center"}>
                <Icon name={"workspace"} size={"xs"} />
                <Text fontSize={"xs"} fontWeight={"semibold"} textAlign={"center"}>
                  Public Workspace
                </Text>
              </Flex>
              <Tooltip content={workspaceName} disabled={workspaceName.length <= 24} showArrow>
                <Text fontSize={"xs"} textAlign={"center"}>
                  {_.truncate(workspaceName, { length: 24 })}
                </Text>
              </Tooltip>
            </Flex>
            <Button
              id={"navLoginButtonDesktop"}
              w={"100%"}
              key={"login"}
              size={"xs"}
              rounded={"md"}
              colorPalette={"green"}
              onClick={() => navigate("/login")}
            >
              Login or Sign Up
              <Icon name={"person"} size={"xs"} />
            </Button>
          </Flex>
        )}

        {/* Workspace menu items */}
        <Flex direction={"column"} gap={"4"} w={"100%"}>
          {!props.isPublic && (
            <Flex direction={"column"} gap={"1"} w={"100%"}>
              <WorkspaceSwitcher id={"workspaceSwitcherDesktop"} />
            </Flex>
          )}

          <Flex direction={"column"} gap={"2"} width={"100%"}>
            <Text fontSize={"xs"} fontWeight={"bold"} color={"nav.textMuted"}>
              Workspace
            </Text>

            <Button
              id={"navDashboardButtonDesktop"}
              key={"dashboard"}
              size={"xs"}
              w={"100%"}
              rounded={"md"}
              justifyContent={"left"}
              {...navLinkStyle(_.isEqual(location.pathname, "/"))}
              onClick={() => {
                if (props.isPublic) {
                  navigate(`/public/${workspace}`);
                } else {
                  navigate("/");
                }
              }}
              disabled={workspace === "" || _.isUndefined(workspace)}
            >
              <Icon name={"dashboard"} size={"xs"} />
              Dashboard
            </Button>

            {!props.isPublic && (
              <Button
                id={"navActivityButtonDesktop"}
                key={"activity"}
                size={"xs"}
                w={"100%"}
                rounded={"md"}
                justifyContent={"left"}
                {...navLinkStyle(_.includes(location.pathname, "/activity"))}
                onClick={() => navigate("/activity")}
                disabled={workspace === "" || _.isUndefined(workspace)}
              >
                <Icon name={"activity"} size={"xs"} />
                Activity
              </Button>
            )}

            <Button
              id={"navSearchButtonDesktop"}
              key={"search"}
              size={"xs"}
              w={"100%"}
              rounded={"md"}
              justifyContent={"left"}
              {...navLinkStyle(_.includes(location.pathname, "/search"))}
              onClick={() => {
                if (props.isPublic) {
                  navigate(`/public/${workspace}/search`);
                } else {
                  navigate("/search");
                }
              }}
              disabled={workspace === "" || _.isUndefined(workspace)}
            >
              <Icon name={"search"} size={"xs"} />
              Search
            </Button>

            {!props.isPublic && (
              <Button
                id={"navCreateButtonDesktop"}
                key={"create"}
                size={"xs"}
                w={"100%"}
                rounded={"md"}
                justifyContent={"left"}
                {...navLinkStyle(_.includes(location.pathname, "/create"))}
                onClick={() => navigate("/create")}
                disabled={workspace === "" || _.isUndefined(workspace)}
              >
                <Icon name={"add"} size={"xs"} />
                Create
              </Button>
            )}

            <Text fontSize={"xs"} fontWeight={"bold"} color={"nav.textMuted"}>
              View
            </Text>

            <Button
              id={"navEntitiesButtonDesktop"}
              size={"xs"}
              w={"100%"}
              rounded={"md"}
              justifyContent={"left"}
              {...navLinkStyle(_.includes(location.pathname, "/entit") && !_.includes(location.pathname, "/create"))}
              onClick={() => {
                if (props.isPublic) {
                  navigate(`/public/${workspace}/entities`);
                } else {
                  navigate("/entities");
                }
              }}
              disabled={workspace === "" || _.isUndefined(workspace)}
            >
              <Icon name={"entity"} size={"xs"} color={STYLES.entity.color.icon} />
              <Flex w={"100%"} align={"center"} gap={"2"}>
                <Text>Entities</Text>
              </Flex>
            </Button>

            <Button
              id={"navProjectsButtonDesktop"}
              size={"xs"}
              w={"100%"}
              rounded={"md"}
              justifyContent={"left"}
              {...navLinkStyle(_.includes(location.pathname, "/project") && !_.includes(location.pathname, "/create"))}
              onClick={() => {
                if (props.isPublic) {
                  navigate(`/public/${workspace}/projects`);
                } else {
                  navigate("/projects");
                }
              }}
              disabled={workspace === "" || _.isUndefined(workspace)}
            >
              <Icon name={"project"} size={"xs"} color={STYLES.project.color.icon} />
              <Flex w={"100%"} align={"center"} gap={"2"}>
                <Text>Projects</Text>
              </Flex>
            </Button>

            <Button
              id={"navTemplatesButtonDesktop"}
              size={"xs"}
              w={"100%"}
              rounded={"md"}
              justifyContent={"left"}
              {...navLinkStyle(_.includes(location.pathname, "/template") && !_.includes(location.pathname, "/create"))}
              onClick={() => {
                if (props.isPublic) {
                  navigate(`/public/${workspace}/templates`);
                } else {
                  navigate("/templates");
                }
              }}
              disabled={workspace === "" || _.isUndefined(workspace)}
            >
              <Icon name={"template"} size={"xs"} color={STYLES.template.color.icon} />
              Templates
            </Button>
          </Flex>

          {!props.isPublic && (
            <Flex direction={"column"} gap={"2"}>
              <Text fontSize={"xs"} fontWeight={"bold"} color={"nav.textMuted"}>
                Tools
              </Text>
              <Flex direction={"row"} gap={"2"} w={"100%"}>
                <Flex w={"50%"}>
                  <Tooltip disabled={globalPermissions.features.import} content={"Import is unavailable"} showArrow>
                    <Button
                      id={"navImportButtonDesktop"}
                      w={"100%"}
                      key={"import"}
                      size={"xs"}
                      rounded={"md"}
                      colorPalette={"blue"}
                      onClick={() => {
                        // Capture event
                        posthog.capture("client.import.dialog_open");

                        setImportOpen(true);
                      }}
                      disabled={workspace === "" || _.isUndefined(workspace) || !globalPermissions.features.import}
                    >
                      <Icon name={"upload"} size={"xs"} />
                      Import
                    </Button>
                  </Tooltip>
                </Flex>

                <Flex w={"50%"}>
                  <Tooltip disabled={globalPermissions.features.scan} content={"Scan is unavailable"} showArrow>
                    <Button
                      id={"navScanButtonDesktop"}
                      w={"100%"}
                      key={"scan"}
                      size={"xs"}
                      rounded={"md"}
                      colorPalette={"green"}
                      onClick={() => {
                        // Capture event
                        posthog.capture("client.scan.dialog_open");

                        setScanOpen(true);
                      }}
                      disabled={workspace === "" || _.isUndefined(workspace) || !globalPermissions.features.scan}
                    >
                      <Icon name={"scan"} size={"xs"} />
                      Scan
                    </Button>
                  </Tooltip>
                </Flex>
              </Flex>
              <Flex>
                <Button
                  id={"navBugButtonDesktop"}
                  w={"100%"}
                  key={"bug"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"red"}
                  onClick={() => {
                    // Capture event
                    posthog.capture("client.bug.dialog_open");

                    setReportOpen(true);
                  }}
                >
                  <Icon name={"bug"} size={"xs"} />
                  Report Issue
                </Button>
              </Flex>
            </Flex>
          )}
        </Flex>

        <Spacer />

        {/* Version number */}
        <Flex direction={"row"} gap={"2"} align={"center"} justify={"center"}>
          <Text fontSize={"xs"} fontWeight={"semibold"} color={"nav.textMuted"}>
            v{import.meta.env.VITE_VERSION}
          </Text>
        </Flex>
      </Flex>

      {/* Mobile navigation group */}
      <Flex
        display={{ base: "flex", lg: "none" }}
        direction={"row"}
        align={"center"}
        h={"100%"}
        w={"100%"}
        bg={"nav.bg"}
        justify={"space-between"}
        gap={"1"}
      >
        {/* Navigation items */}
        <Menu.Root>
          <Menu.Trigger asChild>
            <IconButton
              aria-label={"Open Menu"}
              display={{ base: "flex", lg: "none" }}
              size={"xs"}
              bg={"transparent"}
              color={"nav.text"}
              border={"1px solid"}
              borderColor={"nav.textMuted"}
              _hover={{ bg: "nav.hoverBg" }}
            >
              <Icon name={"list"} size={"xs"} color={"nav.text"} />
            </IconButton>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content p={"1"}>
              <Menu.ItemGroup title={"Workspace"}>
                <Menu.ItemGroupLabel>Workspace</Menu.ItemGroupLabel>
                <Menu.Item
                  id={"navDashboardButtonMobile"}
                  value={"dashboard"}
                  fontSize={"xs"}
                  onClick={() => {
                    if (props.isPublic) {
                      navigate(`/public/${workspace}`);
                    } else {
                      navigate("/");
                    }
                  }}
                >
                  <Icon name={"dashboard"} size={"xs"} />
                  Dashboard
                </Menu.Item>
                {!props.isPublic && (
                  <Menu.Item
                    id={"navActivityButtonMobile"}
                    value={"activity"}
                    fontSize={"xs"}
                    onClick={() => navigate("/activity")}
                  >
                    <Icon name={"activity"} size={"xs"} />
                    Activity
                  </Menu.Item>
                )}
                <Menu.Item
                  id={"navSearchButtonMobile"}
                  value={"search"}
                  fontSize={"xs"}
                  onClick={() => {
                    if (props.isPublic) {
                      navigate(`/public/${workspace}/search`);
                    } else {
                      navigate("/search");
                    }
                  }}
                >
                  <Icon name={"search"} size={"xs"} />
                  Search
                </Menu.Item>
              </Menu.ItemGroup>

              <Menu.ItemGroup title={"View"}>
                <Menu.ItemGroupLabel>View</Menu.ItemGroupLabel>
                <Menu.Item
                  id={"navEntitiesButtonMobile"}
                  value={"entities"}
                  fontSize={"xs"}
                  onClick={() => {
                    if (props.isPublic) {
                      navigate(`/public/${workspace}/entities`);
                    } else {
                      navigate("/entities");
                    }
                  }}
                >
                  <Icon name={"entity"} size={"xs"} color={STYLES.entity.color.icon} />
                  Entities
                </Menu.Item>
                <Menu.Item
                  id={"navProjectButtonMobile"}
                  value={"projects"}
                  fontSize={"xs"}
                  onClick={() => {
                    if (props.isPublic) {
                      navigate(`/public/${workspace}/projects`);
                    } else {
                      navigate("/projects");
                    }
                  }}
                >
                  <Icon name={"project"} size={"xs"} color={STYLES.project.color.icon} />
                  Projects
                </Menu.Item>
                <Menu.Item
                  id={"navTemplatesButtonMobile"}
                  value={"templates"}
                  fontSize={"xs"}
                  onClick={() => {
                    if (props.isPublic) {
                      navigate(`/public/${workspace}/templates`);
                    } else {
                      navigate("/templates");
                    }
                  }}
                >
                  <Icon name={"template"} size={"xs"} color={STYLES.template.color.icon} />
                  Templates
                </Menu.Item>
              </Menu.ItemGroup>

              {!props.isPublic && (
                <Menu.ItemGroup title={"Tools"}>
                  <Menu.ItemGroupLabel>Tools</Menu.ItemGroupLabel>
                  <Menu.Item
                    id={"navCreateButtonMobile"}
                    value={"create"}
                    fontSize={"xs"}
                    onClick={() => navigate("/create")}
                  >
                    <Icon name={"add"} size={"xs"} />
                    Create
                  </Menu.Item>
                  <Menu.Item
                    id={"navScanButtonMobile"}
                    value={"scan"}
                    fontSize={"xs"}
                    onClick={() => {
                      // Capture event
                      posthog.capture("client.scan.dialog_open");

                      setScanOpen(true);
                    }}
                    disabled={workspace === "" || _.isUndefined(workspace)}
                  >
                    <Icon name={"scan"} size={"xs"} />
                    Scan
                  </Menu.Item>
                </Menu.ItemGroup>
              )}

              {/* Version number */}
              <Flex direction={"row"} gap={"2"} align={"center"} justify={"center"}>
                <Text fontSize={"xs"} fontWeight={"semibold"} color={"text.faint"}>
                  v{import.meta.env.VITE_VERSION}
                </Text>
              </Flex>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>

        {/* Workspace switcher */}
        {!props.isPublic && <WorkspaceSwitcher id={"workspaceSwitcherMobile"} />}
      </Flex>

      {/* `ImportDialog` component */}
      <ImportDialog open={importOpen} setOpen={setImportOpen} />

      {/* `ScanDialog` component */}
      <ScanDialog open={scanOpen} setOpen={setScanOpen} />

      {/* `ReportDialog` component */}
      <ReportDialog open={reportOpen} setOpen={setReportOpen} />
    </Flex>
  );
};

export default Navigation;
