import {
  Box,
  Button,
  CheckBoxGroup,
  Form,
  FormField,
  Heading,
} from "grommet";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const Associations = ({}) => {
  const navigate = useNavigate();

  // Extract state from prior page
  const { state } = useLocation();
  const { id } = state as Create.Start;

  // const [projects, setProjects] = useState([]);

  return (
    <>
      <Box direction="row" justify="between" align="center">
        <Heading level="2">Configure Associations for "{id}"</Heading>
      </Box>

      <Box width="medium" margin="small">
        <Form
          onChange={(value) => console.log("Change", value)}
          onReset={() => {}}
          onSubmit={(event) => console.log("Submit", event.value, event.touched)}
        >
          <FormField label="Linked Projects" name="projects" info="Specify the projects that this new sample should be associated with. The sample will then show up underneath the specified projects.">
            <CheckBoxGroup options={["(dunnart1234) Dunnart Prey Capture", "(ccddm2020) Metacognition in CCD"]} />
          </FormField>
          
          <Box direction="row" justify="between" margin={{ top: "medium" }}>
            <Button label="Cancel" />
            <Button label="Back" onClick={() => navigate("/create/start")}/>
            <Button type="submit" label="Continue" primary />
          </Box>
        </Form>
      </Box>
    </>
  );
};
export default Associations;
