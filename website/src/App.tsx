// React
import React, { useRef } from "react";

// Chakra provider component
import {
  Avatar,
  Button,
  ChakraProvider,
  Flex,
  Heading,
  Image,
  Link,
  ListItem,
  Spacer,
  Text,
  UnorderedList,
} from "@chakra-ui/react";

// Custom components
import Carousel from "./components/Carousel";
import Icon from "./components/Icon";

// Custom styling
import "./css/styles.css";

// Utility imports
import _ from "lodash";

const App = () => {
  const featuresRef = useRef({} as HTMLDivElement);
  const getStartedRef = useRef({} as HTMLDivElement);

  return (
    <ChakraProvider>
      {/* Background motion and colour effects */}
      <Flex
        position={"absolute"}
        filter={"blur(10px);"}
        zIndex={1}
        bg={"white"}
        h={"100%"}
        w={"100%"}
        maxW={"100vw"}
        overflow={"hidden"}
      >
        <Flex
          position={"absolute"}
          rounded={"full"}
          w={"700px"}
          h={"450px"}
          bg={
            "linear-gradient(45deg, hsl(0deg 0% 100%) 0%, hsl(231deg 80% 89%) 19%, hsl(227deg 79% 78%) 33%, hsl(240deg 80% 81%) 45%, hsl(265deg 86% 85%) 56%, hsl(300deg 64% 83%) 67%, hsl(337deg 88% 82%) 80%, hsl(0deg 77% 79%) 100%)"
          }
          opacity={"10%"}
          top={"5%"}
          left={"2%"}
          animation={
            "animateRight 30s cubic-bezier(0.4, 0.65, 1.0, 0.775) infinite;"
          }
        ></Flex>
        <Flex
          position={"absolute"}
          rounded={"full"}
          w={"200px"}
          h={"350px"}
          bg={
            "linear-gradient(45deg, hsl(0deg 0% 100%) 0%, hsl(231deg 80% 89%) 19%, hsl(227deg 79% 78%) 33%, hsl(240deg 80% 81%) 45%, hsl(265deg 86% 85%) 56%, hsl(300deg 64% 83%) 67%, hsl(337deg 88% 82%) 80%, hsl(0deg 77% 79%) 100%)"
          }
          opacity={"10%"}
          top={"40%"}
          left={"70%"}
          animation={
            "animateLeft 20s cubic-bezier(0.4, 0.65, 1.0, 0.775) infinite;"
          }
        ></Flex>
      </Flex>

      {/* Main content */}
      <Flex
        direction={"column"}
        minH={"100vh"}
        w={"100%"}
        p={"4"}
        m={"0"}
        gap={"0"}
      >
        <Flex direction={"column"} p={"4"} zIndex={2}>
          {/* Header */}
          <Flex
            direction={"row"}
            gap={"2"}
            justify={"space-between"}
            align={"center"}
            w={"100%"}
            px={["", "6"]}
            py={["", "2"]}
          >
            <Flex
              gap={"2"}
              align={"center"}
              rounded={"full"}
              p={"4"}
              border={"2px"}
              borderColor={"#2E3192"}
            >
              <Image src={"Favicon.png"} w={"25px"} h={"25px"} />
              <Heading size={"md"} color={"#2E3192"}>
                Metadatify
              </Heading>
            </Flex>
            <Flex align={"center"} gap={"1"}>
              <Link href={"https://app.metadatify.com"} isExternal>
                Log In
              </Link>
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
            <Flex
              direction={"column"}
              align={"center"}
              justify={"center"}
              gap={"8"}
              minH={["60vh", "40vh"]}
            >
              {/* Add some colour and gradients to this landing */}
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
                Metadatify makes reusing, sharing, and securely collaborating on
                your scientific metadata easy.
              </Text>

              <Flex direction={"row"} gap={"6"} align={"center"}>
                <Button
                  rounded={"full"}
                  p={"4"}
                  boxShadow={"xs"}
                  colorScheme={"blue"}
                  onClick={() =>
                    featuresRef.current.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Features
                </Button>
                <Button
                  rounded={"full"}
                  p={"4"}
                  boxShadow={"xs"}
                  colorScheme={"blue"}
                  as={Link}
                  onClick={() =>
                    getStartedRef.current.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Get Started
                </Button>
              </Flex>
            </Flex>

            <Flex
              direction={"column"}
              h={["30vh", "100%"]}
              align={"center"}
              justify={"center"}
              gap={"2"}
            >
              <Image
                src={"Dashboard.png"}
                maxW={"80vw"}
                rounded={"xl"}
                boxShadow={"lg"}
              />
              <Text fontWeight={"semibold"} color={"gray.600"}>
                Metadatify Dashboard
              </Text>
            </Flex>
          </Flex>

          {/* Features */}
          <Flex
            minH={"100vh"}
            direction={"column"}
            gap={"4"}
            pt={"8"}
            align={"center"}
            ref={featuresRef}
          >
            <Heading>Features</Heading>
            <Text color={"gray.600"}>
              Powerful features to improve your metadata management workflow.
            </Text>
            <Flex
              w={"100%"}
              direction={"row"}
              justify={"center"}
              wrap={"wrap"}
              pb={"8"}
              gap={["4", "8"]}
              maxW={["", "80vw"]}
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
                  Create and manage metadata Entities inside <b>Workspaces</b>,
                  and use <b>Templates</b> for reusable metadata structures.
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
                  Within your Workspace, group and organize metadata Entities
                  into <b>Projects</b>.
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
                  should be too. Visualize relationships between metadata{" "}
                  <b>Entities</b>.
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
                  <b>query builder</b> to perform deep searches on metadata
                  Entities.
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
            direction={"column"}
            gap={"8"}
            pt={"8"}
            align={"center"}
            ref={getStartedRef}
          >
            <Heading>Get Started</Heading>
            <Text maxW={["", "50vw"]}>
              There are multiple ways to get started with Metadatify. If you are
              unsure where to start or want to know how Metadatify would best
              suit your needs, please don't hesitate to contact{" "}
              <Link color={"blue.500"} href={"mailto:henry.burgess@wustl.edu"}>
                Henry Burgess
              </Link>
              !
            </Text>
            <Flex
              w={"100%"}
              direction={"row"}
              justify={"space-around"}
              wrap={"wrap"}
              gap={["4", "8"]}
              maxW={["", "80vw"]}
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
                <Icon name={"serv_managed_hosted"} size={"lg"} />
                <Text fontWeight={"bold"}>Managed Hosting</Text>
                <Text>
                  Does your team already have access? You can log in right away
                  with your ORCiD.
                </Text>
                <Spacer />

                <Flex direction={"row"} justify={"space-between"}>
                  <Flex direction={"row"} gap={"1"} align={"center"}>
                    <Link
                      color={"blue.500"}
                      href={"https://app.metadatify.com"}
                      isExternal
                    >
                      Log In
                    </Link>
                    <Icon name={"link"} color={"blue.500"} />
                  </Flex>
                </Flex>
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
                <Icon name={"serv_self_hosted"} size={"lg"} />
                <Text fontWeight={"bold"}>Self-Hosted</Text>
                <Text>
                  Documentation on how to deploy your own instance of Metadatify
                  will be available soon.
                </Text>
                <Spacer />
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Link
                    color={"blue.500"}
                    href={
                      "https://github.com/Brain-Development-and-Disorders-Lab/mars/wiki"
                    }
                    isExternal
                  >
                    Documentation (coming soon)
                  </Link>
                  <Icon name={"link"} color={"blue.500"} />
                </Flex>
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
                <Icon name={"l_github"} size={"lg"} />
                <Text fontWeight={"bold"}>GitHub</Text>
                <Text>
                  Metadatify is an open-source project, you can contribute to
                  further development! Get in touch with{" "}
                  <Link
                    color={"blue.500"}
                    href={"mailto:henry.burgess@wustl.edu"}
                  >
                    Henry Burgess
                  </Link>{" "}
                  to discuss ways to best make an impact on development.
                </Text>
                <Spacer />
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Link
                    color={"blue.500"}
                    href={
                      "https://github.com/Brain-Development-and-Disorders-Lab/mars"
                    }
                    isExternal
                  >
                    GitHub Repository
                  </Link>
                  <Icon name={"link"} color={"blue.500"} />
                  <Spacer />
                  <Image
                    alt="GitHub Repo stars"
                    src="https://img.shields.io/github/stars/Brain-Development-and-Disorders-Lab/mars"
                  />
                </Flex>
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
                <Icon name={"info"} size={"lg"} />
                <Text fontWeight={"bold"}>Documentation</Text>
                <Text>
                  Further documentation on usage and development with Metadatify
                  can be found in the wiki on GitHub.
                </Text>
                <Spacer />
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Link
                    color={"blue.500"}
                    href={
                      "https://github.com/Brain-Development-and-Disorders-Lab/mars/wiki"
                    }
                    isExternal
                  >
                    GitHub Wiki
                  </Link>
                  <Icon name={"link"} color={"blue.500"} />
                </Flex>
              </Flex>
            </Flex>
            <Flex direction={"column"} gap={"2"}>
              <Flex justify={"center"} pb={"4"}>
                <Heading size={"lg"}>Acknowledgements</Heading>
              </Flex>
              <Text fontWeight={"semibold"}>Organizations:</Text>
              <UnorderedList>
                <ListItem>
                  <Text>
                    Department of Neuroscience, Washington University School of
                    Medicine in St. Louis
                  </Text>
                </ListItem>
                <ListItem>
                  <Text>
                    Brain Development and Disorders Lab, Washington University
                    School of Medicine in St. Louis
                  </Text>
                </ListItem>
                <ListItem>
                  <Text>
                    Scientific Software Engineering Center, Georgia Tech
                  </Text>
                </ListItem>
              </UnorderedList>

              <Text fontWeight={"semibold"}>People:</Text>
              <Flex direction={"row"} gap={"2"}>
                <Flex
                  direction={"column"}
                  gap={"2"}
                  p={"4"}
                  rounded={"md"}
                  border={"1px"}
                  borderColor={"gray.200"}
                  bg={"white"}
                  align={"center"}
                  justify={"center"}
                  w={"160px"}
                >
                  <Text fontWeight={"semibold"} color={"gray.400"}>
                    Lead Developer
                  </Text>
                  <Avatar
                    name={"Henry Burgess"}
                    src={"https://avatars.githubusercontent.com/u/60735885"}
                  />
                  <Text fontWeight={"semibold"}>Henry Burgess</Text>
                  <Link
                    color={"blue.500"}
                    href={"https://github.com/henryjburg"}
                  >
                    GitHub
                  </Link>
                </Flex>
                <Flex
                  direction={"column"}
                  gap={"2"}
                  p={"4"}
                  rounded={"md"}
                  border={"1px"}
                  borderColor={"gray.200"}
                  bg={"white"}
                  align={"center"}
                  justify={"center"}
                  w={"160px"}
                >
                  <Text fontWeight={"semibold"} color={"gray.400"}>
                    Collaborator
                  </Text>
                  <Avatar
                    name={"Robin Fievet"}
                    src={"https://avatars.githubusercontent.com/u/11888851"}
                  />
                  <Text fontWeight={"semibold"}>Robin Fievet</Text>
                  <Link color={"blue.500"} href={"https://github.com/rfievet"}>
                    GitHub
                  </Link>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </ChakraProvider>
  );
};

export default App;
