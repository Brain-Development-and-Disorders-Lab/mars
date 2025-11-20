// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  EmptyState,
  Flex,
  Heading,
  Spacer,
  Tag,
  Text,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import DataTableRemix from "@components/DataTableRemix";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";
import Tooltip from "@components/Tooltip";
import { createColumnHelper } from "@tanstack/react-table";

// Existing and custom types
import { AttributeModel } from "@types";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";

// Routing and navigation
import { useNavigate } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

// Context and hooks
import { useWorkspace } from "@hooks/useWorkspace";
import { useBreakpoint } from "@hooks/useBreakpoint";

const Templates = () => {
  const navigate = useNavigate();

  // Page state
  const [templates, setTemplates] = useState([] as AttributeModel[]);

  // GraphQL operations
  const GET_TEMPLATES = gql`
    query GetTemplates {
      templates {
        _id
        name
        owner
        timestamp
        description
        values {
          _id
          name
          type
          data
        }
      }
    }
  `;
  const { loading, error, data, refetch } = useQuery(GET_TEMPLATES);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.templates) {
      // Unpack all the Template data
      setTemplates(data.templates);
    }
  }, [loading]);

  useEffect(() => {
    if (error) {
      toaster.create({
        title: "Error",
        type: "error",
        description: "Unable to retrieve Templates",
        duration: 4000,
        closable: true,
      });
    }
  }, [error]);

  const { workspace } = useWorkspace();

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, [workspace]);

  const { breakpoint } = useBreakpoint();
  const [visibleColumns, setVisibleColumns] = useState({
    description: true,
    timestamp: true,
    owner: true,
  });

  // Effect to adjust column visibility
  useEffect(() => {
    const isMobile = breakpoint === "base" || breakpoint === "sm";
    setVisibleColumns({
      description: !isMobile,
      timestamp: !isMobile,
      owner: !isMobile,
    });
  }, [breakpoint]);

  // Configure table columns and data
  const columnHelper = createColumnHelper<AttributeModel>();
  const columns = [
    columnHelper.accessor("name", {
      cell: (info) => {
        return (
          <Flex align={"center"} justify={"space-between"} gap={"1"} w={"100%"}>
            <Tooltip
              content={info.getValue()}
              disabled={info.getValue().length < 20}
              showArrow
            >
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(info.getValue(), { length: 20 })}
              </Text>
            </Tooltip>
            <Button
              size="2xs"
              mx={"1"}
              variant="outline"
              colorPalette="gray"
              aria-label={"View Template"}
              onClick={() => navigate(`/templates/${info.row.original._id}`)}
            >
              View
              <Icon name={"a_right"} />
            </Button>
          </Flex>
        );
      },
      header: "Name",
    }),
    columnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label fontSize={"xs"}>Empty</Tag.Label>
            </Tag.Root>
          );
        }
        return (
          <Flex>
            <Tooltip
              content={info.getValue()}
              disabled={info.getValue().length < 32}
              showArrow
            >
              <Text fontSize={"xs"}>
                {_.truncate(info.getValue(), { length: 32 })}
              </Text>
            </Tooltip>
          </Flex>
        );
      },
      header: "Description",
      enableHiding: true,
    }),
    columnHelper.accessor("owner", {
      cell: (info) => {
        return (
          <ActorTag
            orcid={info.getValue()}
            fallback={"Unknown User"}
            size={"sm"}
            inline
          />
        );
      },
      header: "Owner",
      enableHiding: true,
    }),
    columnHelper.accessor("timestamp", {
      cell: (info) => {
        return (
          <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
            {dayjs(info.getValue()).fromNow()}
          </Text>
        );
      },
      header: "Created",
      enableHiding: true,
    }),
    columnHelper.accessor("values", {
      cell: (info) => {
        return (
          <Tag.Root colorPalette={"green"} size={"sm"}>
            <Tag.Label fontSize={"xs"}>{info.getValue().length}</Tag.Label>
          </Tag.Root>
        );
      },
      header: "Values",
    }),
  ];

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading}>
      <Flex
        direction={"row"}
        p={"2"}
        rounded={"md"}
        bg={"white"}
        wrap={"wrap"}
        gap={"2"}
      >
        <Flex
          w={"100%"}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
        >
          <Flex align={"center"} gap={"2"} w={"100%"}>
            <Icon name={"template"} size={"sm"} />
            <Heading size={"md"}>Templates</Heading>
            <Spacer />
            <Button
              colorPalette={"green"}
              onClick={() => navigate("/create/template")}
              size={"xs"}
              rounded={"md"}
            >
              Create Template
              <Icon name={"add"} size={"xs"} />
            </Button>
          </Flex>
        </Flex>
        <Flex direction={"column"} gap={"2"} w={"100%"}>
          <Text fontSize={"xs"} ml={"0.5"}>
            All Templates in the current Workspace are shown below. Sort the
            Templates using the column headers.
          </Text>
          {templates.length > 0 ? (
            <DataTableRemix
              columns={columns}
              data={templates}
              visibleColumns={visibleColumns}
              selectedRows={{}}
              showColumnSelect
              showPagination
              showSelection
            />
          ) : (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon name={"template"} size={"lg"} />
                </EmptyState.Indicator>
                <EmptyState.Description>No Templates</EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          )}
        </Flex>
      </Flex>
    </Content>
  );
};

export default Templates;
