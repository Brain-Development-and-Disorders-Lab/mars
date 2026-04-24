import React from "react";

// Existing and custom components
import { Flex, Heading, Text, Stat, Button, Tag, Switch } from "@chakra-ui/react";
import { Content } from "@components/Container";
import DataTable, { ColumnMeta } from "@components/DataTable";
import Icon from "@components/Icon";

// Custom types
import { AdminMetrics, AdminUser, IconNames, IResponseMessage } from "@types";

// GraphQL imports
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";

// Utility imports
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";

// Variables
import { GLOBAL_STYLES } from "@variables";

const GET_ADMIN_DATA = gql`
  query GetAdminData {
    adminMetrics {
      users
      workspaces
      entities
      projects
      templates
    }
    adminUsers {
      _id
      name
      email
      role
      workspaces
      features {
        ai
      }
    }
  }
`;

const SET_USER_FEATURES = gql`
  mutation SetUserFeatures($_id: String, $ai: Boolean) {
    setUserFeatures(_id: $_id, ai: $ai) {
      success
      message
    }
  }
`;

const StatCard = ({
  label,
  value,
  icon,
  iconColor,
}: {
  label: string;
  value: number | undefined;
  icon: IconNames;
  iconColor: string;
}) => (
  <Flex
    direction={"column"}
    p={"1"}
    gap={"1"}
    rounded={"md"}
    border={GLOBAL_STYLES.border.style}
    borderColor={GLOBAL_STYLES.border.color}
    minW={"140px"}
  >
    <Flex direction={"row"} align={"center"} gap={"1"} ml={"0.5"}>
      <Icon name={icon} size={"xs"} color={iconColor} />
      <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.600"}>
        {label}
      </Text>
    </Flex>
    <Stat.Root>
      <Stat.ValueText fontSize={"lg"} fontWeight={"semibold"} ml={"0.5"}>
        {value ?? "0"}
      </Stat.ValueText>
    </Stat.Root>
  </Flex>
);

const columnHelper = createColumnHelper<AdminUser>();

const Admin = () => {
  const { data, loading, error, refetch } = useQuery<{ adminMetrics: AdminMetrics; adminUsers: AdminUser[] }>(
    GET_ADMIN_DATA,
    { fetchPolicy: "network-only" },
  );

  const [setUserFeatures] = useMutation<{ setUserFeatures: IResponseMessage }>(SET_USER_FEATURES, {
    onCompleted: () => refetch(),
  });

  const usersTableColumns = [
    columnHelper.accessor("name", {
      cell: (info) => (
        <Text fontSize={"xs"} fontWeight={"semibold"}>
          {info.getValue() || "—"}
        </Text>
      ),
      header: "Name",
      meta: { minWidth: 180 } as ColumnMeta,
    }),
    columnHelper.accessor("email", {
      cell: (info) => (
        <Text fontSize={"xs"} color={"gray.600"}>
          {info.getValue() || "—"}
        </Text>
      ),
      header: "Email",
      meta: { minWidth: 220 } as ColumnMeta,
    }),
    columnHelper.accessor("role", {
      cell: (info) => (
        <Tag.Root colorPalette={info.getValue() === "admin" ? "orange" : "blue"} size={"sm"}>
          <Tag.Label>{info.getValue() || "user"}</Tag.Label>
        </Tag.Root>
      ),
      header: "Role",
      meta: { fixedWidth: 100 } as ColumnMeta,
    }),
    columnHelper.accessor("workspaces", {
      cell: (info) => (
        <Text fontSize={"xs"} color={"gray.600"}>
          {info.getValue()}
        </Text>
      ),
      header: "Workspaces",
      meta: { fixedWidth: 120 } as ColumnMeta,
    }),
    columnHelper.display({
      id: "features",
      cell: (info) => (
        <Flex direction={"row"} align={"center"} gap={"2"}>
          <Switch.Root
            size={"sm"}
            colorPalette={"green"}
            checked={info.row.original.features?.ai ?? false}
            onCheckedChange={(e) => setUserFeatures({ variables: { _id: info.row.original._id, ai: e.checked } })}
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
          <Text fontSize={"xs"} color={"gray.600"}>
            AI
          </Text>
        </Flex>
      ),
      header: "Additional Features",
      meta: { minWidth: 120 } as ColumnMeta,
    }),
  ];

  return (
    <Content isError={!!error} isLoaded={!loading}>
      <Flex direction={"column"} gap={"2"} p={"1"}>
        <Flex direction={"row"} align={"left"} justify={"space-between"} gap={"1"} w={"100%"}>
          <Flex
            align={"center"}
            gap={"1"}
            p={"1"}
            border={"2px solid"}
            borderColor={"gray.700"}
            bg={"gray.100"}
            rounded={"md"}
            w={"fit-content"}
          >
            <Icon name={"settings"} size={"sm"} />
            <Heading fontWeight={"semibold"} size={"sm"}>
              Metadatify Admin Dashboard
            </Heading>
          </Flex>

          <Flex direction={"row"} gap={"1"} align={"center"}>
            <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.500"}>
              Last Updated:
            </Text>
            <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.400"}>
              {dayjs(Date.now()).fromNow()}
            </Text>
            <Button size={"xs"} rounded={"md"} colorPalette={"blue"} onClick={() => refetch()}>
              Refresh
              <Icon name={"reload"} size={"xs"} />
            </Button>
          </Flex>
        </Flex>

        <Flex
          direction={"column"}
          gap={"1"}
          p={"1"}
          rounded={"md"}
          border={GLOBAL_STYLES.border.style}
          borderColor={GLOBAL_STYLES.border.color}
        >
          <Text fontSize={"xs"} fontWeight={"bold"} color={"gray.600"} ml={"0.5"}>
            Overview
          </Text>

          <Flex direction={"row"} gap={"1"} wrap={"wrap"}>
            <StatCard label={"Users"} value={data?.adminMetrics?.users} icon={"person"} iconColor={"gray.700"} />
            <StatCard
              label={"Workspaces"}
              value={data?.adminMetrics?.workspaces}
              icon={"workspace"}
              iconColor={"gray.700"}
            />
            <StatCard
              label={"Entities"}
              value={data?.adminMetrics?.entities}
              icon={"entity"}
              iconColor={GLOBAL_STYLES.entity.iconColor}
            />
            <StatCard
              label={"Projects"}
              value={data?.adminMetrics?.projects}
              icon={"project"}
              iconColor={GLOBAL_STYLES.project.iconColor}
            />
            <StatCard
              label={"Templates"}
              value={data?.adminMetrics?.templates}
              icon={"template"}
              iconColor={GLOBAL_STYLES.template.iconColor}
            />
          </Flex>
        </Flex>

        <Flex
          direction={"column"}
          gap={"1"}
          p={"1"}
          rounded={"md"}
          border={GLOBAL_STYLES.border.style}
          borderColor={GLOBAL_STYLES.border.color}
        >
          <Flex direction={"row"} align={"center"} gap={"1"} ml={"0.5"}>
            <Icon name={"person"} size={"xs"} />
            <Text fontSize={"xs"} fontWeight={"bold"} color={"gray.600"}>
              Users
            </Text>
          </Flex>
          <DataTable
            data={data?.adminUsers ?? []}
            columns={usersTableColumns}
            visibleColumns={{}}
            selectedRows={{}}
            showPagination
          />
        </Flex>
      </Flex>
    </Content>
  );
};

export default Admin;
