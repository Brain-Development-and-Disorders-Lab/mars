// React
import React, { useState, useEffect } from "react";

// Chakra UI components
import {
  Box,
  Button,
  CloseButton,
  Dialog,
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

  // Get icon for value type
  const getTypeIcon = (type: IValueType) => {
    switch (type) {
      case "number":
        return <Icon size="xs" name="v_number" color="green.300" />;
      case "text":
        return <Icon size="xs" name="v_text" color="blue.300" />;
      case "url":
        return <Icon size="xs" name="v_url" color="yellow.300" />;
      case "date":
        return <Icon size="xs" name="v_date" color="orange.300" />;
      case "select":
        return <Icon size="xs" name="v_select" color="cyan.300" />;
      case "entity":
      default:
        return <Icon size="xs" name="entity" color="purple.300" />;
    }
  };

  // Helper function to check if select has configured options
  const hasSelectOptions = (data: any): boolean => {
    return (
      data &&
      typeof data === "object" &&
      "options" in data &&
      Array.isArray(data.options) &&
      data.options.length > 0
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
            _focus={{
              bg: "white",
              border: "1px solid",
              borderColor: "blue.300",
            }}
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
            _focus={{
              bg: "white",
              border: "1px solid",
              borderColor: "blue.300",
            }}
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
            _focus={{
              bg: "white",
              border: "1px solid",
              borderColor: "blue.300",
            }}
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
            _focus={{
              bg: "white",
              border: "1px solid",
              borderColor: "blue.300",
            }}
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
                items: value.data.options.map((opt: any) => ({
                  value: opt._id,
                  label: opt.name,
                })),
              })}
              onValueChange={(details) => {
                const selectedOption = value.data.options.find(
                  (opt: any) => opt._id === details.value[0],
                );
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
                    {value.data.options.map((option: any) => (
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
            _focus={{
              bg: "white",
              border: "1px solid",
              borderColor: "blue.300",
            }}
          />
        );
    }
  };

  return (
    <Box
      maxW="600px"
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
        <Flex
          w="120px"
          px={1}
          py={1}
          justify={"center"}
          fontSize="xs"
          fontWeight="semibold"
          color="gray.600"
          borderRight="1px solid"
          borderColor="gray.200"
        >
          <Text>Type</Text>
        </Flex>
        <Flex
          w="220px"
          px={1}
          py={1}
          justify={"center"}
          fontSize="xs"
          fontWeight="semibold"
          color="gray.600"
          borderRight="1px solid"
          borderColor="gray.200"
        >
          <Text>Name</Text>
        </Flex>
        <Flex
          w="260px"
          px={1}
          py={1}
          justify={"center"}
          fontSize="xs"
          fontWeight="semibold"
          color="gray.600"
        >
          <Text>Value</Text>
        </Flex>
      </Flex>

      {/* Data Rows */}
      <Box maxH="400px" overflowY="auto" overflowX="visible">
        {localValues.map((value, index) => (
          <Flex
            key={value._id}
            gap={0}
            borderBottom={index < localValues.length - 1 ? "1px solid" : "none"}
            borderColor="gray.200"
            _hover={{ bg: "gray.25" }}
            overflow="visible"
          >
            {/* Type Column */}
            <Box
              w="120px"
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
                </Flex>
              )}
            </Box>

            {/* Name Column */}
            <Box
              w="220px"
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
                _focus={{
                  bg: "white",
                  border: "1px solid",
                  borderColor: "blue.300",
                }}
              />
            </Box>

            {/* Value Column */}
            <Box w="260px" px={1} py={0.5} overflow="visible">
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
                          w="100%"
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
                        w="100%"
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
  );
};

export default ValuesRemix;
