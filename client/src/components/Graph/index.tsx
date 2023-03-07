import React, { useEffect, useState } from "react";
import { Box, useToast } from "@chakra-ui/react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  MarkerType,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from "react-flow-renderer";
import { Loading } from "@components/Loading";

// Utility libraries
import _ from "underscore";
// import consola from "consola";
import ELK, { ElkExtendedEdge, ElkNode } from "elkjs";

// Database and models
import { getData } from "@database/functions";
import { EntityModel } from "@types";

const Graph = (props: { id: string }) => {
  const toast = useToast();
  const [isLoaded, setIsLoaded] = useState(false);

  const [entityData, setEntityData] = useState({} as EntityModel);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [graphReady, setGraphReady] = useState(false);

  const getEntityData = async (id: string): Promise<EntityModel> => {
    const value = await getData(`/entities/${id}`);
    if (value["error"] !== undefined) {
      toast({
        title: "Database Error",
        description: value["error"],
        status: "error",
        duration: 4000,
        position: "bottom-right",
        isClosable: true,
      });
      throw new Error("Database Error");
    } else {
      return value;
    }
  };

  /**
   * Utility function to determine membership of a Node
   * in the graph
   * @param {string} id Node ID
   * @return {boolean}
   */
  const containsNode = (id: string): boolean => {
    for (let node of nodes) {
      if (_.isEqual(node.id, id)) {
        return true;
      }
    }
    return false;
  };

  const generateLayout = (layoutNodes: Node[], layoutEdges: Edge[]) => {
    // Set the layout of the graph using ELK
    const elk = new ELK();

    const nodes: ElkNode[] = layoutNodes.map((node) => {
      return {
        id: node.id,
        width: 150,
        height: 45,
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
        "spacing.nodeNodeBetweenLayers": "40"
      },
      children: nodes,
      edges: edges,
    };

    return elk.layout(graph);
  };

  const createGraph = () => {
    const initialNodes = [] as Node[];
    const initialEdges = [] as Edge[];

    // Add the Origins
    if (entityData.associations.origins.length > 0) {
      // Add nodes and edges
      for (let origin of entityData.associations.origins) {
        // Add node
        initialNodes.push({
          id: origin.id,
          type: "input",
          data: {
            label: <>{origin.name}</>,
          },
          position: { x: 250, y: 0 },
        });

        // Create edge
        initialEdges.push({
          id: origin.id,
          source: origin.id,
          target: entityData._id,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        });
      }
    }

    // Add products
    if (entityData.associations.products.length > 0) {
      // Add nodes and edges
      for (let product of entityData.associations.products) {
        // Add node
        initialNodes.push({
          id: product.id,
          type: "output",
          data: {
            label: <>{product.name}</>,
          },
          position: { x: 100, y: 200 },
        });

        // Create edge
        initialEdges.push({
          id: `edge_${entityData._id}_${product.id}`,
          source: entityData._id,
          target: product.id,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        });
      }
    }

    // Default assuming origin and products
    let currentType = "default";
    if (
      entityData.associations.origins.length > 0 &&
      entityData.associations.products.length === 0
    ) {
      currentType = "output";
    } else if (
      entityData.associations.origins.length === 0 &&
      entityData.associations.products.length > 0
    ) {
      currentType = "input";
    }

    // Add the current Entity to the diagram
    initialNodes.push({
      id: entityData._id,
      type: currentType,
      data: {
        label: <>{entityData.name}</>,
      },
      style: {
        color: "#333",
        border: "2px solid green",
      },
      position: { x: 250, y: 100 },
    });

    generateLayout(initialNodes, initialEdges).then((result) => {
      // Apply positioning information to Nodes
      if (result.children) {
        result.children.map((node) => {
          initialNodes.forEach((initialNode) => {
            if (initialNode.id === node.id && node.x && node.y) {
              initialNode.position.x = node.x;
              initialNode.position.y = node.y;
            }
          });
        });
      }

      // Set the Nodes and Edges
      setNodes([...nodes, ...initialNodes]);
      setEdges([...edges, ...initialEdges]);

      setGraphReady(true);
    });
  };

  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    if (!_.isEqual(node.id.toString(), entityData._id.toString())) {
      // If the primary Entity hasn't been clicked, obtain Origin and Product nodes
      // for the selected Entity
      let updatedNodes = nodes;
      let updatedEdges = edges;

      getEntityData(node.id).then((entity) => {
        // Origins
        if (entity.associations.origins.length > 0) {
          for (let origin of entity.associations.origins) {
            if (containsNode(origin.id) === false) {
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
                  id: origin.id,
                  type: "input",
                  data: {
                    label: <>{origin.name}</>,
                  },
                  position: { x: 100, y: 200 },
                },
              ];

              // Create edge
              updatedEdges = [
                ...updatedEdges,
                {
                  id: `edge_${origin.id}_${node.id}`,
                  source: origin.id,
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
          for (let product of entity.associations.products) {
            if (containsNode(product.id) === false) {
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
                  id: product.id,
                  type: "output",
                  data: {
                    label: <>{product.name}</>,
                  },
                  position: { x: 100, y: 200 },
                },
              ];

              // Create edge
              updatedEdges = [
                ...updatedEdges,
                {
                  id: `edge_${node.id}_${product.id}`,
                  source: node.id,
                  target: product.id,
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                  },
                },
              ];
            }
          }
        }

        // Re-generate a layout
        generateLayout(updatedNodes, updatedEdges).then((result) => {
          // Apply positioning information to Nodes
          if (result.children) {
            result.children.map((node) => {
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
        });
      });
    }
  };

  // Get the data and setup the initial nodes and edges
  useEffect(() => {
    getEntityData(props.id).then((entity) => {
      setEntityData(entity);
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded === true) {
      // Create the Graph
      createGraph();
    }
  }, [isLoaded]);

  return (
    <Box h={"full"}>
      {graphReady ? (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          attributionPosition="bottom-right"
          fitView
        >
          <MiniMap
            nodeStrokeColor={(n: any) => {
              if (n.style?.background) return n.style.background;
              if (n.type === "input") return "#0041d0";
              if (n.type === "output") return "#ff0072";
              if (n.type === "default") return "#1a192b";

              return "#eee";
            }}
            nodeColor={(n: any) => {
              if (n.style?.background) return n.style.background;

              return "#fff";
            }}
            nodeBorderRadius={2}
          />
          <Controls />
          <Background color="#aaa" gap={16} />
        </ReactFlow>
      ) : (
        <Loading />
      )}
    </Box>
  );
};

export default Graph;
