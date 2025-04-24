// React
import React, { useState } from "react";

// Existing and custom components
import {
  Flex,
  Input,
  Text,
  Popover,
  Link,
  Spacer,
  VStack,
  Spinner,
  Stack,
  Skeleton,
  Portal,
  IconButton,
  StackSeparator,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

// Existing and custom types
import { IGenericItem, SearchBoxProps } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";
import { gql, useLazyQuery } from "@apollo/client";

// Workspace context
import { useWorkspace } from "@hooks/useWorkspace";

// Limit the number of results shown
const MAX_RESULTS = 5;

const SearchBox = (props: SearchBoxProps) => {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Workspace context
  const { workspace } = useWorkspace();

  // Search status
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isError, setIsError] = useState(false);

  // Store results as a set of IDs
  const [results, setResults] = useState([] as IGenericItem[]);

  // Query to search by text value
  const SEARCH_TEXT = gql`
    query Search(
      $query: String
      $resultType: String
      $isBuilder: Boolean
      $showArchived: Boolean
    ) {
      search(
        query: $query
        resultType: $resultType
        isBuilder: $isBuilder
        showArchived: $showArchived
      ) {
        __typename
        ... on Entity {
          _id
          name
        }
        ... on Project {
          _id
          name
        }
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
        resultType: props.resultType,
        isBuilder: false,
        showArchived: false,
      },
    });

    if (results.data.search) {
      setResults(results.data.search);
    }

    if (error) {
      setIsError(true);
      toaster.create({
        title: "Error",
        type: "error",
        description: error.message,
        duration: 4000,
        closable: true,
      });
    }

    setIsSearching(loading);
  };

  const onCloseWrapper = () => {
    // Reset search state
    setResults([]);
    setQuery("");

    // Existing `onClose` function
    setOpen(false);
  };

  // Basic handler to display results
  const handleClick = () => {
    setOpen(true);
    runSearch();
  };

  // Basic handler to navigate to a result
  const handleResultClick = (id: string) => {
    setQuery("");
    setOpen(false);
    navigate(`/entities/${id}`);
  };

  return (
    <Flex w={"100%"} p={"0"}>
      <Popover.Root
        open={open}
        onInteractOutside={() => setOpen(false)}
        onEscapeKeyDown={() => setOpen(false)}
      >
        <Popover.Trigger asChild>
          <Flex w={"100%"} gap={"2"} align={"center"}>
            <Input
              value={query}
              size={"sm"}
              rounded={"md"}
              placeholder={"Quick Search"}
              background={"white"}
              disabled={workspace === ""}
              onChange={(event) => setQuery(event.target.value)}
              onKeyUp={(event) => {
                // Listen for "Enter" key when entering a query
                if (event.key === "Enter" && query !== "") {
                  handleClick();
                }
              }}
            />
            <IconButton
              size={"sm"}
              rounded={"md"}
              colorPalette={"blue"}
              disabled={query === ""}
              onClick={() => {
                if (query !== "") {
                  handleClick();
                }
              }}
            >
              <Icon name={"search"} />
            </IconButton>
          </Flex>
        </Popover.Trigger>

        <Portal>
          <Popover.Positioner>
            <Popover.Content w={"100%"}>
              <Popover.Header>
                <Flex align={"center"} gap={"1"}>
                  <Text fontSize={"sm"}>
                    Showing{" "}
                    {results.length > MAX_RESULTS
                      ? MAX_RESULTS
                      : results.length}{" "}
                    of
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
              </Popover.Header>

              <Popover.Body>
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
                        gap={"2"}
                        separator={<StackSeparator />}
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
                                <Text color={"black"} fontSize={"sm"}>
                                  {result.name}
                                </Text>
                                <Spacer />
                                <Link
                                  className={"light"}
                                  color={"black"}
                                  variant={"underline"}
                                  fontWeight={"semibold"}
                                  gap={"1"}
                                  onClick={() => handleResultClick(result._id)}
                                >
                                  View
                                  <Icon name={"a_right"} color={"black"} />
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
              </Popover.Body>

              <Popover.Footer>
                <Flex width={"100%"} gap={"1"}>
                  <Text fontSize={"sm"} color={"black"}>
                    View all results using{" "}
                  </Text>
                  <Link
                    className={"light"}
                    color={"black"}
                    variant={"underline"}
                    fontWeight={"semibold"}
                    gap={"1"}
                    onClick={() => {
                      // Close the popover and navigate to the `/search` route
                      onCloseWrapper();
                      navigate("/search");
                    }}
                  >
                    Search
                    <Icon name={"a_right"} color={"black"} />
                  </Link>
                </Flex>
              </Popover.Footer>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </Flex>
  );
};

export default SearchBox;
