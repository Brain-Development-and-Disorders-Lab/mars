// React
import React from "react";

// Existing and custom components
import {
  Flex,
  IconButton,
  Image,
  Button,
  useDisclosure,
  Text,
  Menu,
  Spacer,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import ImportDialog from "@components/ImportDialog";
import ScanModal from "@components/ScanModal";
import SearchBox from "@components/SearchBox";
import WorkspaceSwitcher from "@components/WorkspaceSwitcher";

// Routing and navigation
import { useLocation, useNavigate } from "react-router-dom";

// Utility functions and libraries
import _ from "lodash";

// Events
import { usePostHog } from "posthog-js/react";

// Workspace context
import { useWorkspace } from "@hooks/useWorkspace";

const Navigation = () => {
  const posthog = usePostHog();
  const navigate = useNavigate();
  const location = useLocation();

  // Workspace context value
  const { workspace } = useWorkspace();

  const { open: importOpen, onOpen: onImportOpen } = useDisclosure();

  const {
    open: scanOpen,
    onOpen: onScanOpen,
    onClose: onScanClose,
  } = useDisclosure();

  return (
    <Flex w={"100%"} p={"2"} bg={"gray.100"}>
      {/* Desktop navigation group */}
      <Flex
        direction={"column"}
        display={{ base: "none", lg: "flex" }}
        gap={"4"}
        w={"100%"}
      >
        {/* Heading */}
        <Flex
          direction={"row"}
          gap={"2"}
          p={"1"}
          mt={"2"}
          align={"center"}
          justify={"center"}
        >
          <Image src="/Favicon.png" boxSize={"24px"} />
          <Text fontWeight={"semibold"} fontSize={"lg"} color={"brand"}>
            Metadatify
          </Text>
        </Flex>

        {/* Workspace menu items */}
        <Flex direction={"column"} align={"self-start"} gap={"6"}>
          <Flex direction={"column"} gap={"2"} w={"100%"}>
            <WorkspaceSwitcher id={"workspaceSwitcherDesktop"} />
            <SearchBox resultType={"entity"} />
          </Flex>

          <Flex direction={"column"} gap={"2"} width={"100%"}>
            <Text fontSize={"xs"} fontWeight={"bold"} color={"gray.600"}>
              Workspace
            </Text>

            <Button
              id={"navDashboardButtonDesktop"}
              key={"dashboard"}
              size={"sm"}
              w={"100%"}
              justifyContent={"left"}
              bg={_.isEqual(location.pathname, "/") ? "#ffffff" : "gray.100"}
              onClick={() => navigate("/")}
              disabled={workspace === "" || _.isUndefined(workspace)}
            >
              <Icon name={"dashboard"} />
              Dashboard
            </Button>

            <Button
              id={"navSearchButtonDesktop"}
              key={"search"}
              size={"sm"}
              w={"100%"}
              justifyContent={"left"}
              bg={
                _.includes(location.pathname, "/search")
                  ? "#ffffff"
                  : "gray.100"
              }
              onClick={() => navigate("/search")}
              disabled={workspace === "" || _.isUndefined(workspace)}
            >
              <Icon name={"search"} />
              Search
            </Button>

            <Button
              id={"navCreateButtonDesktop"}
              key={"create"}
              size={"sm"}
              w={"100%"}
              justifyContent={"left"}
              bg={
                _.includes(location.pathname, "/create")
                  ? "#ffffff"
                  : "gray.100"
              }
              onClick={() => navigate("/create")}
              disabled={workspace === "" || _.isUndefined(workspace)}
            >
              <Icon name={"add"} />
              Create
            </Button>

            <Text fontSize={"xs"} fontWeight={"bold"} color={"gray.600"}>
              View
            </Text>

            <Button
              id={"navEntitiesButtonDesktop"}
              size={"sm"}
              w={"100%"}
              justifyContent={"left"}
              bg={
                _.includes(location.pathname, "/entit") &&
                !_.includes(location.pathname, "/create")
                  ? "#ffffff"
                  : "gray.100"
              }
              onClick={() => navigate("/entities")}
              disabled={workspace === "" || _.isUndefined(workspace)}
            >
              <Icon name={"entity"} />
              <Flex w={"100%"} align={"center"} gap={"2"}>
                <Text>Entities</Text>
              </Flex>
            </Button>

            <Button
              id={"navProjectsButtonDesktop"}
              size={"sm"}
              w={"100%"}
              justifyContent={"left"}
              bg={
                _.includes(location.pathname, "/project") &&
                !_.includes(location.pathname, "/create")
                  ? "#ffffff"
                  : "gray.100"
              }
              onClick={() => navigate("/projects")}
              disabled={workspace === "" || _.isUndefined(workspace)}
            >
              <Icon name={"project"} />
              <Flex w={"100%"} align={"center"} gap={"2"}>
                <Text>Projects</Text>
              </Flex>
            </Button>

            <Button
              id={"navTemplatesButtonDesktop"}
              size={"sm"}
              w={"100%"}
              justifyContent={"left"}
              bg={
                _.includes(location.pathname, "/template") &&
                !_.includes(location.pathname, "/create")
                  ? "#ffffff"
                  : "gray.100"
              }
              onClick={() => navigate("/templates")}
              disabled={workspace === "" || _.isUndefined(workspace)}
            >
              <Icon name={"template"} />
              Templates
            </Button>
          </Flex>

          <Flex direction={"column"} gap={"2"} width={"100%"}>
            <Text fontSize={"xs"} fontWeight={"bold"} color={"gray.600"}>
              Tools
            </Text>
            <Flex direction={"row"} gap={"2"}>
              <Button
                id={"navImportButtonDesktop"}
                key={"import"}
                size={"sm"}
                w={"100%"}
                colorPalette={"blue"}
                onClick={() => {
                  // Capture event
                  posthog.capture("import_modal_open");

                  onImportOpen();
                }}
                disabled={workspace === "" || _.isUndefined(workspace)}
              >
                <Icon name={"upload"} />
                Import
              </Button>

              <Button
                id={"navScanButtonDesktop"}
                key={"scan"}
                size={"sm"}
                w={"100%"}
                colorPalette={"green"}
                onClick={() => {
                  // Capture event
                  posthog.capture("scan_modal_open");

                  onScanOpen();
                }}
                disabled={workspace === "" || _.isUndefined(workspace)}
              >
                <Icon name={"scan"} />
                Scan
              </Button>
            </Flex>
          </Flex>
        </Flex>

        <Spacer />

        {/* Version number */}
        <Flex direction={"row"} gap={"2"} align={"center"} justify={"center"}>
          <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.400"}>
            v{process.env.VERSION}
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
        bg={"gray.100"}
        justify={"space-between"}
        gap={"2"}
      >
        {/* Navigation items */}
        <Menu.Root>
          <Menu.Trigger asChild>
            <IconButton
              aria-label={"Open Menu"}
              display={{ base: "flex", lg: "none" }}
              size={"md"}
              bg={"white"}
            >
              <Icon name={"list"} />
            </IconButton>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.ItemGroup title={"Menu"}>
                <Menu.ItemGroupLabel>Menu</Menu.ItemGroupLabel>
                <Menu.Item
                  id={"navDashboardButtonMobile"}
                  value={"dashboard"}
                  onClick={() => navigate("/")}
                >
                  <Icon name={"dashboard"} />
                  Dashboard
                </Menu.Item>
                <Menu.Item
                  id={"navSearchButtonMobile"}
                  value={"search"}
                  onClick={() => navigate("/search")}
                >
                  <Icon name={"search"} />
                  Search
                </Menu.Item>
                <Menu.Item
                  id={"navProjectButtonMobile"}
                  value={"projects"}
                  onClick={() => navigate("/projects")}
                >
                  <Icon name={"project"} />
                  Projects
                </Menu.Item>
                <Menu.Item
                  id={"navEntitiesButtonMobile"}
                  value={"entities"}
                  onClick={() => navigate("/entities")}
                >
                  <Icon name={"entity"} />
                  Entities
                </Menu.Item>
                <Menu.Item
                  id={"navTemplatesButtonMobile"}
                  value={"templates"}
                  onClick={() => navigate("/templates")}
                >
                  <Icon name={"template"} />
                  Templates
                </Menu.Item>
              </Menu.ItemGroup>

              <Menu.ItemGroup title={"Tools"}>
                <Menu.ItemGroupLabel>Tools</Menu.ItemGroupLabel>
                <Menu.Item
                  id={"navCreateButtonMobile"}
                  value={"create"}
                  onClick={() => navigate("/create")}
                >
                  <Icon name={"add"} />
                  Create
                </Menu.Item>
                <Menu.Item
                  id={"navScanButtonMobile"}
                  value={"scan"}
                  onClick={() => {
                    // Capture event
                    posthog.capture("scan_modal_open");

                    onScanOpen();
                  }}
                  disabled={workspace === "" || _.isUndefined(workspace)}
                >
                  <Icon name={"scan"} />
                  Scan
                </Menu.Item>
              </Menu.ItemGroup>

              {/* Version number */}
              <Flex
                direction={"row"}
                gap={"2"}
                align={"center"}
                justify={"center"}
              >
                <Text
                  fontSize={"xs"}
                  fontWeight={"semibold"}
                  color={"gray.400"}
                >
                  v{process.env.VERSION}
                </Text>
              </Flex>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>

        {/* Workspace switcher */}
        <WorkspaceSwitcher id={"workspaceSwitcherMobile"} />
      </Flex>

      {/* `ImportDialog` component */}
      <ImportDialog open={importOpen} />

      {/* `ScanModal` component */}
      <ScanModal open={scanOpen} onOpen={onScanOpen} onClose={onScanClose} />
    </Flex>
  );
};

export default Navigation;
