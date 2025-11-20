// React
import React, { useState } from "react";

// Existing and custom components
import {
  Flex,
  Input,
  Text,
  Popover,
  Link,
  Spinner,
  Stack,
  Skeleton,
  IconButton,
  Separator,
  Button,
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
    <Popover.Root
      open={open}
      onInteractOutside={() => setOpen(false)}
      onEscapeKeyDown={() => setOpen(false)}
    >
      <Flex gap={"2"} align={"center"} w={"100%"}>
        <Popover.Trigger w={"100%"}>
          <Input
            value={query}
            size={"xs"}
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
        </Popover.Trigger>
        <IconButton
          size={"xs"}
          rounded={"md"}
          colorPalette={"green"}
          disabled={query === ""}
          onClick={() => {
            if (query !== "") {
              handleClick();
            }
          }}
        >
          <Icon name={"search"} size={"xs"} />
        </IconButton>
      </Flex>

      <Popover.Positioner>
        <Popover.Content rounded={"md"}>
          <Popover.Header p={"1"} bg={"gray.100"} roundedTop={"md"}>
            <Flex direction={"row"} gap={"1"} w={"100%"} align={"center"}>
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                Search Results:{" "}
              </Text>
              <Text fontSize={"xs"}>"{query}"</Text>
            </Flex>
          </Popover.Header>

          <Popover.Body p={"1"}>
            <Flex gap={"1"} py={"1"}>
              {isSearching ? (
                <Stack w={"100%"}>
                  <Skeleton height={"30px"} />
                  <Skeleton height={"30px"} />
                  <Skeleton height={"30px"} />
                </Stack>
              ) : (
                hasSearched &&
                !isError && (
                  <Stack gap={"1"} separator={<Separator />} w={"100%"}>
                    {results.length > 0 ? (
                      results.slice(0, MAX_RESULTS).map((result) => {
                        return (
                          <Flex
                            key={result._id}
                            direction={"row"}
                            gap={"1"}
                            w={"100%"}
                            justify={"space-between"}
                            align={"center"}
                            p={"0"}
                          >
                            <Text
                              color={"black"}
                              fontWeight={"semibold"}
                              fontSize={"xs"}
                            >
                              {result.name}
                            </Text>
                            <Button
                              size="2xs"
                              mx={"1"}
                              variant="outline"
                              colorPalette="gray"
                              aria-label={"View Entity"}
                              onClick={() => handleResultClick(result._id)}
                            >
                              View
                              <Icon
                                name={"a_right"}
                                color={"black"}
                                size={"xs"}
                              />
                            </Button>
                          </Flex>
                        );
                      })
                    ) : (
                      <Flex m={"2"}>
                        <Text fontWeight={"semibold"} fontSize={"xs"}>
                          No results found.
                        </Text>
                      </Flex>
                    )}
                  </Stack>
                )
              )}
            </Flex>
          </Popover.Body>

          <Popover.Footer p={"1"} bg={"gray.100"} roundedBottom={"md"}>
            <Flex direction={"column"} gap={"1"}>
              <Flex width={"100%"} direction={"row"} gap={"1"}>
                <Text fontSize={"xs"}>Showing </Text>
                {isSearching ? (
                  <Spinner size={"sm"} />
                ) : (
                  <Text fontWeight={"bold"} fontSize={"xs"}>
                    {results.length > MAX_RESULTS
                      ? MAX_RESULTS
                      : results.length}{" "}
                  </Text>
                )}
                <Text fontSize={"xs"}>results, view more using </Text>
                <Link
                  className={"light"}
                  color={"black"}
                  variant={"underline"}
                  fontWeight={"semibold"}
                  gap={"1"}
                  fontSize={"xs"}
                  onClick={() => {
                    // Close the popover and navigate to the `/search` route
                    onCloseWrapper();
                    navigate("/search");
                  }}
                >
                  Search
                  <Icon name={"a_right"} color={"black"} size={"xs"} />
                </Link>
              </Flex>
            </Flex>
          </Popover.Footer>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
};

export default SearchBox;
