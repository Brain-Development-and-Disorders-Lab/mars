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
} from "@chakra-ui/react";
import Icon from "@components/Icon";

// Routing and navigation
import { useLocation, useNavigate } from "react-router-dom";

// Utility functions and libraries
import _ from "lodash";
import Importer from "@components/Importer";

const Navigation = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Helper function to close menu on responsive screen sizes
   * when a menu item is clicked
   * @param {string} destination URL to navigate to
   */
  const responsiveNavigate = (destination: string) => {
    onClose();
    navigate(destination);
  };

  const {
    isOpen: isImportOpen,
    onOpen: onImportOpen,
    onClose: onImportClose,
  } = useDisclosure();

  return (
    <Flex w={"100%"}>
      {/* Main navigation group */}
      <Flex
        direction={"column"}
        display={{ base: "none", lg: "flex" }}
        gap={"6"}
        w={"100%"}
        p={"2"}
      >
        {/* Icon */}
        <Flex direction={"row"} align={"center"} gap={"2"}>
          <Image src="/Favicon.png" boxSize={"36px"} />
          <Flex direction={"column"}>
            <Heading fontWeight={"semibold"} size={"md"}>
              MARS
            </Heading>
          </Flex>
        </Flex>

        {/* Menu items */}
        <Flex direction={"column"} align={"self-start"} gap={"6"}>
          <Flex direction={"column"} gap={"2"} width={"100%"}>
            <Text fontSize={"xs"} fontWeight={"bold"} color={"gray.600"}>
              Actions
            </Text>
            <Button
              key={"create"}
              w={"100%"}
              colorScheme={"green"}
              variant={"solid"}
              leftIcon={<Icon name={"add"} />}
              onClick={() => navigate("/create")}
            >
              <Flex pr={"4"}>Create</Flex>
            </Button>

            <Button
              key={"import"}
              w={"100%"}
              colorScheme={"blue"}
              variant={"solid"}
              leftIcon={<Icon name={"upload"} />}
              onClick={() => onImportOpen()}
            >
              <Flex pr={"4"}>Import</Flex>
            </Button>
          </Flex>

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

          <Spacer />
        </Flex>
      </Flex>

      {/* Icon to show menu in responsive context */}
      <Flex p={"2"} display={{ lg: "none" }} justify={"left"}>
        <IconButton
          size={"md"}
          display={{ base: "flex", lg: "none" }}
          justifyContent={"center"}
          icon={<Icon name={isOpen ? "cross" : "list"} />}
          aria-label={"Open Menu"}
          onClick={isOpen ? onClose : onOpen}
        />
      </Flex>

      {/* Responsive display */}
      {isOpen && (
        <Flex
          p={"2"}
          gap={"4"}
          direction={"column"}
          align={"self-start"}
          w={"100%"}
        >
          <Flex direction={"column"} gap={"2"} width={"100%"}>
            <Text fontSize={"xs"} fontWeight={"bold"} color={"gray.600"}>
              Actions
            </Text>
            <Button
              key={"create"}
              w={"100%"}
              colorScheme={"green"}
              variant={"solid"}
              leftIcon={<Icon name={"add"} />}
              onClick={() => responsiveNavigate("/create")}
            >
              <Flex pr={"4"}>Create</Flex>
            </Button>
          </Flex>

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
              onClick={() => responsiveNavigate("/")}
            >
              Dashboard
            </Button>

            <Button
              key={"search"}
              w={"100%"}
              justifyContent={"left"}
              variant={
                _.startsWith(location.pathname, "/search") ? "solid" : "ghost"
              }
              leftIcon={<Icon name={"search"} />}
              onClick={() => responsiveNavigate("/search")}
            >
              Search
            </Button>

            <Button
              leftIcon={<Icon name={"project"} />}
              w={"100%"}
              justifyContent={"left"}
              variant={
                _.startsWith(location.pathname, "/project") ? "solid" : "ghost"
              }
              onClick={() => responsiveNavigate("/projects")}
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
                _.startsWith(location.pathname, "/entities") ? "solid" : "ghost"
              }
              onClick={() => responsiveNavigate("/entities")}
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
                _.startsWith(location.pathname, "/attributes")
                  ? "solid"
                  : "ghost"
              }
              onClick={() => responsiveNavigate("/attributes")}
            >
              Attributes
            </Button>
          </Flex>
        </Flex>
      )}

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
