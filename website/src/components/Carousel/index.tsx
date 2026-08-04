// React
import React, { useState } from "react";

// Existing components and icons
import { Box, Flex, IconButton, Image, Text } from "@chakra-ui/react";
import Icon from "../Icon";

const Carousel = (props: { images: { path: string; caption: string }[] }) => {
  const [imgIndex, setImgIndex] = useState(0);

  // Handle clicking the previous image button
  const handlePreviousClick = () => {
    setImgIndex((current) => (current === 0 ? props.images.length - 1 : current - 1));
  };

  // Handle clicking the next image button
  const handleNextClick = () => {
    setImgIndex((current) => (current === props.images.length - 1 ? 0 : current + 1));
  };

  return (
    <Flex w={"100%"} direction={"column"} gap={"2"} align={"center"}>
      <Flex w={"100%"} direction={"row"} gap={"4"} align={"center"} justify={"center"}>
        <IconButton
          aria-label={"Previous image"}
          colorScheme={"blue"}
          icon={<Icon name={"c_left"} />}
          onClick={handlePreviousClick}
        />
        <Flex direction={"column"} gap={"4"} align={"center"}>
          <Box
            position={"relative"}
            w={["70vw", "60rem"]}
            rounded={"xl"}
            overflow={"hidden"}
            boxShadow={"lg"}
            bg={"white"}
            // Locks the box to the screenshots' 1280x743 ratio so images fill it edge to edge
            style={{ aspectRatio: "1280 / 743" }}
          >
            {props.images.map((image, index) => (
              <Image
                key={image.path}
                src={image.path}
                position={"absolute"}
                inset={"0"}
                w={"100%"}
                h={"100%"}
                objectFit={"cover"}
                opacity={index === imgIndex ? 1 : 0}
                transition={"opacity 0.5s ease"}
              />
            ))}
          </Box>
          <Text fontWeight={"semibold"} color={"text.muted"}>
            {props.images[imgIndex].caption}
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
        {props.images.map((_image, index) => (
          <Flex
            key={`img-indicator-${index}`}
            rounded={"full"}
            bg={index === imgIndex ? "blue.600" : "border.default"}
            h={"10px"}
            w={"10px"}
            cursor={"pointer"}
            transition={"background 0.2s ease"}
            onClick={() => setImgIndex(index)}
          />
        ))}
      </Flex>
    </Flex>
  );
};

export default Carousel;
