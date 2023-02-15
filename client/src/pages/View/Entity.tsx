// React
import React, { useEffect, useState } from "react";
import { Button, Flex, Heading, Table, TableContainer, Tbody, Th, Text, Tr, Link, useToast, Modal, Icon, Thead, Td, Textarea, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, useDisclosure, Container, Popover, PopoverTrigger, PopoverContent, PopoverCloseButton, PopoverHeader, PopoverBody, PopoverArrow, Tag, TagLabel, TagRightIcon, FormControl, FormLabel, Select, TagCloseButton } from "@chakra-ui/react";
import { AddIcon, CheckIcon, ChevronRightIcon, CloseIcon, WarningIcon } from "@chakra-ui/icons";
import { AiOutlineEdit } from "react-icons/ai";
import { BsPrinter } from "react-icons/bs";
import { SlGraph } from "react-icons/sl";

// Navigation
import { useParams, useNavigate } from "react-router-dom";

// Utility libraries
import _ from "underscore";
import { parse } from "json2csv";

// Database and models
import { deleteData, getData, postData } from "src/database/functions";
import { AttributeStruct, CollectionModel, EntityModel } from "@types";

// Custom components
import Linky from "src/components/Linky";
import AttributeCard from "src/components/AttributeCard";
import Graph from "src/components/Graph";
import { Loading } from "src/components/Loading";
import { PageContainer } from "src/components/PageContainer";

export const Entity = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { isOpen: isGraphOpen, onOpen: onGraphOpen, onClose: onGraphClose } = useDisclosure();

  const { isOpen: isAddCollectionsOpen, onOpen: onAddCollectionsOpen, onClose: onAddCollectionsClose } = useDisclosure();
  const [collectionData, setCollectionData] = useState([] as CollectionModel[]);
  const [selectedCollections, setSelectedCollections] = useState([] as string[]);

  const [allEntities, setAllEntities] = useState([] as { name: string; id: string }[]);

  const { isOpen: isAddProductsOpen, onOpen: onAddProductsOpen, onClose: onAddProductsClose } = useDisclosure();
  const { isOpen: isAddOriginsOpen, onOpen: onAddOriginsOpen, onClose: onAddOriginsClose } = useDisclosure();
  const [selectedProducts, setSelectedProducts] = useState([] as string[]);
  const [selectedOrigins, setSelectedOrigins] = useState([] as string[]);

  // Toggles
  const [isLoaded, setIsLoaded] = useState(false);
  const [editing, setEditing] = useState(false);

  // Break up entity data into editable fields
  const [entityData, setEntityData] = useState({} as EntityModel);
  const [entityDescription, setEntityDescription] = useState("");
  const [entityCollections, setEntityCollections] = useState([] as string[]);
  const [entityOrigins, setEntityOrigins] = useState([] as { name: string; id: string }[]);
  const [entityProducts, setEntityProducts] = useState([] as { name: string; id: string }[]);
  const [entityAttributes, setEntityAttributes] = useState([] as AttributeStruct[]);

  useEffect(() => {
    getData(`/entities/${id}`).then((response) => {
      if(_.isEqual(response.status, "error")) {
        throw new Error(response.error);
      } else {
        // Check for issues with an empty array being stored haphazardly as "null"
        if (response.associations.origins === null) {
          response.associations.origins = [];
        }

        // Store data and signal data retrieval being completed
        setEntityData(response);
        setIsLoaded(true);
      }
    }).catch(() => {
      toast({
        title: "Database Error",
        description: "Error retrieving Entity data",
        status: "error",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    });

    // Populate Collection data
    getData(`/collections`).then((response) => {
      if(_.isEqual(response.status, "error")) {
        throw new Error(response.error);
      } else {
        setCollectionData(response);
        setIsLoaded(true);
      }
    }).catch(() => {
      toast({
        title: "Database Error",
        description: "Error retrieving Collection data",
        status: "error",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    });

    // Populate Entities data
    getData(`/entities`).then((response) => {
      if(_.isEqual(response.status, "error")) {
        throw new Error(response.error);
      } else {
        setAllEntities((response as EntityModel[]).filter(entity => !_.isEqual(entityData._id, entity._id)).map(entity => { return { id: entity._id, name: entity.name } }));
        setIsLoaded(true);
      }
    }).catch(() => {
      toast({
        title: "Database Error",
        description: "Error retrieving Collection data",
        status: "error",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    });
  }, [id]);

  useEffect(() => {
    if (isLoaded) {
      // Update the state of editable data fields
      setEntityDescription(entityData.description);
      setEntityCollections(entityData.collections);
      setEntityOrigins(entityData.associations.origins);
      setEntityProducts(entityData.associations.products);
      setEntityAttributes(entityData.attributes);
    }
  }, [isLoaded]);

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
      postData(`/entities/update`, updateData).then((response) => {
        if (_.isEqual(response.status, "success")) {
          setEditing(false);
          toast({
            title: "Saved!",
            status: "success",
            duration: 2000,
            position: "bottom-right",
            isClosable: true,
          });
          return;
        }
        throw new Error("Could not POST data");
      }).catch(() => {
        toast({
          title: "Error",
          description: "An error occurred when saving updates.",
          status: "error",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
      });
    } else {
      setEditing(true);
    }
  };

  // Toggle showing printer details
  const handlePrintClick = () => {
    // Generate string representations of all data
    const labelData: {[k: string]: any} = {
      id: entityData._id,
      name: entityData.name,
      created: entityData.created,
      owner: entityData.owner,
      description: entityData.description,
      collections: entityData.collections.join(),
      origins: entityData.associations.origins.map((origin) => { return origin.name }).join(),
      products: entityData.associations.products.map((product) => { return product.name }).join(),
    };

    let fields = ["id", "name", "created", "owner", "description", "collections", "origins", "products"];

    // Create columns for each Attribute and corresponding Parameter
    entityData.attributes.forEach((attribute) => {
      attribute.parameters.forEach((parameter) => {
        labelData[`${attribute.name}_${parameter.name}`] = parameter.data;
        fields = [...fields, `${attribute.name}_${parameter.name}`];
      });
    });

    // Convert to CSV format
    const parsedData = parse(labelData, { fields: fields });
    const downloadURL = window.URL.createObjectURL(new Blob([parsedData], {
      type: "text/csv",
    }));

    // Create hidden link to click, triggering download automatically
    const link = document.createElement("a");
    link.style.display = "none";
    link.download = `${entityData.name}.csv`;
    link.href = downloadURL;

    link.click();

    toast({
      title: "Created CSV file.",
      status: "info",
      duration: 2000,
      position: "bottom-right",
      isClosable: true,
    });
  };

  // Delete the Entity when confirmed
  const handleDeleteClick = () => {
    // Update data
    deleteData(`/entities/${id}`).then((response) => {
      if (_.isEqual(response.status, "success")) {
        setEditing(false);
        navigate("/entities")

        toast({
          title: "Deleted!",
          status: "success",
          duration: 2000,
          position: "bottom-right",
          isClosable: true,
        });
        return;
      }
      throw new Error("Could not delete Entity");
    }).catch(() => {
      toast({
        title: "Error",
        description: `An error occurred when deleting Entity "${entityData._id}"`,
        status: "error",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    });
  };

  const addProducts = (products: string[]): void => {
    setEntityProducts([...entityProducts, ...allEntities.filter(entity => products.includes(entity.id))]);
    setSelectedProducts([]);
    onAddProductsClose();
  };

  const removeProduct = (id: string) => {
    setEntityProducts(entityProducts.filter((product) => {
      return product.id !== id;
    }));
  };

  const addOrigins = (origins: string[]): void => {
    setEntityOrigins([...entityOrigins, ...allEntities.filter(entity => origins.includes(entity.id))]);
    setSelectedOrigins([]);
    onAddOriginsClose();
  };

  const removeOrigin = (id: string) => {
    setEntityOrigins(entityOrigins.filter((origin) => {
      return origin.id !== id;
    }));
  };

  const removeCollection = (id: string) => {
    setEntityCollections(entityCollections.filter((collection) => {
      return collection !== id;
    }));
  };

  /**
   * Callback function to the Entity to Collections
   * @param {{ entities: string[], collection: string }} data List of Entities and a Collection to add the Entities to
   */
  const addCollections = (collections: string[]): void => {
    setEntityCollections([...entityCollections, ...collections.filter(collection => !_.isEqual("", collection))]);
    setSelectedCollections([]);
    onAddCollectionsClose();
  };

  return (
    isLoaded ? (
      <PageContainer>
        <Flex p={"2"} pt={"8"} pb={"8"} direction={"row"} justify={"space-between"} align={"center"} wrap={"wrap"}>
          <Heading size={"2xl"}>Entity:{" "}{entityData.name}</Heading>

          {/* Buttons */}
          <Flex direction={"row"} gap={"2"}>
            <Button onClick={onGraphOpen} rightIcon={<Icon as={SlGraph} />} colorScheme={"orange"}>
              View Graph
            </Button>
            <Button onClick={handlePrintClick} rightIcon={<Icon as={BsPrinter} />} colorScheme={"blue"}>
              Print Label
            </Button>
          </Flex>

          {/* Buttons */}
          <Flex direction={"row"} p={"2"} gap={"2"}>
            <Button
              onClick={handleEditClick}
              colorScheme={editing ? "green" : "gray"}
              rightIcon={editing ? <Icon as={CheckIcon} /> : <Icon as={AiOutlineEdit} />}
            >
              {editing ? "Done" : "Edit"}
            </Button>
            <Popover>
              <PopoverTrigger>
                <Button
                  colorScheme={"red"}
                  rightIcon={<CloseIcon />}
                >
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
          </Flex>
        </Flex>

        <Flex p={"2"} direction={"row"} wrap={"wrap"}>
          {/* Metadata table */}
          <Flex p={"2"} gap={"2"} grow={"1"} direction={"column"}>
            <Flex direction={"row"} justify={"space-between"} mb={"sm"}>
              <Heading margin={"none"}>Overview</Heading>
            </Flex>

            <TableContainer>
              <Table mt={"sm"} colorScheme={"gray"}>
                <Thead>
                  <Tr>
                    <Th maxW={"xs"}>Field</Th>
                    <Th>Value</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  <Tr>
                    <Td>Created</Td>
                    <Td><Text>{new Date(entityData.created).toDateString()}</Text></Td>
                  </Tr>

                  <Tr>
                    <Td>Owner</Td>
                    <Td>
                      {_.isEqual(entityData.owner, "") ? (
                        <Tag size={"md"} key={`warn-${entityData._id}`} colorScheme={"orange"}>
                          <TagLabel>Not specified</TagLabel>
                          <TagRightIcon as={WarningIcon} />
                        </Tag>
                      ) : (
                        <Text><Link>{entityData.owner}</Link></Text>
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

            {/* Collections */}
            <Flex p={"2"} gap={"2"} grow={"1"} direction={"column"}>
              <Flex direction={"row"} justify={"space-between"} mb={"sm"}>
                <Heading margin={"none"}>Collections</Heading>
                {editing ? (
                  <Button colorScheme={"green"} rightIcon={<AddIcon />} disabled={!editing} onClick={onAddCollectionsOpen}>
                    Add
                  </Button>
                ) : null}
              </Flex>

              <TableContainer>
                <Table>
                  <Thead>
                    <Tr>
                      <Th pl={"1"}>Collection</Th>
                      <Th></Th>
                    </Tr>
                  </Thead>

                  <Tbody>
                    {entityCollections.map((collection) => {
                      return (
                        <Tr key={collection}>
                          <Td><Linky type="collections" id={collection} /></Td>
                          <Td>
                            <Flex w={"full"} gap={"2"} justify={"right"}>
                              {editing &&
                                <Button
                                  key={`remove-${collection}`}
                                  rightIcon={<CloseIcon />}
                                  colorScheme={"red"}
                                  onClick={() => {removeCollection(collection)}}
                                >
                                  Remove
                                </Button>
                              }

                              {!editing &&
                                <Button
                                  key={`view-${collection}`}
                                  rightIcon={<ChevronRightIcon />}
                                  as={Link}
                                  href={`/collections/${collection}`}
                                >
                                  View
                                </Button>
                              }
                            </Flex>
                          </Td>
                        </Tr>
                      )
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
              {entityCollections.length === 0 &&
                <Text>Entity {entityData.name} is not a member of any Collections.</Text>
              }
            </Flex>
          </Flex>

          <Flex direction={"column"} grow={"2"}>
            {/* Origins */}
            <Flex p={"2"} gap={"2"} grow={"1"} direction={"column"}>
              <Flex direction={"row"} justify={"space-between"} mb={"sm"}>
                <Heading m={"none"}>Origins</Heading>
                {editing ? (
                  <Button colorScheme={"green"} rightIcon={<AddIcon />} disabled={!editing} onClick={onAddOriginsOpen}>
                    Add
                  </Button>
                ) : null}
              </Flex>

              <TableContainer>
                <Table>
                  <Thead>
                    <Tr>
                      <Th pl={"1"}>Origin</Th>
                      <Th></Th>
                    </Tr>
                  </Thead>

                  <Tbody>
                    {entityOrigins.map((origin) => {
                      return (
                        <Tr key={origin.id}>
                          <Td><Linky type="entities" id={origin.id} /></Td>
                          <Td>
                            <Flex w={"full"} gap={"2"} justify={"right"}>
                              {editing &&
                                <Button
                                  key={`remove-${origin.id}`}
                                  rightIcon={<CloseIcon />}
                                  colorScheme={"red"}
                                  onClick={() => {removeOrigin(origin.id)}}
                                >
                                  Remove
                                </Button>
                              }

                              {!editing &&
                                <Button
                                  key={`view-${origin.id}`}
                                  rightIcon={<ChevronRightIcon />}
                                  as={Link}
                                  href={`/entities/${origin.id}`}
                                >
                                  View
                                </Button>
                              }
                            </Flex>
                          </Td>
                        </Tr>
                      )
                    })}
                  </Tbody>
                </Table>
              </TableContainer>

              {entityOrigins.length === 0 &&
                <Text>Entity {entityData.name} does not have any Origins.</Text>
              }
            </Flex>

            {/* Products */}
            <Flex p={"2"} gap={"2"} grow={"1"} direction={"column"}>
              <Flex direction={"row"} justify={"space-between"} mb={"sm"}>
                <Heading m={"none"}>Products</Heading>
                {editing ? (
                  <Button colorScheme={"green"} rightIcon={<AddIcon />} disabled={!editing} onClick={onAddProductsOpen}>
                    Add
                  </Button>
                ) : null}
              </Flex>

              <TableContainer>
                <Table>
                  <Thead>
                    <Tr>
                      <Th pl={"1"}>Product</Th>
                      <Th></Th>
                    </Tr>
                  </Thead>

                  <Tbody>
                    {entityProducts.map((product) => {
                      return (
                        <Tr key={product.id}>
                          <Td><Linky type="entities" id={product.id} /></Td>
                          <Td>
                            <Flex w={"full"} gap={"2"} justify={"right"}>
                              {editing &&
                                <Button
                                  key={`remove-${product.id}`}
                                  rightIcon={<CloseIcon />}
                                  colorScheme={"red"}
                                  onClick={() => {removeProduct(product.id)}}
                                >
                                  Remove
                                </Button>
                              }

                              {!editing &&
                                <Button
                                  key={`view-${product.id}`}
                                  rightIcon={<ChevronRightIcon />}
                                  as={Link}
                                  href={`/entities/${product.id}`}
                                >
                                  View
                                </Button>
                              }
                            </Flex>
                          </Td>
                        </Tr>
                      )
                    })}
                  </Tbody>
                </Table>
              </TableContainer>

              {entityProducts.length === 0 &&
                <Text>Entity {entityData.name} does not have any Products.</Text>
              }
            </Flex>
          </Flex>
        </Flex>

        {/* Attributes */}
        <Flex p={"2"} gap={"2"} direction={"column"}>
          <Flex p={"2"} gap={"2"} direction={"row"} justify={"space-between"} mb={"sm"}>
            <Heading margin={"none"}>Attributes</Heading>
          </Flex>

          <Flex p={"2"} gap={"2"} direction={"row"}>
            {entityAttributes.length > 0 ? (
              entityAttributes.map((attribute) => {
                return <AttributeCard data={attribute} key={`attribute-${attribute.name}`}/>;
              })
            ) : (
              <Text>No attributes specified.</Text>
            )}
          </Flex>
        </Flex>

        <Modal isOpen={isAddCollectionsOpen} onClose={onAddCollectionsClose}>
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
                      setSelectedCollections([...selectedCollections, selectedCollection]);
                    }
                  }}
                >
                  {isLoaded &&
                    collectionData.map((collection) => {
                      return (
                        <option key={collection._id} value={collection._id}>{collection.name}</option>
                      );
                    })
                  };
                </Select>
              </FormControl>

              <Flex direction={"row"} p={"2"} gap={"2"}>
                {selectedCollections.map((collection) => {
                  if (!_.isEqual(collection, "")) {
                    return (
                      <Tag key={`tag-${collection}`}>
                        <Linky id={collection} type={"collections"} />
                        <TagCloseButton onClick={() => {
                          setSelectedCollections(selectedCollections.filter((selected) => {
                            return !_.isEqual(collection, selected);
                          }));
                        }} />
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
                onClick={() => { addCollections(selectedCollections); }}
              >
                Done
              </Button>
            </Flex>
          </ModalContent>
        </Modal>

        <Modal isOpen={isAddProductsOpen} onClose={onAddProductsClose}>
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
                    if (entityProducts.map(product => product.id).includes(event.target.value.toString())) {
                      toast({
                        title: "Warning",
                        description: "Product has already been selected.",
                        status: "warning",
                        duration: 2000,
                        position: "bottom-right",
                        isClosable: true,
                      });
                    } else {
                      setSelectedProducts([...selectedProducts, event.target.value.toString()]);
                    }
                  }}
                >
                  {isLoaded &&
                    allEntities.map((entity) => {
                      return (
                        <option key={entity.id} value={entity.id}>{entity.name}</option>
                      );
                    })
                  };
                </Select>
              </FormControl>

              <Flex direction={"row"} p={"2"} gap={"2"}>
                {selectedProducts.map((entity) => {
                  if (!_.isEqual(entity, "")) {
                    return (
                      <Tag key={`tag-${entity}`}>
                        <Linky id={entity} type={"entities"} />
                        <TagCloseButton onClick={() => {
                          setSelectedProducts(selectedProducts.filter((selected) => {
                            return !_.isEqual(entity, selected);
                          }));
                        }} />
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

        <Modal isOpen={isAddOriginsOpen} onClose={onAddOriginsClose}>
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
                    if (entityOrigins.map(origin => origin.id).includes(event.target.value.toString())) {
                      toast({
                        title: "Warning",
                        description: "Origin has already been selected.",
                        status: "warning",
                        duration: 2000,
                        position: "bottom-right",
                        isClosable: true,
                      });
                    } else {
                      setSelectedOrigins([...selectedOrigins, event.target.value.toString()]);
                    }
                  }}
                >
                  {isLoaded &&
                    allEntities.map((entity) => {
                      return (
                        <option key={entity.id} value={entity.id}>{entity.name}</option>
                      );
                    })
                  };
                </Select>
              </FormControl>

              <Flex direction={"row"} p={"2"} gap={"2"}>
                {selectedOrigins.map((entity) => {
                  if (!_.isEqual(entity, "")) {
                    return (
                      <Tag key={`tag-${entity}`}>
                        <Linky id={entity} type={"entities"} />
                        <TagCloseButton onClick={() => {
                          setSelectedOrigins(selectedOrigins.filter((selected) => {
                            return !_.isEqual(entity, selected);
                          }));
                        }} />
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

        <Modal size={"full"} onEsc={onGraphClose} onClose={onGraphClose} isOpen={isGraphOpen}>
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
      </PageContainer>
    ) : (
      <Loading />
    )
)};

export default Entity;
