// React
import React, { useEffect, useState } from "react";

// Existing and custom components
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Spacer,
  Stack,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  Tag,
  TagCloseButton,
  Text,
  Textarea,
  VStack,
  useDisclosure,
  useSteps,
  useToast,
} from "@chakra-ui/react";
import { Content } from "@components/Container";
import Icon from "@components/Icon";
import Linky from "@components/Linky";
import AttributeCard from "@components/AttributeCard";
import SearchSelect from "@components/SearchSelect";

// Existing and custom types
import {
  AttributeModel,
  AttributeCardProps,
  IEntity,
  IGenericItem,
} from "@types";

// Utility functions and libraries
import { useToken } from "src/authentication/useToken";
import { isValidAttributes } from "src/util";
import _ from "lodash";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import consola from "consola";

// Routing and navigation
import { useNavigate } from "react-router-dom";
import { gql, useLazyQuery, useMutation, useQuery } from "@apollo/client";

const Entity = () => {
  // Used to manage what detail inputs are presented
  const [pageState, setPageState] = useState(
    "start" as "start" | "attributes" | "associations",
  );

  const pageSteps = [
    { title: "Start", description: "Basic information" },
    { title: "Associations", description: "Relations" },
    { title: "Attributes", description: "Specify metadata" },
  ];
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: pageSteps.length,
  });

  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [token] = useToken();

  const [projects, setProjects] = useState([] as IGenericItem[]);
  const [attributes, setAttributes] = useState([] as AttributeModel[]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [isNameUnique, setIsNameUnique] = useState(true);
  const [created, setCreated] = useState(
    dayjs(Date.now()).format("YYYY-MM-DD"),
  );
  const [owner] = useState(token.orcid);
  const [description, setDescription] = useState("");
  const [selectedProjects, setSelectedProjects] = useState([] as string[]);
  const [selectedOrigins, setSelectedOrigins] = useState([] as IGenericItem[]);
  const [selectedProducts, setSelectedProducts] = useState(
    [] as IGenericItem[],
  );
  const [selectedAttributes, setSelectedAttributes] = useState(
    [] as AttributeModel[],
  );

  const entityState: IEntity = {
    name: name,
    owner: owner,
    created: created,
    archived: false,
    locked: false,
    description: description,
    associations: {
      origins: selectedOrigins,
      products: selectedProducts,
    },
    projects: selectedProjects,
    attributes: selectedAttributes,
    attachments: [],
  };

  // Various validation error states
  const isNameError = name === "";
  const isDateError = created === "";
  const validDetails = !isNameError && !isDateError;

  const [validAttributes, setValidAttributes] = useState(false);

  // GraphQL operations
  const CHECK_ENTITY_NAME = gql`
    query CheckEntityName($name: String) {
      entityNameExists(name: $name)
    }
  `;
  const [entityNameExists, { error: entityNameError }] =
    useLazyQuery(CHECK_ENTITY_NAME);

  const GET_CREATE_ENTITIES_DATA = gql`
    query GetCreateEntitiesData {
      projects {
        _id
        name
        description
      }
      attributes {
        _id
        name
        description
        values {
          _id
          name
          data
          type
        }
      }
    }
  `;
  const { loading, error, data, refetch } = useQuery(GET_CREATE_ENTITIES_DATA);

  const CREATE_ENTITY = gql`
    mutation CreateEntity($entity: EntityCreateInput) {
      createEntity(entity: $entity) {
        success
        message
      }
    }
  `;
  const [createEntity, { loading: createLoading, error: createError }] =
    useMutation(CREATE_ENTITY);

  // Assign data
  useEffect(() => {
    if (data?.projects) {
      setProjects(data.projects);
    }
    if (data?.attributes) {
      setAttributes(data.attributes);
    }
  }, [data]);

  const checkEntityName = async (name: string) => {
    // Adjust the URL and HTTP client according to your setup
    const response = await entityNameExists({
      variables: {
        name: name,
      },
    });
    setIsNameUnique(!response.data.entityNameExists);
    if (entityNameError) {
      consola.error("Failed to check entity name:", entityNameError.cause);
    }
  };

  // Check to see if data currently exists and refetch if so
  useEffect(() => {
    if (data && refetch) {
      refetch();
    }
  }, []);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        status: "error",
        description: error.message,
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    }
  }, [error]);

  useEffect(() => {
    setValidAttributes(isValidAttributes(selectedAttributes));
  }, [selectedAttributes]);

  const isValidInput = (): boolean => {
    if (_.isEqual("start", pageState)) {
      return validDetails;
    } else if (_.isEqual("attributes", pageState)) {
      if (selectedAttributes.length > 0) {
        return validAttributes;
      }
      return true;
    }
    return true;
  };

  // Handle `SearchSelect` updates for selecting Origins and Products
  const [selectedOrigin, setSelectedOrigin] = useState({} as IGenericItem);
  useEffect(() => {
    if (
      _.find(selectedOrigins, (origin) => {
        return _.isEqual(origin._id, selectedOrigin._id);
      })
    ) {
      toast({
        title: "Warning",
        description: "Origin has already been selected.",
        status: "warning",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    } else if (selectedOrigin._id && !_.isEqual(selectedOrigin._id, "")) {
      setSelectedOrigins([...selectedOrigins, selectedOrigin]);
    }
  }, [selectedOrigin]);

  const [selectedProduct, setSelectedProduct] = useState({} as IGenericItem);
  useEffect(() => {
    if (
      _.find(selectedProducts, (product) => {
        return _.isEqual(product._id, selectedProduct._id);
      })
    ) {
      toast({
        title: "Warning",
        description: "Product has already been selected.",
        status: "warning",
        duration: 2000,
        position: "bottom-right",
        isClosable: true,
      });
    } else if (selectedProduct._id && !_.isEqual(selectedProduct._id, "")) {
      setSelectedProducts([...selectedProducts, selectedProduct]);
    }
  }, [selectedProduct]);

  // Handle clicking "Next"
  const onPageNext = async () => {
    if (_.isEqual("start", pageState)) {
      setPageState("associations");
      setActiveStep(1);
    } else if (_.isEqual("associations", pageState)) {
      setPageState("attributes");
      setActiveStep(2);
    } else if (_.isEqual("attributes", pageState)) {
      setIsSubmitting(true);

      // Execute the GraphQL operation
      const response = await createEntity({
        variables: {
          entity: entityState,
        },
      });

      if (response.data.createEntity.success) {
        setIsSubmitting(false);
        navigate(`/entities`);
      }
    }
  };

  // Handle clicking "Back"
  const onPageBack = () => {
    if (_.isEqual("associations", pageState)) {
      setPageState("start");
      setActiveStep(0);
    } else if (_.isEqual("attributes", pageState)) {
      setPageState("associations");
      setActiveStep(1);
    }
  };

  // Removal callback
  const onRemoveAttributeCard = (identifier: string) => {
    // We need to filter the removed attribute
    setSelectedAttributes(
      selectedAttributes.filter((attribute) => attribute._id !== identifier),
    );
  };

  // Used to receive data from a AttributeCard component
  const onUpdateAttributeCard = (data: AttributeCardProps) => {
    setSelectedAttributes([
      ...selectedAttributes.map((attribute) => {
        if (_.isEqual(attribute._id, data._id)) {
          return {
            _id: data._id,
            name: data.name,
            owner: attribute.owner,
            timestamp: attribute.timestamp,
            archived: false,
            description: data.description,
            values: data.values,
          };
        }
        return attribute;
      }),
    ]);
  };

  return (
    <Content
      isLoaded={!loading && !createLoading}
      isError={!_.isUndefined(error) && !_.isUndefined(createError)}
    >
      <Flex direction={"column"}>
        {/* Page header */}
        <Flex
          direction={"row"}
          p={"2"}
          align={"center"}
          justify={"space-between"}
        >
          <Flex align={"center"} gap={"2"} w={"100%"}>
            <Icon name={"entity"} size={"md"} />
            <Heading size={"md"}>Create Entity</Heading>
            <Spacer />
            <Button
              size={"sm"}
              rightIcon={<Icon name={"info"} />}
              variant={"outline"}
              onClick={onOpen}
            >
              Info
            </Button>
          </Flex>
        </Flex>

        {/* Main pages */}
        {/* Stepper progress indicator */}
        <Stepper index={activeStep} p={"2"} size={"sm"}>
          {pageSteps.map((step, index) => (
            <Step key={index}>
              <StepIndicator>
                <StepStatus
                  complete={<StepIcon />}
                  incomplete={<StepNumber />}
                  active={<StepNumber />}
                />
              </StepIndicator>

              <Box flexShrink={"0"}>
                <StepTitle>{step.title}</StepTitle>
                <StepDescription>{step.description}</StepDescription>
              </Box>

              <StepSeparator />
            </Step>
          ))}
        </Stepper>

        {/* "Start" page */}
        {_.isEqual("start", pageState) && (
          <Flex direction={"row"} gap={"0"} wrap={"wrap"}>
            <Flex
              direction={"column"}
              p={"2"}
              pt={{ base: "0", lg: "2" }}
              gap={"2"}
              grow={"1"}
              basis={"50%"}
              rounded={"md"}
            >
              <Flex
                direction={"column"}
                p={"2"}
                gap={"2"}
                border={"1px"}
                borderColor={"gray.300"}
                rounded={"md"}
              >
                <FormControl
                  isRequired
                  isInvalid={isNameError || !isNameUnique}
                >
                  <FormLabel fontSize={"sm"}>Name</FormLabel>
                  <Input
                    name={"name"}
                    value={name}
                    placeholder={"Name"}
                    size={"sm"}
                    onChange={(event) => {
                      setName(event.target.value);
                      checkEntityName(event.target.value);
                    }}
                  />
                  {(isNameError || !isNameUnique) && (
                    <FormErrorMessage fontSize={"sm"}>
                      A name or ID must be specified and unique.
                    </FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isInvalid={isDateError}>
                  <FormLabel fontSize={"sm"}>Created</FormLabel>
                  <Input
                    placeholder={"Select Date and Time"}
                    size={"sm"}
                    type={"date"}
                    value={created}
                    onChange={(event) => setCreated(event.target.value)}
                  />
                  {isDateError && (
                    <FormErrorMessage fontSize={"sm"}>
                      A created date must be specified.
                    </FormErrorMessage>
                  )}
                </FormControl>
              </Flex>
            </Flex>

            <Flex
              direction={"column"}
              p={"2"}
              pl={{ base: "2", lg: "0" }}
              pt={{ base: "0", lg: "2" }}
              gap={"2"}
              grow={"1"}
              basis={"50%"}
              rounded={"md"}
            >
              <Flex
                direction={"column"}
                p={"2"}
                gap={"2"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.300"}
              >
                {/* Description */}
                <FormControl>
                  <FormLabel fontSize={"sm"}>Description</FormLabel>
                  <Textarea
                    value={description}
                    placeholder={"Description"}
                    w={"100%"}
                    size={"sm"}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </FormControl>
              </Flex>
            </Flex>
          </Flex>
        )}

        {/* "Associations" page */}
        {_.isEqual("associations", pageState) && (
          <Flex direction={"row"} gap={"0"} wrap={"wrap"}>
            <Flex
              direction={"column"}
              p={"2"}
              pt={{ base: "0", lg: "2" }}
              gap={"2"}
              grow={"1"}
              basis={"50%"}
              rounded={"md"}
            >
              {/* Origins */}
              <Flex
                direction={"column"}
                p={"2"}
                gap={"2"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.300"}
              >
                <FormControl>
                  <FormLabel fontSize={"sm"}>Origins</FormLabel>
                  <SearchSelect
                    value={selectedOrigin}
                    onChange={setSelectedOrigin}
                  />
                  <FormHelperText fontSize={"sm"}>
                    If the sources of this Entity currently exist or did exist
                    in this system, specify those associations here by selecting
                    the origin Entities.
                  </FormHelperText>
                </FormControl>

                {/* List selected Origins */}
                <Flex
                  direction={"row"}
                  p={"2"}
                  gap={"2"}
                  wrap={"wrap"}
                  minH={selectedOrigins.length > 0 ? "fit-content" : "100px"}
                  align={"center"}
                  justify={"center"}
                >
                  {selectedOrigins.map((product) => {
                    return (
                      <Tag key={`tag-${product._id}`}>
                        <Linky id={product._id} type={"entities"} size={"sm"} />
                        <TagCloseButton
                          onClick={() => {
                            setSelectedOrigins(
                              selectedOrigins.filter((selected) => {
                                return !_.isEqual(product._id, selected._id);
                              }),
                            );
                          }}
                        />
                      </Tag>
                    );
                  })}
                  {selectedOrigins.length === 0 && (
                    <Text
                      fontSize={"sm"}
                      fontWeight={"semibold"}
                      color={"gray.200"}
                    >
                      No Origins
                    </Text>
                  )}
                </Flex>
              </Flex>

              {/* Products */}
              <Flex
                direction={"column"}
                p={"2"}
                gap={"2"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.300"}
              >
                <FormControl>
                  <FormLabel fontSize={"sm"}>Products</FormLabel>
                  <SearchSelect
                    value={selectedProduct}
                    onChange={setSelectedProduct}
                  />
                  <FormHelperText fontSize={"sm"}>
                    If this Entity has any derivatives or Entities that have
                    been created from it, specify those associations here by
                    selecting the corresponding Entities.
                  </FormHelperText>
                </FormControl>

                <Flex
                  direction={"row"}
                  p={"2"}
                  w={"100%"}
                  gap={"2"}
                  wrap={"wrap"}
                  minH={selectedProducts.length > 0 ? "fit-content" : "100px"}
                  align={"center"}
                  justify={"center"}
                >
                  {selectedProducts.map((product) => {
                    return (
                      <Tag key={`tag-${product._id}`}>
                        <Linky id={product._id} type={"entities"} size={"sm"} />
                        <TagCloseButton
                          onClick={() => {
                            setSelectedProducts(
                              selectedProducts.filter((selected) => {
                                return !_.isEqual(product._id, selected._id);
                              }),
                            );
                          }}
                        />
                      </Tag>
                    );
                  })}
                  {selectedProducts.length === 0 && (
                    <Text
                      fontSize={"sm"}
                      fontWeight={"semibold"}
                      color={"gray.200"}
                    >
                      No Products
                    </Text>
                  )}
                </Flex>
              </Flex>
            </Flex>

            <Flex
              direction={"column"}
              p={"2"}
              pl={{ base: "2", sm: "0", md: "0", lg: "0" }}
              pt={{ base: "0", sm: "0", md: "0", lg: "2" }}
              gap={"2"}
              grow={"1"}
              basis={"50%"}
              rounded={"md"}
            >
              {/* Projects */}
              <Flex
                direction={"column"}
                p={"2"}
                gap={"2"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.300"}
              >
                <FormControl>
                  <FormLabel fontSize={"sm"}>Projects</FormLabel>
                  <CheckboxGroup
                    size={"sm"}
                    value={selectedProjects}
                    onChange={(event: string[]) => {
                      if (event) {
                        setSelectedProjects([...event]);
                      }
                    }}
                  >
                    <Stack spacing={[1, 5]} direction={"column"}>
                      {projects.map((project) => {
                        return (
                          <Checkbox key={project._id} value={project._id}>
                            {project.name}
                          </Checkbox>
                        );
                      })}
                      {projects.length === 0 && <Text>No Projects.</Text>}
                    </Stack>
                  </CheckboxGroup>
                  <FormHelperText fontSize={"sm"}>
                    Specify the Projects that this new Entity should be included
                    with. The Entity will then be contained within the specified
                    Projects.
                  </FormHelperText>
                </FormControl>
              </Flex>
            </Flex>
          </Flex>
        )}

        {/* "Attributes" page */}
        {_.isEqual("attributes", pageState) && (
          <Flex direction={"row"} gap={"0"} wrap={"wrap"}>
            <Flex
              direction={"column"}
              p={"2"}
              w={"100%"}
              pt={{ base: "0", lg: "2" }}
              gap={"2"}
              rounded={"md"}
            >
              <Flex
                direction={"row"}
                p={"2"}
                gap={"2"}
                rounded={"md"}
                border={"1px"}
                borderColor={"gray.300"}
                justify={"space-between"}
              >
                {/* Drop-down to select template Attributes */}
                <FormControl maxW={"sm"}>
                  <Select
                    size={"sm"}
                    placeholder={"Template Attribute"}
                    onChange={(event) => {
                      if (!_.isEqual(event.target.value.toString(), "")) {
                        for (const attribute of attributes) {
                          if (
                            _.isEqual(
                              event.target.value.toString(),
                              attribute._id,
                            )
                          ) {
                            setSelectedAttributes([
                              ...selectedAttributes,
                              {
                                _id: `a-${nanoid(6)}`,
                                name: attribute.name,
                                timestamp: attribute.timestamp,
                                owner: attribute.owner,
                                archived: false,
                                description: attribute.description,
                                values: attribute.values,
                              },
                            ]);
                            break;
                          }
                        }
                      }
                    }}
                  >
                    {attributes.map((attribute) => {
                      return (
                        <option key={attribute._id} value={attribute._id}>
                          {attribute.name}
                        </option>
                      );
                    })}
                  </Select>
                </FormControl>

                <Button
                  size={"sm"}
                  rightIcon={<Icon name={"add"} />}
                  colorScheme={"green"}
                  onClick={() => {
                    // Create an 'empty' Attribute and add the data structure to 'selectedAttributes'
                    setSelectedAttributes([
                      ...selectedAttributes,
                      {
                        _id: `a-${nanoid(6)}`,
                        name: "",
                        timestamp: dayjs(Date.now()).toISOString(),
                        owner: owner,
                        archived: false,
                        description: "",
                        values: [],
                      },
                    ]);
                  }}
                >
                  Create
                </Button>
              </Flex>
            </Flex>

            <Flex
              w={"100%"}
              minH={selectedAttributes.length > 0 ? "fit-content" : "200px"}
              p={"2"}
              pt={"0"}
            >
              {/* Display all Attributes */}
              {selectedAttributes.length > 0 ? (
                <VStack gap={"2"} w={"100%"}>
                  {selectedAttributes.map((attribute) => {
                    return (
                      <AttributeCard
                        _id={attribute._id}
                        key={attribute._id}
                        name={attribute.name}
                        owner={attribute.owner}
                        archived={attribute.archived}
                        description={attribute.description}
                        values={attribute.values}
                        restrictDataValues={false}
                        onRemove={onRemoveAttributeCard}
                        onUpdate={onUpdateAttributeCard}
                      />
                    );
                  })}
                </VStack>
              ) : (
                <Flex w={"100%"} h={"100%"} align={"center"} justify={"center"}>
                  <Text fontWeight={"semibold"} color={"gray.200"}>
                    No Attributes
                  </Text>
                </Flex>
              )}
            </Flex>
          </Flex>
        )}

        {/* Information modal */}
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent p={"2"} gap={"4"} w={["lg", "xl", "2xl"]}>
            <ModalHeader p={"2"}>Entities</ModalHeader>
            <ModalCloseButton />
            <ModalBody p={"2"}>
              <Flex direction={"column"} gap={"4"} p={"2"}>
                <Heading size={"md"}>Overview</Heading>
                <Text>
                  Specify some basic details about this Entity. Relations
                  between Entities and membership to Projects can be specified
                  on the following page. Finally, the metadata associated with
                  this Entity should be specified using Attributes and
                  corresponding Values.
                </Text>
                <Heading size={"md"}>Associations</Heading>
                <Text>
                  Relations between Entities and membership to Projects can be
                  specified using Associations.
                </Text>
                <Heading size={"md"}>Attributes</Heading>
                <Text>
                  The metadata associated with this Entity should be specified
                  using Attributes and corresponding Values.
                </Text>
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Flex>

      {/* Place the action buttons at the bottom of the screen on desktop */}
      <Spacer />

      {/* Action buttons */}
      <Flex
        direction={"row"}
        wrap={"wrap"}
        gap={"6"}
        justify={"space-between"}
        align={"center"}
        w={"100%"}
        p={"2"}
        shrink={"0"}
      >
        <Flex gap={"4"}>
          <Button
            size={"sm"}
            colorScheme={"red"}
            variant={"outline"}
            rightIcon={<Icon name={"cross"} />}
            onClick={() => navigate("/entities")}
          >
            Cancel
          </Button>
          {!_.isEqual("start", pageState) && (
            <Button
              size={"sm"}
              colorScheme={"orange"}
              variant={"outline"}
              rightIcon={<Icon name={"c_left"} />}
              onClick={onPageBack}
            >
              Back
            </Button>
          )}
        </Flex>

        <Button
          size={"sm"}
          colorScheme={_.isEqual("attributes", pageState) ? "green" : "blue"}
          rightIcon={
            _.isEqual("attributes", pageState) ? (
              <Icon name={"check"} />
            ) : (
              <Icon name={"c_right"} />
            )
          }
          onClick={onPageNext}
          isDisabled={!isValidInput() || isNameError}
          isLoading={isSubmitting}
        >
          {_.isEqual("attributes", pageState) ? "Finish" : "Continue"}
        </Button>
      </Flex>
    </Content>
  );
};

export default Entity;
