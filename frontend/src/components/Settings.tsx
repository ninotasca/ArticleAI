import { useState } from 'react';
import { QuickTest } from './QuickTest';
import { AiTest } from './AiTest';

interface Props {
  health: { supabase: boolean; openai: boolean } | null;
}

export function Settings({ health }: Props) {
  const [activeSection, setActiveSection] = useState<'db' | 'ai'>('db');

  return (
    <div className="prompt-manager">
      <div className="card">
        <h2>⚙️ Settings</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          System diagnostics and test tools.
        </p>

        {health && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.875rem' }}>
              {health.supabase ? '✅' : '❌'} Supabase
            </span>
            <span style={{ fontSize: '0.875rem' }}>
              {health.openai ? '✅' : '❌'} OpenAI
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            className={activeSection === 'db' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveSection('db')}
          >
            🧪 DB Test
          </button>
          <button
            className={activeSection === 'ai' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveSection('ai')}
          >
            🤖 AI Test
          </button>
        </div>
      </div>

      {activeSection === 'db' && <QuickTest />}
      {activeSection === 'ai' && <AiTest />}
    </div>
  );
}
