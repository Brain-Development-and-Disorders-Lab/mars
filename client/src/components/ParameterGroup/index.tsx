import { Button, Flex, Heading, Icon } from "@chakra-ui/react";
import React, { Dispatch, SetStateAction } from "react";
import { SmallAddIcon } from "@chakra-ui/icons";
import { AiOutlineBlock, AiOutlineLink } from "react-icons/ai";
import { MdDateRange, MdOutlineTextFields } from "react-icons/md";
import { RiNumbersLine } from "react-icons/ri";

import _ from "underscore";

// Custom types and components
import { Parameters } from "types";
import { DateParameter, EntityParameter, NumberParameter, StringParameter, URLParameter } from "../Parameter";

/**
 * ParameterGroup component use to display a collection of Parameters and enable
 * creating and deleting Parameters. Displays collection as cards.
 * @param props collection of props to construct component
 * @return
 */
const ParameterGroup = (props: { parameters: Parameters[], viewOnly: boolean, setParameters?: Dispatch<SetStateAction<Parameters[]>> }) => {
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
      props.setParameters(props.parameters.filter((parameter) => {
        // Filter out the Parameter to be removed
        if (!_.isEqual(parameter.identifier, identifier)) {
          return parameter;
        } else {
          return;
        }
      }));
  };

  return (
    <Flex direction={"column"} gap={"4"} maxW={"2xl"} overflow={"hidden"}>
      <Heading>Parameters</Heading>

      {/* Button Group */}
      {!props.viewOnly &&
        <Flex direction={"row"} gap={"2"} flexWrap={"wrap"} justify={"center"} align={"center"}>
          {/* Buttons to add Parameters */}
          <Button
            leftIcon={<SmallAddIcon />}
            rightIcon={<Icon as={MdDateRange} />}
            onClick={() => {
              // Create an 'empty' attribute and add the data structure to the 'attributeData' collection
              props.setParameters &&
                props.setParameters([
                  ...props.parameters,
                  {
                    identifier: `p_date_${Math.round(performance.now())}`,
                    name: "",
                    type: "date",
                    data: new Date(),
                  },
                ]);
            }}
          >
            Date
          </Button>

          <Button
            leftIcon={<SmallAddIcon />}
            rightIcon={<Icon as={MdOutlineTextFields} />}
            onClick={() => {
              // Create an 'empty' attribute and add the data structure to the 'attributeData' collection
              props.setParameters &&
                props.setParameters([
                  ...props.parameters,
                  {
                    identifier: `p_string_${Math.round(performance.now())}`,
                    name: "",
                    type: "string",
                    data: "",
                  },
                ]);
            }}
          >
            String
          </Button>

          <Button
            leftIcon={<SmallAddIcon />}
            rightIcon={<Icon as={RiNumbersLine} />}
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
            leftIcon={<SmallAddIcon />}
            rightIcon={<Icon as={AiOutlineLink} />}
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
            leftIcon={<SmallAddIcon />}
            rightIcon={<Icon as={AiOutlineBlock} />}
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
      }

      {/* Card Group */}
      <Flex gap={"4"} margin={"sm"} p={"4"} maxW={"xl"} h={"sm"} overflowX={"auto"} >
        {props.parameters.length > 0 &&
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
                  <StringParameter
                    key={parameter.identifier}
                    identifier={parameter.identifier}
                    name={parameter.name}
                    type={"string"}
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
        }
      </Flex>
    </Flex>
  );
}

export default ParameterGroup;
