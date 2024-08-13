import React from "react";

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
} from "@chakra-ui/react";
import Icon from "@components/Icon";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import { useToken } from "src/authentication/useToken";

const AccountMenu = () => {
  const navigate = useNavigate();

  const [token, setToken] = useToken();

  const performLogout = () => {
    // Invalidate the token and refresh the page
    setToken({
      name: token.name,
      orcid: token.orcid,
      token: "",
    });
    navigate(0);
  };

  return (
    <Flex gap={"4"} justify={"center"} w={"100%"}>
      <Menu>
        <MenuButton
          h={"100%"}
          w={"100%"}
          rounded={"md"}
          border={"1px"}
          _hover={{ bg: "gray.300" }}
          borderColor={"gray.200"}
        >
          <Flex
            direction={"row"}
            align={"center"}
            gap={"2"}
            p={"2"}
            ml={"2"}
            mr={"2"}
          >
            <Avatar name={token.name} size={"sm"} />
            <Text
              size={"xs"}
              fontWeight={"semibold"}
              w={"100%"}
              align={"center"}
            >
              {token.name.split(" ").pop()}
            </Text>
            <Icon name={"c_down"} />
          </Flex>
        </MenuButton>

        {/* List of drop-down menu items */}
        <MenuList bg={"white"}>
          <MenuGroup>
            <Flex p={"4"} py={"2"} gap={"2"} direction={"column"}>
              <Text fontWeight={"semibold"}>{token.name}</Text>

              <Flex align={"center"} wrap={"wrap"} gap={"2"}>
                <Text
                  fontSize={"sm"}
                  fontWeight={"semibold"}
                  color={"gray.600"}
                >
                  ORCiD:
                </Text>
                <Tag colorScheme={"green"}>
                  <Link href={`https://orcid.org/${token.orcid}`}>
                    {token.orcid}
                  </Link>
                </Tag>
              </Flex>
            </Flex>
          </MenuGroup>
          <MenuDivider />

          <MenuGroup title={"Account"}>
            <MenuItem onClick={() => performLogout()}>
              <Flex direction={"row"} align={"center"} gap={"2"} ml={"2"}>
                <Icon name={"exit"} />
                Logout
              </Flex>
            </MenuItem>
          </MenuGroup>
        </MenuList>
      </Menu>
    </Flex>
  );
};

export default AccountMenu;
