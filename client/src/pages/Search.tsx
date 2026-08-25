// React
import React, { useEffect, useMemo, useState } from "react";

// Existing and custom components
import {
  Button,
  EmptyState,
  Flex,
  Heading,
  Input,
  Spinner,
  Tabs,
  Text,
  Checkbox,
  Collapsible,
  InputGroup,
  SkeletonText,
} from "@chakra-ui/react";
import TagActor from "@components/TagActor";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import { AttributeTag, EmptyTag } from "@components/TagField";
import FieldTagList from "@components/FieldTagList";
import Icon from "@components/Icon";
import SearchQueryBuilder from "@components/SearchQueryBuilder";
import { CreatedCell } from "@components/DataTable/DataTableCell";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";

// Hooks
import { useBreakpoint } from "@hooks/useBreakpoint";
import { usePermissions } from "@hooks/usePermissions";
import { useWorkspace } from "@hooks/useWorkspace";

// Existing and custom types
import { EntityModel, DataTableAction, SearchQuery, IGenericItem } from "@types";

// Utility functions and libraries
import _ from "lodash";
import { createColumnHelper } from "@tanstack/react-table";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// GraphQL imports
import { gql } from "@apollo/client";
import { useLazyQuery, useQuery } from "@apollo/client/react";

// Utility libraries and functions
import { buildMongoQuery, ignoreAbort } from "@lib/util";
import FileSaver from "file-saver";
import slugify from "slugify";
import dayjs from "dayjs";

// Variables
import { STYLES } from "@variables";

// Events
import { usePostHog } from "posthog-js/react";

// Stable reference so `DataTable` (memoized) doesn't see a new prop on every render
const EMPTY_SELECTED_ROWS = {};

const Search = () => {
  const posthog = usePostHog();

  // Permissions
  const { globalPermissions } = usePermissions();

  const [query, setQuery] = useState("");

  const { workspace } = useWorkspace();
  const [workspaceName, setWorkspaceName] = useState("");

  // Search status
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isError, setIsError] = useState(false);

  const navigate = useNavigate();
  const { breakpoint } = useBreakpoint();

  // Store results as a set of IDs
  const [results, setResults] = useState([] as Partial<EntityModel>[]);
  const [visibleColumns, setVisibleColumns] = useState({});

  const [activeTab, setActiveTab] = useState<"text" | "advanced">("text");
  const [isAISearch, setIsAISearch] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!globalPermissions.features.ai) setIsAISearch(false);
  }, [globalPermissions.features.ai]);

  // Include archived Entities
  const [showArchived, setShowArchived] = useState(false);

  // Text search filters
  const [textSearchFilters, setTextSearchFilters] = useState({
    startDate: "",
    endDate: "",
    hasAttachments: false,
    hasAttributes: false,
    hasRelationships: false,
  });

  // Collapsible state for text search filters
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Active filter count for text search filters
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Query to get the Workspace name on load
  const SEARCH_PAGE_LOAD = gql`
    query SearchPageLoad($workspace: String) {
      workspace(_id: $workspace) {
        _id
        name
      }
    }
  `;
  const { data, loading } = useQuery<{ workspace: IGenericItem }>(SEARCH_PAGE_LOAD, {
    variables: {
      workspace: workspace,
    },
  });

  useEffect(() => {
    if (data?.workspace) {
      setWorkspaceName(data.workspace.name);
    }
  }, []);

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
          created
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
    errorPolicy: "all",
  });

  const runSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);
    setResults([]);

    // Translate natural language to a MongoDB query, then run as a builder query
    if (isAISearch) {
      setIsTranslating(true);
      // useLazyQuery resolves (not rejects) on GraphQL errors
      const translation = await runTranslateSearch({ variables: { query } }).catch(ignoreAbort);
      setIsTranslating(false);

      if (!translation) {
        setIsSearching(false);
        return;
      }

      if (translation.error) {
        toaster.create({
          title: "Error",
          type: "error",
          description: "Unable to translate query, please try again",
          duration: 2000,
          closable: true,
        });
        setIsSearching(false);
        setHasSearched(false);
        return;
      }

      if (!translation.data?.translateSearch) {
        setIsSearching(false);
        return;
      }

      const results = await searchText({
        variables: {
          query: translation.data.translateSearch,
          resultType: "entity",
          isBuilder: true,
          showArchived,
        },
      }).catch(ignoreAbort);

      if (!results) {
        setIsSearching(false);
        return;
      }

      if (!results.data?.search) {
        toaster.create({
          title: "Error",
          type: "error",
          description: "Unable to retrieve search results",
          duration: 4000,
          closable: true,
        });
        setIsError(true);
      } else {
        posthog.capture("client.search.performed", {
          search_type: "ai",
          result_count: results.data.search.length,
          show_archived: showArchived,
        });
        setResults(results.data.search);
      }

      setIsSearching(false);
      return;
    }

    const hasFilters =
      textSearchFilters.startDate ||
      textSearchFilters.endDate ||
      textSearchFilters.hasAttachments ||
      textSearchFilters.hasAttributes ||
      textSearchFilters.hasRelationships;

    const filters = hasFilters
      ? {
          startDate: textSearchFilters.startDate || undefined,
          endDate: textSearchFilters.endDate || undefined,
          hasAttachments: textSearchFilters.hasAttachments || undefined,
          hasAttributes: textSearchFilters.hasAttributes || undefined,
          hasRelationships: textSearchFilters.hasRelationships || undefined,
        }
      : undefined;

    const results = await searchText({
      variables: {
        query: query,
        resultType: "entity",
        isBuilder: false,
        showArchived: showArchived,
        filters,
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
        description: error?.message || "Unable to retrieve search results",
        duration: 4000,
        closable: true,
      });
      setIsError(true);
    } else if (results.data.search) {
      posthog.capture("client.search.performed", {
        search_type: "text",
        result_count: results.data.search.length,
        show_archived: showArchived,
      });
      setResults(results.data.search);
    }

    setIsSearching(false);
  };

  const onTabChange = (tab: "text" | "advanced") => {
    setActiveTab(tab);
    setResults([]);
    setHasSearched(false);
  };

  // Effect to adjust column visibility
  useEffect(() => {
    const isMobile = breakpoint === "base" || breakpoint === "sm";
    setVisibleColumns({
      description: !isMobile,
      owner: !isMobile,
      created: !isMobile,
    });
  }, [breakpoint]);

  const searchResultColumnHelper = createColumnHelper<EntityModel>();
  const searchResultColumns = useMemo(
    () => [
      searchResultColumnHelper.accessor("name", {
        cell: (info) => (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 48} showArrow>
              <Flex direction={"row"} gap={"1"} align={"center"}>
                <Icon name={"entity"} color={STYLES.entity.color.default} size={"xs"} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  {_.truncate(info.getValue(), { length: 48 })}
                </Text>
              </Flex>
            </Tooltip>
            <Button
              size="2xs"
              mx={"1"}
              variant="subtle"
              colorPalette="gray"
              aria-label={"View Entity"}
              onClick={() => navigate(`/entities/${info.row.original._id}`)}
            >
              View
              <Icon name={"a_right"} size={"xs"} />
            </Button>
          </Flex>
        ),
        header: "Name",
        meta: {
          minWidth: 240,
        },
      }),
      searchResultColumnHelper.accessor("description", {
        cell: (info) => {
          if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
            return <EmptyTag label={"Description"} />;
          }
          return (
            <Tooltip content={info.getValue()} disabled={info.getValue().length < 64}>
              <Text fontSize={"xs"} lineClamp={1}>
                {_.truncate(info.getValue(), { length: 64 })}
              </Text>
            </Tooltip>
          );
        },
        header: "Description",
        enableHiding: true,
        meta: {
          minWidth: 240,
        },
      }),
      searchResultColumnHelper.accessor("attributes", {
        cell: (info) => (
          <FieldTagList
            items={info.row.original.attributes}
            max={1}
            emptyLabel={"Attributes"}
            getKey={(attribute) => attribute._id}
            renderTag={(attribute) => <AttributeTag attribute={attribute} />}
          />
        ),
        header: "Attributes",
        meta: {
          minWidth: 240,
        },
      }),
      searchResultColumnHelper.accessor("created", {
        cell: (info) => <CreatedCell value={info.getValue()} />,
        header: "Created",
        meta: {
          minWidth: 120,
          maxWidth: 120,
        },
      }),
      searchResultColumnHelper.accessor("archived", {
        cell: (info) => {
          return (
            <Flex direction={"row"} gap={"1"} align={"center"}>
              <Icon
                name={info.getValue() ? "archive" : "check"}
                color={info.getValue() ? "gray.500" : "green"}
                size={"xs"}
              />
              <Text fontWeight={"semibold"} fontSize={"xs"} color={info.getValue() ? "gray.500" : "green"}>
                {info.getValue() ? "Archived" : "Active"}
              </Text>
            </Flex>
          );
        },
        header: "Status",
        meta: {
          minWidth: 120,
          maxWidth: 120,
        },
      }),
      searchResultColumnHelper.accessor("owner", {
        cell: (info) => {
          return <TagActor identifier={info.getValue()} fallback={"Unknown User"} size={"sm"} inline />;
        },
        header: "Owner",
      }),
    ],
    [navigate],
  );

  const EXPORT_ENTITIES = gql`
    query ExportEntities($entities: [String], $format: String, $includeAttributes: Boolean) {
      exportEntities(entities: $entities, format: $format, includeAttributes: $includeAttributes)
    }
  `;
  const [exportEntities] = useLazyQuery<{ exportEntities: string }>(EXPORT_ENTITIES, {
    fetchPolicy: "network-only",
  });

  const searchResultActions: DataTableAction[] = useMemo(
    () => [
      {
        label: (count) => `Export selection as CSV (${count})`,
        icon: "download",
        action: async (table, rows) => {
          const toExport: string[] = [];
          for (const rowIndex of Object.keys(rows)) {
            toExport.push(table.getRow(rowIndex).original._id);
          }

          const response = await exportEntities({
            variables: { entities: toExport, format: "csv", includeAttributes: true },
          }).catch(ignoreAbort);

          if (response?.data?.exportEntities) {
            FileSaver.saveAs(
              new Blob([response.data.exportEntities]),
              slugify(`export_entities_${dayjs(Date.now()).format("YYYY_MM_DD")}.csv`),
            );
          }

          table.resetRowSelection();
        },
      },
      {
        label: (count) => `Export selection as JSON (${count})`,
        icon: "download",
        action: async (table, rows: any) => {
          const toExport: string[] = [];
          for (const rowIndex of Object.keys(rows)) {
            toExport.push(table.getRow(rowIndex).original._id);
          }

          const response = await exportEntities({
            variables: { entities: toExport, format: "json", includeAttributes: true },
          }).catch(ignoreAbort);

          if (response?.data?.exportEntities) {
            FileSaver.saveAs(
              new Blob([response.data.exportEntities]),
              slugify(`export_entities_${dayjs(Date.now()).format("YYYY_MM_DD")}.json`),
            );
          }

          table.resetRowSelection();
        },
      },
    ],
    [exportEntities],
  );

  const initialAdvancedQuery: SearchQuery = { combinator: "and", rules: [] };

  // Query to search by text value
  const SEARCH_ADVANCED = gql`
    query Search($query: String, $resultType: String, $isBuilder: Boolean, $showArchived: Boolean) {
      search(query: $query, resultType: $resultType, isBuilder: $isBuilder, showArchived: $showArchived) {
        __typename
        ... on Entity {
          _id
          name
          owner
          created
          timestamp
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
  const [searchAdvanced, { error: searchAdvancedError }] = useLazyQuery<{
    search: EntityModel[];
  }>(SEARCH_ADVANCED, {
    fetchPolicy: "network-only",
  });

  // State to hold the query
  const [advancedQuery, setAdvancedQuery] = useState(initialAdvancedQuery);
  const [isValid, setIsValid] = useState(false);

  const onSearchBuiltQuery = async () => {
    setIsSearching(true);
    setHasSearched(true);

    const results = await searchAdvanced({
      variables: {
        query: JSON.stringify(buildMongoQuery(advancedQuery)),
        resultType: "entity",
        isBuilder: true,
        showArchived: false,
      },
    }).catch(ignoreAbort);

    if (!results) {
      setIsSearching(false);
      return;
    }

    if (searchAdvancedError || !results.data?.search) {
      toaster.create({
        title: "Error",
        type: "error",
        description: searchAdvancedError?.message || "Unable to retrieve search results",
        duration: 4000,
        closable: true,
      });
      setIsError(true);
    } else if (results.data.search) {
      posthog.capture("client.search.performed", {
        search_type: "builder",
        result_count: results.data.search.length,
        show_archived: false,
      });
      setResults(results.data.search);
    }

    setIsSearching(false);
  };

  useEffect(() => {
    const valid =
      advancedQuery.rules.length > 0 &&
      advancedQuery.rules.every((rule) => {
        if (rule.field === "attributes") {
          return typeof rule.value === "object" && rule.value.data !== "";
        }
        return typeof rule.value === "string" && rule.value !== "";
      });
    setIsValid(valid);
  }, [advancedQuery]);

  // Calculate active filter count for text search filters
  useEffect(() => {
    let count = 0;
    if (showArchived) count++;
    if (textSearchFilters.startDate) count++;
    if (textSearchFilters.endDate) count++;
    if (textSearchFilters.hasAttachments) count++;
    if (textSearchFilters.hasAttributes) count++;
    if (textSearchFilters.hasRelationships) count++;
    setActiveFilterCount(count);
  }, [showArchived, textSearchFilters]);

  // Reset text search results when filters change
  useEffect(() => {
    // If filters change, clear current results so the next search reflects the new filters
    setResults([]);
    setHasSearched(false);
    setIsSearching(false);
  }, [showArchived, textSearchFilters]);

  return (
    <Content isError={isError}>
      <Flex direction={"row"} p={"1"} rounded={"md"} wrap={"wrap"} gap={"2"} minW="0" maxW="100%">
        <Flex direction={"column"} gap={"0"} align={"start"}>
          <Flex direction={"row"} align={"center"} gap={"1"}>
            <Icon name={"search"} size={"sm"} />
            <Heading size={"xl"}>Search</Heading>
          </Flex>
          <SkeletonText noOfLines={1} my={"0.5"} h={"22px"} loading={loading} asChild>
            <Text fontSize={"sm"} fontWeight={"semibold"} color={"text.subtle"}>
              {workspaceName}
            </Text>
          </SkeletonText>
        </Flex>
        <Flex direction={"column"} gap={"2"} w={"100%"} minW="0" maxW="100%">
          <Flex direction={"column"} ml={"0.5"} gap={"1"}>
            <Text fontSize={"xs"} fontWeight={"semibold"}>
              Search across Entities in the current Workspace
            </Text>
            <Text fontSize={"xs"}>
              Use "Text" to search by keyword or with AI, build structured search queries using "Query Builder"
            </Text>
          </Flex>

          {/* Search components */}
          <Tabs.Root
            w={"100%"}
            value={activeTab}
            onValueChange={(details) => onTabChange(details.value as "text" | "advanced")}
          >
            <Flex
              bg={"surface.muted"}
              rounded={"md"}
              p={"0.5"}
              gap={"0.5"}
              w={"fit-content"}
              mb={"1"}
              border={"1px solid"}
              borderColor={"border.default"}
            >
              <Button
                size={"xs"}
                rounded={"sm"}
                variant={"ghost"}
                colorPalette={"gray"}
                bg={activeTab === "text" ? "white" : "transparent"}
                color={"text.default"}
                fontWeight={activeTab === "text" ? "semibold" : "medium"}
                shadow={activeTab === "text" ? "xs" : "none"}
                _hover={{ bg: activeTab === "text" ? "white" : "surface.card" }}
                disabled={isSearching}
                onClick={() => onTabChange("text")}
              >
                <Icon name={"search_text"} size={"xs"} />
                Text
              </Button>
              <Button
                size={"xs"}
                rounded={"sm"}
                variant={"ghost"}
                colorPalette={"gray"}
                bg={activeTab === "advanced" ? "white" : "transparent"}
                color={"text.default"}
                fontWeight={activeTab === "advanced" ? "semibold" : "medium"}
                shadow={activeTab === "advanced" ? "xs" : "none"}
                _hover={{ bg: activeTab === "advanced" ? "white" : "surface.card" }}
                disabled={isSearching}
                onClick={() => onTabChange("advanced")}
              >
                <Icon name={"search_query"} size={"xs"} />
                Query Builder
              </Button>
            </Flex>

            {/* Text search */}
            <Tabs.Content value={"text"} p={"0"} pt={"1"}>
              <Flex direction={"column"} gap={"2"}>
                {/* Filter section */}
                <Collapsible.Root open={filtersOpen} onOpenChange={(event) => setFiltersOpen(event.open)}>
                  <Flex
                    direction={"column"}
                    gap={"2"}
                    p={"2"}
                    rounded={"md"}
                    border={STYLES.border.style}
                    borderColor={STYLES.border.color}
                    bg={"surface.card"}
                  >
                    <Flex direction={"row"} gap={"1"} align={"center"} justify={"space-between"}>
                      <Flex direction={"row"} gap={"1"} align={"center"}>
                        <Icon name={"filter"} size={"sm"} />
                        <Text fontSize={"xs"} fontWeight={"semibold"}>
                          Search Filters:
                        </Text>
                        <Text
                          fontWeight={"semibold"}
                          fontSize={"xs"}
                          color={activeFilterCount >= 1 ? "green.700" : "black"}
                        >
                          {activeFilterCount} Active
                        </Text>
                      </Flex>
                      <Collapsible.Trigger asChild>
                        <Button size={"xs"} variant={"ghost"} colorPalette={"gray"}>
                          {filtersOpen ? "Hide" : "Show"} Filters
                          <Icon name={filtersOpen ? "c_up" : "c_down"} size={"xs"} />
                        </Button>
                      </Collapsible.Trigger>
                    </Flex>
                    <Collapsible.Content>
                      <Flex direction={"column"} gap={"2"} p={"1"}>
                        <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
                          {/* Search options section */}
                          <Flex direction={"column"} gap={"2"} minW={"220px"} flexShrink={0}>
                            <Text
                              fontSize={"xs"}
                              fontWeight={"semibold"}
                              ml={"0.5"}
                              color={STYLES.font.secondaryHeader.color}
                            >
                              Search Options
                            </Text>
                            <Checkbox.Root
                              size={"xs"}
                              colorPalette={"blue"}
                              checked={showArchived}
                              onCheckedChange={(details) => setShowArchived(details.checked as boolean)}
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                              <Checkbox.Label fontSize={"xs"}>Show Archived Entities</Checkbox.Label>
                            </Checkbox.Root>
                          </Flex>

                          {/* Entity filters section */}
                          <Flex direction={"column"} gap={"2"}>
                            <Text
                              fontSize={"xs"}
                              fontWeight={"semibold"}
                              ml={"0.5"}
                              color={STYLES.font.secondaryHeader.color}
                            >
                              Entity Filters
                            </Text>

                            <Flex direction={"row"} gap={"2"} wrap={"wrap"}>
                              {/* Date range */}
                              <Flex direction={"row"} gap={"2"} align={"center"}>
                                <Flex direction={"column"} gap={"1"}>
                                  <Text
                                    fontSize={"xs"}
                                    fontWeight={"semibold"}
                                    ml={"0.5"}
                                    color={STYLES.font.secondaryHeader.color}
                                  >
                                    Start
                                  </Text>
                                  <Input
                                    type={"date"}
                                    size={"xs"}
                                    bg={"white"}
                                    value={textSearchFilters.startDate}
                                    onChange={(e) =>
                                      setTextSearchFilters((prev) => ({
                                        ...prev,
                                        startDate: e.target.value,
                                      }))
                                    }
                                  />
                                </Flex>
                                <Flex direction={"column"} gap={"1"}>
                                  <Text
                                    fontSize={"xs"}
                                    fontWeight={"semibold"}
                                    ml={"0.5"}
                                    color={STYLES.font.secondaryHeader.color}
                                  >
                                    End
                                  </Text>
                                  <Input
                                    type={"date"}
                                    size={"xs"}
                                    bg={"white"}
                                    value={textSearchFilters.endDate}
                                    onChange={(e) =>
                                      setTextSearchFilters((prev) => ({
                                        ...prev,
                                        endDate: e.target.value,
                                      }))
                                    }
                                  />
                                </Flex>
                              </Flex>

                              {/* Boolean filters */}
                              <Flex direction={"column"} gap={"1"} mt={"1"} ml={"1"}>
                                <Checkbox.Root
                                  size={"xs"}
                                  colorPalette={"blue"}
                                  checked={textSearchFilters.hasAttachments}
                                  onCheckedChange={(details) =>
                                    setTextSearchFilters((prev) => ({
                                      ...prev,
                                      hasAttachments: details.checked as boolean,
                                    }))
                                  }
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control />
                                  <Checkbox.Label fontSize={"xs"}>Has Attachments</Checkbox.Label>
                                </Checkbox.Root>
                                <Checkbox.Root
                                  size={"xs"}
                                  colorPalette={"blue"}
                                  checked={textSearchFilters.hasAttributes}
                                  onCheckedChange={(details) =>
                                    setTextSearchFilters((prev) => ({
                                      ...prev,
                                      hasAttributes: details.checked as boolean,
                                    }))
                                  }
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control />
                                  <Checkbox.Label fontSize={"xs"}>Has Attributes</Checkbox.Label>
                                </Checkbox.Root>
                                <Checkbox.Root
                                  size={"xs"}
                                  colorPalette={"blue"}
                                  checked={textSearchFilters.hasRelationships}
                                  onCheckedChange={(details) =>
                                    setTextSearchFilters((prev) => ({
                                      ...prev,
                                      hasRelationships: details.checked as boolean,
                                    }))
                                  }
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control />
                                  <Checkbox.Label fontSize={"xs"}>Has Relationships</Checkbox.Label>
                                </Checkbox.Root>
                              </Flex>
                            </Flex>
                          </Flex>
                        </Flex>
                      </Flex>

                      {/* Filter control buttons */}
                      <Flex direction={"row"} gap={"1"} align={"center"} justify={"flex-end"}>
                        <Button
                          size={"xs"}
                          variant={"outline"}
                          rounded={"md"}
                          colorPalette={"gray"}
                          bg={"white"}
                          _hover={{ bg: "gray.50" }}
                          disabled={activeFilterCount === 0}
                          onClick={() => {
                            setShowArchived(false);
                            setTextSearchFilters({
                              startDate: "",
                              endDate: "",
                              hasAttachments: false,
                              hasAttributes: false,
                              hasRelationships: false,
                            });
                            setResults([]);
                            setHasSearched(false);
                            setIsSearching(false);
                          }}
                        >
                          Reset Filters
                        </Button>
                      </Flex>
                    </Collapsible.Content>
                  </Flex>
                </Collapsible.Root>

                {/* Search input and submit */}
                <Flex w={"100%"} direction={"row"} gap={"2"} align={"center"}>
                  <InputGroup startElement={isAISearch && <Icon name={"lightning"} size={"xs"} color={"ai.default"} />}>
                    <Input
                      size={"xs"}
                      rounded={"md"}
                      value={query}
                      placeholder={isAISearch ? "Describe what you're looking for..." : "Search..."}
                      background={"white"}
                      className={isAISearch ? "ai-search-border" : undefined}
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyUp={(event) => {
                        if (event.key === "Enter" && query !== "") runSearch();
                      }}
                    />
                  </InputGroup>
                  {globalPermissions.features.ai && (
                    <Tooltip content={isAISearch ? "AI search on" : "Enable AI natural language search"} showArrow>
                      <Button
                        size={"xs"}
                        rounded={"md"}
                        colorPalette={isAISearch ? "ai" : "gray"}
                        variant={isAISearch ? "solid" : "outline"}
                        disabled={isSearching}
                        onClick={() => setIsAISearch((prev) => !prev)}
                      >
                        <Icon name={"lightning"} size={"xs"} />
                        AI
                      </Button>
                    </Tooltip>
                  )}
                  <Button
                    aria-label={"Search"}
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={isAISearch ? "ai" : "green"}
                    disabled={query === "" || isTranslating}
                    loading={isTranslating || isSearching}
                    loadingText={"Searching..."}
                    onClick={() => runSearch()}
                  >
                    Search
                    <Icon name={"search"} size={"xs"} />
                  </Button>
                  <Button
                    size={"xs"}
                    rounded={"md"}
                    colorPalette={"gray"}
                    variant={"outline"}
                    disabled={query === ""}
                    onClick={() => {
                      setQuery("");
                      setHasSearched(false);
                      setResults([]);
                      setIsSearching(false);
                    }}
                  >
                    Clear
                  </Button>
                </Flex>
              </Flex>
            </Tabs.Content>

            {/* Query builder */}
            <Tabs.Content value={"advanced"} p={"0"} pt={"1"}>
              <SearchQueryBuilder
                query={advancedQuery}
                onQueryChange={setAdvancedQuery}
                isValid={isValid}
                onSearch={onSearchBuiltQuery}
                onClear={() => {
                  setAdvancedQuery(initialAdvancedQuery);
                  setHasSearched(false);
                  setResults([]);
                }}
              />
            </Tabs.Content>
          </Tabs.Root>

          {/* Search Results */}
          <Flex gap={"1"} p={"0"} w={"100%"}>
            {isSearching && (
              <Flex w={"full"} minH={"200px"} align={"center"} justify={"center"}>
                <Spinner size={"lg"} color={STYLES.font.secondaryHeader.color} />
              </Flex>
            )}

            {hasSearched && !isSearching && (
              <Flex id={"resultsContainer"} direction={"column"} w={"100%"} gap={"1"}>
                {results.length > 0 ? (
                  <>
                    <Text id={"resultsHeading"} fontSize={"xs"} fontWeight={"semibold"} ml={"0.5"}>
                      Showing: {results.length} result
                      {results.length > 1 ? "s" : ""}
                    </Text>
                    <DataTable
                      columns={searchResultColumns}
                      visibleColumns={visibleColumns}
                      selectedRows={EMPTY_SELECTED_ROWS}
                      data={results}
                      showPagination
                      showSelection
                      actions={searchResultActions}
                    />
                  </>
                ) : (
                  <Flex w={"100%"} minH={"200px"} align={"center"} justify={"center"}>
                    <Text fontSize={"sm"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
                      No results found
                    </Text>
                  </Flex>
                )}
              </Flex>
            )}

            {!hasSearched && !isSearching && (
              <EmptyState.Root>
                <EmptyState.Content>
                  <EmptyState.Indicator>
                    <Icon name={"search"} size={"lg"} />
                  </EmptyState.Indicator>
                  <EmptyState.Description>Enter a search query to find Entities</EmptyState.Description>
                </EmptyState.Content>
              </EmptyState.Root>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Content>
  );
};

export default Search;
