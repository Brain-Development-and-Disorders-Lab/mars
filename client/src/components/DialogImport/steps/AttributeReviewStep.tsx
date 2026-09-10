// React
import React from "react";

// Components
import { Flex, Text } from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { AttributeImportReview, AttributeReviewStepProps } from "@types";

// Utility functions and libraries
import _ from "lodash";

// Variables
import { STYLES } from "@variables";

const attributeReviewTableColumnHelper = createColumnHelper<AttributeImportReview>();
const attributeReviewTableColumns = [
  attributeReviewTableColumnHelper.accessor("name", {
    cell: (info) => (
      <Flex>
        <Tooltip content={info.getValue()} showArrow disabled={info.getValue().length < 30}>
          <Flex direction={"row"} gap={"1"} ml={"1"}>
            <Icon name={"attribute"} color={STYLES.attribute.color.icon} size={"xs"} />
            <Text fontSize={"xs"} fontWeight={"semibold"}>
              {_.truncate(info.getValue(), { length: 30 })}
            </Text>
          </Flex>
        </Tooltip>
      </Flex>
    ),
    header: "Attribute Name",
  }),
  attributeReviewTableColumnHelper.accessor("state", {
    cell: (info) => (
      <Flex direction={"row"} gap={"1"} align={"center"} p={"1"}>
        <Icon
          name={info.getValue() === "update" ? "edit" : "add"}
          color={info.getValue() === "update" ? "blue.600" : "green"}
          size={"xs"}
        />
        <Text fontWeight={"semibold"} fontSize={"xs"} color={info.getValue() === "update" ? "blue.600" : "green"}>
          {_.capitalize(info.getValue())}
        </Text>
      </Flex>
    ),
    header: "Action",
  }),
];

const AttributeReviewStep = ({ reviewAttributes }: AttributeReviewStepProps) => (
  <Flex w={"100%"} direction={"column"} gap={"2"} rounded={"md"} mt={"2"}>
    <Flex
      direction={"row"}
      gap={"2"}
      p={"2"}
      align={"center"}
      rounded={"md"}
      bg={STYLES.attribute.color.light}
      border={"1px solid"}
      borderColor={STYLES.attribute.color.border}
    >
      <Icon name={"attribute"} size={"sm"} color={STYLES.attribute.color.icon} />
      <Flex direction={"column"} gap={"0.5"}>
        <Text fontSize={"xs"} fontWeight={"bold"}>
          Reviewing {reviewAttributes.length} {reviewAttributes.length === 1 ? "Attribute" : "Attributes"}
        </Text>
        <Text fontSize={"xs"} color={"text.subtle"}>
          Existing Attributes will be updated, new Attributes will be created.
        </Text>
      </Flex>
    </Flex>
    <DataTable
      columns={attributeReviewTableColumns}
      data={reviewAttributes}
      visibleColumns={{}}
      selectedRows={{}}
      showPagination
    />
  </Flex>
);

export default AttributeReviewStep;
