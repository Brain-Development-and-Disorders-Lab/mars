// React
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Heading,
  IconButton,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  ScaleFade,
  Select,
  Spacer,
  Text,
  Tooltip,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Linky from "@components/Linky";

// Existing and custom types
import { DataTableAction, EntityModel, IValue } from "@types";

// Utility functions and libraries
import { request } from "@database/functions";
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
  values: IValue<any>[];
  setValues: Dispatch<SetStateAction<IValue<any>[]>>;
  requireData?: true | false;
  permittedValues?: string[];
}) => {
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [option, setOption] = useState("");
  const [options, setOptions] = useState([] as string[]);

  const [entities, setEntities] = useState([] as EntityModel[]);
  const [isLoaded, setIsLoaded] = useState(false);

  const getEntities = async () => {
    const result = await request<EntityModel[]>("GET", `/entities`);
    if (!result.success) {
      toast({
        title: "Error",
        status: "error",
        description: "Could not retrieve Entities",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
    setEntities(result.data);
    setIsLoaded(true);
  };

  useEffect(() => {
    getEntities();
  }, []);

  const columnHelper = createColumnHelper<IValue<any>>();
  const columns = useMemo(
    () => [
      // Value name column
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

          const onChange = (event: any) => {
            setValue(event.target.value);
          };

          const onBlur = () => {
            table.options.meta?.updateData(index, id, value);
          };

          return (
            <Flex>
              <Input
                id={`i_${original._id}_name`}
                value={value}
                isReadOnly={props.viewOnly}
                onChange={onChange}
                onBlur={onBlur}
                size={"sm"}
                isInvalid={_.isEqual(value, "")}
              />
            </Flex>
          );
        },
        header: "Name",
      }),

      // Value data column
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
           * Handle a standard Input change event
           * @param event change event data
           */
          const onChange = (event: any) => {
            setValue(event.target.value);
          };

          /**
           * Handle a Select change event
           * @param event change event data
           */
          const onSelectChange = (event: any) => {
            setValue({
              selected: event.target.value,
              options: initialValue.options,
            });
          };

          const onBlur = () => {
            table.options.meta?.updateData(index, id, value);
          };

          let dataInput: React.ReactElement;
          let typeIcon: React.ReactElement;
          if (_.isUndefined(props.permittedValues)) {
            switch (original.type) {
              case "number": {
                typeIcon = (
                  <Icon size={"sm"} name={"v_number"} color={"green.300"} />
                );
                dataInput = (
                  <Input
                    id={`i_${original._id}_data`}
                    type={"number"}
                    value={value}
                    size={"sm"}
                    isReadOnly={props.viewOnly}
                    onChange={onChange}
                    onBlur={onBlur}
                    isInvalid={
                      _.isEqual(value, "") && _.isEqual(props.requireData, true)
                    }
                  />
                );
                break;
              }
              case "text": {
                typeIcon = (
                  <Icon size={"sm"} name={"v_text"} color={"blue.300"} />
                );
                dataInput = (
                  <Input
                    id={`i_${original._id}_data`}
                    value={value}
                    size={"sm"}
                    isReadOnly={props.viewOnly}
                    onChange={onChange}
                    onBlur={onBlur}
                    isInvalid={
                      _.isEqual(value, "") && _.isEqual(props.requireData, true)
                    }
                  />
                );
                break;
              }
              case "url": {
                typeIcon = (
                  <Icon size={"sm"} name={"v_url"} color={"yellow.300"} />
                );
                if (_.isEqual(props.viewOnly, false)) {
                  dataInput = (
                    <Input
                      id={`i_${original._id}_data`}
                      value={value}
                      size={"sm"}
                      isReadOnly={props.viewOnly}
                      onChange={onChange}
                      onBlur={onBlur}
                      isInvalid={
                        _.isEqual(value, "") &&
                        _.isEqual(props.requireData, true)
                      }
                    />
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
                  } catch (error) {
                    linkTextColor = "orange.700";
                    linkBgColor = "orange.300";
                    linkLogo = <Icon name={"warning"} />;
                    shortenedUrl = _.truncate(shortenedUrl, { length: 10 });
                    tooltipText = "Possible invalid URL: " + value.toString();
                  }

                  dataInput = (
                    <Tooltip label={tooltipText}>
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
                          <Link href={value} isExternal noOfLines={1}>
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
                typeIcon = (
                  <Icon size={"sm"} name={"v_date"} color={"orange.300"} />
                );
                dataInput = (
                  <Input
                    id={`i_${original._id}_data`}
                    type={"date"}
                    value={value}
                    size={"sm"}
                    isReadOnly={props.viewOnly}
                    onChange={onChange}
                    onBlur={onBlur}
                    isInvalid={
                      _.isEqual(value, "") && _.isEqual(props.requireData, true)
                    }
                  />
                );
                break;
              }
              case "entity": {
                typeIcon = (
                  <Icon size={"sm"} name={"entity"} color={"purple.300"} />
                );
                if (_.isEqual(props.viewOnly, false)) {
                  dataInput = (
                    <Select
                      title="Select Entity"
                      id={`s_${original._id}_data`}
                      value={value}
                      placeholder={"Entity"}
                      size={"sm"}
                      isDisabled={props.viewOnly}
                      onChange={onChange}
                      onBlur={onBlur}
                    >
                      {entities.map((entity) => {
                        return (
                          <option key={entity._id} value={entity._id}>
                            {entity.name}
                          </option>
                        );
                      })}
                    </Select>
                  );
                } else {
                  dataInput = <Linky type={"entities"} id={value} />;
                }
                break;
              }
              case "select": {
                typeIcon = (
                  <Icon size={"sm"} name={"v_select"} color={"cyan.300"} />
                );
                dataInput = (
                  <Select
                    title="Select Option"
                    id={`s_${original._id}_data`}
                    value={value.selected}
                    size={"sm"}
                    isDisabled={props.viewOnly}
                    onChange={onSelectChange}
                    onBlur={onBlur}
                    isInvalid={
                      _.isEqual(value, "") && _.isEqual(props.requireData, true)
                    }
                  >
                    {isLoaded &&
                      value.options &&
                      value.options.map((value: string) => {
                        return (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        );
                      })}
                  </Select>
                );
                break;
              }
            }
          } else {
            typeIcon = (
              <Icon size={"sm"} name={"v_select"} color={"cyan.300"} />
            );
            dataInput = (
              <Select
                title="Select Column"
                id={`s_${original._id}_data`}
                value={value}
                placeholder={"Column"}
                size={"sm"}
                isDisabled={props.viewOnly}
                onChange={onChange}
                onBlur={onBlur}
                isInvalid={
                  _.isEqual(value, "") && _.isEqual(props.requireData, true)
                }
              >
                {isLoaded &&
                  props.permittedValues.map((value) => {
                    return (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    );
                  })}
                ;
              </Select>
            );
          }

          return (
            <Flex align={"center"} justify={"left"} gap={"2"} w={"100%"}>
              <Tooltip label={_.capitalize(original.type)}>
                <Flex>{typeIcon}</Flex>
              </Tooltip>
              <Flex w={"100%"}>{dataInput}</Flex>
            </Flex>
          );
        },
        header: "Data",
      }),
    ],
    [props.viewOnly, entities],
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
    onClose();
  };

  const actions: DataTableAction[] = [
    {
      label: "Delete Values",
      icon: "delete",
      action: (table, rows: any) => {
        // Delete rows that have been selected
        const idToRemove: IValue<any>[] = [];
        for (let rowIndex of Object.keys(rows)) {
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
        <Heading size={"sm"}>Values</Heading>
        <Popover>
          <PopoverTrigger>
            <Button
              variant={"solid"}
              colorScheme={"green"}
              rightIcon={<Icon name={"add"} />}
              className={"add-value-button-form"}
              isDisabled={props.viewOnly}
              size={"sm"}
            >
              Add
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader>
              <Flex>
                <Heading fontWeight={"semibold"} size={"xs"}>
                  Value Type
                </Heading>
              </Flex>
            </PopoverHeader>
            <PopoverBody>
              <Flex gap={"4"} wrap={"wrap"}>
                {/* Buttons to add Values */}
                <Button
                  variant={"outline"}
                  bg={"orange.300"}
                  size={"sm"}
                  color={"white"}
                  borderColor={"orange.300"}
                  _hover={{ bg: "orange.400" }}
                  leftIcon={<Icon name={"v_date"} />}
                  onClick={() => {
                    props.setValues([
                      ...props.values,
                      {
                        _id: `v_date_${Math.round(performance.now())}`,
                        name: "",
                        type: "date",
                        data: dayjs(new Date()).toISOString(),
                      },
                    ]);
                  }}
                >
                  Date
                </Button>

                <Button
                  id="add-value-button-text"
                  variant={"outline"}
                  bg={"blue.300"}
                  size={"sm"}
                  color={"white"}
                  borderColor={"blue.300"}
                  _hover={{ bg: "blue.400" }}
                  leftIcon={<Icon name={"v_text"} />}
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
                  Text
                </Button>

                <Button
                  variant={"outline"}
                  bg={"green.300"}
                  size={"sm"}
                  color={"white"}
                  borderColor={"green.300"}
                  _hover={{ bg: "green.400" }}
                  leftIcon={<Icon name={"v_number"} />}
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
                  }}
                >
                  Number
                </Button>

                <Button
                  variant={"outline"}
                  bg={"yellow.300"}
                  size={"sm"}
                  color={"white"}
                  borderColor={"yellow.300"}
                  _hover={{ bg: "yellow.400" }}
                  leftIcon={<Icon name={"v_url"} />}
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
                  }}
                >
                  URL
                </Button>

                <Button
                  variant={"outline"}
                  bg={"purple.300"}
                  size={"sm"}
                  color={"white"}
                  borderColor={"purple.300"}
                  _hover={{ bg: "purple.400" }}
                  leftIcon={<Icon name={"entity"} />}
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
                  }}
                >
                  Entity
                </Button>

                <Button
                  variant={"outline"}
                  bg={"teal.300"}
                  size={"sm"}
                  color={"white"}
                  borderColor={"teal.300"}
                  _hover={{ bg: "teal.400" }}
                  leftIcon={<Icon name={"v_select"} />}
                  isDisabled={!_.isUndefined(props.permittedValues)}
                  onClick={() => {
                    onOpen();
                  }}
                >
                  Select
                </Button>
              </Flex>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </Flex>

      <Flex overflowX={"auto"}>
        <DataTable
          columns={columns}
          visibleColumns={{}}
          data={props.values}
          setData={props.setValues}
          viewOnly={props.viewOnly}
          actions={actions}
          showPagination
          showSelection
        />
      </Flex>

      <ScaleFade initialScale={0.9} in={isOpen}>
        <Modal
          onEsc={onClose}
          onClose={onClose}
          isOpen={isOpen}
          size={"3xl"}
          isCentered
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader p={"4"}>Add Options</ModalHeader>
            <ModalCloseButton />
            <ModalBody px={"4"} gap={"4"}>
              <Flex direction={"column"} gap={"4"}>
                <Text>
                  For a Select value, set the options to be displayed.
                  Duplicates are not permitted.
                </Text>
                <Text>
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
                    colorScheme={"green"}
                    size={"sm"}
                    rightIcon={<Icon name={"add"} />}
                    onClick={() => {
                      if (!_.includes(options, option)) {
                        setOptions([...options, option.toString()]);
                        setOption("");
                      } else {
                        toast({
                          title: "Warning",
                          description: "Can't add duplicate options.",
                          status: "warning",
                          duration: 2000,
                          position: "bottom-right",
                          isClosable: true,
                        });
                      }
                    }}
                    isDisabled={_.isEqual(option, "")}
                  >
                    Add
                  </Button>
                </Flex>

                <Flex direction={"column"} gap={"2"}>
                  <VStack gap={"2"}>
                    {options.length > 0 &&
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
                              <Text fontWeight={"semibold"}>Option:</Text>
                              <Text>{option}</Text>
                            </Flex>
                            <IconButton
                              aria-label={`remove_${index}`}
                              size={"sm"}
                              colorScheme={"red"}
                              icon={<Icon name={"delete"} />}
                              onClick={() => {
                                setOptions([
                                  ...options.filter(
                                    (currentOption) =>
                                      !_.isEqual(currentOption, option),
                                  ),
                                ]);
                              }}
                            />
                          </Flex>
                        );
                      })}
                  </VStack>
                </Flex>
              </Flex>
            </ModalBody>
            <ModalFooter px={"4"}>
              <Button
                size={"sm"}
                colorScheme={"red"}
                rightIcon={<Icon name={"cross"} />}
                onClick={() => {
                  // Reset the list of options
                  setOptions([]);

                  // Close the modal
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Spacer />
              <Button
                size={"sm"}
                colorScheme={"green"}
                rightIcon={<Icon name={"c_right"} />}
                onClick={addOptions}
                isDisabled={_.isEqual(options.length, 0)}
              >
                Continue
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </ScaleFade>
    </Flex>
  );
};

export default Values;
