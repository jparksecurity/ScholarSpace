import curriculumData from '@/curriculum_prerequisite_network.json';
import { ProgressLogWithNode } from '@/hooks/useStudents';

export interface CurriculumNode {
  id: string;
  unit_title: string;
  unit_number: number;
  course_title: string;
  course_path: string;
  grade_level: string;
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

// Type the imported JSON data
const curriculum = curriculumData as {
  nodes: CurriculumNode[];
  edges: Array<{
    from: string;
    to: string;
    relationship_type: string;
    description: string;
  }>;
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
    const key = node.course_path;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(node);
    return acc;
  }, {} as Record<string, CurriculumNode[]>);

  return Object.entries(courseGroups).map(([coursePath, nodes]) => {
    // Sort units by unit number
    const sortedUnits = nodes.sort((a, b) => a.unit_number - b.unit_number);
    const firstUnit = sortedUnits[0];
    
    return {
      id: coursePath,
      title: firstUnit.course_title,
      gradeLevel: firstUnit.grade_level,
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
  
  // Traverse backwards from the given node
  let currentNode = getNodeById(nodeId);
  
  while (currentNode) {
    completedNodes.unshift(currentNode);
    const prevNode = getPreviousNode(currentNode.id);
    // Normalize subject for comparison
    if (prevNode && prevNode.subject === subject.toLowerCase()) {
      currentNode = prevNode;
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
  const latestCompleted = getLatestNodeInSubject(progressLog, subject);
  
  if (!latestCompleted) {
    // If no completed nodes, return the first node in the subject
    const subjectNodes = getNodesBySubject(subject);
    return subjectNodes.length > 0 ? subjectNodes[0].id : null;
  }
  
  // Get the next node after the latest completed one
  const nextNode = getNextNode(latestCompleted);
  return nextNode?.id || latestCompleted; // If no next node, stay on the last completed one
}

export function getSubjectProgressSummary(progressLog: ProgressLogWithNode[]): Record<string, SubjectProgressSummary> {
  const subjects = getUniqueSubjects();
  
  return subjects.reduce((acc, subject) => {
    const enumSubject = subjectCurriculumToEnum(subject);
    acc[subject] = {
      subject: enumSubject,
      subjectName: getSubjectDisplayName(subject),
      completedCount: getCompletedNodesBySubject(progressLog, subject).length,
      totalCount: getNodesBySubject(subject).length,
      progressPercentage: calculateSubjectProgressFromLogs(progressLog, subject),
      currentNodeId: getCurrentNodeForSubject(progressLog, subject),
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