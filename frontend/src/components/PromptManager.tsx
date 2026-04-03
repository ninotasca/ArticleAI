import { useState } from 'react';
import type { Prompt } from '../types';

interface Props {
  prompts: Prompt[];
  setPrompts: (prompts: Prompt[]) => void;
}

export function PromptManager({ prompts, setPrompts }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [targetField, setTargetField] = useState<'title' | 'deck' | 'body'>(
    'title'
  );
  const [template, setTemplate] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setTargetField('title');
    setTemplate('');
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingId(prompt.id);
    setName(prompt.name);
    setTargetField(prompt.targetField);
    setTemplate(prompt.template);
  };

  const handleSave = () => {
    if (!name.trim() || !template.trim()) return;

    if (editingId) {
      setPrompts(
        prompts.map((p) =>
          p.id === editingId ? { ...p, name, targetField, template } : p
        )
      );
    } else {
      const newPrompt: Prompt = {
        id: crypto.randomUUID(),
        name,
        targetField,
        template,
      };
      setPrompts([...prompts, newPrompt]);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this prompt?')) return;
    setPrompts(prompts.filter((p) => p.id !== id));
    if (editingId === id) resetForm();
  };

  const handleDuplicate = (prompt: Prompt) => {
    const newPrompt: Prompt = {
      ...prompt,
      id: crypto.randomUUID(),
      name: `${prompt.name} (copy)`,
    };
    setPrompts([...prompts, newPrompt]);
  };

  return (
    <div className="prompt-manager">
      {/* ── Form ── */}
      <div className="prompt-form card">
        <h2>{editingId ? '✏️ Edit Prompt' : '➕ Create New Prompt'}</h2>

        <div className="form-row">
          <div className="form-group">
            <label>Prompt Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Title Quality Check v1"
            />
          </div>
          <div className="form-group">
            <label>Target Field</label>
            <select
              value={targetField}
              onChange={(e) =>
                setTargetField(e.target.value as 'title' | 'deck' | 'body')
              }
            >
              <option value="title">Title</option>
              <option value="deck">Deck</option>
              <option value="body">Body</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Prompt Template</label>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            placeholder={`Use {{title}}, {{deck}}, {{body}} as placeholders.\n\nExample: Evaluate this article title for SEO quality and engagement: "{{title}}"`}
            rows={6}
          />
          <div className="form-hint">
            Available placeholders:{' '}
            <code>{'{{title}}'}</code>{' '}
            <code>{'{{deck}}'}</code>{' '}
            <code>{'{{body}}'}</code>
          </div>
        </div>

        <div className="form-actions">
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!name.trim() || !template.trim()}
          >
            {editingId ? 'Update Prompt' : 'Create Prompt'}
          </button>
          {editingId && (
            <button className="btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* ── Prompt List ── */}
      {prompts.length > 0 && (
        <div className="prompt-list">
          <h2>Your Prompts</h2>
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className={`prompt-card card ${editingId === prompt.id ? 'editing' : ''}`}
            >
              <div className="prompt-card-header">
                <h3>{prompt.name}</h3>
                <span className={`badge badge-${prompt.targetField}`}>
                  {prompt.targetField}
                </span>
              </div>
              <pre className="prompt-preview">{prompt.template}</pre>
              <div className="prompt-card-actions">
                <button onClick={() => handleEdit(prompt)}>✏️ Edit</button>
                <button onClick={() => handleDuplicate(prompt)}>
                  📋 Duplicate
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(prompt.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {prompts.length === 0 && (
        <div className="empty-hero">
          <p>🚀 Create your first prompt above to get started!</p>
        </div>
      )}
    </div>
  );
}
