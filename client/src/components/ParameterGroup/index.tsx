import React, { Dispatch, SetStateAction } from "react";
import { Button, Flex, Icon, Text, VStack } from "@chakra-ui/react";
import { BsBox, BsCalendarWeek, BsGraphUp, BsLink45Deg, BsTextareaT } from "react-icons/bs";

import _ from "lodash";

// Custom types and components
import { Parameters } from "@types";
import {
  DateParameter,
  EntityParameter,
  NumberParameter,
  TextParameter,
  URLParameter,
} from "@components/Parameter";

/**
 * ParameterGroup component use to display a collection of Parameters and enable
 * creating and deleting Parameters. Displays collection as cards.
 * @param props collection of props to construct component
 * @return
 */
const ParameterGroup = (props: {
  parameters: Parameters[];
  viewOnly: boolean;
  setParameters?: Dispatch<SetStateAction<Parameters[]>>;
}) => {
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

  const onRemove = (identifier: string) => {
    props.setParameters &&
      props.setParameters(
        props.parameters.filter((parameter) => {
          // Filter out the Parameter to be removed
          if (!_.isEqual(parameter.identifier, identifier)) {
            return parameter;
          } else {
            return;
          }
        })
      );
  };

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
                    data: new Date().toISOString(),
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
        <VStack spacing={4}>
          {props.parameters.length > 0 ? (
            props.parameters.map((parameter) => {
              switch (parameter.type) {
                case "date": {
                  return (
                    <DateParameter
                      key={parameter.identifier}
                      identifier={parameter.identifier}
                      name={parameter.name}
                      type={"date"}
                      data={parameter.data}
                      onRemove={onRemove}
                      onUpdate={onUpdate}
                      disabled={props.viewOnly}
                      showRemove
                    />
                  );
                }
                case "entity": {
                  return (
                    <EntityParameter
                      key={parameter.identifier}
                      identifier={parameter.identifier}
                      name={parameter.name}
                      type={"entity"}
                      data={parameter.data}
                      onRemove={onRemove}
                      onUpdate={onUpdate}
                      disabled={props.viewOnly}
                      showRemove
                    />
                  );
                }
                case "number": {
                  return (
                    <NumberParameter
                      key={parameter.identifier}
                      identifier={parameter.identifier}
                      name={parameter.name}
                      type={"number"}
                      data={parameter.data}
                      onRemove={onRemove}
                      onUpdate={onUpdate}
                      disabled={props.viewOnly}
                      showRemove
                    />
                  );
                }
                case "url": {
                  return (
                    <URLParameter
                      key={parameter.identifier}
                      identifier={parameter.identifier}
                      name={parameter.name}
                      type={"url"}
                      data={parameter.data}
                      onRemove={onRemove}
                      onUpdate={onUpdate}
                      disabled={props.viewOnly}
                      showRemove
                    />
                  );
                }
                default: {
                  return (
                    <TextParameter
                      key={parameter.identifier}
                      identifier={parameter.identifier}
                      name={parameter.name}
                      type={"text"}
                      data={parameter.data}
                      onRemove={onRemove}
                      onUpdate={onUpdate}
                      disabled={props.viewOnly}
                      showRemove
                    />
                  );
                }
              }
            })
          ) : (
            <Flex align={"center"} justify={"center"}>
              <Text>No Parameters specified.</Text>
            </Flex>
          )}
        </VStack>
      </Flex>
    </Flex>
  );
};

export default ParameterGroup;
