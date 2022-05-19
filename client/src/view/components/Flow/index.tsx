import { Box, Spinner } from "grommet";
import React, { useEffect, useState } from "react";
import { getData } from "src/lib/database/getData";
import { SampleModel } from "types";
import ErrorLayer from "../ErrorLayer";

import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  ReactFlowInstance,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'react-flow-renderer';


const Flow = (props: { id: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("An error has occurred.");

  const [sampleData, setSampleData] = useState({} as SampleModel);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowReady, setFlowReady] = useState(false);

  // Get the data and setup the initial nodes and edges
  useEffect(() => {
    const response = getData(`/samples/${props.id}`);

    // Handle the response from the database
    response.then((value) => {
      setSampleData(value);

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
      // Create the flow
      createFlow();
    }
  }, [isLoaded]);

  const onInit = (reactFlowInstance: ReactFlowInstance) => {
    console.info("React Flow instance:", reactFlowInstance);
    console.debug("Sample:", sampleData);
  };

  const createFlow = () => {
    console.debug("Preparing flow...");

    const initialNodes = [];
    const initialEdges = [];

    // Add the origin
    if (sampleData.associations.origin.id !== "") {
      // Add node
      initialNodes.push({
        id: "origin",
        type: "input",
        data: {
          label: (
            <>
              Origin: {sampleData.associations.origin.name}
            </>
          ),
        },
        position: { x: 250, y: 0 },
      });

      // Create edge
      initialEdges.push({
        id: 'origin-sample',
        source: 'origin',
        target: 'current',
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      });
    }

    // Add products
    if (sampleData.associations.products.length > 0) {
      // Add nodes and edges
      for (let i = 0; i < sampleData.associations.products.length; i++) {
        const product = sampleData.associations.products[i];

        // Add node
        initialNodes.push({
          id: `product_${i}`,
          type: "output",
          data: {
            label: (
              <>
                Product: {product.name}
              </>
            ),
          },
          position: { x: (100 * i), y: 200 },
        });

        // Create edge
        initialEdges.push({
          id: `edge_product_${i}`,
          source: "current",
          target: `product_${i}`,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        });
      }
    }

    // Default assuming origin and products
    let currentType = "group";
    if (sampleData.associations.origin.id === "" && sampleData.associations.products.length > 0) {
      // If we have no origin, set to input if we have output
      currentType = "input";
    } else if (sampleData.associations.origin.id !== "" && sampleData.associations.products.length > 0) {
      currentType = "default";
    } else if (sampleData.associations.origin.id !== "" && sampleData.associations.products.length === 0) {
      currentType = "output";
    }

    // Add the current sample to the diagram
    initialNodes.push({
      id: "current",
      type: currentType,
      data: {
        label: (
          <>
            Current: {sampleData.name}
          </>
        ),
      },
      style: {
        color: "#333",
        border: "2px solid green",
        width: 180,
      },
      position: { x: 250, y: 100 },
    });

    // Set the nodes
    setNodes([
      ...nodes,
      ...initialNodes,
    ]);

    // Set the edges
    setEdges([
      ...edges,
      ...initialEdges,
    ]);

    setFlowReady(true);
  }

  return (
    <Box fill background="light-2">
      {flowReady ?
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onInit={onInit}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="top-right"
        >
          <MiniMap
            nodeStrokeColor={(n: any) => {
              if (n.style?.background) return n.style.background;
              if (n.type === 'input') return '#0041d0';
              if (n.type === 'output') return '#ff0072';
              if (n.type === 'default') return '#1a192b';
    
              return '#eee';
            }}
            nodeColor={(n: any) => {
              if (n.style?.background) return n.style.background;
    
              return '#fff';
            }}
            nodeBorderRadius={2}
          />
          <Controls />
          <Background color="#aaa" gap={16} />
        </ReactFlow>
      :
      <Box fill align="center" justify="center">
        <Spinner size="large" />
      </Box>
     }
    {isError && <ErrorLayer message={errorMessage} />}
    </Box>
  );
}

export default Flow;