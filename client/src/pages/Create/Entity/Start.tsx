// React
import React, { useState } from "react";

// Navigation
import { useLocation } from "react-router-dom";

// Database and models
import { Create } from "types";

// Utility functions
import { pseudoId } from "src/database/functions";
import { Box, Button, Flex, FormControl, FormHelperText, FormLabel, Heading, Input, Text, Textarea } from "@chakra-ui/react";
import { SingleDatepicker } from "chakra-dayzed-datepicker";
import { ChevronRightIcon, CloseIcon, InfoOutlineIcon } from "@chakra-ui/icons";

export const Start = ({}) => {
  // Used to manage what detail inputs are presented
  // const [pageState, setPageState] = useState("start" as "start" | "attributes" | "associations");

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

  return (
    <Box m={"2"}>
      <Flex direction={"column"} p={"2"} pt={"8"} pb={"8"} >
        <Flex direction={"row"}>
          <Heading size={"2xl"}>Create Entity: Start</Heading>
        </Flex>
      </Flex>

      <Flex p={"2"} pb={"6"} direction={"row"} wrap={"wrap"} justify={"space-between"} gap={"6"}>
        <Flex direction={"column"} gap={"2"} maxW={"2xl"} p={"2"} rounded={"2xl"}>
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
        </Flex>

        <Flex direction={"column"} gap={"2"} p={"4"} rounded={"2xl"} background={"whitesmoke"}>
          <Flex align={"center"} gap={"2"}><InfoOutlineIcon boxSize={"8"} /><Heading>Entities</Heading></Flex>
          <Text>Entity information.</Text>
        </Flex>
      </Flex>

      {/* Action buttons */}
      <Flex p={"2"} direction={"row"} w={"full"} flexWrap={"wrap"} gap={"6"} justify={"space-between"}>
        <Button colorScheme={"red"} variant={"outline"} rightIcon={<CloseIcon />}>
          Cancel
        </Button>
        <Button colorScheme={"green"} rightIcon={<ChevronRightIcon />}>
          Next
        </Button>
      </Flex>
    </Box>
  );
};
export default Start;
