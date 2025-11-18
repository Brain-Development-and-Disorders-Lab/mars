// React
import React, { useEffect, useMemo, useRef, useState } from "react";

// Existing and custom components
import {
  Button,
  CloseButton,
  Dialog,
  EmptyState,
  Field,
  Fieldset,
  Flex,
  IconButton,
  Input,
  Link,
  Portal,
  Select,
  Separator,
  Spacer,
  Stack,
  Text,
  createListCollection,
} from "@chakra-ui/react";
import { createColumnHelper, Row } from "@tanstack/react-table";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import SearchSelect from "@components/SearchSelect";
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";

// Existing and custom types
import {
  DataTableAction,
  GenericValueType,
  IGenericItem,
  IValue,
  IValueType,
} from "@types";

// Utility functions and libraries
import _ from "lodash";
import dayjs from "dayjs";

/**
 * Values component use to display a collection of Values and enable
 * creating and deleting Values. Displays collection as cards.
 * @param props collection of props to construct component
 * @returns
 */
const Values = (props: {
  viewOnly: boolean;
  values: IValue<GenericValueType>[];
  setValues: (value: React.SetStateAction<IValue<GenericValueType>[]>) => void;
  requireData?: true | false;
  permittedValues?: string[];
}) => {
  const [selectOpen, setSelectOpen] = useState(false);
  const [option, setOption] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [editingValueId, setEditingValueId] = useState<string | null>(null);

  // Value type dropdown ref
  const selectValueTypeRef = useRef(null);

  const columnHelper = createColumnHelper<IValue<GenericValueType>>();
  const columns = useMemo(
    () => [
      // Value `type` column
      columnHelper.accessor("type", {
        cell: ({ getValue, row: { index }, column: { id }, table }) => {
          const initialValue = getValue();
          const [valueType, setValueType] = useState<IValueType>(initialValue);

          useEffect(() => {
            setValueType(initialValue);
          }, [initialValue]);

          const onTypeChange = (value: string) => {
            const typedValue = value as IValueType;
            setValueType(typedValue);

            // Update the type in the table
            table.options.meta?.updateData(index, id, typedValue);

            // Reset the data field based on the new type
            let data: GenericValueType;
            switch (typedValue) {
              case "number":
                data = 0;
                break;
              case "text":
                data = "";
                break;
              case "url":
                data = "";
                break;
              case "date":
                data = dayjs(Date.now()).toISOString();
                break;
              case "entity":
                data = "";
                break;
              case "select":
                data = {
                  selected: "",
                  options: [] as IGenericItem[],
                };
                break;
              default:
                data = "";
            }

            // Update the data field
            table.options.meta?.updateData(index, "data", data);
          };

          // Setup icon for value type
          let typeIcon: React.ReactElement;
          switch (valueType) {
            case "number": {
              typeIcon = (
                <Icon size={"sm"} name={"v_number"} color={"green.300"} />
              );
              break;
            }
            case "text": {
              typeIcon = (
                <Icon size={"sm"} name={"v_text"} color={"blue.300"} />
              );
              break;
            }
            case "url": {
              typeIcon = (
                <Icon size={"sm"} name={"v_url"} color={"yellow.300"} />
              );
              break;
            }
            case "date": {
              typeIcon = (
                <Icon size={"sm"} name={"v_date"} color={"orange.300"} />
              );
              break;
            }
            case "select": {
              typeIcon = (
                <Icon size={"sm"} name={"v_select"} color={"cyan.300"} />
              );
              break;
            }
            case "entity":
            default: {
              typeIcon = (
                <Icon size={"sm"} name={"entity"} color={"purple.300"} />
              );
              break;
            }
          }

          // Apply casing for display
          let displayType: string;
          if (valueType === "url") {
            displayType = _.upperCase(valueType);
          } else {
            displayType = _.capitalize(valueType);
          }

          // Show dropdown in edit mode, otherwise show read-only display
          if (!props.viewOnly) {
            const typeOptions = [
              { value: "number", label: "Number" },
              { value: "text", label: "Text" },
              { value: "url", label: "URL" },
              { value: "date", label: "Date" },
              { value: "entity", label: "Entity" },
              { value: "select", label: "Select" },
            ];

            return (
              <Flex
                align={"center"}
                justify={"left"}
                gap={"3"}
                w={"100%"}
                minW={"140px"}
              >
                <Flex flexShrink={0}>{typeIcon}</Flex>
                <Select.Root
                  size={"sm"}
                  collection={createListCollection<{
                    value: string;
                    label: string;
                  }>({
                    items: typeOptions,
                  })}
                  onValueChange={(details) =>
                    onTypeChange(details.items[0].value)
                  }
                >
                  <Select.HiddenSelect />
                  <Select.Control>
                    <Select.Trigger minW={"100px"}>
                      <Select.ValueText placeholder={displayType} />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Select.Indicator />
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal container={selectValueTypeRef}>
                    <Select.Positioner>
                      <Select.Content zIndex={9999}>
                        {typeOptions.map((option) => (
                          <Select.Item item={option} key={option.value}>
                            {option.label}
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              </Flex>
            );
          } else {
            return (
              <Flex
                align={"center"}
                justify={"left"}
                gap={"3"}
                w={"100%"}
                minW={"140px"}
              >
                <Flex flexShrink={0}>{typeIcon}</Flex>
                <Text fontWeight={"semibold"} color={"gray.500"}>
                  {displayType}
                </Text>
              </Flex>
            );
          }
        },
        header: "Type",
        size: 160,
        minSize: 160,
        maxSize: 160,
      }),

      // Value `name` column
      columnHelper.accessor("name", {
        cell: ({
          getValue,
          row: { index, original },
          column: { id },
          table,
        }) => {
          const initialValue = getValue();
          const [value, setValue] = useState(initialValue);
          useEffect(() => {
            setValue(initialValue);
          }, [initialValue]);

          const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            setValue(event.target.value);
          };

          const onBlur = () => {
            table.options.meta?.updateData(index, id, value);
          };

          return (
            <Fieldset.Root>
              <Fieldset.Content>
                <Field.Root invalid={_.isEqual(value, "")}>
                  <Input
                    id={`i_${original._id}_name`}
                    value={value}
                    readOnly={props.viewOnly}
                    onChange={onChange}
                    onBlur={onBlur}
                    size={"sm"}
                    rounded={"md"}
                  />
                </Field.Root>
              </Fieldset.Content>
            </Fieldset.Root>
          );
        },
        header: "Name",
        size: 200,
        minSize: 200,
        maxSize: 200,
      }),

      // Value `data` column
      columnHelper.accessor("data", {
        cell: ({
          getValue,
          row: { index, original },
          column: { id },
          table,
        }) => {
          const initialValue = getValue();
          const [value, setValue] = useState(initialValue);
          useEffect(() => {
            setValue(initialValue);
          }, [initialValue]);

          /**
           * Handle a Select change event
           * @param event change event data
           */
          const onSelectChange = (value: GenericValueType) => {
            setValue({
              selected: value,
              options: initialValue.options,
            });
          };

          /**
           * Handle a `SearchSelect` component change event
           * @param entity change event Entity
           */
          const onSearchSelectChange = (entity: IGenericItem) => {
            setValue(entity);

            // Need to update the table data in order to update overall state
            table.options.meta?.updateData(index, id, entity);
          };

          const onBlur = () => {
            table.options.meta?.updateData(index, id, value);
          };

          let dataInput: React.ReactElement;
          if (_.isUndefined(props.permittedValues)) {
            switch (original.type) {
              case "number": {
                dataInput = (
                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Field.Root
                        invalid={
                          _.isEqual(value, "") &&
                          _.isEqual(props.requireData, true)
                        }
                      >
                        <Input
                          id={`i_${original._id}_data`}
                          type={"number"}
                          value={value}
                          size={"sm"}
                          rounded={"md"}
                          readOnly={props.viewOnly}
                          onChange={(event) =>
                            setValue(parseFloat(event.target.value))
                          }
                          onBlur={onBlur}
                        />
                      </Field.Root>
                    </Fieldset.Content>
                  </Fieldset.Root>
                );
                break;
              }
              case "text": {
                dataInput = (
                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Field.Root
                        invalid={
                          _.isEqual(value, "") &&
                          _.isEqual(props.requireData, true)
                        }
                      >
                        <Input
                          id={`i_${original._id}_data`}
                          value={value}
                          size={"sm"}
                          rounded={"md"}
                          readOnly={props.viewOnly}
                          onChange={(event) => setValue(event.target.value)}
                          onBlur={onBlur}
                        />
                      </Field.Root>
                    </Fieldset.Content>
                  </Fieldset.Root>
                );
                break;
              }
              case "url": {
                if (_.isEqual(props.viewOnly, false)) {
                  dataInput = (
                    <Fieldset.Root>
                      <Fieldset.Content>
                        <Field.Root
                          invalid={
                            _.isEqual(value, "") &&
                            _.isEqual(props.requireData, true)
                          }
                        >
                          <Input
                            id={`i_${original._id}_data`}
                            value={value}
                            size={"sm"}
                            rounded={"md"}
                            readOnly={props.viewOnly}
                            onChange={(event) => setValue(event.target.value)}
                            onBlur={onBlur}
                          />
                        </Field.Root>
                      </Fieldset.Content>
                    </Fieldset.Root>
                  );
                } else {
                  // Setup Link display depending on destination URL
                  let linkTextColor = "black";
                  let linkBgColor = "gray.100";
                  let linkLogo = null;
                  let shortenedUrl = value.toString();
                  let tooltipText = value.toString();
                  let validLink = false;

                  try {
                    const domain = new URL(value);
                    const hostname = domain.hostname.replace("www", "");
                    shortenedUrl = shortenedUrl.replace("https://", "");
                    shortenedUrl = shortenedUrl.replace("http://", "");
                    shortenedUrl = shortenedUrl.substring(0, 18);
                    shortenedUrl = shortenedUrl.concat("...");
                    if (
                      _.isEqual(hostname, "wustl.box.com") ||
                      _.isEqual(hostname, "wustl.app.box.com")
                    ) {
                      // Link to Box
                      linkTextColor = "white";
                      linkBgColor = "blue.400";
                      linkLogo = <Icon name={"l_box"} size={[5, 5]} />;
                    } else if (
                      _.isEqual(hostname, "mynotebook.labarchives.com")
                    ) {
                      // Link to LabArchives
                      linkTextColor = "white";
                      linkBgColor = "purple.400";
                      linkLogo = <Icon name={"l_labArchives"} size={[5, 5]} />;
                    } else if (_.isEqual(hostname, "app.globus.org")) {
                      // Link to Globus
                      linkTextColor = "white";
                      linkBgColor = "blue.600";
                      linkLogo = <Icon name={"l_globus"} size={[5, 5]} />;
                    } else if (_.isEqual(hostname, "github.com")) {
                      // Link to GitHub
                      linkTextColor = "white";
                      linkBgColor = "black";
                      linkLogo = <Icon name={"l_github"} size={[5, 5]} />;
                    }
                    validLink = true;
                  } catch {
                    linkTextColor = "orange.700";
                    linkBgColor = "orange.300";
                    linkLogo = <Icon name={"warning"} />;
                    shortenedUrl = _.truncate(shortenedUrl, { length: 10 });
                    tooltipText = "Possible invalid URL: " + value.toString();
                  }

                  dataInput = (
                    <Tooltip content={tooltipText} showArrow>
                      <Flex
                        direction={"row"}
                        align={"center"}
                        p={"2"}
                        pl={"4"}
                        pr={"4"}
                        w={"fit-content"}
                        rounded={"full"}
                        gap={"2"}
                        bg={linkBgColor}
                        color={linkTextColor}
                        justify={"space-between"}
                      >
                        {linkLogo}
                        {validLink ? (
                          <Link
                            href={value}
                            lineClamp={1}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Text>{shortenedUrl}</Text>
                          </Link>
                        ) : (
                          <Text>{shortenedUrl}</Text>
                        )}
                        <Icon name={"link"} />
                      </Flex>
                    </Tooltip>
                  );
                }
                break;
              }
              case "date": {
                dataInput = (
                  <Fieldset.Root>
                    <Fieldset.Content>
                      <Field.Root
                        invalid={
                          _.isEqual(value, "") &&
                          _.isEqual(props.requireData, true)
                        }
                      >
                        <Input
                          id={`i_${original._id}_data`}
                          type={"date"}
                          value={value}
                          size={"sm"}
                          rounded={"md"}
                          readOnly={props.viewOnly}
                          onChange={(event) => setValue(event.target.value)}
                          onBlur={onBlur}
                        />
                      </Field.Root>
                    </Fieldset.Content>
                  </Fieldset.Root>
                );
                break;
              }
              case "entity": {
                if (_.isEqual(props.viewOnly, false)) {
                  dataInput = (
                    <SearchSelect
                      placeholder={"Select"}
                      resultType={"entity"}
                      value={value}
                      onChange={onSearchSelectChange}
                      disabled={props.viewOnly}
                    />
                  );
                } else {
                  dataInput = (
                    <Flex px={"2"}>
                      <Linky type={"entities"} id={value._id} size={"sm"} />
                    </Flex>
                  );
                }
                break;
              }
              case "select": {
                if (value.options && value.options.length > 0) {
                  // Show dropdown when options exist
                  dataInput = (
                    <Select.Root
                      key={"select-option"}
                      size={"sm"}
                      invalid={
                        _.isEqual(value, "") &&
                        _.isEqual(props.requireData, true)
                      }
                      collection={createListCollection<IGenericItem>({
                        items: value.options || [],
                      })}
                      onValueChange={(details) =>
                        onSelectChange(details.items[0])
                      }
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger>
                          <Select.ValueText placeholder={"Select Option"} />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Portal>
                        <Select.Positioner>
                          <Select.Content zIndex={9999}>
                            {(value.options || []).map(
                              (option: IGenericItem) => (
                                <Select.Item item={option} key={option._id}>
                                  {option.name}
                                  <Select.ItemIndicator />
                                </Select.Item>
                              ),
                            )}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>
                  );
                } else {
                  // Show "Add Options" button when no options exist
                  dataInput = (
                    <Button
                      size={"sm"}
                      variant={"solid"}
                      colorPalette={"green"}
                      rounded={"md"}
                      onClick={() => {
                        setEditingValueId(original._id);
                        setSelectOpen(true);
                      }}
                    >
                      Add Options
                      <Icon name={"add"} />
                    </Button>
                  );
                }
                break;
              }
            }
          } else {
            dataInput = (
              <Select.Root
                key={"select-column"}
                size={"sm"}
                invalid={
                  _.isEqual(value, "") && _.isEqual(props.requireData, true)
                }
                collection={createListCollection<string>({
                  items: props.permittedValues,
                })}
                onValueChange={(details) => setValue(details.items[0])}
                disabled={props.viewOnly}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger>
                    <Select.ValueText placeholder={"Select Column"} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content zIndex={9999}>
                      {createListCollection<string>({
                        items: props.permittedValues,
                      }).items.map((value: string) => (
                        <Select.Item item={value} key={value}>
                          {value}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            );
          }

          return (
            <Flex align={"center"} justify={"left"} gap={"2"}>
              {dataInput}
            </Flex>
          );
        },
        header: "Value Data",
        size: 300,
        minSize: 300,
        maxSize: 300,
      }),
    ],
    [props.viewOnly],
  );

  const addOptions = () => {
    if (editingValueId) {
      // Update the existing Select value with the defined options
      const updatedValues = props.values.map((value) => {
        if (value._id === editingValueId) {
          return {
            ...value,
            data: {
              selected: "",
              options: options.map((opt) => ({
                _id: `option_${Math.round(performance.now())}_${opt}`,
                name: opt,
              })),
            },
          };
        }
        return value;
      });

      props.setValues(updatedValues);
    }

    // Reset the options and editing state
    setOptions([]);
    setEditingValueId(null);

    // Close the modal
    setSelectOpen(false);
  };

  const actions: DataTableAction[] = [
    {
      label: "Delete Values",
      icon: "delete",
      action: (table, rows: Row<IValue<GenericValueType>>) => {
        // Delete rows that have been selected
        const idToRemove: IValue<GenericValueType>[] = [];
        for (const rowIndex of Object.keys(rows)) {
          idToRemove.push(table.getRow(rowIndex).original);
        }

        const updatedValues = props.values.filter((value) => {
          return !idToRemove.includes(value);
        });

        props.setValues(updatedValues);
        table.resetRowSelection();
      },
    },
  ];

  return (
    <Flex direction={"column"} gap={"2"} w={"100%"}>
      <Flex
        direction={"row"}
        gap={"2"}
        flexWrap={"wrap"}
        justify={"space-between"}
        align={"center"}
      >
        <Text fontSize={"sm"} fontWeight={"bold"}>
          Values
        </Text>
        {!props.viewOnly && (
          <Button
            data-testid={"add-value-button"}
            variant={"solid"}
            colorPalette={"green"}
            size={"sm"}
            rounded={"md"}
            onClick={() => {
              props.setValues([
                ...props.values,
                {
                  _id: `v_text_${Math.round(performance.now())}`,
                  name: "",
                  type: "text",
                  data: "",
                },
              ]);
            }}
          >
            Add Value
            <Icon name={"add"} />
          </Button>
        )}
      </Flex>

      {props.values.length > 0 ? (
        <DataTable
          columns={columns}
          visibleColumns={{}}
          selectedRows={{}}
          data={props.values}
          setData={props.setValues}
          viewOnly={props.viewOnly}
          actions={actions}
          showPagination
          showSelection
        />
      ) : (
        <Flex
          w={"100%"}
          align={"center"}
          justify={"center"}
          minH={"200px"}
          rounded={"md"}
          border={"1px solid"}
          borderColor={"gray.300"}
        >
          <EmptyState.Root>
            <EmptyState.Content>
              <Flex direction={"row"} gap={"2"}>
                <EmptyState.Indicator>
                  <Icon name={"v_text"} size={"sm"} />
                </EmptyState.Indicator>
                <EmptyState.Indicator>
                  <Icon name={"v_number"} size={"sm"} />
                </EmptyState.Indicator>
                <EmptyState.Indicator>
                  <Icon name={"v_url"} size={"sm"} />
                </EmptyState.Indicator>
                <EmptyState.Indicator>
                  <Icon name={"v_date"} size={"sm"} />
                </EmptyState.Indicator>
                <EmptyState.Indicator>
                  <Icon name={"v_select"} size={"sm"} />
                </EmptyState.Indicator>
                <EmptyState.Indicator>
                  <Icon name={"entity"} size={"sm"} />
                </EmptyState.Indicator>
              </Flex>
              <EmptyState.Description>No Values</EmptyState.Description>
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      )}

      <Dialog.Root
        open={selectOpen}
        size={"sm"}
        placement={"center"}
        closeOnEscape
        closeOnInteractOutside
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header px={"2"} py={"4"} roundedTop={"md"} bg={"gray.100"}>
              <Flex direction={"row"} align={"center"} gap={"2"}>
                <Icon name={"add"} />
                Add Options
              </Flex>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size={"sm"}
                  onClick={() => setSelectOpen(false)}
                  _hover={{ bg: "gray.200" }}
                />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body p={"2"} gap={"2"} pb={"0"}>
              <Flex direction={"column"} gap={"2"}>
                <Text fontSize={"sm"}>
                  Name the option, then click "Add" to add it to the collection
                  of options associated with this Select value. Click "Continue"
                  to save the options.
                </Text>
                <Text fontSize={"sm"}>
                  For a Select value, set the options to be displayed.
                  Duplicates are not permitted.
                </Text>
                <Flex direction={"row"} gap={"4"}>
                  <Input
                    size={"sm"}
                    rounded={"md"}
                    placeholder={"Option Value"}
                    value={option}
                    onChange={(event) => setOption(event.target.value)}
                  />
                  <Button
                    colorPalette={"green"}
                    size={"sm"}
                    onClick={() => {
                      if (!_.includes(options, option)) {
                        setOptions([...options, option.toString()]);
                        setOption("");
                      } else {
                        toaster.create({
                          title: "Warning",
                          description: "Can't add duplicate options.",
                          type: "warning",
                          duration: 2000,
                          closable: true,
                        });
                      }
                    }}
                    disabled={_.isEqual(option, "")}
                  >
                    Add
                    <Icon name={"add"} />
                  </Button>
                </Flex>

                <Flex direction={"column"} gap={"2"}>
                  <Stack gap={"1"} separator={<Separator />}>
                    {options.length > 0 ? (
                      options.map((option, index) => {
                        return (
                          <Flex
                            direction={"row"}
                            w={"100%"}
                            justify={"space-between"}
                            align={"center"}
                            key={option}
                          >
                            <Flex gap={"2"}>
                              <Text fontWeight={"semibold"} fontSize={"sm"}>
                                Option {index + 1}:
                              </Text>
                              <Text fontSize={"sm"}>{option}</Text>
                            </Flex>
                            <IconButton
                              aria-label={`remove_${index}`}
                              size={"sm"}
                              colorPalette={"red"}
                              onClick={() => {
                                setOptions([
                                  ...options.filter(
                                    (currentOption) =>
                                      !_.isEqual(currentOption, option),
                                  ),
                                ]);
                              }}
                            >
                              <Icon name={"delete"} />
                            </IconButton>
                          </Flex>
                        );
                      })
                    ) : (
                      <Flex
                        w={"100%"}
                        align={"center"}
                        justify={"center"}
                        minH={"100px"}
                        rounded={"md"}
                        border={"1px"}
                        borderColor={"gray.300"}
                      >
                        <Text
                          fontSize={"sm"}
                          fontWeight={"semibold"}
                          color={"gray.400"}
                        >
                          No Options
                        </Text>
                      </Flex>
                    )}
                  </Stack>
                </Flex>
              </Flex>
            </Dialog.Body>
            <Dialog.Footer p={"2"} bg={"gray.100"} roundedBottom={"md"}>
              <Button
                size={"sm"}
                rounded={"md"}
                colorPalette={"red"}
                onClick={() => {
                  // Reset the list of options and editing state
                  setOptions([]);
                  setEditingValueId(null);

                  // Close the modal
                  setSelectOpen(false);
                }}
              >
                Cancel
                <Icon name={"cross"} />
              </Button>
              <Spacer />
              <Button
                size={"sm"}
                rounded={"md"}
                colorPalette={"green"}
                onClick={addOptions}
                disabled={_.isEqual(options.length, 0)}
              >
                Continue
                <Icon name={"c_right"} />
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Flex>
  );
};

export default Values;
