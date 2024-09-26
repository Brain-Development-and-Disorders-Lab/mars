// React
import React from "react";

// Chakra provider component
import {
  Button,
  Card,
  CardBody,
  ChakraProvider,
  Flex,
  Heading,
  Image,
  Link,
  Spacer,
  Text,
} from "@chakra-ui/react";

// Utility imports
import _ from "lodash";
import consola from "consola";

/**
 * Base App component containing the page layout
 * @returns {ReactElement}
 */
const App = () => {
  if (_.isEqual(process.env.NODE_ENV, "development")) {
    consola.debug("Running client in development mode");
  }

  return (
    <ChakraProvider>
      <Flex
        direction={"column"}
        minH={"100vh"}
        w={"100%"}
        p={"4"}
        m={"0"}
        gap={"0"}
        overflow={"hidden"}
        opacity={"0.8"}
      >
        <Flex
          id={"home"}
          h={"100vh"}
          maxH={"100vh"}
          direction={"column"}
          gap={"8"}
          overflow={"hidden"}
          align={"center"}
        >
          {/* Page Header */}
          <Flex
            w={"100%"}
            direction={"row"}
            gap={"12"}
            align={"center"}
            justify={"center"}
          >
            <Button
              rounded={"full"}
              p={"4"}
              boxShadow={"xs"}
              colorScheme={"blue"}
              as={Link}
              href={"#features"}
            >
              Features
            </Button>
            <Button
              rounded={"full"}
              p={"4"}
              boxShadow={"xs"}
              colorScheme={"blue"}
              as={Link}
              href={"#about"}
            >
              About
            </Button>
          </Flex>

          <Flex direction={"column"} align={"center"} gap={"12"} h={"100%"}>
            <Flex
              direction={"column"}
              gap={"2"}
              textAlign={"left"}
              justify={"center"}
            >
              <Heading size={"2xl"}>Streamline metadata management</Heading>
              <Heading size={"2xl"} fontStyle={"italic"} fontWeight={"normal"}>
                and make your shared data FAIR
              </Heading>
            </Flex>

            <Text fontWeight={"semibold"} fontSize={"lg"}>
              Metadatify makes reusing, sharing, and collaborating on your
              scientific metadata easy and free.
            </Text>

            <Flex direction={"row"} gap={"6"} align={"center"}>
              <Button
                rounded={"full"}
                p={"4"}
                boxShadow={"xs"}
                colorScheme={"blue"}
              >
                Get Started
              </Button>
            </Flex>
          </Flex>

          <Spacer />

          <Image
            src={"Dashboard.png"}
            maxW={"80vw"}
            rounded={"xl"}
            boxShadow={"md"}
          />
        </Flex>

        <Flex
          id={"features"}
          h={"100vh"}
          maxH={"100vh"}
          direction={"column"}
          gap={"8"}
          overflow={"hidden"}
          align={"center"}
        >
          <Heading>Features</Heading>
          <Flex w={"100%"} direction={"row"} justify={"space-between"}>
            <Card>
              <CardBody>Feature 1</CardBody>
            </Card>
            <Card>
              <CardBody>Feature 2</CardBody>
            </Card>
          </Flex>
        </Flex>

        <Flex
          id={"about"}
          h={"100vh"}
          maxH={"100vh"}
          direction={"column"}
          gap={"8"}
          overflow={"hidden"}
          align={"center"}
        >
          <Heading>About</Heading>
          <Text>Section 1</Text>
        </Flex>
      </Flex>
    </ChakraProvider>
  );
};

export default App;
