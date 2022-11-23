// React and interface library
import React, { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
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
  StackItem,
  StackDivider,
} from "@chakra-ui/react";
import { HamburgerIcon, CloseIcon, SearchIcon, ChevronDownIcon, ViewIcon, PlusSquareIcon } from "@chakra-ui/icons";

// NavigationElement sub-component to generalize links
const NavigationElement = ({ href, children }: { href: string, children: ReactNode }) => (
  <Link
    as={RouterLink}
    to={href}
    px={2}
    py={2}
    rounded={"md"}
    _hover={{
      textDecoration: "none",
      bg: useColorModeValue("gray.200", "gray.700"),
    }}
  >
    {children}
  </Link>
);

const Navigation = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box bg={useColorModeValue("gray.100", "gray.900")} px={4}>
      <Flex h={16} alignItems={"center"} justifyContent={"space-between"}>
        {/* Icon to show menu in responsive context */}
        <IconButton
          size={"md"}
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          aria-label={"Open Menu"}
          display={{ md: "none" }}
          onClick={isOpen ? onClose : onOpen}
        />

        {/* Main navigation group */}
        <HStack spacing={8} alignItems={"center"}>
          <HStack
            as={"nav"}
            spacing={4}
            display={{ base: "none", md: "flex" }}
          >
            <Button key={"home"}>
              <RouterLink to={"/"}>Home</RouterLink>
            </Button>

            {/* Create menu */}
            <Menu>
              <MenuButton
                as={Button}
                rounded={"md"}
                cursor={"pointer"}
                minW={0}
                rightIcon={<ChevronDownIcon />}
              >
                Create
              </MenuButton>
              <MenuList>
                <MenuItem as={RouterLink} to={"/create/collection/start"}>Collection</MenuItem>
                <MenuItem as={RouterLink} to={"/create/attribute/start"}>Template Attribute</MenuItem>
                <MenuItem as={RouterLink} to={"/create/entity/start"}>Entity</MenuItem>
              </MenuList>
            </Menu>

            {/* View menu */}
            <Menu>
              <MenuButton
                as={Button}
                rounded={"md"}
                cursor={"pointer"}
                minW={0}
                rightIcon={<ChevronDownIcon />}
              >
                View
              </MenuButton>
              <MenuList>
                <MenuItem as={RouterLink} to={"/entities"}>All Entities</MenuItem>
                <MenuItem as={RouterLink} to={"/collections"}>All Collections</MenuItem>
                <MenuItem as={RouterLink} to={"/attributes"}>All Attributes</MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </HStack>

        {/* Action and avatar component */}
        <Flex alignItems={"center"}>
          <Button
            as={RouterLink}
            to={"/search"}
            variant={"solid"}
            colorScheme={"teal"}
            px={2}
            py={2}
            mr={4}
            leftIcon={<SearchIcon />}
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
            <MenuList>
              <MenuItem>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      {/* Responsive display */}
      {isOpen ? (
        <Box pb={4} display={{ md: "none" }}>
          <Stack as={"nav"} spacing={4}>
            <StackDivider>
              Home
            </StackDivider>
            <StackItem>
              <NavigationElement href={"/"}>Dashboard</NavigationElement>
            </StackItem>

            <StackDivider>
              <PlusSquareIcon />{" "}Create
            </StackDivider>
            <StackItem>
              <NavigationElement href={"/create/entity/start"}>Entity</NavigationElement>
            </StackItem>
            <StackItem>
              <NavigationElement href={"/create/collection/start"}>Collection</NavigationElement>
            </StackItem>
            <StackItem>
              <NavigationElement href={"/create/attribute/start"}>Template Attribute</NavigationElement>
            </StackItem>

            <StackDivider>
              <ViewIcon />{" "}View
            </StackDivider>
            <StackItem>
              <NavigationElement href={"/entities"}>Entities</NavigationElement>
            </StackItem>
            <StackItem>
              <NavigationElement href={"/collections"}>Collections</NavigationElement>
            </StackItem>
            <StackItem>
              <NavigationElement href={"/attributes"}>Attributes</NavigationElement>
            </StackItem>
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
};

export default Navigation;
