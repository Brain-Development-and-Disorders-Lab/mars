import React, { useEffect, useMemo, useState } from "react";
import { Input, Button, Flex, InputGroup, Text, Spinner, Box, Stack, Separator } from "@chakra-ui/react";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

import { EntityModel, IGenericItem, SearchSelectProps } from "@types";

// Utility imports
import _, { debounce } from "lodash";
import { ignoreAbort } from "@lib/util";
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Workspace context
import { useWorkspace } from "@hooks/useWorkspace";

// Variables
import { GLOBAL_STYLES } from "@variables";

const SearchSelect = (props: SearchSelectProps) => {
  const inputRef = React.useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = React.useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Query to retrieve Entities
  const GET_ENTITIES = gql`
    query GetEntities($limit: Int, $archived: Boolean) {
      entities(limit: $limit, archived: $archived) {
        entities {
          _id
          name
        }
        total
      }
    }
  `;
  const [getEntities, { loading: entitiesLoading, error: entitiesError }] = useLazyQuery<{
    entities: { entities: IGenericItem[]; total: number };
  }>(GET_ENTITIES, { fetchPolicy: "network-only" });

  // Query to retrieve Entities
  const GET_PROJECTS = gql`
    query GetProjects($limit: Int) {
      projects(limit: $limit) {
        _id
        name
      }
    }
  `;
  const [getProjects, { loading: projectsLoading, error: projectsError }] = useLazyQuery<{
    projects: IGenericItem[];
  }>(GET_PROJECTS, { fetchPolicy: "network-only" });

  const [placeholder, setPlaceholder] = useState("Select Result");
  const [inputValue, setInputValue] = useState(props.value?.name || "");
  const [options, setOptions] = useState([] as IGenericItem[]);

  // Sync input display value when the selected value changes externally
  useEffect(() => {
    setInputValue(props.value?.name || "");
  }, [props.value]);

  const getSelectOptions = async () => {
    if (props.resultType == "entity") {
      // Get Entities
      const result = await getEntities({
        variables: {
          limit: 20,
        },
      });

      if (result.data?.entities?.entities) {
        setOptions(result.data.entities.entities);
      }
    } else {
      // Get Projects
      const result = await getProjects({
        variables: {
          limit: 20,
        },
      });

      if (result.data?.projects) {
        setOptions(result.data.projects);
      }
    }

    if (entitiesError || projectsError) {
      toaster.create({
        title: "Error",
        type: "error",
        description: "Error while retrieving options for selection",
        duration: 4000,
        closable: true,
      });
    }
  };

  // Retrieve the options on component load, depending on the specified target
  useEffect(() => {
    getSelectOptions().catch(ignoreAbort);

    // Set the placeholder text
    if (props.placeholder) {
      setPlaceholder(props.placeholder);
    } else if (props.resultType === "entity") {
      setPlaceholder("Search Entities...");
    } else if (props.resultType === "project") {
      setPlaceholder("Search Projects...");
    }
  }, []);

  const { workspace } = useWorkspace();

  // Re-fetch options when workspace changes
  useEffect(() => {
    getSelectOptions().catch(ignoreAbort);
  }, [workspace]);

  // Query to search by text value
  const SEARCH_TEXT = gql`
    query Search($query: String, $resultType: String, $isBuilder: Boolean, $showArchived: Boolean) {
      search(query: $query, resultType: $resultType, isBuilder: $isBuilder, showArchived: $showArchived) {
        __typename
        ... on Entity {
          _id
          name
          description
        }
        ... on Project {
          _id
          name
          description
        }
      }
    }
  `;
  const [searchText, { loading: searchLoading, error: searchError }] = useLazyQuery<{ search: EntityModel[] }>(
    SEARCH_TEXT,
    {
      fetchPolicy: "network-only",
    },
  );

  // State
  const [results, setResults] = useState([] as EntityModel[]);
  const [showResults, setShowResults] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // First result whose name starts with the current input, used for inline ghost text
  const topSuggestion = useMemo(() => {
    if (!inputValue) return null;
    const list = hasSearched ? results : options;
    return list.find((item) => item.name.toLowerCase().startsWith(inputValue.toLowerCase())) || null;
  }, [inputValue, hasSearched, results, options]);

  // Stable debounced fetch, useMemo ensures the debounce timer isn't reset on every render
  const fetchResults = useMemo(
    () =>
      debounce(async (query: string) => {
        const results = await searchText({
          variables: { query, resultType: props.resultType, isBuilder: false, showArchived: false },
        }).catch(ignoreAbort);
        if (!results) return;

        if (results.data?.search) {
          setResults(results.data.search);
          setHasSearched(true);
        } else {
          setResults([]);
        }

        if (searchError || !results.data?.search) {
          toaster.create({
            title: "Error",
            type: "error",
            description: searchError || "Unable to retrieve search results",
            duration: 4000,
            closable: true,
          });
        } else {
          setShowResults(true);
        }
      }, 300),
    [searchText],
  );

  /**
   * Handle clicking the `Input` component dropdown
   */
  const onInputClick = () => {
    if (props?.disabled !== true) {
      if (!showResults && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8, // 2pt = 8px spacing
          left: rect.left + window.scrollX,
          width: rect.width,
        });
        setShowResults(true);
        // Start animation after a tiny delay to allow initial state to render
        setTimeout(() => setIsAnimating(true), 10);
      } else {
        setIsAnimating(false);
        setTimeout(() => setShowResults(false), 150); // Allow animation to complete
      }
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);

    if (value === "") {
      setHasSearched(false);
      return;
    }

    if (!showResults && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
      setShowResults(true);
      setTimeout(() => setIsAnimating(true), 10);
    }

    fetchResults(value);
  };

  const handleSelectResult = (result: IGenericItem) => {
    setResults([]);
    setShowResults(false);
    setHasSearched(false);
    setInputValue(result.name);
    props.onChange?.(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" && topSuggestion) {
      e.preventDefault();
      handleSelectResult(topSuggestion);
    }
  };

  return (
    <Box id={props.id || "searchSelect"} position="relative" w="100%">
      <Box position="relative">
        <InputGroup
          ref={inputRef}
          data-testid={"search-select"}
          onClick={onInputClick}
          endElement={showResults ? <Icon name={"c_up"} size={"xs"} /> : <Icon name={"c_down"} size={"xs"} />}
        >
          <Input
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            backgroundColor={"transparent"}
            data-testid={"value-editor"}
            size={"xs"}
            rounded={props.isEmbedded ? "none" : "md"}
            border={props.isEmbedded ? "none" : GLOBAL_STYLES.border.style}
            borderColor={props.isEmbedded ? "" : GLOBAL_STYLES.border.color}
            disabled={props?.disabled || false}
          />
        </InputGroup>
        {topSuggestion && (
          <Box
            position="absolute"
            inset="0"
            display="flex"
            alignItems="center"
            px="2"
            fontSize="xs"
            pointerEvents="none"
            overflow="hidden"
            whiteSpace="nowrap"
            bg="white"
            zIndex={-1}
          >
            <Text as="span" opacity={0} whiteSpace="pre">
              {inputValue}
            </Text>
            <Text as="span" color="gray.400" whiteSpace="pre">
              {topSuggestion.name.slice(inputValue.length)}
            </Text>
          </Box>
        )}
      </Box>
      {showResults && (
        <>
          {/* Capture external clicks */}
          <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            zIndex="9998"
            onClick={() => {
              setIsAnimating(false);
              setTimeout(() => setShowResults(false), 150);
            }}
            opacity={isAnimating ? 1 : 0}
            transition="opacity 0.15s ease-in-out"
          />
          {/* Dropdown */}
          <Box
            position="fixed"
            top={dropdownPosition.top - 5}
            left={dropdownPosition.left}
            width={dropdownPosition.width}
            bg="white"
            border={GLOBAL_STYLES.border.style}
            borderColor={GLOBAL_STYLES.border.color}
            borderRadius="sm"
            shadow="md"
            zIndex="9999"
            p="1"
            opacity={isAnimating ? 1 : 0}
            transform={isAnimating ? "translateY(0)" : "translateY(-8px)"}
            transition="all 0.15s ease-in-out"
          >
            <Box maxH="200px" overflowY="auto" className={"search-select-results"}>
              {/* Has searched, search operation complete, multiple results */}
              {hasSearched && searchLoading === false && results.length > 0 && (
                <Stack gap="1" separator={<Separator />} w="100%">
                  {results.map((result: IGenericItem) => (
                    <Button
                      key={result._id}
                      variant="ghost"
                      onClick={() => handleSelectResult(result)}
                      width="full"
                      disabled={searchLoading}
                      size="xs"
                      justifyContent="flex-start"
                    >
                      {result.name}
                    </Button>
                  ))}
                </Stack>
              )}

              {/* Has searched, search operation complete, no results */}
              {hasSearched && searchLoading === false && results.length === 0 && (
                <Flex w="100%" minH="100px" align="center" justify="center">
                  <Text fontSize="sm" fontWeight="semibold">
                    No Results
                  </Text>
                </Flex>
              )}

              {/* Has not yet searched, show pre-loaded options */}
              {!hasSearched && inputValue === "" && searchLoading === false && options && options.length > 0 && (
                <Stack gap="1" separator={<Separator />} w="100%">
                  {options.map((option: IGenericItem) => (
                    <Button
                      key={option._id}
                      variant="ghost"
                      onClick={() => handleSelectResult(option)}
                      width="full"
                      disabled={entitiesLoading || projectsLoading}
                      size="xs"
                      justifyContent="flex-start"
                    >
                      {_.truncate(option.name, { length: 24 })}
                    </Button>
                  ))}
                </Stack>
              )}

              {/* Search pending or in-progress */}
              {(searchLoading === true || (inputValue.length > 0 && !hasSearched)) && (
                <Flex w="100%" minH="100px" align="center" justify="center">
                  <Spinner />
                </Flex>
              )}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default SearchSelect;
