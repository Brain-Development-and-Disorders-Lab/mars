// React and interface library
import React, { ReactNode } from "react";
import {
  Box,
  Flex,
  Link,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  useColorModeValue,
  Stack,
  StackDivider,
  Icon,
  Image,
  Heading,
  VStack,
} from "@chakra-ui/react";
import {
  HamburgerIcon,
  InfoOutlineIcon,
  AddIcon,
} from "@chakra-ui/icons";
import { BsBinoculars, BsBox, BsClipboardData, BsFolder, BsPlusLg, BsPuzzle, BsSearch, BsXLg } from "react-icons/bs";

// Router navigation
import { useNavigate } from "react-router-dom";

// NavigationElement sub-component to generalize links
const NavigationElement = ({
  href,
  children,
  onClick,
}: {
  href: string;
  children: ReactNode;
  onClick?: () => void;
}) => (
  <Link
    href={href}
    p={"2"}
    rounded={"md"}
    _hover={{
      textDecoration: "none",
      bg: useColorModeValue("gray.200", "gray.700"),
    }}
    onClick={onClick}
  >
    {children}
  </Link>
);

const Navigation = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const navigate = useNavigate();

  return (
    <Box px={4} bg={"white"}>
      <Flex justifyContent={"space-between"} direction={"column"}>
        <Flex pt={"2"} pb={"2"}>
          {/* Icon to show menu in responsive context */}
          <IconButton
            size={"md"}
            icon={isOpen ? <BsXLg /> : <HamburgerIcon />}
            aria-label={"Open Menu"}
            display={{ md: "none" }}
            onClick={isOpen ? onClose : onOpen}
          />
        </Flex>

        {/* Main navigation group */}
        <VStack spacing={8} align={"center"} h={"100%"}>
          <VStack as={"nav"} spacing={4} display={{ base: "none", md: "flex" }}>
            {/* Icon */}
            <Flex direction={"row"} m={"2"} p={"2"} gap={"2"}>
              <Image src="/Favicon.png" boxSize={"36px"} />
              <Heading fontWeight={"semibold"} size={"lg"}>MARS</Heading>
            </Flex>

            <Flex direction={"column"} align={"baseline"}>
              <Button key={"dashboard"} bg={"white"} leftIcon={<Icon as={BsClipboardData} />} onClick={() => navigate("/")}>
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
                  <MenuItem icon={<Icon as={BsBox} />} onClick={() => navigate("/create/entity/start")}>
                    Entity
                  </MenuItem>
                  <MenuItem icon={<Icon as={BsFolder} />} onClick={() => navigate("/create/collection/start")}>
                    Collection
                  </MenuItem>
                  <MenuItem icon={<Icon as={BsPuzzle} />} onClick={() => navigate("/create/attribute/start")}>
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
                  <MenuItem icon={<Icon as={BsBox} />} onClick={() => navigate("/entities")}>
                    Entities
                  </MenuItem>
                  <MenuItem icon={<Icon as={BsFolder} />} onClick={() => navigate("/collections")}>
                    Collections
                  </MenuItem>
                  <MenuItem icon={<Icon as={BsPuzzle} />} onClick={() => navigate("/attributes")}>
                    Attributes
                  </MenuItem>
                </MenuList>
              </Menu>

              <Button
                key={"search"}
                bg={"white"}
                leftIcon={<Icon as={BsSearch} />}
                onClick={() => navigate("/search")}
              >
                Search
              </Button>
            </Flex>
          </VStack>
        </VStack>
      </Flex>

      {/* Responsive display */}
      {isOpen ? (
        <Box pb={4} display={{ md: "none" }}>
          <Stack as={"nav"} spacing={4} divider={<StackDivider />}>
            {/* Dashboard */}
            <Flex direction={"row"} align={"center"} gap={"2"}>
              <NavigationElement href={"/"} onClick={isOpen ? onClose : onOpen}>
                Dashboard
              </NavigationElement>
            </Flex>

            {/* Create */}
            <Flex direction={"column"}>
              <Flex direction={"row"} align={"center"} gap={"2"}>
                <Icon as={AddIcon} />
                Create
              </Flex>
              <Flex direction={"column"} px={"6"}>
                <Flex direction={"row"} align={"center"}>
                  <Icon as={BsBox} />
                  <NavigationElement
                    href={"/create/entity/start"}
                    onClick={isOpen ? onClose : onOpen}
                  >
                    Entity
                  </NavigationElement>
                </Flex>
                <Flex direction={"row"} align={"center"}>
                  <Icon as={BsFolder} />
                  <NavigationElement
                    href={"/create/collection/start"}
                    onClick={isOpen ? onClose : onOpen}
                  >
                    Collection
                  </NavigationElement>
                </Flex>
                <Flex direction={"row"} align={"center"}>
                  <Icon as={BsPuzzle} />
                  <NavigationElement
                    href={"/create/attribute/start"}
                    onClick={isOpen ? onClose : onOpen}
                  >
                    Attribute
                  </NavigationElement>
                </Flex>
              </Flex>
            </Flex>

            {/* View */}
            <Flex direction={"column"}>
              <Flex direction={"row"} align={"center"} gap={"2"}>
                <Icon as={InfoOutlineIcon} />
                View
              </Flex>
              <Flex direction={"column"} px={"6"}>
                <Flex direction={"row"} align={"center"}>
                  <Icon as={BsBox} />
                  <NavigationElement
                    href={"/entities"}
                    onClick={isOpen ? onClose : onOpen}
                  >
                    Entities
                  </NavigationElement>
                </Flex>
                <Flex direction={"row"} align={"center"}>
                  <Icon as={BsFolder} />
                  <NavigationElement
                    href={"/collections"}
                    onClick={isOpen ? onClose : onOpen}
                  >
                    Collections
                  </NavigationElement>
                </Flex>
                <Flex direction={"row"} align={"center"}>
                  <Icon as={BsPuzzle} />
                  <NavigationElement
                    href={"/attributes"}
                    onClick={isOpen ? onClose : onOpen}
                  >
                    Attributes
                  </NavigationElement>
                </Flex>
              </Flex>
            </Flex>
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
};

export default Navigation;
