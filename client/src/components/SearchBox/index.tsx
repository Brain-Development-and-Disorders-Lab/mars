// React
import React, { useState } from "react";

// Existing and custom components
import {
  Button,
  Flex,
  Input,
  useToast,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  useDisclosure,
  Link,
  Spacer,
  VStack,
  StackDivider,
  PopoverFooter,
} from "@chakra-ui/react";
import Icon from "@components/Icon";

// Existing and custom types
import { EntityModel } from "@types";

// Routing and navigation
import { useNavigate } from "react-router-dom";

// Utility functions and libraries
import { getData, postData } from "@database/functions";

const SearchBox = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onToggle, onClose } = useDisclosure();

  // Search status
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isError, setIsError] = useState(false);

  // Store results as a set of IDs
  const [results, setResults] = useState([] as EntityModel[]);

  const runSearch = () => {
    // Check if an ID has been entered
    let isEntity = false;
    getData(`/entities/${query}`)
      .then((entity) => {
        isEntity = true;
        setQuery("");
        onClose();
        navigate(`/entities/${entity._id}`);
      })
      .catch(() => {
        if (!isEntity) {
          // Update state
          setIsSearching(true);
          setHasSearched(true);

          postData(`/search`, { query: query })
            .then((value) => {
              setResults(value);
            })
            .catch((_error) => {
              toast({
                title: "Error",
                status: "error",
                description: "Could not get search results.",
                duration: 4000,
                position: "bottom-right",
                isClosable: true,
              });
              setIsError(true);
            })
            .finally(() => {
              setIsSearching(false);
            });
        }
      });
  };

  // Basic handler to display results
  const handleClick = () => {
    onToggle();
    runSearch();
  };

  // Basic handler to navigate to a result
  const handleResultClick = (id: string) => {
    setQuery("");
    onClose();
    navigate(`/entities/${id}`);
  };

  return (
    <Flex w={"100%"} maxW={"xl"} p={"1"}>
      <Popover
        isOpen={isOpen}
        onClose={onClose}
        placement={"bottom"}
        matchWidth
      >
        <PopoverTrigger>
          <Flex w={"100%"} gap={"4"}>
            <Input
              value={query}
              placeholder={"Quick Search"}
              background={"white"}
              onChange={(event) => setQuery(event.target.value)}
              onKeyUp={(event) => {
                // Listen for "Enter" key when entering a query
                if (event.key === "Enter" && query !== "") {
                  handleClick();
                }
              }}
            />

            <Button
              leftIcon={<Icon name={"search"} />}
              isDisabled={query === ""}
              onClick={handleClick}
            >
              Go
            </Button>
          </Flex>
        </PopoverTrigger>

        <PopoverContent w={"100%"}>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader>
            {results.length} results for "{query}"
          </PopoverHeader>
          <PopoverBody>
            <Flex gap={"2"} p={"2"}>
              {isSearching ? (
                <Flex>Searching</Flex>
              ) : (
                hasSearched &&
                !isError && (
                  <VStack
                    gap={"4"}
                    divider={<StackDivider borderColor={"gray.200"} />}
                    w={"100%"}
                  >
                    {results.slice(0, 5).map((result) => {
                      return (
                        <Flex
                          key={result._id}
                          direction={"row"}
                          gap={"4"}
                          w={"100%"}
                        >
                          <Text as={"b"}>{result.name}</Text>
                          <Spacer />
                          <Link onClick={() => handleResultClick(result._id)}>
                            <Flex gap={"1"} direction={"row"} align={"center"}>
                              <Text>View</Text>
                              <Icon name={"a_right"} />
                            </Flex>
                          </Link>
                        </Flex>
                      );
                    })}
                  </VStack>
                )
              )}
            </Flex>
          </PopoverBody>
          <PopoverFooter>
            <Text>
              For more complete results, use the dedicated Search page.
            </Text>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
    </Flex>
  );
};

export default SearchBox;
