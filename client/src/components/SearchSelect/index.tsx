// React imports
import React, { useEffect, useMemo, useRef, useState } from "react";

// Custom and existing components
import { Input, Flex, InputGroup, Text, Spinner, Box } from "@chakra-ui/react";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

// Custom types
import { EntityModel, IGenericItem, SearchSelectProps } from "@types";

// Utility imports
import { debounce } from "lodash";
import { ignoreAbort } from "@lib/util";
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Context hooks
import { useWorkspace } from "@hooks/useWorkspace";

// Variables
import { GLOBAL_STYLES } from "@variables";

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

const GET_PROJECTS = gql`
  query GetProjects($limit: Int) {
    projects(limit: $limit) {
      _id
      name
    }
  }
`;

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

const SearchSelect = (props: SearchSelectProps) => {
  const inputRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isAnimating, setIsAnimating] = useState(false);

  const [getEntities, { loading: entitiesLoading, error: entitiesError }] = useLazyQuery<{
    entities: { entities: IGenericItem[]; total: number };
  }>(GET_ENTITIES, { fetchPolicy: "network-only" });

  const [getProjects, { loading: projectsLoading, error: projectsError }] = useLazyQuery<{
    projects: IGenericItem[];
  }>(GET_PROJECTS, { fetchPolicy: "network-only" });

  const [searchText, { loading: searchLoading, error: searchError }] = useLazyQuery<{ search: EntityModel[] }>(
    SEARCH_TEXT,
    { fetchPolicy: "network-only" },
  );

  const [inputValue, setInputValue] = useState(props.value?.name || "");
  const [options, setOptions] = useState<IGenericItem[]>([]);
  const [results, setResults] = useState<EntityModel[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const placeholder =
    props.placeholder ?? (props.resultType === "entity" ? "Search Entities..." : "Search Projects...");

  const isLoading = entitiesLoading || projectsLoading || searchLoading || (isTyping && !hasSearched);

  const iconName = props.resultType === "entity" ? "entity" : "project";
  const iconColor = props.resultType === "entity" ? GLOBAL_STYLES.entity.iconColor : GLOBAL_STYLES.project.iconColor;

  useEffect(() => {
    setInputValue(props.value?.name || "");
  }, [props.value]);

  const getSelectOptions = async () => {
    if (props.resultType === "entity") {
      const result = await getEntities({ variables: { limit: 20 } });
      if (result.data?.entities?.entities) setOptions(result.data.entities.entities);
    } else {
      const result = await getProjects({ variables: { limit: 20 } });
      if (result.data?.projects) setOptions(result.data.projects);
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

  const { workspace } = useWorkspace();

  useEffect(() => {
    getSelectOptions().catch(ignoreAbort);
  }, []);

  useEffect(() => {
    getSelectOptions().catch(ignoreAbort);
  }, [workspace]);

  const topSuggestion = useMemo(() => {
    if (!inputValue) return null;
    const list = hasSearched ? results : options;
    return list.find((item) => item.name.toLowerCase().startsWith(inputValue.toLowerCase())) || null;
  }, [inputValue, hasSearched, results, options]);

  const fetchResults = useMemo(
    () =>
      debounce(async (query: string) => {
        const response = await searchText({
          variables: { query, resultType: props.resultType, isBuilder: false, showArchived: false },
        }).catch(ignoreAbort);
        if (!response) return;

        if (response.data?.search) {
          setResults(response.data.search);
          setHasSearched(true);
          setShowResults(true);
        } else {
          setResults([]);
        }

        if (searchError || !response.data?.search) {
          toaster.create({
            title: "Error",
            type: "error",
            description: searchError || "Unable to retrieve search results",
            duration: 4000,
            closable: true,
          });
        }
      }, 300),
    [searchText],
  );

  const updateDropdownPosition = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  };

  const openDropdown = () => {
    updateDropdownPosition();
    setShowResults(true);
    setTimeout(() => setIsAnimating(true), 10);
  };

  const closeDropdown = () => {
    setIsAnimating(false);
    setIsTyping(false);
    setTimeout(() => setShowResults(false), 150);
  };

  const onInputClick = () => {
    if (props?.disabled) return;
    if (!showResults) openDropdown();
    else closeDropdown();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);

    if (value === "") {
      setHasSearched(false);
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    if (!showResults) openDropdown();
    fetchResults(value);
  };

  const handleSelectResult = (result: IGenericItem) => {
    setResults([]);
    setShowResults(false);
    setHasSearched(false);
    setIsTyping(false);
    setInputValue(result.name);
    props.onChange?.(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" && topSuggestion) {
      e.preventDefault();
      handleSelectResult(topSuggestion);
    }
  };

  const renderItems = (items: IGenericItem[]) => (
    <Flex direction={"column"} gap={"1"}>
      {items.map((item) => (
        <Flex
          key={item._id}
          direction={"row"}
          gap={"2"}
          p={"1"}
          align={"center"}
          _hover={{ bg: "gray.100", cursor: "pointer" }}
          onClick={() => handleSelectResult(item)}
        >
          <Icon name={iconName} size={"xs"} color={iconColor} />
          <Text fontSize={"xs"}>{item.name}</Text>
        </Flex>
      ))}
    </Flex>
  );

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
            _focusVisible={props.isEmbedded ? { boxShadow: "none", outline: "none" } : undefined}
            ps={props.value?._id && !showResults ? "6" : undefined}
            autoComplete="off"
            disabled={props?.disabled || false}
          />
        </InputGroup>
        {props.value?._id && !showResults && (
          <Box
            position="absolute"
            left="2"
            top="0"
            bottom="0"
            display="flex"
            alignItems="center"
            pointerEvents="none"
            zIndex={1}
          >
            <Icon name={iconName} size={"xs"} color={iconColor} />
          </Box>
        )}
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
          <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            zIndex="9998"
            onClick={closeDropdown}
            opacity={isAnimating ? 1 : 0}
            transition="opacity 0.15s ease-in-out"
          />
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
              {isLoading && (
                <Flex w="100%" minH="100px" align="center" justify="center">
                  <Spinner />
                </Flex>
              )}
              {!isLoading && hasSearched && results.length > 0 && renderItems(results)}
              {!isLoading && hasSearched && results.length === 0 && (
                <Flex w="100%" minH="100px" align="center" justify="center">
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    No Results
                  </Text>
                </Flex>
              )}
              {!isLoading && !hasSearched && !isTyping && options.length > 0 && renderItems(options)}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default SearchSelect;
