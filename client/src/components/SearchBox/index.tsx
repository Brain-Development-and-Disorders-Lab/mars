// React
import React, { useContext, useState } from "react";

// Existing and custom components
import {
  Flex,
  Input,
  useToast,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  useDisclosure,
  Link,
  Spacer,
  VStack,
  StackDivider,
  Spinner,
  Stack,
  Skeleton,
  PopoverFooter,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import Icon from "@components/Icon";

// Existing and custom types
import { EntityModel } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";
import { gql, useLazyQuery } from "@apollo/client";

// Workspace context
import { WorkspaceContext } from "../../Context";

// Limit the number of results shown
const MAX_RESULTS = 5;

const SearchBox = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const { isOpen, onToggle, onClose } = useDisclosure();
  const [query, setQuery] = useState("");

  // Workspace context
  const { workspace } = useContext(WorkspaceContext);

  // Search status
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isError, setIsError] = useState(false);

  // Store results as a set of IDs
  const [results, setResults] = useState([] as EntityModel[]);

  // Query to search by text value
  const SEARCH_TEXT = gql`
    query Search($query: String, $isBuilder: Boolean, $limit: Int) {
      search(query: $query, isBuilder: $isBuilder, limit: $limit) {
        _id
        name
        description
      }
    }
  `;
  const [searchText, { loading, error }] = useLazyQuery(SEARCH_TEXT);

  const runSearch = async () => {
    // Initial check if a specific ID search was not found
    setIsSearching(loading);
    setHasSearched(true);
    setResults([]);

    const results = await searchText({
      variables: {
        query: query,
        isBuilder: false,
        limit: 100,
      },
    });

    if (results.data.search) {
      setResults(results.data.search);
    }

    if (error) {
      setIsError(true);
      toast({
        title: "Error",
        status: "error",
        description: error.message,
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }

    setIsSearching(loading);
  };

  const onCloseWrapper = () => {
    // Reset search state
    setResults([]);
    setQuery("");

    // Existing `onClose` function
    onClose();
  };

  // Basic handler to display results
  const handleClick = () => {
    onToggle();
    runSearch();
  };

  // Basic handler to navigate to a result
  const handleResultClick = (id: string) => {
    setQuery("");
    onClose();
    navigate(`/entities/${id}`);
  };

  return (
    <Flex w={"100%"} p={"0"}>
      <Popover
        isOpen={isOpen}
        onClose={onCloseWrapper}
        placement={"bottom-end"}
      >
        <PopoverTrigger>
          <Flex w={"100%"} gap={"4"}>
            <InputGroup size={"sm"}>
              <InputLeftElement pointerEvents={"none"}>
                <Icon name={"search"} />
              </InputLeftElement>
              <Input
                value={query}
                rounded={"md"}
                placeholder={"Quick Search"}
                background={"white"}
                isDisabled={workspace === ""}
                onChange={(event) => setQuery(event.target.value)}
                onKeyUp={(event) => {
                  // Listen for "Enter" key when entering a query
                  if (event.key === "Enter" && query !== "") {
                    handleClick();
                  }
                }}
              />
            </InputGroup>
          </Flex>
        </PopoverTrigger>

        <PopoverContent w={"100%"}>
          <PopoverCloseButton />
          <PopoverHeader>
            <Flex align={"center"} gap={"1"}>
              <Text fontSize={"sm"}>
                Showing{" "}
                {results.length > MAX_RESULTS ? MAX_RESULTS : results.length} of
              </Text>
              {isSearching ? (
                <Spinner size={"sm"} />
              ) : (
                <Text fontWeight={"bold"} fontSize={"sm"}>
                  {results.length}
                </Text>
              )}
              <Text fontSize={"sm"}>results</Text>
            </Flex>
          </PopoverHeader>

          <PopoverBody>
            <Flex gap={"2"} py={"1"}>
              {isSearching ? (
                <Stack w={"100%"}>
                  <Skeleton height={"30px"} />
                  <Skeleton height={"30px"} />
                  <Skeleton height={"30px"} />
                </Stack>
              ) : (
                hasSearched &&
                !isError && (
                  <VStack
                    gap={"1"}
                    divider={<StackDivider borderColor={"gray.200"} />}
                    w={"100%"}
                  >
                    {results.length > 0 ? (
                      results.slice(0, MAX_RESULTS).map((result) => {
                        return (
                          <Flex
                            key={result._id}
                            direction={"row"}
                            gap={"2"}
                            w={"100%"}
                          >
                            <Text fontWeight={"semibold"} fontSize={"sm"}>
                              {result.name}
                            </Text>
                            <Spacer />
                            <Link onClick={() => handleResultClick(result._id)}>
                              <Flex
                                gap={"1"}
                                direction={"row"}
                                align={"center"}
                              >
                                <Text fontSize={"sm"}>View</Text>
                                <Icon name={"a_right"} />
                              </Flex>
                            </Link>
                          </Flex>
                        );
                      })
                    ) : (
                      <Flex m={"2"}>
                        <Text fontWeight={"semibold"} fontSize={"sm"}>
                          No results found.
                        </Text>
                      </Flex>
                    )}
                  </VStack>
                )
              )}
            </Flex>
          </PopoverBody>

          <PopoverFooter>
            <Flex width={"100%"} gap={"1"}>
              <Text fontSize={"sm"}>View all results using </Text>
              <Link
                onClick={() => {
                  // Close the popover and navigate to the `/search` route
                  onCloseWrapper();
                  navigate("/search");
                }}
              >
                <Flex gap={"1"} direction={"row"} align={"center"}>
                  <Text fontSize={"sm"}>Search</Text>
                  <Icon name={"a_right"} />
                </Flex>
              </Link>
            </Flex>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
    </Flex>
  );
};

export default SearchBox;
