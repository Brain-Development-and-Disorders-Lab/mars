// React
import React from "react";

// Existing and custom components
import { Flex, Input, Text, Textarea } from "@chakra-ui/react";
import ActorTag from "@components/ActorTag";
import TimestampTag from "@components/TimestampTag";
import VisibilityTag from "@components/VisibilityTag";

// Existing and custom types
import { TemplateOverviewCardProps } from "@types";

// Variables
import { STYLES } from "@variables";

const TemplateOverviewCard = ({
  name,
  onNameChange,
  nameReadOnly,
  owner,
  timestamp,
  visibilityIsPublic,
  description,
  onDescriptionChange,
  descriptionReadOnly,
  workspace,
  isPublic,
}: TemplateOverviewCardProps) => (
  <Flex direction={"row"} gap={"2"} p={"0"} wrap={"wrap"} align={"stretch"}>
    {/* Overview */}
    <Flex
      direction={"column"}
      p={"2"}
      h={"fit-content"}
      gap={"2"}
      rounded={"md"}
      grow={"1"}
      border={STYLES.border.style}
      borderColor={STYLES.border.color}
      bg={"surface.card"}
      basis={{ base: "100%", md: "calc(50% - 4px)" }}
      minW={{ base: "100%", md: "calc(50% - 4px)" }}
    >
      <Flex direction={"row"} gap={"1"} align={"center"}>
        <Flex direction={"column"} gap={"1"} grow={"1"}>
          <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
            Name
          </Text>
          <Input
            id={"attributeNameInput"}
            size={"xs"}
            value={name}
            onChange={onNameChange ? (event) => onNameChange(event.target.value) : undefined}
            readOnly={nameReadOnly}
            bg={"white"}
            rounded={"md"}
            border={STYLES.border.style}
            borderColor={STYLES.border.color}
          />
        </Flex>
      </Flex>

      <Flex gap={"2"} direction={"row"} wrap={"wrap"}>
        <Flex direction={"column"} gap={"1"}>
          <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
            Owner
          </Text>
          <ActorTag identifier={owner} fallback={"No Owner"} size={"sm"} workspace={workspace} isPublic={isPublic} />
        </Flex>

        <Flex direction={"column"} gap={"1"}>
          <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
            Timestamp
          </Text>
          <TimestampTag timestamp={timestamp} description={"Created"} />
        </Flex>

        <Flex direction={"column"} gap={"1"}>
          <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
            Visibility
          </Text>
          <VisibilityTag isPublic={visibilityIsPublic} isInherited />
        </Flex>
      </Flex>
    </Flex>

    {/* Description */}
    <Flex
      direction={"column"}
      p={"2"}
      h={"100%"}
      gap={"2"}
      border={STYLES.border.style}
      borderColor={STYLES.border.color}
      bg={"surface.card"}
      rounded={"md"}
      grow={"1"}
      basis={{ base: "100%", md: "calc(50% - 4px)" }}
      minW={{ base: "100%", md: "calc(50% - 4px)" }}
    >
      <Text fontSize={"xs"} fontWeight={"semibold"} color={STYLES.font.secondaryHeader.color} ml={"0.5"}>
        Description
      </Text>
      <Textarea
        id={"attributeDescriptionInput"}
        value={description}
        size={"xs"}
        h={"100%"}
        readOnly={descriptionReadOnly}
        onChange={onDescriptionChange ? (event) => onDescriptionChange(event.target.value) : undefined}
      />
    </Flex>
  </Flex>
);

export default TemplateOverviewCard;
