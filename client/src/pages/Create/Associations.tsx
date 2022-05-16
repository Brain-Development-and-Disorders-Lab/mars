import {
  Box,
  Button,
  CheckBoxGroup,
  Form,
  FormField,
  Heading,
  Select,
  Tag,
} from "grommet";
import { LinkNext, LinkPrevious } from "grommet-icons";

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const Associations = ({}) => {
  const navigate = useNavigate();

  // Extract state from prior page
  const { state } = useLocation();
  const { id } = state as Create.Start;
  
  // Parent field
  const allParentData = [
    {id: "312635e76a76", customId: "d_2l3nP"},
    {id: "362ba72e76a7", customId: "c_3n2_pd"},
    {id: "a62ba72635e3", customId: "20190_203"},
  ];
  const [parent, setParent] = useState("");

  // Type the state array that will contain the children
  const initialChildren: string[] = [];
  const [children, setChildren] = useState(initialChildren);

  return (
    <>
      <Box direction="row" justify="between" align="center">
        <Heading level="2">Configure Associations for "{id}"</Heading>
      </Box>

      <Box margin="small">
        <Form
          onChange={() => {}}
          onSubmit={() => {}}
        >
          <Box direction="row">
            <Box direction="column">
              <FormField label="Linked Projects" name="projects" info="Specify the projects that this new sample should be associated with. The sample will then show up underneath the specified projects.">
                <CheckBoxGroup options={["(dunnart1234) Dunnart Prey Capture", "(ccddm2020) Metacognition in CCD"]} />
              </FormField>

              <FormField label="Linked Parent" name="parent" info="If the source of this sample currently exists or did exist in this system, specify that association here by searching for the parent sample.">
                <Select
                  options={allParentData.map((parent) => { return parent.customId })}
                  value={parent}
                  onChange={({ parent }) => setParent(parent)}
                  searchPlaceholder="Search..."
                  onSearch={() => {}}
                />
              </FormField>
            </Box>
            <Box direction="column">
              <FormField label="Linked Children" name="children" info="If this sample has any derivatives or samples that have been created from it, specify those associations here by searching for the corresponding sample.">
                <Select
                  options={allParentData.map((parent) => { return parent.customId })}
                  value={children}
                  onChange={({ value }) => {
                    if (!children.includes(value)) {
                      setChildren([...children, value])
                    }
                  }}
                  searchPlaceholder="Search..."
                  onSearch={() => {}}
                />
              </FormField>
              <Box direction="column" gap="xsmall">
                {children.map((child) => {
                  return <Tag name="Child ID" value={child} key={child} onRemove={() => {
                    setChildren(children.filter((item) => {
                      return item !== child;
                    }))
                  }}/>;
                })}
              </Box>
            </Box>
          </Box>

          <Box direction="row" justify="between" margin={{ top: "medium" }}>
            <Button label="Cancel" />
            <Button label="Back" icon={<LinkPrevious />} onClick={() => navigate("/create/start")}/>
            <Button type="submit" label="Continue" icon={<LinkNext />} reverse primary onClick={() => navigate("/create/parameters")} />
          </Box>
        </Form>
      </Box>
    </>
  );
};
export default Associations;
