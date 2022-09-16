// React and Grommet
import React, { useEffect, useState } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  MarkerType,
  useNodesState,
  useEdgesState,
} from "react-flow-renderer";
import { Box, Spinner } from "grommet/components";

// Database and models
import { getData } from "src/lib/database/getData";
import { EntityModel } from "types";

// Custom components
import ErrorLayer from "../ErrorLayer";

const Graph = (props: { id: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

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
        setErrorMessage(value["error"]);
        setIsError(true);
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
    let currentType = "collection";
    if (
      entityData.associations.origin.id === "" &&
      entityData.associations.products.length > 0
    ) {
      // If we have no origin, set to input if we have output
      currentType = "input";
    } else if (
      entityData.associations.origin.id !== "" &&
      entityData.associations.products.length > 0
    ) {
      currentType = "default";
    } else if (
      entityData.associations.origin.id !== "" &&
      entityData.associations.products.length === 0
    ) {
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
    <Box fill background="light-2">
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
        <Box fill align="center" justify="center">
          <Spinner size="large" />
        </Box>
      )}
      {isError && <ErrorLayer message={errorMessage} />}
    </Box>
  );
};

export default Graph;
