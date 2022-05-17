import {
  Box,
  Button,
  CheckBoxGroup,
  Form,
  FormField,
  Heading,
  Select,
  Spinner,
  Tag,
} from "grommet";
import { LinkNext, LinkPrevious } from "grommet-icons";

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getData } from "src/lib/database/getData";
import ErrorLayer from "src/view/components/ErrorLayer";

export const Associations = ({}) => {
  const navigate = useNavigate();

  // Extract state from prior page
  const { state } = useLocation();
  const { id, created, project, description } = state as Create.Start;
  
  // Setup state data
  const [parent, setParent] = useState({name: "", id: ""});
  const [children, setChildren] = useState([] as {name: string, id: string}[]);
  const [additionalProjects, setAdditionalProjects] = useState([] as {name: string, id: string}[]);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [projectData, setProjectData] = useState([] as ProjectStruct[]);
  const [sampleData, setSampleData] = useState([] as SampleStruct[]);

  // Options for Select element drop-down menu
  const [parentOptions, setParentOptions] = useState([] as {name: string, id: string}[]);
  const [childOptions, setChildOptions] = useState([] as {name: string, id: string}[]);

  const associationState: Create.Associations = {
    id: id,
    created: created,
    project: project,
    description: description,
    projects: additionalProjects,
    parent: parent.id,
    children: children,
  }

  useEffect(() => {
    const samples = getData(`/samples`);

    // Handle the response from the database
    samples.then((value) => {
      setSampleData(value);
      setChildOptions(value.map((e: SampleStruct) => { return { name: e.name, id: e._id } }))
      setParentOptions(value.map((e: SampleStruct) => { return { name: e.name, id: e._id } }))

      // Check the contents of the response
      if (value["error"] !== undefined) {
        setErrorMessage(value["error"]);
        setIsError(true);
      }
    });

    const projects = getData(`/projects`);

    // Handle the response from the database
    projects.then((value) => {
      setProjectData(value);
      
      // Check the contents of the response
      if (value["error"] !== undefined) {
        setErrorMessage(value["error"]);
        setIsError(true);
      }

      setIsLoaded(true);
    });
    return;
  }, []);

  return (
    <>
    {isLoaded && isError === false ?
    <>
      <Box direction="row" justify="between" align="center">
        <Heading level="2">Configure Associations for "{id}"</Heading>
      </Box>

      <Box margin="small">
        <Form
          onChange={() => {}}
          onSubmit={() => {navigate("/create/parameters", { state: associationState })}}
        >
          <Box direction="row">
            <Box direction="column">
              <FormField label="Associated Projects" name="projects" info="Specify the projects that this new sample should be associated with. The sample will then show up underneath the specified projects.">
                <CheckBoxGroup
                  options={projectData.map((project) => { return {name: project.name, id: project._id} })}
                  labelKey="name"
                  valueKey="id"
                  onChange={(event) => {
                    if (event) {
                      setAdditionalProjects([
                        ...additionalProjects,
                        {
                          name: (event.option as {name: string, id: string}).name,
                          id: (event.option as {name: string, id: string}).id,
                        }
                      ])
                    }
                  }}
                />
              </FormField>

              <FormField label="Linked Parent" name="parent" info="If the source of this sample currently exists or did exist in this system, specify that association here by searching for the parent sample.">
                <Select
                  options={parentOptions}
                  labelKey="name"
                  value={parent}
                  valueKey="name"
                  onChange={({ option }) => {
                    setParent(option);
                  }}
                  searchPlaceholder="Search..."
                  onSearch={(query) => {
                    const escapedText = query.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
                    const exp = new RegExp(escapedText, 'i');
                    setParentOptions(sampleData.filter((sample) => exp.test(sample.name)).map((sample) => { return { name: sample.name, id: sample._id }}));
                  }}
                />
              </FormField>
            </Box>
            <Box direction="column">
              <FormField label="Linked Children" name="children" info="If this sample has any derivatives or samples that have been created from it, specify those associations here by searching for the corresponding sample.">
                <Select
                  options={childOptions}
                  labelKey="name"
                  value={children}
                  valueKey="name"
                  onChange={({ value }) => {
                    if (!children.includes(value)) {
                      setChildren([...children, value])
                    }
                  }}
                  searchPlaceholder="Search..."
                  onSearch={(query) => {
                    const escapedText = query.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
                    const exp = new RegExp(escapedText, 'i');
                    setChildOptions(sampleData.filter((sample) => exp.test(sample.name)).map((sample) => { return { name: sample.name, id: sample._id }}));
                  }}
                />
              </FormField>
              <Box direction="column" gap="xsmall">
                {children.map((child) => {
                  return <Tag name="Child ID" value={child.name} key={child.name} onRemove={() => {
                    setChildren(children.filter((item) => {
                      return item !== child;
                    }))
                  }}/>;
                })}
              </Box>
            </Box>
          </Box>

          <Box direction="row" flex={false} justify="between">
            <Button label="Cancel" />
            <Button label="Back" icon={<LinkPrevious />} onClick={() => navigate("/create/start", { state: associationState })}/>
            <Button type="submit" label="Continue" icon={<LinkNext />} reverse primary />
          </Box>
        </Form>
      </Box>
    </>
    :
      <Box fill align="center" justify="center">
        <Spinner size="large"/>
      </Box>}
    {isError &&
      <ErrorLayer message={errorMessage} />
    }
    </>
  );
};
export default Associations;
