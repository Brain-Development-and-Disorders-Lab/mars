// React
import React, { useEffect, useState } from "react";
import {
  Button,
  Flex,
  Heading,
  Table,
  TableContainer,
  Tbody,
  Th,
  Text,
  Tr,
  Link,
  useToast,
  Modal,
  Icon,
  Thead,
  Td,
  Textarea,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  Container,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  Tag,
  TagLabel,
  TagRightIcon,
  FormControl,
  FormLabel,
  Select,
  TagCloseButton,
  SimpleGrid,
  CheckboxGroup,
  Checkbox,
  Stack,
} from "@chakra-ui/react";
import {
  AddIcon,
  CheckIcon,
  ChevronRightIcon,
  CloseIcon,
  WarningIcon,
} from "@chakra-ui/icons";
import { AiOutlineEdit } from "react-icons/ai";
import { BsBox, BsDownload, BsPrinter } from "react-icons/bs";
import { SlGraph } from "react-icons/sl";

// Navigation
import { useParams, useNavigate } from "react-router-dom";

// Utility libraries
import _ from "lodash";
import dayjs from "dayjs";
import consola from "consola";
import FileSaver from "file-saver";
import slugify from "slugify";

// Database and models
import { deleteData, getData, postData } from "src/database/functions";
import { AttributeModel, CollectionModel, EntityModel } from "@types";

// Custom components
import Linky from "src/components/Linky";
import AttributeCard from "src/components/AttributeCard";
import Graph from "src/components/Graph";
import { Loading } from "src/components/Loading";
import { Error } from "@components/Error";
import { ContentContainer } from "@components/ContentContainer";

export const Entity = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    isOpen: isGraphOpen,
    onOpen: onGraphOpen,
    onClose: onGraphClose,
  } = useDisclosure();

  const {
    isOpen: isAddCollectionsOpen,
    onOpen: onAddCollectionsOpen,
    onClose: onAddCollectionsClose,
  } = useDisclosure();
  const [collectionData, setCollectionData] = useState([] as CollectionModel[]);
  const [selectedCollections, setSelectedCollections] = useState(
    [] as string[]
  );

  const [allEntities, setAllEntities] = useState(
    [] as { name: string; id: string }[]
  );

  const {
    isOpen: isAddProductsOpen,
    onOpen: onAddProductsOpen,
    onClose: onAddProductsClose,
  } = useDisclosure();
  const {
    isOpen: isAddOriginsOpen,
    onOpen: onAddOriginsOpen,
    onClose: onAddOriginsClose,
  } = useDisclosure();
  const [selectedProducts, setSelectedProducts] = useState([] as string[]);
  const [selectedOrigins, setSelectedOrigins] = useState([] as string[]);

  // Toggles
  const [isError, setIsError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editing, setEditing] = useState(false);

  // Break up entity data into editable fields
  const [entityData, setEntityData] = useState({} as EntityModel);
  const [entityDescription, setEntityDescription] = useState("");
  const [entityCollections, setEntityCollections] = useState([] as string[]);
  const [entityOrigins, setEntityOrigins] = useState(
    [] as { name: string; id: string }[]
  );
  const [entityProducts, setEntityProducts] = useState(
    [] as { name: string; id: string }[]
  );
  const [entityAttributes, setEntityAttributes] = useState(
    [] as AttributeModel[]
  );

  const {
    isOpen: isExportOpen,
    onOpen: onExportOpen,
    onClose: onExportClose,
  } = useDisclosure();
  const [exportFields, setExportFields] = useState([] as string[]);

  useEffect(() => {
    getData(`/entities/${id}`)
      .then((response) => {
        // Check for issues with an empty array being stored haphazardly as "null"
        if (response.associations.origins === null) {
          response.associations.origins = [];
        }

        // Store data and signal data retrieval being completed
        setEntityData(response);
        setEntityDescription(response.description);
        setEntityCollections(response.collections);
        setEntityOrigins(response.associations.origins);
        setEntityProducts(response.associations.products);
        setEntityAttributes(response.attributes);
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Could not retrieve Entity data.",
          status: "error",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true)
      }).finally(() => {
        setIsLoaded(true);
      });

    // Populate Collection data
    getData(`/collections`)
      .then((response) => {
        setCollectionData(response);
      }).catch(() => {
        toast({
          title: "Error",
          description: "Could not retrieve Collections data.",
          status: "error",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      }).finally(() => {
        setIsLoaded(true);
      });

    // Populate Entities data
    getData(`/entities`)
      .then((response) => {
        setAllEntities(
          (response as EntityModel[])
            .filter((entity) => !_.isEqual(entityData._id, entity._id))
            .map((entity) => {
              return { id: entity._id, name: entity.name };
            })
        );
      }).catch(() => {
        toast({
          title: "Error",
          description: "Could not retrieve Entities data.",
          status: "error",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
        setIsError(true);
      }).finally(() => {
        setIsLoaded(true);
      });
  }, [id]);

  // Toggle editing status
  const handleEditClick = () => {
    if (editing) {
      // Collate data for updating
      const updateData: EntityModel = {
        _id: entityData._id,
        name: entityData.name,
        created: entityData.created,
        owner: entityData.owner,
        description: entityDescription,
        collections: entityCollections,
        associations: {
          origins: entityOrigins,
          products: entityProducts,
        },
        attributes: entityAttributes,
      };

      // Update data
      postData(`/entities/update`, updateData)
        .then((_response) => {
          toast({
            title: "Saved!",
            status: "success",
            duration: 2000,
            position: "bottom-right",
            isClosable: true,
          });
        })
        .catch(() => {
          toast({
            title: "Error",
            description: "An error occurred when saving updates.",
            status: "error",
            duration: 2000,
            position: "bottom-right",
            isClosable: true,
          });
        }).finally(() => {
          setEditing(false);
        });
    } else {
      setEditing(true);
    }
  };

  // Handle clicking the "Download" button
  const handleDownloadClick = () => {
    consola.info("Exporting additional fields:", exportFields);

    // Send POST data to generate file
    postData(`/entities/export`, {
      id: id,
      fields: exportFields,
    }).then((response) => {
      FileSaver.saveAs(new Blob([response]), slugify(`${entityData.name.replace(" ", "")}_export.csv`));
    });
  };

  // Handle checkbox selection on the export modal
  const handleExportCheck = (field: string, checkState: boolean) => {
    if (_.isEqual(checkState, true)) {
      // If checked after click, add field to exportFields
      if (!exportFields.includes(field)) {
        const updatedFields = [...exportFields, field];
        setExportFields(updatedFields);
      }
    } else {
      // If unchecked after click, remove the field from exportFields
      if (exportFields.includes(field)) {
        const updatedFields = exportFields.filter((existingField) => {
          if (!_.isEqual(existingField, field)) {
            return existingField;
          }
          return;
        });
        setExportFields(updatedFields);
      }
    }
  }

  // Delete the Entity when confirmed
  const handleDeleteClick = () => {
    // Update data
    deleteData(`/entities/${id}`)
      .then((_response) => {
        setEditing(false);
        navigate("/entities");

        toast({
          title: "Deleted!",
          status: "success",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: `An error occurred when deleting Entity "${entityData.name}"`,
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      });
  };

  const addProducts = (products: string[]): void => {
    setEntityProducts([
      ...entityProducts,
      ...allEntities.filter((entity) => products.includes(entity.id)),
    ]);
    setSelectedProducts([]);
    onAddProductsClose();
  };

  const removeProduct = (id: string) => {
    setEntityProducts(
      entityProducts.filter((product) => {
        return product.id !== id;
      })
    );
  };

  const addOrigins = (origins: string[]): void => {
    setEntityOrigins([
      ...entityOrigins,
      ...allEntities.filter((entity) => origins.includes(entity.id)),
    ]);
    setSelectedOrigins([]);
    onAddOriginsClose();
  };

  const removeOrigin = (id: string) => {
    setEntityOrigins(
      entityOrigins.filter((origin) => {
        return origin.id !== id;
      })
    );
  };

  const removeCollection = (id: string) => {
    setEntityCollections(
      entityCollections.filter((collection) => {
        return collection !== id;
      })
    );
  };

  /**
   * Callback function to the Entity to Collections
   * @param {{ entities: string[], collection: string }} data List of Entities and a Collection to add the Entities to
   */
  const addCollections = (collections: string[]): void => {
    setEntityCollections([
      ...entityCollections,
      ...collections.filter((collection) => !_.isEqual("", collection)),
    ]);
    setSelectedCollections([]);
    onAddCollectionsClose();
  };

  return (
    <ContentContainer vertical={isError || !isLoaded}>
      {isLoaded ? (
        isError ? (
          <Error />
        ) : (
          <Flex direction={"column"}>
            <Flex
              p={"2"}
              direction={"row"}
              justify={"space-between"}
              align={"center"}
              wrap={"wrap"}
              gap={"4"}
            >
              <Flex align={"center"} gap={"4"} shadow={"lg"} p={"2"} border={"2px"} rounded={"10px"}>
                <Icon as={BsBox} w={"8"} h={"8"} />
                <Heading fontWeight={"semibold"}>{entityData.name}</Heading>
              </Flex>

              {/* Buttons */}
              <Flex direction={"row"} gap={"4"} wrap={"wrap"}>
                {editing &&
                  <Popover>
                    <PopoverTrigger>
                      <Button colorScheme={"red"} rightIcon={<CloseIcon />}>
                        Delete
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <PopoverArrow />
                      <PopoverCloseButton />
                      <PopoverHeader>Confirmation</PopoverHeader>
                      <PopoverBody>
                        Are you sure you want to delete this Entity?
                        <Flex direction={"row"} p={"2"} justify={"center"}>
                          <Button
                            colorScheme={"green"}
                            rightIcon={<CheckIcon />}
                            onClick={handleDeleteClick}
                          >
                            Confirm
                          </Button>
                        </Flex>
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
                }
                <Button
                  onClick={handleEditClick}
                  colorScheme={editing ? "green" : "gray"}
                  rightIcon={
                    editing ? <Icon as={CheckIcon} /> : <Icon as={AiOutlineEdit} />
                  }
                >
                  {editing ? "Done" : "Edit"}
                </Button>
                <Button
                  onClick={onGraphOpen}
                  rightIcon={<Icon as={SlGraph} />}
                  colorScheme={"orange"}
                  isDisabled={editing}
                >
                  View Graph
                </Button>
                <Button
                  onClick={onExportOpen}
                  rightIcon={<Icon as={BsPrinter} />}
                  colorScheme={"blue"}
                  isDisabled={editing}
                >
                  Export CSV
                </Button>
              </Flex>
            </Flex>

            <Flex direction={"row"} gap={"4"} p={"2"} wrap={"wrap"}>
              <Flex
                direction={"column"}
                p={"4"}
                gap={"4"}
                grow={"1"}
                h={"fit-content"}
                bg={"whitesmoke"}
                rounded={"10px"}
              >
                {/* Details */}
                <Flex gap={"2"} grow={"1"} direction={"column"} minH={"32"}>
                  <Heading size={"lg"}>Details</Heading>
                  <TableContainer>
                    <Table variant={"simple"} colorScheme={"blackAlpha"}>
                      <Thead>
                        <Tr>
                          <Th maxW={"xs"}>Field</Th>
                          <Th>Value</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        <Tr>
                          <Td>Created</Td>
                          <Td>
                            <Text>{dayjs(entityData.created).format("DD MMM YYYY")}</Text>
                          </Td>
                        </Tr>

                        <Tr>
                          <Td>Owner</Td>
                          <Td>
                            {_.isEqual(entityData.owner, "") ? (
                              <Tag
                                size={"md"}
                                key={`warn-${entityData._id}`}
                                colorScheme={"orange"}
                              >
                                <TagLabel>Not specified</TagLabel>
                                <TagRightIcon as={WarningIcon} />
                              </Tag>
                            ) : (
                              <Text>
                                <Link>{entityData.owner}</Link>
                              </Text>
                            )}
                          </Td>
                        </Tr>

                        <Tr>
                          <Td>Description</Td>
                          <Td>
                            <Textarea
                              value={entityDescription}
                              onChange={(event) => {
                                setEntityDescription(event.target.value);
                              }}
                              disabled={!editing}
                            />
                          </Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Flex>

                {/* Collections */}
                <Flex gap={"2"} grow={"1"} direction={"column"} minH={"32"}>
                  <Flex direction={"row"} justify={"space-between"}>
                    <Heading size={"lg"}>Collections</Heading>
                    {editing ? (
                      <Button
                        colorScheme={"green"}
                        rightIcon={<AddIcon />}
                        disabled={!editing}
                        onClick={onAddCollectionsOpen}
                      >
                        Add
                      </Button>
                    ) : null}
                  </Flex>

                  {entityCollections.length === 0 ? (
                    <Text>
                      {entityData.name} is not a member of any Collections.
                    </Text>
                  ) : (
                    <TableContainer>
                      <Table variant={"simple"} colorScheme={"blackAlpha"}>
                        <Thead>
                          <Tr>
                            <Th>Collection</Th>
                            <Th></Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {entityCollections.map((collection) => {
                            return (
                              <Tr key={collection}>
                                <Td>
                                  <Linky type="collections" id={collection} />
                                </Td>
                                <Td>
                                  <Flex w={"full"} gap={"2"} justify={"right"}>
                                    {editing && (
                                      <Button
                                        key={`remove-${collection}`}
                                        rightIcon={<CloseIcon />}
                                        colorScheme={"red"}
                                        onClick={() => {
                                          removeCollection(collection);
                                        }}
                                      >
                                        Remove
                                      </Button>
                                    )}

                                    {!editing && (
                                      <Button
                                        key={`view-${collection}`}
                                        rightIcon={<ChevronRightIcon />}
                                        colorScheme={"blackAlpha"}
                                        onClick={() => navigate(`/collections/${collection}`)}
                                      >
                                        View
                                      </Button>
                                    )}
                                  </Flex>
                                </Td>
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  )}
                </Flex>
              </Flex>

              <Flex
                direction={"column"}
                p={"4"}
                gap={"4"}
                grow={"2"}
                h={"fit-content"}
                bg={"whitesmoke"}
                rounded={"10px"}
              >
                {/* Origins */}
                <Flex gap={"2"} grow={"1"} direction={"column"} minH={"32"}>
                  <Flex direction={"row"} justify={"space-between"}>
                    <Heading size={"lg"}>Origins</Heading>
                    {editing ? (
                      <Button
                        colorScheme={"green"}
                        rightIcon={<AddIcon />}
                        disabled={!editing}
                        onClick={onAddOriginsOpen}
                      >
                        Add
                      </Button>
                    ) : null}
                  </Flex>

                  {entityOrigins.length === 0 ? (
                    <Text>{entityData.name} does not have any Origins.</Text>
                  ) : (
                    <TableContainer>
                      <Table colorScheme={"blackAlpha"}>
                        <Thead>
                          <Tr>
                            <Th>Origin</Th>
                            <Th></Th>
                          </Tr>
                        </Thead>

                        <Tbody>
                          {entityOrigins.map((origin) => {
                            return (
                              <Tr key={origin.id}>
                                <Td>
                                  <Linky type="entities" id={origin.id} />
                                </Td>
                                <Td>
                                  <Flex w={"full"} gap={"2"} justify={"right"}>
                                    {editing && (
                                      <Button
                                        key={`remove-${origin.id}`}
                                        rightIcon={<CloseIcon />}
                                        colorScheme={"red"}
                                        onClick={() => {
                                          removeOrigin(origin.id);
                                        }}
                                      >
                                        Remove
                                      </Button>
                                    )}

                                    {!editing && (
                                      <Button
                                        key={`view-${origin.id}`}
                                        rightIcon={<ChevronRightIcon />}
                                        colorScheme={"blackAlpha"}
                                        onClick={() => navigate(`/entities/${origin.id}`)}
                                      >
                                        View
                                      </Button>
                                    )}
                                  </Flex>
                                </Td>
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  )}
                </Flex>

                {/* Products */}
                <Flex gap={"2"} grow={"1"} direction={"column"} minH={"32"}>
                  <Flex direction={"row"} justify={"space-between"}>
                    <Heading size={"lg"}>Products</Heading>
                    {editing ? (
                      <Button
                        colorScheme={"green"}
                        rightIcon={<AddIcon />}
                        disabled={!editing}
                        onClick={onAddProductsOpen}
                      >
                        Add
                      </Button>
                    ) : null}
                  </Flex>

                  {entityProducts.length === 0 ? (
                    <Text>{entityData.name} does not have any Products.</Text>
                  ) : (
                    <TableContainer>
                      <Table colorScheme={"blackAlpha"}>
                        <Thead>
                          <Tr>
                            <Th>Product</Th>
                            <Th></Th>
                          </Tr>
                        </Thead>

                        <Tbody>
                          {entityProducts.map((product) => {
                            return (
                              <Tr key={product.id}>
                                <Td>
                                  <Linky type="entities" id={product.id} />
                                </Td>
                                <Td>
                                  <Flex w={"full"} gap={"2"} justify={"right"}>
                                    {editing && (
                                      <Button
                                        key={`remove-${product.id}`}
                                        rightIcon={<CloseIcon />}
                                        colorScheme={"red"}
                                        onClick={() => {
                                          removeProduct(product.id);
                                        }}
                                      >
                                        Remove
                                      </Button>
                                    )}

                                    {!editing && (
                                      <Button
                                        key={`view-${product.id}`}
                                        rightIcon={<ChevronRightIcon />}
                                        colorScheme={"blackAlpha"}
                                        onClick={() => navigate(`/entities/${product.id}`)}
                                      >
                                        View
                                      </Button>
                                    )}
                                  </Flex>
                                </Td>
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  )}
                </Flex>
              </Flex>
            </Flex>

            {/* Attributes */}
            <Flex
              p={"2"}
              direction={"row"}
              justify={"space-between"}
              align={"center"}
              wrap={"wrap"}
              gap={"4"}
            >
              <Flex
                direction={"column"}
                p={"4"}
                gap={"4"}
                grow={"1"}
                h={"fit-content"}
                bg={"whitesmoke"}
                rounded={"10px"}
              >
                <Heading size={"lg"}>Attributes</Heading>

                <SimpleGrid spacing={"4"} templateColumns={"repeat(auto-fill, minmax(300px, 1fr))"}>
                  {entityAttributes.length > 0 ? (
                    entityAttributes.map((attribute) => {
                      return (
                        <AttributeCard
                          data={attribute}
                          key={`attribute-${attribute.name}`}
                        />
                      );
                    })
                  ) : (
                    <Text>{entityData.name} does not have any Attributes.</Text>
                  )}
                </SimpleGrid>
              </Flex>
            </Flex>

            <Modal isOpen={isAddCollectionsOpen} onClose={onAddCollectionsClose} isCentered>
              <ModalOverlay />
              <ModalContent p={"4"}>
                {/* Heading and close button */}
                <ModalHeader>Add to Collection</ModalHeader>
                <ModalCloseButton />

                {/* Select component for Collections */}
                <Flex direction={"column"} p={"2"} gap={"2"}>
                  <FormControl>
                    <FormLabel>Add Entity to Collections</FormLabel>
                    <Select
                      title="Select Collection"
                      placeholder={"Select Collection"}
                      onChange={(event) => {
                        const selectedCollection = event.target.value.toString();
                        if (selectedCollections.includes(selectedCollection)) {
                          toast({
                            title: "Warning",
                            description: "Collection has already been selected.",
                            status: "warning",
                            duration: 2000,
                            position: "bottom-right",
                            isClosable: true,
                          });
                        } else {
                          setSelectedCollections([
                            ...selectedCollections,
                            selectedCollection,
                          ]);
                        }
                      }}
                    >
                      {isLoaded &&
                        collectionData.map((collection) => {
                          return (
                            <option key={collection._id} value={collection._id}>
                              {collection.name}
                            </option>
                          );
                        })}
                      ;
                    </Select>
                  </FormControl>

                  <Flex direction={"row"} p={"2"} gap={"2"}>
                    {selectedCollections.map((collection) => {
                      if (!_.isEqual(collection, "")) {
                        return (
                          <Tag key={`tag-${collection}`}>
                            <Linky id={collection} type={"collections"} />
                            <TagCloseButton
                              onClick={() => {
                                setSelectedCollections(
                                  selectedCollections.filter((selected) => {
                                    return !_.isEqual(collection, selected);
                                  })
                                );
                              }}
                            />
                          </Tag>
                        );
                      } else {
                        return null;
                      }
                    })}
                  </Flex>
                </Flex>

                {/* "Done" button */}
                <Flex direction={"row"} p={"md"} justify={"center"}>
                  <Button
                    colorScheme={"green"}
                    onClick={() => {
                      addCollections(selectedCollections);
                    }}
                  >
                    Done
                  </Button>
                </Flex>
              </ModalContent>
            </Modal>

            <Modal isOpen={isAddProductsOpen} onClose={onAddProductsClose} isCentered>
              <ModalOverlay />
              <ModalContent p={"4"}>
                {/* Heading and close button */}
                <ModalHeader>Add Products</ModalHeader>
                <ModalCloseButton />

                {/* Select component for Entities */}
                <Flex direction={"column"} p={"2"} gap={"2"}>
                  <FormControl>
                    <FormLabel>Add Products</FormLabel>
                    <Select
                      title="Select Products"
                      placeholder={"Select Product"}
                      onChange={(event) => {
                        if (
                          entityProducts
                            .map((product) => product.id)
                            .includes(event.target.value.toString())
                        ) {
                          toast({
                            title: "Warning",
                            description: "Product has already been selected.",
                            status: "warning",
                            duration: 2000,
                            position: "bottom-right",
                            isClosable: true,
                          });
                        } else {
                          setSelectedProducts([
                            ...selectedProducts,
                            event.target.value.toString(),
                          ]);
                        }
                      }}
                    >
                      {isLoaded &&
                        allEntities.map((entity) => {
                          return (
                            <option key={entity.id} value={entity.id}>
                              {entity.name}
                            </option>
                          );
                        })}
                      ;
                    </Select>
                  </FormControl>

                  <Flex direction={"row"} p={"2"} gap={"2"}>
                    {selectedProducts.map((entity) => {
                      if (!_.isEqual(entity, "")) {
                        return (
                          <Tag key={`tag-${entity}`}>
                            <Linky id={entity} type={"entities"} />
                            <TagCloseButton
                              onClick={() => {
                                setSelectedProducts(
                                  selectedProducts.filter((selected) => {
                                    return !_.isEqual(entity, selected);
                                  })
                                );
                              }}
                            />
                          </Tag>
                        );
                      } else {
                        return null;
                      }
                    })}
                  </Flex>
                </Flex>

                {/* "Done" button */}
                <Flex direction={"row"} p={"md"} justify={"center"}>
                  <Button
                    colorScheme={"green"}
                    onClick={() => {
                      if (id) {
                        // Add the Entities to the Collection
                        addProducts(selectedProducts);
                      }
                    }}
                  >
                    Done
                  </Button>
                </Flex>
              </ModalContent>
            </Modal>

            <Modal isOpen={isAddOriginsOpen} onClose={onAddOriginsClose} isCentered>
              <ModalOverlay />
              <ModalContent p={"4"}>
                {/* Heading and close button */}
                <ModalHeader>Add Origins</ModalHeader>
                <ModalCloseButton />

                {/* Select component for Entities */}
                <Flex direction={"column"} p={"2"} gap={"2"}>
                  <FormControl>
                    <FormLabel>Add Origins</FormLabel>
                    <Select
                      title="Select Origins"
                      placeholder={"Select Origin"}
                      onChange={(event) => {
                        if (
                          entityOrigins
                            .map((origin) => origin.id)
                            .includes(event.target.value.toString())
                        ) {
                          toast({
                            title: "Warning",
                            description: "Origin has already been selected.",
                            status: "warning",
                            duration: 2000,
                            position: "bottom-right",
                            isClosable: true,
                          });
                        } else {
                          setSelectedOrigins([
                            ...selectedOrigins,
                            event.target.value.toString(),
                          ]);
                        }
                      }}
                    >
                      {isLoaded &&
                        allEntities.map((entity) => {
                          return (
                            <option key={entity.id} value={entity.id}>
                              {entity.name}
                            </option>
                          );
                        })}
                      ;
                    </Select>
                  </FormControl>

                  <Flex direction={"row"} p={"2"} gap={"2"}>
                    {selectedOrigins.map((entity) => {
                      if (!_.isEqual(entity, "")) {
                        return (
                          <Tag key={`tag-${entity}`}>
                            <Linky id={entity} type={"entities"} />
                            <TagCloseButton
                              onClick={() => {
                                setSelectedOrigins(
                                  selectedOrigins.filter((selected) => {
                                    return !_.isEqual(entity, selected);
                                  })
                                );
                              }}
                            />
                          </Tag>
                        );
                      } else {
                        return null;
                      }
                    })}
                  </Flex>
                </Flex>

                {/* "Done" button */}
                <Flex direction={"row"} p={"md"} justify={"center"}>
                  <Button
                    colorScheme={"green"}
                    onClick={() => {
                      if (id) {
                        // Add the Entities to the Collection
                        addOrigins(selectedOrigins);
                      }
                    }}
                  >
                    Done
                  </Button>
                </Flex>
              </ModalContent>
            </Modal>

            <Modal isOpen={isExportOpen} onClose={onExportClose} isCentered>
              <ModalOverlay />
              <ModalContent p={"4"} w={["sm", "lg", "2xl"]}>
                {/* Heading and close button */}
                <ModalHeader p={"2"}>Export Entity</ModalHeader>
                <ModalCloseButton />

                {/* Selection content */}
                <Flex direction={"row"}>
                  <Flex direction={"column"} p={"2"} gap={"2"}>
                    <FormControl>
                      <FormLabel>Details</FormLabel>
                      <CheckboxGroup>
                        <Stack spacing={2} direction={"column"}>
                          <Checkbox disabled defaultChecked>Name: {entityData.name}</Checkbox>
                          <Checkbox onChange={(event) => handleExportCheck("created", event.target.checked)}>
                            Created: {dayjs(entityData.created).format("DD MMM YYYY")}
                          </Checkbox>
                          <Checkbox onChange={(event) => handleExportCheck("owner", event.target.checked)}>
                            Owner: {entityData.owner}
                          </Checkbox>
                          <Checkbox onChange={(event) => handleExportCheck("description", event.target.checked)}>
                            Description: {entityData.description}
                          </Checkbox>
                        </Stack>
                      </CheckboxGroup>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Associations: Origins</FormLabel>
                      {entityData.associations.origins.length > 0 ?
                        <Stack spacing={2} direction={"column"}>
                          {entityData.associations.origins.map((origin) => {
                            return (
                              <Checkbox key={origin.id} onChange={(event) => handleExportCheck(`origin_${origin.id}`, event.target.checked)}>
                                Origin: {origin.name}
                              </Checkbox>
                            );
                          })}
                        </Stack>
                      :
                        <Text>No Origins</Text>
                      }
                    </FormControl>
                    <FormControl>
                      <FormLabel>Associations: Products</FormLabel>
                      {entityData.associations.products.length > 0 ?
                        <Stack spacing={2} direction={"column"}>
                          {entityData.associations.products.map((product) => {
                            return (
                              <Checkbox key={product.id} onChange={(event) => handleExportCheck(`product_${product.id}`, event.target.checked)}>
                                Product: {product.name}
                              </Checkbox>
                            );
                          })}
                        </Stack>
                      :
                        <Text>No Products</Text>
                      }
                    </FormControl>
                  </Flex>

                  <Flex direction={"column"} p={"2"} gap={"2"}>
                    <FormControl>
                      <FormLabel>Attributes</FormLabel>
                      {entityData.attributes.length > 0 ?
                        <Stack spacing={2} direction={"column"}>
                          {entityData.attributes.map((attribute) => {
                            return (
                              <Checkbox key={attribute.name} onChange={(event) => handleExportCheck(`attribute_${attribute._id}`, event.target.checked)}>
                                {attribute.name}
                              </Checkbox>
                            );
                          })}
                        </Stack>
                      :
                        <Text>No Attributes</Text>
                      }
                    </FormControl>
                  </Flex>
                </Flex>

                {/* "Download" button */}
                <Flex direction={"row"} p={"md"} justify={"center"}>
                  <Button
                    colorScheme={"green"}
                    onClick={() => handleDownloadClick()}
                    rightIcon={<Icon as={BsDownload} />}
                  >
                    Download
                  </Button>
                </Flex>
              </ModalContent>
            </Modal>

            <Modal
              size={"full"}
              onEsc={onGraphClose}
              onClose={onGraphClose}
              isOpen={isGraphOpen}
            >
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Graph: {entityData.name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Container h={"90vh"} minW={"90vw"}>
                    <Graph id={entityData._id} />
                  </Container>
                </ModalBody>
              </ModalContent>
            </Modal>
          </Flex>
        )
      ) : (
        <Loading />
      )
    }
    </ContentContainer>
  );
};

export default Entity;
