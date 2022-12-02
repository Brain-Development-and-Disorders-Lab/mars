import { Button, Flex } from "@chakra-ui/react";
import React, { Dispatch, SetStateAction } from "react";
import { SmallAddIcon } from "@chakra-ui/icons";

import _ from "underscore";

import { Parameters } from "types";
import { DateParameter, EntityParameter, NumberParameter, StringParameter, URLParameter } from "../Parameter";

const ParameterGroup = (props: { parameters: Parameters[], setParameters?: Dispatch<SetStateAction<Parameters[]>> }) => {
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
    <Flex direction={"column"} gap={"4"} maxW={"2xl"}>
      <Flex direction={"row"} gap={"2"} flexWrap={"wrap"} justify={"center"} align={"center"}>
        {/* Buttons to add Parameters */}
        <Button
          leftIcon={<SmallAddIcon />}
          onClick={() => {
            // Create an 'empty' attribute and add the data structure to the 'attributeData' collection
            props.setParameters &&
              props.setParameters([
                ...props.parameters,
                {
                  identifier: `parameter_${Math.round(performance.now())}`,
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
          onClick={() => {
            // Create an 'empty' attribute and add the data structure to the 'attributeData' collection
            props.setParameters &&
              props.setParameters([
                ...props.parameters,
                {
                  identifier: `parameter_${Math.round(performance.now())}`,
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
          onClick={() => {
            // Create an 'empty' attribute and add the data structure to the 'attributeData' collection
            props.setParameters &&
              props.setParameters([
                ...props.parameters,
                {
                  identifier: `parameter_${Math.round(performance.now())}`,
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
          onClick={() => {
            // Create an 'empty' attribute and add the data structure to the 'attributeData' collection
            props.setParameters &&
              props.setParameters([
                ...props.parameters,
                {
                  identifier: `parameter_${Math.round(performance.now())}`,
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
          onClick={() => {
            // Create an 'empty' attribute and add the data structure to the 'attributeData' collection
            props.setParameters &&
              props.setParameters([
                ...props.parameters,
                {
                  identifier: `parameter_${Math.round(performance.now())}`,
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

      <Flex gap={"4"} margin={"sm"} p={"4"} maxW={"2xl"} h={"100%"} overflowX={"auto"} >
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
                    disabled={false}
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
                    disabled={false}
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
                    disabled={false}
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
                    disabled={false}
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
                    disabled={false}
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
