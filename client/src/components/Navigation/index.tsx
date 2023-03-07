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
} from "@chakra-ui/react";
import {
  HamburgerIcon,
  CloseIcon,
  InfoOutlineIcon,
  SearchIcon,
  AddIcon,
} from "@chakra-ui/icons";
import { BsBox, BsCollection, BsGear } from "react-icons/bs";

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
    px={"2"}
    py={"2"}
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

  return (
    <Box px={4} bg={"white"}>
      <Flex h={"8vh"} alignItems={"center"} justifyContent={"space-between"}>
        {/* Icon to show menu in responsive context */}
        <IconButton
          size={"md"}
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          aria-label={"Open Menu"}
          display={{ md: "none" }}
          onClick={isOpen ? onClose : onOpen}
        />

        {/* Main navigation group */}
        <HStack spacing={8} alignItems={"center"} justify={"center"}>
          <HStack as={"nav"} spacing={4} display={{ base: "none", md: "flex" }}>
            {/* Icon */}
            <Image src="/Favicon.png" boxSize={"36px"} />

            <Button key={"home"} bg={"white"}>
              <Link href={"/"}>Home</Link>
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
                <MenuItem
                  icon={<BsBox />}
                  as={Link}
                  href={"/create/entity/start"}
                >
                  Entity
                </MenuItem>
                <MenuItem
                  icon={<BsCollection />}
                  as={Link}
                  href={"/create/collection/start"}
                >
                  Collection
                </MenuItem>
                <MenuItem
                  icon={<BsGear />}
                  as={Link}
                  href={"/create/attribute/start"}
                >
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
                <MenuItem icon={<BsBox />} as={Link} href={"/entities"}>
                  All Entities
                </MenuItem>
                <MenuItem
                  icon={<BsCollection />}
                  as={Link}
                  href={"/collections"}
                >
                  All Collections
                </MenuItem>
                <MenuItem icon={<BsGear />} as={Link} href={"/attributes"}>
                  All Attributes
                </MenuItem>
              </MenuList>
            </Menu>

            <Button key={"search"} bg={"white"} leftIcon={<SearchIcon />}>
              <Link href={"/search"}>Search</Link>
            </Button>
          </HStack>
        </HStack>

        {/* Action and avatar component */}
        <Flex alignItems={"center"}>
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
            <MenuList>
              <MenuItem>Logout</MenuItem>
            </MenuList>
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
                  <Icon as={BsCollection} />
                  <NavigationElement
                    href={"/create/collection/start"}
                    onClick={isOpen ? onClose : onOpen}
                  >
                    Collection
                  </NavigationElement>
                </Flex>
                <Flex direction={"row"} align={"center"}>
                  <Icon as={BsGear} />
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
                  <Icon as={BsCollection} />
                  <NavigationElement
                    href={"/collections"}
                    onClick={isOpen ? onClose : onOpen}
                  >
                    Collections
                  </NavigationElement>
                </Flex>
                <Flex direction={"row"} align={"center"}>
                  <Icon as={BsGear} />
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
