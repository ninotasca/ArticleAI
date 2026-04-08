import { useState } from 'react';
import type { Persona } from '../types';
import { createPersonaApi, updatePersonaApi, deletePersonaApi } from '../api';

interface Props {
  personas: Persona[];
  setPersonas: (personas: Persona[]) => void;
  loading?: boolean;
}

export function PersonaManager({ personas, setPersonas, loading }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [persona, setPersona] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setPersona('');
    setError(null);
  };

  const handleEdit = (p: Persona) => {
    setEditingId(p.id);
    setTitle(p.title);
    setPersona(p.persona);
    setError(null);
  };

  const handleSave = async () => {
    if (!title.trim() || !persona.trim()) return;
    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        const updated = await updatePersonaApi(editingId, { title, persona });
        setPersonas(personas.map((p) => (p.id === editingId ? updated : p)));
      } else {
        const created = await createPersonaApi({ title, persona });
        setPersonas([...personas, created]);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save brand voice');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this brand voice?')) return;
    setError(null);
    try {
      await deletePersonaApi(id);
      setPersonas(personas.filter((p) => p.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete brand voice'
      );
    }
  };

  const handleDuplicate = async (p: Persona) => {
    setError(null);
    try {
      const created = await createPersonaApi({
        title: `${p.title} (copy)`,
        persona: p.persona,
      });
      setPersonas([...personas, created]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to duplicate brand voice'
      );
    }
  };

  return (
    <div className="prompt-manager">
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          ⏳ Loading brand voices from database…
        </div>
      )}

      {error && (
        <div
          className="card"
          style={{
            background: '#ffeaea',
            color: '#c00',
            marginBottom: '1rem',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* ── Form ── */}
      <div className="prompt-form card">
        <h2>{editingId ? '✏️ Edit Brand Voice' : '➕ Create New Brand Voice'}</h2>

        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Strict Editor, Friendly Copywriter, SEO Analyst"
          />
        </div>

        <div className="form-group">
          <label>Brand Voice</label>
          <textarea
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            placeholder={`Describe the brand voice in detail.\n\nExample: You are a seasoned newspaper editor with 20 years of experience. You value clarity, conciseness, and accuracy above all else. You are critical but constructive, always providing specific suggestions for improvement…`}
            rows={12}
            style={{ minHeight: '200px' }}
          />
          <div className="form-hint">
            Describe the voice's role, tone, expertise, and behavior. This
            will be used as a system prompt when running AI tasks.
          </div>
        </div>

        <div className="form-actions">
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!title.trim() || !persona.trim() || saving}
          >
            {saving
              ? '⏳ Saving…'
              : editingId
                ? 'Update Brand Voice'
                : 'Create Brand Voice'}
          </button>
          {editingId && (
            <button className="btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* ── Persona List ── */}
      {personas.length > 0 && (
        <div className="prompt-list">
          <h2>Your Brand Voices</h2>
          {personas.map((p) => (
            <div
              key={p.id}
              className={`prompt-card card ${editingId === p.id ? 'editing' : ''}`}
            >
              <div className="prompt-card-header">
                <h3>{p.title}</h3>
                <span className="badge badge-title">brand voice</span>
              </div>
              <pre className="prompt-preview">{p.persona}</pre>
              <div className="prompt-card-actions">
                <button onClick={() => handleEdit(p)}>✏️ Edit</button>
                <button onClick={() => handleDuplicate(p)}>
                  📋 Duplicate
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(p.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {personas.length === 0 && !loading && (
        <div className="empty-hero">
          <p>� Create your first brand voice above to get started!</p>
        </div>
      )}
    </div>
  );
}
