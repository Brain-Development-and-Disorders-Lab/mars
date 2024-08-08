import React, { useState } from "react";
import { TabPanel, Flex, Button, useToast } from "@chakra-ui/react";
import Icon from "@components/Icon";

// `react-querybuilder` imports
import QueryBuilder, {
  defaultOperators,
  Field,
  formatQuery,
  RuleGroupType,
} from "react-querybuilder";
import { QueryBuilderChakra } from "@react-querybuilder/chakra";

// SearchQueryValue component for searching Origins, Products, and Projects
import SearchQueryValue from "@components/SearchQueryValue";

// GraphQL
import { gql, useLazyQuery } from "@apollo/client";

import _ from "lodash";

interface QueryBuilderTabProps {
  [key: string]: any;
}

const SearchQueryBuilder: React.FC<QueryBuilderTabProps> = ({
  setHasSearched,
  setResults,
  setIsSearching,
}: QueryBuilderTabProps) => {
  const fields: Field[] = [
    {
      name: "name",
      label: "Name",
      operators: [
        { name: "=", label: "is" },
        ...defaultOperators.filter((operator) =>
          ["contains", "beginsWith", "endsWith"].includes(operator.name),
        ),
      ],
    },
    {
      name: "description",
      label: "Description",
      operators: [
        ...defaultOperators.filter((operator) =>
          ["contains", "doesNotContain"].includes(operator.name),
        ),
      ],
    },
    {
      name: "project",
      label: "Project",
      operators: [
        ...defaultOperators.filter((operator) =>
          ["contains", "doesNotContain"].includes(operator.name),
        ),
      ],
    },
    {
      name: "origins",
      label: "Origins",
      operators: [
        ...defaultOperators.filter((operator) =>
          ["contains", "doesNotContain"].includes(operator.name),
        ),
      ],
    },
    {
      name: "products",
      label: "Products",
      operators: [
        ...defaultOperators.filter((operator) =>
          ["contains", "doesNotContain"].includes(operator.name),
        ),
      ],
    },
  ];

  // Setup the initial query
  const initialQuery: RuleGroupType = {
    combinator: "and",
    rules: [],
  };

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

  // State to hold the query
  const [query, setQuery] = useState(initialQuery);

  const toast = useToast();

  const onSearchBuiltQuery = async () => {
    setIsSearching(loading);
    setHasSearched(true);

    // Format the query in `mongodb` format before sending
    const results = await searchText({
      variables: {
        query: formatQuery(query, "mongodb"),
        isBuilder: true,
        limit: 100,
      },
    });

    if (results.data.search) {
      setResults(results.data.search);
    }

    if (error) {
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

  return (
    <TabPanel p={"2"}>
      <Flex direction={"column"} gap={"2"}>
        <QueryBuilderChakra>
          <QueryBuilder
            fields={fields}
            onQueryChange={setQuery}
            controlElements={{ valueEditor: SearchQueryValue }}
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

export default SearchQueryBuilder;
