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
  Checkbox,
  Collapsible,
  Box,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

// Existing and custom types
import { IGenericItem, SearchBoxProps } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";
import { gql, useLazyQuery } from "@apollo/client";

// Limit the number of results shown
const MAX_RESULTS = 5;

const SearchBox = (props: SearchBoxProps) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inputWidth, setInputWidth] = useState<number | undefined>(undefined);

  // Default resultType to "entity" if not provided (so it's never undefined)
  const resultType = props.resultType || "entity";

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<{
    entities: boolean;
    projects: boolean;
    templates: boolean;
  }>({
    entities: resultType === "entity",
    projects: resultType === "project",
    templates: resultType === "template",
  });

  // Search status
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isError, setIsError] = useState(false);

  // Store results as a set of IDs
  const [results, setResults] = useState([] as IGenericItem[]);

  // Measure input width when dropdown opens
  useEffect(() => {
    if (!open) return;

    const updateWidth = () => {
      const input = document.querySelector(
        "[data-search-input]",
      ) as HTMLInputElement;
      if (input) setInputWidth(input.offsetWidth);
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [open]);

  // Handle click outside to close results
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
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

  // Determine resultType based on selected filters
  const getResultType = (): string | undefined => {
    const selectedCount =
      (selectedTypes.entities ? 1 : 0) +
      (selectedTypes.projects ? 1 : 0) +
      (selectedTypes.templates ? 1 : 0);

    // If all or none selected, search all types
    if (selectedCount === 0 || selectedCount === 3) {
      return undefined;
    }

    // If only one type selected, use that
    if (selectedCount === 1) {
      if (selectedTypes.entities) return "entity";
      if (selectedTypes.projects) return "project";
      if (selectedTypes.templates) return "template";
      // Fallback (shouldn't happen, but satisfies TypeScript)
      return undefined;
    }

    // Multiple types selected - search all (undefined means all)
    return undefined;
  };

  const runSearch = async () => {
    // Initial check if a specific ID search was not found
    setIsSearching(loading);
    setHasSearched(true);
    setResults([]);

    // Use filter selection if no explicit resultType prop was provided
    const searchResultType = props.resultType || getResultType();

    const results = await searchText({
      variables: {
        query: query,
        resultType: searchResultType,
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
            <Input
              data-search-input
              value={query}
              size={"xs"}
              rounded={"md"}
              placeholder={"Quick Search"}
              background={"white"}
              w={"100%"}
              borderColor={"gray.300"}
              onChange={(event) => setQuery(event.target.value)}
              onKeyUp={(event) => {
                // Listen for "Enter" key when entering a query
                if (event.key === "Enter" && query !== "") {
                  handleClick();
                }
              }}
            />

            <Button
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
              Search
              <Icon name={"search"} size={"xs"} />
            </Button>

            <Collapsible.Root
              open={filtersOpen}
              onOpenChange={(event) => setFiltersOpen(event.open)}
            >
              <Collapsible.Trigger asChild>
                <Button size={"xs"} rounded={"md"} variant={"outline"}>
                  <Icon name={"filter"} size={"xs"} />
                  Search Filters
                  <Icon name={filtersOpen ? "c_up" : "c_down"} size={"xs"} />
                </Button>
              </Collapsible.Trigger>
            </Collapsible.Root>
          </Flex>

          {/* Results dropdown - width matches input */}
          {open && (
            <Box
              position={"absolute"}
              top={"100%"}
              left={"0"}
              mt={"1"}
              zIndex={1000}
              rounded={"md"}
              border={"1px solid"}
              borderColor={"gray.300"}
              bg={"white"}
              shadow={"lg"}
              w={inputWidth ? `${inputWidth}px` : "100%"}
            >
              <Flex
                p={"1"}
                bg={"gray.100"}
                roundedTop={"md"}
                direction={"row"}
                gap={"1"}
                w={"100%"}
                align={"center"}
              >
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  Search Results:{" "}
                </Text>
                <Text fontSize={"xs"}>"{query}"</Text>
              </Flex>

              <Flex p={"1"} gap={"1"} py={"1"}>
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
                        results
                          .slice(0, MAX_RESULTS)
                          .map((result: IGenericItem) => {
                            const resultType =
                              (result as IGenericItem & { __typename?: string })
                                .__typename || "Entity";
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
                                  <Text
                                    color={"black"}
                                    fontWeight={"semibold"}
                                    fontSize={"xs"}
                                  >
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
                                  onClick={() =>
                                    handleResultClick(result._id, resultType)
                                  }
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

              <Flex
                p={"1"}
                bg={"gray.100"}
                roundedBottom={"md"}
                direction={"column"}
                gap={"1"}
              >
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
            </Box>
          )}
        </Box>

        {/* Collapsible Filters Content */}
        <Collapsible.Root
          open={filtersOpen}
          onOpenChange={(event) => setFiltersOpen(event.open)}
        >
          <Collapsible.Content>
            <Flex direction={"row"} gap={"2"} wrap={"wrap"} ml={"0.5"}>
              <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
                Include:
              </Text>
              <Checkbox.Root
                size={"xs"}
                colorPalette={"blue"}
                checked={selectedTypes.entities}
                onCheckedChange={(details) => {
                  setSelectedTypes({
                    ...selectedTypes,
                    entities: details.checked as boolean,
                  });
                }}
                disabled
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label fontSize={"xs"}>Entities</Checkbox.Label>
              </Checkbox.Root>

              <Checkbox.Root
                size={"xs"}
                colorPalette={"blue"}
                checked={selectedTypes.projects}
                onCheckedChange={(details) => {
                  setSelectedTypes({
                    ...selectedTypes,
                    projects: details.checked as boolean,
                  });
                }}
                disabled
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label fontSize={"xs"}>Projects</Checkbox.Label>
              </Checkbox.Root>

              <Checkbox.Root
                size={"xs"}
                colorPalette={"blue"}
                checked={selectedTypes.templates}
                onCheckedChange={(details) => {
                  setSelectedTypes({
                    ...selectedTypes,
                    templates: details.checked as boolean,
                  });
                }}
                disabled
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label fontSize={"xs"}>Templates</Checkbox.Label>
              </Checkbox.Root>
            </Flex>
          </Collapsible.Content>
        </Collapsible.Root>
      </Flex>
    </Box>
  );
};

export default SearchBox;
