// React
import React, { useRef } from "react";

// Chakra provider component
import { Avatar, Button, ChakraProvider, Flex, Heading, Image, Link, Spacer, Text } from "@chakra-ui/react";

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
      {/* Background gradient animation */}
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
          animation={"animateRight 30s cubic-bezier(0.4, 0.65, 1.0, 0.775) infinite;"}
        />
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
          animation={"animateLeft 20s cubic-bezier(0.4, 0.65, 1.0, 0.775) infinite;"}
        />
      </Flex>

      {/* Main content */}
      <Flex direction={"column"} minH={"100vh"} w={"100%"} p={"4"} m={"0"}>
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
            <Flex gap={"2"} align={"center"} rounded={"full"} p={"4"}>
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

          {/* Hero */}
          <Flex
            id={"home"}
            direction={["column", "row"]}
            gap={["8", "16"]}
            align={"center"}
            justify={"center"}
            minH={"90vh"}
            px={["2", "12"]}
            py={"8"}
          >
            <Flex direction={"column"} gap={"6"} maxW={["100%", "48%"]}>
              <Heading size={"2xl"} lineHeight={"shorter"}>
                Your lab's metadata, organized and always within reach.
              </Heading>
              <Text fontSize={"lg"} color={"gray.600"}>
                Metadatify helps research teams create structured records for samples, specimens, and experiments.
                Search in plain language or with a visual query builder, and keep your whole lab in sync using ORCiD.
              </Text>
              <Flex direction={"row"} gap={"4"} wrap={"wrap"}>
                <Button
                  rounded={"full"}
                  colorScheme={"blue"}
                  onClick={() => featuresRef.current.scrollIntoView({ behavior: "smooth" })}
                >
                  See Features
                </Button>
                <Button
                  rounded={"full"}
                  colorScheme={"blue"}
                  variant={"outline"}
                  onClick={() => getStartedRef.current.scrollIntoView({ behavior: "smooth" })}
                >
                  Get Started
                </Button>
                <Button
                  rounded={"full"}
                  colorScheme={"blue"}
                  variant={"ghost"}
                  as={Link}
                  href={"https://metadatify.com/docs/"}
                  isExternal
                >
                  Documentation
                </Button>
              </Flex>
            </Flex>
            <Flex direction={"column"} flex={["none", 1]} align={"center"} gap={"2"}>
              <Image src={"Dashboard.png"} maxW={["90vw", "100%"]} rounded={"xl"} boxShadow={"lg"} />
              <Text fontWeight={"semibold"} color={"gray.500"} fontSize={"sm"}>
                Metadatify Dashboard
              </Text>
            </Flex>
          </Flex>

          {/* AI Features */}
          <Flex
            direction={"column"}
            gap={"8"}
            py={"12"}
            px={["4", "16"]}
            my={"8"}
            align={"center"}
            bg={"purple.50"}
            rounded={"2xl"}
            ref={featuresRef}
          >
            <Flex direction={"column"} align={"center"} gap={"2"} textAlign={"center"}>
              <Flex align={"center"} gap={"2"}>
                <Icon name={"lightning"} size={"md"} color={"purple.500"} />
                <Heading color={"purple.800"}>AI features built in</Heading>
              </Flex>
              <Text color={"purple.700"} maxW={"55ch"}>
                Three AI features built directly into the platform to reduce the time you spend on metadata management.
              </Text>
            </Flex>
            <Flex direction={["column", "row"]} gap={"6"} justify={"center"} wrap={"wrap"} w={"100%"}>
              <Flex
                direction={"column"}
                rounded={"lg"}
                border={"1px"}
                borderColor={"purple.100"}
                bg={"white"}
                p={"6"}
                gap={"3"}
                maxW={"sm"}
                boxShadow={"sm"}
              >
                <Icon name={"search"} size={"lg"} color={"purple.500"} />
                <Text fontWeight={"bold"} fontSize={"lg"}>
                  Natural Language Search
                </Text>
                <Text color={"gray.600"}>
                  Describe what you need in plain English. Metadatify translates your query into a precise search
                  against your metadata, without needing to configure filters manually.
                </Text>
              </Flex>
              <Flex
                direction={"column"}
                rounded={"lg"}
                border={"1px"}
                borderColor={"purple.100"}
                bg={"white"}
                p={"6"}
                gap={"3"}
                maxW={"sm"}
                boxShadow={"sm"}
              >
                <Icon name={"upload"} size={"lg"} color={"purple.500"} />
                <Text fontWeight={"bold"} fontSize={"lg"}>
                  Smart Import Mapping
                </Text>
                <Text color={"gray.600"}>
                  Importing a legacy spreadsheet? Metadatify reads your column headers and suggests the right field
                  mapping automatically, getting your data in cleanly without manual guesswork.
                </Text>
              </Flex>
              <Flex
                direction={"column"}
                rounded={"lg"}
                border={"1px"}
                borderColor={"purple.100"}
                bg={"white"}
                p={"6"}
                gap={"3"}
                maxW={"sm"}
                boxShadow={"sm"}
              >
                <Icon name={"lightning"} size={"lg"} color={"purple.500"} />
                <Text fontWeight={"bold"} fontSize={"lg"}>
                  Template Matching
                </Text>
                <Text color={"gray.600"}>
                  Name and describe a new entity and Metadatify will suggest the best-fit metadata template from your
                  library, keeping attribute structures consistent across similar entities.
                </Text>
              </Flex>
            </Flex>
          </Flex>

          {/* Core Features */}
          <Flex direction={"column"} gap={"8"} py={"8"} align={"center"}>
            <Flex direction={"column"} align={"center"} gap={"2"} textAlign={"center"}>
              <Heading>Built for research teams</Heading>
              <Text color={"gray.600"}>Core tools for creating, organizing, and tracking scientific metadata.</Text>
            </Flex>
            <Flex direction={"row"} justify={"center"} wrap={"wrap"} gap={["4", "6"]} w={"100%"} maxW={"5xl"}>
              <Flex
                direction={"column"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.200"}
                p={"5"}
                gap={"3"}
                maxW={"sm"}
                bg={"white"}
                boxShadow={"sm"}
              >
                <Icon name={"create"} size={"lg"} />
                <Text fontWeight={"bold"} fontSize={"lg"}>
                  Structured Metadata
                </Text>
                <Text color={"gray.600"}>
                  Define reusable Templates once and apply consistent attribute structures across every entity in your
                  workspace.
                </Text>
              </Flex>
              <Flex
                direction={"column"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.200"}
                p={"5"}
                gap={"3"}
                maxW={"sm"}
                bg={"white"}
                boxShadow={"sm"}
              >
                <Icon name={"project"} size={"lg"} />
                <Text fontWeight={"bold"} fontSize={"lg"}>
                  Projects
                </Text>
                <Text color={"gray.600"}>
                  Group entities into Projects to track experimental cohorts, sample batches, or any collection your lab
                  workflow requires.
                </Text>
              </Flex>
              <Flex
                direction={"column"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.200"}
                p={"5"}
                gap={"3"}
                maxW={"sm"}
                bg={"white"}
                boxShadow={"sm"}
              >
                <Icon name={"person"} size={"lg"} />
                <Text fontWeight={"bold"} fontSize={"lg"}>
                  Collaboration
                </Text>
                <Text color={"gray.600"}>
                  Add lab members by their ORCiD. Everyone in a shared Workspace sees the same metadata, always current.
                </Text>
              </Flex>
              <Flex
                direction={"column"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.200"}
                p={"5"}
                gap={"3"}
                maxW={"sm"}
                bg={"white"}
                boxShadow={"sm"}
              >
                <Icon name={"scan"} size={"lg"} />
                <Text fontWeight={"bold"} fontSize={"lg"}>
                  Physical Tracking
                </Text>
                <Text color={"gray.600"}>
                  Every entity has a unique identifier compatible with USB barcode and QR code scanners. Point a scanner
                  at a specimen label and jump straight to its metadata record.
                </Text>
              </Flex>
              <Flex
                direction={"column"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.200"}
                p={"5"}
                gap={"3"}
                maxW={"sm"}
                bg={"white"}
                boxShadow={"sm"}
              >
                <Icon name={"clock"} size={"lg"} />
                <Text fontWeight={"bold"} fontSize={"lg"}>
                  Version History
                </Text>
                <Text color={"gray.600"}>
                  Every change is tracked. Browse the full edit history of any entity and restore earlier versions
                  whenever needed.
                </Text>
              </Flex>
              <Flex
                direction={"column"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.200"}
                p={"5"}
                gap={"3"}
                maxW={"sm"}
                bg={"white"}
                boxShadow={"sm"}
              >
                <Icon name={"download"} size={"lg"} />
                <Text fontWeight={"bold"} fontSize={"lg"}>
                  Multi-Format Export
                </Text>
                <Text color={"gray.600"}>
                  Export metadata as CSV or JSON from individual entities, hand-picked selections, or entire projects at
                  any time.
                </Text>
              </Flex>
            </Flex>

            <Carousel
              images={[
                {
                  path: "Attribute.png",
                  caption: "Editing entity metadata attributes",
                },
                {
                  path: "Entity.png",
                  caption: "Viewing entity metadata",
                },
                {
                  path: "Search.png",
                  caption: "Natural language and advanced query search",
                },
              ]}
            />
          </Flex>

          {/* Get Started */}
          <Flex direction={"column"} gap={"8"} pt={"8"} align={"center"} ref={getStartedRef}>
            <Heading>Get Started</Heading>
            <Text maxW={"55ch"} textAlign={"center"} color={"gray.600"}>
              Metadatify is available as a managed cloud service or can be self-hosted on your own infrastructure. Not
              sure which fits your lab? Reach out to{" "}
              <Link color={"blue.500"} href={"mailto:henry.burgess@wustl.edu"}>
                Henry Burgess
              </Link>
              .
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
                <Text>Sign in and start building your metadata library right away. No setup required.</Text>
                <Spacer />
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Link color={"blue.500"} href={"https://app.metadatify.com"} isExternal>
                    Log In
                  </Link>
                  <Icon name={"a_right"} color={"blue.500"} />
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
                <Text>Run Metadatify on your own hardware for full control over your data and infrastructure.</Text>
                <Spacer />
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Link color={"blue.500"} href={"https://metadatify.com/docs/"} isExternal>
                    Documentation
                  </Link>
                  <Icon name={"a_right"} color={"blue.500"} />
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
                <Text fontWeight={"bold"}>Open Source</Text>
                <Text>Metadatify is open source. Browse the code, file issues, or contribute on GitHub.</Text>
                <Spacer />
                <Flex direction={"row"} gap={"1"} align={"center"} wrap={"wrap"}>
                  <Link
                    color={"blue.500"}
                    href={"https://github.com/Brain-Development-and-Disorders-Lab/mars"}
                    isExternal
                  >
                    GitHub Repository
                  </Link>
                  <Icon name={"a_right"} color={"blue.500"} />
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
                  In-depth guides covering every feature, import and export workflows, and self-hosting setup.
                </Text>
                <Spacer />
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Link color={"blue.500"} href={"https://metadatify.com/docs/"} isExternal>
                    Documentation
                  </Link>
                  <Icon name={"a_right"} color={"blue.500"} />
                </Flex>
              </Flex>
            </Flex>

            {/* Acknowledgements */}
            <Flex direction={"column"} gap={"6"} w={"100%"} pt={"8"} pb={"8"} align={"center"}>
              <Heading size={"lg"}>Acknowledgements</Heading>
              <Flex direction={"column"} align={"center"} gap={"1"}>
                <Text fontWeight={"semibold"} color={"gray.500"} pb={"1"}>
                  Organizations
                </Text>
                <Text color={"gray.600"} textAlign={"center"}>
                  Department of Neuroscience, Washington University School of Medicine in St. Louis
                </Text>
                <Text color={"gray.600"} textAlign={"center"}>
                  Brain Development and Disorders Lab, Washington University School of Medicine in St. Louis
                </Text>
                <Text color={"gray.600"} textAlign={"center"}>
                  Scientific Software Engineering Center, Georgia Tech
                </Text>
              </Flex>
              <Flex direction={"column"} align={"center"} gap={"3"}>
                <Text fontWeight={"semibold"} color={"gray.500"}>
                  People
                </Text>
                <Flex direction={"row"} gap={"4"} justify={"center"} wrap={"wrap"}>
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
                    <Avatar name={"Henry Burgess"} src={"https://avatars.githubusercontent.com/u/60735885"} />
                    <Text fontWeight={"semibold"}>Henry Burgess</Text>
                    <Link color={"blue.500"} href={"https://github.com/henryjburg"}>
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
                    <Avatar name={"Robin Fievet"} src={"https://avatars.githubusercontent.com/u/11888851"} />
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
      </Flex>
    </ChakraProvider>
  );
};

export default App;
