import { useState, useEffect } from 'react';
import { PromptManager } from './components/PromptManager';
import { PersonaManager } from './components/PersonaManager';
import { ComparisonRunner } from './components/ComparisonRunner';
import { ResultsTable } from './components/ResultsTable';
import { QuickTest } from './components/QuickTest';
import { AiTest } from './components/AiTest';
import { healthCheck, fetchPrompts, fetchPersonas } from './api';
import type { Prompt, Persona, ComparisonResult } from './types';

type Tab = 'test' | 'ai-test' | 'prompts' | 'personas' | 'compare' | 'results';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('test');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(true);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personasLoading, setPersonasLoading] = useState(true);
  const [comparisonResult, setComparisonResult] =
    useState<ComparisonResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [health, setHealth] = useState<{
    supabase: boolean;
    openai: boolean;
  } | null>(null);

  // Load prompts from Supabase on mount
  useEffect(() => {
    fetchPrompts()
      .then((p) => setPrompts(p))
      .catch((err) => console.error('Failed to load prompts:', err))
      .finally(() => setPromptsLoading(false));
  }, []);

  // Load personas from Supabase on mount
  useEffect(() => {
    fetchPersonas()
      .then((p) => setPersonas(p))
      .catch((err) => console.error('Failed to load personas:', err))
      .finally(() => setPersonasLoading(false));
  }, []);

  // Check backend health on mount
  useEffect(() => {
    healthCheck()
      .then((h) => setHealth(h.env))
      .catch(() => setHealth(null));
  }, []);

  const handleComparisonComplete = (result: ComparisonResult) => {
    setComparisonResult(result);
    setActiveTab('results');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>📰 ArticleAI</h1>
            <p>Prompt Testing &amp; Comparison Tool</p>
          </div>
          {health && (
            <div className="health-status">
              <span className={health.supabase ? 'status-ok' : 'status-err'}>
                {health.supabase ? '✅' : '❌'} Supabase
              </span>
              <span className={health.openai ? 'status-ok' : 'status-err'}>
                {health.openai ? '✅' : '❌'} OpenAI
              </span>
            </div>
          )}
          {health === null && (
            <div className="health-status">
              <span className="status-err">⚠️ Backend not reachable</span>
            </div>
          )}
        </div>
      </header>

      <nav className="app-nav">
        <button
          className={activeTab === 'test' ? 'active' : ''}
          onClick={() => setActiveTab('test')}
        >
          🧪 DB Test
        </button>
        <button
          className={activeTab === 'ai-test' ? 'active' : ''}
          onClick={() => setActiveTab('ai-test')}
        >
          🤖 AI Test
        </button>
        <button
          className={activeTab === 'prompts' ? 'active' : ''}
          onClick={() => setActiveTab('prompts')}
        >
          📝 Prompts ({prompts.length})
        </button>
        <button
          className={activeTab === 'personas' ? 'active' : ''}
          onClick={() => setActiveTab('personas')}
        >
          🎭 Personas ({personas.length})
        </button>
        <button
          className={activeTab === 'compare' ? 'active' : ''}
          onClick={() => setActiveTab('compare')}
          disabled={prompts.length === 0}
        >
          ⚡ Compare
        </button>
        <button
          className={activeTab === 'results' ? 'active' : ''}
          onClick={() => setActiveTab('results')}
          disabled={!comparisonResult}
        >
          📊 Results
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'test' && <QuickTest />}
        {activeTab === 'ai-test' && <AiTest />}
        {activeTab === 'prompts' && (
          <PromptManager
            prompts={prompts}
            setPrompts={setPrompts}
            loading={promptsLoading}
          />
        )}
        {activeTab === 'personas' && (
          <PersonaManager
            personas={personas}
            setPersonas={setPersonas}
            loading={personasLoading}
          />
        )}
        {activeTab === 'compare' && (
          <ComparisonRunner
            prompts={prompts}
            onResult={handleComparisonComplete}
            isRunning={isRunning}
            setIsRunning={setIsRunning}
          />
        )}
        {activeTab === 'results' && comparisonResult && (
          <ResultsTable result={comparisonResult} prompts={prompts} />
        )}
      </main>
    </div>
  );
}

export default App;
