import React, { useState } from "react";
import { TabPanel, Flex, Button, useToast } from "@chakra-ui/react";
import Icon from "@components/Icon";
import QueryBuilder, { formatQuery, RuleGroupType } from "react-querybuilder";
import { QueryBuilderChakra } from "@react-querybuilder/chakra";

import QueryBuilderEditorCustomValue from "./QueryBuilderEditorCustomValue";
import { request } from "@database/functions";

import _ from "lodash";

interface QueryBuilderTabProps {
  [key: string]: any;
}

const QueryBuilderTab: React.FC<QueryBuilderTabProps> = ({
  setHasSearched,
  setResults,
  setIsSearching,
}: QueryBuilderTabProps) => {
  const fields = [
    { name: "name", label: "Name" },
    { name: "description", label: "Description" },
    { name: "project", label: "Project" },
    { name: "origin", label: "Origin" },
    { name: "product", label: "Product" },
    { name: "attribute", label: "Attribute" },
  ];

  // Setup the initial query
  const initialQuery: RuleGroupType = {
    combinator: "and",
    rules: [],
  };

  // State to hold the query
  const [query, setQuery] = useState(initialQuery);

  const toast = useToast();

  const onSearchBuiltQuery = async () => {
    setIsSearching(true);
    setHasSearched(true);

    const formattedQuery = formatQuery(query, "mongodb");

    const response = await request<any>("POST", "/search/query_built", {
      query: formattedQuery,
    });
    if (response.success) {
      setResults(response.data);
    } else {
      toast({
        title: "Error",
        status: "error",
        description: "Could not get search results.",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }

    setIsSearching(false);
  };

  return (
    <TabPanel p={"2"}>
      <Flex direction={"column"} gap={"2"}>
        <QueryBuilderChakra>
          <QueryBuilder
            fields={fields}
            onQueryChange={setQuery}
            controlElements={{ valueEditor: QueryBuilderEditorCustomValue }}
            showCloneButtons
            showNotToggle
          />
        </QueryBuilderChakra>
        <Flex>
          <Button
            aria-label={"Run Query"}
            colorScheme={"green"}
            size={"sm"}
            rightIcon={<Icon name={"search"} />}
            onClick={() => onSearchBuiltQuery()}
            isDisabled={query.rules.length === 0}
          >
            Run Query
          </Button>
        </Flex>
      </Flex>
    </TabPanel>
  );
};

export default QueryBuilderTab;
