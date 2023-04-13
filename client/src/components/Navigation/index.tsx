// React and interface library
import React, { ReactNode } from "react";
import {
  Box,
  Flex,
  Avatar,
  HStack,
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
} from "@chakra-ui/react";
import {
  HamburgerIcon,
  InfoOutlineIcon,
  SearchIcon,
  AddIcon,
} from "@chakra-ui/icons";
import { BsBox, BsFolder, BsPuzzle, BsXLg } from "react-icons/bs";

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
      <Flex h={"8vh"} alignItems={"center"} justifyContent={"space-between"}>
        {/* Icon to show menu in responsive context */}
        <IconButton
          size={"md"}
          icon={isOpen ? <BsXLg /> : <HamburgerIcon />}
          aria-label={"Open Menu"}
          display={{ md: "none" }}
          onClick={isOpen ? onClose : onOpen}
        />

        {/* Main navigation group */}
        <HStack spacing={8} alignItems={"center"} justify={"center"}>
          <HStack as={"nav"} spacing={4} display={{ base: "none", md: "flex" }}>
            {/* Icon */}
            <Image src="/Favicon.png" boxSize={"36px"} />
            <Heading fontWeight={"semibold"} size={"lg"}>MARS</Heading>

            <Button key={"dashboard"} bg={"white"} onClick={() => navigate("/")}>
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
              >
                Create
              </MenuButton>
              <MenuList>
                <MenuItem icon={<BsBox />} onClick={() => navigate("/create/entity/start")}>
                  Entity
                </MenuItem>
                <MenuItem icon={<BsFolder />} onClick={() => navigate("/create/collection/start")}>
                  Collection
                </MenuItem>
                <MenuItem icon={<BsPuzzle />} onClick={() => navigate("/create/attribute/start")}>
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
              >
                View
              </MenuButton>
              <MenuList>
                <MenuItem icon={<BsBox />} onClick={() => navigate("/entities")}>
                  Entities
                </MenuItem>
                <MenuItem icon={<BsFolder />} onClick={() => navigate("/collections")}>
                  Collections
                </MenuItem>
                <MenuItem icon={<BsPuzzle />} onClick={() => navigate("/attributes")}>
                  Attributes
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </HStack>

        {/* Search and Avatar component */}
        <Flex alignItems={"center"} gap={"4"}>
          <Button
            key={"search"}
            bg={"white"}
            leftIcon={<SearchIcon />}
            onClick={() => navigate("/search")}
          >
            Search
          </Button>

          <Menu>
            <MenuButton
              as={Button}
              rounded={"full"}
              variant={"link"}
              cursor={"pointer"}
              minW={0}
            >
              <Avatar size={"sm"} />
            </MenuButton>
          </Menu>
        </Flex>
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
