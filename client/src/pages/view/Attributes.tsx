// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  Spacer,
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
import { getData } from "@database/functions";
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

  // Effect to load all Attribute data
  useEffect(() => {
    getData(`/attributes`)
      .then((value) => {
        setAttributesData(value);
        setIsLoaded(true);
      })
      .catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Attributes data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      })
      .finally(() => {
        setIsLoaded(true);
      });
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
              colorScheme={"blackAlpha"}
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
            <Heading fontWeight={"semibold"}>Attributes</Heading>
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
          <DataTable
            columns={columns}
            data={data}
            visibleColumns={visibleColumns}
            hideSelection
          />
        </Flex>
      </Flex>
    </Content>
  );
};

export default Attributes;
