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
  Spacer,
  MenuButton,
  Menu,
  MenuList,
  MenuItem,
  MenuGroup,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import Importer from "@components/Importer";
import SearchBox from "@components/SearchBox";
import AccountMenu from "@components/AccountMenu";
import WorkspaceSwitcher from "@components/WorkspaceSwitcher";

// Routing and navigation
import { useLocation, useNavigate } from "react-router-dom";

// Utility functions and libraries
import _ from "lodash";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    isOpen: isImportOpen,
    onOpen: onImportOpen,
    onClose: onImportClose,
  } = useDisclosure();

  return (
    <Flex w={"100%"} p={"2"} bg={"#fafafa"}>
      {/* Main navigation group */}
      <Flex
        direction={"column"}
        display={{ base: "none", lg: "flex" }}
        gap={"6"}
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
          <Image src="/Favicon.png" boxSize={"36px"} />
          <Heading fontWeight={"semibold"} size={"md"}>
            Storacuity
          </Heading>
        </Flex>

        {/* Workspace menu items */}
        <Flex direction={"column"} align={"self-start"} gap={"6"}>
          <Flex direction={"column"} gap={"2"} w={"100%"}>
            <WorkspaceSwitcher />
            <SearchBox />
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
              variant={_.isEqual(location.pathname, "/") ? "solid" : "ghost"}
              leftIcon={<Icon name={"dashboard"} />}
              onClick={() => navigate("/")}
            >
              Dashboard
            </Button>

            <Button
              id={"navSearchButton"}
              key={"search"}
              size={"sm"}
              w={"100%"}
              justifyContent={"left"}
              variant={
                _.includes(location.pathname, "/search") ? "solid" : "ghost"
              }
              leftIcon={<Icon name={"search"} />}
              onClick={() => navigate("/search")}
            >
              Search
            </Button>

            <Button
              id={"navProjectsButton"}
              leftIcon={<Icon name={"project"} />}
              size={"sm"}
              w={"100%"}
              justifyContent={"left"}
              variant={
                _.includes(location.pathname, "/project") &&
                !_.includes(location.pathname, "/create")
                  ? "solid"
                  : "ghost"
              }
              onClick={() => navigate("/projects")}
            >
              <Flex w={"100%"} align={"center"} gap={"2"}>
                <Text>Projects</Text>
              </Flex>
            </Button>

            <Button
              id={"navEntitiesButton"}
              leftIcon={<Icon name={"entity"} />}
              size={"sm"}
              w={"100%"}
              justifyContent={"left"}
              variant={
                _.includes(location.pathname, "/entit") &&
                !_.includes(location.pathname, "/create")
                  ? "solid"
                  : "ghost"
              }
              onClick={() => navigate("/entities")}
            >
              <Flex w={"100%"} align={"center"} gap={"2"}>
                <Text>Entities</Text>
              </Flex>
            </Button>
            <Button
              id={"navTemplatesButton"}
              leftIcon={<Icon name={"attribute"} />}
              size={"sm"}
              w={"100%"}
              justifyContent={"left"}
              variant={
                _.includes(location.pathname, "/attribute") &&
                !_.includes(location.pathname, "/create")
                  ? "solid"
                  : "ghost"
              }
              onClick={() => navigate("/attributes")}
            >
              Templates
            </Button>
          </Flex>

          <Flex direction={"column"} gap={"2"} width={"100%"}>
            <Text fontSize={"xs"} fontWeight={"bold"} color={"gray.600"}>
              Tools
            </Text>
            <Button
              id={"navCreateButton"}
              key={"create"}
              size={"sm"}
              w={"100%"}
              justifyContent={"left"}
              variant={
                _.includes(location.pathname, "/create") ? "solid" : "ghost"
              }
              leftIcon={<Icon name={"add"} />}
              onClick={() => navigate("/create")}
            >
              Create
            </Button>

            <Button
              id={"navImportButton"}
              key={"import"}
              size={"sm"}
              w={"100%"}
              justifyContent={"left"}
              variant={"ghost"}
              leftIcon={<Icon name={"upload"} />}
              onClick={() => onImportOpen()}
            >
              Import
            </Button>
          </Flex>
        </Flex>

        <Spacer />

        <AccountMenu />
      </Flex>

      {/* Icon to show menu in responsive context */}
      <Flex
        display={{ lg: "none" }}
        justify={"left"}
        alignContent={"center"}
        h={"5vh"}
        w={"100%"}
        bg={"#fafafa"}
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

      {/* Importer component containing modals */}
      <Importer
        isOpen={isImportOpen}
        onOpen={onImportOpen}
        onClose={onImportClose}
      />
    </Flex>
  );
};

export default Navigation;
