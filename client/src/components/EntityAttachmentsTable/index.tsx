// React
import React from "react";

// Existing and custom components
import { Button, EmptyState, Flex, IconButton, Tag, Text } from "@chakra-ui/react";
import { Cell, createColumnHelper } from "@tanstack/react-table";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import DialogPreview from "@components/DialogPreview";
import Tooltip from "@components/Tooltip";

// Existing and custom types
import { DataTableAction, EntityAttachmentsTableProps, IGenericItem } from "@types";

// Utility functions and libraries
import _ from "lodash";

// Variables
import { STYLES } from "@variables";

const attachmentColumnHelper = createColumnHelper<IGenericItem>();

const EntityAttachmentsTable = ({
  attachments,
  editing,
  workspace,
  isPublic,
  onDownload,
  onRemove,
  onRemoveMany,
  onUploadClick,
}: EntityAttachmentsTableProps) => {
  const columns = [
    attachmentColumnHelper.accessor("name", {
      cell: (info) => {
        const attachmentId = info.row.original._id;
        const attachmentName = info.row.original.name;

        return (
          <Flex w={"100%"} justify={"space-between"} gap={"1"} align={"center"}>
            <Tooltip content={attachmentName} showArrow>
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {_.truncate(attachmentName, { length: 36 })}
              </Text>
            </Tooltip>
            <Flex gap={"1"} align={"center"}>
              <DialogPreview
                attachment={{
                  _id: attachmentId,
                  name: attachmentName,
                }}
                workspace={workspace}
                isPublic={isPublic}
              />
              {editing && onRemove ? (
                <IconButton
                  aria-label={"Remove attachment"}
                  size={"2xs"}
                  variant={"subtle"}
                  key={`remove-file-${attachmentId}`}
                  colorPalette={"red"}
                  onClick={() => onRemove(attachmentId)}
                >
                  <Icon name={"delete"} size={"xs"} />
                </IconButton>
              ) : (
                <IconButton
                  aria-label={"Download attachment"}
                  size={"2xs"}
                  variant={"subtle"}
                  key={`download-file-${attachmentId}`}
                  colorPalette={"blue"}
                  onClick={() => onDownload(attachmentId, attachmentName)}
                >
                  <Icon name={"download"} size={"xs"} />
                </IconButton>
              )}
            </Flex>
          </Flex>
        );
      },
      header: "Name",
      meta: {
        minWidth: 360,
      },
    }),
    {
      id: "type",
      accessorFn: (row: IGenericItem) => row.name,
      cell: (info: Cell<IGenericItem, string>) => {
        const fileExtension = _.upperCase(_.last(info.row.original.name.split(".")));
        let fileColorScheme = "yellow";
        if (_.isEqual(fileExtension, "PDF")) {
          fileColorScheme = "red";
        } else if (_.isEqual(fileExtension, "DNA")) {
          fileColorScheme = "green";
        } else if (_.isEqual(fileExtension, "PNG") || _.isEqual(fileExtension, "JPEG")) {
          fileColorScheme = "blue";
        }

        return (
          <Tag.Root colorPalette={fileColorScheme}>
            <Tag.Label>{fileExtension}</Tag.Label>
          </Tag.Root>
        );
      },
      header: "File Format",
    },
  ];

  const actions: DataTableAction[] = onRemoveMany
    ? [
        {
          label: "Remove Attachments",
          icon: "delete",
          action(table, rows) {
            const attachmentsToRemove: string[] = [];
            for (const rowIndex of Object.keys(rows)) {
              attachmentsToRemove.push(table.getRow(rowIndex).original._id);
            }
            onRemoveMany(attachmentsToRemove);
          },
        },
      ]
    : [];

  return (
    <Flex
      direction={"column"}
      p={"2"}
      h={"fit-content"}
      gap={"2"}
      rounded={"md"}
      border={STYLES.border.style}
      borderColor={STYLES.border.color}
      bg={"surface.card"}
      grow={"1"}
      basis={{ base: "100%", md: "calc(50% - 4px)" }}
      minW={{ base: "100%", md: "calc(50% - 4px)" }}
    >
      <Flex gap={"1"} direction={"column"}>
        <Flex direction={"row"} justify={"space-between"} align={"center"}>
          <Flex direction={"row"} gap={"0.5"} align={"center"}>
            <Icon name={"attachment"} size={"xs"} color={STYLES.font.secondaryHeader.color} />
            <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
              Attachments ({attachments.length})
            </Text>
          </Flex>
          {onUploadClick && (
            <Button
              variant={"solid"}
              size={"xs"}
              rounded={"md"}
              colorPalette={"green"}
              onClick={onUploadClick}
              disabled={!editing}
            >
              Upload
              <Icon name={"upload"} size={"xs"} />
            </Button>
          )}
        </Flex>

        <Flex w={"100%"} justify={"center"} align={"center"} minH={attachments.length > 0 ? "fit-content" : "120px"}>
          {attachments.length === 0 ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon name={"attachment"} size={"lg"} />
                </EmptyState.Indicator>
                <EmptyState.Description>No Attachments</EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <DataTable
              data={attachments}
              columns={columns}
              visibleColumns={{}}
              selectedRows={{}}
              viewOnly={!editing}
              actions={actions}
              showPagination
              showSelection
            />
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default EntityAttachmentsTable;
