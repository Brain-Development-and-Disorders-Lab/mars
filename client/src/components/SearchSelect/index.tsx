// React imports
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Custom and existing components
import { Input, Flex, InputGroup, Text, Spinner, Box, Separator } from "@chakra-ui/react";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";

// Custom types
import { EntityModel, IconNames, IGenericItem, SearchSelectProps } from "@types";

// Utility imports
import { debounce } from "lodash";
import { ignoreAbort } from "@lib/util";
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Context hooks
import { useWorkspace } from "@hooks/useWorkspace";

// Variables
import { STYLES } from "@variables";

// College Scorecard API URL
const SCORECARD_URL = "https://api.data.gov/ed/collegescorecard/v1/schools";

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

  const [getEntities, { loading: entitiesLoading }] = useLazyQuery<{
    entities: { entities: IGenericItem[]; total: number };
  }>(GET_ENTITIES, { fetchPolicy: "network-only" });

  const [getProjects, { loading: projectsLoading }] = useLazyQuery<{
    projects: IGenericItem[];
  }>(GET_PROJECTS, { fetchPolicy: "network-only" });

  const [searchText, { loading: searchLoading }] = useLazyQuery<{ search: EntityModel[] }>(SEARCH_TEXT, {
    fetchPolicy: "network-only",
  });

  const [institutionLoading, setInstitutionLoading] = useState(false);

  const [inputValue, setInputValue] = useState(props.value?.name || "");
  const [options, setOptions] = useState<IGenericItem[]>([]);
  const [results, setResults] = useState<EntityModel[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const isLoading =
    entitiesLoading || projectsLoading || searchLoading || institutionLoading || (isTyping && !hasSearched);

  // Setup default presentation parameters
  let placeholder = "Search Entities...";
  let iconName: IconNames = "entity";
  let iconColor = STYLES.entity.color.icon;

  switch (props.resultType) {
    case "institution": {
      placeholder = "Search Institutions...";
      iconName = "institution";
      iconColor = "gray.600";
      break;
    }
    case "project": {
      placeholder = "Search Projects...";
      iconName = "project";
      iconColor = STYLES.project.color.icon;
      break;
    }
  }

  useEffect(() => {
    setInputValue(props.value?.name || "");
  }, [props.value]);

  /**
   * Loads the initial dropdown options on mount and on workspace change
   */
  const getSelectOptions = async () => {
    switch (props.resultType) {
      case "institution": {
        // Pre-poll a handful of large institutions so the dropdown isn't empty on first open.
        setInstitutionLoading(true);
        try {
          const params = new URLSearchParams({
            api_key: import.meta.env.VITE_COLLEGE_SCORECARD_KEY || "",
            fields: "school.name",
            per_page: "5",
            "school.operating": "1",
            _sort: "latest.student.size:desc",
          });
          const res = await fetch(`${SCORECARD_URL}?${params}`);
          const data = await res.json();
          setOptions(
            (data.results || [])
              .map((r: Record<string, string>) => r["school.name"])
              .filter(Boolean)
              .map((name: string) => ({ _id: name, name })),
          );
        } catch {
          // Non-critical, user can still type to search.
        } finally {
          setInstitutionLoading(false);
        }
        return;
      }
      case "entity": {
        const result = await getEntities({ variables: { limit: 20 } });
        if (result.data?.entities?.entities) {
          setOptions(result.data.entities.entities);
        } else if (result.error) {
          toaster.create({
            title: "Error",
            type: "error",
            description: "Error while retrieving options for selection",
            duration: 4000,
            closable: true,
          });
        }
        break;
      }
      case "project": {
        const result = await getProjects({ variables: { limit: 20 } });
        if (result.data?.projects) {
          setOptions(result.data.projects);
        } else if (result.error) {
          toaster.create({
            title: "Error",
            type: "error",
            description: "Error while retrieving options for selection",
            duration: 4000,
            closable: true,
          });
        }
        break;
      }
    }
  };

  const { workspace } = useWorkspace();
  useEffect(() => {
    getSelectOptions().catch(ignoreAbort);
  }, [workspace]);

  // First item whose name starts with the current input, used for Tab-to-complete ghost text.
  const topSuggestion = useMemo(() => {
    if (!inputValue) return null;
    const list = hasSearched ? results : options;
    return list.find((item) => item.name.toLowerCase().startsWith(inputValue.toLowerCase())) || null;
  }, [inputValue, hasSearched, results, options]);

  /**
   * Queries the College Scorecard API and populates results with matching institution names
   */
  const fetchInstitutionResults = useCallback(async (query: string) => {
    setInstitutionLoading(true);
    try {
      const params = new URLSearchParams({
        api_key: import.meta.env.VITE_COLLEGE_SCORECARD_KEY || "",
        "school.name": query,
        fields: "school.name",
        per_page: "20",
        "school.operating": "1",
      });
      const res = await fetch(`${SCORECARD_URL}?${params}`);
      const data = await res.json();
      setResults(
        (data.results || [])
          .map((r: Record<string, string>) => r["school.name"])
          .filter(Boolean)
          .map((name: string) => ({ _id: name, name })),
      );
      setHasSearched(true);
      setShowResults(true);
    } catch {
      toaster.create({
        title: "Error",
        type: "error",
        description: "Failed to load institutions",
        duration: 4000,
        closable: true,
      });
    } finally {
      setInstitutionLoading(false);
    }
  }, []);

  /**
   * Runs the GraphQL search query and populates results for entities or projects
   */
  const fetchGraphQLResults = useCallback(
    async (query: string) => {
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
        toaster.create({
          title: "Error",
          type: "error",
          description: "Unable to retrieve search results",
          duration: 4000,
          closable: true,
        });
      }
    },
    [searchText, props.resultType],
  );

  /**
   * Debounced dispatcher that routes to the appropriate fetch helper based on `resultType`
   */
  const fetchResults = useMemo(
    () =>
      debounce((query: string) => {
        if (props.resultType === "institution") {
          fetchInstitutionResults(query);
        } else {
          fetchGraphQLResults(query);
        }
      }, 300),
    [fetchInstitutionResults, fetchGraphQLResults, props.resultType],
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
    setInputValue("");
    setShowResults(true);
    setTimeout(() => setIsAnimating(true), 10);
  };

  const closeDropdown = () => {
    setIsAnimating(false);
    setIsTyping(false);
    setInputValue(props.value?.name || "");
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
    // Tab completes the ghost suggestion inline rather than moving focus
    if (e.key === "Tab" && topSuggestion) {
      e.preventDefault();
      handleSelectResult(topSuggestion);
    }
  };

  const defaultItem: IGenericItem | null = props.defaultOption
    ? { _id: props.defaultOption, name: props.defaultOption }
    : null;
  // Puts the default option at the top, deduplicating it from the rest of the list
  const prependDefault = (items: IGenericItem[]) =>
    defaultItem ? [defaultItem, ...items.filter((i) => i._id !== defaultItem._id)] : items;

  const renderItems = (items: IGenericItem[]) => (
    <Flex direction={"column"} gap={"1"}>
      {items.map((item) => (
        <React.Fragment key={item._id}>
          <Flex
            data-testid={"search-select-result"}
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
          {defaultItem && item._id === defaultItem._id && items.length > 1 && <Separator />}
        </React.Fragment>
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
            placeholder={props.placeholder ?? placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            backgroundColor={props.isEmbedded ? "transparent" : "white"}
            data-testid={"value-editor"}
            size={"xs"}
            rounded={props.isEmbedded ? "none" : "md"}
            border={props.isEmbedded ? "none" : STYLES.border.style}
            borderColor={props.isEmbedded ? "" : STYLES.border.color}
            _focusVisible={props.isEmbedded ? { boxShadow: "none", outline: "none" } : undefined}
            ps={props.value?._id && !showResults ? "6" : undefined}
            autoComplete="off"
            disabled={props?.disabled || false}
          />
        </InputGroup>

        {props.value?._id && !showResults && (
          <Box
            position={"absolute"}
            left={"2"}
            top={"0"}
            bottom={"0"}
            display={"flex"}
            alignItems={"center"}
            pointerEvents={"none"}
            zIndex={1}
          >
            <Icon name={iconName} size={"xs"} color={iconColor} />
          </Box>
        )}

        {topSuggestion && (
          <Box
            position={"absolute"}
            inset={"0"}
            display={"flex"}
            alignItems={"center"}
            px={"2"}
            fontSize={"xs"}
            pointerEvents={"none"}
            overflow={"hidden"}
            whiteSpace={"nowrap"}
            bg={"white"}
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
        <React.Fragment>
          <Box
            position={"fixed"}
            top={"0"}
            left={"0"}
            right={"0"}
            bottom={"0"}
            zIndex={"9998"}
            onClick={closeDropdown}
            opacity={isAnimating ? 1 : 0}
            transition={"opacity 0.15s ease-in-out"}
          />
          <Box
            position={"fixed"}
            top={dropdownPosition.top - 5}
            left={dropdownPosition.left}
            width={dropdownPosition.width}
            bg="white"
            border={STYLES.border.style}
            borderColor={STYLES.border.color}
            borderRadius={"md"}
            shadow={"md"}
            zIndex={"9999"}
            p={"1"}
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
              {!isLoading && hasSearched && prependDefault(results).length > 0 && renderItems(prependDefault(results))}
              {!isLoading && hasSearched && results.length === 0 && !defaultItem && (
                <Flex w="100%" minH="100px" align="center" justify="center">
                  <Text fontSize={"xs"} fontWeight={"semibold"}>
                    No Results
                  </Text>
                </Flex>
              )}
              {!isLoading &&
                !hasSearched &&
                !isTyping &&
                prependDefault(options).length > 0 &&
                renderItems(prependDefault(options))}
            </Box>
          </Box>
        </React.Fragment>
      )}
    </Box>
  );
};

export default SearchSelect;
