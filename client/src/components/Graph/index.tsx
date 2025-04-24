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
import { EntityNode, IRelationship } from "@types";

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

      // Add the relationships
      if (entity.relationships.length > 0) {
        // Add nodes and edges
        for (const relationship of entity.relationships) {
          // Add node
          initialNodes.push({
            id: relationship.target._id,
            type: "default",
            data: {
              label: createLabel(
                relationship.target._id,
                relationship.target.name,
                false,
              ),
            },
            position: { x: 250, y: 0 },
            style: {
              border: "2px solid",
              borderColor: "#A0AEC0", // gray.400
              width: "160px",
              height: "75px",
            },
          });

          // Create edge
          initialEdges.push({
            id: `${relationship.source._id}_${relationship.target._id}`,
            source: relationship.source._id,
            target: relationship.target._id,
            markerEnd:
              relationship.type !== "general"
                ? {
                    type: MarkerType.ArrowClosed,
                  }
                : undefined,
          });
        }
      }

      // Add the current Entity to the diagram
      initialNodes.push({
        id: entity._id,
        type: "default",
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
   * @param {IRelationship} relationship Relationship between two Entities
   * @returns {boolean}
   */
  const containsEdge = (relationship: IRelationship): boolean => {
    for (const edge of edges) {
      if (
        _.isEqual(edge.source, relationship.source._id) &&
        _.isEqual(edge.target, relationship.target._id)
      ) {
        // Check for source -> target edge
        return true;
      } else if (
        relationship.type === "general" &&
        _.isEqual(edge.source, relationship.target._id) &&
        _.isEqual(edge.target, relationship.source._id)
      ) {
        // Check for target -> source edge, general relationship type
        return true;
      } else if (
        _.isEqual(edge.source, relationship.target._id) &&
        _.isEqual(edge.target, relationship.source._id)
      ) {
        // Check for target -> source edge, other relationships
        return true;
      }
    }
    return false;
  };

  /**
   * Generate graph layout using ELK
   * @param layoutNodes Nodes to present in a layout
   * @param layoutEdges Edges to present in a layout
   * @return {Promise<ElkNode>}
   */
  const generateLayout = async (
    layoutNodes: Node[],
    layoutEdges: Edge[],
  ): Promise<ElkNode> => {
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
   * @param {string} id Node identifier, typically Entity identifier
   * @param {string} name Node name, typically Entity name
   * @param {boolean} isPrimary Flag to indiciate the Node is the central Node.
   * There should be only one primary Node per graph
   * @return {React.JSX.Element}
   */
  const createLabel = (
    id: string,
    name: string,
    isPrimary: boolean,
  ): React.JSX.Element => {
    return (
      <Flex
        key={`label_${id}`}
        direction={"column"}
        align={"center"}
        w={"100%"}
        gap={"2"}
      >
        <Flex
          key={`label_inner_container_${id}`}
          w={"100%"}
          gap={"2"}
          direction={"row"}
          align={"center"}
        >
          <Icon key={`label_icon_${id}`} name={"entity"} size={"sm"} />
          <Tooltip key={`tooltip_${id}`} label={name}>
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
            disabled={isPrimary}
            onClick={() => props.entityNavigateHook(id)}
          >
            View
            <Icon name={"a_right"} />
          </Button>
        </Flex>
      </Flex>
    );
  };

  /**
   * Handle clicking a Node on the graph. If the Node is not the primary Node, retrieve and add the related
   * Entities of the clicked Node to the graph.
   * @param _event Click event information
   * @param node Node that was clicked
   */
  const onNodeClick = async (
    _event: React.MouseEvent,
    node: Node,
  ): Promise<void> => {
    if (!_.isEqual(node.id.toString(), props.id.toString())) {
      // If the primary Entity hasn't been clicked, obtain relationships and setup missing nodes and edges
      // for the selected Entity
      let updatedNodes = _.cloneDeep(nodes);
      let updatedEdges = _.cloneDeep(edges);

      // Update state
      let refreshLayout = false;
      let addedRelationshipCount = 0;

      const entity = await getEntityData(node.id);

      if (entity.relationships.length > 0) {
        for await (const relationship of entity.relationships) {
          // Update nodes
          if (containsNode(relationship.target._id) === false) {
            // Add node
            updatedNodes = [
              ...updatedNodes,
              {
                id: relationship.target._id,
                type: "default",
                data: {
                  label: createLabel(
                    relationship.target._id,
                    relationship.target.name,
                    false,
                  ),
                },
                position: { x: 100, y: 200 },
                style: {
                  border: "2px dashed", // Add new Entities with dashed borders
                  borderColor: "#A0AEC0", // gray.400
                  width: "160px",
                  height: "75px",
                },
              },
            ];

            refreshLayout = true;
            addedRelationshipCount += 1;
          }

          // Update edges
          if (containsEdge(relationship) === false) {
            // Create edge
            updatedEdges = [
              ...updatedEdges,
              {
                id: `${relationship.source._id}_${relationship.target._id}`,
                source: relationship.source._id,
                target: relationship.target._id,
                markerEnd:
                  relationship.type !== "general"
                    ? {
                        type: MarkerType.ArrowClosed,
                      }
                    : undefined,
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

        if (!toast.isActive("toast-retrieved-relationships")) {
          // Generate an update message
          toast({
            id: "toast-retrieved-relationships",
            title: "Retrieved relationships",
            status: "success",
            description: `Showing ${addedRelationshipCount} relationship${addedRelationshipCount > 1 ? "s" : ""} for Entity "${entity.name}"`,
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
