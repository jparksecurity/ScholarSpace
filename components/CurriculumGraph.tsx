'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface CurriculumNode {
  id: string;
  unitTitle: string;
  unitNumber: number;
  courseTitle: string;
  coursePath: string;
  gradeLevel: string;
  subject: string;
}

interface CurriculumEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relationshipType: string;
  description: string;
  fromNode: CurriculumNode;
  toNode: CurriculumNode;
}

interface CurriculumGraphProps {
  nodes: CurriculumNode[];
  edges: CurriculumEdge[];
}

const subjectColors: { [key: string]: string } = {
  math: '#ff6b6b',           // Red (Math - 135)
  science: '#4ecdc4',        // Teal (Science - 58)
  english: '#45b7d1',        // Blue (ELA - 42)
  ela: '#45b7d1',            // Blue (ELA - 42)
  'social studies': '#96ceb4', // Green (Humanities - 27)
  humanities: '#96ceb4',      // Green (Humanities - 27)
  system: '#9b59b6',         // Purple (System - 2)
  default: '#95a5a6',
};

const getNodeColor = (subject: string): string => {
  return subjectColors[subject.toLowerCase()] || subjectColors.default;
};

// Custom circular node component - REMOVED (using default nodes for now)

// Function to create a circular layout
const getCircularLayout = (nodes: Node[], edges: Edge[]) => {
  const centerX = 400;
  const centerY = 400;
  const radius = 300;

  // Separate START and END nodes
  const startNodes = nodes.filter(node => node.id === 'START');
  const endNodes = nodes.filter(node => node.id === 'END');
  const regularNodes = nodes.filter(node => node.id !== 'START' && node.id !== 'END');

  // Group regular nodes by subject for better organization
  const nodesBySubject = regularNodes.reduce((acc, node) => {
    const subject = node.data.subject || 'default';
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(node);
    return acc;
  }, {} as Record<string, Node[]>);

  const subjects = Object.keys(nodesBySubject);
  const layoutedNodes: Node[] = [];

  // Position START node on the left
  if (startNodes.length > 0) {
    layoutedNodes.push({
      ...startNodes[0],
      position: { x: centerX - radius - 100, y: centerY },
      type: 'default', // Changed from 'circular' to 'default'
    });
  }

  // Position END node on the right
  if (endNodes.length > 0) {
    layoutedNodes.push({
      ...endNodes[0],
      position: { x: centerX + radius + 100, y: centerY },
      type: 'default', // Changed from 'circular' to 'default'
    });
  }

  // Position regular nodes in circular layout
  subjects.forEach((subject, subjectIndex) => {
    const subjectNodes = nodesBySubject[subject];
    const subjectAngleStart = (subjectIndex / subjects.length) * 2 * Math.PI;
    const subjectAngleRange = (1 / subjects.length) * 2 * Math.PI * 0.8; // Leave some space between subjects

    subjectNodes.forEach((node, nodeIndex) => {
      const angle = subjectAngleStart + (nodeIndex / subjectNodes.length) * subjectAngleRange;
      const nodeRadius = radius - (nodeIndex % 3) * 40; // Vary radius slightly for visual interest
      
      const x = centerX + Math.cos(angle) * nodeRadius;
      const y = centerY + Math.sin(angle) * nodeRadius;

      layoutedNodes.push({
        ...node,
        position: { x, y },
        type: 'default', // Changed from 'circular' to 'default'
      });
    });
  });

  return { nodes: layoutedNodes, edges };
};

// Node types for React Flow - REMOVED (using default nodes)

export default function CurriculumGraph({ nodes, edges }: CurriculumGraphProps) {
  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState([]);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [highlightEdges, setHighlightEdges] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<CurriculumNode | null>(null);

  // Get unique subjects and grades for filtering
  const subjects = Array.from(new Set(nodes.map(node => node.subject)));
  const grades = Array.from(new Set(nodes.map(node => node.gradeLevel))).sort();

  // Transform data for React Flow
  useEffect(() => {
    // Filter nodes based on selected filters
    const filteredNodes = nodes.filter(node => {
      const subjectMatch = selectedSubject === 'all' || node.subject === selectedSubject;
      const gradeMatch = selectedGrade === 'all' || node.gradeLevel === selectedGrade;
      return subjectMatch && gradeMatch;
    });

    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));

    // Create React Flow nodes as dots - TEMPORARILY using default nodes for debugging
    const flowNodes: Node[] = filteredNodes.map((node, index) => ({
      id: node.id,
      type: 'default', // Changed from 'circular' to 'default' for testing
      position: { x: 0, y: 0 }, // Will be set by layout algorithm
      data: {
        label: `${node.subject[0].toUpperCase()}${node.unitNumber}`, // Shortened label for default nodes
        unitTitle: node.unitTitle,
        courseTitle: node.courseTitle,
        gradeLevel: node.gradeLevel,
        subject: node.subject,
        color: getNodeColor(node.subject),
      },
      style: {
        backgroundColor: getNodeColor(node.subject),
        color: 'white',
        border: '2px solid #333',
        borderRadius: '8px',
        fontSize: '12px',
        width: 60,
        height: 40,
      },
      draggable: true,
    }));

    // FIXED EDGE FILTERING: Only include edges where BOTH nodes exist in our node set
    // This prevents React Flow errors for undefined node references
    const filteredEdges = edges.filter(edge => {
      const fromVisible = filteredNodeIds.has(edge.fromNodeId);
      const toVisible = filteredNodeIds.has(edge.toNodeId);
      
      // Only include edges where BOTH source and target nodes are visible
      // This ensures React Flow can find both ends of every edge
      return fromVisible && toVisible;
    });

    // Create React Flow edges with improved styling
    const flowEdges: Edge[] = filteredEdges.map(edge => {
      // Determine edge color and style based on actual relationship types
      let edgeColor = '#95a5a6'; // default gray
      let strokeWidth = 2;
      let animated = false;
      
             switch (edge.relationshipType) {
         case 'sequential':
           edgeColor = '#3498db'; // blue for sequential
           strokeWidth = highlightEdges ? 6 : 3; // Increased default width
           animated = true;
           break;
         case 'foundational':
           edgeColor = '#e74c3c'; // red for foundational (prerequisite-like)
           strokeWidth = highlightEdges ? 7 : 4; // Increased default width
           animated = false;
           break;
         case 'system':
           edgeColor = '#9b59b6'; // purple for system connections
           strokeWidth = highlightEdges ? 6 : 3; // Increased default width
           animated = false;
           break;
         default:
           edgeColor = '#95a5a6';
           strokeWidth = highlightEdges ? 4 : 2; // Increased default width
       }

      return {
        id: edge.id,
        source: edge.fromNodeId,
        target: edge.toNodeId,
        type: 'straight',
        animated,
                 style: {
           stroke: edgeColor,
           strokeWidth,
           strokeOpacity: highlightEdges ? 0.9 : 0.8, // Even higher when highlighted
           strokeDasharray: edge.relationshipType === 'system' ? '5,5' : undefined, // Dashed for system
           filter: highlightEdges ? `drop-shadow(0 0 6px ${edgeColor})` : undefined, // Glow effect when highlighted
         },
        label: selectedSubject !== 'all' && filteredEdges.length <= 50 ? edge.relationshipType : undefined, // Show labels when filtered
        labelStyle: {
          fontSize: '10px',
          fill: edgeColor,
          fontWeight: 'bold',
        },
        labelBgStyle: {
          fill: 'rgba(255, 255, 255, 0.8)',
          fillOpacity: 0.8,
        },
      };
    });

    // Apply circular layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getCircularLayout(
      flowNodes,
      flowEdges
    );

    setReactFlowNodes(layoutedNodes);
    setReactFlowEdges(layoutedEdges);
  }, [nodes, edges, selectedSubject, selectedGrade, highlightEdges, setReactFlowNodes, setReactFlowEdges]);

  // Handle node clicks to show detailed information
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const nodeData = nodes.find(n => n.id === node.id);
    if (nodeData) {
      setSelectedNode(nodeData);
    }
  }, [nodes]);

  return (
    <div className="w-full h-[800px] border rounded-lg bg-gray-50">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-left"
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
      >
        <Background color="#e5e5e5" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            return node.data?.color || '#95a5a6';
          }}
          position="top-right"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
          }}
        />
        
        {/* Control Panel */}
        <Panel position="top-left">
          <div className="bg-white p-4 rounded-lg shadow-lg space-y-4 max-w-xs">
            <h3 className="font-bold text-lg">Curriculum Network</h3>
            <p className="text-sm text-gray-600">
              Circular layout with dots representing curriculum units
            </p>
            
            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Filter by Subject:</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="all">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject.charAt(0).toUpperCase() + subject.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Filter by Grade:</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="all">All Grades</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
              </select>
            </div>

            {/* Edge Visibility Toggle */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={highlightEdges}
                  onChange={(e) => setHighlightEdges(e.target.checked)}
                  className="rounded"
                />
                <span>Highlight Connections</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Makes edges thicker and adds glow effect
              </p>
            </div>

            {/* Legend */}
            <div>
              <h4 className="font-medium mb-2">Subject Legend:</h4>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {Object.entries(subjectColors).filter(([key]) => key !== 'default').map(([subject, color]) => (
                  <div key={subject} className="flex items-center gap-1">
                    <div 
                      className="w-3 h-3 rounded-full border border-gray-800" 
                      style={{ backgroundColor: color }}
                    ></div>
                    <span className="capitalize">{subject}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Edge Legend */}
            <div>
              <h4 className="font-medium mb-2">Connections:</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-blue-500"></div>
                  <span>Sequential (animated)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-red-500"></div>
                  <span>Foundational</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-purple-600" style={{ borderStyle: 'dashed' }}></div>
                  <span>System (dashed)</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="text-xs text-gray-600 pt-2 border-t">
              <div>Nodes: {reactFlowNodes.length}</div>
              <div>Connections: {reactFlowEdges.length}</div>
              {reactFlowEdges.length === 0 && (
                <div className="text-red-600 mt-1">
                  ⚠️ No edges visible! Check console.
                </div>
              )}
              {selectedSubject !== 'all' && (
                <div className="text-blue-600 mt-1">
                  ℹ️ Cross-subject edges shown
                </div>
              )}
              {reactFlowEdges.length > 0 && (
                <div className="text-green-600 mt-1">
                  ✅ {reactFlowEdges.length} edges loaded
                </div>
              )}
            </div>
          </div>
        </Panel>

        {/* Node Details Panel */}
        {selectedNode && (
          <Panel position="top-right">
            <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-gray-900">Unit Details</h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                  aria-label="Close details"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Unit {selectedNode.unitNumber}: {selectedNode.unitTitle}
                  </h4>
                  <p className="text-sm text-gray-600">{selectedNode.courseTitle}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Subject:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-3 h-3 rounded-full border border-gray-800" 
                        style={{ backgroundColor: getNodeColor(selectedNode.subject) }}
                      ></div>
                      <span className="capitalize">{selectedNode.subject}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Grade Level:</span>
                    <p className="text-gray-900 mt-1">{selectedNode.gradeLevel}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    Click another node to view its details, or × to close
                  </span>
                </div>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
} 