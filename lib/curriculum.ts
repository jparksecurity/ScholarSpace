import curriculumData from '@/curriculum_prerequisite_network.json';

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
      subject,
      subjectName: getSubjectDisplayName(subject),
      description: getSubjectDescription(subject),
      startingNodes,
    };
  });
}

function getSubjectDisplayName(subject: string): string {
  const displayNames: Record<string, string> = {
    'math': 'Mathematics',
    'ela': 'English Language Arts',
    'science': 'Science',
    'humanities': 'History & Social Studies'
  };
  return displayNames[subject] || subject.charAt(0).toUpperCase() + subject.slice(1);
}

function getSubjectDescription(subject: string): string {
  const descriptions: Record<string, string> = {
    'math': 'Number sense, algebra, geometry, and mathematical reasoning',
    'ela': 'Reading comprehension, vocabulary, and language skills',
    'science': 'Biology, chemistry, physics, and earth science concepts',
    'humanities': 'History, government, civics, and social studies'
  };
  return descriptions[subject] || `Core concepts and skills in ${subject}`;
}

export function getCoursesBySubject(subject: string): CourseInfo[] {
  const subjectNodes = curriculum.nodes.filter(node => node.subject === subject);
  
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
  return curriculum.nodes.filter(node => node.subject === subject);
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
    if (prevNode && prevNode.subject === subject) {
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