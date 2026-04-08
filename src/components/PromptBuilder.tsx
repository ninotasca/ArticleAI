import { useState, useEffect, useMemo } from 'react';
import type { Prompt, Persona, BuiltPrompt } from '../types';
import {
  fetchBuiltPrompts,
  createBuiltPromptApi,
  updateBuiltPromptApi,
  deleteBuiltPromptApi,
} from '../api';

interface Props {
  prompts: Prompt[];
  personas: Persona[];
}

const DEFAULT_BRAND_VOICE_INSTRUCTIONS =
  'Evaluate and improve the provided article content. Write in a professional, confident, and clear tone. Do not include numeric ratings or technical details. Use the following brand voice definition as your tone and style guide:';

const DEFAULT_OUTPUT_RULES = `Strict output rules:
- No markdown fences.
- No prose or explanations outside the JSON.
- Do NOT use numeric scores or ratings in any evaluation or suggestion text.`;

function assemblePrompt(parts: {
  brandVoiceInstructions: string;
  brandVoiceText: string;
  titleInstructions: string;
  bodyInstructions: string;
  additionalInstructions: string;
  outputRules: string;
}): string {
  const sections: string[] = [];

  // Brand voice section
  if (parts.brandVoiceInstructions.trim()) {
    sections.push(parts.brandVoiceInstructions.trim());
  }
  if (parts.brandVoiceText.trim()) {
    sections.push(`"""\n${parts.brandVoiceText.trim()}\n"""`);
  }

  // Title instructions
  if (parts.titleInstructions.trim()) {
    sections.push(`Title Instructions:\n${parts.titleInstructions.trim()}`);
  }

  // Body instructions
  if (parts.bodyInstructions.trim()) {
    sections.push(`Body Instructions:\n${parts.bodyInstructions.trim()}`);
  }

  // Additional instructions
  if (parts.additionalInstructions.trim()) {
    sections.push(
      `Additional Instructions:\n${parts.additionalInstructions.trim()}`
    );
  }

  // Output rules
  if (parts.outputRules.trim()) {
    sections.push(parts.outputRules.trim());
  }

  // Article context placeholder
  sections.push(
    `Article to evaluate:\nTitle: {{title}}\nDeck: {{deck}}\nBody: {{body}}`
  );

  return sections.join('\n\n');
}

export function PromptBuilder({ prompts, personas }: Props) {
  const [builtPrompts, setBuiltPrompts] = useState<BuiltPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [brandVoiceInstructions, setBrandVoiceInstructions] = useState(
    DEFAULT_BRAND_VOICE_INSTRUCTIONS
  );
  const [selectedBrandVoiceId, setSelectedBrandVoiceId] = useState('');
  const [selectedTitlePromptId, setSelectedTitlePromptId] = useState('');
  const [selectedBodyPromptId, setSelectedBodyPromptId] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [outputRules, setOutputRules] = useState(DEFAULT_OUTPUT_RULES);

  // Filter prompts by target field
  const titlePrompts = useMemo(
    () => prompts.filter((p) => p.targetField === 'title'),
    [prompts]
  );
  const bodyPrompts = useMemo(
    () => prompts.filter((p) => p.targetField === 'body'),
    [prompts]
  );

  // Resolve selected items
  const selectedBrandVoice = personas.find(
    (p) => p.id === selectedBrandVoiceId
  );
  const selectedTitlePrompt = titlePrompts.find(
    (p) => p.id === selectedTitlePromptId
  );
  const selectedBodyPrompt = bodyPrompts.find(
    (p) => p.id === selectedBodyPromptId
  );

  // Live preview of assembled prompt
  const assembledPreview = assemblePrompt({
    brandVoiceInstructions,
    brandVoiceText: selectedBrandVoice?.persona || '',
    titleInstructions: selectedTitlePrompt?.template || '',
    bodyInstructions: selectedBodyPrompt?.template || '',
    additionalInstructions,
    outputRules,
  });

  // Load saved built prompts on mount
  useEffect(() => {
    fetchBuiltPrompts()
      .then((bps) => setBuiltPrompts(bps))
      .catch((err) =>
        console.error('Failed to load built prompts:', err)
      )
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setBrandVoiceInstructions(DEFAULT_BRAND_VOICE_INSTRUCTIONS);
    setSelectedBrandVoiceId('');
    setSelectedTitlePromptId('');
    setSelectedBodyPromptId('');
    setAdditionalInstructions('');
    setOutputRules(DEFAULT_OUTPUT_RULES);
    setError(null);
    setSuccessMsg(null);
  };

  const handleEdit = (bp: BuiltPrompt) => {
    setEditingId(bp.id);
    setName(bp.name);
    setBrandVoiceInstructions(bp.brandVoiceInstructions);
    setSelectedBrandVoiceId(bp.brandVoiceId || '');
    setSelectedTitlePromptId(bp.titlePromptId || '');
    setSelectedBodyPromptId(bp.bodyPromptId || '');
    setAdditionalInstructions(bp.additionalInstructions);
    setOutputRules(bp.outputRules);
    setError(null);
    setSuccessMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a name for this prompt configuration.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      name,
      brandVoiceInstructions,
      brandVoiceId: selectedBrandVoiceId || null,
      titlePromptId: selectedTitlePromptId || null,
      bodyPromptId: selectedBodyPromptId || null,
      additionalInstructions,
      outputRules,
      assembledPrompt: assembledPreview,
    };

    try {
      if (editingId) {
        const updated = await updateBuiltPromptApi(editingId, payload);
        setBuiltPrompts(
          builtPrompts.map((bp) => (bp.id === editingId ? updated : bp))
        );
        setSuccessMsg('Prompt configuration updated!');
      } else {
        const created = await createBuiltPromptApi(payload);
        setBuiltPrompts([...builtPrompts, created]);
        setSuccessMsg('Prompt configuration saved!');
      }
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save prompt configuration'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prompt configuration?')) return;
    try {
      await deleteBuiltPromptApi(id);
      setBuiltPrompts(builtPrompts.filter((bp) => bp.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete'
      );
    }
  };

  return (
    <div className="prompt-manager">
      {error && (
        <div className="error-banner">⚠️ {error}</div>
      )}
      {successMsg && (
        <div
          className="card"
          style={{
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
          }}
        >
          ✅ {successMsg}
        </div>
      )}

      {/* ── Builder Form ── */}
      <div className="prompt-form card">
        <h2>
          {editingId
            ? '✏️ Edit Prompt Configuration'
            : '🔧 Prompt Builder'}
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}
        >
          Assemble a complete prompt by combining a brand voice, title
          instructions, body instructions, and output rules. The assembled
          prompt will be sent to the AI along with article content.
        </p>

        {/* Name */}
        <div className="form-group">
          <label>Configuration Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Production v1, SEO-Focused Review"
          />
        </div>

        {/* Brand Voice Instructions */}
        <div className="form-group">
          <label>Brand Voice Instructions</label>
          <textarea
            value={brandVoiceInstructions}
            onChange={(e) => setBrandVoiceInstructions(e.target.value)}
            rows={4}
          />
          <div className="form-hint">
            This intro text tells the AI how to use the brand voice that follows.
          </div>
        </div>

        {/* Brand Voice Dropdown */}
        <div className="form-group">
          <label>Brand Voice</label>
          <select
            value={selectedBrandVoiceId}
            onChange={(e) => setSelectedBrandVoiceId(e.target.value)}
          >
            <option value="">— Select a Brand Voice —</option>
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          {selectedBrandVoice && (
            <div
              className="form-hint"
              style={{
                background: '#f8fafc',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                marginTop: '0.5rem',
                whiteSpace: 'pre-wrap',
                maxHeight: '80px',
                overflow: 'auto',
              }}
            >
              {selectedBrandVoice.persona}
            </div>
          )}
        </div>

        {/* Title Instructions Dropdown */}
        <div className="form-group">
          <label>Title Instructions</label>
          <select
            value={selectedTitlePromptId}
            onChange={(e) => setSelectedTitlePromptId(e.target.value)}
          >
            <option value="">— Select Title Instructions —</option>
            {titlePrompts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {titlePrompts.length === 0 && (
            <div className="form-hint" style={{ color: '#b45309' }}>
              No title prompts found. Create one in the Prompts tab with
              target field "title".
            </div>
          )}
          {selectedTitlePrompt && (
            <div
              className="form-hint"
              style={{
                background: '#f8fafc',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                marginTop: '0.5rem',
                whiteSpace: 'pre-wrap',
                maxHeight: '80px',
                overflow: 'auto',
              }}
            >
              {selectedTitlePrompt.template}
            </div>
          )}
        </div>

        {/* Body Instructions Dropdown */}
        <div className="form-group">
          <label>Body Instructions</label>
          <select
            value={selectedBodyPromptId}
            onChange={(e) => setSelectedBodyPromptId(e.target.value)}
          >
            <option value="">— Select Body Instructions —</option>
            {bodyPrompts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {bodyPrompts.length === 0 && (
            <div className="form-hint" style={{ color: '#b45309' }}>
              No body prompts found. Create one in the Prompts tab with
              target field "body".
            </div>
          )}
          {selectedBodyPrompt && (
            <div
              className="form-hint"
              style={{
                background: '#f8fafc',
                padding: '0.5rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                marginTop: '0.5rem',
                whiteSpace: 'pre-wrap',
                maxHeight: '80px',
                overflow: 'auto',
              }}
            >
              {selectedBodyPrompt.template}
            </div>
          )}
        </div>

        {/* Additional Instructions */}
        <div className="form-group">
          <label>Additional Instructions</label>
          <textarea
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
            rows={4}
            placeholder="Any extra instructions for the AI…"
          />
        </div>

        {/* Output Rules */}
        <div className="form-group">
          <label>Output Rules</label>
          <textarea
            value={outputRules}
            onChange={(e) => setOutputRules(e.target.value)}
            rows={5}
          />
          <div className="form-hint">
            These rules constrain the AI's response format.
          </div>
        </div>

        {/* Save / Cancel */}
        <div className="form-actions">
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!name.trim() || saving}
          >
            {saving
              ? '⏳ Saving…'
              : editingId
                ? 'Update Configuration'
                : 'Save Configuration'}
          </button>
          {editingId && (
            <button className="btn-secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* ── Assembled Prompt Preview ── */}
      <div className="card">
        <h2>📋 Assembled Prompt Preview</h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.8125rem',
            marginBottom: '0.75rem',
          }}
        >
          This is what will be sent to the AI (with article content replacing
          the placeholders).
        </p>
        <pre
          style={{
            background: '#f8fafc',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '1rem',
            fontSize: '0.8125rem',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            maxHeight: '400px',
            overflow: 'auto',
            lineHeight: '1.6',
            fontFamily:
              "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
          }}
        >
          {assembledPreview}
        </pre>
      </div>

      {/* ── Saved Configurations ── */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          ⏳ Loading saved configurations…
        </div>
      )}

      {builtPrompts.length > 0 && (
        <div className="prompt-list">
          <h2>Saved Configurations</h2>
          {builtPrompts.map((bp) => (
            <div
              key={bp.id}
              className={`prompt-card card ${editingId === bp.id ? 'editing' : ''}`}
            >
              <div className="prompt-card-header">
                <h3>{bp.name}</h3>
                <span className="badge badge-body">built prompt</span>
              </div>
              <pre className="prompt-preview">{bp.assembledPrompt}</pre>
              <div className="prompt-card-actions">
                <button onClick={() => handleEdit(bp)}>✏️ Edit</button>
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(bp.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {builtPrompts.length === 0 && !loading && (
        <div className="empty-hero">
          <p>🔧 Save your first prompt configuration to get started!</p>
        </div>
      )}
    </div>
  );
}
