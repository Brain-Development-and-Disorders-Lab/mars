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
  useBreakpoint,
  useToast,
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import { Content } from "@components/Container";

// Existing and custom types
import { AttributeModel } from "@types";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";

// Routing and navigation
import { useNavigate } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

// Workspace context
import { useWorkspace } from "@hooks/useWorkspace";

const Attributes = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Page state
  const [attributesData, setAttributesData] = useState([] as AttributeModel[]);

  // GraphQL operations
  const GET_ATTRIBUTES = gql`
    query GetAttribute {
      attributes {
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
  const { loading, error, data, refetch } = useQuery(GET_ATTRIBUTES);

  // Manage data once retrieved
  useEffect(() => {
    if (data?.attributes) {
      // Unpack all the Entity data
      setAttributesData(data.attributes);
    }
  }, [loading]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        status: "error",
        description: "Unable to retrieve Attributes",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
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

  const breakpoint = useBreakpoint();
  const [visibleColumns, setVisibleColumns] = useState({});

  // Effect to adjust column visibility
  useEffect(() => {
    if (
      _.isEqual(breakpoint, "sm") ||
      _.isEqual(breakpoint, "base") ||
      _.isUndefined(breakpoint)
    ) {
      setVisibleColumns({ description: false });
    } else {
      setVisibleColumns({});
    }
  }, [breakpoint]);

  // Configure table columns and data
  const columnHelper = createColumnHelper<AttributeModel>();
  const columns = [
    columnHelper.accessor("name", {
      cell: (info) => <Text fontWeight={"semibold"}>{info.getValue()}</Text>,
      header: "Name",
    }),
    columnHelper.accessor("timestamp", {
      cell: (info) => dayjs(info.getValue()).fromNow(),
      header: "Created",
      enableHiding: true,
    }),
    columnHelper.accessor("owner", {
      cell: (info) => {
        return <Tag size={"sm"}>{info.getValue()}</Tag>;
      },
      header: "Owner",
      enableHiding: true,
    }),
    columnHelper.accessor("description", {
      cell: (info) => info.getValue(),
      header: "Description",
      enableHiding: true,
    }),
    columnHelper.accessor("values", {
      cell: (info) => info.getValue().length,
      header: "Values",
    }),
    columnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Flex justifyContent={"right"} p={"2"} align={"center"} gap={"1"}>
            <Link onClick={() => navigate(`/attributes/${info.getValue()}`)}>
              <Text fontWeight={"semibold"}>View</Text>
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
            <Icon name={"attribute"} size={"md"} />
            <Heading size={"md"}>Templates</Heading>
            <Spacer />
            <Button
              rightIcon={<Icon name={"add"} />}
              colorScheme={"green"}
              onClick={() => navigate("/create/attribute")}
              size={"sm"}
            >
              Create
            </Button>
          </Flex>
        </Flex>
        <Flex direction={"column"} gap={"4"} w={"100%"}>
          {attributesData.length > 0 ? (
            <DataTable
              columns={columns}
              data={attributesData}
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

export default Attributes;
