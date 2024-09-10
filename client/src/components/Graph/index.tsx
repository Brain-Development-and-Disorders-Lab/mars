// React
import React, { useEffect } from "react";

// Existing and custom components
import { Flex, Link, Text, useToast } from "@chakra-ui/react";
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
import Loading from "@components/Loading";
import Error from "@components/Error";
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
              label: generateLabel({ id: origin._id, name: origin.name }),
            },
            position: { x: 250, y: 0 },
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

      // Add products
      if (entity.associations.products.length > 0) {
        // Add nodes and edges
        for (const product of entity.associations.products) {
          // Add node
          initialNodes.push({
            id: product._id,
            type: "output",
            data: {
              label: generateLabel({ id: product._id, name: product.name }),
            },
            position: { x: 100, y: 200 },
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
          label: generateLabel({ id: entity._id, name: entity.name }),
        },
        style: {
          color: "#333",
          border: "2px solid green",
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
   * @param {string} id Edge ID
   * @returns {boolean}
   */
  const containsEdge = (id: string): boolean => {
    for (const edge of edges) {
      if (_.isEqual(edge.id, id)) {
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
        width: 120,
        height: 80,
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
        "elk.algorithm": "layered",
        "elk.direction": "DOWN",
        "nodePlacement.strategy": "SIMPLE",
        "spacing.nodeNodeBetweenLayers": "40",
        "spacing.nodeNode": "40",
      },
      children: nodes,
      edges: edges,
    };

    return await elk.layout(graph);
  };

  const generateLabel = (node: { id: string; name: string }) => {
    return (
      <Flex direction={"row"} align={"center"} gap={4}>
        <Icon name={"entity"} size={"lg"} />
        <Flex direction={"column"} align={"baseline"}>
          <Text as={"b"}>Entity</Text>
          <Link onClick={() => props.entityNavigateHook(node.id)}>
            {node.name}
          </Link>
        </Flex>
      </Flex>
    );
  };

  const onNodeClick = async (_event: React.MouseEvent, node: Node) => {
    if (!_.isEqual(node.id.toString(), props.id.toString())) {
      // If the primary Entity hasn't been clicked, obtain Origin and Product nodes
      // for the selected Entity
      let updatedNodes = nodes;
      let updatedEdges = edges;

      const entity = await getEntityData(node.id);
      // Origins
      if (entity.associations.origins.length > 0) {
        for (const origin of entity.associations.origins) {
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
                  label: generateLabel({ id: origin._id, name: origin.name }),
                },
                position: { x: 100, y: 200 },
              },
            ];
          }

          if (containsEdge(`edge_${origin._id}_${node.id}`) === false) {
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
                  label: generateLabel({
                    id: product._id,
                    name: product.name,
                  }),
                },
                position: { x: 100, y: 200 },
              },
            ];
          }

          if (containsEdge(`edge_${node.id}_${product._id}`) === false) {
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
      // Apply updates
      setNodes(updatedNodes);
      setEdges(updatedEdges);
    }
  };

  // Get the data and setup the initial nodes and edges
  useEffect(() => {
    setupGraph();
  }, [loading]);

  return (
    <Flex h={"full"} align={"center"} justify={"center"}>
      {error && <Error />}
      {loading && <Loading />}

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
            if (node.style?.background) return node.style.background;
            if (node.type === "input") return "#0041d0";
            if (node.type === "output") return "#ff0072";
            if (node.type === "default") return "#1a192b";

            return "#eee";
          }}
          nodeColor={(node: any) => {
            if (node.style?.background) return node.style.background;

            return "#fff";
          }}
          nodeBorderRadius={2}
        />
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </Flex>
  );
};

export default Graph;
