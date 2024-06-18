// React
import React from "react";

// Existing and custom components
import {
  Flex,
  IconButton,
  Button,
  useDisclosure,
  Image,
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

// Routing and navigation
import { useLocation, useNavigate } from "react-router-dom";

// Utility functions and libraries
import _ from "lodash";
import Importer from "@components/Importer";
import SearchBox from "@components/SearchBox";
import AccountMenu from "@components/AccountMenu";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    isOpen: isImportOpen,
    onOpen: onImportOpen,
    onClose: onImportClose,
  } = useDisclosure();

  return (
    <Flex w={"100%"} p={"2"}>
      {/* Main navigation group */}
      <Flex
        direction={"column"}
        display={{ base: "none", lg: "flex" }}
        gap={"6"}
        w={"100%"}
      >
        {/* Icon */}
        <Flex direction={"row"} gap={"2"} p={"1"} mt={"1"} align={"center"}>
          <Image src="/Favicon.png" boxSize={"36px"} />
          <Flex direction={"column"}>
            <Heading fontWeight={"semibold"} size={"md"}>
              MARS
            </Heading>
          </Flex>
        </Flex>

        {/* Menu items */}
        <Flex direction={"column"} align={"self-start"} gap={"6"}>
          <SearchBox />

          <Flex direction={"column"} gap={"2"} width={"100%"}>
            <Text fontSize={"xs"} fontWeight={"bold"} color={"gray.600"}>
              Menu
            </Text>
            <Button
              key={"dashboard"}
              w={"100%"}
              justifyContent={"left"}
              variant={_.isEqual(location.pathname, "/") ? "solid" : "ghost"}
              leftIcon={<Icon name={"dashboard"} />}
              onClick={() => navigate("/")}
            >
              Dashboard
            </Button>

            <Button
              key={"search"}
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
              leftIcon={<Icon name={"project"} />}
              w={"100%"}
              justifyContent={"left"}
              variant={
                _.includes(location.pathname, "/project") ? "solid" : "ghost"
              }
              onClick={() => navigate("/projects")}
            >
              <Flex w={"100%"} align={"center"} gap={"2"}>
                <Text>Projects</Text>
              </Flex>
            </Button>

            <Button
              leftIcon={<Icon name={"entity"} />}
              w={"100%"}
              justifyContent={"left"}
              variant={
                _.includes(location.pathname, "/entit") ? "solid" : "ghost"
              }
              onClick={() => navigate("/entities")}
            >
              <Flex w={"100%"} align={"center"} gap={"2"}>
                <Text>Entities</Text>
              </Flex>
            </Button>
            <Button
              leftIcon={<Icon name={"attribute"} />}
              w={"100%"}
              justifyContent={"left"}
              variant={
                _.includes(location.pathname, "/attribute") ? "solid" : "ghost"
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
              key={"create"}
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
              key={"import"}
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
        p={"1"}
        display={{ lg: "none" }}
        justify={"left"}
        alignContent={"center"}
        h={"6vh"}
        w={"100%"}
        bg={"white"}
      >
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label={"Open Menu"}
            display={{ base: "flex", lg: "none" }}
            size={"md"}
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
                onClick={() => navigate("/attribute")}
              >
                Attribute
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
