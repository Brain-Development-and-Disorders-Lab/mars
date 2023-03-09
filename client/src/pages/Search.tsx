// React
import React, { useState } from "react";
import {
  Button,
  Flex,
  Heading,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  ChevronRightIcon,
  InfoOutlineIcon,
  SearchIcon,
} from "@chakra-ui/icons";

// Navigation
import { useNavigate } from "react-router-dom";

// Database and models
import { getData } from "@database/functions";
import { EntityModel } from "@types";

// Custom components
import { Loading } from "@components/Loading";
import { Error } from "@components/Error";
import { ContentContainer } from "@components/ContentContainer";

const Search = () => {
  const [query, setQuery] = useState("");

  // Search status
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isError, setIsError] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const navigate = useNavigate();
  const toast = useToast();

  // Store results as a set of IDs
  const [results, setResults] = useState([] as EntityModel[]);

  const runSearch = () => {
    // Update state
    setIsSearching(true);
    setHasSearched(true);

    getData(`/search/${query}`)
      .then((value) => {
        setResults(value);
      }).catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not get search results.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      }).finally(() => {
        setIsSearching(false);
      });
  };

  return (
    <ContentContainer vertical={isError}>
      {isError ? (
        <Error />
      ) : (
        <Flex
          direction={"column"}
          justify={"center"}
          p={["1", "2"]}
          gap={"6"}
          maxW={"7xl"}
          wrap={"wrap"}
        >
          {/* Page header */}
          <Flex direction={"column"} p={"2"} pt={"4"} pb={"4"}>
            <Flex direction={"row"} align={"center"} justify={"space-between"}>
              <Flex align={"center"} gap={"4"}>
                <Icon as={SearchIcon} w={"8"} h={"8"} />
                <Heading fontWeight={"semibold"}>Search</Heading>
              </Flex>
              <Button
                rightIcon={<InfoOutlineIcon />}
                variant={"outline"}
                onClick={onOpen}
              >
                Info
              </Button>
            </Flex>
          </Flex>

          {/* Search component */}
          <Flex direction={"row"} align={"center"} p={"2"} gap={"2"}>
            <Input
              value={query}
              placeholder={"Enter search query..."}
              onChange={(event) => setQuery(event.target.value)}
              onKeyUp={(event) => {
                // Listen for "Enter" key when entering a query
                if (event.key === "Enter" && query !== "") {
                  runSearch();
                }
              }}
            />

            <Button
              leftIcon={<Icon as={SearchIcon} />}
              isDisabled={query === ""}
              onClick={() => runSearch()}
            >
              Search
            </Button>
          </Flex>

          {/* Search Results */}
          <Flex gap={"2"} p={"2"}>
            {isSearching ? (
              <Flex w={"full"} align={"center"} justify={"center"}>
                <Loading />
              </Flex>
            ) : (
              hasSearched && (
                <TableContainer w={"full"}>
                  <Table>
                    <Thead>
                      <Tr>
                        <Th>Identifier</Th>
                        <Th display={{ base: "none", sm: "table-cell" }}>Created</Th>
                        <Th display={{ base: "none", sm: "table-cell" }}>Owner</Th>
                        <Th></Th>
                      </Tr>
                    </Thead>

                    <Tbody>
                      {results.length > 0 &&
                        results.map((result) => {
                          return (
                            <Tr key={result._id}>
                              <Td>{result.name}</Td>
                              <Td display={{ base: "none", sm: "table-cell" }}>{new Date(result.created).toDateString()}</Td>
                              <Td display={{ base: "none", sm: "table-cell" }}>{result.owner}</Td>
                              <Td>
                                <Flex justify={"right"}>
                                  <Button
                                    rightIcon={<ChevronRightIcon />}
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
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </Text>
                <Text>
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
                  nisi ut aliquip ex ea commodo consequat.
                </Text>
                <Text>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse
                  cillum dolore eu fugiat nulla pariatur.
                </Text>
                <Text>
                  Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
                  officia deserunt mollit anim id est laborum.
                </Text>
              </ModalBody>
            </ModalContent>
          </Modal>
        </Flex>
      )}
    </ContentContainer>
  );
};

export default Search;
