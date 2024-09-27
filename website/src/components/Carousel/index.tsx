// React
import React, { useEffect, useState } from "react";

// Existing components and icons
import { Flex, IconButton, Image, Text } from "@chakra-ui/react";

// Utility functions and libraries
import _ from "lodash";
import consola from "consola";
import Icon from "../Icon";

const Carousel = (props: { images: { path: string; caption: string }[] }) => {
  const [imgPath, setImgPath] = useState("");
  const [imgCaption, setImgCaption] = useState("");
  const [imgIndex, setImgIndex] = useState(0);

  // Handle clicking the previous image button
  const handlePreviousClick = () => {
    if (imgIndex === 0) {
      // Reset to last image
      setImgIndex(props.images.length - 1);
    } else {
      setImgIndex(imgIndex - 1);
    }
  };

  // Handle clicking the next image button
  const handleNextClick = () => {
    if (imgIndex === props.images.length - 1) {
      // Reset to first image
      setImgIndex(0);
    } else {
      setImgIndex(imgIndex + 1);
    }
  };

  // Setup carousel state
  useEffect(() => {
    if (props.images.length > 0) {
      setImgIndex(0);
      setImgPath(props.images[0].path);
      setImgCaption(props.images[0].caption);
    } else {
      consola.warn("No images provided for Carousel");
    }
  }, []);

  // Update displayed image
  useEffect(() => {
    setImgPath(props.images[imgIndex].path);
    setImgCaption(props.images[imgIndex].caption);
  }, [imgIndex]);

  return (
    <Flex w={"100%"} direction={"column"} gap={"2"} align={"center"}>
      <Flex
        w={"100%"}
        direction={"row"}
        gap={"4"}
        align={"center"}
        justify={"center"}
      >
        <IconButton
          aria-label={"Previous image"}
          colorScheme={"blue"}
          icon={<Icon name={"c_left"} />}
          onClick={handlePreviousClick}
        />
        <Flex h={"100%"} direction={"column"} gap={"4"}>
          <Image src={imgPath} rounded={"xl"} maxH={"lg"} boxShadow={"lg"} />
          <Text fontWeight={"semibold"} color={"gray.600"}>
            {imgCaption}
          </Text>
        </Flex>
        <IconButton
          aria-label={"Next image"}
          colorScheme={"blue"}
          icon={<Icon name={"c_right"} />}
          onClick={handleNextClick}
        />
      </Flex>
      <Flex direction={"row"} justify={"space-around"} gap={"2"}>
        {props.images.map((_image, index) => {
          return (
            <Flex
              key={`img-indicator-${index}`}
              rounded={"full"}
              bg={index === imgIndex ? "gray.400" : "gray.200"}
              h={"10px"}
              w={"10px"}
              onClick={() => setImgIndex(index)}
            ></Flex>
          );
        })}
      </Flex>
    </Flex>
  );
};

export default Carousel;
