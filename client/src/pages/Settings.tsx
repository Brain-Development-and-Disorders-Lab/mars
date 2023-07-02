// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Error from "@components/Error";

// Existing and custom types
import {
  DeviceModel,
} from "@types";

// Utility functions and libraries
import { getData } from "@database/functions";
import { useToken } from "src/authentication/useToken";
import _ from "lodash";

// Routing and navigation
// import { useNavigate } from "react-router-dom";

const Settings = () => {
  const [isError, setIsError] = useState(false);

  const toast = useToast();

  const [isLoaded, setIsLoaded] = useState(false);
  const [devices, setDevices] = useState([] as DeviceModel[]);

  // Token to access information about the user
  const [token, _setToken] = useToken();

  useEffect(() => {
    // Get all Devices
    getData(`/system/devices`)
      .then((response) => {
        setDevices(response);
      })
      .catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Device data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);

  return (
    <Content vertical={isError}>
      {isError ? (
        <Error />
      ) : (
        <Flex
          direction={"column"}
          justify={"center"}
          p={["1", "2"]}
          gap={"6"}
          wrap={"wrap"}
          bg={"white"}
          rounded={"md"}
        >
          {/* Page header */}
          <Flex direction={"column"} p={"2"} pt={"4"} pb={"4"}>
            <Flex direction={"row"} align={"center"} justify={"space-between"}>
              <Flex align={"center"} gap={"4"}>
                <Icon name={"settings"} size={"lg"} />
                <Heading fontWeight={"semibold"}>Settings</Heading>
              </Flex>
            </Flex>
          </Flex>

          {/* Settings components */}
          <Tabs variant={"soft-rounded"} colorScheme={"blue"}>
            <TabList p={"2"}>
              <Tab>Account</Tab>
              <Tab>Devices</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                {/* Account settings */}
                <Flex p={"2"} w={"100%"} direction={"column"} gap={"4"}>
                  <Text>Manage account settings.</Text>
                  <Flex direction={"row"} gap={"4"}>
                    <Text fontWeight={"semibold"}>Username:</Text>
                    <Text>{token.username}</Text>
                  </Flex>
                </Flex>
              </TabPanel>
              <TabPanel>
                {/* Device settings */}
                <Flex p={"2"} w={"100%"} direction={"column"} gap={"4"}>
                  <Text>A list of devices and scanners that have been registered with MARS. Registration is required for pairing an input device such as a scanner.</Text>
                  <Flex>
                    <Button colorScheme={"green"} rightIcon={<Icon name={"add"} />} disabled>Register</Button>
                  </Flex>
                  <Flex direction={"row"} align={"center"} gap={"2"}>
                    <VStack gap={"4"}>
                      {isLoaded &&
                        devices.map((device) => {
                          return (
                            <Flex key={device._id} align={"center"} direction={"row"} gap={"4"} p={"2"} pl={"4"} rounded={"md"} bg={"gray.100"}>
                              <Icon name={"scan"} size={"md"} />
                              <Text fontWeight={"semibold"}>{device.name}</Text>
                              <IconButton aria-label={"Remove device"} icon={<Icon name={"delete"} />} colorScheme={"red"} disabled />
                            </Flex>
                          );
                        })
                      }
                    </VStack>
                  </Flex>
                </Flex>
              </TabPanel>
            </TabPanels>
          </Tabs>

        </Flex>)}
        </Content>
  )};

export default Settings;
