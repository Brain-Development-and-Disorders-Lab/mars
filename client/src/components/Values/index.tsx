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
  Box,
  Button,
  Flex,
  Input,
  InputGroup,
  InputLeftAddon,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
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
import { getData } from "@database/functions";
import _ from "lodash";
import dayjs from "dayjs";

/**
 * Values component use to display a collection of Values and enable
 * creating and deleting Values. Displays collection as cards.
 * @param props collection of props to construct component
 * @return
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

  useEffect(() => {
    getData(`/entities`)
      .then((value) => {
        setEntities(value);
      })
      .catch((_error) => {
        toast({
          title: "Error",
          description: "Could not retrieve Entities.",
          status: "error",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .finally(() => {
        setIsLoaded(true);
      });
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

          // Set the icon attached to the name field
          let valueIcon = <Icon name={"unknown"} />;
          switch (original.type) {
            case "date":
              valueIcon = <Icon name={"v_date"} color={"orange.300"} />;
              break;
            case "number":
              valueIcon = <Icon name={"v_number"} color={"green.300"} />;
              break;
            case "text":
              valueIcon = <Icon name={"v_text"} color={"blue.300"} />;
              break;
            case "url":
              valueIcon = <Icon name={"v_url"} color={"yellow.300"} />;
              break;
            case "entity":
              valueIcon = <Icon name={"entity"} color={"purple.300"} />;
              break;
            case "select":
              valueIcon = <Icon name={"v_select"} color={"cyan.300"} />;
              break;
          }

          return (
            <InputGroup>
              <InputLeftAddon children={valueIcon} bgColor={"white"} />
              <Input
                id={`i_${original._id}_name`}
                value={value}
                isReadOnly={props.viewOnly}
                onChange={onChange}
                onBlur={onBlur}
                minW={"2xs"}
                isInvalid={_.isEqual(value, "")}
              />
            </InputGroup>
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

          if (_.isUndefined(props.permittedValues)) {
            switch (original.type) {
              case "number": {
                return (
                  <Input
                    id={`i_${original._id}_data`}
                    type={"number"}
                    value={value}
                    w={"2xs"}
                    isReadOnly={props.viewOnly}
                    onChange={onChange}
                    onBlur={onBlur}
                    isInvalid={
                      _.isEqual(value, "") && _.isEqual(props.requireData, true)
                    }
                  />
                );
              }
              case "text": {
                return (
                  <Input
                    id={`i_${original._id}_data`}
                    value={value}
                    w={"2xs"}
                    isReadOnly={props.viewOnly}
                    onChange={onChange}
                    onBlur={onBlur}
                    isInvalid={
                      _.isEqual(value, "") && _.isEqual(props.requireData, true)
                    }
                  />
                );
              }
              case "url": {
                if (_.isEqual(props.viewOnly, false)) {
                  return (
                    <Input
                      id={`i_${original._id}_data`}
                      value={value}
                      w={"2xs"}
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
                  const domain = new URL(value);
                  const hostname = domain.hostname.replace("www", "");
                  let shortenedUrl = value.toString();
                  shortenedUrl = shortenedUrl.replace("https://", "");
                  shortenedUrl = shortenedUrl.replace("http://", "");
                  shortenedUrl = shortenedUrl.substring(0, 18);
                  shortenedUrl = shortenedUrl.concat("...");

                  // Setup Link display depending on destination URL
                  let linkTextColor = "black";
                  let linkBgColor = "gray.100";
                  let linkLogo = null;
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

                  return (
                    <Tooltip label={value}>
                      <Flex
                        direction={"row"}
                        align={"center"}
                        p={"2"}
                        pl={"4"}
                        pr={"4"}
                        rounded={"full"}
                        gap={"2"}
                        bg={linkBgColor}
                        color={linkTextColor}
                        justify={"space-between"}
                      >
                        {linkLogo}
                        <Link href={value} isExternal noOfLines={1}>
                          <Text>{shortenedUrl}</Text>
                        </Link>
                        <Icon name={"link"} />
                      </Flex>
                    </Tooltip>
                  );
                }
              }
              case "date": {
                return (
                  <Input
                    id={`i_${original._id}_data`}
                    type={"date"}
                    value={value}
                    w={"2xs"}
                    isReadOnly={props.viewOnly}
                    onChange={onChange}
                    onBlur={onBlur}
                    isInvalid={
                      _.isEqual(value, "") && _.isEqual(props.requireData, true)
                    }
                  />
                );
              }
              case "entity": {
                if (_.isEqual(props.viewOnly, false)) {
                  return (
                    <Select
                      title="Select Entity"
                      id={`s_${original._id}_data`}
                      value={value}
                      placeholder={"Entity"}
                      w={"2xs"}
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
                  return <Linky type={"entities"} id={value} />;
                }
              }
              case "select": {
                return (
                  <Select
                    title="Select Option"
                    id={`s_${original._id}_data`}
                    value={value.selected}
                    w={"2xs"}
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
              }
            }
          } else {
            return (
              <Select
                title="Select Column"
                id={`s_${original._id}_data`}
                value={value}
                placeholder={"Column"}
                w={"2xs"}
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
        },
        header: "Data",
      }),
    ],
    [props.viewOnly, entities]
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
    <Flex p={["1", "2"]} direction={"column"} gap={"1"} w={"100%"}>
      {!props.viewOnly && (
        <Flex
          direction={"row"}
          gap={"2"}
          flexWrap={"wrap"}
          justify={"right"}
          align={"center"}
        >
          <Popover>
            <PopoverTrigger>
              <Button
                variant={"solid"}
                colorScheme={"green"}
                rightIcon={<Icon name={"add"} />}
                className="add-value-button-form"
              >
                Add
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverHeader>Value Type</PopoverHeader>
              <PopoverBody>
                <Flex gap={"4"} wrap={"wrap"}>
                  {/* Buttons to add Values */}
                  <Button
                    variant={"outline"}
                    bg={"orange.300"}
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
                    color={"white"}
                    borderColor={"green.300"}
                    _hover={{ bg: "green.400" }}
                    leftIcon={<Icon name={"v_number"} />}
                    onClick={() => {
                      props.setValues([
                        ...props.values,
                        {
                          _id: `v_number_${Math.round(
                            performance.now()
                          )}`,
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
                    color={"white"}
                    borderColor={"purple.300"}
                    _hover={{ bg: "purple.400" }}
                    leftIcon={<Icon name={"entity"} />}
                    onClick={() => {
                      props.setValues([
                        ...props.values,
                        {
                          _id: `p_entity_${Math.round(
                            performance.now()
                          )}`,
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
      )}

      <Box overflowX={"auto"} maxW={"80vw"}>
        <DataTable
          columns={columns}
          visibleColumns={{}}
          data={props.values}
          setData={props.setValues}
          viewOnly={props.viewOnly}
          showPagination
          showSelection={!props.viewOnly}
          actions={actions}
        />
      </Box>

      <ScaleFade initialScale={0.9} in={isOpen}>
        <Modal
          onEsc={onClose}
          onClose={onClose}
          isOpen={isOpen}
          size={"3xl"}
          isCentered
        >
          <ModalOverlay />
          <ModalContent p={"2"} m={"2"}>
            <ModalHeader>Add Options</ModalHeader>
            <ModalCloseButton />
            <ModalBody gap={"4"}>
              <Flex direction={"column"} gap={"4"}>
                <Text>
                  For a Select value, set the options to be displayed.
                  Duplicates are not permitted. Name the option, then click
                  "Add" to add it to the collection of options associated with
                  this Select value. Click "Continue" to add this Select value
                  to the Attribute.
                </Text>
                <Flex direction={"row"} gap={"4"}>
                  <Input
                    placeholder={"Option Value"}
                    value={option}
                    onChange={(event) => setOption(event.target.value)}
                  />
                  <Button
                    colorScheme={"green"}
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
                      options.map((option) => {
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
                            <Button
                              colorScheme={"red"}
                              rightIcon={<Icon name={"delete"} />}
                              onClick={() => {
                                setOptions([
                                  ...options.filter(
                                    (currentOption) =>
                                      !_.isEqual(currentOption, option)
                                  ),
                                ]);
                              }}
                            >
                              Remove
                            </Button>
                          </Flex>
                        );
                      })}
                  </VStack>
                </Flex>

                <Flex gap={"4"} justify={"center"}>
                  <Button
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
                  <Button
                    colorScheme={"green"}
                    rightIcon={<Icon name={"check"} />}
                    onClick={addOptions}
                    isDisabled={_.isEqual(options.length, 0)}
                  >
                    Continue
                  </Button>
                </Flex>
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>
      </ScaleFade>
    </Flex>
  );
};

export default Values;
