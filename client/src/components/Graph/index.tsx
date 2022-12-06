// React and Grommet
import { Box, useToast } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  MarkerType,
  useNodesState,
  useEdgesState,
} from "react-flow-renderer";

// Database and models
import { getData } from "src/database/functions";
import { EntityModel } from "types";

// Custom components
import { Loading } from "../Loading";

const Graph = (props: { id: string }) => {
  const toast = useToast();
  const [isLoaded, setIsLoaded] = useState(false);

  const [entityData, setEntityData] = useState({} as EntityModel);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [graphReady, setGraphReady] = useState(false);

  // Get the data and setup the initial nodes and edges
  useEffect(() => {
    const response = getData(`/entities/${props.id}`);

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

  useEffect(() => {
    if (isLoaded === true) {
      // Create the Graph
      createGraph();
    }
  }, [isLoaded]);

  const createGraph = () => {
    const initialNodes = [];
    const initialEdges = [];

    // Add the origin
    if (entityData.associations.origin.id !== "") {
      // Add node
      initialNodes.push({
        id: "origin",
        type: "input",
        data: {
          label: (
            <>
              Origin: {entityData.associations.origin.name}
            </>
          ),
        },
        position: { x: 250, y: 0 },
      });

      // Create edge
      initialEdges.push({
        id: "origin-entitiy",
        source: "origin",
        target: "current",
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      });
    }

    // Add products
    if (entityData.associations.products.length > 0) {
      // Add nodes and edges
      for (let i = 0; i < entityData.associations.products.length; i++) {
        const product = entityData.associations.products[i];

        // Add node
        initialNodes.push({
          id: `product_${i}`,
          type: "output",
          data: {
            label: <>Product: {product.name}</>,
          },
          position: { x: 100, y: 200 },
        });

        // Create edge
        initialEdges.push({
          id: `edge_product_${i}`,
          source: "current",
          target: `product_${i}`,
          animated: true,
        });
      }
    }

    // Default assuming origin and products
    let currentType = "default";
    if (entityData.associations.origin.id === "" && entityData.associations.products.length > 0) {
      currentType = "input";
    } else if (entityData.associations.origin.id !== "" && entityData.associations.products.length === 0) {
      currentType = "output";
    }

    // Add the current Entity to the diagram
    initialNodes.push({
      id: "current",
      type: currentType,
      data: {
        label: <>Current: {entityData.name}</>,
      },
      style: {
        color: "#333",
        border: "2px solid green",
      },
      position: { x: 250, y: 100 },
    });

    // Set the nodes
    setNodes([...nodes, ...initialNodes]);

    // Set the edges
    setEdges([...edges, ...initialEdges]);

    setGraphReady(true);
  };

  return (
    <Box h={"full"}>
      {graphReady ? (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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
