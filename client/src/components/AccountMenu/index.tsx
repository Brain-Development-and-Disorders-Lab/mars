import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Avatar,
  Button,
  Flex,
  Link,
  Menu,
  Portal,
  Tag,
  Text,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";

// Custom types
import { UserModel } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import _ from "lodash";

// GraphQL
import { gql, useLazyQuery, useQuery } from "@apollo/client";

// Contexts
import { useAuthentication } from "@hooks/useAuthentication";

const AccountMenu = () => {
  const navigate = useNavigate();

  // Authentication and user state data
  const { token, logout } = useAuthentication();
  const [user, setUser] = useState({} as Partial<UserModel>);

  const [open, setOpen] = useState(false);

  // Query to retrieve User
  const GET_USER = gql`
    query GetUser($_id: String) {
      user(_id: $_id) {
        _id
        firstName
        lastName
        email
        affiliation
      }
    }
  `;
  const { data, refetch } = useQuery<{ user: UserModel }>(GET_USER, {
    fetchPolicy: "network-only",
    variables: {
      _id: token.orcid,
    },
  });
  const [getUser] = useLazyQuery<{ user: UserModel }>(GET_USER, {
    fetchPolicy: "network-only",
    variables: {
      _id: token.orcid,
    },
  });

  useEffect(() => {
    if (data?.user) {
      setUser(data.user);
    }
  }, [data]);

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, []);

  const handleProfileClick = () => {
    navigate("/profile");
    setOpen(false);
  };

  const handleOpenClick = async () => {
    // If currently unopened, refresh the User detail
    if (open === false) {
      const result = await getUser();
      if (result.data?.user) {
        setUser(result.data.user);
      }
    }

    setOpen(!open);
  };

  return (
    <Flex gap={"4"} justify={"center"} w={"100%"}>
      <Menu.Root>
        <Menu.Trigger>
          <Button
            h={"100%"}
            w={"100%"}
            rounded={"md"}
            border={"1px"}
            borderColor={"gray.300"}
            bg={"white"}
            _hover={{ bg: "gray.300" }}
            onClick={() => handleOpenClick()}
          >
            <Flex
              direction={"row"}
              align={"center"}
              gap={"2"}
              p={"2"}
              ml={"2"}
              mr={"2"}
            >
              <Avatar.Root
                size={"sm"}
                key={`${user.firstName} ${user.lastName}`}
              >
                <Avatar.Fallback name={`${user.firstName} ${user.lastName}`} />
              </Avatar.Root>
              <Text
                fontSize={"sm"}
                fontWeight={"semibold"}
                w={"100%"}
                textAlign={"center"}
              >
                {user.firstName}
              </Text>
              <Icon name={open ? "c_down" : "c_up"} />
            </Flex>
          </Button>
        </Menu.Trigger>

        <Portal>
          {/* List of drop-down menu items */}
          <Menu.Positioner>
            <Menu.Content>
              <Flex p={"4"} py={"2"} gap={"2"} direction={"column"}>
                <Flex direction={"column"} gap={"1"}>
                  {/* User information */}
                  <Text fontWeight={"semibold"} fontSize={"sm"}>
                    {user.firstName} {user.lastName}
                  </Text>

                  <Tooltip label={user.affiliation} hasArrow>
                    <Text
                      fontWeight={"semibold"}
                      fontSize={"sm"}
                      color={"gray.400"}
                    >
                      {_.truncate(user.affiliation, { length: 30 })}
                    </Text>
                  </Tooltip>

                  <Flex align={"center"} wrap={"wrap"} gap={"2"}>
                    <Text fontSize={"sm"} fontWeight={"semibold"}>
                      ORCiD:
                    </Text>
                    <Tag.Root colorPalette={"green"}>
                      <Tag.Label>
                        <Link href={`https://orcid.org/${user._id}`}>
                          {user._id}
                        </Link>
                      </Tag.Label>
                    </Tag.Root>
                  </Flex>
                </Flex>
              </Flex>
            </Menu.Content>

            <Menu.Separator />

            <Menu.Content>
              <Menu.ItemGroup>
                <Menu.ItemGroupLabel>Account</Menu.ItemGroupLabel>
                <Menu.Item>
                  <Flex
                    direction={"row"}
                    align={"center"}
                    gap={"2"}
                    ml={"2"}
                    onClick={() => handleProfileClick}
                  >
                    <Icon name={"person"} />
                    <Text fontSize={"sm"}>Profile</Text>
                  </Flex>
                </Menu.Item>
                <Menu.Item>
                  <Flex
                    direction={"row"}
                    align={"center"}
                    gap={"2"}
                    ml={"2"}
                    onClick={() => logout()}
                  >
                    <Icon name={"exit"} />
                    <Text fontSize={"sm"}>Logout</Text>
                  </Flex>
                </Menu.Item>
              </Menu.ItemGroup>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </Flex>
  );
};

export default AccountMenu;
