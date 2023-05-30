// React
import React, { useEffect, useState } from "react";
import {
  Flex,
  Heading,
  Text,
  useToast,
  Button,
  Link,
  Icon,
  useBreakpoint,
} from "@chakra-ui/react";
import { BsBox, BsChevronRight, BsPlusLg } from "react-icons/bs";
import { createColumnHelper } from "@tanstack/react-table";

// Navigation
import { useNavigate } from "react-router-dom";

// Database and models
import { getData } from "@database/functions";
import { EntityModel } from "@types";

// Utility libraries
import _ from "lodash";
import dayjs from "dayjs";

// Custom components
import { ContentContainer } from "@components/ContentContainer";
import { Loading } from "@components/Loading";
import { Error } from "@components/Error";
import { DataTable } from "@components/DataTable";

const Entities = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Page state
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const [entityData, setEntityData] = useState([] as EntityModel[]);

  const breakpoint = useBreakpoint();
  const [visibleColumns, setVisibleColumns] = useState({});

  // Effect to adjust column visibility
  useEffect(() => {
    if (_.isEqual(breakpoint, "sm") || _.isEqual(breakpoint, "base") || _.isUndefined(breakpoint)) {
      setVisibleColumns({ description: false, owner: false, created: false });
    } else {
      setVisibleColumns({});
    }
  }, [breakpoint]);

  useEffect(() => {
    getData(`/entities`)
      .then((value) => {
        setEntityData(value);
      }).catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Entities data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      }).finally(() => {
        setIsLoaded(true);
      });
  }, []);

  // Configure table columns and data
  const data: EntityModel[] = entityData;
  const columnHelper = createColumnHelper<EntityModel>();
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
    columnHelper.accessor("owner", {
      cell: (info) => info.getValue(),
      header: "Owner",
    }),
    columnHelper.accessor("created", {
      cell: (info) => dayjs(info.getValue()).fromNow(),
      header: "Created",
    }),
    columnHelper.accessor("_id", {
      cell: (info) => {
        return (
          <Button
            key={`view-entity-${info.getValue()}`}
            colorScheme={"blackAlpha"}
            rightIcon={<Icon as={BsChevronRight} />}
            onClick={() => navigate(`/entities/${info.getValue()}`)}
          >
            View
          </Button>
        );
      },
      header: "",
    }),
  ];

  return (
    <ContentContainer vertical={isError || !isLoaded}>
      {isLoaded ? (
        isError ? (
          <Error />
        ) : (
          <Flex
            direction={"column"}
            justify={"center"}
            p={"4"}
            gap={"6"}
            maxW={"7xl"}
            wrap={"wrap"}
          >
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
                  <Icon as={BsBox} w={"8"} h={"8"} />
                  <Heading fontWeight={"semibold"}>Entities</Heading>
                </Flex>
                <Button
                  rightIcon={<Icon as={BsPlusLg} />}
                  as={Link}
                  onClick={() => navigate("/create/entity/start")}
                  colorScheme={"green"}
                >
                  Create
                </Button>
              </Flex>
              {isLoaded && entityData.length > 0 ? (
                <Flex direction={"column"} gap={"4"} w={"100%"}>
                  <DataTable columns={columns} data={data} visibleColumns={visibleColumns} />
                </Flex>
              ) : (
                <Text>There are no Entities to display.</Text>
              )}
            </Flex>
          </Flex>
        )
      ) : (
        <Loading />
      )}
    </ContentContainer>
  );
};

export default Entities;
