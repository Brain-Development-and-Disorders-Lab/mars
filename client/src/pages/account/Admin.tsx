import React, { useState } from "react";

// Existing and custom components
import { Flex, Heading, Text, Stat, Button, Tag, Switch, IconButton } from "@chakra-ui/react";
import { Content } from "@components/Container";
import ActorTag from "@components/ActorTag";
import DataTable, { ColumnMeta } from "@components/DataTable";
import Icon from "@components/Icon";
import { toaster } from "@components/Toast";
import Tooltip from "@components/Tooltip";

// Custom types
import { AdminMetrics, AdminUser, AdminWorkspace, IconNames, IResponseMessage } from "@types";

// GraphQL imports
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";

// Utility imports
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import _ from "lodash";

// Variables
import { STYLES } from "@variables";
import PermissionsDialog from "@components/PermissionsDialog";

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
      permissions {
        features {
          ai
          api
          import
          scan
        }
        workspaces {
          create
        }
      }
      banned
      lastLogin
    }
    adminWorkspaces {
      _id
      name
      description
      owner
      entities
      projects
      templates
    }
  }
`;

const SET_BAN_STATUS = gql`
  mutation SetBanStatus($_id: String, $banned: Boolean) {
    setBanStatus(_id: $_id, banned: $banned) {
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
    border={STYLES.border.style}
    borderColor={STYLES.border.color}
    minW={"140px"}
  >
    <Flex direction={"row"} align={"center"} gap={"1"} ml={"0.5"}>
      <Icon name={icon} size={"xs"} color={iconColor} />
      <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color}>
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

const workspaceColumnHelper = createColumnHelper<AdminWorkspace>();

const Admin = () => {
  const { data, loading, error, refetch } = useQuery<{
    adminMetrics: AdminMetrics;
    adminUsers: AdminUser[];
    adminWorkspaces: AdminWorkspace[];
  }>(GET_ADMIN_DATA, { fetchPolicy: "network-only" });

  const [setBanStatus] = useMutation<{ setBanStatus: IResponseMessage }>(SET_BAN_STATUS, {
    onCompleted: () => refetch(),
  });

  // `PermissionsDialog` state
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [permissionsDialogUser, setPermissionsDialogUser] = useState("");

  const userColumnHelper = createColumnHelper<AdminUser>();
  const usersTableColumns = [
    userColumnHelper.accessor("email", {
      cell: (info) => (
        <Flex direction={"row"} gap={"2"} justify={"space-between"} w={"100%"} align={"center"}>
          <Tooltip content={info.getValue()} disabled={info.getValue().length < 24}>
            <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color}>
              {_.truncate(info.getValue(), { length: 24 })}
            </Text>
          </Tooltip>
          <IconButton
            aria-label="Copy value"
            size="2xs"
            mx={"1"}
            variant="outline"
            colorPalette="gray"
            onClick={() => {
              navigator.clipboard.writeText(info.getValue());
              toaster.create({
                title: "Copied to clipboard",
                type: "success",
                duration: 2000,
                closable: true,
              });
            }}
          >
            <Icon name="copy" size="xs" />
          </IconButton>
        </Flex>
      ),
      header: "Email",
      meta: { minWidth: 220 } as ColumnMeta,
    }),
    userColumnHelper.accessor("name", {
      cell: (info) => (
        <Text fontSize={"xs"} fontWeight={"semibold"}>
          {info.getValue()}
        </Text>
      ),
      header: "Name",
      meta: { minWidth: 180 } as ColumnMeta,
    }),
    userColumnHelper.accessor("role", {
      cell: (info) => (
        <Tag.Root colorPalette={info.getValue() === "admin" ? "yellow" : "blue"} size={"sm"}>
          <Tag.Label>{_.capitalize(info.getValue()) || "User"}</Tag.Label>
        </Tag.Root>
      ),
      header: "Role",
      meta: { fixedWidth: 100 } as ColumnMeta,
    }),
    userColumnHelper.accessor("workspaces", {
      cell: (info) => (
        <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color}>
          {info.getValue()}
        </Text>
      ),
      header: "Workspaces",
      meta: { fixedWidth: 120 } as ColumnMeta,
    }),
    userColumnHelper.accessor("lastLogin", {
      cell: (info) => (
        <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color}>
          {info.getValue() ? dayjs(info.getValue()).format("D MMM YYYY[ at ]h:mm A") : "Never"}
        </Text>
      ),
      header: "Last Login",
      meta: { minWidth: 180 } as ColumnMeta,
    }),
    userColumnHelper.display({
      id: "banned",
      cell: (info) => (
        <Flex direction={"row"} align={"center"} gap={"2"}>
          <Switch.Root
            size={"sm"}
            colorPalette={"green"}
            checked={!info.row.original.banned}
            onCheckedChange={(event) =>
              setBanStatus({ variables: { _id: info.row.original._id, banned: !event.checked } })
            }
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
          <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color}>
            {info.row.original.banned ? "Inactive" : "Active"}
          </Text>
        </Flex>
      ),
      header: "Account Status",
      meta: { fixedWidth: 120 } as ColumnMeta,
    }),
    userColumnHelper.accessor("_id", {
      cell: (info) => (
        <Flex direction={"row"} align={"center"} gap={"2"}>
          <Button
            size={"2xs"}
            mx={"1"}
            colorPalette={"blue"}
            aria-label={"Permissions"}
            onClick={() => {
              setPermissionsDialogUser(info.row.original._id);
              setPermissionsDialogOpen(true);
            }}
          >
            <Icon name={"settings"} />
            Manage Permissions
          </Button>
        </Flex>
      ),
      header: "Permissions",
      meta: { minWidth: 200 } as ColumnMeta,
    }),
  ];

  const workspacesTableColumns = [
    workspaceColumnHelper.accessor("name", {
      cell: (info) => (
        <Tooltip disabled={info.getValue().length < 32} content={info.getValue()} showArrow>
          <Flex direction={"row"} gap={"1"} ml={"0.5"}>
            <Icon name={"workspace"} size={"xs"} />
            <Text fontSize={"xs"} fontWeight={"semibold"}>
              {_.truncate(info.getValue(), { length: 32 })}
            </Text>
          </Flex>
        </Tooltip>
      ),
      header: "Name",
      meta: { minWidth: 300 } as ColumnMeta,
    }),
    workspaceColumnHelper.accessor("description", {
      cell: (info) => {
        const value = info.getValue();
        if (value) {
          return (
            <Tooltip content={value} disabled={!value || value.length < 40} showArrow>
              <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color}>
                {_.truncate(value, { length: 40 })}
              </Text>
            </Tooltip>
          );
        } else {
          return (
            <Tag.Root colorPalette={"orange"} size={"sm"}>
              <Tag.Label>No Description</Tag.Label>
            </Tag.Root>
          );
        }
      },
      header: "Description",
      meta: { minWidth: 220 } as ColumnMeta,
    }),
    workspaceColumnHelper.accessor("owner", {
      cell: (info) => <ActorTag identifier={info.getValue()} fallback={"Unknown User"} size={"sm"} inline />,
      header: "Owner",
      meta: { minWidth: 160 } as ColumnMeta,
    }),
    workspaceColumnHelper.accessor("entities", {
      cell: (info) => (
        <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color}>
          {info.getValue()}
        </Text>
      ),
      header: "Entities",
      meta: { fixedWidth: 90 } as ColumnMeta,
    }),
    workspaceColumnHelper.accessor("projects", {
      cell: (info) => (
        <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color}>
          {info.getValue()}
        </Text>
      ),
      header: "Projects",
      meta: { fixedWidth: 100 } as ColumnMeta,
    }),
    workspaceColumnHelper.accessor("templates", {
      cell: (info) => (
        <Text fontSize={"xs"} color={STYLES.font.secondaryHeader.color}>
          {info.getValue()}
        </Text>
      ),
      header: "Templates",
      meta: { fixedWidth: 100 } as ColumnMeta,
    }),
  ];

  return (
    <Content isError={!!error} isLoaded={!loading}>
      <PermissionsDialog
        open={permissionsDialogOpen}
        setOpen={setPermissionsDialogOpen}
        user={permissionsDialogUser}
        isGlobal
      />
      <Flex direction={"column"} gap={"2"} p={"1"}>
        <Flex direction={"row"} align={"left"} justify={"space-between"} gap={"1"} w={"100%"}>
          <Flex
            align={"center"}
            gap={"1"}
            p={"1"}
            border={"2px solid"}
            borderColor={"gray.700"}
            bg={"surface.muted"}
            rounded={"md"}
            w={"fit-content"}
          >
            <Icon name={"settings"} size={"sm"} />
            <Heading fontWeight={"semibold"} size={"sm"}>
              Metadatify Administration
            </Heading>
          </Flex>

          <Flex direction={"row"} gap={"2"} align={"center"}>
            <Text fontSize={"xs"} fontWeight={"semibold"} color={"text.subtle"}>
              Last Updated:
            </Text>
            <Text fontSize={"xs"} fontWeight={"semibold"} color={"text.faint"}>
              {dayjs(Date.now()).format("D MMM YYYY[ at ]h:mm A")}
            </Text>
            <Button size={"xs"} rounded={"md"} colorPalette={"blue"} onClick={() => refetch()}>
              Refresh
              <Icon name={"reload"} size={"xs"} />
            </Button>
          </Flex>
        </Flex>

        <Flex
          direction={"column"}
          gap={"2"}
          p={"2"}
          rounded={"md"}
          border={STYLES.border.style}
          borderColor={STYLES.border.color}
          bg={STYLES.surface.card}
        >
          <Text fontSize={"xs"} fontWeight={"bold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
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
              iconColor={STYLES.entity.color.icon}
            />
            <StatCard
              label={"Projects"}
              value={data?.adminMetrics?.projects}
              icon={"project"}
              iconColor={STYLES.project.color.icon}
            />
            <StatCard
              label={"Templates"}
              value={data?.adminMetrics?.templates}
              icon={"template"}
              iconColor={STYLES.template.color.icon}
            />
          </Flex>
        </Flex>

        <Flex
          direction={"column"}
          gap={"1"}
          p={"1"}
          rounded={"md"}
          border={STYLES.border.style}
          borderColor={STYLES.border.color}
          bg={STYLES.surface.card}
        >
          <Flex direction={"row"} align={"center"} gap={"1"} ml={"0.5"} py={"1.5"}>
            <Icon name={"person"} size={"xs"} color={STYLES.font.secondaryHeader.color} />
            <Text fontSize={"xs"} fontWeight={"bold"} color={STYLES.font.secondaryHeader.color}>
              All Users
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

        <Flex
          direction={"column"}
          gap={"2"}
          p={"2"}
          rounded={"md"}
          border={STYLES.border.style}
          borderColor={STYLES.border.color}
          bg={STYLES.surface.card}
        >
          <Flex direction={"row"} align={"center"} gap={"1"} ml={"0.5"} py={"1.5"}>
            <Icon name={"workspace"} size={"xs"} color={STYLES.font.secondaryHeader.color} />
            <Text fontSize={"xs"} fontWeight={"bold"} color={STYLES.font.secondaryHeader.color}>
              All Workspaces
            </Text>
          </Flex>
          <DataTable
            data={data?.adminWorkspaces ?? []}
            columns={workspacesTableColumns}
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
