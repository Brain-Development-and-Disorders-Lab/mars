// React
import React, { useState } from "react";
import { Box, Button, Flex, FormControl, FormHelperText, FormLabel, Heading, Input, Text, Textarea } from "@chakra-ui/react";
import { SingleDatepicker } from "chakra-dayzed-datepicker";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, InfoOutlineIcon } from "@chakra-ui/icons";

import _ from "underscore";

// Navigation
import { useLocation } from "react-router-dom";

// Database and models
import { Create } from "types";

// Utility functions
import { pseudoId } from "src/database/functions";

export const Start = ({}) => {
  // Used to manage what detail inputs are presented
  const [pageState, setPageState] = useState("start" as "start" | "attributes" | "associations");

  // Extract prior state and apply
  const { state } = useLocation();

  const initialName = state === null ? pseudoId() : (state as Create.Entity.Associations).name;
  const initialCreated = state === null ? new Date().toISOString() : (state as Create.Entity.Associations).created;
  const initialOwner = state === null ? "" : (state as Create.Entity.Associations).owner;
  const initialDescription = state === null ? "" : (state as Create.Entity.Associations).description;

  const [name, setName] = useState(initialName);
  const [created, setCreated] = useState(new Date(initialCreated));
  const [owner, setOwner] = useState(initialOwner);
  const [description, setDescription] = useState(initialDescription);

  // Handle clicking "Next"
  const onNext = () => {
    if (_.isEqual("start", pageState)) {
      setPageState("associations");
    } else if (_.isEqual("associations", pageState)) {
      setPageState("attributes");
    }
  };

  // Handle clicking "Back"
  const onBack = () => {
    if (_.isEqual("associations", pageState)) {
      setPageState("start");
    } else if (_.isEqual("attributes", pageState)) {
      setPageState("associations");
    }
  };

  // Handle clicking "Cancel"
  // const onCancel = () => {
    
  // };

  return (
    <Box m={"2"}>
      <Flex direction={"column"} p={"2"} pt={"8"} pb={"8"} >
        <Flex direction={"row"}>
          <Heading size={"2xl"}>Create Entity</Heading>
        </Flex>
      </Flex>

      <Flex p={"2"} pb={"6"} direction={"row"} wrap={"wrap"} justify={"space-between"} gap={"6"}>
        {/* "Start" page */}
        {_.isEqual("start", pageState) &&
          <Flex direction={"column"} gap={"2"} maxW={"xl"} p={"2"} rounded={"2xl"}>
            <Heading size={"xl"} margin={"xs"}>
              Details
            </Heading>
            <Text>
              Specify some basic details about this Entity.
              Relations between Entities and membership to Collections can be specified on the following page.
              Finally, the metadata associated with this Entity should be specified using Attributes and corresponding Parameters.
            </Text>
            <Flex direction={"row"} gap={"2"} grow={"1"}>
              <Flex direction={"column"} gap={"2"}>
                <FormControl>
                  <FormLabel>Name</FormLabel>
                  <Input
                    name="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                  <FormHelperText>A standardised name or ID for the Entity.</FormHelperText>
                </FormControl>
                <FormControl>
                  <FormLabel>Owner</FormLabel>
                  <Input
                    name="owner"
                    value={owner}
                    onChange={(event) => setOwner(event.target.value)}
                    required
                  />
                  <FormHelperText>Owner of the Entity.</FormHelperText>
                </FormControl>
                <FormControl>
                  <FormLabel>Created</FormLabel>
                  <SingleDatepicker
                    id="owner"
                    name="owner"
                    propsConfigs={{
                      dateNavBtnProps: {
                        colorScheme: "gray"
                      },
                      dayOfMonthBtnProps: {
                        defaultBtnProps: {
                          borderColor: "blackAlpha.300",
                          _hover: {
                            background: "black",
                            color: "white",
                          }
                        },
                        selectedBtnProps: {
                          background: "black",
                          color: "white",
                        },
                        todayBtnProps: {
                          borderColor: "blackAlpha.300",
                          background: "gray.50",
                          color: "black",
                        }
                      },
                    }}
                    date={created}
                    onDateChange={setCreated}
                  />
                  <FormHelperText>Date the Entity was created.</FormHelperText>
                </FormControl>
              </Flex>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
                <FormHelperText>A brief description of the new Entity. Most details should be inputted as Attributes with Parameters.</FormHelperText>
              </FormControl>
            </Flex>
          </Flex>}
        {_.isEqual("start", pageState) &&
          <Flex direction={"column"} gap={"2"} p={"4"} rounded={"2xl"} background={"whitesmoke"} maxW={"xl"}>
            <Flex align={"center"} gap={"2"}><InfoOutlineIcon boxSize={"8"} /><Heading>Entities</Heading></Flex>
            <Text>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</Text>
            <Text>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</Text>
            <Text>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</Text>
            <Text>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</Text>
          </Flex>}

        {/* "Associations" page */}
        {_.isEqual("associations", pageState) &&
          <Flex direction={"column"} gap={"2"} maxW={"xl"} p={"2"} rounded={"2xl"}>
            <Heading size={"xl"} margin={"xs"}>
              Associations
            </Heading>
          </Flex>}

        {/* "Attributes" page */}
        {_.isEqual("attributes", pageState) &&
          <Flex direction={"column"} gap={"2"} maxW={"xl"} p={"2"} rounded={"2xl"}>
            <Heading size={"xl"} margin={"xs"}>
              Attributes
            </Heading>
          </Flex>}
      </Flex>

      {/* Action buttons */}
      <Flex p={"2"} direction={"row"} w={"full"} flexWrap={"wrap"} gap={"6"} justify={"space-between"}>
        <Button colorScheme={"red"} variant={"outline"} rightIcon={<CloseIcon />}>
          Cancel
        </Button>
        {!_.isEqual("start", pageState) &&
          <Button colorScheme={"orange"} variant={"outline"} rightIcon={<ChevronLeftIcon />} onClick={onBack}>
            Back
          </Button>
        }
        <Button colorScheme={"green"} rightIcon={<ChevronRightIcon />} onClick={onNext}>
          {_.isEqual("attributes", pageState) ? "Finish" : "Next"}
        </Button>
      </Flex>
    </Box>
  );
};

export default Start;
