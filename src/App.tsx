import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { PromptManager } from './components/PromptManager';
import { PersonaManager } from './components/PersonaManager';
import { PromptBuilder } from './components/PromptBuilder';
import { ComparisonRunner } from './components/ComparisonRunner';
import { ResultsTable } from './components/ResultsTable';
import { DirectTest } from './components/DirectTest';
import { SimulateArticle } from './components/SimulateArticle';
import { Settings } from './components/Settings';
import { TitlePromptLab } from './components/TitlePromptLab';
import { BodyPromptLab } from './components/BodyPromptLab';
import { TitleSuggestionBoxLab } from './components/TitleSuggestionBoxLab';
import { healthCheck, fetchPrompts, fetchPersonas } from './api';
import type { Prompt, Persona, ComparisonResult } from './types';

function App() {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(true);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personasLoading, setPersonasLoading] = useState(true);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [health, setHealth] = useState<{ supabase: boolean; openai: boolean } | null>(null);

  useEffect(() => {
    fetchPrompts()
      .then((p) => setPrompts(p))
      .catch((err) => console.error('Failed to load prompts:', err))
      .finally(() => setPromptsLoading(false));
  }, []);

  useEffect(() => {
    fetchPersonas()
      .then((p) => setPersonas(p))
      .catch((err) => console.error('Failed to load personas:', err))
      .finally(() => setPersonasLoading(false));
  }, []);

  useEffect(() => {
    healthCheck()
      .then((h) => setHealth(h.env))
      .catch(() => setHealth(null));
  }, []);

  const handleComparisonComplete = (result: ComparisonResult) => {
    setComparisonResult(result);
    navigate('/results');
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
            <NavLink
              to="/settings"
              title="Settings"
              style={({ isActive }) => ({
                background: isActive ? 'rgba(255,255,255,0.2)' : 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.5rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                lineHeight: 1,
                transition: 'background 0.15s ease',
                textDecoration: 'none',
              })}
            >
              ⚙️
            </NavLink>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <div className="nav-group">
          <span className="nav-group-label">Prompts</span>
          <div className="nav-group-items">
            <NavLink className={({ isActive }) => isActive ? 'active' : ''} to="/prompts">Prompts</NavLink>
            <NavLink className={({ isActive }) => isActive ? 'active' : ''} to="/brand-voices">Brand Voices</NavLink>
            <NavLink className={({ isActive }) => isActive ? 'active' : ''} to="/prompt-builder">Prompt Builder</NavLink>
          </div>
        </div>

        <div className="nav-group">
          <span className="nav-group-label">Direct Test</span>
          <div className="nav-group-items">
            <NavLink className={({ isActive }) => isActive ? 'active' : ''} to="/test">Single Article Test</NavLink>
            <NavLink
              className={({ isActive }) => isActive ? 'active' : (prompts.length === 0 ? 'disabled' : '')}
              to="/compare"
              onClick={(e) => { if (prompts.length === 0) e.preventDefault(); }}
            >
              Compare
            </NavLink>
            <NavLink
              className={({ isActive }) => isActive ? 'active' : (!comparisonResult ? 'disabled' : '')}
              to="/results"
              onClick={(e) => { if (!comparisonResult) e.preventDefault(); }}
            >
              Results
            </NavLink>
          </div>
        </div>

        <div className="nav-group">
          <span className="nav-group-label">Simulate Lantern</span>
          <div className="nav-group-items">
            <NavLink className={({ isActive }) => isActive ? 'active' : ''} to="/simulate">Simulate Article</NavLink>
          </div>
        </div>

        <div className="nav-group">
          <span className="nav-group-label">Labs</span>
          <div className="nav-group-items">
            <NavLink className={({ isActive }) => isActive ? 'active' : ''} to="/labs/title-prompts">Title Prompt Lab</NavLink>
            <NavLink className={({ isActive }) => isActive ? 'active' : ''} to="/labs/body-prompts">Body Prompt Lab</NavLink>
            <NavLink className={({ isActive }) => isActive ? 'active' : ''} to="/labs/title-ui">Title UI Lab</NavLink>
          </div>
        </div>
      </nav>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/simulate" replace />} />
          <Route path="/prompts" element={<PromptManager prompts={prompts} setPrompts={setPrompts} loading={promptsLoading} />} />
          <Route path="/brand-voices" element={<PersonaManager personas={personas} setPersonas={setPersonas} loading={personasLoading} />} />
          <Route path="/prompt-builder" element={<PromptBuilder prompts={prompts} personas={personas} />} />
          <Route path="/test" element={<DirectTest />} />
          <Route path="/compare" element={<ComparisonRunner prompts={prompts} onResult={handleComparisonComplete} isRunning={isRunning} setIsRunning={setIsRunning} />} />
          <Route path="/results" element={comparisonResult ? <ResultsTable result={comparisonResult} prompts={prompts} /> : <Navigate to="/compare" replace />} />
          <Route path="/simulate" element={<SimulateArticle />} />
          <Route path="/labs/title-prompts" element={<TitlePromptLab />} />
          <Route path="/labs/body-prompts" element={<BodyPromptLab />} />
          <Route path="/labs/title-ui" element={<TitleSuggestionBoxLab />} />
          <Route path="/settings" element={<Settings health={health} />} />
          <Route path="*" element={<Navigate to="/simulate" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
