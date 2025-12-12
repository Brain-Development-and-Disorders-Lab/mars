import React, { useEffect, useState } from "react";
import {
  Input,
  Button,
  Flex,
  InputGroup,
  Text,
  Spinner,
  Box,
} from "@chakra-ui/react";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

import { EntityModel, IGenericItem, SearchSelectProps } from "@types";

// Utility imports
import { debounce } from "lodash";
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";
import _ from "lodash";

// Workspace context
import { useWorkspace } from "@hooks/useWorkspace";

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
  const [getEntities, { loading: entitiesLoading, error: entitiesError }] =
    useLazyQuery<{
      entities: { entities: IGenericItem[]; total: number };
    }>(GET_ENTITIES);

  // Query to retrieve Entities
  const GET_PROJECTS = gql`
    query GetProjects($limit: Int) {
      projects(limit: $limit) {
        _id
        name
      }
    }
  `;
  const [getProjects, { loading: projectsLoading, error: projectsError }] =
    useLazyQuery<{
      projects: IGenericItem[];
    }>(GET_PROJECTS);

  const [placeholder, setPlaceholder] = useState("Select Result");
  const [options, setOptions] = useState([] as IGenericItem[]);

  const getSelectOptions = async () => {
    if (props.resultType == "entity") {
      // Get Entities
      const result = await getEntities({
        variables: {
          limit: 20,
          archived: true,
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
    getSelectOptions();

    // Set the placeholder text
    if (props.placeholder) {
      setPlaceholder(props.placeholder);
    } else if (props.resultType === "entity") {
      setPlaceholder("Select Entity");
    } else if (props.resultType === "project") {
      setPlaceholder("Select Project");
    }
  }, []);

  const { workspace } = useWorkspace();

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    getSelectOptions();
  }, [workspace]);

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
  const [searchText, { loading: searchLoading, error: searchError }] =
    useLazyQuery<{ search: EntityModel[] }>(SEARCH_TEXT);

  // State
  const [results, setResults] = useState([] as EntityModel[]);
  const [showResults, setShowResults] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Function to fetch results based on the search term
  const fetchResults = debounce(async (query) => {
    const results = await searchText({
      variables: {
        query: query,
        resultType: props.resultType,
        isBuilder: false,
        showArchived: false,
      },
    });

    if (results.data?.search) {
      setResults(results.data.search);

      // Once results have been updated, set `hasSearched` state
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
  }, 200);

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

  /**
   * Handle search text input
   * @param event Input event
   */
  const handleInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.value === "") {
      // Case where search input is empty, reset `hasSearched` state
      setHasSearched(false);
    }

    if (event.target.value.length > 0) {
      await fetchResults(event.target.value);
    }
  };

  /**
   * Handle selecting an result from the collection of search results
   * @param {IGenericItem} result Selected result
   */
  const handleSelectResult = (result: IGenericItem) => {
    // Reset state
    setResults([]);
    setShowResults(false);
    setHasSearched(false);

    // Invoke the `onChange` callback if specified
    props.onChange?.(result);
  };

  return (
    <Box id={props.id || "searchSelect"} position="relative" w="100%">
      <InputGroup
        ref={inputRef}
        data-testid={"search-select"}
        onClick={onInputClick}
        endElement={
          showResults ? <Icon name={"c_up"} /> : <Icon name={"c_down"} />
        }
      >
        <Input
          placeholder={placeholder}
          value={props.value?.name || ""}
          backgroundColor={"white"}
          data-testid={"value-editor"}
          size={"xs"}
          rounded={props.isEmbedded ? "none" : "md"}
          border={props.isEmbedded ? "none" : "1px solid"}
          borderColor={props.isEmbedded ? "" : "gray.300"}
          disabled={props?.disabled || false}
          readOnly
        />
      </InputGroup>
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
            border="1px"
            borderColor="gray.300"
            borderRadius="sm"
            shadow="md"
            zIndex="9999"
            p="1"
            opacity={isAnimating ? 1 : 0}
            transform={isAnimating ? "translateY(0)" : "translateY(-8px)"}
            transition="all 0.15s ease-in-out"
          >
            <Input
              className={"search-select-input"}
              size={"xs"}
              rounded={"md"}
              placeholder={"Search"}
              onChange={handleInputChange}
              autoFocus
              mb={"2"}
            />

            <Box
              maxH="200px"
              overflowY="auto"
              className={"search-select-results"}
            >
              {/* Has searched, search operation complete, multiple results */}
              {hasSearched &&
                searchLoading === false &&
                results.length > 0 &&
                results.map((result: IGenericItem) => (
                  <Button
                    key={result._id}
                    variant="ghost"
                    onClick={() => handleSelectResult(result)}
                    width="full"
                    disabled={searchLoading}
                    size="xs"
                    justifyContent="flex-start"
                    mb="1"
                  >
                    {result.name}
                  </Button>
                ))}

              {/* Has searched, search operation complete, no results */}
              {hasSearched &&
                searchLoading === false &&
                results.length === 0 && (
                  <Flex w="100%" minH="100px" align="center" justify="center">
                    <Text fontSize="sm" fontWeight="semibold">
                      No Results
                    </Text>
                  </Flex>
                )}

              {/* Has not yet searched, search operation complete */}
              {!hasSearched &&
                searchLoading === false &&
                options &&
                options.length > 0 &&
                options.map((option: IGenericItem) => (
                  <Button
                    key={option._id}
                    variant="ghost"
                    onClick={() => handleSelectResult(option)}
                    width="full"
                    disabled={entitiesLoading || projectsLoading}
                    size="xs"
                    justifyContent="flex-start"
                    mb="1"
                  >
                    {_.truncate(option.name, { length: 24 })}
                  </Button>
                ))}

              {/* Search operation in-progress */}
              {searchLoading === true && (
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
