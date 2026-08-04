// React
import React, { useEffect, useRef, useState } from "react";

// Chakra provider component
import { Avatar, Button, ChakraProvider, Flex, Heading, Image, Link, Spacer, Text } from "@chakra-ui/react";

// Custom components
import Carousel from "./components/Carousel";
import FeatureCard from "./components/FeatureCard";
import Icon from "./components/Icon";

// Custom styling
import "./css/styles.css";
import { theme } from "./styles/theme";

// Utility imports
import _ from "lodash";

// Images
import favicon from "./img/Favicon.png";
import attributeImage from "./img/Attribute.png";
import dashboardImage from "./img/Dashboard.png";
import entityImage from "./img/Entity.png";
import searchImage from "./img/Search.png";

// Offset applied to anchored sections so the sticky header never covers their heading
const SECTION_OFFSET = "96px";

const App = () => {
  const featuresRef = useRef({} as HTMLDivElement);
  const productRef = useRef({} as HTMLDivElement);
  const getStartedRef = useRef({} as HTMLDivElement);

  // Track scroll position to raise the header off the page once content scrolls beneath it
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <ChakraProvider theme={theme}>
      <Flex direction={"column"} minH={"100vh"} w={"100%"}>
        {/* Background gradient animation */}
        <Flex position={"absolute"} zIndex={1} bg={"white"} h={"100%"} w={"100%"} maxW={"100vw"} overflow={"hidden"}>
          <Flex
            position={"absolute"}
            inset={"0"}
            opacity={"0.6"}
            bgImage={"radial-gradient(rgba(14, 33, 70, 0.08) 1px, transparent 1px)"}
            bgSize={"28px 28px"}
          />
          <Flex
            position={"absolute"}
            filter={"blur(10px);"}
            rounded={"full"}
            w={"700px"}
            h={"450px"}
            bg={
              "linear-gradient(45deg, hsl(0deg 0% 100%) 0%, hsl(221deg 80% 88%) 25%, hsl(210deg 85% 82%) 50%, hsl(198deg 75% 80%) 75%, hsl(171deg 65% 78%) 100%)"
            }
            opacity={"10%"}
            top={"5%"}
            left={"2%"}
            animation={"animateRight 30s cubic-bezier(0.4, 0.65, 1.0, 0.775) infinite;"}
          />
          <Flex
            position={"absolute"}
            filter={"blur(10px);"}
            rounded={"full"}
            w={"200px"}
            h={"350px"}
            bg={
              "linear-gradient(45deg, hsl(0deg 0% 100%) 0%, hsl(221deg 80% 88%) 25%, hsl(210deg 85% 82%) 50%, hsl(198deg 75% 80%) 75%, hsl(171deg 65% 78%) 100%)"
            }
            opacity={"10%"}
            top={"40%"}
            left={"70%"}
            animation={"animateLeft 20s cubic-bezier(0.4, 0.65, 1.0, 0.775) infinite;"}
          />
        </Flex>

        {/* Floating header */}
        <Flex
          as={"header"}
          position={"sticky"}
          top={"0"}
          zIndex={100}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
          w={"100%"}
          px={["4", "8"]}
          py={"3"}
          bg={scrolled ? "whiteAlpha.900" : "whiteAlpha.600"}
          backdropFilter={"blur(12px)"}
          boxShadow={scrolled ? "card" : "none"}
          transition={"background 0.2s ease, box-shadow 0.2s ease"}
        >
          <Flex
            gap={"2"}
            align={"center"}
            cursor={"pointer"}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <Image src={favicon} w={"28px"} h={"28px"} rounded={"md"} />
            <Heading size={"md"} color={"brand.navy"}>
              Metadatify
            </Heading>
          </Flex>
          <Flex align={"center"} gap={"8"} display={["none", "none", "flex"]}>
            <Text
              as={"button"}
              fontWeight={"medium"}
              color={"text.muted"}
              _hover={{ color: "brand.navy" }}
              onClick={() => featuresRef.current.scrollIntoView({ behavior: "smooth" })}
            >
              Features
            </Text>
            <Text
              as={"button"}
              fontWeight={"medium"}
              color={"text.muted"}
              _hover={{ color: "brand.navy" }}
              onClick={() => productRef.current.scrollIntoView({ behavior: "smooth" })}
            >
              Product
            </Text>
            <Link
              fontWeight={"medium"}
              color={"text.muted"}
              _hover={{ color: "brand.navy", textDecoration: "none" }}
              href={"https://metadatify.com/docs/"}
              isExternal
            >
              Docs
            </Link>
            <Link href={"https://github.com/Brain-Development-and-Disorders-Lab/mars"} isExternal>
              <Icon name={"l_github"} color={"text.muted"} />
            </Link>
          </Flex>
          <Button
            as={Link}
            href={"https://app.metadatify.com"}
            isExternal
            rounded={"full"}
            size={"sm"}
            colorScheme={"blue"}
            rightIcon={<Icon name={"a_right"} size={"xs"} />}
            _hover={{ textDecoration: "none" }}
          >
            Log In
          </Button>
        </Flex>

        {/* Page content */}
        <Flex direction={"column"} gap={"4"} px={["4", "8"]} zIndex={2} flex={"1"}>
          {/* Hero */}
          <Flex
            id={"home"}
            style={{ scrollMarginTop: SECTION_OFFSET }}
            direction={["column", "row"]}
            gap={["8", "16"]}
            align={"center"}
            justify={"center"}
            minH={"85vh"}
            px={["2", "12"]}
            py={"8"}
          >
            <Flex direction={"column"} gap={"6"} maxW={["100%", "48%"]}>
              <Flex
                align={"center"}
                gap={"2"}
                w={"fit-content"}
                bg={"ai.light"}
                color={"ai.text"}
                px={"3"}
                py={"1"}
                rounded={"full"}
                fontSize={"sm"}
                fontWeight={"semibold"}
              >
                <Icon name={"lightning"} size={"xs"} color={"ai.default"} />
                <Text>New AI-powered features available</Text>
              </Flex>
              <Heading
                size={"2xl"}
                lineHeight={"shorter"}
                bgGradient={"linear(to-r, brand.navy, brand.royalBlue, brand.teal)"}
                bgClip={"text"}
              >
                Your lab's metadata, organized and always within reach.
              </Heading>
              <Text fontSize={"lg"} color={"text.muted"}>
                Metadatify helps research teams create structured records for samples, specimens, and experiments.
                Search in plain language or with a visual query builder, and keep your whole lab in sync with
                collaboration features.
              </Text>
              <Flex direction={"row"} gap={"4"} wrap={"wrap"}>
                <Button
                  rounded={"full"}
                  colorScheme={"blue"}
                  boxShadow={"glow"}
                  transition={"transform 0.15s ease"}
                  _hover={{ transform: "translateY(-1px)" }}
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
              <Flex
                direction={"column"}
                w={["90vw", "100%"]}
                rounded={"xl"}
                overflow={"hidden"}
                border={"1px"}
                borderColor={"border.default"}
                boxShadow={"cardHover"}
                bg={"white"}
              >
                <Flex align={"center"} gap={"1.5"} px={"3"} py={"2"} bg={"surface.muted"}>
                  <Flex w={"10px"} h={"10px"} rounded={"full"} bg={"#FF5F57"} />
                  <Flex w={"10px"} h={"10px"} rounded={"full"} bg={"#FEBC2E"} />
                  <Flex w={"10px"} h={"10px"} rounded={"full"} bg={"#28C840"} />
                </Flex>
                <Image src={dashboardImage} w={"100%"} />
              </Flex>
              <Text fontWeight={"semibold"} color={"text.subtle"} fontSize={"sm"}>
                Metadatify Dashboard
              </Text>
            </Flex>
          </Flex>

          {/* Core Features */}
          <Flex
            id={"product"}
            style={{ scrollMarginTop: SECTION_OFFSET }}
            direction={"column"}
            gap={"8"}
            py={"8"}
            align={"center"}
            ref={productRef}
          >
            <Flex direction={"column"} align={"center"} gap={"2"} textAlign={"center"}>
              <Heading>Built for research teams</Heading>
              <Text color={"text.muted"}>Core tools for creating, organizing, and tracking scientific metadata.</Text>
            </Flex>
            <Flex direction={"row"} justify={"center"} wrap={"wrap"} gap={["4", "6"]} w={"100%"} maxW={"5xl"}>
              <FeatureCard
                icon={"create"}
                title={"Structured Metadata"}
                description={
                  "Define reusable Templates once and apply consistent Attribute structures across every Entity in your workspace."
                }
              />
              <FeatureCard
                icon={"project"}
                title={"Projects"}
                description={
                  "Group Entities into Projects to track experimental cohorts, sample batches, or any collection your lab workflow requires."
                }
              />
              <FeatureCard
                icon={"person"}
                title={"Collaboration"}
                description={
                  "Add collaborators via email. Everyone in a shared Workspace sees the same metadata, always current."
                }
              />
              <FeatureCard
                icon={"scan"}
                title={"Physical Tracking"}
                description={
                  "Every Entity has a unique identifier compatible with USB barcode and QR code scanners. Point a scanner at a specimen label and jump straight to its metadata record."
                }
              />
              <FeatureCard
                icon={"clock"}
                title={"Version History"}
                description={
                  "Every change is tracked. Browse the full edit history of any Entity, Project, or Template and restore earlier versions whenever needed."
                }
              />
              <FeatureCard
                icon={"download"}
                title={"Multi-Format Export"}
                description={
                  "Export metadata as CSV or JSON from individual Entities, hand-picked selections, or entire Projects at any time."
                }
              />
            </Flex>

            <Carousel
              images={[
                {
                  path: attributeImage,
                  caption: "Editing an Entity Attribute",
                },
                {
                  path: entityImage,
                  caption: "Viewing Entity metadata",
                },
                {
                  path: searchImage,
                  caption: "Natural language and advanced query search",
                },
              ]}
            />
          </Flex>

          {/* AI Features */}
          <Flex
            id={"features"}
            style={{ scrollMarginTop: SECTION_OFFSET }}
            direction={"column"}
            gap={"8"}
            py={"12"}
            px={["4", "16"]}
            my={"8"}
            align={"center"}
            bg={"ai.light"}
            rounded={"2xl"}
            ref={featuresRef}
          >
            <Flex direction={"column"} align={"center"} gap={"2"} textAlign={"center"}>
              <Flex align={"center"} gap={"2"}>
                <Icon name={"lightning"} size={"md"} color={"ai.default"} />
                <Heading color={"ai.text"}>AI features built in</Heading>
              </Flex>
              <Text color={"ai.text"} maxW={"55ch"}>
                Three AI features built directly into the platform to reduce the time you spend on metadata management.
              </Text>
            </Flex>
            <Flex direction={["column", "row"]} gap={"6"} justify={"center"} wrap={"wrap"} w={"100%"}>
              <FeatureCard
                accent={"ai"}
                icon={"search"}
                title={"Natural Language Search"}
                description={
                  "Describe what you need in plain English. Metadatify translates your query into a precise search against your metadata, without needing to configure filters manually."
                }
              />
              <FeatureCard
                accent={"ai"}
                icon={"upload"}
                title={"Smart Import Mapping"}
                description={
                  "Importing a legacy spreadsheet? Metadatify reads your column headers and suggests the right field mapping automatically, getting your data in cleanly without manual guesswork."
                }
              />
              <FeatureCard
                accent={"ai"}
                icon={"lightning"}
                title={"Template Matching"}
                description={
                  "Name and describe a new Entity and Metadatify will suggest the best-fit metadata Template from your library, keeping Attribute structures consistent across similar Entities."
                }
              />
            </Flex>
          </Flex>

          {/* Get Started */}
          <Flex
            id={"get-started"}
            style={{ scrollMarginTop: SECTION_OFFSET }}
            direction={"column"}
            gap={"8"}
            pt={"8"}
            align={"center"}
            ref={getStartedRef}
          >
            <Heading>Get Started</Heading>
            <Text maxW={"55ch"} textAlign={"center"} color={"text.muted"}>
              Metadatify is available as a managed cloud service or can be self-hosted on your own infrastructure. Not
              sure which fits your lab? Reach out to{" "}
              <Link color={"blue.600"} href={"mailto:henry.burgess@wustl.edu"}>
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
                borderColor={"border.default"}
                p={"4"}
                gap={"4"}
                maxW={"sm"}
                bg={"white"}
                boxShadow={"card"}
                transition={"transform 0.2s ease, box-shadow 0.2s ease"}
                _hover={{ boxShadow: "cardHover", transform: "translateY(-4px)" }}
              >
                <Flex align={"center"} justify={"center"} w={"12"} h={"12"} rounded={"md"} bg={"blue.50"}>
                  <Icon name={"serv_managed_hosted"} size={"md"} color={"blue.600"} />
                </Flex>
                <Text fontWeight={"bold"}>Managed Hosting</Text>
                <Text>Sign in and start building your metadata library right away. No setup required.</Text>
                <Spacer />
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Link color={"blue.600"} href={"https://app.metadatify.com"} isExternal>
                    Log In
                  </Link>
                  <Icon name={"a_right"} color={"blue.600"} />
                </Flex>
              </Flex>
              <Flex
                direction={"column"}
                rounded={"md"}
                border={"1px"}
                borderColor={"border.default"}
                p={"4"}
                gap={"4"}
                maxW={"sm"}
                bg={"white"}
                boxShadow={"card"}
                transition={"transform 0.2s ease, box-shadow 0.2s ease"}
                _hover={{ boxShadow: "cardHover", transform: "translateY(-4px)" }}
              >
                <Flex align={"center"} justify={"center"} w={"12"} h={"12"} rounded={"md"} bg={"blue.50"}>
                  <Icon name={"serv_self_hosted"} size={"md"} color={"blue.600"} />
                </Flex>
                <Text fontWeight={"bold"}>Self-Hosted</Text>
                <Text>Run Metadatify on your own hardware for full control over your data and infrastructure.</Text>
                <Spacer />
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Link color={"blue.600"} href={"https://metadatify.com/docs/"} isExternal>
                    Documentation
                  </Link>
                  <Icon name={"a_right"} color={"blue.600"} />
                </Flex>
              </Flex>
              <Flex
                direction={"column"}
                rounded={"md"}
                border={"1px"}
                borderColor={"border.default"}
                p={"4"}
                gap={"4"}
                maxW={"sm"}
                bg={"white"}
                boxShadow={"card"}
                transition={"transform 0.2s ease, box-shadow 0.2s ease"}
                _hover={{ boxShadow: "cardHover", transform: "translateY(-4px)" }}
              >
                <Flex align={"center"} justify={"center"} w={"12"} h={"12"} rounded={"md"} bg={"blue.50"}>
                  <Icon name={"l_github"} size={"md"} color={"blue.600"} />
                </Flex>
                <Text fontWeight={"bold"}>Open Source</Text>
                <Text>Metadatify is open source. Browse the code, file issues, or contribute on GitHub.</Text>
                <Spacer />
                <Flex direction={"row"} gap={"1"} align={"center"} wrap={"wrap"}>
                  <Link
                    color={"blue.600"}
                    href={"https://github.com/Brain-Development-and-Disorders-Lab/mars"}
                    isExternal
                  >
                    GitHub Repository
                  </Link>
                  <Icon name={"a_right"} color={"blue.600"} />
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
                borderColor={"border.default"}
                p={"4"}
                gap={"4"}
                maxW={"sm"}
                bg={"white"}
                boxShadow={"card"}
                transition={"transform 0.2s ease, box-shadow 0.2s ease"}
                _hover={{ boxShadow: "cardHover", transform: "translateY(-4px)" }}
              >
                <Flex align={"center"} justify={"center"} w={"12"} h={"12"} rounded={"md"} bg={"blue.50"}>
                  <Icon name={"info"} size={"md"} color={"blue.600"} />
                </Flex>
                <Text fontWeight={"bold"}>Documentation</Text>
                <Text>
                  In-depth guides covering every feature, import and export workflows, and self-hosting setup.
                </Text>
                <Spacer />
                <Flex direction={"row"} gap={"1"} align={"center"}>
                  <Link color={"blue.600"} href={"https://metadatify.com/docs/"} isExternal>
                    Documentation
                  </Link>
                  <Icon name={"a_right"} color={"blue.600"} />
                </Flex>
              </Flex>
            </Flex>

            {/* Acknowledgements */}
            <Flex direction={"column"} gap={"6"} w={"100%"} pt={"8"} pb={"8"} align={"center"}>
              <Heading size={"lg"}>Acknowledgements</Heading>
              <Flex direction={"column"} align={"center"} gap={"1"}>
                <Text fontWeight={"semibold"} color={"text.subtle"} pb={"1"}>
                  Organizations
                </Text>
                <Text color={"text.muted"} textAlign={"center"}>
                  Department of Neuroscience, Washington University School of Medicine in St. Louis
                </Text>
                <Text color={"text.muted"} textAlign={"center"}>
                  Brain Development and Disorders Lab, Washington University School of Medicine in St. Louis
                </Text>
                <Text color={"text.muted"} textAlign={"center"}>
                  Scientific Software Engineering Center, Georgia Tech
                </Text>
              </Flex>
              <Flex direction={"column"} align={"center"} gap={"3"}>
                <Text fontWeight={"semibold"} color={"text.subtle"}>
                  People
                </Text>
                <Flex direction={"row"} gap={"4"} justify={"center"} wrap={"wrap"}>
                  <Flex
                    direction={"column"}
                    gap={"2"}
                    p={"4"}
                    rounded={"md"}
                    border={"1px"}
                    borderColor={"border.default"}
                    bg={"white"}
                    align={"center"}
                    justify={"center"}
                    w={"160px"}
                  >
                    <Text fontWeight={"semibold"} color={"text.faint"}>
                      Lead Developer
                    </Text>
                    <Avatar name={"Henry Burgess"} src={"https://avatars.githubusercontent.com/u/60735885"} />
                    <Text fontWeight={"semibold"}>Henry Burgess</Text>
                    <Link color={"blue.600"} href={"https://github.com/henryjburg"}>
                      GitHub
                    </Link>
                  </Flex>
                  <Flex
                    direction={"column"}
                    gap={"2"}
                    p={"4"}
                    rounded={"md"}
                    border={"1px"}
                    borderColor={"border.default"}
                    bg={"white"}
                    align={"center"}
                    justify={"center"}
                    w={"160px"}
                  >
                    <Text fontWeight={"semibold"} color={"text.faint"}>
                      Collaborator
                    </Text>
                    <Avatar name={"Robin Fievet"} src={"https://avatars.githubusercontent.com/u/11888851"} />
                    <Text fontWeight={"semibold"}>Robin Fievet</Text>
                    <Link color={"blue.600"} href={"https://github.com/rfievet"}>
                      GitHub
                    </Link>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        {/* Footer */}
        <Flex direction={"column"} zIndex={2} bg={"brand.navy"} color={"white"} px={["4", "8"]} py={"10"} gap={"6"}>
          <Flex
            direction={["column", "row"]}
            justify={"space-between"}
            align={["flex-start", "center"]}
            gap={"6"}
            w={"100%"}
            maxW={"6xl"}
            mx={"auto"}
          >
            <Flex align={"center"} gap={"2"}>
              <Image src={favicon} w={"22px"} h={"22px"} rounded={"sm"} />
              <Text fontWeight={"bold"}>Metadatify</Text>
            </Flex>
            <Flex align={"center"} gap={"6"} wrap={"wrap"}>
              <Link
                color={"whiteAlpha.800"}
                _hover={{ color: "white" }}
                href={"https://metadatify.com/docs/"}
                isExternal
              >
                Documentation
              </Link>
              <Link
                color={"whiteAlpha.800"}
                _hover={{ color: "white" }}
                href={"https://github.com/Brain-Development-and-Disorders-Lab/mars"}
                isExternal
              >
                GitHub
              </Link>
              <Link color={"whiteAlpha.800"} _hover={{ color: "white" }} href={"https://app.metadatify.com"} isExternal>
                Log In
              </Link>
            </Flex>
          </Flex>
          <Flex borderTop={"1px"} borderColor={"whiteAlpha.200"} pt={"6"} justify={"center"}>
            <Text fontSize={"sm"} color={"whiteAlpha.600"} textAlign={"center"}>
              © {new Date().getFullYear()} Metadatify. Department of Neuroscience, Washington University School of
              Medicine in St. Louis.
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </ChakraProvider>
  );
};

export default App;
