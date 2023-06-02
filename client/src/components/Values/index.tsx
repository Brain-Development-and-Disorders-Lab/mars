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
  Link,
  Select,
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
  setValues?: Dispatch<SetStateAction<IValue<any>[]>>;
}) => {
  const toast = useToast();
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
    if (props.setValues) {
      props.setValues([...data]);
    }
  }, [data]);

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

        return (
          <Input
            value={value}
            disabled={props.viewOnly}
            onChange={onChange}
            onBlur={onBlur}
          />
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

        const onChange = (event: any) => {
          setValue(event.target.value);
        };

        const onBlur = () => {
          updateData(info.row.original.identifier, value);
        };

        switch (info.row.original.type) {
          case "number": {
            return (
              <Input
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
                  value={value}
                  placeholder={"Select Entity"}
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
    setData([...collection]);

    if (props.setValues) {
      props.setValues([...data]);
    }
  }

  return (
    <Flex direction={"column"} gap={"2"} w={"100%"} align={"center"}>
      {/* Button Group */}
      {!props.viewOnly && (
        <Flex
          direction={"row"}
          gap={"2"}
          flexWrap={"wrap"}
          justify={"center"}
          align={"center"}
        >
          {/* Buttons to add Values */}
          <Button
            leftIcon={<Icon name={"p_date"} />}
            onClick={() => {
              setData([
                ...data,
                {
                  identifier: `p_date_${Math.round(performance.now())}`,
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
            leftIcon={<Icon name={"p_text"} />}
            onClick={() => {
              setData([
                ...data,
                {
                  identifier: `p_text_${Math.round(performance.now())}`,
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
            leftIcon={<Icon name={"p_number"} />}
            onClick={() => {
              setData([
                ...data,
                {
                  identifier: `p_number_${Math.round(performance.now())}`,
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
            leftIcon={<Icon name={"p_url"} />}
            onClick={() => {
              setData([
                ...data,
                {
                  identifier: `p_url_${Math.round(performance.now())}`,
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
            leftIcon={<Icon name={"entity"} />}
            onClick={() => {
              setData([
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
        </Flex>
      )}

      {/* Values list */}
      <Flex p={["1", "2"]} direction={"column"} gap={"1"} w={"100%"}>
        <DataTable columns={columns} data={data} setData={setData} viewOnly={props.viewOnly} />
      </Flex>
    </Flex>
  );
};

export default Values;
