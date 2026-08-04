// React imports
import React, { useState } from "react";

// Custom and existing components
import { Flex, Tag, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import SearchSelect from "@components/SearchSelect";
import { toaster } from "@components/Toast";
import Tooltip from "@components/Tooltip";

// Custom types
import { IGenericItem, MultiEntitySelectProps } from "@types";

// Variables
import { STYLES } from "@variables";

const MultiEntitySelect = (props: MultiEntitySelectProps) => {
  const [selectedEntity, setSelectedEntity] = useState({} as IGenericItem);

  const handleSelect = (selection: IGenericItem) => {
    let invalid = false;
    props.setSelectedEntities((prev) => {
      const alreadyStaged = prev.some((e) => e._id === selection._id);
      const alreadyInProject = props.projectEntities.includes(selection._id);
      invalid = alreadyStaged || alreadyInProject;
      return alreadyStaged || alreadyInProject ? prev : [...prev, selection];
    });
    if (invalid) {
      toaster.create({
        title: "Cannot add Entity",
        description: "Entity is already staged, or Entity already exists in Project!",
        type: "warning",
        duration: 2000,
        closable: true,
      });
    }
    setSelectedEntity({} as IGenericItem);
  };

  return (
    <Flex direction={"column"} gap={"1"}>
      <SearchSelect
        id={"entitySearchSelect"}
        resultType={"entity"}
        value={selectedEntity}
        onChange={handleSelect}
        placeholder={"Search entities..."}
      />
      <Flex
        direction={"row"}
        gap={"1"}
        p={"1"}
        align={"center"}
        justify={props.selectedEntities.length > 0 ? "start" : "center"}
        rounded={"md"}
        border={STYLES.border.style}
        borderColor={STYLES.border.color}
        minH={"60px"}
        wrap={"wrap"}
      >
        {props.selectedEntities.length > 0 ? (
          props.selectedEntities.map((entity) => (
            <Tag.Root
              key={entity._id}
              rounded={"xl"}
              border={STYLES.border.style}
              borderColor={STYLES.border.color}
              bg={"white"}
              p={"1"}
            >
              <Tag.Label fontSize={"xs"} bg={"white"} border={"0px 1px 0px 1px solid"}>
                <Flex h={"100%"} justify={"left"}>
                  <Linky id={entity._id} type={"entities"} />
                </Flex>
              </Tag.Label>
              <Tag.EndElement mr={"0"}>
                <Tooltip content={"Remove"} showArrow>
                  <Tag.CloseTrigger
                    cursor={"pointer"}
                    onClick={() => props.setSelectedEntities((prev) => prev.filter((e) => e._id !== entity._id))}
                  />
                </Tooltip>
              </Tag.EndElement>
            </Tag.Root>
          ))
        ) : (
          <Flex direction={"column"} gap={"3"} align={"center"} justify={"center"} p={"4"}>
            <Icon name={"entity"} size={"md"} color={STYLES.entity.color.light} />
            <Text fontSize={"xs"} fontWeight={"semibold"} color={"text.faint"}>
              No Entities selected
            </Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

export default MultiEntitySelect;
