// React
import React, { FC } from "react";

// Existing and custom components
import { Avatar, Flex, Menu, MenuButton, MenuGroup, MenuItem, MenuList, Spacer, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";
import Navigation from "@components/Navigation";
import SearchBox from "@components/SearchBox";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import { getData } from "@database/functions";
import { useToken } from "src/authentication/useToken";
import _ from "lodash";
import dayjs from "dayjs";
import FileSaver from "file-saver";
import slugify from "slugify";

// Content container
const Content: FC<any> = (props: { children: any; vertical?: boolean }) => {
  return (
    <Flex
      align={props.vertical && props.vertical ? "center" : ""}
      justify={"center"}
    >
      <Flex
        direction={"column"}
        wrap={"wrap"}
        justify={"center"}
        gap={"6"}
        p={"4"}
        h={"auto"}
        w={"100%"}
        maxW={"7xl"}
      >
        {props.children}
      </Flex>
    </Flex>
  );
};

// Page container
const Page: FC<any> = ({ children }) => {
  const [token, setToken] = useToken();
  const navigate = useNavigate();

  const performBackup = () => {
    // Retrieve all data stored on the server
    getData(`/server/backup`).then((response) => {
      FileSaver.saveAs(
        new Blob([JSON.stringify(response)]),
        slugify(`server_backup_${dayjs(Date.now()).toJSON()}.json`)
      );
    });
  };

  const performLogout = () => {
    // Invalidate the token and refresh the page
    setToken({
      username: token.username,
      token: token.token,
      lastLogin: token.lastLogin,
      valid: false,
    });
    navigate(0);
  };

  return (
    <Flex
      direction={{ base: "column", lg: "row" }}
      minH={"100vh"}
      w={"100%"}
      p={"0"}
      m={"0"}
    >
      {/* Navigation component */}
      <Flex p={"4"} justify={"center"} background={"white"}>
        <Navigation />
      </Flex>

      <Flex direction={"column"} w={"100%"} background={"gray.50"}>
        {/* Search box component */}
        <Flex
          w={"100%"}
          h={"6vh"}
          align={"center"}
          display={{ base: "none", lg: "flex" }}
          background={"white"}
        >
          <Spacer />

          <SearchBox />

          <Spacer />

          <Flex p={"4"} gap={"4"} align={"center"}>
            <Icon name={"bell"} size={[5, 5]} />
            <Menu>
              <MenuButton as={Avatar} bgColor={"orange.400"} size={"sm"} />
              <MenuList>
                <Flex p={"4"} w={"100%"} direction={"column"}>
                  <Text fontWeight={"semibold"}>Hello, {token.username}!</Text>
                  <Text>Last login: {dayjs(token.lastLogin).fromNow()}</Text>
                </Flex>
                <MenuGroup title={"System"}>
                  <MenuItem onClick={() => performBackup()}>
                    <Flex direction={"row"} align={"center"} gap={"4"}>
                      <Icon name={"download"} />
                      Backup
                    </Flex>
                  </MenuItem>
                </MenuGroup>
                <MenuGroup title={"Account"}>
                  <MenuItem onClick={() => performLogout()}>
                    <Flex direction={"row"} align={"center"} gap={"4"}>
                      <Icon name={"exit"} />
                      Logout
                    </Flex>
                  </MenuItem>
                </MenuGroup>
              </MenuList>
            </Menu>
          </Flex>
        </Flex>

        {/* Main content components */}
        {children}
      </Flex>
    </Flex>
  );
};

export { Content, Page };
