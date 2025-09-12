'use client'

import React, { useState } from 'react';
import type { TaskNode } from '../../../../core/src/types/runtime';

interface TaskTreeListProps {
  node: TaskNode;
}

const TaskTreeList: React.FC<TaskTreeListProps> = ({ node }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border rounded p-2">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold">{node.description}</span>
        <span className="text-sm text-gray-500">{node.status}</span>
      </div>
      <div className="ml-4">
        <div className="text-xs text-gray-600 mb-1">{node.agentId}</div>
        {node.children.length > 0 && (
          <button onClick={() => setExpanded(!expanded)} className="text-blue-500 underline mb-2">
            {expanded ? 'Collapse' : 'Expand'} ({node.children.length} sub-tasks)
          </button>
        )}
        {expanded && node.children.map((child: TaskNode) => (
          <TaskTreeList key={child.id} node={child} />
        ))}
      </div>
    </div>
  );
};

export { TaskTreeList };
