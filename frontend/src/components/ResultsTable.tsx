import { useState } from 'react';
import type { Prompt, ComparisonResult } from '../types';

interface Props {
  result: ComparisonResult;
  prompts: Prompt[];
}

export function ResultsTable({ result, prompts }: Props) {
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());

  // Get the prompts that were used in this comparison
  const usedPromptIds =
    result.results.length > 0 ? Object.keys(result.results[0].results) : [];
  const usedPrompts = usedPromptIds
    .map((id) => prompts.find((p) => p.id === id))
    .filter(Boolean) as Prompt[];

  // Determine the target field from the first prompt
  const targetField = usedPrompts[0]?.targetField || 'title';

  const toggleExpand = (key: string) => {
    const next = new Set(expandedCells);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedCells(next);
  };

  const expandAll = () => {
    const all = new Set<string>();
    result.results.forEach((row) => {
      usedPromptIds.forEach((pid) => {
        all.add(`${row.article.id}-${pid}`);
      });
    });
    setExpandedCells(all);
  };

  const collapseAll = () => setExpandedCells(new Set());

  const exportCSV = () => {
    const headers = [
      '#',
      'Article ID',
      `Original ${targetField}`,
      ...usedPrompts.map((p) => p.name),
    ];
    const rows = result.results.map((row, i) => [
      i + 1,
      row.article.id,
      `"${((row.article as any)[targetField] || '').toString().replace(/"/g, '""')}"`,
      ...usedPromptIds.map(
        (id) => `"${(row.results[id] || '').replace(/"/g, '""')}"`
      ),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparison-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="results-table">
      <div className="results-header">
        <h2>📊 Comparison Results</h2>
        <div className="results-meta">
          <span className="meta-pill">
            {result.meta.totalArticles} articles
          </span>
          <span className="meta-pill">
            {result.meta.totalPrompts} prompts
          </span>
          <span className="meta-pill">
            {(result.meta.duration / 1000).toFixed(1)}s
          </span>
          <button className="btn-link" onClick={expandAll}>
            Expand all
          </button>
          <button className="btn-link" onClick={collapseAll}>
            Collapse all
          </button>
          <button className="btn-secondary" onClick={exportCSV}>
            📥 Export CSV
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th className="col-num">#</th>
              <th className="col-original">
                Original{' '}
                <span className={`badge badge-${targetField}`}>
                  {targetField}
                </span>
              </th>
              {usedPrompts.map((prompt) => (
                <th key={prompt.id} className="col-result">
                  {prompt.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.results.map((row, i) => {
              const originalValue =
                (row.article as any)[targetField] || '';
              return (
                <tr key={row.article.id}>
                  <td className="col-num">{i + 1}</td>
                  <td className="col-original">
                    <div className="cell-content original-content">
                      {originalValue}
                    </div>
                  </td>
                  {usedPromptIds.map((promptId) => {
                    const cellKey = `${row.article.id}-${promptId}`;
                    const isExpanded = expandedCells.has(cellKey);
                    const content = row.results[promptId] || '';
                    const isError = content.startsWith('[Error');
                    return (
                      <td key={promptId} className="col-result">
                        <div
                          className={`cell-content ${isExpanded ? 'expanded' : 'collapsed'} ${isError ? 'cell-error' : ''}`}
                          onClick={() => toggleExpand(cellKey)}
                          title="Click to expand/collapse"
                        >
                          {content}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
