// React imports
import React, { useState } from "react";

// Custom and existing components
import { Flex, Tag, Text } from "@chakra-ui/react";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import SearchSelect from "@components/SearchSelect";
import { toaster } from "@components/Toast";

// Custom types
import { IGenericItem, MultiEntitySelectProps } from "@types";

// Variables
import { GLOBAL_STYLES } from "@variables";

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
        description: "Entity already staged or in Project already",
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
        justify={"center"}
        rounded={"md"}
        border={GLOBAL_STYLES.border.style}
        borderColor={GLOBAL_STYLES.border.color}
        minH={"60px"}
        wrap={"wrap"}
      >
        {props.selectedEntities.length > 0 ? (
          props.selectedEntities.map((entity) => (
            <Tag.Root key={entity._id} bg={"white"} rounded={"md"} pl={"0"}>
              <Tag.Label p={"0"} fontSize={"xs"}>
                <Flex w={"100%"} justify={"left"}>
                  <Linky id={entity._id} type={"entities"} size={"xs"} />
                </Flex>
              </Tag.Label>
              <Tag.EndElement mr={"0"}>
                <Tag.CloseTrigger
                  onClick={() => props.setSelectedEntities((prev) => prev.filter((e) => e._id !== entity._id))}
                />
              </Tag.EndElement>
            </Tag.Root>
          ))
        ) : (
          <Flex direction={"column"} gap={"3"} align={"center"} justify={"center"} p={"4"}>
            <Icon name={"entity"} size={"md"} color={GLOBAL_STYLES.entity.lightColor} />
            <Text fontSize={"xs"} fontWeight={"semibold"} color={"gray.400"}>
              No Entities selected
            </Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

export default MultiEntitySelect;
