// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  Spacer,
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
import { request } from "@database/functions";
import _ from "lodash";

// Routing and navigation
import { useNavigate } from "react-router-dom";

const Attributes = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Page state
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const [attributesData, setAttributesData] = useState([] as AttributeModel[]);

  /**
   * Utility function to retrieve all Attributes
   */
  const getAttributes = async () => {
    const response = await request<AttributeModel[]>("GET", "/attributes");
    if (response.success) {
      setAttributesData(response.data);
    } else {
      toast({
        title: "Error",
        status: "error",
        description: "Could not retrieve Attributes data.",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      setIsError(true);
    }
    setIsLoaded(true);
  };

  // Effect to load all Attribute data
  useEffect(() => {
    getAttributes();
  }, []);

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
  const data: AttributeModel[] = attributesData;
  const columnHelper = createColumnHelper<AttributeModel>();
  const columns = [
    columnHelper.accessor("name", {
      cell: (info) => info.getValue(),
      header: "Name",
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
          <Flex w={"100%"} justify={"end"}>
            <Button
              key={`view-entity-${info.getValue()}`}
              colorScheme={"gray"}
              rightIcon={<Icon name={"c_right"} />}
              onClick={() => navigate(`/attributes/${info.getValue()}`)}
            >
              View
            </Button>
          </Flex>
        );
      },
      header: "",
    }),
  ];

  return (
    <Content isError={isError} isLoaded={isLoaded}>
      <Flex
        direction={"row"}
        p={"4"}
        rounded={"md"}
        bg={"white"}
        wrap={"wrap"}
        gap={"6"}
        justify={"center"}
      >
        <Flex
          w={"100%"}
          p={"4"}
          direction={"row"}
          justify={"space-between"}
          align={"center"}
        >
          <Flex align={"center"} gap={"4"}>
            <Icon name={"attribute"} size={"lg"} />
            <Heading fontWeight={"semibold"}>Template Attributes</Heading>
          </Flex>
          <Spacer />
          <Button
            leftIcon={<Icon name={"add"} />}
            colorScheme={"green"}
            onClick={() => navigate("/create/attribute")}
          >
            Create
          </Button>
        </Flex>
        <Flex direction={"column"} gap={"4"} w={"100%"}>
          {data.length > 0 ? (
            <DataTable
              columns={columns}
              data={data}
              visibleColumns={visibleColumns}
              showPagination
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
