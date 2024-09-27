// React
import React from "react";

// Chakra provider component
import {
  Button,
  ChakraProvider,
  Flex,
  Heading,
  Image,
  Link,
  Text,
} from "@chakra-ui/react";

// Custom components
import Carousel from "./components/Carousel";
import Icon from "./components/Icon";

// Utility imports
import _ from "lodash";

/**
 * Base App component containing the page layout
 */
const App = () => {
  return (
    <ChakraProvider>
      <Flex
        direction={"column"}
        minH={"100vh"}
        w={"100%"}
        p={"4"}
        m={"0"}
        gap={"0"}
        opacity={"0.8"}
      >
        <Flex
          bg={"#F2F8FF"}
          rounded={"3xl"}
          h={"100%"}
          direction={"column"}
          p={"4"}
        >
          <Flex
            direction={"row"}
            gap={"2"}
            justify={"space-between"}
            align={"center"}
            w={"100%"}
            px={["", "6"]}
            py={["", "2"]}
          >
            <Flex gap={"2"} align={"center"}>
              <Image src={"Favicon.png"} w={"25px"} h={"25px"} />
              <Heading size={"md"}>Metadatify</Heading>
            </Flex>
            <Flex align={"center"} gap={"1"}>
              <Link href={"https://app.metadatify.com"}>Log In</Link>
              <Icon name={"a_right"} />
            </Flex>
          </Flex>
          {/* Home */}
          <Flex
            id={"home"}
            h={"100vh"}
            maxH={["", "100vh"]}
            direction={"column"}
            gap={["2", "8"]}
            overflow={"hidden"}
            align={"center"}
          >
            {/* Page Header */}
            <Flex
              direction={"column"}
              align={"center"}
              justify={"center"}
              gap={"8"}
              h={"100%"}
              minH={["40vh", ""]}
            >
              <Flex
                direction={"column"}
                gap={"2"}
                textAlign={"left"}
                justify={"center"}
              >
                <Heading size={"xl"}>Streamline metadata management</Heading>
                <Heading size={"xl"} fontStyle={"italic"} fontWeight={"normal"}>
                  and make your shared data FAIR
                </Heading>
              </Flex>

              <Text fontWeight={"semibold"} fontSize={"lg"}>
                Metadatify makes reusing, sharing, and collaborating on your
                scientific metadata easy.
              </Text>

              <Flex direction={"row"} gap={"6"} align={"center"}>
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
                  href={"#get-started"}
                >
                  Get Started
                </Button>
              </Flex>
            </Flex>

            <Image
              src={"Dashboard.png"}
              maxW={"80vw"}
              rounded={"xl"}
              boxShadow={"lg"}
            />
          </Flex>

          {/* Features */}
          <Flex
            id={"features"}
            minH={"100vh"}
            direction={"column"}
            gap={"8"}
            pt={"8"}
            align={"center"}
          >
            <Heading>Features</Heading>
            <Flex
              w={"100%"}
              direction={"row"}
              justify={"center"}
              wrap={"wrap"}
              gap={["4", "8"]}
            >
              <Flex
                direction={"column"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.200"}
                p={"4"}
                gap={"4"}
                maxW={"sm"}
                bg={"white"}
                boxShadow={"sm"}
              >
                <Icon name={"create"} size={"lg"} />
                <Text fontWeight={"bold"} fontSize={"lg"}>
                  Create
                </Text>
                <Text>
                  Create and manage metadata inside <b>Workspaces</b>, and use{" "}
                  <b>Templates</b> for reusable structures.
                </Text>
              </Flex>
              <Flex
                direction={"column"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.200"}
                p={"4"}
                gap={"4"}
                maxW={"sm"}
                bg={"white"}
                boxShadow={"sm"}
              >
                <Icon name={"project"} size={"lg"} />
                <Text fontWeight={"bold"} fontSize={"lg"}>
                  Organize
                </Text>
                <Text>
                  Within your Workspace, use <b>Projects</b> to group your
                  metadata Entities.
                </Text>
              </Flex>
              <Flex
                direction={"column"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.200"}
                p={"4"}
                gap={"4"}
                maxW={"sm"}
                bg={"white"}
                boxShadow={"sm"}
              >
                <Icon name={"graph"} size={"lg"} />
                <Text fontWeight={"bold"} fontSize={"lg"}>
                  Link
                </Text>
                <Text>
                  Your digital and physical assets are linked, so your metadata
                  should be too. Visualize relationships between metadata as{" "}
                  <b>Origins</b> and <b>Products</b>.
                </Text>
              </Flex>
              <Flex
                direction={"column"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.200"}
                p={"4"}
                gap={"4"}
                maxW={"sm"}
                bg={"white"}
                boxShadow={"sm"}
              >
                <Icon name={"search"} size={"lg"} />
                <Text fontWeight={"bold"} fontSize={"lg"}>
                  Search
                </Text>
                <Text>
                  Use a simple <b>text search</b> or use the advanced{" "}
                  <b>query builder</b> to perform deep searches on metadata.
                </Text>
              </Flex>
              <Flex
                direction={"column"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.200"}
                p={"4"}
                gap={"4"}
                maxW={"sm"}
                bg={"white"}
                boxShadow={"sm"}
              >
                <Icon name={"download"} size={"lg"} />
                <Text fontWeight={"bold"} fontSize={"lg"}>
                  Export
                </Text>
                <Text>
                  Export metadata into a variety of formats, including{" "}
                  <b>CSV and JSON</b> files, and select the metadata fields to
                  export.
                </Text>
              </Flex>
              <Flex
                direction={"column"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.200"}
                p={"4"}
                gap={"4"}
                maxW={"sm"}
                bg={"white"}
                boxShadow={"sm"}
              >
                <Icon name={"person"} size={"lg"} />
                <Text fontWeight={"bold"} fontSize={"lg"}>
                  Collaborate
                </Text>
                <Text>
                  Add users to your Workspace using their <b>ORCiD</b>, allowing
                  them to view and manage your metadata.
                </Text>
              </Flex>
            </Flex>

            <Carousel
              images={[
                {
                  path: "Attribute.png",
                  caption: "Editing Entity metadata attributes",
                },
                {
                  path: "Entity.png",
                  caption: "Viewing Entity metadata",
                },
                {
                  path: "Search.png",
                  caption: "Creating an advanced query",
                },
              ]}
            />
          </Flex>

          {/* Get Started */}
          <Flex
            id={"get-started"}
            h={"100vh"}
            direction={"column"}
            gap={"8"}
            pt={"8"}
            align={"center"}
          >
            <Heading>Get Started</Heading>
            <Text>
              There are three great ways to get started managing your metadata
              with Metadatify:
            </Text>
            <Flex
              w={"100%"}
              direction={"row"}
              justify={"space-around"}
              wrap={"wrap"}
              gap={["4", "8"]}
            >
              <Flex
                direction={"column"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.200"}
                p={"4"}
                gap={"4"}
                maxW={"sm"}
                bg={"white"}
                boxShadow={"sm"}
              >
                <Text fontWeight={"bold"}>Managed Hosting</Text>
                <Text>
                  You can sign up and login Metadatify using your ORCiD right
                  away! While in pre-release, Metadatify will be public and free
                  to use.
                </Text>
              </Flex>
              <Flex
                direction={"column"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.200"}
                p={"4"}
                gap={"4"}
                maxW={"sm"}
                bg={"white"}
                boxShadow={"sm"}
              >
                <Text fontWeight={"bold"}>Self-Hosted</Text>
                <Text>
                  Metadatify will remain open-source and accessible via GitHub.
                  Follow the documentation on GitHub to download and deploy your
                  own instance of Metadatify.
                </Text>
              </Flex>
              <Flex
                direction={"column"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.200"}
                p={"4"}
                gap={"4"}
                maxW={"sm"}
                bg={"white"}
                boxShadow={"sm"}
              >
                <Text fontWeight={"bold"}>GitHub</Text>
                <Flex>
                  <Image
                    alt="GitHub Repo stars"
                    src="https://img.shields.io/github/stars/Brain-Development-and-Disorders-Lab/mars"
                  />
                </Flex>
                <Text>
                  Since Metadatify is an open-source project, you can contribute
                  to further development! Get in touch with{" "}
                  <Link
                    color={"blue.500"}
                    href={"mailto:henry.burgess@wustl.edu"}
                  >
                    Henry Burgess
                  </Link>{" "}
                  to discuss ways to best make an impact on development.
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </ChakraProvider>
  );
};

export default App;
