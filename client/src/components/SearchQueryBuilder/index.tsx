// React imports
import React, { useState } from "react";

// Existing and custom components
import { Button, Collapsible, Flex, Tag, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import SearchQueryValue from "@components/SearchQueryValue";

// QueryBuilder imports
import QueryBuilder, { Field, RuleGroupType, RuleType } from "react-querybuilder";
import { QueryBuilderDnD } from "@react-querybuilder/dnd";
import * as ReactDnD from "react-dnd";
import * as ReactDndHtml5Backend from "react-dnd-html5-backend";
import { QueryBuilderChakra } from "@react-querybuilder/chakra";

// Utility libraries
import _ from "lodash";

// Variables
import { GLOBAL_STYLES } from "@variables";

interface SearchQueryBuilderProps {
  query: RuleGroupType;
  onQueryChange: (query: RuleGroupType) => void;
  fields: Field[];
  isValid: boolean;
  onSearch: () => void;
  onClear: () => void;
}

// Variables for labels
const OPERATOR_LABELS: Record<string, string> = {
  "=": "is",
  contains: "contains",
  doesNotContain: "does not contain",
  beginsWith: "begins with",
  endsWith: "ends with",
};

const ATTR_OPERATOR_LABELS: Record<string, string> = {
  contains: "containing",
  "does not contain": "not containing",
  equals: "equal to",
  ">": "greater than",
  "<": "less than",
};

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  description: "Description",
  projects: "Projects",
  relationships: "Relationships",
  attributes: "Attributes",
};

const ATTR_TYPE_PALETTE: Record<string, string> = {
  text: "blue",
  url: "yellow",
  number: "green",
  date: "orange",
};

/**
 * Utility function to generate React components for individual query rules
 * @param {RuleType} rule Specific query rule to render
 * @return {React.ReactNode}
 */
const renderQueryRule = (rule: RuleType): React.ReactNode => {
  const fieldLabel = FIELD_LABELS[rule.field] || rule.field;
  const opLabel = OPERATOR_LABELS[rule.operator] || rule.operator;

  let valueNode: React.ReactNode;
  if (rule.field === "projects") {
    valueNode = rule.value ? (
      <Linky id={rule.value} type={"projects"} size={"xs"} />
    ) : (
      <Text fontSize={"xs"} color={"gray.400"}>
        ...
      </Text>
    );
  } else if (rule.field === "relationships") {
    valueNode = rule.value ? (
      <Linky id={rule.value} type={"entities"} size={"xs"} />
    ) : (
      <Text fontSize={"xs"} color={"gray.400"}>
        ...
      </Text>
    );
  } else if (rule.field === "attributes") {
    try {
      const parsed = JSON.parse(rule.value);
      const attrOp = ATTR_OPERATOR_LABELS[parsed.operator] || parsed.operator;
      const palette = ATTR_TYPE_PALETTE[parsed.type] || "gray";
      valueNode = (
        <Flex gap={"1"} align={"center"}>
          <Tag.Root size={"sm"} colorPalette={palette}>
            <Tag.Label fontSize={"xs"}>{_.capitalize(parsed.type)}</Tag.Label>
          </Tag.Root>
          <Text fontSize={"xs"}>{attrOp}</Text>
          {parsed.value && (
            <Text fontSize={"xs"} fontStyle={"italic"}>
              &quot;{parsed.value}&quot;
            </Text>
          )}
        </Flex>
      );
    } catch {
      valueNode = <Text fontSize={"xs"}>{rule.value}</Text>;
    }
  } else {
    valueNode = rule.value ? (
      <Text fontSize={"xs"} fontStyle={"italic"}>
        &quot;{rule.value}&quot;
      </Text>
    ) : (
      <Text fontSize={"xs"} color={"gray.400"}>
        ...
      </Text>
    );
  }

  return (
    <Flex gap={"1"} align={"center"}>
      <Text fontSize={"xs"} fontWeight={"medium"}>
        {fieldLabel}
      </Text>
      <Text fontSize={"xs"} color={"gray.500"}>
        {opLabel}
      </Text>
      {valueNode}
    </Flex>
  );
};

/**
 * Utility function to generate React components for query rule groups
 * @param {RuleGroupType} group Current query group
 * @param {boolean} isNested Whether the group is nested within the query
 * @return {React.ReactNode}
 */
const renderQueryGroup = (group: RuleGroupType, isNested = false): React.ReactNode => {
  if (group.rules.length === 0) {
    return (
      <Text fontSize={"xs"} color={"gray.400"}>
        Query incomplete
      </Text>
    );
  }

  const isAnd = group.combinator === "and";
  const combinatorLabel = isAnd ? "AND" : "OR";
  const combinatorPalette = isAnd ? "green" : "orange";

  return (
    <Flex
      gap={"1"}
      align={"center"}
      wrap={"wrap"}
      {...(isNested && {
        px: "2",
        py: "1",
        border: GLOBAL_STYLES.border.style,
        borderColor: "gray.200",
        rounded: "md",
        bg: "gray.50",
      })}
    >
      {group.rules.map((rule, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <Tag.Root size={"sm"} colorPalette={combinatorPalette}>
              <Tag.Label fontSize={"xs"}>{combinatorLabel}</Tag.Label>
            </Tag.Root>
          )}
          {"combinator" in rule ? renderQueryGroup(rule as RuleGroupType, true) : renderQueryRule(rule as RuleType)}
        </React.Fragment>
      ))}
    </Flex>
  );
};

const SearchQueryBuilder = ({ query, onQueryChange, fields, isValid, onSearch, onClear }: SearchQueryBuilderProps) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <Flex direction={"column"} gap={"1"}>
      <Collapsible.Root open={previewOpen} onOpenChange={(e) => setPreviewOpen(e.open)}>
        <Flex
          direction={"column"}
          gap={"1"}
          p={"1"}
          rounded={"md"}
          border={GLOBAL_STYLES.border.style}
          borderColor={GLOBAL_STYLES.border.color}
        >
          <Flex direction={"row"} gap={"1"} align={"center"} justify={"space-between"}>
            <Flex direction={"row"} gap={"1"} align={"center"}>
              <Icon name={"info"} size={"xs"} />
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                Natural Language Preview
              </Text>
            </Flex>
            <Collapsible.Trigger asChild>
              <Button size={"xs"} variant={"ghost"} colorPalette={"gray"}>
                {previewOpen ? "Hide" : "Show"} Preview
                <Icon name={previewOpen ? "c_up" : "c_down"} size={"xs"} />
              </Button>
            </Collapsible.Trigger>
          </Flex>
          <Collapsible.Content>
            <Flex p={"1"} minH={"28px"} align={"center"}>
              {renderQueryGroup(query)}
            </Flex>
          </Collapsible.Content>
        </Flex>
      </Collapsible.Root>
      <QueryBuilderChakra>
        <QueryBuilderDnD dnd={{ ...ReactDnD, ...ReactDndHtml5Backend }}>
          <QueryBuilder
            controlClassnames={{ queryBuilder: "queryBuilder-branches" }}
            fields={fields}
            query={query}
            onQueryChange={onQueryChange}
            controlElements={{ valueEditor: SearchQueryValue }}
            enableDragAndDrop
          />
        </QueryBuilderDnD>
      </QueryBuilderChakra>
      <Flex justify={"right"} gap={"1"}>
        <Button
          aria-label={"Run Query"}
          colorPalette={"green"}
          size={"xs"}
          rounded={"md"}
          onClick={onSearch}
          disabled={!isValid}
        >
          Search
          <Icon name={"search"} size={"xs"} />
        </Button>
        <Button
          size={"xs"}
          rounded={"md"}
          colorPalette={"gray"}
          variant={"outline"}
          disabled={query.rules.length === 0}
          onClick={onClear}
        >
          Clear
        </Button>
      </Flex>
    </Flex>
  );
};

export default SearchQueryBuilder;
