// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import Linky from "@components/Linky";
import Icon from "@components/Icon";
import Loading from "@components/Loading";

// Existing and custom types
import {
  ProjectModel,
  EntityModel,
  QueryComponent,
  QueryFocusType,
  QueryOperator,
  QueryParameters,
  QueryQualifier,
  QuerySubQualifier,
  DataTableAction,
} from "@types";

// Utility functions and libraries
import { getData, postData } from "@database/functions";
import _ from "lodash";
import { createColumnHelper } from "@tanstack/react-table";

// Routing and navigation
import { useNavigate } from "react-router-dom";
import FileSaver from "file-saver";
import slugify from "slugify";
import dayjs from "dayjs";
import QueryBuilderTab from "./QueryBuilderTab";

const Search = () => {
  const [query, setQuery] = useState("");

  // Search status
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isError, setIsError] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const navigate = useNavigate();
  const toast = useToast();

  const [isLoaded, setIsLoaded] = useState(false);
  const [entities, setEntities] = useState([] as EntityModel[]);
  const [projects, setProjects] = useState([] as ProjectModel[]);

  const [queryComponents, setQueryComponents] = useState(
    [] as QueryComponent[]
  );
  const [queryOperator, setQueryOperator] = useState("AND" as QueryOperator);
  const [queryType, setQueryType] = useState("Entity" as QueryFocusType);
  const [queryParameter, setQueryParameter] = useState(
    "Name" as QueryParameters
  );
  const [queryQualifier, setQueryQualifier] = useState(
    "Contains" as QueryQualifier
  );
  const [querySubQualifier, setQuerySubQualifier] = useState(
    "Date" as QuerySubQualifier
  );
  const [queryKey, setQueryKey] = useState("");
  const [queryValue, setQueryValue] = useState("");

  // Store results as a set of IDs
  const [results, setResults] = useState([] as EntityModel[]);

  useEffect(() => {
    // Get all Entities
    getData(`/entities`)
      .then((response) => {
        setEntities(response);
      })
      .catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Entities data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      })
      .finally(() => {
        setIsLoaded(true);
      });

    // Get all Projects
    getData(`/projects`)
      .then((response) => {
        setProjects(response);
      })
      .catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Project data.",
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

  const runSearch = () => {
    // Initial check if a specific ID search was not found
    setIsSearching(true);
    setHasSearched(true);
    setResults([]);
  
    // Use the new search route for text-based search
    postData(`/entities/search/`, { query: query}) // Assuming you pass user ID for permissions filtering
      .then((results) => {
        if (results && results.length > 0) {
          // Update state with search results
          setResults(results);
        } else {
          // Handle no results found scenario
          toast({
            title: "No results found",
            status: "info",
            duration: 4000,
            position: "bottom-right",
            isClosable: true,
          });
        }
      })
      .catch((error) => {
        // Handle search error scenario
        console.error("Search error:", error);
        toast({
          title: "Search Error",
          description: "Could not perform search.",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom-right",
        });
      })
      .finally(() => {
        setIsSearching(false);
      });
  };

  const runQuerySearch = () => {
    // Update state
    setIsSearching(true);
    setHasSearched(true);

    postData(`/search/query`, { query: JSON.stringify(queryComponents) })
      .then((value) => {
        setResults(value);
      })
      .catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not get search results.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      })
      .finally(() => {
        setIsSearching(false);
      });
  };

  const onTabChange = () => {
    // Reset search state
    setQuery("");
    setQueryComponents([]);
    setHasSearched(false);
    setResults([]);
  };

  const searchResultColumnHelper = createColumnHelper<EntityModel>();
  const searchResultColumns = [
    searchResultColumnHelper.accessor("name", {
      cell: (info) => (
        <Linky
          id={info.row.original._id}
          type={"entities"}
          fallback={info.row.original.name}
        />
      ),
      header: "Name",
    }),
    searchResultColumnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return <Tag colorScheme={"orange"}>Empty</Tag>;
        }
        return <Text noOfLines={1}>{info.getValue()}</Text>;
      },
      header: "Description",
      enableHiding: true,
    }),
    searchResultColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex justifyContent={"right"}>
            <Button
              key={`view-entity-${info.getValue()}`}
              colorScheme={"gray"}
              rightIcon={<Icon name={"c_right"} />}
              onClick={() => navigate(`/entities/${info.getValue()}`)}
            >
              View
            </Button>
          </Flex>
        );
      },
      header: "",
    }),
  ];
  const searchResultActions: DataTableAction[] = [
    {
      label: "Export Entities CSV",
      icon: "download",
      action(table, rows) {
        // Export rows that have been selected
        const toExport: string[] = [];
        for (let rowIndex of Object.keys(rows)) {
          toExport.push(table.getRow(rowIndex).original._id);
        }

        postData(`/entities/export`, { entities: toExport }).then(
          (response) => {
            FileSaver.saveAs(
              new Blob([response]),
              slugify(
                `export_entities_${dayjs(Date.now()).format("YYYY_MM_DD")}.csv`
              )
            );
          }
        );

        table.resetRowSelection();
      },
    },
    {
      label: "Export Entities JSON",
      icon: "download",
      action: (table, rows: any) => {
        // Export rows that have been selected
        const toExport: string[] = [];
        for (let rowIndex of Object.keys(rows)) {
          toExport.push(table.getRow(rowIndex).original._id);
        }

        postData(`/entities/export`, { entities: toExport, format: "json" }).then(
          (response) => {
            FileSaver.saveAs(
              new Blob([response]),
              slugify(
                `export_entities_${dayjs(Date.now()).format("YYYY_MM_DD")}.json`
              )
            );
          }
        );

        table.resetRowSelection();
      },
    },

  ];

  return (
    <Content isError={isError}>
      <Flex
        direction={"row"}
        p={"4"}
        rounded={"md"}
        bg={"white"}
        wrap={"wrap"}
        gap={"6"}
        justify={"center"}
      >
        <Flex
          w={"100%"}
          p={"4"}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
        >
          {/* Page header */}
          <Flex align={"center"} gap={"4"}>
            <Icon name={"search"} size={"lg"} />
            <Heading fontWeight={"semibold"}>Search</Heading>
          </Flex>
          <Button
            rightIcon={<Icon name={"info"} />}
            variant={"outline"}
            onClick={onOpen}
          >
            Info
          </Button>
        </Flex>

        {/* Search components */}
        <Tabs
          w={"100%"}
          variant={"soft-rounded"}
          colorScheme={"blue"}
          onChange={onTabChange}
        >
          <TabList p={"2"} gap={"2"}>
            <Tab isDisabled={isSearching}>Text</Tab>
            <Tab isDisabled={isSearching}>Query Builder</Tab>
          </TabList>
          <TabPanels>
            {/* Text search */}
            <TabPanel>
              <Flex w={"100%"} direction={"column"} gap={"4"}>
                <Flex direction={"row"} align={"center"} gap={"2"}>
                  <Input
                    value={query}
                    placeholder={"Search..."}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyUp={(event) => {
                      // Listen for "Enter" key when entering a query
                      if (event.key === "Enter" && query !== "") {
                        runSearch();
                      }
                    }}
                  />

                  <IconButton
                    aria-label={"Search"}
                    icon={<Icon name={"search"} />}
                    colorScheme={"green"}
                    isDisabled={query === ""}
                    onClick={() => runSearch()}
                  />
                </Flex>
              </Flex>
            </TabPanel>

            {/* Query builder */}
            <QueryBuilderTab
              queryType={queryType}
              setQueryType={setQueryType}
              queryParameter={queryParameter}
              setQueryParameter={setQueryParameter}
              queryQualifier={queryQualifier}
              setQueryQualifier={setQueryQualifier}
              querySubQualifier={querySubQualifier}
              setQuerySubQualifier={setQuerySubQualifier}
              queryOperator={queryOperator}
              setQueryOperator={setQueryOperator}
              queryKey={queryKey}
              setQueryKey={setQueryKey}
              queryValue={queryValue}
              setQueryValue={setQueryValue}
              queryComponents={queryComponents}
              setQueryComponents={setQueryComponents}
              setHasSearched={setHasSearched}
              setResults={setResults}
              isLoaded={isLoaded}
              projects={projects}
              entities={entities}
              runQuerySearch={runQuerySearch}
              setIsSearching={setIsSearching}
            />
          </TabPanels>
        </Tabs>

        {/* Search Results */}
        <Flex gap={"4"} p={"4"} w={"100%"}>
          {isSearching ? (
            <Flex w={"full"} align={"center"} justify={"center"}>
              <Loading />
            </Flex>
          ) : (
            hasSearched && (
              <Flex direction={"column"} w={"100%"}>
                <Heading size={"md"} fontWeight={"semibold"}>
                  {results.length} search result
                  {results.length > 1 || results.length === 0 ? "s" : ""}
                </Heading>
                <DataTable
                  columns={searchResultColumns}
                  visibleColumns={{}}
                  data={results}
                  showPagination
                  showSelection
                  actions={searchResultActions}
                />
              </Flex>
            )
          )}
        </Flex>

        {/* Information modal */}
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent p={"2"} gap={"4"} w={["lg", "xl", "2xl"]}>
            <ModalHeader p={"2"}>Search</ModalHeader>
            <ModalCloseButton />
            <ModalBody p={"2"}>
              <Flex direction={"column"} gap={"4"} p={"2"}>
                <Text>
                  Use the <b>Text Search</b> tab to search for text across all
                  Entity fields.
                </Text>
                <Text>
                  The <b>Advanced Queries</b> tab allows search queries to be
                  constructed to target specific fields and values. Queries can
                  be built using AND and OR logical components.
                </Text>
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Flex>
    </Content>
  );
};

export default Search;
