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
import { request } from "@database/functions";
import { useToken } from "src/authentication/useToken";
import dayjs from "dayjs";
import FileSaver from "file-saver";
import slugify from "slugify";

const AccountMenu = () => {
  const navigate = useNavigate();

  const [token, setToken] = useToken();

  const performBackup = async () => {
    // Retrieve all data stored in the system
    const response = request("GET", "/data/backup");
    FileSaver.saveAs(
      new Blob([JSON.stringify(response, null, "  ")]),
      slugify(`backup_${dayjs(Date.now()).toJSON()}.json`),
    );
  };

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
    <Flex gap={"4"} align={"center"} h={"100%"}>
      <Menu>
        <MenuButton h={"100%"} _hover={{ bg: "gray.200" }}>
          <Flex
            direction={"row"}
            align={"center"}
            gap={"2"}
            p={"1"}
            ml={"2"}
            mr={"2"}
          >
            <Avatar name={token.name} size={"sm"} />
            <Text size={"xs"} fontWeight={"semibold"}>
              {token.name}
            </Text>
            <Icon name={"c_down"} />
          </Flex>
        </MenuButton>

        {/* List of drop-down menu items */}
        <MenuList ml={"2"} mr={"2"}>
          <MenuGroup>
            <Flex p={"4"} py={"2"} gap={"2"} direction={"column"}>
              <Text fontWeight={"semibold"}>
                Hello, {token.name.split(" ")[0]}!
              </Text>

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

          <MenuGroup title={"System"}>
            <MenuItem onClick={() => performBackup()}>
              <Flex direction={"row"} align={"center"} gap={"2"} ml={"2"}>
                <Icon name={"download"} />
                Backup
              </Flex>
            </MenuItem>
            <MenuItem onClick={() => navigate(`/settings`)}>
              <Flex direction={"row"} align={"center"} gap={"2"} ml={"2"}>
                <Icon name={"settings"} />
                Settings
              </Flex>
            </MenuItem>
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
