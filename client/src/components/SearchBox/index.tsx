// React
import React, { useState } from "react";

// Existing and custom components
import {
  Flex,
  Input,
  useToast,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
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

// Utility functions and libraries
import { request } from "@database/functions";
import _ from "lodash";

// Limit the number of results shown
const MAX_RESULTS = 5;

const SearchBox = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const { isOpen, onToggle, onClose } = useDisclosure();
  const [query, setQuery] = useState("");

  // Search status
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isError, setIsError] = useState(false);

  // Store results as a set of IDs
  const [results, setResults] = useState([] as EntityModel[]);

  const runSearch = async () => {
    // Use the new search route for text-based search
    setIsSearching(true);
    setHasSearched(true);

    const response = await request<EntityModel[]>("POST", "/entities/search/", {
      query: query,
    });
    if (response.success) {
      if (response.data.length > 0) {
        setResults(response.data);
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
    } else {
      toast({
        title: "Search Error",
        description: "Could not perform search",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
      });
      setIsError(true);
    }
    setIsSearching(false);
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
    <Flex w={"100%"} maxW={"xl"} p={"1"}>
      <Popover
        isOpen={isOpen}
        onClose={onCloseWrapper}
        placement={"bottom"}
        matchWidth
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
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader>
            <Flex align={"center"} gap={"1"}>
              {isSearching ? (
                <Spinner size={"sm"} />
              ) : (
                <Text fontWeight={"bold"}>{results.length}</Text>
              )}{" "}
              results for "{query}"
            </Flex>
          </PopoverHeader>
          <PopoverBody>
            <Flex gap={"2"} p={"2"}>
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
                    gap={"4"}
                    divider={<StackDivider borderColor={"gray.200"} />}
                    w={"100%"}
                  >
                    {results.length > 0 ? (
                      results.slice(0, MAX_RESULTS).map((result) => {
                        return (
                          <Flex
                            key={result._id}
                            direction={"row"}
                            gap={"4"}
                            w={"100%"}
                          >
                            <Text as={"b"}>{result.name}</Text>
                            <Spacer />
                            <Link onClick={() => handleResultClick(result._id)}>
                              <Flex
                                gap={"1"}
                                direction={"row"}
                                align={"center"}
                              >
                                <Text>View</Text>
                                <Icon name={"a_right"} />
                              </Flex>
                            </Link>
                          </Flex>
                        );
                      })
                    ) : (
                      <Flex m={"4"}>No results found.</Flex>
                    )}
                  </VStack>
                )
              )}
            </Flex>
          </PopoverBody>
          <PopoverFooter>
            <Flex width={"100%"} gap={"1"}>
              View more results using{" "}
              <Link
                onClick={() => {
                  // Close the popover and navigate to the `/search` route
                  onCloseWrapper();
                  navigate("/search");
                }}
              >
                <Flex gap={"1"} direction={"row"} align={"center"}>
                  <Text>Search</Text>
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
