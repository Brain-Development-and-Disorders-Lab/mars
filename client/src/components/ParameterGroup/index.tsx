import React, { ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from "react";
import { Button, Checkbox, Flex, Icon, Input, Link, Select, Spinner, Text, useToast } from "@chakra-ui/react";
import { BsArrowUpRight, BsBox, BsCalendarWeek, BsGraphUp, BsLink45Deg, BsTextareaT } from "react-icons/bs";
import { createColumnHelper } from "@tanstack/react-table";

import _ from "lodash";
import dayjs from "dayjs";

// Custom types and components
import { EntityModel, Parameters } from "@types";
import { DataTable } from "@components/DataTable";
import Linky from "@components/Linky";

// Utility functions
import { getData } from "@database/functions";

/**
 * Parameters component use to display a collection of Parameters and enable
 * creating and deleting Parameters. Displays collection as cards.
 * @param props collection of props to construct component
 * @return
 */
const Parameters = (props: {
  parameters: Parameters[];
  viewOnly: boolean;
  setParameters?: Dispatch<SetStateAction<Parameters[]>>;
}) => {
  const toast = useToast();
  const [entities, setEntities] = useState([] as EntityModel[]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    getData(`/entities`).then((value) => {
      setEntities(value);
      setIsLoaded(true);
    }).catch((_error) => {
      toast({
        title: "Error",
        description: "Could not retrieve Entities.",
        status: "error",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }).finally(() => {
      setIsLoaded(true);
    });
    return;
  }, []);

  const onUpdate = (data: Parameters) => {
    // Store the received Parameter information
    props.setParameters &&
      props.setParameters(
        props.parameters.filter((parameter) => {
          // Get the relevant Parameter
          if (parameter.identifier === data.identifier) {
            parameter.name = data.name;
            parameter.data = data.data;
          }
          return parameter;
        })
      );
  };

  // const onRemove = (identifier: string) => {
  //   props.setParameters &&
  //     props.setParameters(
  //       props.parameters.filter((parameter) => {
  //         // Filter out the Parameter to be removed
  //         if (!_.isEqual(parameter.identifier, identifier)) {
  //           return parameter;
  //         } else {
  //           return;
  //         }
  //       })
  //     );
  // };

  const data: Parameters[] = props.parameters;
  const columnHelper = createColumnHelper<Parameters>();
  const columns = [
    {
      id: "select",
      header: ({ table }: any) => (
        <Checkbox
          {...{
            isChecked: table.getIsAllRowsSelected(),
            isIndeterminate: table.getIsSomeRowsSelected(),
            onChange: table.getToggleAllRowsSelectedHandler(),
          }}
        />
      ),
      cell: ({ row }: any) => (
        <div className="px-1">
          <Checkbox
            {...{
              isChecked: row.getIsSelected(),
              disabled: !row.getCanSelect(),
              isIndeterminate: row.getIsSomeSelected(),
              onChange: row.getToggleSelectedHandler(),
            }}
          />
        </div>
      ),
    },
    columnHelper.accessor("type", {
      cell: ({ getValue }) => {
        return (
          <Text>{getValue()}</Text>
        );
      },
    }),
    columnHelper.accessor("name", {
      cell: ({ getValue, row }) => {
        const initialValue = getValue();
        const [value, setValue] = useState(initialValue);

        useEffect(() => {
          setValue(initialValue);
        }, [initialValue]);

        const onBlur = () => {
          if (!props.viewOnly) {
            // Clone and modify the original Parameter
            const updatedParameter = _.cloneDeep(row.original);
            updatedParameter.data = value;
            onUpdate(updatedParameter);
          }
        };

        const onChange = (event: ChangeEvent<HTMLInputElement>) => {
          if (!props.viewOnly) {
            setValue(event.target.value);
          }
        };

        return (
          <Input
            value={value}
            onChange={onChange}
            onBlur={onBlur}
          />
        );
      },
      header: "Name",
    }),
    columnHelper.accessor("data", {
      cell: ({ getValue, row }) => {
        const initialValue = getValue();
        const [value, setValue] = useState(initialValue);
        const type = row.original.type;

        useEffect(() => {
          setValue(initialValue);
        }, [initialValue]);

        const onBlur = () => {
          if (!props.viewOnly) {
            // Clone and modify the original Parameter
            const updatedParameter = _.cloneDeep(row.original);
            updatedParameter.data = value;
            onUpdate(updatedParameter);
          }
        };

        const onChange = (event: ChangeEvent<HTMLInputElement>) => {
          if (!props.viewOnly) {
            setValue(event.target.value);
          }
        };

        if (_.isEqual(type, "date")) {
          return (
            <Input
              type={"datetime-local"}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
            />
          );
        } else if (_.isEqual(type, "URL")) {
          return props.viewOnly ? (
            <Link href={value.toString()} color="dark-1" isExternal>
              {value}
              <Icon as={BsArrowUpRight} mx='2px' />
            </Link>
          ) : (
            <Input
              value={value}
              onChange={onChange}
              onBlur={onBlur}
            />
          );
        } else if (_.isEqual(type, "entity")) {
          return props.viewOnly ? (
            <Linky type="entities" id={value.toString()} />
          ) : (
            // Show a spinner in place while loading Entity data
            isLoaded ? (
              <Select
                title="Select Entity"
                value={value}
                placeholder={"Select Entity"}
                disabled={props.viewOnly}
                onChange={(event) => {
                  setValue(event.target.value.toString());
                }}
              >
                {isLoaded &&
                  entities.map((entity) => {
                    return (
                      <option key={entity._id} value={entity._id}>
                        {entity.name}
                      </option>
                    );
                  })}
              </Select>
            ) : (
              <Spinner size={"sm"} />
            ));
        } else {
          return (
            <Input
              value={value}
              onChange={onChange}
              onBlur={onBlur}
            />
          );
        }
      },
      header: "Data",
    }),
  ];

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
          {/* Buttons to add Parameters */}
          <Button
            leftIcon={<Icon as={BsCalendarWeek} />}
            onClick={() => {
              // Create an 'empty' attribute and add the data structure to the 'attributeData' collection
              props.setParameters &&
                props.setParameters([
                  ...props.parameters,
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
            leftIcon={<Icon as={BsTextareaT} />}
            onClick={() => {
              // Create an 'empty' attribute and add the data structure to the 'attributeData' collection
              props.setParameters &&
                props.setParameters([
                  ...props.parameters,
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
            leftIcon={<Icon as={BsGraphUp} />}
            onClick={() => {
              // Create an 'empty' attribute and add the data structure to the 'attributeData' collection
              props.setParameters &&
                props.setParameters([
                  ...props.parameters,
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
            leftIcon={<Icon as={BsLink45Deg} />}
            onClick={() => {
              // Create an 'empty' attribute and add the data structure to the 'attributeData' collection
              props.setParameters &&
                props.setParameters([
                  ...props.parameters,
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
            leftIcon={<Icon as={BsBox} />}
            onClick={() => {
              // Create an 'empty' attribute and add the data structure to the 'attributeData' collection
              props.setParameters &&
                props.setParameters([
                  ...props.parameters,
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

      {/* Parameter List */}
      <Flex
        p={["1", "2"]}
        direction={"column"}
        gap={"1"}
        w={"100%"}
      >
        <DataTable columns={columns} data={data} />
      </Flex>
    </Flex>
  );
};

export default Parameters;
