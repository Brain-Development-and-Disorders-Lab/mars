// React
import React, { useEffect, useState } from "react";

// Chakra provider component
import {
  Avatar,
  Box,
  Button,
  ChakraProvider,
  Code,
  Flex,
  Heading,
  IconButton,
  Image,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  SimpleGrid,
  Text,
  useClipboard,
} from "@chakra-ui/react";

// Custom components
import FeatureCard from "./components/FeatureCard";
import FeatureShowcase from "./components/FeatureShowcase";
import Icon from "./components/Icon";
import PathCard from "./components/PathCard";
import ResourceLink from "./components/ResourceLink";

// Custom styling
import "./css/styles.css";
import { theme } from "./styles/theme";

// Site configuration
import { CONTACT_EMAIL, DEMO_WORKSPACE_URL } from "./config";

// Images
import logo from "./img/Logo.png";
import attributeImage from "./img/Attribute.webp";
import dashboardImage from "./img/Dashboard.webp";
import entityImage from "./img/Entity.webp";
import searchImage from "./img/Search.webp";

// Offset applied to anchored sections so the sticky header never covers their heading
const SECTION_OFFSET = "96px";

// External destinations
const APP_URL = "https://app.metadatify.com";
const SIGNUP_URL = `${APP_URL}/signup`;
const LOGIN_URL = `${APP_URL}/login`;
const DOCS_URL = "https://metadatify.com/docs/";
const GITHUB_URL = "https://github.com/Brain-Development-and-Disorders-Lab/mars";
const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`;
const DOI_URL = "https://doi.org/10.5281/zenodo.13946927";

// BibTeX entry for the Zenodo record, shown in the citation block
const CITATION_BIBTEX = `@misc{burgess2024mars,
  title     = {MARS: An Open-Source Application for Managing and Searching Scientific Metadata},
  author    = {Burgess, Henry and Fievet, Robin and Brownell, David and Richards, Linda},
  year      = {2024},
  publisher = {Zenodo},
  note      = {Poster},
  doi       = {10.5281/zenodo.13946927},
  url       = {https://doi.org/10.5281/zenodo.13946927}
}`;

const App = () => {
  // Copy the BibTeX entry to the clipboard
  const { onCopy: onCopyBibtex, hasCopied: hasCopiedBibtex } = useClipboard(CITATION_BIBTEX);

  // Track scroll position to raise the header off the page once content scrolls beneath it
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Secondary hero action, the demo Workspace when available, otherwise the Quickstart guide
  let secondaryLabel = "Read the Quickstart";
  let secondaryHref = `${DOCS_URL}Quickstart/`;
  if (DEMO_WORKSPACE_URL) {
    secondaryLabel = "Explore the demo";
    secondaryHref = DEMO_WORKSPACE_URL;
  }

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
            className={"bg-blob"}
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
            className={"bg-blob"}
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
          <Link href={"#home"} display={"flex"} gap={"2"} alignItems={"center"} _hover={{ textDecoration: "none" }}>
            <Image src={logo} alt={""} w={"28px"} h={"28px"} rounded={"md"} />
            <Heading as={"span"} size={"md"} color={"brand.navy"}>
              Metadatify
            </Heading>
          </Link>
          <Flex as={"nav"} aria-label={"Main"} align={"center"} gap={"8"} display={["none", "none", "flex"]}>
            <Link fontWeight={"medium"} color={"text.muted"} _hover={{ color: "brand.navy" }} href={"#features"}>
              Features
            </Link>
            {DEMO_WORKSPACE_URL && (
              <Link
                fontWeight={"medium"}
                color={"text.muted"}
                _hover={{ color: "brand.navy" }}
                href={DEMO_WORKSPACE_URL}
              >
                Demo
              </Link>
            )}
            <Link fontWeight={"medium"} color={"text.muted"} _hover={{ color: "brand.navy" }} href={DOCS_URL}>
              Docs
            </Link>
            <Link href={GITHUB_URL} isExternal aria-label={"Metadatify on GitHub"}>
              <Icon name={"l_github"} color={"text.muted"} />
            </Link>
          </Flex>
          <Flex align={"center"} gap={["2", "4"]}>
            <Button
              as={Link}
              href={LOGIN_URL}
              rounded={"full"}
              size={"sm"}
              colorScheme={"blue"}
              rightIcon={<Icon name={"a_right"} size={"xs"} />}
              _hover={{ textDecoration: "none" }}
            >
              Log in
            </Button>
            {/* Navigation menu for small screens, where the header links are hidden */}
            <Box display={["block", "block", "none"]}>
              <Menu placement={"bottom-end"}>
                <MenuButton
                  as={IconButton}
                  aria-label={"Open navigation menu"}
                  icon={<Icon name={"menu"} />}
                  size={"sm"}
                  variant={"ghost"}
                  rounded={"full"}
                />
                <MenuList zIndex={200}>
                  <MenuItem as={Link} href={"#features"} _hover={{ textDecoration: "none" }}>
                    Features
                  </MenuItem>
                  {DEMO_WORKSPACE_URL && (
                    <MenuItem as={Link} href={DEMO_WORKSPACE_URL} _hover={{ textDecoration: "none" }}>
                      Demo
                    </MenuItem>
                  )}
                  <MenuItem as={Link} href={DOCS_URL} _hover={{ textDecoration: "none" }}>
                    Docs
                  </MenuItem>
                  <MenuItem as={Link} href={GITHUB_URL} isExternal _hover={{ textDecoration: "none" }}>
                    GitHub
                  </MenuItem>
                </MenuList>
              </Menu>
            </Box>
          </Flex>
        </Flex>

        {/* Page content */}
        <Flex
          as={"main"}
          direction={"column"}
          gap={["12", "16"]}
          px={["4", "8"]}
          zIndex={2}
          flex={"1"}
          align={"center"}
        >
          {/* Hero */}
          <Flex
            id={"home"}
            style={{ scrollMarginTop: SECTION_OFFSET }}
            direction={["column", "column", "row"]}
            gap={["8", "8", "16"]}
            align={"center"}
            justify={"center"}
            minH={["auto", "auto", "80vh"]}
            w={"100%"}
            maxW={"7xl"}
            px={["2", "8"]}
            pt={["6", "8"]}
          >
            <Flex direction={"column"} gap={"6"} flex={"1"} minW={"0"}>
              <Link
                href={"#ai"}
                display={"flex"}
                alignItems={"center"}
                gap={"2"}
                w={"fit-content"}
                bg={"ai.light"}
                color={"ai.text"}
                px={"3"}
                py={"1"}
                rounded={"full"}
                fontSize={"sm"}
                fontWeight={"semibold"}
                _hover={{ textDecoration: "none", bg: "ai.border" }}
              >
                <Icon name={"lightning"} size={"xs"} color={"ai.default"} />
                New AI-powered features
                <Icon name={"a_right"} size={"xs"} color={"ai.default"} />
              </Link>
              <Heading
                as={"h1"}
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
              <Flex direction={"column"} gap={"3"}>
                <Flex direction={"row"} gap={"3"} wrap={"wrap"}>
                  <Button
                    as={Link}
                    href={"#get-started"}
                    size={"lg"}
                    rounded={"full"}
                    colorScheme={"blue"}
                    boxShadow={"glow"}
                    rightIcon={<Icon name={"a_right"} size={"xs"} />}
                    transition={"transform 0.15s ease"}
                    _hover={{ textDecoration: "none", transform: "translateY(-1px)" }}
                  >
                    Get started
                  </Button>
                  <Button
                    as={Link}
                    href={secondaryHref}
                    size={"lg"}
                    rounded={"full"}
                    colorScheme={"blue"}
                    variant={"outline"}
                    bg={"white"}
                    _hover={{ textDecoration: "none", bg: "blue.50" }}
                  >
                    {secondaryLabel}
                  </Button>
                </Flex>
              </Flex>
            </Flex>
            <Flex direction={"column"} flex={["none", "none", "1.2"]} w={"100%"} minW={"0"} align={"center"} gap={"2"}>
              <Flex
                direction={"column"}
                w={"100%"}
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
                <Image
                  src={dashboardImage}
                  alt={
                    "The Metadatify Dashboard, showing Workspace counts, recent Projects and Entities, and an activity feed"
                  }
                  htmlWidth={"1459"}
                  htmlHeight={"869"}
                  w={"100%"}
                  h={"auto"}
                />
              </Flex>
              <Text fontWeight={"semibold"} color={"text.subtle"} fontSize={"sm"}>
                Metadatify Dashboard
              </Text>
            </Flex>
          </Flex>

          {/* Why Metadatify */}
          <Flex
            id={"why"}
            style={{ scrollMarginTop: SECTION_OFFSET }}
            direction={"column"}
            gap={"8"}
            w={"100%"}
            align={"center"}
          >
            <Flex direction={"column"} align={"center"} gap={"2"} textAlign={"center"}>
              <Heading>Why Metadatify</Heading>
              <Text color={"text.muted"} maxW={"5xl"}>
                Sample and specimen metadata is often the hardest part of a lab's data to keep organized.
              </Text>
            </Flex>
            <Flex
              as={"ul"}
              listStyleType={"none"}
              direction={["column", "column", "row"]}
              gap={["6", "6", "10"]}
              w={"100%"}
              maxW={"5xl"}
              p={["6", "8"]}
              rounded={"xl"}
              border={"1px"}
              borderColor={"border.default"}
              bg={"white"}
              boxShadow={"card"}
            >
              <Flex as={"li"} direction={"column"} gap={"3"} flex={"1"}>
                <Flex align={"center"} justify={"center"} w={"10"} h={"10"} rounded={"md"} bg={"blue.50"}>
                  <Icon name={"list"} color={"blue.600"} />
                </Flex>
                <Text fontWeight={"bold"} fontSize={"lg"}>
                  Scattered across spreadsheets
                </Text>
                <Text color={"text.muted"}>
                  Sample and specimen records end up in separate spreadsheets kept by different people, each with its
                  own columns and naming. Metadatify keeps them in one shared Workspace, structured by reusable
                  Attributes.
                </Text>
              </Flex>
              <Flex as={"li"} direction={"column"} gap={"3"} flex={"1"}>
                <Flex align={"center"} justify={"center"} w={"10"} h={"10"} rounded={"md"} bg={"blue.50"}>
                  <Icon name={"search"} color={"blue.600"} />
                </Flex>
                <Text fontWeight={"bold"} fontSize={"lg"}>
                  Hard to search
                </Text>
                <Text color={"text.muted"}>
                  Finding every sample that matches a set of conditions means opening file after file. Metadatify
                  searches a whole Workspace at once, in plain language or with a visual query builder.
                </Text>
              </Flex>
              <Flex as={"li"} direction={"column"} gap={"3"} flex={"1"}>
                <Flex align={"center"} justify={"center"} w={"10"} h={"10"} rounded={"md"} bg={"blue.50"}>
                  <Icon name={"link"} color={"blue.600"} />
                </Flex>
                <Text fontWeight={"bold"} fontSize={"lg"}>
                  Hard to share
                </Text>
                <Text color={"text.muted"}>
                  The NIH Data Management &amp; Sharing Policy and the FAIR principles call for data to be shared with
                  metadata others can find, understand, and reuse. Consistent, structured records that export to CSV or
                  JSON are a practical starting point.
                </Text>
              </Flex>
            </Flex>
          </Flex>

          {/* Features */}
          <Flex
            id={"features"}
            style={{ scrollMarginTop: SECTION_OFFSET }}
            direction={"column"}
            gap={["12", "16"]}
            w={"100%"}
            align={"center"}
          >
            <Flex direction={"column"} align={"center"} gap={"2"} textAlign={"center"}>
              <Heading>See how it works</Heading>
              <Text color={"text.muted"} maxW={"60ch"}>
                Every sample, specimen, and reagent gets a structured, searchable record your whole lab can rely on.
              </Text>
            </Flex>
            <FeatureShowcase
              eyebrow={"Structure"}
              title={"Define your metadata once, reuse it everywhere"}
              description={
                "Attributes are reusable templates of typed values. Apply them to every Entity of the same kind so records stay consistent across your lab."
              }
              points={[
                "Text, number, date, URL, option, and Entity reference values",
                "Reuse Attribute templates across Entities",
                "Link Entities as parent, child, or related",
              ]}
              image={attributeImage}
              imageAlt={"Screenshot of an Attribute open on an Entity, listing its named, typed values"}
              imageWidth={1346}
              imageHeight={774}
              link={{ label: "Learn about Attributes", href: `${DOCS_URL}creating/Creating-Attributes/` }}
            />
            <FeatureShowcase
              eyebrow={"Search"}
              title={"Find any sample in seconds"}
              description={
                "Search an entire Workspace at once instead of opening spreadsheet after spreadsheet, then open any result to see its full record."
              }
              points={[
                "Text search across names, descriptions, and metadata",
                "Visual query builder with AND and OR groups",
                "Plain-language search with AI",
              ]}
              image={searchImage}
              imageAlt={"Screenshot of the Search page, with a plain-language AI search and the matching Entities"}
              imageWidth={1346}
              imageHeight={774}
              link={{ label: "Learn about searching", href: `${DOCS_URL}Searching/` }}
              reverse
            />
            <FeatureShowcase
              eyebrow={"Track"}
              title={"A complete record for every sample"}
              description={
                "Each Entity brings together its metadata, linked Entities, Projects, and attachments, with every change recorded."
              }
              points={[
                "Full version history, with restore",
                "Printable QR code labels for physical samples",
                "Attachments stored alongside metadata",
              ]}
              image={entityImage}
              imageAlt={"Screenshot of an Entity page showing its Attributes, Projects, and attachments"}
              imageWidth={1346}
              imageHeight={774}
              link={{ label: "Learn about tracking", href: `${DOCS_URL}Tracking/` }}
            />

            {/* Supporting features */}
            <Flex direction={"column"} gap={"6"} w={"100%"} maxW={"6xl"} align={"center"}>
              <Heading size={"lg"} textAlign={"center"}>
                And everything else your lab needs
              </Heading>
              <SimpleGrid columns={[1, 2, 3]} spacing={["4", "6"]} w={"100%"}>
                <FeatureCard
                  icon={"project"}
                  title={"Projects"}
                  description={
                    "Group Entities into Projects to track experimental cohorts, sample batches, or any collection your workflow needs."
                  }
                />
                <FeatureCard
                  icon={"person"}
                  title={"Collaboration"}
                  description={
                    "Add collaborators by email. Everyone in a shared Workspace sees the same metadata, always current."
                  }
                />
                <FeatureCard
                  icon={"upload"}
                  title={"Import"}
                  description={
                    "Bring in existing metadata from CSV, XLSX, or JSON files, mapping columns to Entity fields."
                  }
                />
                <FeatureCard
                  icon={"download"}
                  title={"Export"}
                  description={
                    "Export metadata as spreadsheets or JSON from single Entities, selections, or entire Projects."
                  }
                />
                <FeatureCard
                  icon={"l_globus"}
                  title={"Public sharing"}
                  description={
                    "Make a Workspace public to share a read-only link that anyone can browse without an account."
                  }
                />
                <FeatureCard
                  icon={"settings"}
                  title={"API access"}
                  description={
                    "Generate API keys from your account settings to connect Metadatify with other tools and workflows."
                  }
                />
              </SimpleGrid>
            </Flex>
          </Flex>

          {/* AI Features */}
          <Flex
            id={"ai"}
            style={{ scrollMarginTop: SECTION_OFFSET }}
            direction={"column"}
            gap={"8"}
            py={"12"}
            px={["4", "12"]}
            w={"100%"}
            maxW={"6xl"}
            align={"center"}
            bg={"ai.light"}
            rounded={"2xl"}
          >
            <Flex direction={"column"} align={"center"} gap={"2"} textAlign={"center"}>
              <Flex align={"center"} gap={"2"}>
                <Icon name={"lightning"} size={"md"} color={"ai.default"} />
                <Heading color={"ai.text"}>AI features built in</Heading>
              </Flex>
              <Text color={"ai.text"} maxW={"60ch"}>
                Three AI features that reduce the time you spend on metadata management.
              </Text>
            </Flex>
            <SimpleGrid columns={[1, 1, 3]} spacing={"6"} w={"100%"}>
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
                  "Importing a legacy spreadsheet? Metadatify reads your column headers and suggests the right field mapping, getting your data in cleanly without manual guesswork."
                }
              />
              <FeatureCard
                accent={"ai"}
                icon={"lightning"}
                title={"Attribute Matching"}
                description={
                  "Name and describe a new Entity and Metadatify will suggest the best-fit Attribute from your Workspace, keeping similar Entities consistent."
                }
              />
            </SimpleGrid>
            <Flex gap={"1"} align={"center"} wrap={"wrap"} justify={"center"}>
              <Link color={"ai.text"} fontWeight={"semibold"} href={`${DOCS_URL}Analytics/`}>
                How the AI features handle your data
              </Link>
              <Icon name={"a_right"} size={"xs"} color={"ai.text"} />
            </Flex>
          </Flex>

          {/* Get Started */}
          <Flex
            id={"get-started"}
            style={{ scrollMarginTop: SECTION_OFFSET }}
            direction={"column"}
            gap={"8"}
            w={"100%"}
            maxW={"6xl"}
            align={"center"}
          >
            <Flex direction={"column"} align={"center"} gap={"2"} textAlign={"center"}>
              <Heading>Get started</Heading>
              <Text color={"text.muted"} maxW={"60ch"}>
                Use Metadatify online, explore an example Workspace, or run it on your own infrastructure.
              </Text>
            </Flex>
            <Flex direction={"row"} gap={"6"} wrap={"wrap"} justify={"center"} align={"stretch"} w={"100%"}>
              <PathCard
                icon={"serv_managed_hosted"}
                title={"Use Metadatify online"}
                description={
                  "Create an account and start organizing your lab's metadata right away. No setup required."
                }
                action={{ label: "Create an account", href: SIGNUP_URL }}
                secondary={{ label: "Already have an account? Log in", href: LOGIN_URL }}
                primary
              />
              {DEMO_WORKSPACE_URL && (
                <PathCard
                  icon={"workspace"}
                  title={"Explore the demo"}
                  description={
                    "Browse a read-only example Workspace without an account: Entities, Projects, Attributes, and search."
                  }
                  action={{ label: "Open the demo", href: DEMO_WORKSPACE_URL }}
                />
              )}
              <PathCard
                icon={"serv_self_hosted"}
                title={"Host it yourself"}
                description={"Run Metadatify on your own infrastructure for full control over your data."}
                action={{ label: "Self-hosting guide", href: `${DOCS_URL}Self-Hosting/` }}
              />
            </Flex>
            <Text textAlign={"center"} color={"text.muted"}>
              Not sure which fits your lab? Reach out to us at{" "}
              <Link color={"blue.700"} textDecoration={"underline"} href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </Link>
              .
            </Text>
          </Flex>

          {/* Resources */}
          <Flex
            id={"resources"}
            style={{ scrollMarginTop: SECTION_OFFSET }}
            direction={"column"}
            gap={"6"}
            w={"100%"}
            maxW={"6xl"}
            align={"center"}
          >
            <Heading size={"lg"}>Resources</Heading>
            <SimpleGrid columns={[1, 2, 3]} spacing={"4"} w={"100%"}>
              <ResourceLink
                icon={"rocket"}
                title={"Quickstart guide"}
                description={"From first login to your first Entity, Project, and search in about ten minutes."}
                href={`${DOCS_URL}Quickstart/`}
                isExternal
              />
              <ResourceLink
                icon={"book"}
                title={"Documentation"}
                description={"Guides for every feature, including import, export, and Workspaces."}
                href={DOCS_URL}
                isExternal
              />
              <ResourceLink
                icon={"shield"}
                title={"Data & AI handling"}
                description={"What the AI features send to a model provider, and where your data is stored."}
                href={`${DOCS_URL}Analytics/`}
                isExternal
              />
              <ResourceLink
                icon={"l_github"}
                title={"Source code"}
                description={"Browse the code, report issues, or contribute on GitHub."}
                href={GITHUB_URL}
                isExternal
              />
              <ResourceLink
                icon={"serv_self_hosted"}
                title={"Self-hosting guide"}
                description={"Requirements, configuration, and deployment for your own infrastructure."}
                href={`${DOCS_URL}Self-Hosting/`}
                isExternal
              />
              <ResourceLink
                icon={"quote"}
                title={"Cite Metadatify"}
                description={"Reference Metadatify in your publications with the Zenodo DOI."}
                href={"#cite"}
              />
            </SimpleGrid>
          </Flex>

          {/* Citation */}
          <Flex
            id={"cite"}
            style={{ scrollMarginTop: SECTION_OFFSET }}
            direction={"column"}
            gap={"4"}
            w={"100%"}
            maxW={"3xl"}
            align={"center"}
          >
            <Heading size={"lg"}>Cite Metadatify</Heading>
            <Text color={"text.muted"} textAlign={"center"}>
              If Metadatify supports your research, please cite:
            </Text>
            <Flex
              direction={"column"}
              gap={"4"}
              w={"100%"}
              p={["4", "6"]}
              rounded={"xl"}
              border={"1px"}
              borderColor={"border.default"}
              bg={"white"}
              boxShadow={"card"}
            >
              <Text>
                Burgess, H., Fievet, R., Brownell, D., &amp; Richards, L. (2024).{" "}
                <i>MARS: An Open-Source Application for Managing and Searching Scientific Metadata</i> [Poster]. Zenodo.{" "}
                <Link color={"blue.700"} textDecoration={"underline"} href={DOI_URL} isExternal>
                  {DOI_URL}
                </Link>
              </Text>
              <Code
                as={"pre"}
                display={"block"}
                whiteSpace={"pre-wrap"}
                wordBreak={"break-word"}
                p={"4"}
                rounded={"md"}
                bg={"surface.muted"}
                color={"text.default"}
                fontSize={"sm"}
                aria-label={"BibTeX citation"}
              >
                {CITATION_BIBTEX}
              </Code>
              <Flex direction={"row"} gap={"4"} align={"center"} justify={"space-between"} wrap={"wrap"}>
                <Link href={DOI_URL} isExternal>
                  <Image
                    src={"https://zenodo.org/badge/DOI/10.5281/zenodo.13946927.svg"}
                    alt={"DOI: 10.5281/zenodo.13946927"}
                  />
                </Link>
                <Button size={"sm"} rounded={"full"} colorScheme={"blue"} variant={"outline"} onClick={onCopyBibtex}>
                  {hasCopiedBibtex ? "Copied" : "Copy BibTeX"}
                </Button>
              </Flex>
            </Flex>
          </Flex>

          {/* Acknowledgements */}
          <Flex direction={"column"} gap={"6"} w={"100%"} pb={"12"} align={"center"}>
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
                  <Text fontWeight={"semibold"} color={"text.muted"}>
                    Lead Developer
                  </Text>
                  <Avatar name={"Henry Burgess"} src={"https://avatars.githubusercontent.com/u/60735885"} />
                  <Text fontWeight={"semibold"}>Henry Burgess</Text>
                  <Link color={"blue.700"} href={"https://github.com/henryjburg"}>
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
                  <Text fontWeight={"semibold"} color={"text.muted"}>
                    Collaborator
                  </Text>
                  <Avatar name={"Robin Fievet"} src={"https://avatars.githubusercontent.com/u/11888851"} />
                  <Text fontWeight={"semibold"}>Robin Fievet</Text>
                  <Link color={"blue.700"} href={"https://github.com/rfievet"}>
                    GitHub
                  </Link>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        {/* Footer */}
        <Flex
          as={"footer"}
          direction={"column"}
          zIndex={2}
          bg={"brand.navy"}
          color={"white"}
          px={["4", "8"]}
          py={"10"}
          gap={"8"}
        >
          <Flex
            direction={["column", "column", "row"]}
            justify={"space-between"}
            gap={"8"}
            w={"100%"}
            maxW={"6xl"}
            mx={"auto"}
          >
            <Flex direction={"column"} gap={"3"} maxW={"xs"}>
              <Flex align={"center"} gap={"2"}>
                <Image src={logo} alt={""} w={"22px"} h={"22px"} rounded={"sm"} />
                <Text fontWeight={"bold"}>Metadatify</Text>
              </Flex>
              <Text fontSize={"sm"} color={"whiteAlpha.700"}>
                Structured, searchable metadata for research labs.
              </Text>
            </Flex>
            <SimpleGrid columns={[2, 3]} spacingX={["8", "16"]} spacingY={"6"}>
              <Flex direction={"column"} gap={"2"}>
                <Text fontSize={"sm"} fontWeight={"bold"} color={"whiteAlpha.900"}>
                  Product
                </Text>
                <Link color={"whiteAlpha.800"} _hover={{ color: "white" }} href={"#features"}>
                  Features
                </Link>
                {DEMO_WORKSPACE_URL && (
                  <Link color={"whiteAlpha.800"} _hover={{ color: "white" }} href={DEMO_WORKSPACE_URL}>
                    Demo
                  </Link>
                )}
                <Link color={"whiteAlpha.800"} _hover={{ color: "white" }} href={"#get-started"}>
                  Get started
                </Link>
                <Link color={"whiteAlpha.800"} _hover={{ color: "white" }} href={LOGIN_URL}>
                  Log in
                </Link>
              </Flex>
              <Flex direction={"column"} gap={"2"}>
                <Text fontSize={"sm"} fontWeight={"bold"} color={"whiteAlpha.900"}>
                  Resources
                </Text>
                <Link color={"whiteAlpha.800"} _hover={{ color: "white" }} href={DOCS_URL}>
                  Documentation
                </Link>
                <Link color={"whiteAlpha.800"} _hover={{ color: "white" }} href={`${DOCS_URL}Quickstart/`}>
                  Quickstart
                </Link>
                <Link color={"whiteAlpha.800"} _hover={{ color: "white" }} href={`${DOCS_URL}Self-Hosting/`}>
                  Self-hosting
                </Link>
                <Link color={"whiteAlpha.800"} _hover={{ color: "white" }} href={`${DOCS_URL}Analytics/`}>
                  Data &amp; AI handling
                </Link>
              </Flex>
              <Flex direction={"column"} gap={"2"}>
                <Text fontSize={"sm"} fontWeight={"bold"} color={"whiteAlpha.900"}>
                  Project
                </Text>
                <Link color={"whiteAlpha.800"} _hover={{ color: "white" }} href={GITHUB_URL} isExternal>
                  GitHub
                </Link>
                <Link color={"whiteAlpha.800"} _hover={{ color: "white" }} href={"#cite"}>
                  Cite
                </Link>
                <Link color={"whiteAlpha.800"} _hover={{ color: "white" }} href={LICENSE_URL} isExternal>
                  License
                </Link>
                <Link color={"whiteAlpha.800"} _hover={{ color: "white" }} href={`mailto:${CONTACT_EMAIL}`}>
                  Contact
                </Link>
              </Flex>
            </SimpleGrid>
          </Flex>
          <Flex
            direction={"column"}
            align={"center"}
            gap={"2"}
            borderTop={"1px"}
            borderColor={"whiteAlpha.200"}
            pt={"6"}
            w={"100%"}
            maxW={"6xl"}
            mx={"auto"}
          >
            <Text fontSize={"sm"} color={"whiteAlpha.600"} textAlign={"center"}>
              © {new Date().getFullYear()} Metadatify. Department of Neuroscience, Washington University School of
              Medicine in St. Louis.
            </Text>
            <Text fontSize={"sm"} color={"whiteAlpha.600"} textAlign={"center"}>
              Source-available under a Washington University research license for non-commercial, non-clinical research
              use.{" "}
              <Link
                color={"whiteAlpha.800"}
                textDecoration={"underline"}
                _hover={{ color: "white" }}
                href={LICENSE_URL}
                isExternal
              >
                View license
              </Link>
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </ChakraProvider>
  );
};

export default App;
