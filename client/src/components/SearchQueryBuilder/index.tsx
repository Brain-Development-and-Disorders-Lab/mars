import React, { useEffect, useState } from "react";
import { TabPanel, Flex, Button } from "@chakra-ui/react";
import Icon from "@components/Icon";
import { Information } from "@components/Label";
import { toaster } from "@components/Toast";

// `react-querybuilder` imports
import QueryBuilder, {
  defaultOperators,
  defaultRuleProcessorMongoDB,
  Field,
  formatQuery,
  RuleGroupType,
  RuleProcessor,
  RuleType,
} from "react-querybuilder";
import { QueryBuilderDnD } from "@react-querybuilder/dnd";
import * as ReactDnD from "react-dnd";
import * as ReactDndHtml5Backend from "react-dnd-html5-backend";
import { QueryBuilderChakra } from "@react-querybuilder/chakra2";

// SearchQueryValue component for searching Entity fields
import SearchQueryValue from "@components/SearchQueryValue";
import { SearchQueryBuilderProps } from "@types";

// GraphQL
import { gql, useLazyQuery } from "@apollo/client";

// Utility functions and libraries
import dayjs from "dayjs";
import _ from "lodash";
import { JSONPath } from "jsonpath-plus";

const SearchQueryBuilder: React.FC<SearchQueryBuilderProps> = ({
  setHasSearched,
  setResults,
  setIsSearching,
}) => {
  const fields: Field[] = [
    {
      name: "name",
      label: "Name",
      operators: [
        { name: "=", label: "is" },
        ...defaultOperators.filter((operator) =>
          ["contains", "doesNotContain", "beginsWith", "endsWith"].includes(
            operator.name,
          ),
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
      name: "projects",
      label: "Projects",
      operators: [
        ...defaultOperators.filter((operator) =>
          ["contains", "doesNotContain"].includes(operator.name),
        ),
      ],
    },
    {
      name: "relationships",
      label: "Relationships",
      operators: [
        ...defaultOperators.filter((operator) =>
          ["contains", "doesNotContain"].includes(operator.name),
        ),
      ],
    },
    {
      name: "attributes",
      label: "Attributes",
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

  /**
   * Custom function for processing specific fields within a search query,
   * specifically `relationships`
   * @param {RuleType} rule Rule for processing value
   * @return {any}
   */
  const ruleProcessor: RuleProcessor = (rule: RuleType): any => {
    if (rule.field === "name") {
      const value = { $regex: new RegExp(rule.value, "gi").toString() };
      if (rule.operator === "doesNotContain") {
        return {
          name: {
            $not: value,
          },
        };
      } else if (rule.operator === "contains") {
        return {
          name: value,
        };
      } else {
        return defaultRuleProcessorMongoDB(rule);
      }
    } else if (rule.field === "relationships") {
      // Handle `relationships` field
      if (rule.operator === "doesNotContain") {
        // If `doesNotContain`, include `$not`
        return {
          relationships: {
            $not: {
              $elemMatch: {
                "target._id": rule.value,
              },
            },
          },
        };
      } else {
        return {
          relationships: {
            $elemMatch: {
              "target._id": rule.value,
            },
          },
        };
      }
    } else if (rule.field === "attributes") {
      // Parse the custom rule
      const customRule = JSON.parse(rule.value);

      // Create a base custom rule structure
      const processedCustomRules: Record<string, any>[] = [
        { "attributes.values.type": customRule.type },
      ];

      // Append query components depending on the specified operator
      if (customRule.operator === "contains") {
        processedCustomRules.push({
          "attributes.values.data": {
            $regex: new RegExp(customRule.value, "gi").toString(),
          },
        });
      } else if (customRule.operator === "does not contain") {
        processedCustomRules.push({
          "attributes.values.data": {
            $not: {
              $regex: new RegExp(customRule.value, "gi").toString(),
            },
          },
        });
      } else if (customRule.operator === "equals") {
        if (customRule.type === "number") {
          processedCustomRules.push({
            "attributes.values.data": {
              $eq: parseFloat(customRule.value),
            },
          });
        } else {
          processedCustomRules.push({
            "attributes.values.data": {
              $eq: dayjs(customRule.value).format("YYYY-MM-DD"),
            },
          });
        }
      } else if (customRule.operator === ">") {
        if (customRule.type === "number") {
          processedCustomRules.push({
            "attributes.values.data": {
              $gt: parseFloat(customRule.value),
            },
          });
        } else {
          processedCustomRules.push({
            "attributes.values.data": {
              $gt: dayjs(customRule.value).format("YYYY-MM-DD"),
            },
          });
        }
      } else if (customRule.operator === "<") {
        if (customRule.type === "number") {
          processedCustomRules.push({
            "attributes.values.data": {
              $lt: parseFloat(customRule.value),
            },
          });
        } else {
          processedCustomRules.push({
            "attributes.values.data": {
              $lt: dayjs(customRule.value).format("YYYY-MM-DD"),
            },
          });
        }
      }

      // Handle the operator
      if (rule.operator === "doesNotContain") {
        return { $nor: processedCustomRules };
      } else {
        return { $and: processedCustomRules };
      }
    }

    // Default rule applied
    return defaultRuleProcessorMongoDB(rule);
  };

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
  const [searchText, { error }] = useLazyQuery(SEARCH_TEXT);

  // State to hold the query
  const [query, setQuery] = useState(initialQuery);
  const [isValid, setIsValid] = useState(false);

  const onSearchBuiltQuery = async () => {
    setIsSearching(true);
    setHasSearched(true);

    // Format the query in `mongodb` format before sending
    const results = await searchText({
      variables: {
        query: JSON.stringify(
          formatQuery(query, {
            format: "mongodb_query",
            ruleProcessor: ruleProcessor,
          }),
        ),
        resultType: "entity",
        isBuilder: true,
        showArchived: false,
      },
      fetchPolicy: "network-only",
    });

    if (results.data.search) {
      setResults(results.data.search);
    }

    if (error) {
      toaster.create({
        title: "Error",
        type: "error",
        description: error.message,
        duration: 4000,
        closable: true,
      });
    }

    setIsSearching(false);
  };

  /**
   * Validate the query as it changes
   * @param {RuleGroupType} query Query to validate
   */
  const validateQuery = (query: RuleGroupType) => {
    if (query.rules.length > 0) {
      // Validation involves making sure all fields have a value
      // Extract all `value` statements from the query
      const values = JSONPath({
        path: "$..value",
        json: query,
        resultType: "path",
      });
      for (const value of values) {
        // Break the path down into an array of keys
        const path: string[] = [];
        for (let key of value.slice(2, -1).split("][")) {
          // Remove the quotes from the key
          key = key.replace(/'/g, "");
          path.push(key);
        }

        // Iterate down the path until the `value` statement is found
        let currentLevel = query as any;
        for (const key of path) {
          if (key in currentLevel) {
            // If the key is a `value` statement, check if it is valid
            if (key === "value") {
              if (
                _.isUndefined(currentLevel[key]) ||
                currentLevel[key] === ""
              ) {
                setIsValid(false);
                return;
              }
            } else {
              // Otherwise, continue down the path
              currentLevel = currentLevel[key];
            }
          }
        }
      }
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  };

  useEffect(() => {
    // Validate the query as it changes
    validateQuery(query);
  }, [query]);

  return (
    <TabPanel p={"2"}>
      <Flex direction={"column"} gap={"2"}>
        <Information
          text={
            "Use the query builder to construct advanced queries to search for Entities within the Workspace."
          }
        />

        <Flex direction={"column"} gap={"2"}>
          <QueryBuilderChakra>
            <QueryBuilderDnD dnd={{ ...ReactDnD, ...ReactDndHtml5Backend }}>
              <QueryBuilder
                controlClassnames={{ queryBuilder: "queryBuilder-branches" }}
                fields={fields}
                onQueryChange={setQuery}
                controlElements={{ valueEditor: SearchQueryValue }}
                enableDragAndDrop
              />
            </QueryBuilderDnD>
          </QueryBuilderChakra>
          <Flex>
            <Button
              aria-label={"Run Query"}
              colorPalette={"green"}
              size={"sm"}
              onClick={() => onSearchBuiltQuery()}
              disabled={!isValid}
            >
              Run Query
              <Icon name={"search"} />
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </TabPanel>
  );
};

export default SearchQueryBuilder;
