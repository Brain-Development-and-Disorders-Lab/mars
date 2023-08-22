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
  Select,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableContainer,
  Tabs,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
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
} from "@types";

// Utility functions and libraries
import { getData, postData } from "@database/functions";
import _ from "lodash";

// Routing and navigation
import { useNavigate } from "react-router-dom";

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
    // Check if an ID has been entered
    getData(`/entities/${query}`)
      .then((entity) => {
        if (_.isNull(entity)) {
          // Not an Entity ID
          setIsSearching(true);
          setHasSearched(true);

          postData(`/search`, { query: query })
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
        } else {
          // Entity with given ID exists
          navigate(`/entities/${entity._id}`);
        }
      })
      .catch(() => {
        toast({
          title: "Error",
          status: "error",
          description: "Error occurred when searching for Entity.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
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

  return (
    <Content isError={isError}>
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
        </Flex>

        {/* Search components */}
        <Tabs variant={"soft-rounded"} colorScheme={"blue"} onChange={onTabChange}>
          <TabList p={"2"} gap={"2"}>
            <Tab disabled={isSearching}>Text</Tab>
            <Tab disabled={isSearching}>Query Builder</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              {/* Text search */}
              <Flex p={"2"} w={"100%"} direction={"column"} gap={"4"}>
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
            <TabPanel>
              {/* Query builder */}
              <Flex p={"2"} w={"100%"} direction={"column"} gap={"4"}>
                <Flex
                  direction={"column"}
                  p={"2"}
                  rounded={"md"}
                  border={"2px"}
                  borderColor={"gray.200"}
                >
                  <Flex direction={"row"} p={"2"} gap={"4"} wrap={"wrap"}>
                    {/* Query builder components */}
                    <Select
                      w={"auto"}
                      value={queryType}
                      onChange={(event) =>
                        setQueryType(event.target.value as QueryFocusType)
                      }
                    >
                      <option>Entity</option>
                    </Select>

                    <Select
                      w={"auto"}
                      value={queryParameter}
                      onChange={(event) => {
                        setQueryParameter(
                          event.target.value as QueryParameters
                        );
                        // Set the query qualifier to prevent selection of disabled options
                        setQueryQualifier("Contains");
                      }}
                    >
                      <option>Name</option>
                      <option>Description</option>
                      <option>Projects</option>
                      <option>Origins</option>
                      <option>Products</option>
                    </Select>

                    <Select
                      w={"auto"}
                      value={queryQualifier}
                      onChange={(event) =>
                        setQueryQualifier(event.target.value as QueryQualifier)
                      }
                    >
                      <option>Contains</option>
                      <option>Does Not Contain</option>
                      <option
                        disabled={
                          _.isEqual(queryParameter, "Projects") ||
                          _.isEqual(queryParameter, "Origins") ||
                          _.isEqual(queryParameter, "Products")
                        }
                      >
                        Is Not
                      </option>
                      <option
                        disabled={
                          _.isEqual(queryParameter, "Projects") ||
                          _.isEqual(queryParameter, "Origins") ||
                          _.isEqual(queryParameter, "Products")
                        }
                      >
                        Is
                      </option>
                    </Select>

                    {_.isEqual(queryParameter, "Projects") && isLoaded && (
                      <Select
                        w={"auto"}
                        placeholder={"Select Project"}
                        value={queryKey}
                        onChange={(event) => {
                          setQueryKey(event.target.value);
                          setQueryValue(
                            event.target.options[event.target.selectedIndex]
                              .innerText
                          );
                        }}
                      >
                        {projects.map((project) => {
                          return (
                            <option key={project._id} value={project._id}>
                              {project.name}
                            </option>
                          );
                        })}
                      </Select>
                    )}
                    {_.includes(["Origins", "Products"], queryParameter) &&
                      isLoaded && (
                        <Select
                          w={"auto"}
                          placeholder={"Select Entity"}
                          value={queryKey}
                          onChange={(event) => {
                            setQueryKey(event.target.value);
                            setQueryValue(
                              event.target.options[event.target.selectedIndex]
                                .innerText
                            );
                          }}
                        >
                          {entities.map((entity) => {
                            return (
                              <option key={entity._id} value={entity._id}>
                                {entity.name}
                              </option>
                            );
                          })}
                        </Select>
                      )}
                    {_.includes(["Name", "Description"], queryParameter) && (
                      <Input
                        w={"auto"}
                        value={queryValue}
                        placeholder={"Value"}
                        onChange={(event) => {
                          setQueryKey(event.target.value);
                          setQueryValue(event.target.value);
                        }}
                      />
                    )}

                    <IconButton
                      aria-label={"Add query component"}
                      colorScheme={"telegram"}
                      icon={<Icon name={"add"} />}
                      disabled={_.isEqual(queryValue, "")}
                      onClick={() => {
                        setQueryComponents([
                          ...queryComponents,
                          {
                            operator: queryOperator,
                            focus: queryType,
                            parameter: queryParameter,
                            qualifier: queryQualifier,
                            key: queryKey,
                            value: queryValue,
                          },
                        ]);

                        // Reset query input
                        setQueryType("Entity");
                        setQueryParameter("Name");
                        setQueryQualifier("Contains");
                        setQueryKey("");
                        setQueryValue("");

                        // Clear search results
                        setHasSearched(false);
                        setResults([]);
                      }}
                    />
                  </Flex>

                  <VStack p={"2"} gap={"4"} align={"start"}>
                    {queryComponents.map((component, index) => {
                      return (
                        <Flex
                          key={`qc_${index}`}
                          direction={"row"}
                          gap={"4"}
                          w={"fit-content"}
                          align={"center"}
                          p={"2"}
                          bg={"gray.50"}
                          rounded={"md"}
                          wrap={"wrap"}
                        >
                          {index > 0 && (
                            <Select
                              w={"auto"}
                              value={
                                _.isEqual(index, 0) ? "" : component.operator
                              }
                              onChange={(event) => {
                                // Update the component operator state
                                const updatedQueryComponents =
                                  _.cloneDeep(queryComponents);
                                updatedQueryComponents[index].operator = event
                                  .target.value as QueryOperator;
                                setQueryComponents(updatedQueryComponents);

                                // Update the operator state
                                setQueryOperator(
                                  event.target.value as QueryOperator
                                );
                              }}
                            >
                              <option>AND</option>
                              <option>OR</option>
                            </Select>
                          )}

                          <Flex direction={"row"} gap={"4"} h={"fit-content"}>
                            <Tag colorScheme={"blue"}>{component.focus}</Tag>
                            <Tag colorScheme={"purple"}>
                              {component.parameter}
                            </Tag>
                            <Tag colorScheme={"green"}>
                              {component.qualifier}
                            </Tag>
                          </Flex>

                          {_.includes(
                            ["Origins", "Products", "Projects"],
                            component.parameter
                          ) &&
                            isLoaded && (
                              <Select
                                w={"fit-content"}
                                value={component.value}
                                disabled
                              >
                                <option>{component.value}</option>
                              </Select>
                            )}
                          {_.includes(
                            ["Name", "Description"],
                            component.parameter
                          ) && (
                            <Input
                              w={"fit-content"}
                              value={component.value}
                              disabled
                            />
                          )}

                          <IconButton
                            aria-label={"Remove search component"}
                            icon={<Icon name={"delete"} />}
                            colorScheme={"red"}
                            onClick={() => {
                              // Remove the query component
                              let updatedQueryComponents =
                                _.cloneDeep(queryComponents);
                              updatedQueryComponents.splice(index, 1);
                              setQueryComponents(updatedQueryComponents);

                              // Clear search results
                              setHasSearched(false);
                              setResults([]);
                            }}
                          />
                        </Flex>
                      );
                    })}
                  </VStack>
                </Flex>
                <Flex direction={"row"} w={"100%"} gap={"4"} justify={"right"}>
                  <Button
                    leftIcon={<Icon name={"rewind"} />}
                    isDisabled={queryComponents.length === 0}
                    onClick={() => {
                      setQueryComponents([]);
                      setHasSearched(false);
                      setResults([]);
                    }}
                  >
                    Reset
                  </Button>
                  <IconButton
                    aria-label={"Search"}
                    colorScheme={"green"}
                    icon={<Icon name={"search"} />}
                    isDisabled={queryComponents.length === 0}
                    onClick={() => runQuerySearch()}
                  />
                </Flex>
              </Flex>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Search Results */}
        <Flex gap={"2"} p={"2"}>
          {isSearching ? (
            <Flex w={"full"} align={"center"} justify={"center"}>
              <Loading />
            </Flex>
          ) : (
            hasSearched && (
              <Flex direction={"column"} w={"100%"}>
                <Heading size={"md"} fontWeight={"semibold"}>
                  {results.length} search result{results.length > 1 || results.length === 0 ? "s" : ""}
                </Heading>
                <TableContainer w={"full"}>
                  <Table>
                    <Thead>
                      <Tr>
                        <Th>Identifier</Th>
                        <Th display={{ base: "none", sm: "table-cell" }}>
                          Created
                        </Th>
                        <Th display={{ base: "none", sm: "table-cell" }}>
                          Owner
                        </Th>
                        <Th></Th>
                      </Tr>
                    </Thead>

                    <Tbody>
                      {results.length > 0 &&
                        results.map((result) => {
                          return (
                            <Tr key={result._id}>
                              <Td>{result.name}</Td>
                              <Td display={{ base: "none", sm: "table-cell" }}>
                                {new Date(result.created).toDateString()}
                              </Td>
                              <Td display={{ base: "none", sm: "table-cell" }}>
                                {result.owner}
                              </Td>
                              <Td>
                                <Flex justify={"right"}>
                                  <Button
                                    rightIcon={<Icon name={"c_right"} />}
                                    colorScheme={"blackAlpha"}
                                    onClick={() =>
                                      navigate(`/entities/${result._id}`)
                                    }
                                  >
                                    View
                                  </Button>
                                </Flex>
                              </Td>
                            </Tr>
                          );
                        })}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Flex>
            )
          )}
        </Flex>

        {/* Information modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Search</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
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
