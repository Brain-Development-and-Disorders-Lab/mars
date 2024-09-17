import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Avatar,
  Flex,
  Link,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Tag,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import Icon from "@components/Icon";

// Custom types
import { UserModel } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import _ from "lodash";
import { useToken } from "src/authentication/useToken";

// GraphQL
import { gql, useLazyQuery, useQuery } from "@apollo/client";

const AccountMenu = () => {
  const navigate = useNavigate();

  // User data
  const [user, setUser] = useState({} as Partial<UserModel>);

  const [isOpen, setIsOpen] = useState(false);

  const [token, setToken] = useToken();

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

  const performLogout = () => {
    // Invalidate the token and refresh the page
    setToken({
      name: token.name,
      orcid: token.orcid,
      token: "",
      workspace: "",
    });
    navigate(0);
  };

  const handleProfileClick = () => {
    navigate("/profile");
    setIsOpen(false);
  };

  const handleOpenClick = async () => {
    // If currently unopened, refresh the User detail
    if (isOpen === false) {
      const result = await getUser();
      if (result.data?.user) {
        setUser(result.data.user);
      }
    }

    setIsOpen(!isOpen);
  };

  return (
    <Flex gap={"4"} justify={"center"} w={"100%"}>
      <Menu isOpen={isOpen} autoSelect={false}>
        <MenuButton
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
            <Avatar name={`${user.firstName} ${user.lastName}`} size={"sm"} />
            <Text
              fontSize={"sm"}
              fontWeight={"semibold"}
              w={"100%"}
              align={"center"}
            >
              {user.firstName}
            </Text>
            <Icon name={isOpen ? "c_down" : "c_up"} />
          </Flex>
        </MenuButton>

        {/* List of drop-down menu items */}
        <MenuList bg={"white"}>
          <MenuGroup>
            <Flex p={"4"} py={"2"} gap={"2"} direction={"column"}>
              <Flex direction={"column"} gap={"1"}>
                {/* User information */}
                <Text fontWeight={"semibold"} fontSize={"sm"}>
                  {user.firstName} {user.lastName}
                </Text>

                <Tooltip label={user.affiliation}>
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
                  <Tag colorScheme={"green"}>
                    <Link href={`https://orcid.org/${user._id}`} isExternal>
                      {user._id}
                    </Link>
                  </Tag>
                </Flex>
              </Flex>
            </Flex>
          </MenuGroup>
          <MenuDivider />

          <MenuGroup title={"Account"}>
            <MenuItem onClick={() => handleProfileClick()}>
              <Flex direction={"row"} align={"center"} gap={"2"} ml={"2"}>
                <Icon name={"person"} />
                <Text fontSize={"sm"}>Profile</Text>
              </Flex>
            </MenuItem>
            <MenuItem onClick={() => performLogout()}>
              <Flex direction={"row"} align={"center"} gap={"2"} ml={"2"}>
                <Icon name={"exit"} />
                <Text fontSize={"sm"}>Logout</Text>
              </Flex>
            </MenuItem>
          </MenuGroup>
        </MenuList>
      </Menu>
    </Flex>
  );
};

export default AccountMenu;
