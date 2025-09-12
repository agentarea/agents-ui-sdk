'use client'

import React from 'react';
import type { TaskNode } from '../../../../core/src/types/runtime';

interface TempTaskGraphProps {
  nodes: TaskNode[];
}

const TempTaskGraph: React.FC<TempTaskGraphProps> = ({ nodes }) => {
  const renderGraph = (nodes: TaskNode[], x = 0, y = 0, level = 0) => {
    return (
      <g transform={`translate(${x}, ${y})`}>
        {nodes.map((node, i) => {
          const nodeX = i * 150;
          const nodeY = level * 100;
          return (
            <g key={node.id} transform={`translate(${nodeX}, ${nodeY})`}>
              <circle r="30" fill={node.status === 'completed' ? 'green' : 'blue'} />
              <text x="0" y="5" textAnchor="middle" fill="white">{node.agentId.slice(0, 3)}</text>
              <text x="0" y="45" textAnchor="middle" fontSize="12">{node.status}</text>
              {node.children.length > 0 && (
                <g>
                  {node.children.map((child, ci) => (
                    <line
                      key={ci}
                      x1="0" y1="60"
                      x2={ci * 150 - nodeX} y2={100}
                      stroke="gray" strokeWidth="2"
                    />
                  ))}
                  {renderGraph(node.children, 0, 100, level + 1)}
                </g>
              )}
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <svg width="800" height="400" className="border rounded">
      <rect width="100%" height="100%" fill="white" />
      {renderGraph(nodes)}
    </svg>
  );
};

export { TempTaskGraph };
