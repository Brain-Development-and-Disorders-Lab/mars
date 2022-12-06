// React and Grommet
import { Button, Card, CardBody, CardFooter, CardHeader, Flex, Heading, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Table, TableContainer, Tbody, Td, Text, Tr, useDisclosure } from "@chakra-ui/react";
import React from "react";

// Types
import { AttributeCardProps } from "types";

// Custom components
import ParameterGroup from "../ParameterGroup";
import { WarningLabel } from "../Label";

const AttributeCard = (props: AttributeCardProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <Card w={"md"} onClick={onOpen}>
        <CardHeader>
          <Flex p={"sm"} align={"center"} m="none" justify="start" gap="small">
            {/* <SettingsOption color="brand" /> */}
            {props.data.name}
          </Flex>
        </CardHeader>

        <CardBody>
          <Flex direction={"row"} p={"sm"} gap={"2"} maxW={"md"}>
            {/* <Note color="brand" /> */}
            <Text>
              <strong>Description:</strong>
            </Text>

            <Text noOfLines={2}>
              {props.data.description.length > 0 ?
                props.data.description
              :
                "No description."
              }
            </Text>
            <Text>
              <strong>Parameters:</strong>
            </Text>
            <Text>
              {props.data.parameters.length} configured
            </Text>
          </Flex>
        </CardBody>

        <CardFooter>
          <Flex p={"sm"} m={"none"} justify="start">
            <Button onClick={onOpen}>View</Button>
          </Flex>
        </CardFooter>
      </Card>

      <Modal onEsc={onClose} onClose={onClose} isOpen={isOpen} size={"2xl"}>
        <ModalOverlay />
        <ModalContent p={"2"}>
          <ModalHeader>Attribute: {props.data.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Heading>Metadata</Heading>
            <TableContainer>
              <Table>
                <Tbody>
                  <Tr>
                    <Td>Name</Td>
                    <Td><Text>{props.data.name}</Text></Td>
                  </Tr>
                  <Tr>
                    <Td>Description</Td>
                    <Td>
                      <Text>
                        {props.data.description.length > 0 ?
                          props.data.description
                        :
                          <WarningLabel key={props.data.name} text={"No description"} />
                        }
                      </Text>
                    </Td>
                  </Tr>
                </Tbody>
              </Table>
            </TableContainer>

            <Flex direction={"column"} align={"center"}>
              <Flex p={"small"}>
                {props.data.parameters && props.data.parameters.length > 0 ?
                  <ParameterGroup parameters={props.data.parameters} viewOnly={true} />
                :
                  <Text>No parameters.</Text>
                }
              </Flex>
            </Flex>
          </ModalBody>
          <ModalFooter>

          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AttributeCard;
