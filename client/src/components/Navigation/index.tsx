// React and interface library
import React from "react";
import {
  Flex,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Icon,
  Image,
  Heading,
  VStack,
  Text,
  Divider,
} from "@chakra-ui/react";
import { BsBarChart, BsBinoculars, BsBox, BsGrid, BsList, BsPlusLg, BsGear, BsSearch, BsXLg } from "react-icons/bs";

// Router navigation
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const Navigation = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();

  /**
   * Helper function to close menu on responsive screen sizes
   * when a menu item is clicked
   * @param {string} destination URL to navigate to
   */
  const responsiveNavigate = (destination: string) => {
    onClose();
    navigate(destination);
  };

  return (
    <Flex w={"100%"}>
      {/* Main navigation group */}
      <Flex direction={"column"} display={{ base: "none", lg: "flex" }} gap={"6"}>
        {/* Icon */}
        <Flex direction={"row"} align={"center"} gap={"2"}>
          <Image src="/Favicon.png" boxSize={"36px"} />
          <Flex direction={"column"}>
            <Heading fontWeight={"semibold"} color={"white"} size={"md"}>MARS</Heading>
            <Text color={"gray.200"}>{dayjs(Date.now()).format("DD MMM").toString()}</Text>
          </Flex>
        </Flex>

        {/* Menu items */}
        <Flex direction={"column"} align={"self-start"} gap={"6"}>
          <Button key={"dashboard"} variant={"link"} color={"white"} leftIcon={<Icon as={BsBarChart} />} onClick={() => navigate("/")}>
            Dashboard
          </Button>
          <Button leftIcon={<Icon as={BsPlusLg} />} variant={"link"} color={"white"} onClick={() => navigate("/create")}>
            Create
          </Button>

          <Divider />

          <Button leftIcon={<Icon as={BsBox} />} variant={"link"} color={"white"} onClick={() => navigate("/entities")}>
            Entities
          </Button>
          <Button leftIcon={<Icon as={BsGrid} />} variant={"link"} color={"white"} onClick={() => navigate("/collections")}>
            Collections
          </Button>
          <Button leftIcon={<Icon as={BsGear} />} variant={"link"} color={"white"} onClick={() => navigate("/attributes")}>
            Attributes
          </Button>

          <Divider />

          <Button
            key={"search"}
            variant={"link"}
            color={"white"}
            leftIcon={<Icon as={BsSearch} />}
            onClick={() => navigate("/search")}
          >
            Search
          </Button>
        </Flex>
      </Flex>

      {/* Icon to show menu in responsive context */}
      <Flex p={"2"} bg={"white"} display={{ lg: "none" }}>
        <IconButton
          size={"md"}
          icon={<Icon as={isOpen ? BsXLg : BsList} alignContent={"center"} />}
          aria-label={"Open Menu"}
          display={{ lg: "none" }}
          onClick={isOpen ? onClose : onOpen}
        />
      </Flex>

      {/* Responsive display */}
      {isOpen && (
        <Flex p={"4"} direction={"column"} display={{ lg: "none" }}>
          <VStack as={"nav"} spacing={4}>
            <Flex direction={"column"} align={"baseline"}>
              <Button key={"dashboard"} bg={"white"} leftIcon={<Icon as={BsBarChart} />} onClick={() => responsiveNavigate("/")}>
                Dashboard
              </Button>

              {/* Create menu */}
              <Menu>
                <MenuButton
                  as={Button}
                  bg={"white"}
                  rounded={"md"}
                  cursor={"pointer"}
                  minW={0}
                  leftIcon={<Icon as={BsPlusLg} />}
                >
                  Create
                </MenuButton>
                <MenuList>
                  <MenuItem icon={<Icon as={BsBox} />} onClick={() => responsiveNavigate("/create/entity/start")}>
                    Entity
                  </MenuItem>
                  <MenuItem icon={<Icon as={BsGrid} />} onClick={() => responsiveNavigate("/create/collection/start")}>
                    Collection
                  </MenuItem>
                  <MenuItem icon={<Icon as={BsGear} />} onClick={() => responsiveNavigate("/create/attribute/start")}>
                    Attribute
                  </MenuItem>
                </MenuList>
              </Menu>

              {/* View menu */}
              <Menu>
                <MenuButton
                  as={Button}
                  bg={"white"}
                  rounded={"md"}
                  cursor={"pointer"}
                  minW={0}
                  leftIcon={<Icon as={BsBinoculars} />}
                >
                  View
                </MenuButton>
                <MenuList>
                  <MenuItem icon={<Icon as={BsBox} />} onClick={() => responsiveNavigate("/entities")}>
                    Entities
                  </MenuItem>
                  <MenuItem icon={<Icon as={BsGrid} />} onClick={() => responsiveNavigate("/collections")}>
                    Collections
                  </MenuItem>
                  <MenuItem icon={<Icon as={BsGear} />} onClick={() => responsiveNavigate("/attributes")}>
                    Attributes
                  </MenuItem>
                </MenuList>
              </Menu>

              <Button
                key={"search"}
                bg={"white"}
                leftIcon={<Icon as={BsSearch} />}
                onClick={() => responsiveNavigate("/search")}
              >
                Search
              </Button>
            </Flex>
          </VStack>
        </Flex>
      )}
    </Flex>
  );
};

export default Navigation;
