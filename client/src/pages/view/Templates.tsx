// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  Link,
  Spacer,
  Tag,
  Text,
} from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import DataTable from "@components/DataTable";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";
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
      cell: (info) => <Text fontWeight={"semibold"}>{info.getValue()}</Text>,
      header: "Name",
    }),
    columnHelper.accessor("description", {
      cell: (info) => {
        if (_.isEqual(info.getValue(), "") || _.isNull(info.getValue())) {
          return (
            <Tag.Root colorPalette={"orange"}>
              <Tag.Label>Empty</Tag.Label>
            </Tag.Root>
          );
        }
        return (
          <Text fontSize={"sm"}>
            {_.truncate(info.getValue(), { length: 36 })}
          </Text>
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
          />
        );
      },
      header: "Owner",
      enableHiding: true,
    }),
    columnHelper.accessor("timestamp", {
      cell: (info) => dayjs(info.getValue()).fromNow(),
      header: "Created",
      enableHiding: true,
    }),
    columnHelper.accessor("values", {
      cell: (info) => {
        return (
          <Tag.Root colorPalette={"green"}>
            <Tag.Label>{info.getValue().length}</Tag.Label>
          </Tag.Root>
        );
      },
      header: "Values",
    }),
    columnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex justifyContent={"right"} p={"2"} align={"center"} gap={"1"}>
            <Link
              fontWeight={"semibold"}
              color={"black"}
              onClick={() => navigate(`/templates/${info.getValue()}`)}
            >
              View
            </Link>
            <Icon name={"a_right"} />
          </Flex>
        );
      },
      header: "",
    }),
  ];

  return (
    <Content isError={!_.isUndefined(error)} isLoaded={!loading}>
      <Flex
        direction={"row"}
        p={"4"}
        rounded={"md"}
        bg={"white"}
        wrap={"wrap"}
        gap={"4"}
      >
        <Flex
          w={"100%"}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
        >
          <Flex align={"center"} gap={"2"} w={"100%"}>
            <Icon name={"template"} size={"md"} />
            <Heading size={"md"}>Templates</Heading>
            <Spacer />
            <Button
              colorPalette={"green"}
              onClick={() => navigate("/create/template")}
              size={"sm"}
              rounded={"md"}
            >
              Create
              <Icon name={"add"} />
            </Button>
          </Flex>
        </Flex>
        <Flex direction={"column"} gap={"4"} w={"100%"}>
          <Text fontSize={"sm"}>
            All Templates in the current Workspace are shown below. Sort the
            Templates using the column headers.
          </Text>
          {templates.length > 0 ? (
            <DataTable
              columns={columns}
              data={templates}
              visibleColumns={visibleColumns}
              selectedRows={{}}
              showColumnSelect
              showPagination
              showSelection
              showItemCount
            />
          ) : (
            <Flex
              w={"100%"}
              direction={"row"}
              p={"4"}
              justify={"center"}
              align={"center"}
            >
              <Text color={"gray.400"} fontWeight={"semibold"}>
                You do not have any Templates.
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Content>
  );
};

export default Templates;
