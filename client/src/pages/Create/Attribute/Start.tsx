// React and Grommet
import React, { useState } from "react";
import {
  Anchor,
  Box,
  Button,
  Form,
  Heading,
  PageHeader,
  Text,
  TextArea,
  TextInput,
} from "grommet/components";
import { Page, PageContent } from "grommet";
import { Add, Checkmark } from "grommet-icons";

// Navigation
import { useNavigate } from "react-router-dom";

// Utility library
import _ from "underscore";

// Consola
import consola from "consola";

// Parameter components and custom types
import { AttributeStruct, ParameterStruct } from "types";

// Database functions
import { postData } from "src/database/functions";
import Parameter from "src/components/Parameter";

export const Start = ({}) => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parameters, setParameters] = useState([] as ParameterStruct[]);

  const attributeData: AttributeStruct = {
    name: name,
    description: description,
    parameters: parameters,
  };

  const onUpdate = (data: ParameterStruct) => {
    // Store the received Parameter information
    setParameters(
      parameters.filter((parameter) => {
        // Get the relevant Parameter
        if (parameter.identifier === data.identifier) {
          parameter.name = data.name;
          parameter.type = data.type;
          parameter.data = data.data;
        }
        return parameter;
      })
    );
  };

  const onRemove = (identifier: string) => {
    setParameters(parameters.filter((parameter) => {
      // Filter out the Parameter to be removed
      if (!_.isEqual(parameter.identifier, identifier)) {
        return parameter;
      } else {
        return;
      }
    }))
  };

  return (
    <Page kind="wide" pad={{left: "small", right: "small"}}>
      <PageContent>
        <PageHeader
          title="Create an Attribute"
          parent={<Anchor label="Home" href="/" />}
        />
          <Box fill>
            <Form
              onChange={() => {}}
              onSubmit={() => {
                // Push the data
                consola.debug("Creating Attribute:", attributeData);
                postData(`/attributes/create`, attributeData).then(() =>
                  navigate("/attributes")
                );
              }}
            >
              <Box direction="row" gap="medium">
                <Box direction="column" basis="1/3" gap="small">
                  <Heading level="4" margin="xsmall">
                    Details
                  </Heading>
                  <TextInput
                    placeholder={"Attribute Name"}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                  <TextArea
                    value={description}
                    placeholder={"Attribute Description"}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </Box>

                <Box direction="column" fill>
                  <Box direction="row" gap="small" justify="between">
                    <Heading level="4" margin="xsmall">
                      Parameters
                    </Heading>
                    <Button
                      icon={<Add />}
                      label="Add Parameter"
                      primary
                      onClick={() => {
                        // Create a unique identifier
                        const identifier = `parameter_${Math.round(performance.now())}`;

                        // Create an 'empty' attribute and add the data structure to the 'attributeData' collection
                        setParameters([
                          ...parameters,
                          {
                            identifier: identifier,
                            name: "",
                            type: "string",
                            data: "",
                          },
                        ]);
                      }}
                    />
                  </Box>

                  <Box direction="column" gap="small" margin="small" align="center">
                    {parameters.length > 0 ?
                      parameters.map((parameter) => {
                        return (
                          <Parameter
                            identifier={parameter.identifier}
                            name={parameter.name}
                            type={parameter.type}
                            data={parameter.data}
                            disabled={false}
                            onRemove={onRemove}
                            onUpdate={onUpdate}
                            showRemove
                          />
                        )
                      })
                    :
                      <Text>No parameters have been added.</Text>
                    }
                  </Box>
                </Box>
              </Box>

              {/* Action buttons */}
              <Box
                direction="row"
                flex={false}
                justify="between"
                margin="medium"
              >
                <Button label="Cancel" color="status-critical" onClick={() => navigate("/attributes")} />
                <Button
                  type="submit"
                  label="Finish"
                  icon={<Checkmark />}
                  reverse
                  primary
                />
              </Box>
            </Form>
          </Box>
      </PageContent>
    </Page>
  );
};
export default Start;
