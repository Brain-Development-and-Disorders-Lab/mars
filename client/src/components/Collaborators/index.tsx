import React, { useEffect, useState } from "react";
import {
  Button,
  Field,
  Fieldset,
  Flex,
  IconButton,
  Input,
  Separator,
  Spacer,
  Stack,
  Tag,
  Text,
} from "@chakra-ui/react";

// Custom components
import Icon from "@components/Icon";

// Custom types
import { CollaboratorsProps } from "@types";
import ActorTag from "@components/ActorTag";
import { isValidOrcid } from "src/util";

const Collaborators = (props: CollaboratorsProps) => {
  const [newCollaborator, setNewCollaborator] = useState("");
  const [validOrcid, setValidOrcid] = useState(false);

  // Check if the new collaborator is a valid ORCiD
  useEffect(() => {
    setValidOrcid(isValidOrcid(newCollaborator));
  }, [newCollaborator]);

  return (
    <Flex
      direction={"column"}
      gap={"2"}
      p={"2"}
      h={"fit-content"}
      rounded={"md"}
      border={"1px solid"}
      borderColor={"gray.300"}
      grow={"1"}
    >
      {/* Collaborators display */}
      <Flex direction={"column"} gap={"2"}>
        <Text fontSize={"sm"} fontWeight={"bold"}>
          Collaborators
        </Text>
        <Flex direction={"row"} gap={"2"} align={"center"}>
          <Fieldset.Root>
            <Fieldset.Content>
              <Field.Root invalid={newCollaborator !== "" && !validOrcid}>
                <Input
                  placeholder={"ORCiD"}
                  size={"sm"}
                  rounded={"md"}
                  value={newCollaborator}
                  onChange={(e) => setNewCollaborator(e.target.value)}
                  disabled={!props.editing}
                />
                {newCollaborator !== "" && !validOrcid && (
                  <Field.ErrorText>
                    <Text fontSize={"xs"} color={"red.500"}>
                      {validOrcid ? "" : "Invalid ORCiD"}
                    </Text>
                  </Field.ErrorText>
                )}
              </Field.Root>
            </Fieldset.Content>
          </Fieldset.Root>
          <Spacer />
          <Button
            colorPalette={"green"}
            size={"sm"}
            rounded={"md"}
            disabled={!props.editing || !validOrcid}
            onClick={() => {
              // Prevent adding empty or duplicate collaborator
              if (
                newCollaborator &&
                !props.projectCollaborators.includes(newCollaborator)
              ) {
                props.setProjectCollaborators((collaborators) => [
                  ...collaborators,
                  newCollaborator,
                ]);
                setNewCollaborator(""); // Clear the input after adding
              }
            }}
          >
            Add
            <Icon name={"add"} />
          </Button>
        </Flex>
        <Flex
          w={"100%"}
          py={"2"}
          px={"0"}
          justify={"center"}
          align={"center"}
          minH={props.projectCollaborators.length > 0 ? "fit-content" : "200px"}
        >
          {props.projectCollaborators.length === 0 ? (
            <Text color={"gray.400"} fontWeight={"semibold"} fontSize={"sm"}>
              No Collaborators
            </Text>
          ) : (
            <Stack
              gap={"2"}
              separator={<Separator variant={"solid"} />}
              w={"100%"}
            >
              {props.projectCollaborators.map((collaborator, index) => (
                <Flex
                  key={index}
                  align={"center"}
                  w={"100%"}
                  justify={"space-between"}
                >
                  <Flex gap={"2"} align={"center"}>
                    <ActorTag
                      orcid={collaborator}
                      fallback={"New User"}
                      size={"sm"}
                    />
                    <Tag.Root colorPalette={"green"}>
                      <Tag.Label>{collaborator}</Tag.Label>
                    </Tag.Root>
                  </Flex>
                  {props.editing && (
                    <IconButton
                      size={"sm"}
                      colorPalette={"red"}
                      rounded={"md"}
                      aria-label="Remove collaborator"
                      onClick={() =>
                        props.setProjectCollaborators((collaborators) =>
                          collaborators.filter((c) => c !== collaborator),
                        )
                      }
                    >
                      <Icon name="delete" />
                    </IconButton>
                  )}
                </Flex>
              ))}
            </Stack>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Collaborators;
