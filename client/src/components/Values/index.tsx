// React
import React, { useState, useEffect } from "react";

// Chakra UI components
import {
  Box,
  Button,
  Checkbox,
  CloseButton,
  Dialog,
  Fieldset,
  Field,
  Flex,
  IconButton,
  Input,
  Portal,
  Select,
  Separator,
  Spacer,
  Stack,
  Text,
  createListCollection,
} from "@chakra-ui/react";

import { OptionBase, Select as ReactSelect } from "chakra-react-select";

// Custom components
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import SearchSelect from "@components/SearchSelect";

// Types
import { IValue, IValueType } from "@types";

// Utility functions
import _ from "lodash";
import dayjs from "dayjs";

/**
 * Values component - A spreadsheet-like interface for editing key-value data
 * Features a compact, spreadsheet-like layout with type selection, name, and value columns
 */
const Values = (props: {
  values: IValue[];
  setValues: (values: React.SetStateAction<IValue[]>) => void;
  viewOnly?: boolean;
  requireData?: boolean;
  permittedValues?: string[];
}) => {
  // Counter for unique IDs
  const idCounter = React.useRef(0);

  // State for column widths with minimum constraints
  const [columnWidths, setColumnWidths] = useState({
    type: 120,
    name: 220,
    value: 260,
  });

  // Minimum column widths
  const minColumnWidths = {
    type: 120,
    name: 220,
    value: 260,
  };

  // State for drag resizing
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const dragRef = React.useRef<{ startX: number; startWidth: number } | null>(
    null,
  );

  // State for row selection and manipulation
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Default data for new rows
  const createNewValue = (suffix?: string): IValue => ({
    _id: `v_${Date.now()}_${++idCounter.current}_${suffix || Math.random().toString(36).slice(2, 9)}`,
    name: "",
    type: "text",
    data: "",
  });

  // Pagination calculations
  const totalPages = Math.ceil(props.values.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedValues = props.values.slice(startIndex, endIndex);

  // Reset to first page when rows per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  // Handle column resize start
  const handleResizeStart = (column: string, event: React.MouseEvent) => {
    event.preventDefault();
    setIsResizing(column);
    dragRef.current = {
      startX: event.clientX,
      startWidth: columnWidths[column as keyof typeof columnWidths],
    };
  };

  // Handle column resize during drag
  const handleResizeMove = (event: MouseEvent) => {
    if (!isResizing || !dragRef.current) return;

    const deltaX = event.clientX - dragRef.current.startX;
    const minWidth =
      minColumnWidths[isResizing as keyof typeof minColumnWidths];
    const newWidth = Math.max(minWidth, dragRef.current.startWidth + deltaX);

    setColumnWidths((prev) => ({
      ...prev,
      [isResizing]: newWidth,
    }));
  };

  // Handle column resize end
  const handleResizeEnd = () => {
    setIsResizing(null);
    dragRef.current = null;
  };

  // Add event listeners for drag
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleResizeMove);
        document.removeEventListener("mouseup", handleResizeEnd);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
    return undefined;
  }, [isResizing]);

  // Row manipulation functions
  const addRow = () => {
    const newValue = createNewValue();
    const updatedValues = [...props.values, newValue];
    props.setValues(updatedValues);
  };

  const removeSelectedRows = () => {
    if (selectedRows.size === 0) return;
    const updatedValues = props.values.filter(
      (value) => !selectedRows.has(value._id),
    );
    props.setValues(updatedValues);
    setSelectedRows(new Set());
  };

  /**
   * Propagate updated `Values` rows to the overall React state
   * @param _id Unique identifier of the `IValue`
   * @param name Updated name of the `IValue`
   * @param type Updated `IValueType` of the `IValue`
   * @param data Updated data of the `IValue`
   */
  const onValueChange = (
    _id: string,
    name: string,
    type: IValueType,
    data: string,
  ) => {
    const updatedValues = _.cloneDeep(props.values).map((value) => {
      if (value._id === _id) {
        value.name = name;
        value.type = type;
        value.data = data;
      }
      return value;
    });
    props.setValues(updatedValues);
  };

  return (
    <Box
      w="100%"
      display="flex"
      flexDirection="column"
      css={{ WebkitOverflowScrolling: "touch" }}
    >
      {/* Table */}
      <Box flex="1" minH="0" overflowX="auto" overflowY="auto">
        <Box
          minW="800px"
          w="100%"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          overflow="hidden"
        >
          {/* Header Row */}
          <Flex
            gap={0}
            bg="gray.100"
            borderBottom="1px solid"
            borderColor="gray.200"
            direction="row"
          >
            {/* Drag Handle Column Header - only show in edit mode */}
            {!props.viewOnly && (
              <Box
                w="40px"
                flex="0 0 auto"
                minW="40px"
                px={1}
                py={1}
                textAlign="center"
                bg="gray.100"
                borderRight="1px solid"
                borderColor="gray.200"
                overflow="hidden"
                flexShrink={0}
              />
            )}

            {/* Type Column Header */}
            <Flex
              w={`${columnWidths.type}px`}
              flex="0 0 auto"
              minW={`${columnWidths.type}px`}
              px={1}
              py={1}
              fontSize="xs"
              fontWeight="semibold"
              color="gray.600"
              bg="gray.100"
              borderRight="1px solid"
              borderColor="gray.200"
              position="relative"
              textAlign="center"
              lineHeight="1.2"
              align="center"
              justify="center"
              overflow="hidden"
              flexShrink={0}
            >
              <Text textAlign="center">Type</Text>
              {/* Resize Handle */}
              <Box
                position="absolute"
                right="-1px"
                top="0"
                bottom="0"
                width="3px"
                cursor="col-resize"
                bg="transparent"
                _hover={{ bg: "blue.300" }}
                onMouseDown={(e) => handleResizeStart("type", e)}
                zIndex={10}
              />
            </Flex>

            {/* Name Column Header */}
            <Flex
              w={`${columnWidths.name}px`}
              flex="0 0 auto"
              minW={`${columnWidths.name}px`}
              px={1}
              py={1}
              fontSize="xs"
              fontWeight="semibold"
              color="gray.600"
              bg="gray.100"
              borderRight="1px solid"
              borderColor="gray.200"
              position="relative"
              textAlign="center"
              lineHeight="1.2"
              align="center"
              justify="center"
              overflow="hidden"
              flexShrink={0}
            >
              <Text textAlign="center">Name</Text>
              {/* Resize Handle */}
              <Box
                position="absolute"
                right="-1px"
                top="0"
                bottom="0"
                width="3px"
                cursor="col-resize"
                bg="transparent"
                _hover={{ bg: "blue.300" }}
                onMouseDown={(e) => handleResizeStart("name", e)}
                zIndex={10}
              />
            </Flex>

            {/* Value Column Header */}
            <Flex
              w={`${columnWidths.value}px`}
              flex="0 0 auto"
              minW={`${columnWidths.value}px`}
              px={1}
              py={1}
              fontSize="xs"
              fontWeight="semibold"
              color="gray.600"
              bg="gray.100"
              position="relative"
              textAlign="center"
              lineHeight="1.2"
              align="center"
              justify="center"
              overflow="hidden"
              flexShrink={0}
            >
              <Text textAlign="center">Value</Text>
              {/* Resize Handle */}
              <Box
                position="absolute"
                right="-1px"
                top="0"
                bottom="0"
                width="3px"
                cursor="col-resize"
                bg="transparent"
                _hover={{ bg: "blue.300" }}
                onMouseDown={(e) => handleResizeStart("value", e)}
                zIndex={10}
              />
            </Flex>
          </Flex>

          {/* Data Rows */}
          <Box overflowY="auto" overflowX="hidden">
            {paginatedValues.map((value, index) => (
              <ValueRow
                key={value._id}
                value={value}
                onValueChange={onValueChange}
                columnWidths={columnWidths}
                isSelected={selectedRows.has(value._id)}
                hideBorder={index >= paginatedValues.length - 1}
                viewOnly={props.viewOnly}
              />
            ))}
          </Box>

          {/* Add or Delete Selected Rows Button */}
          {!props.viewOnly && (
            <Flex
              borderTop="1px solid"
              borderColor="gray.200"
              p={0}
              justify="center"
              align="center"
              bg="gray.100"
            >
              {selectedRows.size > 0 ? (
                <Button
                  size="xs"
                  variant="ghost"
                  colorPalette="red"
                  onClick={removeSelectedRows}
                  aria-label="Delete selected rows"
                  w="100%"
                  h={"fit-content"}
                  p={"0.5"}
                >
                  <Icon name="delete" size="xs" />
                  <Text ml={1} fontSize="xs" fontWeight="semibold">
                    Delete {selectedRows.size === 1 ? "Row" : "Rows"} (
                    {selectedRows.size})
                  </Text>
                </Button>
              ) : (
                <Button
                  id="addValueRowButton"
                  size="xs"
                  variant="ghost"
                  colorPalette="green"
                  onClick={addRow}
                  aria-label="Add row"
                  w="100%"
                  h={"fit-content"}
                  p={"0.5"}
                >
                  <Icon name="add" size="xs" />
                  <Text ml={1} fontSize="xs" fontWeight="semibold">
                    Add Row
                  </Text>
                </Button>
              )}
            </Flex>
          )}
        </Box>
      </Box>

      {/* Pagination Toolbar */}
      <Flex
        gap={1}
        align="center"
        wrap="wrap"
        justify={{ base: "space-between", sm: "space-between" }}
        w="100%"
        mt={1}
        flexShrink={0}
      >
        <Flex direction="row" gap={1} align="center" wrap="wrap">
          <IconButton
            variant="outline"
            size="xs"
            rounded="md"
            aria-label="first page"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage <= 1}
          >
            <Icon name="c_double_left" />
          </IconButton>
          <IconButton
            variant="outline"
            size="xs"
            rounded="md"
            aria-label="previous page"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            <Icon name="c_left" />
          </IconButton>
          {totalPages > 0 && (
            <Flex gap={1}>
              <Text fontSize="xs" fontWeight="semibold">
                {currentPage}
              </Text>
              <Text fontSize="xs"> of </Text>
              <Text fontSize="xs" fontWeight="semibold">
                {totalPages}
              </Text>
            </Flex>
          )}
          <IconButton
            variant="outline"
            size="xs"
            rounded="md"
            aria-label="next page"
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage >= totalPages}
          >
            <Icon name="c_right" />
          </IconButton>
          <IconButton
            variant="outline"
            size="xs"
            rounded="md"
            aria-label="last page"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
          >
            <Icon name="c_double_right" />
          </IconButton>
        </Flex>

        <Flex direction="row" gap={1} align="center" wrap="wrap">
          <Text fontSize="xs" display={{ base: "none", sm: "block" }}>
            Show:
          </Text>
          <Fieldset.Root w="fit-content">
            <Fieldset.Content>
              <Field.Root>
                <Select.Root
                  size="xs"
                  w="80px"
                  collection={createListCollection({
                    items: [
                      { label: "5", value: "5" },
                      { label: "10", value: "10" },
                      { label: "20", value: "20" },
                      { label: "50", value: "50" },
                      { label: "100", value: "100" },
                    ],
                  })}
                  value={[rowsPerPage.toString()]}
                  onValueChange={(details) =>
                    setRowsPerPage(parseInt(details.value[0]))
                  }
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger rounded="md">
                      <Select.ValueText placeholder="Page Size" />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {[
                          { label: "5", value: "5" },
                          { label: "10", value: "10" },
                          { label: "20", value: "20" },
                          { label: "50", value: "50" },
                          { label: "100", value: "100" },
                        ].map((count) => (
                          <Select.Item item={count} key={count.value}>
                            {count.label}
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Field.Root>
            </Fieldset.Content>
          </Fieldset.Root>
        </Flex>
      </Flex>
    </Box>
  );
};

const ValueRow = (props: {
  key: string;
  value: IValue;
  onValueChange: (
    _id: string,
    name: string,
    type: IValueType,
    data: string,
  ) => void;
  columnWidths: { type: number; name: number; value: number };
  isSelected: boolean;
  hideBorder?: boolean;
  viewOnly?: boolean;
}) => {
  interface ValueTypeOption extends OptionBase {
    label: string;
    value: IValueType;
  }
  const valueTypeOptions: ValueTypeOption[] = [
    { label: "Number", value: "number" },
    { label: "Text", value: "text" },
    { label: "URL", value: "url" },
    { label: "Date", value: "date" },
    { label: "Entity", value: "entity" },
    { label: "Select", value: "select" },
  ];

  interface SelectOption extends OptionBase {
    label: string;
    value: string;
  }

  // Get the initial `ValueTypeOption` based on the `IValue` type
  const initialValueType = valueTypeOptions.filter(
    (value) => value.value === props.value.type,
  )[0];

  // React state for value display
  const [valueName, setValueName] = useState(props.value.name);
  const [valueType, setValueType] = useState<IValueType>(props.value.type);
  const [valueTypeOption, setValueTypeOption] =
    useState<ValueTypeOption>(initialValueType);
  const [valueData, setValueData] = useState(props.value.data);
  const [valueChecked, setValueChecked] = useState(false);

  // React state for `Select` value type display
  let initialSelectOption;
  let initialSelectOptions = [];
  if (initialValueType.value === "select") {
    const initialSelectData = JSON.parse(valueData);
    initialSelectOption = {
      label: initialSelectData.selected,
      value: initialSelectData.selected,
    };
    initialSelectOptions = initialSelectData.options;
  }
  const [selectModalOpen, setSelectModalOpen] = useState(false); // Modal state
  const [selectOptions, setSelectOptions] =
    useState<SelectOption[]>(initialSelectOptions); // Collection of `Select` options
  const [selectOption, setSelectOption] = useState<SelectOption | undefined>(
    initialSelectOption,
  ); // Selected option
  const [selectOptionValue, setSelectOptionValue] = useState(""); // Current `Select` option value being created

  useEffect(() => {
    // Propagate changes to overall `Value` state
    props.onValueChange(props.value._id, valueName, valueType, valueData);
  }, [valueName, valueType, valueData]);

  /**
   *
   * @param valueType The new `IValueType` that has been selected
   * @returns
   */
  const generateDefaultData = (valueType: IValueType): string => {
    switch (valueType) {
      case "number":
        return "0";
      case "text":
        return "";
      case "url":
        return "https://";
      case "date":
        return dayjs(Date.now()).toISOString();
      case "entity":
        return JSON.stringify({ _id: "", name: "" });
      case "select":
        return JSON.stringify({
          selected: "",
          options: [],
        });
    }
  };

  // Handle adding a new option
  const addOption = () => {
    if (!isSelectOption(selectOptionValue)) {
      // Add to `selectOptions` and reset value
      setSelectOptions([
        ...selectOptions,
        { label: selectOptionValue, value: selectOptionValue },
      ]);
      setSelectOptionValue("");
    }
  };

  /**
   * Utility function to check if an incoming option for `Select` type already exists
   * @param {string} option Incoming option for `Select` type
   * @return {boolean}
   */
  const isSelectOption = (option: string): boolean => {
    return selectOptions.map((option) => option.value).includes(option);
  };

  // Handle removing an option
  const removeOption = (toRemove: SelectOption) => {
    setSelectOptions(
      selectOptions.filter((option) => option.value !== toRemove.value),
    );
  };

  // Handle confirming select options
  const confirmSelectOptions = () => {
    setValueData(
      JSON.stringify({
        selected: "",
        options: selectOptions,
      }),
    );
    setSelectOptionValue("");
    setSelectModalOpen(false);
  };

  // Handle canceling select options
  const cancelSelectOptions = () => {
    setSelectOptionValue("");
    setSelectModalOpen(false);
  };

  // const toggleRowSelection = (valueId: string) => {
  //   console.info("valueId:", valueId);
  //   // const newSelection = new Set(selectedRows);
  //   // if (newSelection.has(valueId)) {
  //   //   newSelection.delete(valueId);
  //   // } else {
  //   //   newSelection.add(valueId);
  //   // }
  //   // setSelectedRows(newSelection);
  // };

  // Handle opening select options modal
  const openSelectModal = () => {
    setSelectOptions([]);
    setSelectOptionValue("");
    setSelectModalOpen(true);
  };

  // Render data input based on type
  const renderDataInput = (valueType: IValueType) => {
    if (valueType === "number") {
      return (
        <Input
          value={valueData}
          onChange={(e) => setValueData(e.target.value)}
          size="xs"
          h={props.viewOnly ? "34px" : "100%"}
          borderRadius="none"
          fontSize="xs"
          type="number"
          readOnly={props.viewOnly}
          placeholder="Enter number"
          border="1px solid transparent"
          bg="transparent"
          cursor={props.viewOnly ? "default" : "text"}
          onClick={props.viewOnly ? (e) => e.preventDefault() : undefined}
          _focus={{
            bg: "white",
            border: "1px solid",
            borderColor: "blue.300",
          }}
          _hover={{
            border: "1px solid",
            borderColor: "blue.200",
            boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)",
          }}
        />
      );
    } else if (valueType === "text") {
      return (
        <Input
          value={valueData}
          onChange={(e) => setValueData(e.target.value)}
          size="xs"
          h={props.viewOnly ? "34px" : "100%"}
          borderRadius="none"
          fontSize="xs"
          readOnly={props.viewOnly}
          placeholder="Enter text"
          border="1px solid transparent"
          bg="transparent"
          cursor={props.viewOnly ? "default" : "text"}
          onClick={props.viewOnly ? (e) => e.preventDefault() : undefined}
          _focus={{
            bg: "white",
            border: "1px solid",
            borderColor: "blue.300",
          }}
          _hover={{
            border: "1px solid",
            borderColor: "blue.200",
            boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)",
          }}
        />
      );
    } else if (valueType === "url") {
      return (
        <Input
          value={valueData}
          onChange={(e) => setValueData(e.target.value)}
          size="xs"
          h={props.viewOnly ? "34px" : "100%"}
          borderRadius="none"
          fontSize="xs"
          readOnly={props.viewOnly}
          placeholder="Enter URL"
          border="1px solid transparent"
          bg="transparent"
          cursor={props.viewOnly ? "default" : "text"}
          onClick={props.viewOnly ? (e) => e.preventDefault() : undefined}
          _focus={{
            bg: "white",
            border: "1px solid",
            borderColor: "blue.300",
          }}
          _hover={{
            border: "1px solid",
            borderColor: "blue.200",
            boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)",
          }}
        />
      );
    } else if (valueType === "date") {
      return (
        <Input
          value={valueData}
          onChange={(e) => setValueData(e.target.value)}
          size="xs"
          h={props.viewOnly ? "34px" : "100%"}
          borderRadius="none"
          fontSize="xs"
          type="date"
          readOnly={props.viewOnly}
          border="1px solid transparent"
          bg="transparent"
          cursor={props.viewOnly ? "default" : "text"}
          onClick={props.viewOnly ? (e) => e.preventDefault() : undefined}
          _focus={{
            bg: "white",
            border: "1px solid",
            borderColor: "blue.300",
          }}
          _hover={{
            border: "1px solid",
            borderColor: "blue.200",
            boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)",
          }}
        />
      );
    } else if (valueType === "select") {
      // Check if select has options configured
      if (selectOptions.length > 0) {
        // Show dropdown with configured options
        return (
          <ReactSelect
            options={selectOptions}
            size={"sm"}
            placeholder={"Select Option"}
            disabled={props.viewOnly}
            value={selectOption}
            onChange={(event) => {
              if (event) {
                // Update displayed selection
                setSelectOption(event);

                // Update underlying data
                setValueData(
                  JSON.stringify({
                    selected: event.value,
                    options: selectOptions,
                  }),
                );
              }
            }}
            menuPortalTarget={document.body}
            menuPosition={"fixed"}
            styles={{
              menuPortal: (base) => ({
                ...base,
                zIndex: 15000,
                pointerEvents: "auto",
              }),
              menu: (base) => ({
                ...base,
                zIndex: 15000,
                pointerEvents: "auto",
              }),
              menuList: (base) => ({
                ...base,
                pointerEvents: "auto",
              }),
              option: (base) => ({
                ...base,
                pointerEvents: "auto",
                fontSize: "sm",
              }),
              control: (base) => ({
                ...base,
                minHeight: "32px",
                border: "1px solid transparent",
              }),
            }}
            closeMenuOnScroll={false}
          />
        );
      } else {
        // Show "Setup Options" button
        return (
          <Flex
            w="100%"
            h={"34px"}
            p={"0"}
            align="center"
            justify="center"
            border="1px solid transparent"
            _focus={{
              bg: "white",
              borderColor: "blue.300",
            }}
            _hover={{
              border: "1px solid",
              borderColor: "blue.200",
              boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)",
            }}
            cursor={props.viewOnly ? "default" : "pointer"}
            onClick={() => {
              if (!props.viewOnly) {
                openSelectModal();
              }
            }}
          >
            <Text fontSize="xs" fontWeight="semibold" color="blue.600">
              Add Options
            </Text>
          </Flex>
        );
      }
    } else if (valueType === "entity") {
      if (!props.viewOnly) {
        return (
          <Flex
            w="100%"
            h={props.viewOnly ? "34px" : "100%"}
            p={"0"}
            align="center"
            justify="center"
            border="1px solid transparent"
            _focus={{
              bg: "white",
              borderColor: "blue.300",
            }}
            _hover={{
              border: "1px solid",
              borderColor: "blue.200",
              boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)",
            }}
          >
            <SearchSelect
              placeholder={"Select Entity"}
              resultType={"entity"}
              value={JSON.parse(valueData) || { _id: "", name: "" }}
              onChange={(entity) => setValueData(JSON.stringify(entity))}
              disabled={props.viewOnly}
              isEmbedded
            />
          </Flex>
        );
      } else {
        return (
          <Flex
            w="100%"
            h={props.viewOnly ? "34px" : "100%"}
            justify="center"
            pt={"0.5"}
            px={"2"}
            border="1px solid transparent"
            _focus={{
              bg: "white",
              borderColor: "blue.300",
            }}
            _hover={{
              border: "1px solid",
              borderColor: "blue.200",
              boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)",
            }}
          >
            <Linky
              type="entities"
              id={JSON.parse(valueData)._id || ""}
              size="xs"
            />
          </Flex>
        );
      }
    } else {
      return (
        <Input
          value={valueData}
          onChange={(e) => setValueData(e.target.value)}
          size="xs"
          h={props.viewOnly ? "34px" : "100%"}
          px={1}
          py={0.5}
          fontSize="xs"
          readOnly={props.viewOnly}
          placeholder="Enter value"
          border="1px solid transparent"
          bg="transparent"
          cursor={props.viewOnly ? "default" : "text"}
          onClick={props.viewOnly ? (e) => e.preventDefault() : undefined}
          _focus={{
            bg: "white",
            border: "1px solid",
            borderColor: "blue.300",
          }}
          _hover={{
            border: "1px solid",
            borderColor: "blue.200",
            boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)",
          }}
        />
      );
    }
  };

  return (
    <Flex
      gap={0}
      borderBottom={props.hideBorder ? "none" : "1px solid"}
      borderColor="gray.200"
      _hover={{ bg: "gray.25" }}
      overflow="hidden"
      bg={props.isSelected ? "blue.50" : "transparent"}
    >
      {/* Drag Handle Column - only show in edit mode */}
      {!props.viewOnly && (
        <Box
          w="40px"
          px={1}
          py={0.5}
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRight="1px solid"
          borderColor="gray.200"
          bg={props.isSelected ? "blue.100" : "transparent"}
          _hover={{ bg: props.isSelected ? "blue.200" : "gray.100" }}
          cursor={props.viewOnly ? "default" : "pointer"}
        >
          <Checkbox.Root
            checked={valueChecked}
            onChange={() => setValueChecked(!valueChecked)}
            size="xs"
            colorPalette="blue"
            disabled={props.viewOnly}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
          </Checkbox.Root>
        </Box>
      )}
      {/* Type Column */}
      <Box
        w={`${props.columnWidths.type}px`}
        display={"flex"}
        alignItems={"center"}
        justifyContent={"center"}
        borderRight={"1px solid"}
        borderColor={"gray.200"}
      >
        <ReactSelect
          options={valueTypeOptions}
          size={"sm"}
          placeholder={"Type"}
          disabled={props.viewOnly}
          value={valueTypeOption}
          onChange={(event) => {
            if (event) {
              // Update React state
              setValueType(event.value);
              setValueTypeOption({ label: event.label, value: event.value });

              // Handle the updated data component
              setValueData(generateDefaultData(event.value));
            }
          }}
          menuPortalTarget={document.body}
          menuPosition={"fixed"}
          styles={{
            menuPortal: (base) => ({
              ...base,
              zIndex: 15000,
              pointerEvents: "auto",
            }),
            menu: (base) => ({
              ...base,
              zIndex: 15000,
              pointerEvents: "auto",
            }),
            menuList: (base) => ({
              ...base,
              pointerEvents: "auto",
            }),
            option: (base) => ({
              ...base,
              pointerEvents: "auto",
              fontSize: "sm",
            }),
            control: (base) => ({
              ...base,
              minHeight: "32px",
              border: "1px solid transparent",
            }),
          }}
          closeMenuOnScroll={false}
        />
      </Box>

      {/* Name Column */}
      <Box
        w={`${props.columnWidths.name}px`}
        p={"0"}
        m={"0"}
        borderRight="1px solid"
        borderColor="gray.200"
      >
        <Input
          value={valueName}
          onChange={(e) => setValueName(e.target.value)}
          size="xs"
          px={1}
          py={0}
          h="100%"
          fontSize="xs"
          readOnly={props.viewOnly}
          placeholder="Enter name"
          border="1px solid transparent"
          borderRadius="none"
          bg="transparent"
          cursor={props.viewOnly ? "default" : "text"}
          onClick={props.viewOnly ? (e) => e.preventDefault() : undefined}
          _focus={{
            bg: "white",
            border: "1px solid",
            borderColor: "blue.300",
          }}
          _hover={{
            border: "1px solid",
            borderColor: "blue.200",
            boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)",
          }}
        />
      </Box>

      {/* Value Column */}
      <Flex
        w={`${props.columnWidths.value}px`}
        flex="1"
        p={"0"}
        overflow="visible"
        justify="space-between"
        align="center"
      >
        {renderDataInput(valueType)}
        {props.viewOnly && valueType !== "entity" && (
          <IconButton
            aria-label="Copy value"
            size="2xs"
            mx={"1"}
            variant="outline"
            colorPalette="gray"
            onClick={() =>
              navigator.clipboard.writeText(valueData.toString() || "")
            }
          >
            <Icon name="copy" size="xs" />
          </IconButton>
        )}
      </Flex>

      {/* Select Options Modal */}
      <Dialog.Root
        open={selectModalOpen}
        size="sm"
        placement="center"
        closeOnEscape
        closeOnInteractOutside
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header p={"0"} roundedTop="md" bg="blue.300">
              <Flex direction="row" align="center" gap="1" p={"2"}>
                <Icon name="v_select" />
                <Text fontSize="xs" fontWeight="semibold">
                  Setup Options
                </Text>
              </Flex>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size="2xs"
                  top={"6px"}
                  onClick={cancelSelectOptions}
                />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body p="1" gap="1" pb="1">
              <Flex direction="column" gap="1">
                <Flex direction="row" gap="1">
                  <Input
                    size="xs"
                    rounded="md"
                    placeholder="Enter option value"
                    value={selectOptionValue}
                    onChange={(e) => setSelectOptionValue(e.target.value)}
                    onKeyUp={(e) => {
                      if (e.key === "Enter") {
                        addOption();
                      }
                    }}
                  />
                  <Button
                    colorPalette="green"
                    size="xs"
                    rounded="md"
                    onClick={addOption}
                  >
                    Add
                    <Icon name="add" />
                  </Button>
                </Flex>
                <Box>
                  <Stack
                    gap="1"
                    separator={<Separator />}
                    pb="1"
                    maxH="200px"
                    overflowY={"auto"}
                  >
                    {selectOptions.length > 0 ? (
                      selectOptions.map((option, index) => (
                        <Flex
                          key={option.value}
                          direction="row"
                          cursor={props.viewOnly ? "default" : "text"}
                          onClick={
                            props.viewOnly
                              ? (e) => e.preventDefault()
                              : undefined
                          }
                          justify="space-between"
                          align="center"
                        >
                          <Flex gap="1">
                            <Text
                              fontWeight="semibold"
                              fontSize="xs"
                              ml={"0.5"}
                            >
                              Value {index + 1}:
                            </Text>
                            <Text fontSize="xs">{option.value}</Text>
                          </Flex>
                          <IconButton
                            aria-label={`remove_${index}`}
                            size="2xs"
                            colorPalette="red"
                            onClick={() => removeOption(option)}
                          >
                            <Icon name="delete" />
                          </IconButton>
                        </Flex>
                      ))
                    ) : (
                      <Flex
                        cursor={props.viewOnly ? "default" : "text"}
                        onClick={
                          props.viewOnly ? (e) => e.preventDefault() : undefined
                        }
                        align="center"
                        justify="center"
                        minH="60px"
                        rounded="md"
                        border="1px"
                        borderColor="gray.300"
                      >
                        <Text
                          fontSize="xs"
                          fontWeight="semibold"
                          color="gray.400"
                        >
                          No values added.
                        </Text>
                      </Flex>
                    )}
                  </Stack>
                </Box>
              </Flex>
            </Dialog.Body>
            <Dialog.Footer p="1" bg="gray.100" roundedBottom="md">
              <Button
                size="xs"
                rounded="md"
                colorPalette="red"
                onClick={cancelSelectOptions}
              >
                Cancel
                <Icon name="cross" />
              </Button>
              <Spacer />
              <Button
                size="xs"
                rounded="md"
                colorPalette="green"
                onClick={confirmSelectOptions}
                disabled={selectOptions.length === 0}
              >
                Confirm
                <Icon name="check" />
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Flex>
  );
};

export default Values;
