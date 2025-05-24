import prisma from "@/lib/prisma";
import CurriculumGraph from "@/components/CurriculumGraph";

export default async function CurriculumPage() {
  // Fetch all nodes for the graph (filtering handled by graph component)
  const nodes = await prisma.curriculumNode.findMany({
    orderBy: {
      subject: 'asc',
    },
  });

  // Fetch all edges (filtering handled by graph component)
  const edges = await prisma.curriculumEdge.findMany({
    include: {
      fromNode: true,
      toNode: true,
    },
  });

  // Get sample data for display below the graph
  const sampleNodes = nodes.slice(0, 10);
  const sampleEdges = edges.slice(0, 10);

  // Calculate stats for display
  const nodeStats = await prisma.curriculumNode.groupBy({
    by: ['subject'],
    _count: {
      subject: true,
    },
  });

  const edgeStats = edges.reduce((acc, edge) => {
    const type = edge.relationshipType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const edgeStatsArray = Object.entries(edgeStats).map(([relationshipType, count]) => ({
    relationshipType,
    _count: { relationshipType: count },
  }));

  const totalNodes = nodes.length;
  const totalEdges = edges.length;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">ScholarSpace Curriculum Network</h1>
      
      {/* Interactive Graph */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Interactive Curriculum Network</h2>
        <CurriculumGraph nodes={nodes} edges={edges} />
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Total Nodes</h3>
          <p className="text-2xl font-bold text-blue-600">{totalNodes}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Total Edges</h3>
          <p className="text-2xl font-bold text-green-600">{totalEdges}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800">Subjects</h3>
          <p className="text-2xl font-bold text-purple-600">{nodeStats.length}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-orange-800">Edge Types</h3>
          <p className="text-2xl font-bold text-orange-600">{edgeStatsArray.length}</p>
        </div>
      </div>

      {/* Subject Distribution */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Nodes by Subject</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodeStats.map((stat) => (
            <div key={stat.subject} className="border rounded-lg p-4">
              <h3 className="font-semibold capitalize">{stat.subject}</h3>
              <p className="text-xl font-bold text-blue-600">{stat._count.subject} units</p>
            </div>
          ))}
        </div>
      </div>

      {/* Edge Type Distribution */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Relationships by Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {edgeStatsArray.map((stat) => (
            <div key={stat.relationshipType} className="border rounded-lg p-4">
              <h3 className="font-semibold capitalize">{stat.relationshipType}</h3>
              <p className="text-xl font-bold text-green-600">{stat._count.relationshipType} connections</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sample Nodes */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Sample Curriculum Units</h2>
        <div className="space-y-4">
          {sampleNodes.map((node) => (
            <div key={node.id} className="border rounded-lg p-4">
              <h3 className="font-semibold">{node.unitTitle}</h3>
              <p className="text-gray-600">{node.courseTitle} - Grade {node.gradeLevel}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm capitalize">
                  {node.subject}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                  Unit {node.unitNumber}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sample Relationships */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Sample Relationships</h2>
        <div className="space-y-4">
          {sampleEdges.map((edge) => (
            <div key={edge.id} className="border rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h4 className="font-medium">{edge.fromNode.unitTitle}</h4>
                  <p className="text-sm text-gray-600">{edge.fromNode.courseTitle}</p>
                </div>
                <div className="px-3 py-1 bg-gray-200 rounded">
                  <span className="text-sm font-medium capitalize">{edge.relationshipType}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{edge.toNode.unitTitle}</h4>
                  <p className="text-sm text-gray-600">{edge.toNode.courseTitle}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{edge.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 p-4 bg-green-50 rounded-lg">
        <p className="text-green-800">
          ✅ Curriculum data successfully loaded! Use the controls in the graph panel to filter and explore different views of the network.
          {' '}Check Prisma Studio at{' '}
          <a href="http://localhost:5555" target="_blank" rel="noopener noreferrer" className="underline">
            http://localhost:5555
          </a>{' '}
          for detailed database exploration.
        </p>
      </div>
    </div>
  );
} 