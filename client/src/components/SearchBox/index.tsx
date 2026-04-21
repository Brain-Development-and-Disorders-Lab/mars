// React
import React, { useState, useRef, useEffect } from "react";

// Existing and custom components
import {
  Flex,
  Input,
  Text,
  Link,
  Spinner,
  Stack,
  Skeleton,
  Separator,
  Button,
  Collapsible,
  Box,
  InputGroup,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

// Existing and custom types
import { EntityModel, IGenericItem } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// GraphQL imports
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Utility imports
import { ignoreAbort } from "@lib/util";

// Variables
import { GLOBAL_STYLES } from "@variables";

// Limit the number of results shown
const MAX_RESULTS = 5;

const SearchBox = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inputWidth, setInputWidth] = useState<number | undefined>(undefined);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Search status
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isError, setIsError] = useState(false);

  // Store results as a set of IDs
  const [results, setResults] = useState([] as IGenericItem[]);

  // Measure input + search button width when dropdown opens
  useEffect(() => {
    if (!open) return;

    const updateWidth = () => {
      const input = document.querySelector("[data-search-input]") as HTMLInputElement;
      const searchButton = document.querySelector("[data-search-button]") as HTMLElement;
      if (input && searchButton) {
        // Get the gap between elements (1 unit = 4px in Chakra)
        const gap = 4;
        setInputWidth(input.offsetWidth + searchButton.offsetWidth + gap);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [open]);

  // Handle click outside to close results
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    // Handle escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // Query to search by text value
  const SEARCH_TEXT = gql`
    query Search(
      $query: String
      $resultType: String
      $isBuilder: Boolean
      $showArchived: Boolean
      $filters: EntityFilterInput
    ) {
      search(
        query: $query
        resultType: $resultType
        isBuilder: $isBuilder
        showArchived: $showArchived
        filters: $filters
      ) {
        __typename
        ... on Entity {
          _id
          name
          owner
          archived
          description
          projects
          attributes {
            _id
            name
            description
            values {
              _id
              name
              type
              data
            }
          }
        }
      }
    }
  `;
  const [searchText, { error }] = useLazyQuery<{ search: EntityModel[] }>(SEARCH_TEXT, { fetchPolicy: "network-only" });

  // Query to translate the natural language to MongoDB JSON search
  const TRANSLATE_SEARCH = gql`
    query TranslateSearch($query: String!) {
      translateSearch(query: $query)
    }
  `;
  const [runTranslateSearch] = useLazyQuery<{ translateSearch: string }>(TRANSLATE_SEARCH, {
    fetchPolicy: "network-only",
  });

  const runSearch = async () => {
    // Initial check if a specific ID search was not found
    setIsSearching(true);
    setHasSearched(true);
    setResults([]);

    const translation = await runTranslateSearch({ variables: { query } }).catch(ignoreAbort);

    if (!translation || !translation.data?.translateSearch) {
      setIsSearching(false);
      return;
    } else if (translation.error) {
      toaster.create({
        title: "Error",
        type: "error",
        description: "Unable to translate query, please try again",
        duration: 2000,
        closable: true,
      });
      setIsSearching(false);
      return;
    }

    const results = await searchText({
      variables: {
        query: translation.data.translateSearch,
        resultType: "entity",
        isBuilder: true,
        showArchived: false,
      },
    }).catch(ignoreAbort);

    if (!results) {
      setIsSearching(false);
      return;
    }

    if (error || !results.data?.search) {
      toaster.create({
        title: "Error",
        type: "error",
        description: "Unable to retrieve search results",
        duration: 4000,
        closable: true,
      });
      setIsError(true);
    } else {
      setResults(results.data.search);
    }

    setIsSearching(false);
    return;
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
  const handleResultClick = (id: string, type?: string) => {
    setQuery("");
    setOpen(false);
    // Determine route based on result type
    if (type === "Project") {
      navigate(`/projects/${id}`);
    } else if (type === "Entity") {
      navigate(`/entities/${id}`);
    } else {
      // Default to entity for backwards compatibility
      navigate(`/entities/${id}`);
    }
  };

  return (
    <Box ref={containerRef} w={"100%"}>
      <Flex direction={"column"} gap={filtersOpen ? "1" : "0"} w={"100%"}>
        {/* Input row with dropdown - wrapped in relative container */}
        <Box position={"relative"} w={"100%"}>
          <Flex gap={"1"} align={"center"} w={"100%"}>
            <InputGroup startElement={<Icon name={"lightning"} size={"xs"} color={"purple.400"} />}>
              <Input
                data-search-input
                value={query}
                rounded={"md"}
                size={"xs"}
                placeholder={"Describe what you're looking for..."}
                background={"white"}
                w={"100%"}
                borderColor={"purple.400"}
                outlineColor={"purple.400"}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setOpen(false);
                  setHasSearched(false);
                  setIsError(false);
                  setResults([]);
                }}
                onKeyUp={(event) => {
                  // Listen for "Enter" key when entering a query
                  if (event.key === "Enter" && query !== "") {
                    handleClick();
                  }
                }}
              />
            </InputGroup>

            <Button
              data-search-button
              size={"xs"}
              rounded={"md"}
              colorPalette={"purple"}
              disabled={query === ""}
              loading={isSearching}
              loadingText={"Searching..."}
              onClick={() => {
                if (query !== "") {
                  handleClick();
                }
              }}
            >
              Search
              <Icon name={"search"} size={"xs"} />
            </Button>

            <Collapsible.Root open={filtersOpen} onOpenChange={(event) => setFiltersOpen(event.open)}>
              <Collapsible.Trigger asChild>
                <Button size={"xs"} rounded={"md"} variant={"outline"}>
                  <Icon name={"filter"} size={"xs"} />
                  Search Filters
                  <Icon name={filtersOpen ? "c_up" : "c_down"} size={"xs"} />
                </Button>
              </Collapsible.Trigger>
            </Collapsible.Root>
          </Flex>

          {/* Results dropdown */}
          {open && (
            <Box
              position={"absolute"}
              top={"100%"}
              left={"0"}
              mt={"1"}
              zIndex={1000}
              rounded={"md"}
              border={GLOBAL_STYLES.border.style}
              borderColor={GLOBAL_STYLES.border.color}
              bg={"white"}
              shadow={"lg"}
              w={inputWidth ? `${inputWidth}px` : "100%"}
            >
              <Flex p={"1"} bg={"gray.100"} roundedTop={"md"} direction={"column"} gap={"1"}>
                <Flex width={"100%"} direction={"row"} gap={"1"} align={"center"}>
                  {isSearching ? (
                    <Spinner size={"xs"} />
                  ) : (
                    <Text fontWeight={"bold"} fontSize={"xs"}>
                      {results.length > MAX_RESULTS ? MAX_RESULTS : results.length}{" "}
                    </Text>
                  )}
                  <Text fontSize={"xs"}>
                    result
                    {results.length > 1 || results.length === 0 ? "s" : ""}, view more using{" "}
                  </Text>
                  <Link
                    className={"light"}
                    color={"black"}
                    variant={"underline"}
                    fontWeight={"semibold"}
                    gap={"1"}
                    fontSize={"xs"}
                    onClick={() => {
                      // Close the dropdown and navigate to the `/search` route
                      onCloseWrapper();
                      navigate("/search");
                    }}
                  >
                    Search
                    <Icon name={"a_right"} color={"black"} size={"xs"} />
                  </Link>
                </Flex>
              </Flex>

              <Flex p={"1"} gap={"1"} py={"1"} roundedTop={"md"}>
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
                        results.slice(0, MAX_RESULTS).map((result: IGenericItem) => {
                          const resultType = (result as IGenericItem & { __typename?: string }).__typename || "Entity";
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
                              <Flex direction={"column"} gap={"0.5"}>
                                <Text color={"black"} fontWeight={"semibold"} fontSize={"xs"}>
                                  {result.name}
                                </Text>
                                <Text fontSize={"2xs"} color={"gray.500"}>
                                  {resultType}
                                </Text>
                              </Flex>
                              <Button
                                size="2xs"
                                mx={"1"}
                                variant="subtle"
                                colorPalette="gray"
                                aria-label={`View ${resultType}`}
                                onClick={() => handleResultClick(result._id, resultType)}
                              >
                                View
                                <Icon name={"a_right"} color={"black"} size={"xs"} />
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
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default SearchBox;
