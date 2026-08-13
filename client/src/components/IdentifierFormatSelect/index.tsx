// React
import React, { useEffect, useMemo, useState } from "react";

// Existing and custom components
import { Button, createListCollection, Flex, Portal, Select } from "@chakra-ui/react";
import CreateIdentifierFormatDialog from "@components/CreateIdentifierFormatDialog";
import Icon from "@components/Icon";

// Custom types
import { IdentifierFormatModel, IdentifierFormatSelectProps } from "@types";

// GraphQL imports
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

// Utility functions and libraries
import { groupBy } from "lodash";

// Variables
import { BASE_IDENTIFIER_FORMATS } from "@variables";

/**
 * Select Identifier Format, used to select the format an Entity's secondary identifier
 * must conform to. Base formats are built-in, Custom formats are Workspace-specific and
 * can optionally be created directly from this component.
 */
const IdentifierFormatSelect = (props: IdentifierFormatSelectProps) => {
  // Create Identifier Format dialog disclosure
  const [open, setOpen] = useState(false);

  // GraphQL operations
  const GET_IDENTIFIER_FORMATS = gql`
    query GetIdentifierFormats {
      identifierFormats {
        _id
        name
        fixedLength
        alphanumericOnly
        lettersOnly
        numbersOnly
        allowSpecialCharacters
        uppercaseRequired
      }
    }
  `;
  const { data, refetch } = useQuery<{
    identifierFormats: IdentifierFormatModel[];
  }>(GET_IDENTIFIER_FORMATS, { fetchPolicy: "network-only" });

  // Identifier Format collection for `Select`, grouped into "Base" and "Custom" formats
  const identifierFormats = useMemo(() => {
    const customFormats = (data?.identifierFormats || []).map((format) => ({
      label: format.name,
      value: format._id,
      category: "Custom",
    }));
    return createListCollection({
      items: [...BASE_IDENTIFIER_FORMATS, ...customFormats],
    });
  }, [data]);

  useEffect(() => {
    if (data?.identifierFormats) {
      props.onFormatsChange?.(data.identifierFormats);
    }
  }, [data]);

  /**
   * Handle creation of a new Identifier Format, selecting it once the format list has refreshed
   * @param _id Identifier of the newly created Identifier Format
   */
  const handleFormatCreated = async (_id: string) => {
    await refetch();
    props.setFormat([_id]);
  };

  return (
    <Flex direction={"row"} gap={"2"} w={"100%"}>
      <Select.Root
        value={props.format}
        onValueChange={(event) => props.setFormat(event.value)}
        collection={identifierFormats}
        size={"xs"}
        width={"100%"}
        disabled={props.disabled}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger rounded={"md"}>
            <Select.ValueText placeholder={"Select Identifier Format"} />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {Object.entries(groupBy(identifierFormats.items, (item) => item.category)).map(([category, items]) => (
                <Select.ItemGroup key={category}>
                  <Select.ItemGroupLabel>{category}</Select.ItemGroupLabel>
                  {items.map((format) => (
                    <Select.Item item={format} key={format.value}>
                      {format.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.ItemGroup>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>

      {props.showCreate && (
        <Button size={"xs"} rounded={"md"} colorPalette={"green"} onClick={() => setOpen(true)}>
          Create
          <Icon name={"add"} size={"xs"} />
        </Button>
      )}

      <CreateIdentifierFormatDialog open={open} onClose={() => setOpen(false)} onCreated={handleFormatCreated} />
    </Flex>
  );
};

export default IdentifierFormatSelect;
