// React
import React, { useState } from "react";
import { Button, Flex, Heading, Icon, Input, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, useToast } from "@chakra-ui/react";
import { ChevronRightIcon, SearchIcon } from "@chakra-ui/icons";

// Navigation
import { useNavigate } from "react-router-dom";

// Database and models
import { getData } from "@database/functions";
import { EntityModel } from "@types";
import { Loading } from "@components/Loading";

const Search = () => {
  const [query, setQuery] = useState("");

  // Search status
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  // Store results as a set of IDs
  const [results, setResults] = useState([] as EntityModel[]);

  const runSearch = () => {
    // Update state
    setIsSearching(true);
    setHasSearched(true);

    getData(`/search/${query}`).then((value) => {
      setResults(value);
      setIsSearching(false);

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

    });
  };

  return (
    <Flex m={"2"} align={"center"} justify={"center"}>
      <Flex p={"2"} pt={"0"} direction={"column"} w={"full"} maxW={"7xl"} wrap={"wrap"} gap={"6"}>
        <Flex direction={"row"} align={"center"} gap={"2"}>
          <Input
            value={query}
            placeholder="Enter search query..."
            onChange={(event) => setQuery(event.target.value)}
          />

          <Button
            rightIcon={<Icon as={SearchIcon} />}
            disabled={query === ""}
            onClick={() => runSearch()}
          >
            Search
          </Button>
        </Flex>

        <Heading size={"md"}>Search Results</Heading>

        <Flex gap={"2"}>
          {isSearching ? (
            <Loading />
          ) : hasSearched ? (
            <TableContainer w={"full"}>
              <Table>
                <Thead>
                  <Tr>
                    <Th>
                      Identifier
                    </Th>
                    <Th>
                      Created
                    </Th>
                    <Th>
                      Owner
                    </Th>
                    <Th></Th>
                  </Tr>
                </Thead>

                <Tbody>
                  {results.length > 0 && (
                    results.map((result) => {
                      return (
                        <Tr key={result._id}>
                          <Td>{result.name}</Td>
                          <Td>{new Date(result.created).toDateString()}</Td>
                          <Td>{result.owner}</Td>
                          <Td>
                            <Button
                              rightIcon={<ChevronRightIcon />}
                              onClick={() => navigate(`/entities/${result._id}`)}
                            >
                              View
                            </Button>
                          </Td>
                        </Tr>
                      );
                    })
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          ) : (
            <Text>Search results will appear here.</Text>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Search;
