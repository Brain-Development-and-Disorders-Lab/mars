// React
import React, { useEffect, useMemo, useState } from "react";

// Existing and custom components
import {
  Button,
  CloseButton,
  Dialog,
  Field,
  Fieldset,
  Flex,
  Heading,
  IconButton,
  Input,
  Link,
  Popover,
  Portal,
  Select,
  Separator,
  Spacer,
  Text,
  VStack,
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
  const [addValueOpen, setAddValueOpen] = useState(false);
  const [option, setOption] = useState("");
  const [options, setOptions] = useState<string[]>([]);

  const columnHelper = createColumnHelper<IValue<GenericValueType>>();
  const columns = useMemo(
    () => [
      // Value `type` column
      columnHelper.accessor("type", {
        cell: ({ getValue }) => {
          let valueType: string = getValue();

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

          // Apply casing
          if (valueType === "url") {
            valueType = _.upperCase(valueType);
          } else {
            valueType = _.capitalize(valueType);
          }

          return (
            <Flex align={"center"} justify={"left"} gap={"2"} w={"100%"}>
              <Flex>{typeIcon}</Flex>
              <Text fontWeight={"semibold"} color={"gray.500"}>
                {valueType}
              </Text>
            </Flex>
          );
        },
        header: "Type",
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
                dataInput = (
                  <Select.Root
                    key={"select-option"}
                    size={"sm"}
                    invalid={
                      _.isEqual(value, "") && _.isEqual(props.requireData, true)
                    }
                    collection={createListCollection<IGenericItem>({
                      items: value.options,
                    })}
                    onValueChange={(details) =>
                      onSelectChange(details.items[0])
                    }
                  >
                    <Select.HiddenSelect />
                    <Select.Label>Select Option</Select.Label>
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
                        <Select.Content>
                          {createListCollection<IGenericItem>({
                            items: value.options,
                          }).items.map((option: IGenericItem) => (
                            <Select.Item item={option} key={option._id}>
                              {option.name}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                );
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
                    <Select.Content>
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
      }),
    ],
    [props.viewOnly],
  );

  const addOptions = () => {
    // Add the Select value with the defined options
    props.setValues([
      ...props.values,
      {
        _id: `p_select_${Math.round(performance.now())}`,
        name: "",
        type: "select",
        data: {
          selected: option,
          options: [..._.cloneDeep(options)],
        },
      },
    ]);

    // Reset the options
    setOptions([]);

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
        <Popover.Root
          size={"xs"}
          open={addValueOpen}
          onOpenChange={(event) => setAddValueOpen(event.open)}
          closeOnEscape
          closeOnInteractOutside
        >
          <Popover.Trigger asChild>
            <Button
              variant={"solid"}
              colorPalette={"green"}
              className={"add-value-button-form"}
              disabled={props.viewOnly}
              size={"sm"}
              rounded={"md"}
              onClick={() => setAddValueOpen(true)}
            >
              Add Value
              <Icon name={"add"} />
            </Button>
          </Popover.Trigger>

          <Popover.Positioner>
            <Popover.Content>
              <Popover.Arrow />
              <Popover.Header>
                <Flex>
                  <Heading fontWeight={"semibold"} size={"xs"}>
                    Select Type
                  </Heading>
                </Flex>
              </Popover.Header>
              <Popover.Body>
                <Flex gap={"2"} wrap={"wrap"}>
                  {/* Buttons to add Values */}
                  <Button
                    bg={"orange.400"}
                    size={"sm"}
                    rounded={"md"}
                    color={"white"}
                    borderColor={"orange.300"}
                    _hover={{ bg: "orange.300" }}
                    onClick={() => {
                      props.setValues([
                        ...props.values,
                        {
                          _id: `v_date_${Math.round(performance.now())}`,
                          name: "",
                          type: "date",
                          data: dayjs(Date.now()).toISOString(),
                        },
                      ]);
                      setAddValueOpen(false);
                    }}
                  >
                    Date
                    <Icon name={"v_date"} />
                  </Button>

                  <Button
                    id="add-value-button-text"
                    bg={"blue.400"}
                    size={"sm"}
                    rounded={"md"}
                    color={"white"}
                    borderColor={"blue.300"}
                    _hover={{ bg: "blue.300" }}
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
                      setAddValueOpen(false);
                    }}
                  >
                    Text
                    <Icon name={"v_text"} />
                  </Button>

                  <Button
                    bg={"green.400"}
                    size={"sm"}
                    rounded={"md"}
                    color={"white"}
                    borderColor={"green.300"}
                    _hover={{ bg: "green.300" }}
                    onClick={() => {
                      props.setValues([
                        ...props.values,
                        {
                          _id: `v_number_${Math.round(performance.now())}`,
                          name: "",
                          type: "number",
                          data: 0,
                        },
                      ]);
                      setAddValueOpen(false);
                    }}
                  >
                    Number
                    <Icon name={"v_number"} />
                  </Button>

                  <Button
                    bg={"yellow.400"}
                    size={"sm"}
                    rounded={"md"}
                    color={"white"}
                    borderColor={"yellow.300"}
                    _hover={{ bg: "yellow.300" }}
                    onClick={() => {
                      props.setValues([
                        ...props.values,
                        {
                          _id: `v_url_${Math.round(performance.now())}`,
                          name: "",
                          type: "url",
                          data: "",
                        },
                      ]);
                      setAddValueOpen(false);
                    }}
                  >
                    URL
                    <Icon name={"v_url"} />
                  </Button>

                  <Button
                    bg={"purple.400"}
                    size={"sm"}
                    rounded={"md"}
                    color={"white"}
                    borderColor={"purple.300"}
                    _hover={{ bg: "purple.300" }}
                    onClick={() => {
                      props.setValues([
                        ...props.values,
                        {
                          _id: `p_entity_${Math.round(performance.now())}`,
                          name: "",
                          type: "entity",
                          data: "",
                        },
                      ]);
                      setAddValueOpen(false);
                    }}
                  >
                    Entity
                    <Icon name={"entity"} />
                  </Button>

                  <Button
                    bg={"teal.400"}
                    size={"sm"}
                    rounded={"md"}
                    color={"white"}
                    borderColor={"teal.300"}
                    _hover={{ bg: "teal.300" }}
                    disabled={!_.isUndefined(props.permittedValues)}
                    onClick={() => {
                      setSelectOpen(true);
                      setAddValueOpen(false);
                    }}
                  >
                    Select
                    <Icon name={"v_select"} />
                  </Button>
                </Flex>
              </Popover.Body>
            </Popover.Content>
          </Popover.Positioner>
        </Popover.Root>
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
          showItemCount
          showSelection
        />
      ) : (
        <Flex
          w={"100%"}
          align={"center"}
          justify={"center"}
          minH={"200px"}
          rounded={"md"}
          border={"1px"}
          borderColor={"gray.300"}
        >
          <Text fontSize={"sm"} fontWeight={"semibold"} color={"gray.400"}>
            No Values
          </Text>
        </Flex>
      )}

      <Dialog.Root
        open={selectOpen}
        size={"sm"}
        placement={"center"}
        closeOnEscape
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header p={"2"}>
              Add Options
              <Dialog.CloseTrigger asChild>
                <CloseButton size={"sm"} onClick={() => setSelectOpen(false)} />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body p={"2"} gap={"2"} pb={"0"}>
              <Flex direction={"column"} gap={"2"}>
                <Text fontSize={"sm"}>
                  For a Select value, set the options to be displayed.
                  Duplicates are not permitted.
                </Text>
                <Text fontSize={"sm"}>
                  Name the option, then click "Add" to add it to the collection
                  of options associated with this Select value. Click "Continue"
                  to add this Select value to the Attribute.
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
                  <VStack gap={"1"} separator={<Separator />}>
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
                  </VStack>
                </Flex>
              </Flex>
            </Dialog.Body>
            <Dialog.Footer p={"2"}>
              <Button
                size={"sm"}
                rounded={"md"}
                colorPalette={"red"}
                onClick={() => {
                  // Reset the list of options
                  setOptions([]);

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
