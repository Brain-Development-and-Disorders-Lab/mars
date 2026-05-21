// React
import React, { useState, useEffect, useRef, useCallback, ReactElement } from "react";

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
  Menu,
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
  PlaceholderProps,
} from "chakra-react-select";

// Custom components
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import SearchSelect from "@components/SearchSelect";
import { toaster } from "@components/Toast";
import Tooltip from "@components/Tooltip";

// Types
import { ColumnInfo, IconNames, IValue, IValueSelectData, IValueType } from "@types";

// Utility functions
import _ from "lodash";
import dayjs from "dayjs";
import { getValueTypeIconProps } from "@lib/util";

// Variables
import { GLOBAL_STYLES } from "@variables";

interface SelectOption extends OptionBase {
  label: string;
  value: string;
  inferredType?: IValueType;
}

interface ValueTypeOption extends OptionBase {
  label: string;
  value: IValueType;
}

/**
 * Custom styling for each Value `type`, displaying colored icons
 */
const ValueTypeOption = (props: OptionProps<ValueTypeOption>) => {
  const iconProps = getValueTypeIconProps(props.data.value);
  return (
    <components.Option {...props}>
      <Flex direction={"row"} h={"6"} p={"0.5"} gap={"1"} align={"center"} _hover={{ bg: "gray.100" }}>
        <Icon name={iconProps.name} size={"xs"} color={iconProps.color} />
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
  const iconProps = getValueTypeIconProps(props.data.value);
  return (
    <Flex direction={"row"} align={"center"}>
      <components.SingleValue {...props}>
        <Flex direction={"row"} align={"center"} gap={"2"}>
          <Icon name={iconProps.name} size={"xs"} color={iconProps.color} />
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
      border={GLOBAL_STYLES.border.style}
      borderColor={GLOBAL_STYLES.border.color}
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
      <Flex direction={"row"} h={"8"} p={"0.5"} gap={"1"} align={"center"} _hover={{ bg: "gray.100" }}>
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
 * Custom styling for Value `data` `MenuList` component containing all menu options
 */
const ValueDataMenuList = (props: MenuListProps<SelectOption, false>) => {
  return (
    <Flex
      direction={"column"}
      border={GLOBAL_STYLES.border.style}
      borderColor={GLOBAL_STYLES.border.color}
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
  const [addOptionDialogOpen, setAddOptionDialogOpen] = useState(false);

  // Additional state
  const [newOption, setNewOption] = useState<string>("");
  const [invalidOption, setInvalidOption] = useState(true);

  /**
   * Update the `newOption` state and perform error check to ensure
   * only valid Options are entered
   * @param value Updated Option value entered through dialog
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
    setAddOptionDialogOpen(false);
  };

  // Handle canceling select options
  const cancelSelectOptions = () => {
    setNewOption("");
    setAddOptionDialogOpen(false);
  };

  // Handle opening select options dialog
  const openSelectDialog = () => {
    setOptions([]);
    setNewOption("");
    setAddOptionDialogOpen(true);
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
          chakraStyles={{
            menu: (provided) => ({ ...provided, marginY: 0 }),
          }}
          styles={{
            menuPortal: (base) => ({
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
          }}
          closeMenuOnScroll={false}
        />
      ) : (
        <Flex
          w={"100%"}
          h={"100%"}
          p={"0"}
          gap={"2"}
          align={"center"}
          justify={"center"}
          border={"1px solid transparent"}
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
              openSelectDialog();
            }
          }}
        >
          <Icon name={"add"} color={"green"} size={"xs"} />
          <Text fontSize={"xs"} fontWeight={"semibold"} color={"green"}>
            Add Options
          </Text>
        </Flex>
      )}

      {/* Select Add Options Dialog */}
      <Dialog.Root open={addOptionDialogOpen} size={"sm"} placement={"center"} closeOnEscape closeOnInteractOutside>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header p={"0"} roundedTop={"md"} bg={GLOBAL_STYLES.dialog.headerColor}>
              <Flex direction={"row"} align={"center"} gap={"1"} p={"2"}>
                <Icon name={"v_select"} />
                <Text fontSize={"xs"} fontWeight={"semibold"}>
                  Add Options
                </Text>
              </Flex>
              <Dialog.CloseTrigger asChild>
                <CloseButton size={"2xs"} top={"6px"} onClick={cancelSelectOptions} />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body p={"1"} gap={"1"} pb={"1"}>
              <Flex direction={"column"} gap={"1"}>
                <Flex direction={"row"} gap={"1"}>
                  <Field.Root invalid={invalidOption} gap={"1"}>
                    <Input
                      size={"xs"}
                      rounded={"md"}
                      placeholder={"Enter Option"}
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
                  <Button
                    colorPalette={"green"}
                    size={"xs"}
                    rounded={"md"}
                    onClick={addOption}
                    disabled={invalidOption}
                  >
                    Add
                    <Icon name={"add"} />
                  </Button>
                </Flex>
                <Box>
                  <Stack gap={"1"} separator={<Separator />} pb={"1"} maxH={"200px"} overflowY={"auto"}>
                    {options.length > 0 ? (
                      options.map((option, index) => (
                        <Flex
                          key={option.value}
                          direction={"row"}
                          cursor={props.viewOnly ? "default" : "text"}
                          onClick={props.viewOnly ? (e) => e.preventDefault() : undefined}
                          justify={"space-between"}
                          align={"center"}
                        >
                          <Flex gap={"1"}>
                            <Text fontWeight={"semibold"} fontSize={"xs"} ml={"0.5"}>
                              Option {index + 1}:
                            </Text>
                            <Text fontSize={"xs"}>{option.value}</Text>
                          </Flex>
                          <IconButton
                            aria-label={`remove_${index}`}
                            size={"2xs"}
                            colorPalette={"red"}
                            onClick={() => removeOption(option)}
                          >
                            <Icon name={"delete"} />
                          </IconButton>
                        </Flex>
                      ))
                    ) : (
                      <Flex
                        cursor={props.viewOnly ? "default" : "text"}
                        onClick={props.viewOnly ? (e) => e.preventDefault() : undefined}
                        align={"center"}
                        justify={"center"}
                        minH={"60px"}
                        rounded={"md"}
                        border={GLOBAL_STYLES.border.style}
                        borderColor={GLOBAL_STYLES.border.color}
                      >
                        <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.400"}>
                          No Options added
                        </Text>
                      </Flex>
                    )}
                  </Stack>
                </Box>
              </Flex>
            </Dialog.Body>
            <Dialog.Footer p={"1"} bg={GLOBAL_STYLES.dialog.footerColor} roundedBottom={"md"}>
              <Button size={"xs"} rounded={"md"} colorPalette={"red"} onClick={cancelSelectOptions}>
                Cancel
                <Icon name={"cross"} />
              </Button>
              <Spacer />
              <Button
                size={"xs"}
                rounded={"md"}
                colorPalette={"green"}
                onClick={confirmSelectOptions}
                disabled={options.length === 0}
              >
                Confirm
                <Icon name={"check"} />
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
};

/**
 * Custom styling for column picker `Control` component
 */
const ColumnPickerControl = (props: ControlProps<SelectOption, false>) => (
  <Box pl={"1"} pr={"3"} border={"1px solid transparent"} _hover={{ borderColor: "blue.300" }}>
    <components.Control {...props} />
  </Box>
);

/**
 * Custom styling for column picker `ValueContainer` component
 */
const ColumnPickerValueContainer = ({ children, ...props }: ValueContainerProps<SelectOption>) => (
  <components.ValueContainer {...props}>
    <Flex w={"100%"} h={"34px"} align={"center"} fontSize={"xs"}>
      {children}
    </Flex>
  </components.ValueContainer>
);

/**
 * Custom styling for column picker `Placeholder` component
 */
const ColumnPickerPlaceholder = (props: PlaceholderProps<SelectOption>) => (
  <components.Placeholder {...props}>
    <Flex direction={"row"} align={"center"} gap={"1"}>
      <Icon name={"grid"} size={"xs"} color={"gray.400"} />
      <Text fontSize={"xs"} color={"gray.400"}>
        {props.children}
      </Text>
    </Flex>
  </components.Placeholder>
);

/**
 * Custom styling for each column picker `Option` component, displaying icon
 */
const ColumnPickerOption = (props: OptionProps<SelectOption>) => {
  const iconProps = getValueTypeIconProps(props.data.inferredType);
  return (
    <components.Option {...props}>
      <Flex direction={"row"} h={"6"} p={"0.5"} gap={"1"} align={"center"} _hover={{ bg: "gray.100" }}>
        <Icon name={iconProps.name} size={"xs"} color={iconProps.color} />
        <Text fontSize={"xs"}>{props.data.label}</Text>
      </Flex>
    </components.Option>
  );
};

/**
 * Custom styling for column picker `SingleValue` component
 */
const ColumnPickerSingleValue = ({ ...props }: SingleValueProps<SelectOption>) => {
  const iconProps = getValueTypeIconProps(props.data.inferredType);
  return (
    <Flex direction={"row"} align={"center"}>
      <components.SingleValue {...props}>
        <Flex direction={"row"} align={"center"} gap={"2"}>
          {iconProps ? (
            <Icon name={iconProps.name} size={"xs"} color={iconProps.color} />
          ) : (
            <Icon name={"grid"} size={"xs"} color={"gray.400"} />
          )}
          <Text fontSize={"xs"}>{props.data.label}</Text>
        </Flex>
      </components.SingleValue>
    </Flex>
  );
};

const PAGE_SIZE_OPTIONS = [
  { label: "5", value: "5" },
  { label: "10", value: "10" },
  { label: "20", value: "20" },
  { label: "50", value: "50" },
  { label: "100", value: "100" },
];

/**
 * A spreadsheet-like interface for editing key-value data with type selection,
 * name, and value columns
 */
const Values = (props: {
  values: IValue[];
  setValues: (values: React.SetStateAction<IValue[]>) => void;
  viewOnly?: boolean;
  permittedValues?: ColumnInfo[];
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

  const allSelected = props.values.length > 0 && props.values.every((v) => selectedRows.has(v._id));
  const someSelected = !allSelected && props.values.some((v) => selectedRows.has(v._id));

  const toggleSelectRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(props.values.map((v) => v._id)));
    }
  };

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
   * Handles mouse movement during a column resize. Stable reference via useCallback prevents
   * stale closures in the document listener registered by handleResizeStart.
   * @param event Mouse event
   */
  const handleResizeMove = useCallback((event: MouseEvent) => {
    if (!resizeRef.current) return;
    const { column, startX, startWidth, otherFixedWidth } = resizeRef.current;
    const containerWidth = tableRef.current?.offsetWidth ?? Infinity;
    // For name and type, reserve space for the value column's minimum width
    const maxWidth = containerWidth - otherFixedWidth - (column !== "value" ? minColumnWidths.value : 0);
    const newWidth = Math.min(maxWidth, Math.max(minColumnWidths[column], startWidth + (event.clientX - startX)));
    setColumnWidths((prev) => ({ ...prev, [column]: newWidth }));
  }, []);

  /**
   * Cleans up after a column resize by removing document-level listeners.
   * Stable reference via useCallback ensures the correct listener is removed.
   */
  const handleResizeEnd = useCallback(() => {
    resizeRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  }, [handleResizeMove]);

  /**
   * Initiates a column resize drag, recording the start state and attaching document listeners.
   * @param {ValuesColumn} column Column being resized
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
   * @param source Optional source mode used in import context
   */
  const onValueChange = (_id: string, name: string, type: IValueType, data: string, source?: "column" | "value") => {
    const updatedValues = _.cloneDeep(props.values).map((value) => {
      if (value._id === _id) {
        value.name = name;
        value.type = type;
        value.data = data;
        value.source = source;
      }
      return value;
    });
    props.setValues(updatedValues);
  };

  return (
    <Box w={"100%"} display={"flex"} flexDirection={"column"} css={{ WebkitOverflowScrolling: "touch" }}>
      {/* Table */}
      <Box flex={"1"} minH={"0"} overflowX={"auto"} overflowY={"auto"}>
        <Box
          ref={tableRef}
          minW={"800px"}
          w={"100%"}
          border={GLOBAL_STYLES.border.style}
          borderColor={GLOBAL_STYLES.border.color}
          borderRadius={"md"}
          overflow={"hidden"}
        >
          {/* Header Row */}
          <Flex gap={0} bg={"gray.100"} borderBottom={"1px solid"} borderColor={"gray.200"} direction={"row"}>
            {/* Select Column Header */}
            {!props.viewOnly && (
              <Flex
                w={"40px"}
                flex={"0 0 auto"}
                minW={"40px"}
                px={1}
                py={1}
                align={"center"}
                justify={"center"}
                bg={"gray.100"}
                borderRight={"1px solid"}
                borderColor={"gray.200"}
                overflow={"hidden"}
                flexShrink={0}
              >
                <Checkbox.Root
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleSelectAll}
                  size={"xs"}
                  colorPalette={"blue"}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                </Checkbox.Root>
              </Flex>
            )}

            {/* Name Column Header */}
            <Flex
              w={`${columnWidths.name}px`}
              flex={"0 0 auto"}
              minW={`${columnWidths.name}px`}
              px={1}
              py={1}
              fontSize={"xs"}
              fontWeight={"semibold"}
              color={"gray.600"}
              bg={"gray.100"}
              borderRight={"1px solid"}
              borderColor={"gray.200"}
              position={"relative"}
              textAlign={"center"}
              lineHeight={"1.2"}
              align={"center"}
              justify={"center"}
              overflow={"hidden"}
              flexShrink={0}
            >
              <Text textAlign={"center"}>Name</Text>
              {/* Resize Handle */}
              <Box
                position={"absolute"}
                right={"-1px"}
                top={"0"}
                bottom={"0"}
                width={"3px"}
                cursor={"col-resize"}
                bg={"transparent"}
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
              fontSize={"xs"}
              fontWeight={"semibold"}
              color={"gray.600"}
              bg={"gray.100"}
              borderRight={"1px solid"}
              borderColor={"gray.200"}
              position={"relative"}
              textAlign={"center"}
              lineHeight={"1.2"}
              align={"center"}
              justify={"center"}
              overflow={"hidden"}
              flexShrink={0}
            >
              <Text textAlign={"center"}>Type</Text>
              {/* Resize Handle */}
              <Box
                position={"absolute"}
                right={"-1px"}
                top={"0"}
                bottom={"0"}
                width={"3px"}
                cursor={"col-resize"}
                bg={"transparent"}
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
              color={"gray.600"}
              bg={"gray.100"}
              position={"relative"}
              textAlign={"center"}
              lineHeight={"1.2"}
              align={"center"}
              justify={"center"}
              overflow={"hidden"}
              flexShrink={0}
            >
              <Text textAlign={"center"}>Value</Text>
              {/* Resize Handle */}
              <Box
                position={"absolute"}
                right={"-1px"}
                top={"0"}
                bottom={"0"}
                width={"3px"}
                cursor={"col-resize"}
                bg={"transparent"}
                _hover={{ bg: "blue.300" }}
                onMouseDown={(e) => handleResizeStart("value", e)}
                zIndex={10}
              />
            </Flex>
          </Flex>

          {/* Data Rows */}
          <Box overflowY={"auto"} overflowX={"hidden"}>
            {paginatedValues.map((value, index) => (
              <ValueRow
                key={value._id}
                value={value}
                onValueChange={onValueChange}
                onToggleSelect={() => toggleSelectRow(value._id)}
                columnWidths={columnWidths}
                isSelected={selectedRows.has(value._id)}
                hideBorder={index >= paginatedValues.length - 1}
                viewOnly={props.viewOnly}
                permittedValues={props.permittedValues}
              />
            ))}
          </Box>

          {/* Add Row Button */}
          {!props.viewOnly && (
            <Flex
              borderTop={"1px solid"}
              borderColor={"gray.200"}
              p={0}
              justify={"center"}
              align={"center"}
              bg={"gray.100"}
            >
              <Button
                id={"addValueRowButton"}
                size={"xs"}
                variant={"ghost"}
                colorPalette={"green"}
                onClick={addRow}
                aria-label={"Add value"}
                w={"100%"}
                h={"fit-content"}
                p={"0.5"}
              >
                <Icon name={"add"} size={"xs"} />
                <Text ml={1} fontSize={"xs"} fontWeight={"semibold"}>
                  Add Value
                </Text>
              </Button>
            </Flex>
          )}
        </Box>
      </Box>

      {/* Pagination Toolbar */}
      <Flex
        gap={2}
        align={"center"}
        wrap={"wrap"}
        justify={{ base: "space-between", sm: "space-between" }}
        w={"100%"}
        mt={2}
        flexShrink={0}
      >
        <Flex direction={"row"} gap={2} align={"center"} wrap={"wrap"}>
          <IconButton
            variant={"outline"}
            size={"xs"}
            rounded={"md"}
            aria-label={"first page"}
            onClick={() => setCurrentPage(1)}
            disabled={currentPage <= 1}
          >
            <Icon name={"c_double_left"} />
          </IconButton>
          <IconButton
            variant={"outline"}
            size={"xs"}
            rounded={"md"}
            aria-label={"previous page"}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            <Icon name={"c_left"} />
          </IconButton>
          {totalPages > 0 && (
            <Flex gap={1}>
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {currentPage}
              </Text>
              <Text fontSize={"xs"}> of </Text>
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {totalPages}
              </Text>
            </Flex>
          )}
          <IconButton
            variant={"outline"}
            size={"xs"}
            rounded={"md"}
            aria-label={"next page"}
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
          >
            <Icon name={"c_right"} />
          </IconButton>
          <IconButton
            variant={"outline"}
            size={"xs"}
            rounded={"md"}
            aria-label={"last page"}
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
          >
            <Icon name={"c_double_right"} />
          </IconButton>
          {!props.viewOnly && (
            <Menu.Root>
              <Menu.Trigger asChild>
                <Button colorPalette={"yellow"} size={"xs"} rounded={"md"}>
                  Actions
                  <Icon name={"lightning"} size={"xs"} />
                </Button>
              </Menu.Trigger>
              <Menu.Positioner>
                <Menu.Content p={1} rounded={"md"}>
                  <Menu.Item
                    value={"remove"}
                    disabled={selectedRows.size === 0}
                    onClick={() => {
                      if (selectedRows.size > 0) removeSelectedRows();
                    }}
                  >
                    <Flex direction={"row"} gap={"1"} align={"center"}>
                      <Icon name={"delete"} size={"xs"} />
                      <Text fontSize={"xs"}>Remove Values ({selectedRows.size})</Text>
                    </Flex>
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Root>
          )}
        </Flex>

        <Flex direction={"row"} gap={1} align={"center"} wrap={"wrap"}>
          <Text fontSize={"xs"} display={{ base: "none", sm: "block" }}>
            Show:
          </Text>
          <Fieldset.Root w={"fit-content"}>
            <Fieldset.Content>
              <Field.Root>
                <Select.Root
                  size={"xs"}
                  w={"80px"}
                  collection={createListCollection({ items: PAGE_SIZE_OPTIONS })}
                  value={[rowsPerPage.toString()]}
                  onValueChange={(details) => setRowsPerPage(parseInt(details.value[0]))}
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger rounded={"md"}>
                      <Select.ValueText placeholder={"Page Size"} />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {PAGE_SIZE_OPTIONS.map((count) => (
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
  value: IValue;
  onValueChange: (_id: string, name: string, type: IValueType, data: string, source?: "column" | "value") => void;
  onToggleSelect: () => void;
  columnWidths: { type: number; name: number; value: number };
  isSelected: boolean;
  hideBorder?: boolean;
  viewOnly?: boolean;
  permittedValues?: ColumnInfo[];
}) => {
  // In import mode (permittedValues present), the source toggles between column reference and fixed value
  const [source, setSource] = useState<"column" | "value">(props.value.source ?? "column");

  const inColumnMode = props.permittedValues !== undefined && source === "column";

  const baseTypeOptions: ValueTypeOption[] = [
    { label: "Number", value: "number" },
    { label: "Text", value: "text" },
    { label: "URL", value: "url" },
    { label: "Date", value: "date" },
  ];
  // In column mode, entity and select are not meaningful since they cannot be round-tripped from raw cell data
  const valueTypeOptions: ValueTypeOption[] = inColumnMode
    ? baseTypeOptions
    : [...baseTypeOptions, { label: "Entity", value: "entity" }, { label: "Select", value: "select" }];

  // Get the initial `ValueTypeOption` based on the `IValue` type
  const initialValueType = valueTypeOptions.find((v) => v.value === props.value.type) ?? baseTypeOptions[1];

  // React state for value display
  const [valueName, setValueName] = useState(props.value.name);
  const [valueType, setValueType] = useState<IValueType>(props.value.type);
  const [valueTypeOption, setValueTypeOption] = useState<ValueTypeOption>(initialValueType);
  let initialData = props.value.data;
  if (inColumnMode && !props.permittedValues?.some((c) => c.name === props.value.data)) {
    initialData = "";
  }
  const [valueData, setValueData] = useState<string>(props.permittedValues ? initialData : props.value.data);

  useEffect(() => {
    // Propagate changes to overall `Value` state, including source in import mode
    props.onValueChange(props.value._id, valueName, valueType, valueData, props.permittedValues ? source : undefined);
  }, [valueName, valueType, valueData, source]);

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
    let iconColor = GLOBAL_STYLES.project.iconColor;

    if (isValidUrl) {
      if (urlObject.host === "box.com" || urlObject.host.endsWith(".box.com")) {
        iconStyle = "l_box";
        badgeBg = "blue.50";
        badgeBorder = "blue.100";
        iconColor = GLOBAL_STYLES.project.iconColor;
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
                border={GLOBAL_STYLES.border.style}
                borderColor={GLOBAL_STYLES.border.color}
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
              border={GLOBAL_STYLES.border.style}
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
    toaster.create({
      title: "Copied to clipboard",
      type: "success",
      duration: 2000,
      closable: true,
    });
  };

  // Render data input based on type
  const renderDataInput = (valueType: IValueType) => {
    if (valueType === "number") {
      return (
        <Input
          value={valueData}
          onChange={(e) => setValueData(e.target.value)}
          size={"xs"}
          h={"100%"}
          borderRadius={"none"}
          fontSize={"xs"}
          type={"number"}
          readOnly={props.viewOnly}
          placeholder={"Enter number"}
          border={"1px solid transparent"}
          bg={"transparent"}
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
          size={"xs"}
          h={"100%"}
          borderRadius={"none"}
          fontSize={"xs"}
          readOnly={props.viewOnly}
          placeholder={"Enter text"}
          border={"1px solid transparent"}
          bg={"transparent"}
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
            size={"xs"}
            h={"100%"}
            borderRadius={"none"}
            fontSize={"xs"}
            readOnly={props.viewOnly}
            placeholder={"Enter URL"}
            border={"1px solid transparent"}
            bg={"transparent"}
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
          size={"xs"}
          h={"100%"}
          borderRadius={"none"}
          fontSize={"xs"}
          type={"date"}
          readOnly={props.viewOnly}
          border={"1px solid transparent"}
          bg={"transparent"}
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
          w={"100%"}
          h={"100%"}
          p={"0"}
          align={"center"}
          justify={"center"}
          border={"1px solid transparent"}
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
            w={"100%"}
            h={"100%"}
            p={"0"}
            align={"center"}
            justify={"center"}
            border={"1px solid transparent"}
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
            justify={"start"}
            align={"center"}
            pt={"0.5"}
            px={"2"}
            border={"1px solid transparent"}
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
            <Linky type={"entities"} id={JSON.parse(valueData)._id || ""} size={"xs"} />
          </Flex>
        );
      }
    } else {
      return (
        <Input
          value={valueData}
          onChange={(e) => setValueData(e.target.value)}
          size={"xs"}
          h={props.viewOnly ? "34px" : "100%"}
          px={1}
          py={0.5}
          fontSize={"xs"}
          readOnly={props.viewOnly}
          placeholder={"Enter value"}
          border={"1px solid transparent"}
          bg={"transparent"}
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
      borderColor={"gray.200"}
      _hover={{ bg: "gray.25" }}
      overflow={"hidden"}
      bg={props.isSelected ? "blue.50" : "white"}
    >
      {/* Drag Handle Column */}
      {!props.viewOnly && (
        <Box
          w={"40px"}
          px={1}
          py={0.5}
          display={"flex"}
          alignItems={"center"}
          justifyContent={"center"}
          borderRight={"1px solid"}
          borderColor={"gray.200"}
          bg={props.isSelected ? "blue.100" : "white"}
          _hover={{ bg: props.isSelected ? "blue.200" : "gray.100" }}
          cursor={props.viewOnly ? "default" : "pointer"}
        >
          <Checkbox.Root
            checked={props.isSelected}
            onCheckedChange={() => props.onToggleSelect()}
            size={"xs"}
            colorPalette={"blue"}
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
        borderRight={"1px solid"}
        borderColor={"gray.200"}
      >
        <Input
          value={valueName}
          onChange={(e) => setValueName(e.target.value)}
          size={"xs"}
          px={1}
          py={0}
          h={"100%"}
          fontSize={"xs"}
          readOnly={props.viewOnly}
          placeholder={"Enter name"}
          border={"1px solid transparent"}
          borderRadius={"none"}
          bg={"transparent"}
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
              setValueType(event.value);
              setValueTypeOption({ label: event.label, value: event.value });
              if (props.permittedValues) {
                if (inColumnMode) {
                  // In column mode, keep the selected column only if it is still valid
                  if (!props.permittedValues.some((c) => c.name === valueData)) {
                    setValueData("");
                  }
                } else {
                  setValueData(generateDefaultData(event.value));
                }
              } else {
                setValueData(generateDefaultData(event.value));
              }
            }
          }}
          menuPortalTarget={document.body}
          menuPosition={"fixed"}
          chakraStyles={{
            menu: (provided) => ({ ...provided, marginY: 0 }),
          }}
          styles={{
            menuPortal: (base) => ({
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
          }}
          closeMenuOnScroll={false}
        />
      </Box>

      {/* Value Column */}
      <Flex
        flex={"1 1 auto"}
        minW={`${props.columnWidths.value}px`}
        p={"0"}
        overflow={"visible"}
        justify={"space-between"}
        align={"center"}
      >
        {props.permittedValues !== undefined ? (
          props.viewOnly ? (
            <Flex w={"100%"} h={"100%"} align={"center"} px={"2"}>
              <Text fontSize={"xs"} color={valueData ? "gray.700" : "gray.400"}>
                {valueData || (inColumnMode ? "No column selected" : "No value set")}
              </Text>
            </Flex>
          ) : (
            <Flex w={"100%"} h={"100%"} align={"center"} overflow={"visible"}>
              {/* Column picker or free-form input depending on source mode */}
              <Flex flex={"1 1 auto"} h={"100%"} overflow={"visible"}>
                {inColumnMode ? (
                  <ReactSelect<SelectOption>
                    options={props.permittedValues.map((col) => ({
                      label: col.name,
                      value: col.name,
                      inferredType: col.inferredType,
                    }))}
                    size={"sm"}
                    placeholder={"Select Column"}
                    value={
                      valueData
                        ? {
                            label: valueData,
                            value: valueData,
                            inferredType: props.permittedValues?.find((column) => column.name === valueData)
                              ?.inferredType,
                          }
                        : null
                    }
                    isSearchable={false}
                    onChange={(event) => {
                      if (event) setValueData(event.value);
                    }}
                    components={{
                      Control: ColumnPickerControl,
                      Placeholder: ColumnPickerPlaceholder,
                      SelectContainer: ValueDataSelectContainer,
                      ValueContainer: ColumnPickerValueContainer,
                      SingleValue: ColumnPickerSingleValue,
                      DropdownIndicator: ValueDataDropdownIndicator,
                      MenuList: ValueDataMenuList,
                      Option: ColumnPickerOption,
                    }}
                    menuPortalTarget={document.body}
                    menuPosition={"fixed"}
                    chakraStyles={{
                      menu: (provided) => ({ ...provided, marginY: 0 }),
                    }}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 15000, pointerEvents: "auto" }),
                      menuList: (base) => ({ ...base, pointerEvents: "auto" }),
                      option: (base) => ({ ...base, pointerEvents: "auto" }),
                    }}
                    closeMenuOnScroll={false}
                  />
                ) : (
                  renderDataInput(valueType)
                )}
              </Flex>
              {/* Source toggle */}
              <Button
                aria-label={inColumnMode ? "switch-to-value" : "switch-to-column"}
                size={"2xs"}
                mx={"1"}
                variant={"outline"}
                colorPalette={"gray"}
                flexShrink={0}
                onClick={() => {
                  const newSource = source === "column" ? "value" : "column";
                  setSource(newSource);
                  setValueData(newSource === "value" ? generateDefaultData(valueType) : "");
                }}
              >
                <Icon name={inColumnMode ? "grid" : "edit"} size={"xs"} />
                {inColumnMode ? "Column" : "Value"}
              </Button>
            </Flex>
          )
        ) : (
          renderDataInput(valueType)
        )}
        {props.viewOnly && valueType !== "entity" && !props.permittedValues && (
          <IconButton
            aria-label={"Copy value"}
            size={"2xs"}
            mx={"1"}
            variant={"outline"}
            colorPalette={"gray"}
            onClick={() => copyToClipboard(valueType, valueData)}
          >
            <Icon name={"copy"} size={"xs"} />
          </IconButton>
        )}
      </Flex>
    </Flex>
  );
};

export default Values;
