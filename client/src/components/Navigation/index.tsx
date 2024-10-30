// React
import React from "react";

// Existing and custom components
import {
  Flex,
  IconButton,
  Image,
  Button,
  useDisclosure,
  Heading,
  Text,
  MenuButton,
  Menu,
  MenuList,
  MenuItem,
  MenuGroup,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import ImportModal from "@components/ImportModal";
import ScanModal from "@components/ScanModal";
import SearchBox from "@components/SearchBox";
import WorkspaceSwitcher from "@components/WorkspaceSwitcher";

// Routing and navigation
import { useLocation, useNavigate } from "react-router-dom";

// Utility functions and libraries
import _ from "lodash";

// Workspace context
import { useWorkspace } from "@hooks/useWorkspace";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Workspace context value
  const { workspace } = useWorkspace();

  const {
    isOpen: isImportOpen,
    onOpen: onImportOpen,
    onClose: onImportClose,
  } = useDisclosure();

  const {
    isOpen: isScanOpen,
    onOpen: onScanOpen,
    onClose: onScanClose,
  } = useDisclosure();

  return (
    <Flex w={"100%"} p={"2"} bg={"#f2f2f2"}>
      {/* Main navigation group */}
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
          <Heading fontWeight={"semibold"} size={"sm"}>
            Metadatify
          </Heading>
        </Flex>

        {/* Workspace menu items */}
        <Flex direction={"column"} align={"self-start"} gap={"6"}>
          <Flex direction={"column"} gap={"2"} w={"100%"}>
            <WorkspaceSwitcher />
            <SearchBox resultType={"entity"} />
          </Flex>

          <Flex direction={"column"} gap={"2"} width={"100%"}>
            <Text fontSize={"xs"} fontWeight={"bold"} color={"gray.600"}>
              Workspace
            </Text>

            <Button
              id={"navDashboardButton"}
              key={"dashboard"}
              size={"sm"}
              w={"100%"}
              justifyContent={"left"}
              bg={_.isEqual(location.pathname, "/") ? "#ffffff" : "#f2f2f2"}
              leftIcon={<Icon name={"dashboard"} />}
              onClick={() => navigate("/")}
              isDisabled={workspace === "" || _.isUndefined(workspace)}
            >
              Dashboard
            </Button>

            <Button
              id={"navSearchButton"}
              key={"search"}
              size={"sm"}
              w={"100%"}
              justifyContent={"left"}
              bg={
                _.includes(location.pathname, "/search") ? "#ffffff" : "#f2f2f2"
              }
              leftIcon={<Icon name={"search"} />}
              onClick={() => navigate("/search")}
              isDisabled={workspace === "" || _.isUndefined(workspace)}
            >
              Search
            </Button>

            <Button
              id={"navCreateButton"}
              key={"create"}
              size={"sm"}
              w={"100%"}
              justifyContent={"left"}
              bg={
                _.includes(location.pathname, "/search") ? "#ffffff" : "#f2f2f2"
              }
              leftIcon={<Icon name={"add"} />}
              onClick={() => navigate("/create")}
              isDisabled={workspace === "" || _.isUndefined(workspace)}
            >
              Create
            </Button>

            <Text fontSize={"xs"} fontWeight={"bold"} color={"gray.600"}>
              View
            </Text>

            <Button
              id={"navEntitiesButton"}
              leftIcon={<Icon name={"entity"} />}
              size={"sm"}
              w={"100%"}
              justifyContent={"left"}
              bg={
                _.includes(location.pathname, "/entit") &&
                !_.includes(location.pathname, "/create")
                  ? "#ffffff"
                  : "#f2f2f2"
              }
              onClick={() => navigate("/entities")}
              isDisabled={workspace === "" || _.isUndefined(workspace)}
            >
              <Flex w={"100%"} align={"center"} gap={"2"}>
                <Text>Entities</Text>
              </Flex>
            </Button>

            <Button
              id={"navProjectsButton"}
              leftIcon={<Icon name={"project"} />}
              size={"sm"}
              w={"100%"}
              justifyContent={"left"}
              bg={
                _.includes(location.pathname, "/project") &&
                !_.includes(location.pathname, "/create")
                  ? "#ffffff"
                  : "#f2f2f2"
              }
              onClick={() => navigate("/projects")}
              isDisabled={workspace === "" || _.isUndefined(workspace)}
            >
              <Flex w={"100%"} align={"center"} gap={"2"}>
                <Text>Projects</Text>
              </Flex>
            </Button>

            <Button
              id={"navTemplatesButton"}
              leftIcon={<Icon name={"attribute"} />}
              size={"sm"}
              w={"100%"}
              justifyContent={"left"}
              bg={
                _.includes(location.pathname, "/attribute") &&
                !_.includes(location.pathname, "/create")
                  ? "#ffffff"
                  : "#f2f2f2"
              }
              onClick={() => navigate("/attributes")}
              isDisabled={workspace === "" || _.isUndefined(workspace)}
            >
              Templates
            </Button>
          </Flex>

          <Flex direction={"column"} gap={"2"} width={"100%"}>
            <Text fontSize={"xs"} fontWeight={"bold"} color={"gray.600"}>
              Tools
            </Text>
            <Flex direction={"row"} gap={"2"}>
              <Button
                id={"navImportButton"}
                key={"import"}
                size={"sm"}
                w={"100%"}
                colorScheme={"blue"}
                leftIcon={<Icon name={"upload"} />}
                onClick={() => onImportOpen()}
                isDisabled={workspace === "" || _.isUndefined(workspace)}
              >
                Import
              </Button>

              <Button
                id={"navScanButton"}
                key={"scan"}
                size={"sm"}
                w={"100%"}
                colorScheme={"green"}
                leftIcon={<Icon name={"scan"} />}
                onClick={() => onScanOpen()}
                isDisabled={workspace === "" || _.isUndefined(workspace)}
              >
                Scan
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Flex>

      {/* Icon to show menu in responsive context */}
      <Flex
        display={{ lg: "none" }}
        justify={"left"}
        alignContent={"center"}
        h={"5vh"}
        w={"100%"}
        bg={"#f2f2f2"}
      >
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label={"Open Menu"}
            display={{ base: "flex", lg: "none" }}
            size={"sm"}
            justifyContent={"center"}
            icon={<Icon name={"list"} />}
          />
          <MenuList>
            <MenuGroup title={"Menu"}>
              <MenuItem
                icon={<Icon name={"dashboard"} />}
                onClick={() => navigate("/")}
              >
                Dashboard
              </MenuItem>
              <MenuItem
                icon={<Icon name={"search"} />}
                onClick={() => navigate("/search")}
              >
                Search
              </MenuItem>
              <MenuItem
                icon={<Icon name={"project"} />}
                onClick={() => navigate("/projects")}
              >
                Projects
              </MenuItem>
              <MenuItem
                icon={<Icon name={"entity"} />}
                onClick={() => navigate("/entities")}
              >
                Entities
              </MenuItem>
              <MenuItem
                icon={<Icon name={"attribute"} />}
                onClick={() => navigate("/attributes")}
              >
                Attributes
              </MenuItem>
            </MenuGroup>
            <MenuGroup title={"Tools"}>
              <MenuItem
                icon={<Icon name={"add"} />}
                onClick={() => navigate("/create")}
              >
                Create
              </MenuItem>
            </MenuGroup>
          </MenuList>
        </Menu>
      </Flex>

      {/* `ImportModal` component */}
      <ImportModal
        isOpen={isImportOpen}
        onOpen={onImportOpen}
        onClose={onImportClose}
      />

      {/* `ScanModal` component */}
      <ScanModal
        isOpen={isScanOpen}
        onOpen={onScanOpen}
        onClose={onScanClose}
      />
    </Flex>
  );
};

export default Navigation;
