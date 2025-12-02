import React, { useEffect, useState } from "react";
import {
  Button,
  EmptyState,
  Field,
  Fieldset,
  Flex,
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
      gap={"1"}
      p={"1"}
      h={"fit-content"}
      rounded={"md"}
      border={"1px solid"}
      borderColor={"gray.300"}
      grow={"1"}
    >
      {/* Collaborators display */}
      <Flex direction={"column"} gap={"1"}>
        <Flex direction={"row"} gap={"1"} align={"center"} ml={"0.5"}>
          <Icon name={"person"} size={"xs"} />
          <Text fontSize={"xs"} fontWeight={"semibold"}>
            Collaborators
          </Text>
        </Flex>
        <Flex direction={"row"} gap={"2"} align={"center"}>
          <Fieldset.Root>
            <Fieldset.Content>
              <Field.Root invalid={newCollaborator !== "" && !validOrcid}>
                <Input
                  placeholder={"ORCiD"}
                  size={"xs"}
                  rounded={"md"}
                  value={newCollaborator}
                  onChange={(e) => setNewCollaborator(e.target.value)}
                  disabled={!props.editing}
                />
              </Field.Root>
            </Fieldset.Content>
          </Fieldset.Root>
          <Spacer />
          <Button
            colorPalette={"green"}
            size={"xs"}
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
            <Icon name={"add"} size={"xs"} />
          </Button>
        </Flex>
        <Flex
          w={"100%"}
          py={"1"}
          px={"0"}
          justify={"center"}
          align={"center"}
          minH={props.projectCollaborators.length > 0 ? "fit-content" : "200px"}
        >
          {props.projectCollaborators.length === 0 ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon name={"person"} size={"lg"} />
                </EmptyState.Indicator>
                <EmptyState.Description>
                  No Collaborators
                </EmptyState.Description>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Stack
              gap={"1"}
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
                      <Tag.Label fontSize={"xs"}>Collaborator</Tag.Label>
                    </Tag.Root>
                  </Flex>
                  {props.editing && (
                    <Button
                      size={"2xs"}
                      colorPalette={"red"}
                      rounded={"md"}
                      variant={"subtle"}
                      aria-label="Remove collaborator"
                      onClick={() =>
                        props.setProjectCollaborators((collaborators) =>
                          collaborators.filter((c) => c !== collaborator),
                        )
                      }
                    >
                      Remove
                      <Icon name="delete" size={"xs"} />
                    </Button>
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
