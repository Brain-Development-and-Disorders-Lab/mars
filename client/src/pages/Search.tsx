// React
import React, { useState } from "react";

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
  Table,
  TableContainer,
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
import Error from "@components/Error";

// Existing and custom types
import { EntityModel, QueryComponent, QueryFocusType, QueryOperator, QueryParameters, QueryQualifier } from "@types";

// Utility functions and libraries
import { getData, postData } from "@database/functions";

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

  const [queryComponents, setQueryComponents] = useState([] as QueryComponent[]);
  const [queryOperator, setQueryOperator] = useState("AND" as QueryOperator);
  const [queryType, setQueryType] = useState("Entity" as QueryFocusType);
  const [queryParameter, setQueryParameter] = useState("Name" as QueryParameters);
  const [queryQualifier, setQueryQualifier] = useState("Contains" as QueryQualifier);
  const [queryValue, setQueryValue] = useState("");

  // Store results as a set of IDs
  const [results, setResults] = useState([] as EntityModel[]);

  const runSearch = () => {
    // Check if an ID has been entered
    let isEntity = false;
    getData(`/entities/${query}`)
      .then((entity) => {
        isEntity = true;
        navigate(`/entities/${entity._id}`);
      })
      .catch(() => {
        if (!isEntity) {
          // Update state
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
        }
      });
  };

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
          {/* Text search */}
          <Flex p={"2"} w={"100%"} direction={"column"} gap={"4"}>
            <Heading size={"md"} fontWeight={"semibold"}>Text Search</Heading>
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

              <Button
                leftIcon={<Icon name={"search"} />}
                isDisabled={query === ""}
                onClick={() => runSearch()}
              >
                Search
              </Button>
            </Flex>
          </Flex>
          {/* Query builder */}
          <Flex p={"2"} w={"100%"} direction={"column"} gap={"4"}>
            <Heading size={"md"} fontWeight={"semibold"}>Query Builder</Heading>
            <Flex direction={"column"} p={"2"} rounded={"md"} border={"2px"} borderColor={"gray.200"}>
              <Flex direction={"row"} p={"2"} gap={"4"}>
                {/* Query builder components */}
                <Select value={queryType} onChange={(event) => setQueryType(event.target.value as QueryFocusType)}>
                  <option>Entity</option>
                </Select>
                <Select value={queryParameter} onChange={(event) => setQueryParameter(event.target.value as QueryParameters)}>
                  <option>Name</option>
                  <option>Owner</option>
                  <option>Description</option>
                  <option>Collections</option>
                  <option>Origins</option>
                  <option>Products</option>
                </Select>
                <Select value={queryQualifier} onChange={(event) => setQueryQualifier(event.target.value as QueryQualifier)}>
                  <option>Contains</option>
                  <option>Does Not Contain</option>
                  <option>Is Not</option>
                  <option>Is</option>
                </Select>
                <Input value={queryValue} placeholder={"Value"} onChange={(event) => setQueryValue(event.target.value)} />
                <IconButton
                  aria-label={"Add query component"}
                  variant={"outline"}
                  icon={<Icon name={"add"} />}
                  onClick={() => {
                    setQueryComponents([...queryComponents, {
                      focus: queryType,
                      parameter: queryParameter,
                      qualifier: queryQualifier,
                      value: queryValue,
                    }]);

                    // Reset query input
                    setQueryType("Entity");
                    setQueryParameter("Name");
                    setQueryQualifier("Contains");
                    setQueryValue("");
                  }}
                />
              </Flex>

              <VStack p={"2"} gap={"4"}>
                {queryComponents.map((component) => {
                  return (
                    <Flex direction={"row"} gap={"4"} w={"100%"}>
                      <Select maxW={"2xs"} value={queryOperator} onChange={(event) => setQueryOperator(event.target.value as QueryOperator)}>
                        <option>AND</option>
                        <option>OR</option>
                      </Select>
                      <Tag colorScheme={"blue"}>{component.focus}</Tag>
                      <Tag colorScheme={"purple"}>{component.parameter}</Tag>
                      <Tag colorScheme={"green"}>{component.qualifier}</Tag>
                      <Tag>"{component.value}"</Tag>
                    </Flex>
                  );
                })}
              </VStack>
            </Flex>
            <Flex direction={"row"} w={"100%"} justify={"right"}>
              <Button
                leftIcon={<Icon name={"search"} />}
                isDisabled={queryComponents.length === 0}
              >
                Search
              </Button>
            </Flex>
          </Flex>

          {/* Search Results */}
          <Flex gap={"2"} p={"2"}>
            {isSearching ? (
              <Flex w={"full"} align={"center"} justify={"center"}>
                <Loading />
              </Flex>
            ) : (
              hasSearched && (
                <Flex direction={"column"} w={"100%"}>
                  <Heading size={"md"} fontWeight={"semibold"}>Search Results ({results.length}) </Heading>
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
                <Text>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </Text>
                <Text>
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco
                  laboris nisi ut aliquip ex ea commodo consequat.
                </Text>
                <Text>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse
                  cillum dolore eu fugiat nulla pariatur.
                </Text>
                <Text>
                  Excepteur sint occaecat cupidatat non proident, sunt in culpa
                  qui officia deserunt mollit anim id est laborum.
                </Text>
              </ModalBody>
            </ModalContent>
          </Modal>
        </Flex>
      )}
    </Content>
  );
};

export default Search;
