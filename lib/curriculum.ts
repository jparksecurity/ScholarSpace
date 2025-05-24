import curriculumData from '@/curriculum_prerequisite_network.json';
import { ProgressLogWithNode } from '@/hooks/useStudents';

export interface CurriculumNode {
  id: string;
  unitTitle: string;
  unitNumber: number;
  courseTitle: string;
  coursePath: string;
  gradeLevel: string;
  subject: string;
}

export interface SubjectInfo {
  subject: string;
  subjectName: string;
  description: string;
  startingNodes: CurriculumNode[]; // First units in each course for this subject
}

export interface CourseInfo {
  id: string;
  title: string;
  gradeLevel: string;
  path: string;
  units: CurriculumNode[];
}

// Type for the raw JSON data (with snake_case properties)
interface RawCurriculumNode {
  id: string;
  unit_title: string;
  unit_number: number;
  course_title: string;
  course_path: string;
  grade_level: string;
  subject: string;
}

// Type the imported JSON data
const rawCurriculum = curriculumData as {
  nodes: RawCurriculumNode[];
  edges: Array<{
    from: string;
    to: string;
    relationship_type: string;
    description: string;
  }>;
};

// Transform raw data to match our interface
const curriculum = {
  nodes: rawCurriculum.nodes.map(node => ({
    id: node.id,
    unitTitle: node.unit_title,
    unitNumber: node.unit_number,
    courseTitle: node.course_title,
    coursePath: node.course_path,
    gradeLevel: node.grade_level,
    subject: node.subject,
  })),
  edges: rawCurriculum.edges,
};

// Utility functions for handling enum/curriculum mapping
export function subjectEnumToCurriculum(enumValue: string): string {
  return enumValue.toLowerCase();
}

export function subjectCurriculumToEnum(curriculumValue: string): string {
  return curriculumValue.toUpperCase();
}

export function isValidSubjectEnum(subject: string): boolean {
  const validEnums = ['MATH', 'ELA', 'SCIENCE', 'HUMANITIES'];
  return validEnums.includes(subject.toUpperCase());
}

export function getUniqueSubjects(): string[] {
  const subjects = new Set(
    curriculum.nodes
      .filter(node => node.subject !== 'system') // Exclude system nodes
      .map(node => node.subject)
  );
  return Array.from(subjects).sort();
}

export function getSubjectInfo(): SubjectInfo[] {
  const subjects = getUniqueSubjects();
  
  return subjects.map(subject => {
    const courses = getCoursesBySubject(subject);
    
    // Get starting nodes (first unit in each course)
    const startingNodes = courses.map(course => course.units[0]).filter(Boolean);
    
    return {
      subject: subjectCurriculumToEnum(subject), // Return enum format
      subjectName: getSubjectDisplayName(subject),
      description: getSubjectDescription(subject),
      startingNodes,
    };
  });
}

function getSubjectDisplayName(subject: string): string {
  const normalizedSubject = subject.toLowerCase();
  const displayNames: Record<string, string> = {
    'math': 'Mathematics',
    'ela': 'English Language Arts',
    'science': 'Science',
    'humanities': 'History & Social Studies'
  };
  return displayNames[normalizedSubject] || subject.charAt(0).toUpperCase() + subject.slice(1);
}

function getSubjectDescription(subject: string): string {
  const normalizedSubject = subject.toLowerCase();
  const descriptions: Record<string, string> = {
    'math': 'Number sense, algebra, geometry, and mathematical reasoning',
    'ela': 'Reading comprehension, vocabulary, and language skills',
    'science': 'Biology, chemistry, physics, and earth science concepts',
    'humanities': 'History, government, civics, and social studies'
  };
  return descriptions[normalizedSubject] || `Core concepts and skills in ${subject}`;
}

export function getCoursesBySubject(subject: string): CourseInfo[] {
  // Normalize to lowercase for curriculum lookup
  const normalizedSubject = subject.toLowerCase();
  const subjectNodes = curriculum.nodes.filter(node => node.subject === normalizedSubject);
  
  // Group by course path
  const courseGroups = subjectNodes.reduce((acc, node) => {
    const key = node.coursePath;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(node);
    return acc;
  }, {} as Record<string, CurriculumNode[]>);

  return Object.entries(courseGroups).map(([coursePath, nodes]) => {
    // Sort units by unit number
    const sortedUnits = nodes.sort((a, b) => a.unitNumber - b.unitNumber);
    const firstUnit = sortedUnits[0];
    
    return {
      id: coursePath,
      title: firstUnit.courseTitle,
      gradeLevel: firstUnit.gradeLevel,
      path: coursePath,
      units: sortedUnits,
    };
  }).sort((a, b) => {
    // Sort courses by grade level (roughly)
    const gradeOrder = ['K-1', '2', '3', '4', '5', '6', '6-8', '7', '8', '9', '9-12', '10', '11', '12'];
    const aIndex = gradeOrder.indexOf(a.gradeLevel);
    const bIndex = gradeOrder.indexOf(b.gradeLevel);
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    return a.gradeLevel.localeCompare(b.gradeLevel);
  });
}

export function getAllCourses(): CourseInfo[] {
  const subjects = getUniqueSubjects();
  return subjects.flatMap(subject => getCoursesBySubject(subject));
}

export function getNodeById(nodeId: string): CurriculumNode | undefined {
  return curriculum.nodes.find(node => node.id === nodeId);
}

export function getNodesBySubject(subject: string): CurriculumNode[] {
  // Normalize to lowercase for curriculum lookup
  const normalizedSubject = subject.toLowerCase();
  return curriculum.nodes.filter(node => node.subject === normalizedSubject);
}

// Get the next node in the sequence for a given node
export function getNextNode(nodeId: string): CurriculumNode | null {
  const edges = curriculum.edges.filter(edge => 
    edge.from === nodeId && edge.relationship_type === 'sequential'
  );
  
  if (edges.length === 0) {
    // Check for foundational relationships to next course
    const foundationalEdges = curriculum.edges.filter(edge => 
      edge.from === nodeId && edge.relationship_type === 'foundational'
    );
    
    if (foundationalEdges.length > 0) {
      const nextNodeId = foundationalEdges[0].to;
      return getNodeById(nextNodeId) || null;
    }
    
    return null;
  }
  
  const nextNodeId = edges[0].to;
  return getNodeById(nextNodeId) || null;
}

// Get the previous node in the sequence for a given node
export function getPreviousNode(nodeId: string): CurriculumNode | null {
  const edges = curriculum.edges.filter(edge => 
    edge.to === nodeId && edge.relationship_type === 'sequential'
  );
  
  if (edges.length === 0) {
    // Check for foundational relationships from previous course
    const foundationalEdges = curriculum.edges.filter(edge => 
      edge.to === nodeId && edge.relationship_type === 'foundational'
    );
    
    if (foundationalEdges.length > 0) {
      const prevNodeId = foundationalEdges[0].from;
      return getNodeById(prevNodeId) || null;
    }
    
    return null;
  }
  
  const prevNodeId = edges[0].from;
  return getNodeById(prevNodeId) || null;
}

// Get all nodes in a subject that come before a given node
export function getNodesBeforeInSubject(nodeId: string, subject: string): CurriculumNode[] {
  const completedNodes: CurriculumNode[] = [];
  
  // Start from the node BEFORE the given node
  const startingNode = getNodeById(nodeId);
  if (!startingNode) return [];
  
  let currentNode = getPreviousNode(startingNode.id);
  
  while (currentNode) {
    // Check if this node is in the same subject
    if (currentNode.subject === subject.toLowerCase()) {
      completedNodes.unshift(currentNode); // Add at beginning to maintain order
      currentNode = getPreviousNode(currentNode.id);
    } else {
      break;
    }
  }
  
  return completedNodes;
}

// Get progress percentage for a subject based on current node
export function getSubjectProgressPercentage(currentNodeId: string | null, subject: string): number {
  const allSubjectNodes = getNodesBySubject(subject);
  
  if (!currentNodeId || allSubjectNodes.length === 0) {
    return 0;
  }
  
  // Find the position of the current node in the subject
  const currentNodeIndex = allSubjectNodes.findIndex(node => node.id === currentNodeId);
  if (currentNodeIndex === -1) {
    return 0;
  }
  
  // Progress is the number of nodes before the current node
  return Math.round((currentNodeIndex / allSubjectNodes.length) * 100);
}

// NEW: Helper functions for ProgressLog-based progress tracking

interface SubjectProgressSummary {
  subject: string;
  subjectName: string;
  completedCount: number;
  totalCount: number;
  progressPercentage: number;
  currentNodeId: string | null;
  latestActivity: Date | null;
}

export function getCompletedNodesBySubject(progressLog: ProgressLogWithNode[], subject: string): string[] {
  return progressLog
    .filter(log => log.action === 'COMPLETED' && log.node.subject === subject.toLowerCase())
    .map(log => log.nodeId);
}

export function getLatestNodeInSubject(progressLog: ProgressLogWithNode[], subject: string): string | null {
  const subjectLogs = progressLog
    .filter(log => log.node.subject === subject.toLowerCase())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
  if (subjectLogs.length === 0) return null;
  
  // Find the latest COMPLETED node
  const latestCompleted = subjectLogs.find(log => log.action === 'COMPLETED');
  return latestCompleted?.nodeId || null;
}

export function calculateSubjectProgressFromLogs(progressLog: ProgressLogWithNode[], subject: string): number {
  const completedNodes = getCompletedNodesBySubject(progressLog, subject);
  const allSubjectNodes = getNodesBySubject(subject);
  
  if (allSubjectNodes.length === 0) return 0;
  
  return Math.round((completedNodes.length / allSubjectNodes.length) * 100);
}

export function getCurrentNodeForSubject(progressLog: ProgressLogWithNode[], subject: string): string | null {
  const subjectLogs = progressLog
    .filter(log => log.node.subject === subject.toLowerCase())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
  if (subjectLogs.length === 0) return null;
  
  // First, look for the latest COMPLETED node
  const latestCompleted = subjectLogs.find(log => log.action === 'COMPLETED');
  
  if (latestCompleted) {
    // Get the next node after the latest completed one
    const nextNode = getNextNode(latestCompleted.nodeId);
    return nextNode?.id || latestCompleted.nodeId; // If no next node, stay on the last completed one
  }
  
  // If no completed nodes, look for the latest STARTED node
  const latestStarted = subjectLogs.find(log => log.action === 'STARTED');
  if (latestStarted) {
    return latestStarted.nodeId;
  }
  
  // If no progress at all, return null
  return null;
}

export function getSubjectProgressSummary(progressLog: ProgressLogWithNode[]): Record<string, SubjectProgressSummary> {
  const subjects = getUniqueSubjects();
  
  return subjects.reduce((acc, subject) => {
    const enumSubject = subjectCurriculumToEnum(subject);
    const completedCount = getCompletedNodesBySubject(progressLog, subject).length;
    const totalCount = getNodesBySubject(subject).length;
    const currentNodeId = getCurrentNodeForSubject(progressLog, subject);
    
    acc[subject] = {
      subject: enumSubject,
      subjectName: getSubjectDisplayName(subject),
      completedCount,
      totalCount,
      progressPercentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      currentNodeId,
      latestActivity: getLatestActivityInSubject(progressLog, subject)
    };
    return acc;
  }, {} as Record<string, SubjectProgressSummary>);
}

export function getLatestActivityInSubject(progressLog: ProgressLogWithNode[], subject: string): Date | null {
  const subjectLogs = progressLog
    .filter(log => log.node.subject === subject.toLowerCase())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
  return subjectLogs.length > 0 ? new Date(subjectLogs[0].createdAt) : null;
}

// NEW: Path finding and prerequisite-based learning plan functions

/**
 * Get all nodes that are prerequisites for a given node using depth-first search.
 * This function traverses the curriculum graph backward to find all dependencies.
 * 
 * @param nodeId - The target node to find prerequisites for
 * @returns Array of prerequisite node IDs in dependency order
 */
export function getPrerequisiteNodes(nodeId: string): string[] {
  const prerequisites: string[] = [];
  const visited = new Set<string>();
  
  function dfsPrerequisites(currentNodeId: string) {
    if (visited.has(currentNodeId)) return;
    visited.add(currentNodeId);
    
    // Find all edges that point TO this node (prerequisites)
    const incomingEdges = curriculum.edges.filter(edge => 
      edge.to === currentNodeId && 
      (edge.relationship_type === 'sequential' || edge.relationship_type === 'foundational')
    );
    
    for (const edge of incomingEdges) {
      prerequisites.unshift(edge.from); // Add at beginning for proper order
      dfsPrerequisites(edge.from);
    }
  }
  
  dfsPrerequisites(nodeId);
  return [...new Set(prerequisites)]; // Remove duplicates while preserving order
}

/**
 * Get the path from start node to end node following prerequisites
 */
export function getPathBetweenNodes(startNodeId: string, endNodeId: string): string[] {
  const visited = new Set<string>();
  const path: string[] = [];
  
  function dfsPath(currentNodeId: string, targetNodeId: string, currentPath: string[]): boolean {
    if (visited.has(currentNodeId)) return false;
    visited.add(currentNodeId);
    
    const newPath = [...currentPath, currentNodeId];
    
    if (currentNodeId === targetNodeId) {
      path.push(...newPath);
      return true;
    }
    
    // Find all edges FROM this node
    const outgoingEdges = curriculum.edges.filter(edge => 
      edge.from === currentNodeId && 
      (edge.relationship_type === 'sequential' || edge.relationship_type === 'foundational')
    );
    
    for (const edge of outgoingEdges) {
      if (dfsPath(edge.to, targetNodeId, newPath)) {
        return true;
      }
    }
    
    visited.delete(currentNodeId);
    return false;
  }
  
  dfsPath(startNodeId, endNodeId, []);
  return path;
}

/**
 * Get available starting points for a subject based on progress log
 */
export function getStartingPointsForSubject(progressLog: ProgressLogWithNode[], subject: string): string[] {
  const completedNodes = getCompletedNodesBySubject(progressLog, subject);
  const startedNodes = progressLog
    .filter(log => log.action === 'STARTED' && log.node.subject === subject.toLowerCase())
    .map(log => log.nodeId);
  
  // Find nodes that are started but not completed
  const inProgressNodes = startedNodes.filter(nodeId => !completedNodes.includes(nodeId));
  
  if (inProgressNodes.length > 0) {
    return inProgressNodes;
  }
  
  // If no in-progress nodes, find the next logical starting point
  const latestCompleted = getLatestNodeInSubject(progressLog, subject);
  if (latestCompleted) {
    const nextNode = getNextNode(latestCompleted);
    return nextNode ? [nextNode.id] : [];
  }
  
  // If no progress at all, return the starting nodes for this subject
  const subjectStartingNodes = curriculum.edges
    .filter(edge => edge.from === 'START' && edge.relationship_type === 'system')
    .map(edge => edge.to)
    .filter(nodeId => {
      const node = getNodeById(nodeId);
      return node && node.subject === subject.toLowerCase();
    });
  
  return subjectStartingNodes;
}

/**
 * Get all possible end nodes for a subject (nodes with no outgoing edges in that subject)
 */
export function getPossibleEndNodesForSubject(subject: string): CurriculumNode[] {
  const subjectNodes = getNodesBySubject(subject);
  
  // Find nodes that have no outgoing sequential edges within the same subject
  const endNodes = subjectNodes.filter(node => {
    const outgoingEdges = curriculum.edges.filter(edge => 
      edge.from === node.id && edge.relationship_type === 'sequential'
    );
    
    // Check if any outgoing edges stay within the same subject
    const hasInSubjectNext = outgoingEdges.some(edge => {
      const nextNode = getNodeById(edge.to);
      return nextNode && nextNode.subject === subject.toLowerCase();
    });
    
    return !hasInSubjectNext;
  });
  
  return endNodes;
}

/**
 * Create an ordered learning path for a subject from start to end
 */
export function createOrderedLearningPath(
  startNodeId: string, 
  endNodeId: string,
  completedNodes: string[] = []
): string[] {
  const path = getPathBetweenNodes(startNodeId, endNodeId);
  
  // Filter out already completed nodes
  return path.filter(nodeId => !completedNodes.includes(nodeId));
}

/**
 * Create a comprehensive ordered learning path for a subject that maintains proper sequencing
 */
export function createComprehensiveSubjectPath(
  subject: string,
  startNodeIds: string[],
  endNodeId: string,
  completedNodes: string[] = []
): string[] {
  if (startNodeIds.length === 0) return [];
  
  const allPaths: string[][] = [];
  
  // Get paths from each starting point to the end
  for (const startNodeId of startNodeIds) {
    const path = getPathBetweenNodes(startNodeId, endNodeId);
    if (path.length > 0) {
      allPaths.push(path);
    }
  }
  
  if (allPaths.length === 0) return [];
  
  // Find the longest path (most comprehensive)
  const longestPath = allPaths.reduce((longest, current) => 
    current.length > longest.length ? current : longest
  );
  
  // Create a set of all nodes from all paths
  const allNodesSet = new Set<string>();
  allPaths.forEach(path => path.forEach(nodeId => allNodesSet.add(nodeId)));
  
  // Filter the longest path to only include nodes that should be in the final result
  const orderedPath = longestPath.filter(nodeId => {
    const node = getNodeById(nodeId);
    return node && node.subject === subject.toLowerCase() && !completedNodes.includes(nodeId);
  });
  
  return orderedPath;
}

/**
 * Get curriculum context for AI learning plan generation
 */
export interface CurriculumContext {
  completedNodesBySubject: Record<string, string[]>;
  startingPointsBySubject: Record<string, string[]>;
  possibleEndNodesBySubject: Record<string, CurriculumNode[]>;
  availableNodes: CurriculumNode[];
  edges: Array<{
    from: string;
    to: string;
    relationship_type: string;
    description: string;
  }>;
}

export function getCurriculumContext(progressLog: ProgressLogWithNode[]): CurriculumContext {
  const subjects = getUniqueSubjects();
  
  const completedNodesBySubject: Record<string, string[]> = {};
  const startingPointsBySubject: Record<string, string[]> = {};
  const possibleEndNodesBySubject: Record<string, CurriculumNode[]> = {};
  
  subjects.forEach(subject => {
    completedNodesBySubject[subject] = getCompletedNodesBySubject(progressLog, subject);
    startingPointsBySubject[subject] = getStartingPointsForSubject(progressLog, subject);
    possibleEndNodesBySubject[subject] = getPossibleEndNodesForSubject(subject);
  });
  
  return {
    completedNodesBySubject,
    startingPointsBySubject,
    possibleEndNodesBySubject,
    availableNodes: curriculum.nodes,
    edges: curriculum.edges
  };
}

/**
 * Get the first starting node for a subject (when no progress exists)
 */
export function getFirstNodeForSubject(subject: string): CurriculumNode | null {
  // Find nodes that are starting points (have no incoming sequential edges within the same subject)
  const subjectNodes = getNodesBySubject(subject);
  
  if (subjectNodes.length === 0) return null;
  
  // Find nodes with no incoming sequential edges from the same subject
  const startingNodes = subjectNodes.filter(node => {
    const incomingEdges = curriculum.edges.filter(edge => 
      edge.to === node.id && edge.relationship_type === 'sequential'
    );
    
    // Check if any incoming edges are from the same subject
    const hasInSubjectPredecessor = incomingEdges.some(edge => {
      const fromNode = getNodeById(edge.from);
      return fromNode && fromNode.subject === subject;
    });
    
    return !hasInSubjectPredecessor;
  });
  
  if (startingNodes.length === 0) {
    // Fallback: return the first node by course order and unit number
    return subjectNodes.sort((a, b) => {
      if (a.coursePath !== b.coursePath) {
        return a.coursePath.localeCompare(b.coursePath);
      }
      return a.unitNumber - b.unitNumber;
    })[0];
  }
  
  // Return the first starting node (sorted by course and unit number)
  return startingNodes.sort((a, b) => {
    if (a.coursePath !== b.coursePath) {
      return a.coursePath.localeCompare(b.coursePath);
    }
    return a.unitNumber - b.unitNumber;
  })[0];
} 