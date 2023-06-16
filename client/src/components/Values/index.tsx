// React
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";

// Existing and custom components
import {
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
  ScaleFade,
  Select,
  Spacer,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { createColumnHelper } from "@tanstack/react-table";
import DataTable from "@components/DataTable";
import Icon from "@components/Icon";
import Linky from "@components/Linky";

// Existing and custom types
import { EntityModel, IValue } from "@types";

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
  collection: IValue<any>[];
  viewOnly: boolean;
  setValues: Dispatch<SetStateAction<IValue<any>[]>>;
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
        setIsLoaded(true);
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
    return;
  }, []);

  const [data, setData] = useState(props.collection);
  useEffect(() => {
    props.setValues(props.collection);
    setData(props.collection);
  }, [props.collection]);

  const columnHelper = createColumnHelper<IValue<any>>();
  const columns = [
    // Value name column
    columnHelper.accessor("name", {
      cell: (info) => {
        const initialValue = info.getValue();
        const [value, setValue] = useState(initialValue);

        useEffect(() => {
          setValue(initialValue);
        }, [initialValue]);

        const onChange = (event: any) => {
          setValue(event.target.value);
        };

        const onBlur = () => {
          updateName(info.row.original.identifier, value);
        };

        // Set the icon attached to the name field
        let valueIcon = <Icon name={"unknown"} />;
        switch(info.row.original.type) {
          case "date":
            valueIcon = <Icon name={"v_date"} />;
            break;
          case "number":
            valueIcon = <Icon name={"v_number"} />;
            break;
          case "text":
            valueIcon = <Icon name={"v_text"} />;
            break;
          case "url":
            valueIcon = <Icon name={"v_url"} />;
            break;
          case "entity":
            valueIcon = <Icon name={"entity"} />;
            break;
          case "select":
            valueIcon = <Icon name={"v_select"} />;
            break;
        }

        return (
          <InputGroup>
            <InputLeftAddon children={valueIcon} />
            <Input
              id={`i_${info.row.original.identifier}_name`}
              value={value}
              disabled={props.viewOnly}
              onChange={onChange}
              onBlur={onBlur}
            />
          </InputGroup>
        );
      },
      header: "Name",
    }),

    // Value data column
    columnHelper.accessor("data", {
      cell: (info) => {
        const initialValue = info.getValue();
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
          updateData(info.row.original.identifier, value);
        };

        switch (info.row.original.type) {
          case "number": {
            return (
              <Input
                id={`i_${info.row.original.identifier}_data`}
                type={"number"}
                value={value}
                disabled={props.viewOnly}
                onChange={onChange}
                onBlur={onBlur}
              />
            );
          }
          case "text": {
            return (
              <Input
                id={`i_${info.row.original.identifier}_data`}
                value={value}
                disabled={props.viewOnly}
                onChange={onChange}
                onBlur={onBlur}
              />
            );
          }
          case "url": {
            if (_.isEqual(props.viewOnly, false)) {
              return (
                <Input
                  id={`i_${info.row.original.identifier}_data`}
                  value={value}
                  disabled={props.viewOnly}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              );
            } else {
              return (
                <Link
                  href={value}
                  isExternal
                >
                  {value}
                </Link>
              );
            }
          }
          case "date": {
            return (
              <Input
                id={`i_${info.row.original.identifier}_data`}
                type={"datetime-local"}
                value={value}
                disabled={props.viewOnly}
                onChange={onChange}
                onBlur={onBlur}
              />
            );
          }
          case "entity": {
            if (_.isEqual(props.viewOnly, false)) {
              return (
                <Select
                  title="Select Entity"
                  id={`s_${info.row.original.identifier}_data`}
                  value={value}
                  placeholder={"Entity"}
                  disabled={props.viewOnly}
                  onChange={onChange}
                  onBlur={onBlur}
                >
                  {isLoaded &&
                    entities.map((entity) => {
                      return (
                        <option key={entity._id} value={entity._id}>
                          {entity.name}
                        </option>
                      );
                    })}
                  ;
                </Select>
              );
            } else {
              return (
                <Linky type={"entities"} id={value} />
              );
            }
          }
          case "select": {
           return (
              <Select
                title="Select Option"
                id={`s_${info.row.original.identifier}_data`}
                value={value.selected}
                disabled={props.viewOnly}
                onChange={onSelectChange}
                onBlur={onBlur}
              >
                {isLoaded && value.options &&
                  value.options.map((value: string) => {
                    return (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    );
                  })
                }
              </Select>
            );
          }
        }
      },
      header: "Data",
    }),
  ];

  /**
   * Update function called to update the name associated with a Value
   * @param {string} identifier Value identifier
   * @param {string} updatedName the updated name to associated with the Value
   */
  const updateName = (identifier: string, updatedName: string) => {
    const updatedCollection = data.map((value) => {
      if (_.isEqual(value.identifier, identifier)) {
        // Update the name, if changed
        value.name = _.cloneDeep(updatedName);
      }
      return value;
    });

    applyUpdate(updatedCollection);
  };

  /**
   * Update function called to update the data associated with a Value
   * @param {string} identifier Value identifier
   * @param {any} updatedData the updated data to associated with the Value
   */
  const updateData = (identifier: string, updatedData: string) => {
    const updatedCollection = data.map((value) => {
      if (_.isEqual(value.identifier, identifier)) {
        // Update the data, if changed
        value.data = _.cloneDeep(updatedData);
      }
      return value;
    });

    applyUpdate(updatedCollection);
  };

  const applyUpdate = (collection: IValue<any>[]) => {
    props.setValues([...collection]);
  }

  const addOptions = () => {
    // Add the Select value with the defined options
    props.setValues([
      ...data,
      {
        identifier: `p_select_${Math.round(performance.now())}`,
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

  return (
    <Flex p={["1", "2"]} direction={"column"} gap={"1"} w={"100%"}>
      {!props.viewOnly && (
        <Flex
          w={"100%"}
          direction={"row"}
          gap={"2"}
          p={"4"}
          flexWrap={"wrap"}
          justify={"center"}
          align={"center"}
        >
          {/* Buttons to add Values */}
          <Button
            variant={"outline"}
            leftIcon={<Icon name={"v_date"} />}
            onClick={() => {
              props.setValues([
                ...data,
                {
                  identifier: `v_date_${Math.round(performance.now())}`,
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
            variant={"outline"}
            leftIcon={<Icon name={"v_text"} />}
            onClick={() => {
              props.setValues([
                ...data,
                {
                  identifier: `v_text_${Math.round(performance.now())}`,
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
            leftIcon={<Icon name={"v_number"} />}
            onClick={() => {
              props.setValues([
                ...data,
                {
                  identifier: `v_number_${Math.round(performance.now())}`,
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
            leftIcon={<Icon name={"v_url"} />}
            onClick={() => {
              props.setValues([
                ...data,
                {
                  identifier: `v_url_${Math.round(performance.now())}`,
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
            leftIcon={<Icon name={"entity"} />}
            onClick={() => {
              props.setValues([
                ...data,
                {
                  identifier: `p_entity_${Math.round(performance.now())}`,
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
            leftIcon={<Icon name={"v_select"} />}
            onClick={() => {
              onOpen();
            }}
          >
            Select
          </Button>

          <Spacer />
        </Flex>
      )}

      <DataTable columns={columns} visibleColumns={{}} data={data} setData={props.setValues} viewOnly={props.viewOnly} />

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
                <Flex direction={"row"} gap={"4"}>
                  <Input placeholder={"Option Value"} value={option} onChange={(event) => setOption(event.target.value)} />
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
                    disabled={_.isEqual(option, "")}
                  >
                    Add
                  </Button>
                </Flex>

                <Flex direction={"column"} gap={"2"}>
                  {options.length > 0 &&
                    options.map((option) => {
                      return (
                        <Flex direction={"row"} justify={"space-between"} key={option}>
                          {option}
                          <Button
                            colorScheme={"red"}
                            rightIcon={<Icon name={"delete"} />}
                            onClick={() => {
                              setOptions([...options.filter((currentOption) => !_.isEqual(currentOption, option))])
                            }}
                          >
                            Remove
                          </Button>
                        </Flex>
                      );
                    })
                  }
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
