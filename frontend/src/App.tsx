import { useState, useEffect } from 'react';
import { PromptManager } from './components/PromptManager';
import { PersonaManager } from './components/PersonaManager';
import { PromptBuilder } from './components/PromptBuilder';
import { ComparisonRunner } from './components/ComparisonRunner';
import { ResultsTable } from './components/ResultsTable';
import { DirectTest } from './components/DirectTest';
import { SimulateArticle } from './components/SimulateArticle';
import { Settings } from './components/Settings';
import { TitlePromptLab } from './components/TitlePromptLab';
import { healthCheck, fetchPrompts, fetchPersonas } from './api';
import type { Prompt, Persona, ComparisonResult } from './types';

type Tab = 'builder' | 'prompts' | 'personas' | 'single-test' | 'compare' | 'results' | 'settings' | 'simulate' | 'title-lab';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('builder');
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

  // Load brand voices from Supabase on mount
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
            <h1>📰 ArticleAI v0.1</h1>
            <p>Prompt Testing &amp; Comparison Tool</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
            <button
              className="settings-gear"
              onClick={() => setActiveTab('settings')}
              title="Settings"
              style={{
                background: activeTab === 'settings' ? 'rgba(255,255,255,0.2)' : 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.5rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                lineHeight: 1,
                transition: 'background 0.15s ease',
              }}
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <div className={`nav-group ${['prompts', 'personas', 'builder'].includes(activeTab) ? 'active' : ''}`}>
          <span className="nav-group-label">Prompts</span>
          <div className="nav-group-items">
            <button
              className={activeTab === 'prompts' ? 'active' : ''}
              onClick={() => setActiveTab('prompts')}
            >
              Prompts
            </button>
            <button
              className={activeTab === 'personas' ? 'active' : ''}
              onClick={() => setActiveTab('personas')}
            >
              Brand Voices
            </button>
            <button
              className={activeTab === 'builder' ? 'active' : ''}
              onClick={() => setActiveTab('builder')}
            >
              Prompt Builder
            </button>
          </div>
        </div>

        <div className={`nav-group ${['single-test', 'compare', 'results'].includes(activeTab) ? 'active' : ''}`}>
          <span className="nav-group-label">Direct Test</span>
          <div className="nav-group-items">
            <button
              className={activeTab === 'single-test' ? 'active' : ''}
              onClick={() => setActiveTab('single-test')}
            >
              Single Article Test
            </button>
            <button
              className={activeTab === 'compare' ? 'active' : ''}
              onClick={() => setActiveTab('compare')}
              disabled={prompts.length === 0}
            >
              Compare
            </button>
            <button
              className={activeTab === 'results' ? 'active' : ''}
              onClick={() => setActiveTab('results')}
              disabled={!comparisonResult}
            >
              Results
            </button>
          </div>
        </div>

        <div className={`nav-group ${activeTab === 'simulate' ? 'active' : ''}`}>
          <span className="nav-group-label">Simulate Lantern</span>
          <div className="nav-group-items">
            <button
              className={activeTab === 'simulate' ? 'active' : ''}
              onClick={() => setActiveTab('simulate')}
            >
              Simulate Article
            </button>
          </div>
        </div>

        <div className={`nav-group ${activeTab === 'title-lab' ? 'active' : ''}`}>
          <span className="nav-group-label">Labs</span>
          <div className="nav-group-items">
            <button
              className={activeTab === 'title-lab' ? 'active' : ''}
              onClick={() => setActiveTab('title-lab')}
            >
              Title Prompt Lab
            </button>
          </div>
        </div>
      </nav>

      <main className="app-main">
        {activeTab === 'builder' && (
          <PromptBuilder prompts={prompts} personas={personas} />
        )}
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
        {activeTab === 'single-test' && <DirectTest />}
        {activeTab === 'simulate' && <SimulateArticle />}
        {activeTab === 'title-lab' && <TitlePromptLab />}
        {activeTab === 'settings' && <Settings health={health} />}
      </main>
    </div>
  );
}

export default App;
