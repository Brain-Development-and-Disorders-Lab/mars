// React and Grommet
import React, { useState } from "react";
import {
  Anchor,
  Box,
  Button,
  Form,
  Heading,
  PageHeader,
  Select,
  TextArea,
  TextInput,
} from "grommet/components";
import { Page, PageContent } from "grommet";
import { Add, Checkmark } from "grommet-icons";

import { ParameterStruct } from "types";
import ParameterGroup from "src/components/ParameterGroup";

// Constants
const VALID_TYPES = ["physical", "digital"];

export const Start = ({}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState();
  const [description, setDescription] = useState("");
  const [parameters, setParameters] = useState([] as ParameterStruct[]);

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
              onSubmit={() => {}}
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
                  />
                  <Select
                    placeholder="Attribute Type"
                    options={VALID_TYPES}
                    value={type}
                    width="auto"
                    onChange={({ option }) => setType(option)}
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

                  <Box direction="column" gap="small" margin="small">
                    <ParameterGroup
                      parameters={parameters}
                      onDataUpdate={(data: ParameterStruct) => {
                        // Store the received Parameter information
                        // Get the relevant Parameter
                        setParameters(
                          parameters.filter((parameter) => {
                            if (parameter.identifier === data.identifier) {
                              parameter.name = data.name;
                              parameter.type = data.type;
                              parameter.data = data.data;
                            }
                            return parameter;
                          })
                        );
                      }}
                      disabled={false}
                    />
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
                <Button label="Cancel" />
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
