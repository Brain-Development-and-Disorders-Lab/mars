// React and interface library
import React, { useEffect, useState } from "react";
import {
  Flex,
  IconButton,
  Button,
  useDisclosure,
  Icon,
  Image,
  Heading,
  Text,
  Divider,
  useToast,
  Tag,
  Spinner,
} from "@chakra-ui/react";
import { BsBarChart, BsBox, BsGrid, BsList, BsPlusLg, BsGear, BsSearch, BsXLg } from "react-icons/bs";

// Functions to retrieve database information
import { getData } from "@database/functions";

// Router navigation
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const Navigation = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();

  /**
   * Helper function to close menu on responsive screen sizes
   * when a menu item is clicked
   * @param {string} destination URL to navigate to
   */
  const responsiveNavigate = (destination: string) => {
    onClose();
    navigate(destination);
  };

  // Loading state
  const [isLoaded, setIsLoaded] = useState(false);

  // Entity and Collection status counts
  const [entityCount, setEntityCount] = useState("0");
  const [collectionCount, setCollectionCount] = useState("0");

  useEffect(() => {
    getData(`/entities`)
      .then((value) => {
        setEntityCount(value.length > 100 ? "100+" : value.length.toString());
      }).catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Entities data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      }).finally(() => {
        setIsLoaded(true);
      });

    getData(`/collections`)
      .then((value) => {
        setCollectionCount(value.length > 100 ? "100+" : value.length.toString());
      }).catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Collections data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      }).finally(() => {
        setIsLoaded(true);
      });
  });

  return (
    <Flex w={"100%"}>
      {/* Main navigation group */}
      <Flex direction={"column"} display={{ base: "none", lg: "flex" }} gap={"6"}>
        {/* Icon */}
        <Flex direction={"row"} align={"center"} gap={"2"}>
          <Image src="/Favicon.png" boxSize={"36px"} />
          <Flex direction={"column"}>
            <Heading fontWeight={"semibold"} size={"md"}>MARS</Heading>
            <Text color={"gray.400"}>{dayjs(Date.now()).format("ddd, DD MMM").toString()}</Text>
          </Flex>
        </Flex>

        {/* Menu items */}
        <Flex direction={"column"} align={"self-start"} gap={"6"}>
          <Button key={"dashboard"} variant={"link"} leftIcon={<Icon as={BsBarChart} />} onClick={() => navigate("/")}>
            Dashboard
          </Button>
          <Button leftIcon={<Icon as={BsPlusLg} />} variant={"link"} onClick={() => navigate("/create")}>
            Create
          </Button>

          <Divider />

          <Button leftIcon={<Icon as={BsBox} />} variant={"link"} onClick={() => navigate("/entities")}>
            <Flex align={"center"} gap={"2"}>
              <Text>Entities</Text>
              <Tag>{isLoaded ? entityCount : <Spinner size={"xs"} />}</Tag>
            </Flex>
          </Button>
          <Button leftIcon={<Icon as={BsGrid} />} variant={"link"} onClick={() => navigate("/collections")}>
            <Flex align={"center"} gap={"2"}>
              <Text>Collections</Text>
              <Tag>{isLoaded ? collectionCount : <Spinner size={"xs"} />}</Tag>
            </Flex>
          </Button>
          <Button leftIcon={<Icon as={BsGear} />} variant={"link"} onClick={() => navigate("/attributes")}>
            Attributes
          </Button>

          <Divider />

          <Button
            key={"search"}
            variant={"link"}
            leftIcon={<Icon as={BsSearch} />}
            onClick={() => navigate("/search")}
          >
            Search
          </Button>
        </Flex>
      </Flex>

      {/* Icon to show menu in responsive context */}
      <Flex p={"2"} display={{ lg: "none" }}>
        <IconButton
          size={"md"}
          display={{ base: "flex", lg: "none" }}
          justifyContent={"center"}
          icon={<Icon as={isOpen ? BsXLg : BsList} alignContent={"center"} />}
          aria-label={"Open Menu"}
          onClick={isOpen ? onClose : onOpen}
        />
      </Flex>

      {/* Responsive display */}
      {isOpen && (
        <Flex p={"4"} direction={"column"} display={{ lg: "none" }}>
          <Flex direction={"column"} align={"self-start"} gap={"6"}>
            <Button key={"dashboard"} variant={"link"} leftIcon={<Icon as={BsBarChart} />} onClick={() => responsiveNavigate("/")}>
              Dashboard
            </Button>
            <Button leftIcon={<Icon as={BsPlusLg} />} variant={"link"} onClick={() => responsiveNavigate("/create")}>
              Create
            </Button>

            <Divider />

            <Button leftIcon={<Icon as={BsBox} />} variant={"link"} onClick={() => responsiveNavigate("/entities")}>
              <Flex align={"center"} gap={"2"}>
                <Text>Entities</Text>
                <Tag>{isLoaded ? entityCount : <Spinner size={"xs"} />}</Tag>
              </Flex>
            </Button>
            <Button leftIcon={<Icon as={BsGrid} />} variant={"link"} onClick={() => responsiveNavigate("/collections")}>
              <Flex align={"center"} gap={"2"}>
                <Text>Collections</Text>
                <Tag>{isLoaded ? collectionCount : <Spinner size={"xs"} />}</Tag>
              </Flex>
            </Button>
            <Button leftIcon={<Icon as={BsGear} />} variant={"link"} onClick={() => responsiveNavigate("/attributes")}>
              Attributes
            </Button>

            <Divider />

            <Button
              key={"search"}
              variant={"link"}
              leftIcon={<Icon as={BsSearch} />}
              onClick={() => responsiveNavigate("/search")}
            >
              Search
            </Button>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

export default Navigation;
