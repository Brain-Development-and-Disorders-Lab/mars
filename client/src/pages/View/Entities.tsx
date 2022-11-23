// React and Grommet
import React, { useEffect, useState } from "react";
import {
  Anchor,
  Button,
  PageHeader,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "grommet/components";
import { LinkNext } from "grommet-icons";
import { Flex, useToast } from "@chakra-ui/react";

// Navigation
import { useNavigate } from "react-router-dom";

// Database and models
import { getData } from "src/database/functions";
import { EntityModel } from "types";

// Custom components
import { Loading } from "src/components/Loading";

const Entities = () => {
  const navigate = useNavigate();

  const toast = useToast();

  const [isLoaded, setIsLoaded] = useState(false);
  const [entityData, setEntityData] = useState([] as EntityModel[]);

  useEffect(() => {
    const response = getData(`/entities`);

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
  }, []);

  return (
    isLoaded ? 
    <Flex>
      <PageHeader
        title="Entities"
        parent={<Anchor label="Home" href="/" />}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell scope="col" border="bottom" align="center">
              Identifier
            </TableCell>
            <TableCell scope="col" border="bottom" align="center">
              Created
            </TableCell>
            <TableCell scope="col" border="bottom" align="center">
              Owner
            </TableCell>
            <TableCell scope="col" border="bottom"></TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoaded &&
            entityData.map((entity) => {
              return (
                <TableRow key={entity._id}>
                  <TableCell scope="row" border="right" align="center">
                    <strong>{entity.name}</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>
                      {new Date(entity.created).toDateString()}
                    </strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>{entity.owner}</strong>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      color="accent-4"
                      primary
                      icon={<LinkNext />}
                      label="View"
                      onClick={() => navigate(`/entities/${entity._id}`)}
                      reverse
                    />
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </Flex>
    :
    <Loading />
  );
};

export default Entities;
