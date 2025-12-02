import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export const usePapers = () => {
  const [state, setState] = useState({
    papers: [],
    connections: [],
    loading: false,
    error: null,
    stats: null
  });

  const fetchPaperNetwork = useCallback(async (input, inputType, depth = 2) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input_type: inputType,
          value: input,
          depth: depth,
          max_papers: 50
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze paper');
      }

      const papersList = Object.values(data.network.papers || {}).map(paper => ({
        ...paper,
        id: paper.id || Math.random().toString(),
        fields: paper.fields || [],
        authors: paper.authors || [],
      }));

      const newState = {
        papers: papersList,
        connections: data.network.edges || [],
        loading: false,
        error: null,
        stats: data.network.stats || {}
      };

      setState(newState);
      return newState;

    } catch (error) {
      console.error('Error fetching paper network:', error);
      const errorState = {
        ...state,
        loading: false,
        error: error.message
      };
      setState(errorState);
      throw error;
    }
  }, []);

  const clearPapers = useCallback(() => {
    setState({
      papers: [],
      connections: [],
      loading: false,
      error: null,
      stats: null
    });
  }, []);

  return {
    ...state,
    fetchPaperNetwork,
    clearPapers
  };
};