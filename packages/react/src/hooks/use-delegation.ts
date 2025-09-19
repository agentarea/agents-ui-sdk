"use client"

import { useState, useEffect } from 'react';
import { useAgentContext } from '../components/providers/agent-provider';
import type { TaskNode, DelegationDetails, SubTask, DelegationConfig } from '../../../core/src/types/runtime';

export const useDelegation = (parentTaskId: string) => {
  const [tree, setTree] = useState<TaskNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { runtimeManager } = useAgentContext();

  const fetchTree = async () => {
    if (!runtimeManager) return;
    setLoading(true);
    try {
      const node = await runtimeManager.getDelegationTree(parentTaskId);
      setTree(node);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch delegation tree');
    } finally {
      setLoading(false);
    }
  };

  const delegate = async (subTasks: SubTask[], config?: DelegationConfig) => {
    if (!runtimeManager) throw new Error('No runtime manager available');
    setLoading(true);
    try {
      const details = await runtimeManager.delegateSubTask(parentTaskId, subTasks, config);
      await fetchTree(); // Refresh tree
      return details;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delegation failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (parentTaskId) fetchTree();
  }, [parentTaskId]);

  return { tree, delegate, loading, error, refetch: fetchTree };
};