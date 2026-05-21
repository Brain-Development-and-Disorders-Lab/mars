// React
import React, { useEffect, useRef, useState, useCallback } from "react";

// Existing and custom components
import { Button, Flex, Tag, Text } from "@chakra-ui/react";
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
import Tooltip from "@components/Tooltip";
import { toaster } from "@components/Toast";

// Existing and custom types
import { EntityNode } from "@types";

// GraphQL imports
import { gql } from "@apollo/client";
import { useLazyQuery } from "@apollo/client/react";

// Utility functions and libraries
import _ from "lodash";
import ELK, { ElkNode } from "elkjs";

// Variables
import { GLOBAL_STYLES } from "@variables";

// Actual CSS hex values for ReactFlow SVG — Chakra tokens don't apply in style objects
const GRAPH_EDGE_COLORS: Record<string, string> = {
  parent: "#DD6B20",
  child: "#D69E2E",
  general: "#00B5D8",
};

const NODE_W = 185;
const NODE_H = 85;

const RelationshipsGraph = (props: { id: string; entityNavigateHook: (id: string) => void }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const GET_ENTITY_DATA = gql`
    query GetEntityData($_id: String) {
      entity(_id: $_id) {
        _id
        name
        relationships {
          target {
            _id
            name
          }
          source {
            _id
            name
          }
          type
        }
      }
    }
  `;

  const [getEntity] = useLazyQuery<{ entity: EntityNode }>(GET_ENTITY_DATA);

  const getEntityData = async (id: string): Promise<EntityNode> => {
    const result = await getEntity({ variables: { _id: id } });
    if (!result.data?.entity) throw new Error(`Unable to retrieve Entity data for ID: ${id}`);
    return result.data.entity;
  };

  /** Label rendered inside each graph node */
  const createLabel = (id: string, name: string, isPrimary: boolean, relCount?: number): React.JSX.Element => (
    <Flex direction={"column"} w={"100%"} h={"100%"} justify={"center"} gap={"1.5"} px={"1"}>
      <Flex align={"center"} gap={"1.5"} w={"100%"}>
        <Icon name={"entity"} size={"sm"} color={GLOBAL_STYLES.entity.iconColor} />
        <Tooltip content={name} disabled={name.length < 22}>
          <Text fontWeight={"semibold"} fontSize={"xs"} truncate>
            {_.truncate(name, { length: 22 })}
          </Text>
        </Tooltip>
      </Flex>
      <Flex align={"center"} w={"100%"} gap={"1"}>
        {relCount !== undefined && (
          <Text fontSize={"xs"} color={"gray.500"}>
            {relCount} relationship{relCount !== 1 ? "s" : ""}
          </Text>
        )}
        {isPrimary ? (
          <Tag.Root size={"sm"} colorPalette={"teal"} ml={"auto"} flexShrink={0}>
            <Tag.Label>Current</Tag.Label>
          </Tag.Root>
        ) : (
          <Button
            size={"2xs"}
            ml={"auto"}
            flexShrink={0}
            onClick={(e) => {
              e.stopPropagation();
              props.entityNavigateHook(id);
            }}
          >
            View <Icon name={"a_right"} size={"xs"} />
          </Button>
        )}
      </Flex>
    </Flex>
  );

  /** Build a ReactFlow node */
  const buildNode = (id: string, name: string, isPrimary: boolean, relCount?: number, dashed = false): Node => ({
    id,
    type: "default",
    data: { label: createLabel(id, name, isPrimary, relCount) },
    position: { x: 0, y: 0 },
    style: {
      border: `2px ${dashed ? "dashed" : "solid"}`,
      borderColor: isPrimary ? "#38B2AC" : "#A0AEC0",
      backgroundColor: isPrimary ? "#E6FFFA" : "#FFFFFF",
      width: `${NODE_W}px`,
      height: `${NODE_H}px`,
      borderRadius: "6px",
      padding: "4px",
    },
  });

  /** Build a ReactFlow edge with type-colored stroke and arrowhead */
  const buildEdge = (source: string, target: string, type: string): Edge => ({
    id: `${source}_${target}`,
    source,
    target,
    markerEnd: type !== "general" ? { type: MarkerType.ArrowClosed, color: GRAPH_EDGE_COLORS[type] } : undefined,
    style: { stroke: GRAPH_EDGE_COLORS[type], strokeWidth: 2 },
  });

  const generateLayout = async (layoutNodes: Node[], layoutEdges: Edge[]): Promise<ElkNode> => {
    const elk = new ELK();
    return elk.layout({
      id: "root",
      layoutOptions: {
        "elk.algorithm": "mrtree",
        "nodePlacement.strategy": "INTERACTIVE",
        "spacing.nodeNode": "80",
      },
      children: layoutNodes.map((n) => ({ id: n.id, width: NODE_W, height: NODE_H })),
      edges: layoutEdges.map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] })),
    });
  };

  const applyLayout = (layout: ElkNode, nodeList: Node[]): Node[] =>
    nodeList.map((node) => {
      const pos = layout.children?.find((n) => n.id === node.id);
      return pos?.x !== undefined && pos?.y !== undefined ? { ...node, position: { x: pos.x, y: pos.y } } : node;
    });

  const setupGraph = async () => {
    try {
      const entity = await getEntityData(props.id);

      // Use a Map to deduplicate nodes when multiple relationships reference the same target
      const nodesMap = new Map<string, Node>();
      nodesMap.set(props.id, buildNode(props.id, entity.name, true, entity.relationships.length));
      for (const rel of entity.relationships) {
        if (!nodesMap.has(rel.target._id)) {
          nodesMap.set(rel.target._id, buildNode(rel.target._id, rel.target.name, false));
        }
      }

      const initialNodes = Array.from(nodesMap.values());
      const initialEdges = entity.relationships.map((rel) => buildEdge(rel.source._id, rel.target._id, rel.type));

      const layout = await generateLayout(initialNodes, initialEdges);
      setNodes(applyLayout(layout, initialNodes));
      setEdges(initialEdges);
    } catch {
      toaster.create({
        title: "Graph Error",
        type: "error",
        description: "Could not set up the relationship graph.",
        duration: 4000,
        closable: true,
      });
    }
  };

  const onNodeClick = async (_event: React.MouseEvent, node: Node): Promise<void> => {
    if (node.id === props.id) return;

    const entity = await getEntityData(node.id);
    let updatedNodes = _.cloneDeep(nodes);
    let updatedEdges = _.cloneDeep(edges);

    // Reveal relationship count on the clicked node now that we have its data
    updatedNodes = updatedNodes.map((n) =>
      n.id === node.id
        ? { ...n, data: { label: createLabel(node.id, entity.name, false, entity.relationships.length) } }
        : n,
    );

    let addedCount = 0;
    for (const rel of entity.relationships) {
      if (!updatedNodes.some((n) => n.id === rel.target._id)) {
        updatedNodes = [...updatedNodes, buildNode(rel.target._id, rel.target.name, false, undefined, true)];
        addedCount++;
      }
      const edgeExists = updatedEdges.some(
        (e) =>
          (e.source === rel.source._id && e.target === rel.target._id) ||
          (e.source === rel.target._id && e.target === rel.source._id),
      );
      if (!edgeExists) {
        updatedEdges = [...updatedEdges, buildEdge(rel.source._id, rel.target._id, rel.type)];
      }
    }

    if (addedCount > 0) {
      const layout = await generateLayout(updatedNodes, updatedEdges);
      updatedNodes = applyLayout(layout, updatedNodes);
      if (!toaster.isVisible("toast-retrieved-relationships")) {
        toaster.create({
          id: "toast-retrieved-relationships",
          title: "Retrieved relationships",
          type: "success",
          description: `Showing ${addedCount} new relationship${addedCount !== 1 ? "s" : ""} for "${entity.name}"`,
          duration: 4000,
          closable: true,
        });
      }
    } else if (!toaster.isVisible("toast-no-updates")) {
      toaster.create({
        id: "toast-no-updates",
        title: "No Updates",
        type: "info",
        description: `All related Entities for "${entity.name}" are shown`,
        duration: 2000,
        closable: true,
      });
    }

    setNodes(updatedNodes);
    setEdges(updatedEdges);
  };

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [updateDimensions]);

  useEffect(() => {
    setupGraph();
  }, []);

  return (
    <Flex h={"100%"} align={"center"} justify={"center"} direction={"column"} w={"100%"} p={"1"}>
      <Flex
        ref={containerRef}
        p={"1"}
        w={"100%"}
        h={"100%"}
        rounded={"md"}
        border={GLOBAL_STYLES.border.style}
        borderColor={GLOBAL_STYLES.border.color}
        overflow={"hidden"}
        bg={"white"}
      >
        {dimensions.width > 0 && dimensions.height > 0 && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            attributionPosition={"bottom-right"}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            style={{ width: dimensions.width, height: dimensions.height, borderRadius: "6px" }}
          >
            <MiniMap
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              nodeStrokeColor={(node: any) => node.style?.borderColor || "#A0AEC0"}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              nodeColor={(node: any) => node.style?.backgroundColor || "#FFFFFF"}
              nodeBorderRadius={4}
            />
            <Controls />
            <Background color={"#aaa"} gap={16} />
          </ReactFlow>
        )}
      </Flex>
    </Flex>
  );
};

export default RelationshipsGraph;
