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

// Custom components
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import SearchSelect from "@components/SearchSelect";

// Types
import { IValue, IValueType, GenericValueType } from "@types";

// Utility functions
import _ from "lodash";
import dayjs from "dayjs";

/**
 * ValuesRemix component - A spreadsheet-like interface for editing key-value data
 * Features a compact, spreadsheet-like layout with type selection, name, and value columns
 */
const ValuesRemix = (props: {
  viewOnly?: boolean;
  values: IValue<GenericValueType>[];
  setValues: (value: React.SetStateAction<IValue<GenericValueType>[]>) => void;
  requireData?: boolean;
  permittedValues?: string[];
}) => {
  // Counter for unique IDs
  const idCounter = React.useRef(0);

  // State for select options modal
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [editingSelectId, setEditingSelectId] = useState<string | null>(null);
  const [selectOptions, setSelectOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");

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
  const createNewValue = (suffix?: string): IValue<GenericValueType> => ({
    _id: `v_text_${Date.now()}_${++idCounter.current}_${suffix || Math.random().toString(36).substr(2, 9)}`,
    name: "",
    type: "text",
    data: "",
  });

  // Initialize with two rows if empty, otherwise use provided values
  const [localValues, setLocalValues] = useState<IValue<GenericValueType>[]>(
    () => {
      if (props.values.length === 0) {
        return [createNewValue("row1"), createNewValue("row2")];
      }
      return props.values;
    },
  );

  // Update local values when props.values changes
  useEffect(() => {
    if (props.values.length > 0) {
      setLocalValues(props.values);
    }
  }, [props.values]);

  // Pagination calculations
  const totalPages = Math.ceil(localValues.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedValues = localValues.slice(startIndex, endIndex);

  // Reset to first page when rows per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  // Handle type change
  const handleTypeChange = (valueId: string, newType: IValueType) => {
    const updatedValues = localValues.map((value) => {
      if (value._id === valueId) {
        let newData: GenericValueType;
        switch (newType) {
          case "number":
            newData = 0;
            break;
          case "text":
            newData = "";
            break;
          case "url":
            newData = "";
            break;
          case "date":
            newData = dayjs(Date.now()).toISOString();
            break;
          case "entity":
            newData = { _id: "", name: "" };
            break;
          case "select":
            newData = {
              selected: "",
              options: [],
            };
            break;
          default:
            newData = "";
        }
        return { ...value, type: newType, data: newData };
      }
      return value;
    });
    setLocalValues(updatedValues);
    props.setValues(updatedValues);
  };

  // Handle name change
  const handleNameChange = (valueId: string, newName: string) => {
    const updatedValues = localValues.map((value) => {
      if (value._id === valueId) {
        return { ...value, name: newName };
      }
      return value;
    });
    setLocalValues(updatedValues);
    props.setValues(updatedValues);
  };

  // Handle data change
  const handleDataChange = (valueId: string, newData: GenericValueType) => {
    const updatedValues = localValues.map((value) => {
      if (value._id === valueId) {
        return { ...value, data: newData };
      }
      return value;
    });
    setLocalValues(updatedValues);
    props.setValues(updatedValues);
  };

  // Handle opening select options modal
  const openSelectModal = (valueId: string) => {
    setEditingSelectId(valueId);
    setSelectOptions([]);
    setNewOption("");
    setSelectModalOpen(true);
  };

  // Handle adding a new option
  const addOption = () => {
    if (newOption.trim() && !selectOptions.includes(newOption.trim())) {
      setSelectOptions([...selectOptions, newOption.trim()]);
      setNewOption("");
    }
  };

  // Handle removing an option
  const removeOption = (optionToRemove: string) => {
    setSelectOptions(
      selectOptions.filter((option) => option !== optionToRemove),
    );
  };

  // Handle confirming select options
  const confirmSelectOptions = () => {
    if (editingSelectId && selectOptions.length > 0) {
      const updatedValues = localValues.map((value) => {
        if (value._id === editingSelectId) {
          return {
            ...value,
            data: {
              selected: "",
              options: selectOptions.map((opt) => ({
                _id: `option_${Date.now()}_${opt}`,
                name: opt,
              })),
            },
          };
        }
        return value;
      });
      setLocalValues(updatedValues);
      props.setValues(updatedValues);
    }
    setSelectModalOpen(false);
    setEditingSelectId(null);
    setSelectOptions([]);
    setNewOption("");
  };

  // Handle canceling select options
  const cancelSelectOptions = () => {
    setSelectModalOpen(false);
    setEditingSelectId(null);
    setSelectOptions([]);
    setNewOption("");
  };

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
  React.useEffect(() => {
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
    const updatedValues = [...localValues, newValue];
    setLocalValues(updatedValues);
    props.setValues(updatedValues);
  };

  const removeSelectedRows = () => {
    if (selectedRows.size === 0) return;
    const updatedValues = localValues.filter(
      (value) => !selectedRows.has(value._id),
    );
    setLocalValues(updatedValues);
    props.setValues(updatedValues);
    setSelectedRows(new Set());
  };

  const moveRowUp = () => {
    if (selectedRows.size !== 1) return;
    const selectedId = Array.from(selectedRows)[0];
    const selectedIndex = localValues.findIndex((v) => v._id === selectedId);
    if (selectedIndex <= 0) return;

    const updatedValues = [...localValues];
    [updatedValues[selectedIndex - 1], updatedValues[selectedIndex]] = [
      updatedValues[selectedIndex],
      updatedValues[selectedIndex - 1],
    ];

    setLocalValues(updatedValues);
    props.setValues(updatedValues);
  };

  const moveRowDown = () => {
    if (selectedRows.size !== 1) return;
    const selectedId = Array.from(selectedRows)[0];
    const selectedIndex = localValues.findIndex((v) => v._id === selectedId);
    if (selectedIndex >= localValues.length - 1) return;

    const updatedValues = [...localValues];
    [updatedValues[selectedIndex], updatedValues[selectedIndex + 1]] = [
      updatedValues[selectedIndex + 1],
      updatedValues[selectedIndex],
    ];

    setLocalValues(updatedValues);
    props.setValues(updatedValues);
  };

  const toggleRowSelection = (valueId: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(valueId)) {
      newSelection.delete(valueId);
    } else {
      newSelection.add(valueId);
    }
    setSelectedRows(newSelection);
  };

  // Get icon for value type
  const getTypeIcon = (type: IValueType) => {
    switch (type) {
      case "number":
        return <Icon size="sm" name="v_number" color="green.300" />;
      case "text":
        return <Icon size="sm" name="v_text" color="blue.300" />;
      case "url":
        return <Icon size="sm" name="v_url" color="yellow.300" />;
      case "date":
        return <Icon size="sm" name="v_date" color="orange.300" />;
      case "select":
        return <Icon size="sm" name="v_select" color="cyan.300" />;
      case "entity":
      default:
        return <Icon size="sm" name="entity" color="purple.300" />;
    }
  };

  // Helper function to check if select has configured options
  const hasSelectOptions = (data: unknown): boolean => {
    return !!(
      data &&
      typeof data === "object" &&
      "options" in data &&
      Array.isArray((data as { options: unknown[] }).options) &&
      (data as { options: unknown[] }).options.length > 0
    );
  };

  // Render data input based on type
  const renderDataInput = (value: IValue<GenericValueType>) => {
    switch (value.type) {
      case "number":
        return (
          <Input
            value={value.data?.toString() || ""}
            onChange={(e) =>
              handleDataChange(value._id, parseFloat(e.target.value) || 0)
            }
            size="sm"
            px={1}
            py={0.5}
            fontSize="sm"
            type="number"
            readOnly={props.viewOnly}
            placeholder="Enter number"
            border="none"
            bg="transparent"
            cursor={props.viewOnly ? "default" : "text"}
            onClick={props.viewOnly ? (e) => e.preventDefault() : undefined}
            _focus={{
              bg: "white",
              border: "1px solid",
              borderColor: "blue.300",
            }}
            _hover={
              !props.viewOnly
                ? {
                    border: "1px solid",
                    borderColor: "blue.200",
                    boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)",
                  }
                : {}
            }
          />
        );

      case "text":
        return (
          <Input
            value={value.data?.toString() || ""}
            onChange={(e) => handleDataChange(value._id, e.target.value)}
            size="sm"
            px={1}
            py={0.5}
            fontSize="sm"
            readOnly={props.viewOnly}
            placeholder="Enter text"
            border="none"
            bg="transparent"
            cursor={props.viewOnly ? "default" : "text"}
            onClick={props.viewOnly ? (e) => e.preventDefault() : undefined}
            _focus={{
              bg: "white",
              border: "1px solid",
              borderColor: "blue.300",
            }}
            _hover={
              !props.viewOnly
                ? {
                    border: "1px solid",
                    borderColor: "blue.200",
                    boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)",
                  }
                : {}
            }
          />
        );

      case "url":
        return (
          <Input
            value={value.data?.toString() || ""}
            onChange={(e) => handleDataChange(value._id, e.target.value)}
            size="sm"
            px={1}
            py={0.5}
            fontSize="sm"
            readOnly={props.viewOnly}
            placeholder="Enter URL"
            border="none"
            bg="transparent"
            cursor={props.viewOnly ? "default" : "text"}
            onClick={props.viewOnly ? (e) => e.preventDefault() : undefined}
            _focus={{
              bg: "white",
              border: "1px solid",
              borderColor: "blue.300",
            }}
            _hover={
              !props.viewOnly
                ? {
                    border: "1px solid",
                    borderColor: "blue.200",
                    boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)",
                  }
                : {}
            }
          />
        );

      case "date":
        return (
          <Input
            value={value.data?.toString() || ""}
            onChange={(e) => handleDataChange(value._id, e.target.value)}
            size="sm"
            px={1}
            py={0.5}
            fontSize="sm"
            type="date"
            readOnly={props.viewOnly}
            border="none"
            bg="transparent"
            cursor={props.viewOnly ? "default" : "text"}
            onClick={props.viewOnly ? (e) => e.preventDefault() : undefined}
            _focus={{
              bg: "white",
              border: "1px solid",
              borderColor: "blue.300",
            }}
            _hover={
              !props.viewOnly
                ? {
                    border: "1px solid",
                    borderColor: "blue.200",
                    boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)",
                  }
                : {}
            }
          />
        );

      case "select":
        // Check if select has options configured
        if (hasSelectOptions(value.data)) {
          // Show dropdown with configured options
          return (
            <Select.Root
              size="sm"
              value={value.data.selected ? [value.data.selected._id] : []}
              collection={createListCollection({
                items: (
                  value.data as {
                    options: Array<{ _id: string; name: string }>;
                  }
                ).options.map((opt) => ({
                  value: opt._id,
                  label: opt.name,
                })),
              })}
              onValueChange={(details) => {
                const selectedOption = (
                  value.data as {
                    options: Array<{ _id: string; name: string }>;
                  }
                ).options.find((opt) => opt._id === details.value[0]);
                handleDataChange(value._id, {
                  ...value.data,
                  selected: selectedOption || "",
                });
              }}
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger minW="100px" h="20px">
                  <Select.ValueText placeholder="Select Value">
                    {value.data.selected?.name || "Select Value"}
                  </Select.ValueText>
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content zIndex={9999}>
                    {(
                      value.data as {
                        options: Array<{ _id: string; name: string }>;
                      }
                    ).options.map((option) => (
                      <Select.Item
                        item={{ value: option._id, label: option.name }}
                        key={option._id}
                      >
                        {option.name}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          );
        } else {
          // Show "Setup Values" button
          return (
            <Flex w="100%" h="100%" align="center" justify="center">
              <Button
                size="sm"
                variant="outline"
                colorPalette="blue"
                onClick={() => openSelectModal(value._id)}
                disabled={props.viewOnly}
                px={2}
                py={0.5}
                fontSize="xs"
                h="20px"
              >
                Setup Values
              </Button>
            </Flex>
          );
        }

      case "entity":
        if (!props.viewOnly) {
          return (
            <SearchSelect
              placeholder="Select Entity"
              resultType="entity"
              value={value.data || { _id: "", name: "" }}
              onChange={(entity) => handleDataChange(value._id, entity)}
              disabled={props.viewOnly}
            />
          );
        } else {
          return (
            <Flex px={1}>
              <Linky type="entities" id={value.data?._id || ""} size="sm" />
            </Flex>
          );
        }

      default:
        return (
          <Input
            value={value.data?.toString() || ""}
            onChange={(e) => handleDataChange(value._id, e.target.value)}
            size="sm"
            px={1}
            py={0.5}
            fontSize="sm"
            readOnly={props.viewOnly}
            placeholder="Enter value"
            border="none"
            bg="transparent"
            cursor={props.viewOnly ? "default" : "text"}
            onClick={props.viewOnly ? (e) => e.preventDefault() : undefined}
            _focus={{
              bg: "white",
              border: "1px solid",
              borderColor: "blue.300",
            }}
            _hover={
              !props.viewOnly
                ? {
                    border: "1px solid",
                    borderColor: "blue.200",
                    boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)",
                  }
                : {}
            }
          />
        );
    }
  };

  return (
    <Box w="100%">
      {/* Table */}
      <Box
        minW="800px"
        w="100%"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        overflow="visible"
      >
        {/* Header Row */}
        <Flex
          gap={0}
          bg="gray.50"
          borderBottom="1px solid"
          borderColor="gray.200"
          direction="row"
        >
          {/* Drag Handle Column Header - only show in edit mode */}
          {!props.viewOnly && (
            <Box
              w="30px"
              px={1}
              py={1}
              textAlign="center"
              bg="gray.50"
              borderRight="1px solid"
              borderColor="gray.200"
            />
          )}

          {/* Type Column Header */}
          <Box
            w={`${columnWidths.type}px`}
            px={1}
            py={1}
            fontSize="xs"
            fontWeight="semibold"
            color="gray.600"
            borderRight="1px solid"
            borderColor="gray.200"
            position="relative"
            textAlign="center"
            lineHeight="1.2"
          >
            <Text>Type</Text>
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
          </Box>

          {/* Name Column Header */}
          <Box
            w={`${columnWidths.name}px`}
            px={1}
            py={1}
            fontSize="xs"
            fontWeight="semibold"
            color="gray.600"
            borderRight="1px solid"
            borderColor="gray.200"
            position="relative"
            textAlign="center"
            lineHeight="1.2"
          >
            <Text>Name</Text>
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
          </Box>

          {/* Value Column Header */}
          <Flex
            w={`${columnWidths.value}px`}
            flex="1"
            px={1}
            py={1}
            fontSize="xs"
            fontWeight="semibold"
            color="gray.600"
            position="relative"
            justify="center"
            align="center"
          >
            <Text>Value</Text>
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
        <Box maxH="300px" overflowY="auto" overflowX="visible">
          {paginatedValues.map((value, index) => (
            <Flex
              key={value._id}
              gap={0}
              borderBottom={
                index < paginatedValues.length - 1 ? "1px solid" : "none"
              }
              borderColor="gray.200"
              _hover={{ bg: "gray.25" }}
              overflow="visible"
              bg={selectedRows.has(value._id) ? "blue.50" : "transparent"}
            >
              {/* Drag Handle Column - only show in edit mode */}
              {!props.viewOnly && (
                <Box
                  w="30px"
                  px={1}
                  py={0.5}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRight="1px solid"
                  borderColor="gray.200"
                  bg={selectedRows.has(value._id) ? "blue.100" : "transparent"}
                  _hover={
                    !props.viewOnly
                      ? {
                          bg: selectedRows.has(value._id)
                            ? "blue.200"
                            : "gray.100",
                        }
                      : {}
                  }
                  cursor={props.viewOnly ? "default" : "pointer"}
                >
                  <Checkbox.Root
                    checked={selectedRows.has(value._id)}
                    onChange={() =>
                      !props.viewOnly && toggleRowSelection(value._id)
                    }
                    size="sm"
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
                w={`${columnWidths.type}px`}
                px={1}
                py={0.5}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRight="1px solid"
                borderColor="gray.200"
              >
                {!props.viewOnly ? (
                  <Select.Root
                    size="xs"
                    collection={createListCollection({
                      items: [
                        { value: "number", label: "Number" },
                        { value: "text", label: "Text" },
                        { value: "url", label: "URL" },
                        { value: "date", label: "Date" },
                        { value: "entity", label: "Entity" },
                        { value: "select", label: "Select" },
                      ],
                    })}
                    onValueChange={(details) =>
                      handleTypeChange(
                        value._id,
                        details.items[0].value as IValueType,
                      )
                    }
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger minW="100px" h="20px">
                        <Flex align="center" gap={1}>
                          {getTypeIcon(value.type)}
                          <Text fontSize="xs" color="gray.700">
                            {value.type === "url"
                              ? "URL"
                              : _.capitalize(value.type)}
                          </Text>
                        </Flex>
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Select.Positioner>
                      <Select.Content zIndex={9999}>
                        {[
                          { value: "number", label: "Number" },
                          { value: "text", label: "Text" },
                          { value: "url", label: "URL" },
                          { value: "date", label: "Date" },
                          { value: "entity", label: "Entity" },
                          { value: "select", label: "Select" },
                        ].map((option) => (
                          <Select.Item item={option} key={option.value}>
                            <Flex align="center" gap={2}>
                              {getTypeIcon(option.value as IValueType)}
                              {option.label}
                            </Flex>
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Select.Root>
                ) : (
                  <Flex align="center" gap={1}>
                    {getTypeIcon(value.type)}
                    <Text fontSize="xs" color="gray.700">
                      {value.type === "url" ? "URL" : _.capitalize(value.type)}
                    </Text>
                  </Flex>
                )}
              </Box>

              {/* Name Column */}
              <Box
                w={`${columnWidths.name}px`}
                px={1}
                py={0.5}
                borderRight="1px solid"
                borderColor="gray.200"
              >
                <Input
                  value={value.name}
                  onChange={(e) => handleNameChange(value._id, e.target.value)}
                  size="sm"
                  px={1}
                  py={0.5}
                  fontSize="sm"
                  readOnly={props.viewOnly}
                  placeholder="Enter name"
                  border="none"
                  bg="transparent"
                  cursor={props.viewOnly ? "default" : "text"}
                  onClick={
                    props.viewOnly ? (e) => e.preventDefault() : undefined
                  }
                  _focus={{
                    bg: "white",
                    border: "1px solid",
                    borderColor: "blue.300",
                  }}
                  _hover={
                    !props.viewOnly
                      ? {
                          border: "1px solid",
                          borderColor: "blue.200",
                          boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)",
                        }
                      : {}
                  }
                />
              </Box>

              {/* Value Column */}
              <Box
                w={`${columnWidths.value}px`}
                flex="1"
                px={1}
                py={0.5}
                overflow="visible"
              >
                {renderDataInput(value)}
              </Box>
            </Flex>
          ))}
        </Box>

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
              <Dialog.Header px="2" py="4" roundedTop="md" bg="gray.100">
                <Flex direction="row" align="center" gap="2">
                  <Icon name="v_select" />
                  <Text fontSize="sm" fontWeight="semibold">
                    Setup Values
                  </Text>
                </Flex>
                <Dialog.CloseTrigger asChild>
                  <CloseButton
                    size="sm"
                    onClick={cancelSelectOptions}
                    _hover={{ bg: "gray.200" }}
                  />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p="2" gap="2" pb="0">
                <Flex direction="column" gap="2">
                  <Flex direction="row" gap="2">
                    <Input
                      size="sm"
                      rounded="md"
                      placeholder="Enter option value"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          addOption();
                        }
                      }}
                    />
                    <Button
                      colorPalette="green"
                      size="sm"
                      rounded="md"
                      onClick={addOption}
                      disabled={
                        !newOption.trim() ||
                        selectOptions.includes(newOption.trim())
                      }
                    >
                      Add
                      <Icon name="add" />
                    </Button>
                  </Flex>
                  <Box>
                    <Stack
                      gap="1"
                      separator={<Separator />}
                      pb="2"
                      maxH="200px"
                      overflowY={"auto"}
                    >
                      {selectOptions.length > 0 ? (
                        selectOptions.map((option, index) => (
                          <Flex
                            key={option}
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
                            <Flex gap="2">
                              <Text fontWeight="semibold" fontSize="sm">
                                Value {index + 1}:
                              </Text>
                              <Text fontSize="sm">{option}</Text>
                            </Flex>
                            <IconButton
                              aria-label={`remove_${index}`}
                              size="sm"
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
                            props.viewOnly
                              ? (e) => e.preventDefault()
                              : undefined
                          }
                          align="center"
                          justify="center"
                          minH="60px"
                          rounded="md"
                          border="1px"
                          borderColor="gray.300"
                        >
                          <Text
                            fontSize="sm"
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
              <Dialog.Footer p="2" bg="gray.100" roundedBottom="md">
                <Button
                  size="sm"
                  rounded="md"
                  colorPalette="red"
                  onClick={cancelSelectOptions}
                >
                  Cancel
                  <Icon name="cross" />
                </Button>
                <Spacer />
                <Button
                  size="sm"
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
      </Box>

      {/* Toolbar */}
      <Box
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
        p={1}
        boxShadow="sm"
        mt={2}
      >
        <Flex gap={1} align="center" justify="space-between">
          {/* Left side - Actions */}
          <Flex gap={1} align="center">
            {!props.viewOnly && (
              <>
                <Button
                  size="xs"
                  rounded="md"
                  colorPalette="green"
                  onClick={addRow}
                  aria-label="Add row"
                  disabled={props.viewOnly}
                  cursor={props.viewOnly ? "default" : "pointer"}
                >
                  Add
                  <Icon name="add" />
                </Button>
                <IconButton
                  size="xs"
                  rounded="md"
                  colorPalette="blue"
                  onClick={moveRowUp}
                  disabled={selectedRows.size !== 1}
                  aria-label="Move row up"
                >
                  <Icon name="c_up" size="sm" />
                </IconButton>
                <IconButton
                  size="xs"
                  rounded="md"
                  colorPalette="blue"
                  onClick={moveRowDown}
                  disabled={selectedRows.size !== 1}
                  aria-label="Move row down"
                >
                  <Icon name="c_down" size="sm" />
                </IconButton>
                <Button
                  size="xs"
                  rounded="md"
                  colorPalette="red"
                  onClick={removeSelectedRows}
                  disabled={selectedRows.size === 0}
                  aria-label="Remove selected rows"
                >
                  Delete
                  <Icon name="delete" />
                </Button>
              </>
            )}
          </Flex>

          {/* Right side - Pagination */}
          <Flex gap={2} align="center">
            <Text fontSize="sm">Shown Per Page:</Text>
            <Fieldset.Root w="fit-content">
              <Fieldset.Content>
                <Field.Root>
                  <Select.Root
                    size="sm"
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

            <Flex direction="row" gap={2} align="center">
              <IconButton
                variant="outline"
                size="sm"
                rounded="md"
                aria-label="first page"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage <= 1}
              >
                <Icon name="c_double_left" />
              </IconButton>
              <IconButton
                variant="outline"
                size="sm"
                rounded="md"
                aria-label="previous page"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
              >
                <Icon name="c_left" />
              </IconButton>
              {totalPages > 0 && (
                <Flex gap={1}>
                  <Text fontSize="sm" fontWeight="semibold">
                    {currentPage}
                  </Text>
                  <Text fontSize="sm"> of </Text>
                  <Text fontSize="sm" fontWeight="semibold">
                    {totalPages}
                  </Text>
                </Flex>
              )}
              <IconButton
                variant="outline"
                size="sm"
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
                size="sm"
                rounded="md"
                aria-label="last page"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
              >
                <Icon name="c_double_right" />
              </IconButton>
            </Flex>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
};

export default ValuesRemix;
