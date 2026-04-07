// React
import React, { useState, useEffect, useRef, ReactElement } from "react";

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
  Link,
} from "@chakra-ui/react";

import {
  OptionBase,
  components,
  Select as ReactSelect,
  OptionProps,
  DropdownIndicatorProps,
  ValueContainerProps,
  ContainerProps,
  SingleValueProps,
  MenuListProps,
  ControlProps,
} from "chakra-react-select";

// Custom components
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import SearchSelect from "@components/SearchSelect";
import Tooltip from "@components/Tooltip";

// Types
import { IconNames, IValue, IValueSelectData, IValueType } from "@types";

// Utility functions
import _ from "lodash";
import dayjs from "dayjs";

interface SelectOption extends OptionBase {
  label: string;
  value: string;
}

interface ValueTypeOption extends OptionBase {
  label: string;
  value: IValueType;
}

/**
 * Utility function to generate the corresponding `IconName` and color
 * for each `IValueType`
 * @param type `IValueType` representing the icon and color scheme
 * @return {{ icon: IconNames, color: string }}
 */
const getIconConfiguration = (type: IValueType): { icon: IconNames; color: string } => {
  let icon: IconNames = "v_text";
  let color: string = "blue.300";

  // Customize `Icon` color according to Value `type`
  if (type === "date") {
    icon = "v_date";
    color = "orange.300";
  } else if (type === "number") {
    icon = "v_number";
    color = "green.300";
  } else if (type === "url") {
    icon = "v_url";
    color = "yellow.300";
  } else if (type === "entity") {
    icon = "entity";
    color = "purple.300";
  } else if (type === "select") {
    icon = "v_select";
    color = "teal.300";
  }
  return { icon, color };
};

/**
 * Custom styling for each Value `type`, displaying colored icons
 */
const ValueTypeOption = (props: OptionProps<ValueTypeOption>) => {
  const { icon, color } = getIconConfiguration(props.data.value);
  return (
    <components.Option {...props}>
      <Flex direction={"row"} h={"8"} p={"0.5"} gap={"1"} align={"center"} _hover={{ bg: "blue.100" }}>
        <Icon name={icon} size={"xs"} color={color} />
        <Text fontSize={"xs"}>{props.data.label}</Text>
      </Flex>
    </components.Option>
  );
};

/**
 * Custom styling for Value `type` select container
 */
const ValueTypeSelectContainer = ({ children, ...props }: ContainerProps<ValueTypeOption>) => {
  return (
    <Box w={"100%"}>
      <components.SelectContainer {...props}>{children}</components.SelectContainer>
    </Box>
  );
};

/**
 * Custom styling for Value `type` value container
 */
const ValueTypeValueContainer = ({ children, ...props }: ValueContainerProps<ValueTypeOption>) => {
  return (
    <components.ValueContainer {...props}>
      <Flex w={"100%"} h={"34px"}>
        {children}
      </Flex>
    </components.ValueContainer>
  );
};

const ValueTypeControl = (props: ControlProps<ValueTypeOption, false>) => {
  return (
    <Box
      pl={"1"}
      pr={"3"}
      border={"1px solid transparent"}
      _hover={{
        borderColor: "blue.300",
      }}
    >
      <components.Control {...props} />
    </Box>
  );
};

/**
 * Custom styling for Value `type` single value
 */
const ValueTypeSingleValue = ({ ...props }: SingleValueProps<ValueTypeOption>) => {
  const { icon, color } = getIconConfiguration(props.data.value);
  return (
    <Flex direction={"row"} align={"center"}>
      <components.SingleValue {...props}>
        <Flex direction={"row"} align={"center"} gap={"2"}>
          <Icon name={icon} size={"xs"} color={color} />
          <Text fontSize={"xs"}>{props.data.label}</Text>
        </Flex>
      </components.SingleValue>
    </Flex>
  );
};

/**
 * Custom styling for Value `type` `MenuList` component containing all menu options
 */
const ValueTypeMenuList = ({ children, ...props }: MenuListProps<ValueTypeOption, false>) => {
  return (
    <Flex
      direction={"column"}
      border={"1px solid"}
      borderColor={"gray.200"}
      bg={"white"}
      gap={"0.5"}
      p={"0.5"}
      rounded={"sm"}
    >
      <components.MenuList {...props}>{children}</components.MenuList>
    </Flex>
  );
};

/**
 * Custom styling for each Value `data`
 */
const ValueDataOption = (props: OptionProps<SelectOption>) => {
  return (
    <components.Option {...props}>
      <Flex direction={"row"} h={"8"} p={"0.5"} gap={"1"} align={"center"} _hover={{ bg: "blue.100" }}>
        <Text fontSize={"xs"}>{props.data.label}</Text>
      </Flex>
    </components.Option>
  );
};

/**
 * Custom styling for Value `data` `DropdownIndicator` component
 */
const ValueTypeDropdownIndicator = (props: DropdownIndicatorProps<ValueTypeOption, false>) => {
  return (
    <components.DropdownIndicator {...props}>
      <Icon name={props.selectProps.menuIsOpen ? "c_up" : "c_down"} size={"xs"} />
    </components.DropdownIndicator>
  );
};

/**
 * Custom styling for Value `data` select container
 */
const ValueDataSelectContainer = ({ children, ...props }: ContainerProps<SelectOption>) => {
  return (
    <Box w={"100%"}>
      <components.SelectContainer {...props}>{children}</components.SelectContainer>
    </Box>
  );
};

/**
 * Custom styling for Value `data` value container
 */
const ValueDataValueContainer = ({ children, ...props }: ValueContainerProps<SelectOption>) => {
  return (
    <components.ValueContainer {...props}>
      <Flex w={"100%"} h={"34px"}>
        {children}
      </Flex>
    </components.ValueContainer>
  );
};

const ValueDataControl = (props: ControlProps<SelectOption, false>) => {
  return (
    <Box pl={"2"} pr={"3"}>
      <components.Control {...props} />
    </Box>
  );
};

/**
 * Custom styling for Value `type` single value
 */
const ValueDataSingleValue = ({ children, ...props }: SingleValueProps<SelectOption>) => {
  return (
    <Flex direction={"row"} align={"center"}>
      <components.SingleValue {...props}>
        <Flex direction={"row"} align={"center"} gap={"2"} fontSize={"xs"}>
          {children}
        </Flex>
      </components.SingleValue>
    </Flex>
  );
};

/**
 * Custom styling for Value `type` `MenuList` component containing all menu options
 */
const ValueDataMenuList = (props: MenuListProps<SelectOption, false>) => {
  return (
    <Flex
      direction={"column"}
      border={"1px solid"}
      borderColor={"gray.200"}
      bg={"white"}
      gap={"0.5"}
      p={"0.5"}
      rounded={"sm"}
    >
      <components.MenuList {...props}>{props.children}</components.MenuList>
    </Flex>
  );
};

/**
 * Custom styling for Value `type` `DropdownIndicator` component
 */
const ValueDataDropdownIndicator = (props: DropdownIndicatorProps<SelectOption, false>) => {
  return (
    <components.DropdownIndicator {...props}>
      <Icon name={props.selectProps.menuIsOpen ? "c_up" : "c_down"} size={"xs"} />
    </components.DropdownIndicator>
  );
};

/**
 * Custom `Select` component for displaying `IValue` instances that have a
 * `type` of `select`. A separate component was required to manage state
 * and parse `data` correctly.
 * @param props Required props for `ValueDataSelect` component
 */
const ValueDataSelect = (props: {
  valueData: string;
  setValueData: React.Dispatch<React.SetStateAction<string>>;
  viewOnly?: boolean;
}) => {
  let selectData: IValueSelectData;
  let initialSelected: SelectOption;
  let initialOptions: SelectOption[];

  // Clean and prepare data
  try {
    selectData = JSON.parse(props.valueData);
    initialSelected = {
      label: selectData.selected,
      value: selectData.selected,
    };
    initialOptions = selectData.options.map((option: string) => {
      return {
        label: option,
        value: option,
      };
    });
  } catch {
    // JSON parse failed, so set up with empty data
    initialSelected = {
      label: "",
      value: "",
    };
    initialOptions = [];
  }

  // Setup state using this data
  const [selected, setSelected] = useState<SelectOption>(initialSelected);
  const [options, setOptions] = useState<SelectOption[]>(initialOptions);
  const [addOptionModalOpen, setAddOptionModalOpen] = useState(false);

  // Additional state
  const [newOption, setNewOption] = useState<string>("");
  const [invalidOption, setInvalidOption] = useState(true);

  /**
   * Update the `newOption` state and perform error check to ensure
   * only valid Options are entered
   * @param value Updated Option value entered through modal
   */
  const updateNewOption = (value: string) => {
    setNewOption(value);
    if (value === "" || options.map((option) => option.value).includes(value)) {
      setInvalidOption(true);
    } else {
      setInvalidOption(false);
    }
  };

  // Handle adding a new option
  const addOption = () => {
    // Add to `selectOptions` and reset value
    setOptions([...options, { label: newOption, value: newOption }]);
    setNewOption("");
  };

  // Handle removing an option
  const removeOption = (toRemove: SelectOption) => {
    setOptions(options.filter((option) => option.value !== toRemove.value));
  };

  // Handle confirming select options
  const confirmSelectOptions = () => {
    props.setValueData(
      JSON.stringify({
        selected: options[0].value,
        options: options.map((o) => o.value),
      }),
    );
    setSelected(options[0]);
    setNewOption("");
    setAddOptionModalOpen(false);
  };

  // Handle canceling select options
  const cancelSelectOptions = () => {
    setNewOption("");
    setAddOptionModalOpen(false);
  };

  // Handle opening select options modal
  const openSelectModal = () => {
    setOptions([]);
    setNewOption("");
    setAddOptionModalOpen(true);
  };

  return (
    <>
      {/* Select Options */}
      {options.length > 0 ? (
        <ReactSelect
          options={options}
          size={"sm"}
          placeholder={"Select Option"}
          disabled={props.viewOnly}
          value={selected}
          isSearchable={false}
          onChange={(event) => {
            if (event) {
              // Update displayed selection
              setSelected(event);

              // Update underlying data
              props.setValueData(
                JSON.stringify({
                  selected: event.value,
                  options: options.map((o) => o.value),
                }),
              );
            }
          }}
          components={{
            Control: ValueDataControl,
            SelectContainer: ValueDataSelectContainer,
            ValueContainer: ValueDataValueContainer,
            SingleValue: ValueDataSingleValue,
            DropdownIndicator: ValueDataDropdownIndicator,
            MenuList: ValueDataMenuList,
            Option: ValueDataOption,
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
            }),
            control: (base) => ({
              ...base,
            }),
          }}
          closeMenuOnScroll={false}
        />
      ) : (
        <Flex
          w={"100%"}
          h={"100%"}
          p={"0"}
          gap={"2"}
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
          <Icon name={"add"} color={"green"} size={"xs"} />
          <Text fontSize={"xs"} fontWeight={"semibold"} color={"green"}>
            Add Options
          </Text>
        </Flex>
      )}

      {/* Select Add Options Modal */}
      <Dialog.Root open={addOptionModalOpen} size="sm" placement="center" closeOnEscape closeOnInteractOutside>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header p={"0"} roundedTop="md" bg="blue.300">
              <Flex direction="row" align="center" gap="1" p={"2"}>
                <Icon name="v_select" />
                <Text fontSize="xs" fontWeight="semibold">
                  Add Options
                </Text>
              </Flex>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="2xs" top={"6px"} onClick={cancelSelectOptions} />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body p="1" gap="1" pb="1">
              <Flex direction="column" gap="1">
                <Flex direction="row" gap="1">
                  <Field.Root invalid={invalidOption} gap={"1"}>
                    <Input
                      size="xs"
                      rounded="md"
                      placeholder="Enter Option"
                      value={newOption}
                      onChange={(e) => updateNewOption(e.target.value)}
                      onKeyUp={(e) => {
                        if (e.key === "Enter" && !invalidOption) {
                          addOption();
                        }
                      }}
                    />
                    <Field.ErrorText fontSize={"xs"} ml={"0.5"}>
                      Please specify a valid Option
                    </Field.ErrorText>
                  </Field.Root>
                  <Button colorPalette="green" size="xs" rounded="md" onClick={addOption} disabled={invalidOption}>
                    Add
                    <Icon name="add" />
                  </Button>
                </Flex>
                <Box>
                  <Stack gap="1" separator={<Separator />} pb="1" maxH="200px" overflowY={"auto"}>
                    {options.length > 0 ? (
                      options.map((option, index) => (
                        <Flex
                          key={option.value}
                          direction="row"
                          cursor={props.viewOnly ? "default" : "text"}
                          onClick={props.viewOnly ? (e) => e.preventDefault() : undefined}
                          justify="space-between"
                          align="center"
                        >
                          <Flex gap="1">
                            <Text fontWeight="semibold" fontSize="xs" ml={"0.5"}>
                              Option {index + 1}:
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
                        onClick={props.viewOnly ? (e) => e.preventDefault() : undefined}
                        align="center"
                        justify="center"
                        minH="60px"
                        rounded="md"
                        border="1px"
                        borderColor="gray.300"
                      >
                        <Text fontSize="xs" fontWeight="semibold" color="gray.400">
                          No Options added
                        </Text>
                      </Flex>
                    )}
                  </Stack>
                </Box>
              </Flex>
            </Dialog.Body>
            <Dialog.Footer p="1" bg="gray.100" roundedBottom="md">
              <Button size="xs" rounded="md" colorPalette="red" onClick={cancelSelectOptions}>
                Cancel
                <Icon name="cross" />
              </Button>
              <Spacer />
              <Button
                size="xs"
                rounded="md"
                colorPalette="green"
                onClick={confirmSelectOptions}
                disabled={options.length === 0}
              >
                Confirm
                <Icon name="check" />
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
};

/**
 * A spreadsheet-like interface for editing key-value data with type selection,
 * name, and value columns
 */
const Values = (props: {
  values: IValue[];
  setValues: (values: React.SetStateAction<IValue[]>) => void;
  viewOnly?: boolean;
  requireData?: boolean;
  permittedValues?: string[];
}) => {
  // Local type for tracking column names
  type ValuesColumn = "name" | "type" | "value";

  // Counter for unique IDs
  const idCounter = useRef(0);

  // Column widths and their minimums
  const minColumnWidths = { name: 220, type: 120, value: 260 };
  const [columnWidths, setColumnWidths] = useState({ ...minColumnWidths });

  // Refs for components involved in changing column widths
  const tableRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{
    column: ValuesColumn;
    startX: number;
    startWidth: number;
    otherFixedWidth: number;
  } | null>(null);

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

  /**
   * Handle a resize event on a column in the `Values` component
   * @param {ValuesColumn} column Specific column being resized
   * @param {React.MouseEvent} event Mouse event
   */
  const handleResizeStart = (column: ValuesColumn, event: React.MouseEvent) => {
    event.preventDefault();
    const allFixedWidth = (props.viewOnly ? 0 : 40) + columnWidths.name + columnWidths.type;
    const otherFixedWidth = allFixedWidth - (column !== "value" ? columnWidths[column] : 0);
    resizeRef.current = {
      column,
      startX: event.clientX,
      startWidth: columnWidths[column],
      otherFixedWidth,
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  /**
   * Handle movement within a column resize event in the `Values` component
   * @param event Mouse event
   * @return
   */
  const handleResizeMove = (event: MouseEvent) => {
    if (!resizeRef.current) return;
    const { column, startX, startWidth, otherFixedWidth } = resizeRef.current;
    const containerWidth = tableRef.current?.offsetWidth ?? Infinity;
    // Note: For `name` and `type`, leave room for the value column's minimum width
    // Note: For `value`, the column itself is flexible, so only other fixed columns constrain it
    const maxWidth = containerWidth - otherFixedWidth - (column !== "value" ? minColumnWidths.value : 0);
    const newWidth = Math.min(maxWidth, Math.max(minColumnWidths[column], startWidth + (event.clientX - startX)));
    setColumnWidths((prev) => ({ ...prev, [column]: newWidth }));
  };

  /**
   * Handle the end of a column resize event in the `Values` component
   */
  const handleResizeEnd = () => {
    resizeRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  };

  // Row manipulation functions
  const addRow = () => {
    const newValue = createNewValue();
    const updatedValues = [...props.values, newValue];
    props.setValues(updatedValues);
  };

  const removeSelectedRows = () => {
    if (selectedRows.size === 0) return;
    const updatedValues = props.values.filter((value) => !selectedRows.has(value._id));
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
  const onValueChange = (_id: string, name: string, type: IValueType, data: string) => {
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
    <Box w="100%" display="flex" flexDirection="column" css={{ WebkitOverflowScrolling: "touch" }}>
      {/* Table */}
      <Box flex="1" minH="0" overflowX="auto" overflowY="auto">
        <Box
          ref={tableRef}
          minW="800px"
          w="100%"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="md"
          overflow="hidden"
        >
          {/* Header Row */}
          <Flex gap={0} bg="gray.100" borderBottom="1px solid" borderColor="gray.200" direction="row">
            {/* Drag Handle Column Header - only show in edit mode */}
            {!props.viewOnly && (
              <Box
                w="40px"
                flex={"0 0 auto"}
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

            {/* Name Column Header */}
            <Flex
              w={`${columnWidths.name}px`}
              flex={"0 0 auto"}
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

            {/* Type Column Header */}
            <Flex
              w={`${columnWidths.type}px`}
              flex={"0 0 auto"}
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

            {/* Value Column Header */}
            <Flex
              flex={"1 1 auto"}
              minW={`${columnWidths.value}px`}
              px={1}
              py={1}
              fontSize={"xs"}
              fontWeight={"semibold"}
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
            <Flex borderTop="1px solid" borderColor="gray.200" p={0} justify="center" align="center" bg="gray.100">
              {selectedRows.size > 0 ? (
                <Button
                  size="xs"
                  variant="ghost"
                  colorPalette="red"
                  onClick={removeSelectedRows}
                  aria-label="Delete selected values"
                  w="100%"
                  h={"fit-content"}
                  p={"0.5"}
                >
                  <Icon name="delete" size="xs" />
                  <Text ml={1} fontSize="xs" fontWeight="semibold">
                    Delete {selectedRows.size === 1 ? "Value" : "Values"} ({selectedRows.size})
                  </Text>
                </Button>
              ) : (
                <Button
                  id="addValueRowButton"
                  size="xs"
                  variant="ghost"
                  colorPalette="green"
                  onClick={addRow}
                  aria-label="Add value"
                  w="100%"
                  h={"fit-content"}
                  p={"0.5"}
                >
                  <Icon name="add" size="xs" />
                  <Text ml={1} fontSize="xs" fontWeight="semibold">
                    Add Value
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
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
                  onValueChange={(details) => setRowsPerPage(parseInt(details.value[0]))}
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
  onValueChange: (_id: string, name: string, type: IValueType, data: string) => void;
  columnWidths: { type: number; name: number; value: number };
  isSelected: boolean;
  hideBorder?: boolean;
  viewOnly?: boolean;
}) => {
  const valueTypeOptions: ValueTypeOption[] = [
    { label: "Number", value: "number" },
    { label: "Text", value: "text" },
    { label: "URL", value: "url" },
    { label: "Date", value: "date" },
    { label: "Entity", value: "entity" },
    { label: "Select", value: "select" },
  ];

  // Get the initial `ValueTypeOption` based on the `IValue` type
  const initialValueType = valueTypeOptions.filter((value) => value.value === props.value.type)[0];

  // React state for value display
  const [valueName, setValueName] = useState(props.value.name);
  const [valueType, setValueType] = useState<IValueType>(props.value.type);
  const [valueTypeOption, setValueTypeOption] = useState<ValueTypeOption>(initialValueType);
  const [valueData, setValueData] = useState<string>(props.value.data);
  const [valueChecked, setValueChecked] = useState(false);

  useEffect(() => {
    // Propagate changes to overall `Value` state
    props.onValueChange(props.value._id, valueName, valueType, valueData);
  }, [valueName, valueType, valueData]);

  /**
   * Utility function to generate default data when the `type` changes
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

  /**
   * Utility function to generate URL "tabs" representing links to known platforms
   * @param {string} url The URL stored as `data` in the Value component
   */
  const generateUrlTab = (url: string): ReactElement => {
    const urlObject = URL.parse(url);
    const isValidUrl = !_.isNull(urlObject);

    // Determine platform-specific icon and badge styling
    let iconStyle: IconNames = "link";
    let badgeBg = "blue.50";
    let badgeBorder = "blue.100";
    let iconColor = "blue.500";

    if (isValidUrl) {
      if (urlObject.host === "box.com" || urlObject.host.endsWith(".box.com")) {
        iconStyle = "l_box";
        badgeBg = "blue.50";
        badgeBorder = "blue.100";
        iconColor = "blue.500";
      } else if (urlObject.host === "github.com" || urlObject.host.endsWith(".github.com")) {
        iconStyle = "l_github";
        badgeBg = "gray.100";
        badgeBorder = "gray.200";
        iconColor = "gray.600";
      }
    }

    return (
      <Flex
        direction={"row"}
        align={"center"}
        h={"100%"}
        w={"100%"}
        px={"2"}
        border={"1px solid transparent"}
        _hover={{
          border: "1px solid",
          borderColor: "blue.200",
          boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)",
        }}
      >
        {isValidUrl ? (
          <Tooltip content={url} showArrow>
            <Link href={url} _hover={{ textDecoration: "none" }}>
              <Flex
                direction={"row"}
                align={"center"}
                h={"22px"}
                border={"1px solid"}
                borderColor={"gray.200"}
                rounded={"md"}
                overflow={"hidden"}
                _hover={{
                  borderColor: "blue.300",
                  boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)",
                }}
              >
                {/* Platform icon badge */}
                <Flex
                  align={"center"}
                  justify={"center"}
                  bg={badgeBg}
                  px={"1.5"}
                  h={"100%"}
                  borderRight={"1px solid"}
                  borderColor={badgeBorder}
                >
                  <Icon name={iconStyle} size={"xs"} color={iconColor} />
                </Flex>
                {/* Hostname */}
                <Flex px={"2"} align={"center"} h={"100%"} bg={"white"}>
                  <Text fontSize={"xs"} fontWeight={"medium"} color={"gray.700"}>
                    {urlObject.host}
                  </Text>
                </Flex>
              </Flex>
            </Link>
          </Tooltip>
        ) : (
          <Tooltip content={"Invalid URL"} showArrow>
            <Flex
              direction={"row"}
              align={"center"}
              h={"22px"}
              border={"1px solid"}
              borderColor={"orange.200"}
              rounded={"md"}
              overflow={"hidden"}
              cursor={"not-allowed"}
            >
              {/* Warning badge */}
              <Flex
                align={"center"}
                justify={"center"}
                bg={"orange.50"}
                px={"1.5"}
                h={"100%"}
                borderRight={"1px solid"}
                borderColor={"orange.200"}
              >
                <Icon name={"warning"} size={"xs"} color={"orange.500"} />
              </Flex>
              {/* Truncated URL */}
              <Flex px={"2"} align={"center"} h={"100%"} bg={"white"}>
                <Text fontSize={"xs"} fontWeight={"medium"} color={"gray.500"}>
                  {_.truncate(url, { length: 28 })}
                </Text>
              </Flex>
            </Flex>
          </Tooltip>
        )}
      </Flex>
    );
  };

  /**
   * Copy a `IValue`'s data, parsing and utilizing relevant fields if `type`
   * is `entity` or `select`
   * @param {IValueType} valueType The type of the value to be copied
   * @param {string} valueData Serialized value data
   */
  const copyToClipboard = (valueType: IValueType, valueData: string) => {
    // If data is a serialized object, parse and copy relevant fields
    if (valueType === "entity") {
      valueData = JSON.parse(valueData)._id;
    } else if (valueType === "select") {
      valueData = JSON.parse(valueData).selected;
    }
    navigator.clipboard.writeText(valueData.toString() || "");
  };

  // Render data input based on type
  const renderDataInput = (valueType: IValueType) => {
    if (valueType === "number") {
      return (
        <Input
          value={valueData}
          onChange={(e) => setValueData(e.target.value)}
          size="xs"
          h={"100%"}
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
          h={"100%"}
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
      if (!props.viewOnly) {
        return (
          <Input
            value={valueData}
            onChange={(e) => setValueData(e.target.value)}
            size="xs"
            h={"100%"}
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
      } else {
        return generateUrlTab(valueData);
      }
    } else if (valueType === "date") {
      return (
        <Input
          value={valueData}
          onChange={(e) => setValueData(e.target.value)}
          size="xs"
          h={"100%"}
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
      return (
        <Flex
          w="100%"
          h={"100%"}
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
          <ValueDataSelect valueData={valueData} setValueData={setValueData} viewOnly={props.viewOnly} />
        </Flex>
      );
    } else if (valueType === "entity") {
      if (!props.viewOnly) {
        return (
          <Flex
            w="100%"
            h={"100%"}
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
            w={"100%"}
            h={"100%"}
            justify="start"
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
            <Linky type="entities" id={JSON.parse(valueData)._id || ""} size="xs" />
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

      {/* Name Column */}
      <Box
        w={`${props.columnWidths.name}px`}
        flex={"0 0 auto"}
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

      {/* Type Column */}
      <Box
        w={`${props.columnWidths.type}px`}
        flex={"0 0 auto"}
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
          isSearchable={false}
          components={{
            Control: ValueTypeControl,
            SelectContainer: ValueTypeSelectContainer,
            ValueContainer: ValueTypeValueContainer,
            SingleValue: ValueTypeSingleValue,
            DropdownIndicator: ValueTypeDropdownIndicator,
            MenuList: ValueTypeMenuList,
            Option: ValueTypeOption,
          }}
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
            }),
            control: (base) => ({
              ...base,
            }),
          }}
          closeMenuOnScroll={false}
        />
      </Box>

      {/* Value Column */}
      <Flex
        flex={"1 1 auto"}
        minW={`${props.columnWidths.value}px`}
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
            onClick={() => copyToClipboard(valueType, valueData)}
          >
            <Icon name="copy" size="xs" />
          </IconButton>
        )}
      </Flex>
    </Flex>
  );
};

export default Values;
