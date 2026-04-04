import { useState } from 'react';
import type { Prompt } from '../types';
import { createPromptApi, updatePromptApi, deletePromptApi } from '../api';

interface Props {
  prompts: Prompt[];
  setPrompts: (prompts: Prompt[]) => void;
  loading?: boolean;
}

export function PromptManager({ prompts, setPrompts, loading }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [targetField, setTargetField] = useState<'title' | 'deck' | 'body'>(
    'title'
  );
  const [template, setTemplate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setTargetField('title');
    setTemplate('');
    setError(null);
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingId(prompt.id);
    setName(prompt.name);
    setTargetField(prompt.targetField);
    setTemplate(prompt.template);
    setError(null);
  };

  const handleSave = async () => {
    if (!name.trim() || !template.trim()) return;
    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        const updated = await updatePromptApi(editingId, {
          name,
          targetField,
          template,
        });
        setPrompts(prompts.map((p) => (p.id === editingId ? updated : p)));
      } else {
        const created = await createPromptApi({ name, targetField, template });
        setPrompts([...prompts, created]);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prompt?')) return;
    setError(null);
    try {
      await deletePromptApi(id);
      setPrompts(prompts.filter((p) => p.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prompt');
    }
  };

  const handleDuplicate = async (prompt: Prompt) => {
    setError(null);
    try {
      const created = await createPromptApi({
        name: `${prompt.name} (copy)`,
        targetField: prompt.targetField,
        template: prompt.template,
      });
      setPrompts([...prompts, created]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to duplicate prompt'
      );
    }
  };

  return (
    <div className="prompt-manager">
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          ⏳ Loading prompts from database…
        </div>
      )}

      {error && (
        <div
          className="card"
          style={{ background: '#ffeaea', color: '#c00', marginBottom: '1rem' }}
        >
          ⚠️ {error}
        </div>
      )}

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
            disabled={!name.trim() || !template.trim() || saving}
          >
            {saving
              ? '⏳ Saving…'
              : editingId
                ? 'Update Prompt'
                : 'Create Prompt'}
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
