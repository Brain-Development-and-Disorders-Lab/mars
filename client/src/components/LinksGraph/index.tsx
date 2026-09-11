// React
import React, { useEffect, useRef, useState, useCallback } from "react";

// Existing and custom components
import { Flex, useToken } from "@chakra-ui/react";
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
import LinksGraphNode from "@components/LinksGraphNode";
import { toaster } from "@components/Toast";

// Existing and custom types
import { EntityNode, ILink, LinksGraphNodeInput } from "@types";

// GraphQL imports
import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";

// Utility functions and libraries
import _ from "lodash";
import ELK, { ElkNode } from "elkjs";

// Variables
import { STYLES } from "@variables";

const NODE_W = 220;
const NODE_H = 148;

const LinksGraph = (props: { id: string; entityNavigateHook: (id: string) => void }) => {
  const client = useApolloClient();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Resolve Chakra color tokens to raw CSS values for ReactFlow's inline styles
  const [edgeParent, edgeChild, edgeGeneral, nodeSecondary, nodeCanvasBg, canvasDot] = useToken("colors", [
    "link.parent",
    "link.child",
    "link.general",
    "graph.secondary",
    "surface.canvas",
    "chart.canvasDot",
  ]);
  const edgeColors: Record<string, string> = { parent: edgeParent, child: edgeChild, general: edgeGeneral };

  const GET_ENTITY_DATA = gql`
    query GetEntityData($_id: String) {
      entity(_id: $_id) {
        _id
        name
        owner
        created
        archived
        projects
        attributes {
          _id
        }
        links {
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

  const getEntityData = async (id: string): Promise<EntityNode> => {
    const result = await client.query<{ entity: EntityNode }>({ query: GET_ENTITY_DATA, variables: { _id: id } });
    if (!result.data?.entity) throw new Error(`Unable to retrieve Entity data for ID: ${id}`);
    return result.data.entity;
  };

  /** Map a fetched Entity to the details its graph node needs to render */
  const toNodeInput = (entity: EntityNode, isPrimary: boolean): LinksGraphNodeInput => ({
    id: entity._id,
    name: entity.name,
    isPrimary,
    linkCount: entity.links.length,
    owner: entity.owner,
    created: entity.created,
    projectCount: entity.projects?.length,
    attributeCount: entity.attributes?.length,
    archived: entity.archived,
  });

  /** Label rendered inside each graph node */
  const buildLabel = (input: LinksGraphNodeInput): React.JSX.Element => (
    <LinksGraphNode {...input} onView={props.entityNavigateHook} />
  );

  /** Build a ReactFlow node */
  const buildNode = (input: LinksGraphNodeInput): Node => ({
    id: input.id,
    type: "default",
    data: { label: buildLabel(input) },
    position: { x: 0, y: 0 },
    style: {
      border: "2px solid",
      borderColor: nodeSecondary,
      backgroundColor: nodeCanvasBg,
      width: `${NODE_W}px`,
      height: `${NODE_H}px`,
      borderRadius: "6px",
      padding: "4px",
    },
  });

  /** Build a ReactFlow edge, flipping "child" links so every edge flows parent to child */
  const buildEdge = (source: string, target: string, type: string): Edge => {
    const [from, to] = type === "child" ? [target, source] : [source, target];
    return {
      id: `${source}_${target}`,
      source: from,
      target: to,
      label: type === "general" ? "Related to" : "Parent of",
      labelStyle: { fill: edgeColors[type], fontWeight: 600, fontSize: 10 },
      labelBgStyle: { fill: nodeCanvasBg, fillOpacity: 0.9 },
      labelBgPadding: [4, 2],
      labelBgBorderRadius: 4,
      markerEnd: type !== "general" ? { type: MarkerType.ArrowClosed, color: edgeColors[type] } : undefined,
      style: { stroke: edgeColors[type], strokeWidth: 2 },
    };
  };

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

  /** Fetch full details for every Entity a link points to that isn't already known */
  const fetchNewTargets = (links: ILink[], knownIds: string[]): Promise<EntityNode[]> => {
    const newIds = _.uniq(links.map((link) => link.target._id)).filter((id) => !knownIds.includes(id));
    return Promise.all(newIds.map((id) => getEntityData(id)));
  };

  const setupGraph = async () => {
    try {
      const entity = await getEntityData(props.id);
      const targetEntities = await fetchNewTargets(entity.links, []);

      const nodesMap = new Map<string, Node>();
      nodesMap.set(props.id, buildNode(toNodeInput(entity, true)));
      for (const targetEntity of targetEntities) {
        nodesMap.set(targetEntity._id, buildNode(toNodeInput(targetEntity, false)));
      }

      const initialNodes = Array.from(nodesMap.values());
      const initialEdges = entity.links.map((link) => buildEdge(link.source._id, link.target._id, link.type));

      const layout = await generateLayout(initialNodes, initialEdges);
      setNodes(applyLayout(layout, initialNodes));
      setEdges(initialEdges);
    } catch {
      toaster.create({
        title: "Graph Error",
        type: "error",
        description: "Could not set up the link graph.",
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

    // Reveal full details on the clicked node now that we have its data
    updatedNodes = updatedNodes.map((n) =>
      n.id === node.id ? { ...n, data: { label: buildLabel(toNodeInput(entity, false)) } } : n,
    );

    const newTargetEntities = await fetchNewTargets(
      entity.links,
      updatedNodes.map((n) => n.id),
    );
    for (const targetEntity of newTargetEntities) {
      updatedNodes = [...updatedNodes, buildNode(toNodeInput(targetEntity, false))];
    }
    const addedCount = newTargetEntities.length;

    for (const link of entity.links) {
      const edgeExists = updatedEdges.some(
        (e) =>
          (e.source === link.source._id && e.target === link.target._id) ||
          (e.source === link.target._id && e.target === link.source._id),
      );
      if (!edgeExists) {
        updatedEdges = [...updatedEdges, buildEdge(link.source._id, link.target._id, link.type)];
      }
    }

    if (addedCount > 0) {
      const layout = await generateLayout(updatedNodes, updatedEdges);
      updatedNodes = applyLayout(layout, updatedNodes);
      if (!toaster.isVisible("toast-retrieved-links")) {
        toaster.create({
          id: "toast-retrieved-links",
          title: "Retrieved links",
          type: "success",
          description: `Showing ${addedCount} new link${addedCount !== 1 ? "s" : ""} for "${entity.name}"`,
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
        border={STYLES.border.style}
        borderColor={STYLES.border.color}
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
            nodesConnectable={false}
            edgesFocusable={false}
            edgesUpdatable={false}
            attributionPosition={"bottom-right"}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            style={{ width: dimensions.width, height: dimensions.height, borderRadius: "6px" }}
          >
            <MiniMap
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              nodeStrokeColor={(node: any) => node.style?.borderColor || nodeSecondary}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              nodeColor={(node: any) => node.style?.backgroundColor || nodeCanvasBg}
              nodeBorderRadius={4}
            />
            <Controls />
            <Background color={canvasDot} gap={16} />
          </ReactFlow>
        )}
      </Flex>
    </Flex>
  );
};

export default LinksGraph;
