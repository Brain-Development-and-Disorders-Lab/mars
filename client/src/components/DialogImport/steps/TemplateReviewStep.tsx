// React
import React from "react";

// Components
import { Flex, Text } from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { TemplateImportReview, TemplateReviewStepProps } from "@types";

// Utility functions and libraries
import _ from "lodash";

// Variables
import { STYLES } from "@variables";

const templateReviewTableColumnHelper = createColumnHelper<TemplateImportReview>();
const templateReviewTableColumns = [
  templateReviewTableColumnHelper.accessor("name", {
    cell: (info) => (
      <Flex>
        <Tooltip content={info.getValue()} showArrow disabled={info.getValue().length < 30}>
          <Flex direction={"row"} gap={"1"} ml={"1"}>
            <Icon name={"template"} color={STYLES.template.color.icon} size={"xs"} />
            <Text fontSize={"xs"} fontWeight={"semibold"}>
              {_.truncate(info.getValue(), { length: 30 })}
            </Text>
          </Flex>
        </Tooltip>
      </Flex>
    ),
    header: "Template Name",
  }),
  templateReviewTableColumnHelper.accessor("state", {
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

const TemplateReviewStep = ({ reviewTemplates }: TemplateReviewStepProps) => (
  <Flex w={"100%"} direction={"column"} gap={"2"} rounded={"md"} mt={"2"}>
    <Flex
      direction={"row"}
      gap={"2"}
      p={"2"}
      align={"center"}
      rounded={"md"}
      bg={STYLES.template.color.light}
      border={"1px solid"}
      borderColor={STYLES.template.color.border}
    >
      <Icon name={"template"} size={"sm"} color={STYLES.template.color.icon} />
      <Flex direction={"column"} gap={"0.5"}>
        <Text fontSize={"xs"} fontWeight={"bold"}>
          Reviewing {reviewTemplates.length} {reviewTemplates.length === 1 ? "Template" : "Templates"}
        </Text>
        <Text fontSize={"xs"} color={"text.subtle"}>
          Existing Templates will be updated, new Templates will be created.
        </Text>
      </Flex>
    </Flex>
    <DataTable
      columns={templateReviewTableColumns}
      data={reviewTemplates}
      visibleColumns={{}}
      selectedRows={{}}
      showPagination
    />
  </Flex>
);

export default TemplateReviewStep;
