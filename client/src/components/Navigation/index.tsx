// React
import React, { ChangeEvent, useEffect, useState } from "react";

// Existing and custom components
import {
  Flex,
  IconButton,
  Button,
  useDisclosure,
  Image,
  Heading,
  Text,
  Divider,
  useToast,
  Tag,
  Spinner,
  Spacer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Input,
  ModalFooter,
} from "@chakra-ui/react";
import Icon from "@components/Icon";

// Routing and navigation
import { useLocation, useNavigate } from "react-router-dom";

// Utility functions and libraries
import { getData, postData } from "@database/functions";
import dayjs from "dayjs";
import _ from "lodash";

const Navigation = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();
  const [file, setFile] = useState({} as File);
  const [isUploading, setIsUploading] = useState(false);

  const performImport = () => {
    setIsUploading(true);

    const formData = new FormData();
    formData.append("name", file.name);
    formData.append("file", file);

    postData(`/server/import`, formData).then((response: { status: boolean, message: string }) => {
      if (_.isEqual(response.status, "success")) {
        toast({
          title: "Success",
          status: "success",
          description: "Successfully imported file.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        // Reset file upload state
        setFile({} as File);
        onImportClose();
      } else {
        toast({
          title: "Error",
          status: "error",
          description: response.message,
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      }
      setIsUploading(false);
    }).catch((error: { message: string }) => {
      toast({
        title: "Error",
        status: "error",
        description: error.message,
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      setIsUploading(false);
    });
  };

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
      })
      .catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Entities data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .finally(() => {
        setIsLoaded(true);
      });

    getData(`/collections`)
      .then((value) => {
        setCollectionCount(
          value.length > 100 ? "100+" : value.length.toString()
        );
      })
      .catch((_error) => {
        toast({
          title: "Error",
          status: "error",
          description: "Could not retrieve Collections data.",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .finally(() => {
        setIsLoaded(true);
      });
  });

  return (
    <Flex w={"100%"}>
      {/* Main navigation group */}
      <Flex
        direction={"column"}
        display={{ base: "none", lg: "flex" }}
        gap={"6"}
        alignItems={"stretch"}
      >
        {/* Icon */}
        <Flex direction={"row"} align={"center"} gap={"2"}>
          <Image src="/Favicon.png" boxSize={"36px"} />
          <Flex direction={"column"}>
            <Heading fontWeight={"semibold"} size={"md"}>
              MARS
            </Heading>
            <Text color={"gray.400"}>
              {dayjs(Date.now()).format("ddd, DD MMM").toString()}
            </Text>
          </Flex>
        </Flex>

        {/* Menu items */}
        <Flex direction={"column"} align={"self-start"} gap={"6"}>
          <Button
            key={"create"}
            w={"100%"}
            colorScheme={"green"}
            variant={"solid"}
            leftIcon={<Icon name={"add"} />}
            onClick={() => navigate("/create")}
          >
            <Flex pr={"4"}>Create</Flex>
          </Button>

          <Button
            key={"import"}
            w={"100%"}
            colorScheme={"blue"}
            variant={"solid"}
            leftIcon={<Icon name={"upload"} />}
            onClick={() => onImportOpen()}
          >
            <Flex pr={"4"}>Import</Flex>
          </Button>

          <Divider />

          <Button
            key={"dashboard"}
            w={"100%"}
            justifyContent={"left"}
            variant={_.isEqual(location.pathname, "/") ? "solid" : "ghost"}
            leftIcon={<Icon name={"dashboard"} />}
            onClick={() => navigate("/")}
          >
            Dashboard
          </Button>

          <Divider />

          <Button
            leftIcon={<Icon name={"collection"} />}
            w={"100%"}
            justifyContent={"left"}
            variant={
              _.startsWith(location.pathname, "/collections")
                ? "solid"
                : "ghost"
            }
            onClick={() => navigate("/collections")}
          >
            <Flex w={"100%"} align={"center"} gap={"2"}>
              <Text>Collections</Text>
              <Spacer />
              <Tag>{isLoaded ? collectionCount : <Spinner size={"xs"} />}</Tag>
            </Flex>
          </Button>

          <Button
            leftIcon={<Icon name={"entity"} />}
            w={"100%"}
            justifyContent={"left"}
            variant={
              _.startsWith(location.pathname, "/entities") ? "solid" : "ghost"
            }
            onClick={() => navigate("/entities")}
          >
            <Flex w={"100%"} align={"center"} gap={"2"}>
              <Text>Entities</Text>
              <Spacer />
              <Tag>{isLoaded ? entityCount : <Spinner size={"xs"} />}</Tag>
            </Flex>
          </Button>
          <Button
            leftIcon={<Icon name={"attribute"} />}
            w={"100%"}
            justifyContent={"left"}
            variant={
              _.startsWith(location.pathname, "/attributes") ? "solid" : "ghost"
            }
            onClick={() => navigate("/attributes")}
          >
            Attributes
          </Button>

          <Divider />

          <Button
            key={"search"}
            w={"100%"}
            justifyContent={"left"}
            variant={
              _.startsWith(location.pathname, "/search") ? "solid" : "ghost"
            }
            leftIcon={<Icon name={"search"} />}
            onClick={() => navigate("/search")}
          >
            Search
          </Button>

          <Spacer />
        </Flex>
      </Flex>

      {/* Icon to show menu in responsive context */}
      <Flex p={"2"} display={{ lg: "none" }}>
        <IconButton
          size={"md"}
          display={{ base: "flex", lg: "none" }}
          justifyContent={"center"}
          icon={<Icon name={isOpen ? "cross" : "list"} />}
          aria-label={"Open Menu"}
          onClick={isOpen ? onClose : onOpen}
        />
      </Flex>

      {/* Responsive display */}
      {isOpen && (
        <Flex
          p={"2"}
          gap={"4"}
          direction={"column"}
          align={"self-start"}
          w={"100%"}
        >
          <Button
            key={"create"}
            w={"100%"}
            colorScheme={"green"}
            variant={"solid"}
            leftIcon={<Icon name={"add"} />}
            onClick={() => responsiveNavigate("/create")}
          >
            <Flex pr={"4"}>Create</Flex>
          </Button>

          <Divider />

          <Button
            key={"dashboard"}
            w={"100%"}
            justifyContent={"left"}
            variant={_.isEqual(location.pathname, "/") ? "solid" : "ghost"}
            leftIcon={<Icon name={"dashboard"} />}
            onClick={() => responsiveNavigate("/")}
          >
            Dashboard
          </Button>

          <Divider />

          <Button
            leftIcon={<Icon name={"collection"} />}
            w={"100%"}
            justifyContent={"left"}
            variant={
              _.startsWith(location.pathname, "/collections")
                ? "solid"
                : "ghost"
            }
            onClick={() => responsiveNavigate("/collections")}
          >
            <Flex w={"100%"} align={"center"} gap={"2"}>
              <Text>Collections</Text>
              <Spacer />
              <Tag>{isLoaded ? collectionCount : <Spinner size={"xs"} />}</Tag>
            </Flex>
          </Button>

          <Button
            leftIcon={<Icon name={"entity"} />}
            w={"100%"}
            justifyContent={"left"}
            variant={
              _.startsWith(location.pathname, "/entities") ? "solid" : "ghost"
            }
            onClick={() => responsiveNavigate("/entities")}
          >
            <Flex w={"100%"} align={"center"} gap={"2"}>
              <Text>Entities</Text>
              <Spacer />
              <Tag>{isLoaded ? entityCount : <Spinner size={"xs"} />}</Tag>
            </Flex>
          </Button>

          <Button
            leftIcon={<Icon name={"attribute"} />}
            w={"100%"}
            justifyContent={"left"}
            variant={
              _.startsWith(location.pathname, "/attributes") ? "solid" : "ghost"
            }
            onClick={() => responsiveNavigate("/attributes")}
          >
            Attributes
          </Button>

          <Divider />

          <Button
            key={"search"}
            w={"100%"}
            justifyContent={"left"}
            variant={
              _.startsWith(location.pathname, "/search") ? "solid" : "ghost"
            }
            leftIcon={<Icon name={"search"} />}
            onClick={() => responsiveNavigate("/search")}
          >
            Search
          </Button>
        </Flex>
      )}

      <Modal isOpen={isImportOpen} onClose={onImportClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Import Data</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex w={"100%"} align={"center"} justify={"center"}>
              <Flex direction={"column"} minH={"200px"} w={"100%"} align={"center"} justify={"center"} border={"2px"} borderStyle={"dashed"} borderColor={"gray.100"} rounded={"md"}>
                {_.isEqual(file, {}) ?
                  <Flex direction={"column"} w={"100%"} justify={"center"} align={"center"}>
                    <Text fontWeight={"semibold"}>Drag file here</Text>
                    <Text>or click to upload</Text>
                  </Flex>
                :
                  <Text fontWeight={"semibold"}>{file.name}</Text>
                }
              </Flex>
              <Input
                type={"file"}
                h={"100%"}
                w={"100%"}
                position={"absolute"}
                top={"0"}
                left={"0"}
                opacity={"0"}
                aria-hidden={"true"}
                accept={"json/*"}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  if (event.target.files) {
                    setFile(event.target.files[0]);
                  }
                }}
              />
            </Flex>
          </ModalBody>

          <ModalFooter>
            <Flex direction={"row"} w={"100%"} justify={"space-between"}>
              <Button
                colorScheme={"red"}
                variant={"outline"}
                onClick={() => {
                  setFile({} as File);
                  onImportClose();
                }}
              >
                Cancel
              </Button>
              <Button
                colorScheme={"blue"}
                disabled={_.isEqual(file, {}) || isUploading}
                rightIcon={<Icon name={"upload"} />}
                onClick={() => performImport()}
                isLoading={isUploading}
              >
                Upload
              </Button>
            </Flex>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default Navigation;
