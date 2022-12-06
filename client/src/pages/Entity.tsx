// React and Grommet
import React, { useEffect, useState } from "react";
import { Box, Button, Flex, Heading, Table, TableContainer, Tbody, Th, Text, Tr, Link, Input, useToast, Modal, CloseButton, Icon, Thead, Td } from "@chakra-ui/react";
import { AddIcon, ChevronRightIcon, CloseIcon } from "@chakra-ui/icons";
import { AiOutlineEdit } from "react-icons/ai";
import { BsPrinter } from "react-icons/bs";
import { SlGraph } from "react-icons/sl";

// Navigation
import { useParams, useNavigate } from "react-router-dom";

// JSON to CSV tool
import { parse } from "json2csv";

// Consola
import consola from "consola";

// Database and models
import { getData, postData } from "src/database/functions";
import { AttributeStruct, EntityModel } from "types";

// Custom components
// import Graph from "src/components/Graph";
import Linky from "src/components/Linky";
import AttributeCard from "src/components/AttributeCard";
import { Loading } from "src/components/Loading";
import Graph from "src/components/Graph";

export const Entity = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  // Toggles
  const [isLoaded, setIsLoaded] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [editing, setEditing] = useState(false);

  // Break up entity data into editable fields
  const [entityData, setEntityData] = useState({} as EntityModel);
  const [description, setDescription] = useState("");
  const [collections, setCollections] = useState([] as string[]);
  const [products, setProducts] = useState([] as { name: string; id: string }[]);
  const [attributes, setAttributes] = useState([] as AttributeStruct[]);

  // Toggle editing status
  const handleEditClick = () => {
    if (editing) {
      // Collate data for updating
      const updateData: EntityModel = {
        _id: entityData._id,
        name: entityData.name,
        created: entityData.created,
        owner: entityData.owner,
        description: description,
        collections: collections,
        associations: {
          origin: entityData.associations.origin,
          products: products,
        },
        attributes: attributes,
      };

      // Update data
      postData(`/entities/update`, updateData).then(() => {
        setEditing(false);
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
      origin: entityData.associations.origin.name,
      products: entityData.associations.products.join(),
    };

    let fields = ["id", "name", "created", "owner", "description", "collections", "origin", "products"];

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
  };

  useEffect(() => {
    const response = getData(`/entities/${id}`);

    // Handle the response from the database
    response.then((value) => {
      setEntityData(value);

      // Check the contents of the response
      if (value["error"] !== undefined) {
        toast({
          title: "Database Error",
          description: value["error"],
          status: "error",
          duration: 4000,
          position: "bottom-right",
          isClosable: true,
        });
      }

      setIsLoaded(true);
    });
    return;
  }, [id]);

  useEffect(() => {
    if (isLoaded) {
      // Update the state of editable data fields
      setDescription(entityData.description);
      setCollections(entityData.collections);
      setProducts(entityData.associations.products);
      setAttributes(entityData.attributes);
    }
  }, [isLoaded]);

  const removeProduct = (id: string) => {
    setProducts(products.filter((product) => {
      return product.id !== id;
    }));
  };

  const removeCollection = (id: string) => {
    setCollections(collections.filter((collection) => {
      return collection !== id;
    }));
  };

  return (
    isLoaded ? (
      <Box m={"2"}>
        <Flex p={"2"} pt={"8"} pb={"8"} direction={"row"} justify={"space-between"} align={"center"}>
          <Heading size={"3xl"}>{entityData.name}</Heading>

          <Flex direction={"row"} p={"2"} gap={"2"}>
            <Button onClick={() => setShowGraph(true)} rightIcon={<Icon as={SlGraph} />} colorScheme={"orange"}>
              View Graph
            </Button>
            <Button onClick={() => handleEditClick()} rightIcon={<Icon as={AiOutlineEdit} />}>
              {editing ? "Save" : "Edit"}
            </Button>
            <Button onClick={() => handlePrintClick()} rightIcon={<Icon as={BsPrinter} />} colorScheme={"blue"}>
              Print Label
            </Button>
          </Flex>
        </Flex>

        {/* Metadata table */}
        <Flex p={"2"} gap={"2"} direction={"column"}>
          <Heading size={"xl"} margin={"none"}>
            Metadata
          </Heading>

          <TableContainer background={"gray.50"} rounded={"2xl"} p={"4"}>
            <Table mt={"sm"} colorScheme={"gray"}>
              <Thead>
                <Tr>
                  <Th>Field</Th>
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
                  <Td><Text><Link>{entityData.owner}</Link></Text></Td>
                </Tr>

                <Tr>
                  <Td>Origin</Td>
                  <Td>
                    <Flex
                      direction={"row"}
                      gap={"small"}
                      align={"center"}
                      margin={"none"}
                    >
                      {entityData.associations.origin.id !== "" ? (
                        <Linky
                          key={entityData.associations.origin.id}
                          type="entities"
                          id={entityData.associations.origin.id}
                        />
                      ) : (
                        <Text>No origin specified.</Text>
                      )}
                    </Flex>
                  </Td>
                </Tr>

                <Tr>
                  <Td>Description</Td>
                  <Td>
                    {editing ? (
                      <Input
                        value={description}
                        onChange={(event) => {
                          consola.debug("Updating Entity description");
                          setDescription(event.target.value);
                        }}
                      />
                    ) : (
                      <Text>{description}</Text>
                    )}
                  </Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Flex>

        {/* Collections */}
        <Flex p={"2"} gap={"2"} direction={"column"}>
          <Flex direction={"row"} justify={"space-between"} mb={"sm"}>
            <Heading margin={"none"}>Collections</Heading>
            {editing ? (
              <Button rightIcon={<AddIcon />} disabled={!editing}>
                Add
              </Button>
            ) : null}
          </Flex>

          <Flex>
            {collections.map((collection) => {
              return (
                <Flex>
                  <Linky type="collections" id={collection} key={`linky-collection-${collection}`}/>
                  {editing &&
                    <Button
                      key={`remove-${collection}`}
                      rightIcon={<CloseIcon />}
                      onClick={() => {removeCollection(collection)}}
                    >
                      Remove
                    </Button>
                  }
                  {!editing &&
                    <Button
                      key={`view-${collection}`}
                      rightIcon={<ChevronRightIcon />}
                      onClick={() => {navigate(`/collections/${collection}`)}}
                    >
                      View
                    </Button>
                  }
                </Flex>
              )
            })}
          </Flex>
        </Flex>

        {/* Products */}
        <Flex p={"sm"}>
          <Flex direction={"row"} justify={"space-between"} mb={"sm"}>
            <Heading m={"none"}>Products</Heading>
            {editing ? (
              <Button rightIcon={<AddIcon />} disabled={!editing}>
                Add
              </Button>
            ) : null}
          </Flex>
          <Flex>
            {products.map((product) => {
              return (
                <Flex>
                  <Linky type="entities" id={product.id} key={`linky-product-${product.id}`}/>
                  {editing &&
                    <Button
                      key={`remove-${product}`}
                      rightIcon={<CloseIcon />}
                      onClick={() => {removeProduct(product.id)}}
                    >
                      Remove
                    </Button>
                  }
                  {!editing &&
                    <Button
                      key={`view-${product.id}`}
                      rightIcon={<ChevronRightIcon />}
                      onClick={() => {navigate(`/entities/${product.id}`)}}
                    >
                      View
                    </Button>
                  }
                </Flex>
              )
            })}
          </Flex>
        </Flex>

        {/* Attributes */}
        <Flex p={"sm"}>
          <Flex direction={"row"} justify={"space-between"} mb={"sm"}>
            <Heading margin={"none"}>Attributes</Heading>
            {editing ? (
              <Button rightIcon={<AddIcon />} disabled={!editing}>
                Add
              </Button>
            ) : null}
          </Flex>

          <Flex direction={"row"} gap={"sm"}>
            {attributes.length > 0 ? (
              attributes.map((attribute) => {
                return <AttributeCard data={attribute} key={`attribute-${attribute.name}`}/>;
              })
            ) : (
              <Text>No attributes specified.</Text>
            )}
          </Flex>
        </Flex>

        <Modal
          size={"full"}
          onEsc={() => setShowGraph(false)}
          onClose={() => setShowGraph(false)}
          isOpen={showGraph}
        >
          <Flex direction={"row"} justify={"space-between"} mr={"small"}>
            <Heading m={"sm"}>
              Graph: {entityData.name}
            </Heading>
            <Button
              rightIcon={<CloseButton />}
              onClick={() => setShowGraph(false)}
            />
          </Flex>
          <Graph id={entityData._id} />
        </Modal>
      </Box>
    ) : (
      <Loading />
    )
)};

export default Entity;
