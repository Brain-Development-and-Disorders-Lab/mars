// React
import React, { useState, useEffect, useRef, useMemo, useCallback, ReactElement } from "react";

// Chakra UI components
import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Field,
  Flex,
  IconButton,
  Input,
  Link,
  Separator,
  Spacer,
  Stack,
  Text,
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

import { createColumnHelper } from "@tanstack/react-table";

// Custom components
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import SearchSelect from "@components/SearchSelect";
import { toaster } from "@components/Toast";
import Tooltip from "@components/Tooltip";

// Types
import { ColumnInfo, IconNames, IValue, IValueSelectData, IValueType, StyledSelectConfig } from "@types";

// Utility functions
import _ from "lodash";
import dayjs from "dayjs";
import { getValueTypeIconProps } from "@lib/util";

// Variables
import { STYLES } from "@variables";

interface SelectOption extends OptionBase {
  label: string;
  value: string;
  inferredType?: IValueType;
}

interface ValueTypeOption extends OptionBase {
  label: string;
  value: IValueType;
}

const SharedSelectContainer = <T,>({ children, ...props }: ContainerProps<T>) => (
  <Box w={"100%"}>
    <components.SelectContainer {...props}>{children}</components.SelectContainer>
  </Box>
);

const SharedMenuList = <T,>(props: MenuListProps<T, false>) => (
  <Flex
    direction={"column"}
    border={STYLES.border.style}
    borderColor={STYLES.border.color}
    bg={"white"}
    gap={"0.5"}
    p={"0.5"}
    rounded={"sm"}
  >
    <components.MenuList {...props}>{props.children}</components.MenuList>
  </Flex>
);

const SharedDropdownIndicator = <T,>(props: DropdownIndicatorProps<T, false>) => (
  <components.DropdownIndicator {...props}>
    <Icon name={props.selectProps.menuIsOpen ? "c_up" : "c_down"} size={"xs"} />
  </components.DropdownIndicator>
);

/** Builds a styled `chakra-react-select` component set, parameterized by each instance's small style differences */
const makeStyledSelectComponents = <T extends { label: string }>(config: StyledSelectConfig<T>) => {
  const Control = (props: ControlProps<T, false>) => (
    <Box
      pl={config.controlPaddingLeft}
      pr={"3"}
      border={"1px solid transparent"}
      _hover={config.controlHasBorder ? { borderColor: "blue.300" } : undefined}
    >
      <components.Control {...props} />
    </Box>
  );

  const ValueContainer = ({ children, ...props }: ValueContainerProps<T>) => (
    <components.ValueContainer {...props}>
      <Flex w={"100%"} h={config.valueContainerHeight}>
        {children}
      </Flex>
    </components.ValueContainer>
  );

  const Option = (props: OptionProps<T>) => {
    const icon = config.getIcon?.(props.data);
    return (
      <components.Option {...props}>
        <Flex
          direction={"row"}
          h={config.optionHeight}
          p={config.optionPadding}
          m={config.optionMargin}
          gap={"1"}
          align={"center"}
          _hover={{ bg: "gray.100" }}
        >
          {icon && <Icon name={icon.name} size={"xs"} color={icon.color} />}
          <Text fontSize={"xs"}>{props.data.label}</Text>
        </Flex>
      </components.Option>
    );
  };

  const SingleValue = (props: SingleValueProps<T>) => {
    const icon = config.getIcon?.(props.data);
    return (
      <Flex direction={"row"} align={"center"}>
        <components.SingleValue {...props}>
          <Flex direction={"row"} align={"center"} gap={"2"} fontSize={"xs"}>
            {icon && <Icon name={icon.name} size={"xs"} color={icon.color} />}
            {props.children}
          </Flex>
        </components.SingleValue>
      </Flex>
    );
  };

  return {
    SelectContainer: SharedSelectContainer<T>,
    MenuList: SharedMenuList<T>,
    DropdownIndicator: SharedDropdownIndicator<T>,
    Control,
    ValueContainer,
    Option,
    SingleValue,
  };
};

// Value `type` select
const valueTypeSelectComponents = makeStyledSelectComponents<ValueTypeOption>({
  getIcon: (data) => getValueTypeIconProps(data.value),
  optionHeight: "8",
  optionPadding: "1",
  optionMargin: "0.5",
  controlPaddingLeft: "2",
  controlHasBorder: false, // hover border clips against DataTable's fixed 34px cell height
  valueContainerHeight: "34px",
});

// `select`-type option picker
const valueDataSelectComponents = makeStyledSelectComponents<SelectOption>({
  optionHeight: "8",
  optionPadding: "0.5",
  controlPaddingLeft: "2",
  controlHasBorder: false,
  valueContainerHeight: "34px",
});

// Import column picker
const columnPickerSelectComponents = makeStyledSelectComponents<SelectOption>({
  getIcon: (data) => getValueTypeIconProps(data.inferredType),
  optionHeight: "6",
  optionPadding: "0.5",
  controlPaddingLeft: "1",
  controlHasBorder: true,
  valueContainerHeight: "34px",
});

/**
 * Shared styling for the plain-text `Input` cells rendered by `ValueRow` (name, and the
 * number/text/url/date/fallback branches of `renderDataInput`), which otherwise repeat the
 * same focus/hover/cursor treatment with only `type`, `placeholder`, and sizing differing.
 */
const StyledDataInput = (props: {
  value: string;
  onChange: (value: string) => void;
  viewOnly?: boolean;
  type?: "number" | "date";
  placeholder?: string;
  height?: string;
  px?: number;
  py?: number;
}) => (
  <Input
    value={props.value}
    onChange={(e) => props.onChange(e.target.value)}
    size={"xs"}
    h={props.height ?? "100%"}
    px={props.px}
    py={props.py}
    borderRadius={"none"}
    fontSize={"xs"}
    type={props.type}
    readOnly={props.viewOnly}
    placeholder={props.placeholder}
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
            Control: valueDataSelectComponents.Control,
            SelectContainer: valueDataSelectComponents.SelectContainer,
            ValueContainer: valueDataSelectComponents.ValueContainer,
            SingleValue: valueDataSelectComponents.SingleValue,
            DropdownIndicator: valueDataSelectComponents.DropdownIndicator,
            MenuList: valueDataSelectComponents.MenuList,
            Option: valueDataSelectComponents.Option,
          }}
          menuPortalTarget={document.body}
          menuPosition={"fixed"}
          chakraStyles={{
            menu: (provided) => ({ ...provided, marginY: 0 }),
            control: (provided) => ({ ...provided, minH: "34px" }), // "sm" size's default (36px) overflows the cell
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
            <Dialog.Header p={"0"} roundedTop={"md"} bg={"surface.emphasized"} color={"text.default"}>
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
            <Dialog.Body p={"2"} gap={"2"} pb={"1"}>
              <Flex direction={"column"} gap={"2"}>
                <Flex direction={"row"} gap={"2"}>
                  <Field.Root invalid={invalidOption} gap={"0.5"}>
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
                    <Icon name={"add"} size={"xs"} />
                  </Button>
                </Flex>

                <Box>
                  <Stack gap={"2"} separator={<Separator />} pb={"1"} maxH={"200px"} overflowY={"auto"}>
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
                        border={STYLES.border.style}
                        borderColor={STYLES.border.color}
                      >
                        <Text fontSize={"xs"} fontWeight={"semibold"} color={"text.faint"}>
                          No Options added
                        </Text>
                      </Flex>
                    )}
                  </Stack>
                </Box>
              </Flex>
            </Dialog.Body>
            <Dialog.Footer p={"1"} bg={STYLES.dialog.footer.bg} roundedBottom={"md"}>
              <Button size={"xs"} rounded={"md"} colorPalette={"red"} onClick={cancelSelectOptions}>
                Cancel
                <Icon name={"cross"} size={"xs"} />
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
                <Icon name={"check"} size={"xs"} />
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
};

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
      <Icon name={"grid"} size={"xs"} color={"text.faint"} />
      <Text fontSize={"xs"} color={"text.faint"}>
        {props.children}
      </Text>
    </Flex>
  </components.Placeholder>
);

// Default `data` generated for a Value when its `type` changes
const DEFAULT_VALUE_DATA: Record<IValueType, () => string> = {
  number: () => "0",
  text: () => "",
  url: () => "https://",
  date: () => dayjs(Date.now()).toISOString(),
  entity: () => JSON.stringify({ _id: "", name: "" }),
  select: () => JSON.stringify({ selected: "", options: [] }),
};

// Icon and badge styling for URLs pointing at known platforms, matched by host or subdomain
const URL_PLATFORM_STYLES: {
  host: string;
  iconStyle: IconNames;
  badgeBg: string;
  badgeBorder: string;
  iconColor: string;
}[] = [
  { host: "box.com", iconStyle: "l_box", badgeBg: "blue.100", badgeBorder: "blue.100", iconColor: "blue.600" },
  {
    host: "github.com",
    iconStyle: "l_github",
    badgeBg: "gray.100",
    badgeBorder: "gray.200",
    iconColor: STYLES.font.secondaryHeader.color,
  },
  {
    host: "labarchives.com",
    iconStyle: "l_labarchives",
    badgeBg: "purple.100",
    badgeBorder: "purple.200",
    iconColor: "purple.600",
  },
  { host: "globus.org", iconStyle: "l_globus", badgeBg: "teal.100", badgeBorder: "teal.200", iconColor: "teal.600" },
];

const DEFAULT_URL_STYLE = {
  iconStyle: "link" as IconNames,
  badgeBg: "blue.50",
  badgeBorder: "blue.100",
  iconColor: STYLES.project.color.icon,
};

const getUrlPlatformStyle = (host: string) =>
  URL_PLATFORM_STYLES.find((platform) => host === platform.host || host.endsWith(`.${platform.host}`)) ??
  DEFAULT_URL_STYLE;

const columnHelper = createColumnHelper<IValue>();

const baseTypeOptions: ValueTypeOption[] = [
  { label: "Number", value: "number" },
  { label: "Text", value: "text" },
  { label: "URL", value: "url" },
  { label: "Date", value: "date" },
];
// Entity and Select are excluded in column mode since they cannot be round-tripped from raw cell data
const fullTypeOptions: ValueTypeOption[] = [
  ...baseTypeOptions,
  { label: "Entity", value: "entity" },
  { label: "Select", value: "select" },
];

/**
 * Utility function to generate URL "tabs" representing links to known platforms
 * @param {string} url The URL stored as `data` in the Value component
 */
const generateUrlTab = (url: string): ReactElement => {
  const urlObject = URL.parse(url);
  const isValidUrl = !_.isNull(urlObject);

  // Determine platform-specific icon and badge styling
  const { iconStyle, badgeBg, badgeBorder, iconColor } = isValidUrl
    ? getUrlPlatformStyle(urlObject.host)
    : DEFAULT_URL_STYLE;

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
        <Tooltip content={`Open in new tab: ${url}`} showArrow>
          <Link href={url} _hover={{ textDecoration: "none" }} target={"_blank"} rel={"noopener noreferrer"}>
            <Flex
              direction={"row"}
              align={"center"}
              h={"22px"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              rounded={"lg"}
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
              <Flex px={"1"} align={"center"} h={"100%"} bg={"white"}>
                <Text fontSize={"xs"} fontWeight={"medium"} color={"gray.700"}>
                  {urlObject.host}
                </Text>
              </Flex>
              {/* Platform icon badge */}
              <Flex align={"center"} justify={"center"} bg={"white"} mr={"1.5"} h={"100%"}>
                <Icon name={"external"} size={"xs"} color={"gray.600"} />
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
            border={STYLES.border.style}
            borderColor={"orange.200"}
            rounded={"md"}
            overflow={"hidden"}
            cursor={"not-allowed"}
          >
            {/* Warning badge */}
            <Flex
              align={"center"}
              justify={"center"}
              bg={"status.warning.subtle"}
              px={"1.5"}
              h={"100%"}
              borderRight={"1px solid"}
              borderColor={"orange.200"}
            >
              <Icon name={"warning"} size={"xs"} color={"orange.500"} />
            </Flex>
            {/* Truncated URL */}
            <Flex px={"2"} align={"center"} h={"100%"} bg={"white"}>
              <Text fontSize={"xs"} fontWeight={"medium"} color={"text.subtle"}>
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

// Renders the `data` cell's contents for a given `IValueType`; shared by the plain and import-column-mode cases
const renderTypedInput = (params: {
  type: IValueType;
  data: string;
  onChange: (value: string) => void;
  viewOnly?: boolean;
  workspace?: string;
  isPublic?: boolean;
}): ReactElement => {
  const { type, data, onChange, viewOnly, workspace, isPublic } = params;

  if (type === "number") {
    return (
      <StyledDataInput
        value={data}
        onChange={onChange}
        viewOnly={viewOnly}
        type={"number"}
        placeholder={"Enter number"}
      />
    );
  }

  if (type === "text") {
    return <StyledDataInput value={data} onChange={onChange} viewOnly={viewOnly} placeholder={"Enter text"} />;
  }

  if (type === "url") {
    if (!viewOnly) {
      return <StyledDataInput value={data} onChange={onChange} viewOnly={viewOnly} placeholder={"Enter URL"} />;
    }
    return generateUrlTab(data);
  }

  if (type === "date") {
    return <StyledDataInput value={data} onChange={onChange} viewOnly={viewOnly} type={"date"} />;
  }

  if (type === "select") {
    return (
      <Flex
        w={"100%"}
        h={"100%"}
        p={"0"}
        align={"center"}
        justify={"center"}
        border={"1px solid transparent"}
        _focus={{ bg: "white", borderColor: "blue.300" }}
        _hover={{ border: "1px solid", borderColor: "blue.200", boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)" }}
      >
        <ValueDataSelect
          valueData={data}
          setValueData={(next) => {
            const resolved = typeof next === "function" ? (next as (prev: string) => string)(data) : next;
            onChange(resolved);
          }}
          viewOnly={viewOnly}
        />
      </Flex>
    );
  }

  if (type === "entity") {
    if (!viewOnly) {
      return (
        <Flex
          w={"100%"}
          h={"100%"}
          p={"0"}
          align={"center"}
          justify={"center"}
          border={"1px solid transparent"}
          _focus={{ bg: "white", borderColor: "blue.300" }}
          _hover={{ border: "1px solid", borderColor: "blue.200", boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)" }}
        >
          <SearchSelect
            placeholder={"Select Entity"}
            resultType={"entity"}
            value={JSON.parse(data) || { _id: "", name: "" }}
            onChange={(entity) => onChange(JSON.stringify(entity))}
            disabled={viewOnly}
            isEmbedded
          />
        </Flex>
      );
    }
    return (
      <Flex
        w={"100%"}
        h={"100%"}
        justify={"start"}
        align={"center"}
        pt={"0.5"}
        px={"2"}
        border={"1px solid transparent"}
        _focus={{ bg: "white", borderColor: "blue.300" }}
        _hover={{ border: "1px solid", borderColor: "blue.200", boxShadow: "0 0 0 1px rgba(66, 153, 225, 0.3)" }}
      >
        <Linky
          type={"entities"}
          id={JSON.parse(data)._id || ""}
          size={"xs"}
          workspace={workspace}
          isPublic={isPublic}
        />
      </Flex>
    );
  }

  return (
    <StyledDataInput
      value={data}
      onChange={onChange}
      viewOnly={viewOnly}
      placeholder={"Enter value"}
      height={viewOnly ? "34px" : "100%"}
      px={1}
      py={0.5}
    />
  );
};

// Mirrors `IValue.name` locally so fast keystrokes aren't lost while the update round-trips
const NameCell = (props: {
  value: IValue;
  onUpdate: (id: string, updates: Partial<IValue>) => void;
  viewOnly?: boolean;
}) => {
  const [name, setName] = useState(props.value.name);
  useEffect(() => setName(props.value.name), [props.value.name]);

  return (
    <StyledDataInput
      value={name}
      onChange={(value) => {
        setName(value);
        props.onUpdate(props.value._id, { name: value });
      }}
      viewOnly={props.viewOnly}
      placeholder={"Enter name"}
      px={1}
      py={0}
    />
  );
};

const TypeCell = (props: {
  value: IValue;
  onUpdate: (id: string, updates: Partial<IValue>) => void;
  viewOnly?: boolean;
  permittedValues?: ColumnInfo[];
}) => {
  const { value } = props;
  const source = value.source ?? "column";
  const inColumnMode = props.permittedValues !== undefined && source === "column";
  const typeOptions = inColumnMode ? baseTypeOptions : fullTypeOptions;
  const selected = typeOptions.find((option) => option.value === value.type) ?? baseTypeOptions[1];

  return (
    <ReactSelect
      options={typeOptions}
      size={"sm"}
      placeholder={"Type"}
      disabled={props.viewOnly}
      value={selected}
      isSearchable={false}
      components={{
        Control: valueTypeSelectComponents.Control,
        SelectContainer: valueTypeSelectComponents.SelectContainer,
        ValueContainer: valueTypeSelectComponents.ValueContainer,
        SingleValue: valueTypeSelectComponents.SingleValue,
        DropdownIndicator: valueTypeSelectComponents.DropdownIndicator,
        MenuList: valueTypeSelectComponents.MenuList,
        Option: valueTypeSelectComponents.Option,
      }}
      onChange={(event) => {
        if (!event) return;
        if (props.permittedValues && inColumnMode) {
          const stillValid = props.permittedValues.some((column) => column.name === value.data);
          props.onUpdate(value._id, { type: event.value, data: stillValid ? value.data : "" });
        } else {
          props.onUpdate(value._id, { type: event.value, data: DEFAULT_VALUE_DATA[event.value]() });
        }
      }}
      menuPortalTarget={document.body}
      menuPosition={"fixed"}
      chakraStyles={{
        menu: (provided) => ({ ...provided, marginY: 0 }),
        control: (provided) => ({ ...provided, minH: "34px" }),
      }}
      styles={{
        menuPortal: (base) => ({ ...base, zIndex: 15000, pointerEvents: "auto" }),
        menuList: (base) => ({ ...base, pointerEvents: "auto" }),
        option: (base) => ({ ...base, pointerEvents: "auto" }),
      }}
      closeMenuOnScroll={false}
    />
  );
};

// Renders the type-specific editor, plus (in import mode) the column-reference/fixed-value toggle
const ValueCell = (props: {
  value: IValue;
  onUpdate: (id: string, updates: Partial<IValue>) => void;
  viewOnly?: boolean;
  permittedValues?: ColumnInfo[];
  workspace?: string;
  isPublic?: boolean;
}) => {
  const { value } = props;
  const source = value.source ?? "column";
  const inColumnMode = props.permittedValues !== undefined && source === "column";

  // Mirrored locally (normalized against a stale column reference) to avoid lag while typing
  const [data, setData] = useState(() => {
    if (inColumnMode && props.permittedValues && !props.permittedValues.some((column) => column.name === value.data)) {
      return "";
    }
    return value.data;
  });
  const lastPropData = useRef(value.data);

  useEffect(() => {
    if (value.data !== lastPropData.current) {
      lastPropData.current = value.data;
      setData(value.data);
    }
  }, [value.data]);

  // Persist any normalization performed while initializing local state back to `props.values`
  const didNormalize = useRef(false);
  useEffect(() => {
    if (didNormalize.current) return;
    didNormalize.current = true;
    if (data !== value.data) {
      props.onUpdate(value._id, { data });
    }
  }, []);

  const commitData = (next: string) => {
    setData(next);
    lastPropData.current = next;
    props.onUpdate(value._id, { data: next });
  };

  return (
    <Flex w={"100%"} h={"100%"} p={"0"} overflow={"visible"} justify={"space-between"} align={"center"}>
      {props.permittedValues !== undefined ? (
        props.viewOnly ? (
          <Flex w={"100%"} h={"100%"} align={"center"} px={"2"}>
            <Text fontSize={"xs"} color={data ? "gray.700" : "gray.400"}>
              {data || (inColumnMode ? "No column selected" : "No value set")}
            </Text>
          </Flex>
        ) : (
          <Flex w={"100%"} h={"100%"} align={"center"} overflow={"visible"}>
            <Flex flex={"1 1 auto"} h={"100%"} overflow={"visible"}>
              {inColumnMode ? (
                <ReactSelect<SelectOption>
                  options={props.permittedValues.map((column) => ({
                    label: column.name,
                    value: column.name,
                    inferredType: column.inferredType,
                  }))}
                  size={"sm"}
                  placeholder={"Select Column"}
                  value={
                    data
                      ? {
                          label: data,
                          value: data,
                          inferredType: props.permittedValues?.find((column) => column.name === data)?.inferredType,
                        }
                      : null
                  }
                  isSearchable={false}
                  onChange={(event) => {
                    if (event) commitData(event.value);
                  }}
                  components={{
                    Control: columnPickerSelectComponents.Control,
                    Placeholder: ColumnPickerPlaceholder,
                    SelectContainer: columnPickerSelectComponents.SelectContainer,
                    ValueContainer: ColumnPickerValueContainer,
                    SingleValue: columnPickerSelectComponents.SingleValue,
                    DropdownIndicator: columnPickerSelectComponents.DropdownIndicator,
                    MenuList: columnPickerSelectComponents.MenuList,
                    Option: columnPickerSelectComponents.Option,
                  }}
                  menuPortalTarget={document.body}
                  menuPosition={"fixed"}
                  chakraStyles={{
                    menu: (provided) => ({ ...provided, marginY: 0 }),
                    control: (provided) => ({ ...provided, minH: "34px" }),
                  }}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 15000, pointerEvents: "auto" }),
                    menuList: (base) => ({ ...base, pointerEvents: "auto" }),
                    option: (base) => ({ ...base, pointerEvents: "auto" }),
                  }}
                  closeMenuOnScroll={false}
                />
              ) : (
                renderTypedInput({
                  type: value.type,
                  data,
                  onChange: commitData,
                  viewOnly: props.viewOnly,
                  workspace: props.workspace,
                  isPublic: props.isPublic,
                })
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
                const nextData = newSource === "value" ? DEFAULT_VALUE_DATA[value.type]() : "";
                setData(nextData);
                lastPropData.current = nextData;
                props.onUpdate(value._id, { source: newSource, data: nextData });
              }}
            >
              <Icon name={inColumnMode ? "grid" : "edit"} size={"xs"} />
              {inColumnMode ? "Column" : "Value"}
            </Button>
          </Flex>
        )
      ) : (
        renderTypedInput({
          type: value.type,
          data,
          onChange: commitData,
          viewOnly: props.viewOnly,
          workspace: props.workspace,
          isPublic: props.isPublic,
        })
      )}
      {props.viewOnly && value.type !== "entity" && !props.permittedValues && (
        <IconButton
          aria-label={"Copy value"}
          size={"2xs"}
          mx={"1"}
          variant={"outline"}
          colorPalette={"gray"}
          onClick={() => copyToClipboard(value.type, data)}
        >
          <Icon name={"copy"} size={"xs"} />
        </IconButton>
      )}
    </Flex>
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
  permittedValues?: ColumnInfo[];
  workspace?: string;
  isPublic?: boolean;
}) => {
  // Counter for unique IDs
  const idCounter = useRef(0);

  const onUpdateValue = useCallback(
    (id: string, updates: Partial<IValue>) => {
      props.setValues((current) => current.map((value) => (value._id === id ? { ...value, ...updates } : value)));
    },
    [props.setValues],
  );

  // Default data for new rows
  const createNewValue = (suffix?: string): IValue => ({
    _id: `v_${Date.now()}_${++idCounter.current}_${suffix || Math.random().toString(36).slice(2, 9)}`,
    name: "",
    type: "text",
    data: "",
  });

  const addRow = () => {
    props.setValues([...props.values, createNewValue()]);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => <NameCell value={info.row.original} onUpdate={onUpdateValue} viewOnly={props.viewOnly} />,
        meta: { minWidth: 220, noPadding: true },
      }),
      columnHelper.accessor("type", {
        header: "Type",
        cell: (info) => (
          <TypeCell
            value={info.row.original}
            onUpdate={onUpdateValue}
            viewOnly={props.viewOnly}
            permittedValues={props.permittedValues}
          />
        ),
        meta: { minWidth: 120, noPadding: true },
      }),
      columnHelper.accessor("data", {
        header: "Data",
        cell: (info) => (
          <ValueCell
            value={info.row.original}
            onUpdate={onUpdateValue}
            viewOnly={props.viewOnly}
            permittedValues={props.permittedValues}
            workspace={props.workspace}
            isPublic={props.isPublic}
          />
        ),
        meta: { minWidth: 260, noPadding: true },
      }),
    ],
    [onUpdateValue, props.viewOnly, props.permittedValues, props.workspace, props.isPublic],
  );

  return (
    <DataTable
      columns={columns}
      data={props.values}
      visibleColumns={{}}
      selectedRows={{}}
      showSelection={!props.viewOnly}
      viewOnly={props.viewOnly}
      resizableColumns
      showPagination
      pageSize={10}
      actions={[
        {
          label: (count: number) => `Remove Values (${count})`,
          icon: "delete",
          action: (table, rows) => {
            const ids = new Set(Object.keys(rows).map((rowIndex) => table.getRow(rowIndex).original._id as string));
            props.setValues((current) => current.filter((value) => !ids.has(value._id)));
          },
        },
      ]}
      footerAction={props.viewOnly ? undefined : { label: "Add Value", icon: "add", onClick: addRow }}
    />
  );
};

export default Values;
