// React
import React, { useState } from "react";

// Existing and custom components
import {
  Flex,
  IconButton,
  Image,
  Button,
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

  // Modal open states
  const [importOpen, setImportOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  return (
    <Flex w={"100%"} p={"2"} bg={"gray.100"}>
      {/* Desktop navigation group */}
      <Flex
        direction={"column"}
        display={{ base: "none", lg: "flex" }}
        gap={"2"}
        w={"100%"}
      >
        {/* Heading */}
        <Flex
          direction={"row"}
          gap={"2"}
          p={"1"}
          align={"center"}
          justify={"center"}
        >
          <Image src="/Favicon.png" boxSize={"20px"} />
          <Text fontWeight={"semibold"} fontSize={"lg"} color={"brand"}>
            Metadatify
          </Text>
        </Flex>

        {/* Workspace menu items */}
        <Flex direction={"column"} gap={"4"} w={"100%"}>
          <Flex direction={"column"} gap={"1"} w={"100%"}>
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
              size={"xs"}
              w={"100%"}
              rounded={"md"}
              justifyContent={"left"}
              bg={_.isEqual(location.pathname, "/") ? "#ffffff" : "gray.100"}
              _hover={{ bg: "gray.200" }}
              color={"black"}
              onClick={() => navigate("/")}
              disabled={workspace === "" || _.isUndefined(workspace)}
            >
              <Icon name={"dashboard"} size={"xs"} />
              Dashboard
            </Button>

            <Button
              id={"navSearchButtonDesktop"}
              key={"search"}
              size={"xs"}
              w={"100%"}
              rounded={"md"}
              justifyContent={"left"}
              bg={
                _.includes(location.pathname, "/search")
                  ? "#ffffff"
                  : "gray.100"
              }
              _hover={{ bg: "gray.200" }}
              color={"black"}
              onClick={() => navigate("/search")}
              disabled={workspace === "" || _.isUndefined(workspace)}
            >
              <Icon name={"search"} size={"xs"} />
              Search
            </Button>

            <Button
              id={"navCreateButtonDesktop"}
              key={"create"}
              size={"xs"}
              w={"100%"}
              rounded={"md"}
              justifyContent={"left"}
              bg={
                _.includes(location.pathname, "/create")
                  ? "#ffffff"
                  : "gray.100"
              }
              _hover={{ bg: "gray.200" }}
              color={"black"}
              onClick={() => navigate("/create")}
              disabled={workspace === "" || _.isUndefined(workspace)}
            >
              <Icon name={"add"} size={"xs"} />
              Create
            </Button>

            <Text fontSize={"xs"} fontWeight={"bold"} color={"gray.600"}>
              View
            </Text>

            <Button
              id={"navEntitiesButtonDesktop"}
              size={"xs"}
              w={"100%"}
              rounded={"md"}
              justifyContent={"left"}
              bg={
                _.includes(location.pathname, "/entit") &&
                !_.includes(location.pathname, "/create")
                  ? "#ffffff"
                  : "gray.100"
              }
              _hover={{ bg: "gray.200" }}
              color={"black"}
              onClick={() => navigate("/entities")}
              disabled={workspace === "" || _.isUndefined(workspace)}
            >
              <Icon name={"entity"} size={"xs"} />
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
              bg={
                _.includes(location.pathname, "/project") &&
                !_.includes(location.pathname, "/create")
                  ? "#ffffff"
                  : "gray.100"
              }
              _hover={{ bg: "gray.200" }}
              color={"black"}
              onClick={() => navigate("/projects")}
              disabled={workspace === "" || _.isUndefined(workspace)}
            >
              <Icon name={"project"} size={"xs"} />
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
              bg={
                _.includes(location.pathname, "/template") &&
                !_.includes(location.pathname, "/create")
                  ? "#ffffff"
                  : "gray.100"
              }
              _hover={{ bg: "gray.200" }}
              color={"black"}
              onClick={() => navigate("/templates")}
              disabled={workspace === "" || _.isUndefined(workspace)}
            >
              <Icon name={"template"} size={"xs"} />
              Templates
            </Button>
          </Flex>

          <Flex direction={"column"} gap={"2"}>
            <Text fontSize={"xs"} fontWeight={"bold"} color={"gray.600"}>
              Tools
            </Text>
            <Flex direction={"row"} gap={"2"} w={"100%"}>
              <Flex w={"50%"}>
                <Button
                  id={"navImportButtonDesktop"}
                  w={"100%"}
                  key={"import"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"blue"}
                  onClick={() => {
                    // Capture event
                    posthog.capture("import_modal_open");

                    setImportOpen(true);
                  }}
                  disabled={workspace === "" || _.isUndefined(workspace)}
                >
                  <Icon name={"upload"} size={"xs"} />
                  Import
                </Button>
              </Flex>

              <Flex w={"50%"}>
                <Button
                  id={"navScanButtonDesktop"}
                  w={"100%"}
                  key={"scan"}
                  size={"xs"}
                  rounded={"md"}
                  colorPalette={"green"}
                  onClick={() => {
                    // Capture event
                    posthog.capture("scan_modal_open");

                    setScanOpen(true);
                  }}
                  disabled={workspace === "" || _.isUndefined(workspace)}
                >
                  <Icon name={"scan"} size={"xs"} />
                  Scan
                </Button>
              </Flex>
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
        gap={"1"}
      >
        {/* Navigation items */}
        <Menu.Root>
          <Menu.Trigger asChild>
            <IconButton
              aria-label={"Open Menu"}
              display={{ base: "flex", lg: "none" }}
              size={"xs"}
              bg={"white"}
              color={"gray.500"}
            >
              <Icon name={"list"} size={"xs"} />
            </IconButton>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content p={"1"}>
              <Menu.ItemGroup title={"Menu"}>
                <Menu.ItemGroupLabel>Menu</Menu.ItemGroupLabel>
                <Menu.Item
                  id={"navDashboardButtonMobile"}
                  value={"dashboard"}
                  fontSize={"xs"}
                  onClick={() => navigate("/")}
                >
                  <Icon name={"dashboard"} size={"xs"} />
                  Dashboard
                </Menu.Item>
                <Menu.Item
                  id={"navSearchButtonMobile"}
                  value={"search"}
                  fontSize={"xs"}
                  onClick={() => navigate("/search")}
                >
                  <Icon name={"search"} size={"xs"} />
                  Search
                </Menu.Item>
                <Menu.Item
                  id={"navProjectButtonMobile"}
                  value={"projects"}
                  fontSize={"xs"}
                  onClick={() => navigate("/projects")}
                >
                  <Icon name={"project"} size={"xs"} />
                  Projects
                </Menu.Item>
                <Menu.Item
                  id={"navEntitiesButtonMobile"}
                  value={"entities"}
                  fontSize={"xs"}
                  onClick={() => navigate("/entities")}
                >
                  <Icon name={"entity"} size={"xs"} />
                  Entities
                </Menu.Item>
                <Menu.Item
                  id={"navTemplatesButtonMobile"}
                  value={"templates"}
                  fontSize={"xs"}
                  onClick={() => navigate("/templates")}
                >
                  <Icon name={"template"} size={"xs"} />
                  Templates
                </Menu.Item>
              </Menu.ItemGroup>

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
                    posthog.capture("scan_modal_open");

                    setScanOpen(true);
                  }}
                  disabled={workspace === "" || _.isUndefined(workspace)}
                >
                  <Icon name={"scan"} size={"xs"} />
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
      <ImportDialog open={importOpen} setOpen={setImportOpen} />

      {/* `ScanModal` component */}
      <ScanModal open={scanOpen} setOpen={setScanOpen} />
    </Flex>
  );
};

export default Navigation;
