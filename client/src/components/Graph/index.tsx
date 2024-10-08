// React
import React, { useEffect } from "react";

// Existing and custom components
import { Button, Flex, Text, Tooltip, useToast } from "@chakra-ui/react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  MarkerType,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import Icon from "@components/Icon";

// Existing and custom types
import { EntityNode } from "@types";

// Utility functions and libraries
import { gql, useLazyQuery } from "@apollo/client";
import _ from "lodash";
import ELK, { ElkExtendedEdge, ElkNode } from "elkjs";

const Graph = (props: {
  id: string;
  entityNavigateHook: (id: string) => void;
}) => {
  const toast = useToast();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Queries
  const GET_ENTITY_DATA = gql`
    query GetEntityData($_id: String) {
      entity(_id: $_id) {
        _id
        name
        associations {
          origins {
            _id
            name
          }
          products {
            _id
            name
          }
        }
      }
    }
  `;

  // Query to retrieve Entity data and associated data for editing
  const [getEntity, { loading, error }] = useLazyQuery(GET_ENTITY_DATA, {
    variables: {
      _id: props.id,
    },
  });

  /**
   * Utility function to execute GraphQL query and return Entity data necessary to construct a graph node
   * @param id Unique Entity identifier
   * @return {Promise<EntityNode>}
   */
  const getEntityData = async (id: string): Promise<EntityNode> => {
    const result = await getEntity({
      variables: {
        _id: id,
      },
    });
    return result.data.entity;
  };

  /**
   * Setup function to retrieve Entity data and generate the initial layout
   */
  const setupGraph = async () => {
    const entity = await getEntityData(props.id);
    if (error) {
      toast({
        title: "Graph Error",
        status: "error",
        description: "Could not setup initial Entity node.",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
    } else {
      const initialNodes = [] as Node[];
      const initialEdges = [] as Edge[];

      // Add the Origins
      if (entity.associations.origins.length > 0) {
        // Add nodes and edges
        for (const origin of entity.associations.origins) {
          // Add node
          initialNodes.push({
            id: origin._id,
            type: "input",
            data: {
              label: createLabel(origin._id, origin.name, false),
            },
            position: { x: 250, y: 0 },
            style: {
              border: "2px solid",
              borderColor: "#9F7AEA", // purple.400
              width: "160px",
              height: "75px",
            },
          });

          // Create edge
          initialEdges.push({
            id: origin._id,
            source: origin._id,
            target: entity._id,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          });
        }
      }

      // Add the Products
      if (entity.associations.products.length > 0) {
        // Add nodes and edges
        for (const product of entity.associations.products) {
          // Add node
          initialNodes.push({
            id: product._id,
            type: "output",
            data: {
              label: createLabel(product._id, product.name, false),
            },
            position: { x: 100, y: 200 },
            style: {
              border: "2px solid",
              borderColor: "#ECC94B", // yellow.400
              width: "160px",
              height: "75px",
            },
          });

          // Create edge
          initialEdges.push({
            id: `edge_${entity._id}_${product._id}`,
            source: entity._id,
            target: product._id,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          });
        }
      }

      // Default assuming origin and products
      let currentType = "default";
      if (
        entity.associations.origins.length > 0 &&
        entity.associations.products.length === 0
      ) {
        currentType = "output";
      } else if (
        entity.associations.origins.length === 0 &&
        entity.associations.products.length > 0
      ) {
        currentType = "input";
      }

      // Add the current Entity to the diagram
      initialNodes.push({
        id: entity._id,
        type: currentType,
        data: {
          label: createLabel(entity._id, entity.name, true),
        },
        style: {
          border: "2px solid",
          borderColor: "#38B2AC", // teal.400
          width: "160px",
          height: "75px",
        },
        position: { x: 250, y: 100 },
      });

      const layout = await generateLayout(initialNodes, initialEdges);
      if (layout.children) {
        layout.children.map((node) => {
          initialNodes.forEach((initialNode) => {
            if (initialNode.id === node.id && node.x && node.y) {
              initialNode.position.x = node.x;
              initialNode.position.y = node.y;
            }
          });
        });
      }

      // Set the Nodes and Edges
      setNodes((nodes) => [...nodes, ...initialNodes]);
      setEdges((edges) => [...edges, ...initialEdges]);
    }
  };

  /**
   * Utility function to determine membership of a Node
   * in the graph
   * @param {string} id Node ID
   * @returns {boolean}
   */
  const containsNode = (id: string): boolean => {
    for (const node of nodes) {
      if (_.isEqual(node.id, id)) {
        return true;
      }
    }
    return false;
  };

  /**
   * Utility function to determine membership of an Edge in the graph
   * @param {string} source Source node
   * @param {string} target Target node
   * @returns {boolean}
   */
  const containsEdge = (source: string, target: string): boolean => {
    for (const edge of edges) {
      if (_.isEqual(edge.source, source) && _.isEqual(edge.target, target)) {
        return true;
      }
    }
    return false;
  };

  const generateLayout = async (layoutNodes: Node[], layoutEdges: Edge[]) => {
    // Set the layout of the graph using ELK
    const elk = new ELK();

    const nodes: ElkNode[] = layoutNodes.map((node) => {
      return {
        id: node.id,
        width: 150,
        height: 75,
      };
    });

    const edges: ElkExtendedEdge[] = layoutEdges.map((edge) => {
      return {
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      };
    });

    const graph = {
      id: "root",
      layoutOptions: {
        "elk.algorithm": "mrtree",
        "nodePlacement.strategy": "INTERACTIVE",
        "spacing.nodeNode": "80",
      },
      children: nodes,
      edges: edges,
    };

    return await elk.layout(graph);
  };

  /**
   * Generate the React component for the graph
   * @param node Information about the graph node
   * @return
   */
  const createLabel = (id: string, name: string, isPrimary: boolean) => {
    return (
      <Flex
        key={`label_${id}`}
        direction={"column"}
        align={"center"}
        w={"100%"}
        gap={"2"}
      >
        <Flex w={"100%"} gap={"2"} direction={"row"} align={"center"}>
          <Icon key={`label_icon_${id}`} name={"entity"} size={"sm"} />
          <Tooltip label={name}>
            <Text
              key={`inner_label_text_${id}`}
              fontWeight={"semibold"}
              textAlign={"left"}
            >
              {_.truncate(name, { length: 16 })}
            </Text>
          </Tooltip>
        </Flex>

        <Flex
          key={`inner_label_${id}`}
          direction={"row"}
          align={"center"}
          justify={"left"}
          w={"100%"}
          py={"1"}
        >
          <Button
            key={`inner_label_view_${id}`}
            aria-label={"View Entity"}
            size={"xs"}
            rightIcon={<Icon name={"a_right"} />}
            isDisabled={isPrimary}
            onClick={() => props.entityNavigateHook(id)}
          >
            View
          </Button>
        </Flex>
      </Flex>
    );
  };

  const onNodeClick = async (_event: React.MouseEvent, node: Node) => {
    if (!_.isEqual(node.id.toString(), props.id.toString())) {
      // If the primary Entity hasn't been clicked, obtain Origin and Product nodes
      // for the selected Entity
      let updatedNodes = _.cloneDeep(nodes);
      let updatedEdges = _.cloneDeep(edges);

      // Update state
      let refreshLayout = false;
      let addedOriginCount = 0;
      let addedProductCount = 0;

      const entity = await getEntityData(node.id);

      // Origins
      if (entity.associations.origins.length > 0) {
        for await (const origin of entity.associations.origins) {
          if (containsNode(origin._id) === false) {
            // Firstly, update the current node type (if required)
            updatedNodes = [
              ...updatedNodes.map((node) => {
                if (_.isEqual(node.id, entity._id)) {
                  if (entity.associations.products.length > 0) {
                    // If Products are specified as well, we need to set it to
                    // "default" type
                    node.type = "default";
                  } else {
                    // If no Products are specified, the Entity only has Origin,
                    // making it "output" type
                    node.type = "output";
                  }
                }
                return node;
              }),
            ];

            // Add node
            updatedNodes = [
              ...updatedNodes,
              {
                id: origin._id,
                type: "input",
                data: {
                  label: createLabel(origin._id, origin.name, false),
                },
                position: { x: 100, y: 200 },
                style: {
                  border: "2px solid",
                  borderColor: "#A0AEC0", // gray.400
                  width: "160px",
                  height: "75px",
                },
              },
            ];

            refreshLayout = true;
            addedOriginCount += 1;
          }

          if (containsEdge(origin._id, node.id) === false) {
            // Create edge
            updatedEdges = [
              ...updatedEdges,
              {
                id: `edge_${origin._id}_${node.id}`,
                source: origin._id,
                target: node.id,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                },
              },
            ];
          }
        }
      }

      // Products
      if (entity.associations.products.length > 0) {
        for (const product of entity.associations.products) {
          if (containsNode(product._id) === false) {
            // Firstly, update the current node type (if required)
            updatedNodes = [
              ...updatedNodes.map((node) => {
                if (_.isEqual(node.id, entity._id)) {
                  if (entity.associations.origins.length > 0) {
                    // If an Origin is specified as well, we need to set it to
                    // "default" type
                    node.type = "default";
                  } else {
                    // If no Origin is specified, the Entity only has Products,
                    // making it "input" type
                    node.type = "input";
                  }
                }
                return node;
              }),
            ];

            // Add node
            updatedNodes = [
              ...updatedNodes,
              {
                id: product._id,
                type: "output",
                data: {
                  label: createLabel(product._id, product.name, false),
                },
                position: { x: 100, y: 200 },
                style: {
                  border: "2px solid",
                  borderColor: "#A0AEC0", // gray.400
                  width: "160px",
                  height: "75px",
                },
              },
            ];

            refreshLayout = true;
            addedProductCount += 1;
          }

          if (containsEdge(node.id, product._id) === false) {
            // Create edge
            updatedEdges = [
              ...updatedEdges,
              {
                id: `edge_${node.id}_${product._id}`,
                source: node.id,
                target: product._id,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                },
              },
            ];
          }
        }
      }

      if (refreshLayout === true) {
        const layout = await generateLayout(updatedNodes, updatedEdges);
        if (layout.children) {
          layout.children.map((node) => {
            updatedNodes.forEach((updatedNode) => {
              if (updatedNode.id === node.id && node.x && node.y) {
                updatedNode.position.x = node.x;
                updatedNode.position.y = node.y;
              }
            });
          });
        }

        if (!toast.isActive("toast-retrieved-associations")) {
          // Generate an update message
          let updateMessage = `Showing ${addedOriginCount} Origin${addedOriginCount > 1 ? "s" : ""} and ${addedProductCount} Product${addedProductCount > 1 && "s"} of Entity "${entity.name}"`;
          if (addedOriginCount > 0 && addedProductCount === 0) {
            updateMessage = `Showing ${addedOriginCount} Origin${addedOriginCount > 1 ? "s" : ""} of Entity "${entity.name}"`;
          } else if (addedProductCount > 0 && addedOriginCount === 0) {
            updateMessage = `Showing ${addedProductCount} Product${addedProductCount > 1 ? "s" : ""} of Entity "${entity.name}"`;
          }
          toast({
            id: "toast-retrieved-associations",
            title: "Retrieved Origins and Products",
            status: "success",
            description: updateMessage,
            duration: 4000,
            position: "bottom-right",
            isClosable: true,
          });
        }
      } else {
        if (!toast.isActive("toast-no-updates")) {
          toast({
            id: "toast-no-updates",
            title: "No Updates",
            status: "info",
            description: `All Entities related to "${entity.name}" are shown`,
            duration: 2000,
            position: "bottom-right",
            isClosable: true,
          });
        }
      }

      // Apply updates
      setNodes(updatedNodes);
      setEdges(updatedEdges);
    }
  };

  // Get the data and setup the initial nodes and edges
  useEffect(() => {
    setupGraph();
  }, []);

  return (
    <Flex
      h={"full"}
      align={"center"}
      justify={"center"}
      direction={"column"}
      w={"100%"}
      p={"0"}
      gap={"2"}
    >
      <Flex
        p={"2"}
        w={"97vw"}
        h={"85vh"}
        rounded={"md"}
        border={"1px"}
        borderColor={"gray.300"}
        filter={loading ? "blur(10px);" : ""}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          attributionPosition={"bottom-right"}
          fitView
        >
          <MiniMap
            nodeStrokeColor={(node: any) => {
              // Check for defined custom colors
              if (node.style?.background) return node.style.background;
              if (node.style?.borderColor) return node.style.borderColor;

              // Default colors
              if (node.type === "input") return "#0041d0";
              if (node.type === "output") return "#ff0072";
              if (node.type === "default") return "#1a192b";

              return "#EEE";
            }}
            nodeColor={(node: any) => {
              if (node.style?.background) return node.style.background;

              return "#fff";
            }}
            nodeBorderRadius={2}
          />
          <Controls />
          <Background color={"#aaa"} gap={16} />
        </ReactFlow>
      </Flex>
    </Flex>
  );
};

export default Graph;
