// React
import React, { useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  IconButton,
  Input,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  Text,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import DataTable from "@components/DataTable";
import Linky from "@components/Linky";
import Icon from "@components/Icon";
import Loading from "@components/Loading";
import SearchQueryBuilder from "@components/SearchQueryBuilder";

// Existing and custom types
import { EntityModel, DataTableAction } from "@types";

// Utility functions and libraries
import { request } from "@database/functions";
import _ from "lodash";
import { createColumnHelper } from "@tanstack/react-table";

// Routing and navigation
import { useNavigate } from "react-router-dom";
import FileSaver from "file-saver";
import slugify from "slugify";
import dayjs from "dayjs";
import { gql, useLazyQuery } from "@apollo/client";

const Search = () => {
  const [query, setQuery] = useState("");

  // Search status
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isError, setIsError] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  // Store results as a set of IDs
  const [results, setResults] = useState([] as Partial<EntityModel>[]);

  // Query to search by text value
  const SEARCH_TEXT = gql`
    query Search($query: String, $isBuilder: Boolean, $limit: Int) {
      search(query: $query, isBuilder: $isBuilder, limit: $limit) {
        _id
        name
        description
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
        isBuilder: false,
        limit: 100,
      },
    });

    if (results.data.search) {
      setResults(results.data.search);
    }

    if (error) {
      setIsError(true);
      toast({
        title: "Error",
        status: "error",
        description: error.message,
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }

    setIsSearching(loading);
  };

  const onTabChange = () => {
    // Reset search state
    setQuery("");
    setHasSearched(false);
    setResults([]);
  };

  const searchResultColumnHelper = createColumnHelper<EntityModel>();
  const searchResultColumns = [
    searchResultColumnHelper.accessor("name", {
      cell: (info) => (
        <Linky
          id={info.row.original._id}
          type={"entities"}
          size={"sm"}
          fallback={info.row.original.name}
        />
      ),
      header: "Name",
    }),
    searchResultColumnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return <Tag colorScheme={"orange"}>No Description</Tag>;
        }
        return <Text noOfLines={1}>{info.getValue()}</Text>;
      },
      header: "Description",
      enableHiding: true,
    }),
    searchResultColumnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex justifyContent={"right"}>
            <Button
              key={`view-entity-${info.getValue()}`}
              size={"sm"}
              colorScheme={"gray"}
              rightIcon={<Icon name={"c_right"} />}
              onClick={() => navigate(`/entities/${info.getValue()}`)}
            >
              View
            </Button>
          </Flex>
        );
      },
      header: "",
    }),
  ];
  const searchResultActions: DataTableAction[] = [
    {
      label: "Export Entities CSV",
      icon: "download",
      action: async (table, rows) => {
        // Export rows that have been selected
        const toExport: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          toExport.push(table.getRow(rowIndex).original._id);
        }

        const response = await request<any>("POST", "/entities/export", {
          entities: toExport,
        });
        if (response.success) {
          FileSaver.saveAs(
            new Blob([response.data]),
            slugify(
              `export_entities_${dayjs(Date.now()).format("YYYY_MM_DD")}.csv`,
            ),
          );
        }

        table.resetRowSelection();
      },
    },
    {
      label: "Export Entities JSON",
      icon: "download",
      action: async (table, rows: any) => {
        // Export rows that have been selected
        const toExport: string[] = [];
        for (const rowIndex of Object.keys(rows)) {
          toExport.push(table.getRow(rowIndex).original._id);
        }

        const response = await request<any>("POST", "/entities/export", {
          entities: toExport,
          format: "json",
        });
        if (response.success) {
          FileSaver.saveAs(
            new Blob([response.data]),
            slugify(
              `export_entities_${dayjs(Date.now()).format("YYYY_MM_DD")}.json`,
            ),
          );
        }

        table.resetRowSelection();
      },
    },
  ];

  return (
    <Content isError={isError}>
      <Flex direction={"column"} p={"2"}>
        {/* Page header */}
        <Flex
          direction={"row"}
          p={"2"}
          align={"center"}
          justify={"space-between"}
        >
          <Flex align={"center"} gap={"2"} w={"100%"}>
            <Icon name={"search"} size={"md"} />
            <Heading size={"md"}>Search</Heading>
          </Flex>
        </Flex>

        {/* Search components */}
        <Tabs
          w={"100%"}
          size={"sm"}
          colorScheme={"blue"}
          variant={"soft-rounded"}
          onChange={onTabChange}
        >
          <TabList p={"2"} gap={"2"} pb={"0"}>
            <Tab isDisabled={isSearching}>Text</Tab>
            <Tab isDisabled={isSearching}>Query Builder</Tab>
          </TabList>

          <TabPanels>
            {/* Text search */}
            <TabPanel p={"2"}>
              <Flex direction={"column"} gap={"2"}>
                <Flex
                  direction={"row"}
                  gap={"2"}
                  p={"2"}
                  rounded={"md"}
                  bg={"blue.100"}
                  align={"center"}
                  w={"fit-content"}
                >
                  <Icon name={"info"} color={"blue.300"} />
                  <Text
                    fontWeight={"semibold"}
                    fontSize={"sm"}
                    color={"blue.700"}
                  >
                    Use text search to search for terms appearing in Entities
                    within the Workspace. Text search will include terms
                    appearing in Attributes.
                  </Text>
                </Flex>

                <Flex w={"100%"} direction={"row"} gap={"2"}>
                  <Input
                    size={"sm"}
                    value={query}
                    placeholder={"Search..."}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyUp={(event) => {
                      // Listen for "Enter" key when entering a query
                      if (event.key === "Enter" && query !== "") {
                        runSearch();
                      }
                    }}
                  />

                  <IconButton
                    aria-label={"Search"}
                    size={"sm"}
                    icon={<Icon name={"search"} />}
                    colorScheme={"green"}
                    isDisabled={query === ""}
                    onClick={() => runSearch()}
                  />
                </Flex>
              </Flex>
            </TabPanel>

            {/* Query builder */}
            <SearchQueryBuilder
              setHasSearched={setHasSearched}
              setResults={setResults}
              setIsSearching={setIsSearching}
            />
          </TabPanels>
        </Tabs>

        {/* Search Results */}
        <Flex gap={"2"} p={"2"} w={"100%"}>
          {isSearching ? (
            <Flex w={"full"} align={"center"} justify={"center"}>
              <Loading />
            </Flex>
          ) : (
            hasSearched &&
            !isSearching && (
              <Flex direction={"column"} w={"100%"} gap={"4"}>
                <Heading
                  id={"resultsHeading"}
                  size={"sm"}
                  fontWeight={"semibold"}
                >
                  {results.length} result
                  {results.length > 1 || results.length === 0 ? "s" : ""}
                </Heading>
                <DataTable
                  columns={searchResultColumns}
                  visibleColumns={{}}
                  data={results}
                  showPagination
                  showSelection
                  actions={searchResultActions}
                />
              </Flex>
            )
          )}
        </Flex>
      </Flex>
    </Content>
  );
};

export default Search;
