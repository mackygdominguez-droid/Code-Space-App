import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Database, ShieldCheck, Info } from 'lucide-react';
import { Switch } from '../components/common/Switch';
import { getTheme, setTheme } from '../lib/theme';
import { useToast } from '../components/common/Toast';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(getTheme() === 'dark');
  }, []);

  const handleThemeToggle = (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light';
    setIsDark(checked);
    setTheme(newTheme);
    toast({ title: `${checked ? 'Dark' : 'Light'} theme applied` });
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background grid-bg">
      {/* Header */}
      <header className="shrink-0 border-b border-line px-4 py-4 bg-surface/40 backdrop-blur-xs">
        <div className="flex items-center gap-2 max-w-2xl mx-auto w-full">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 -ml-2 text-muted-ink hover:text-ink transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-ink tracking-tight">Settings</h1>
        </div>
      </header>

      {/* Main Settings Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full space-y-6">
        {/* Appearance Card */}
        <section className="bg-surface border border-line rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-md bg-sunken border border-line text-brand mt-0.5">
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="font-medium text-ink text-sm">Dark mode</h2>
                <p className="text-xs text-muted-ink mt-0.5">
                  Toggle between dark and light themes for the workspace and editor.
                </p>
              </div>
            </div>

            <Switch
              id="dark-mode-toggle"
              checked={isDark}
              onCheckedChange={handleThemeToggle}
            />
          </div>
        </section>

        {/* Local-first Storage Card */}
        <section className="bg-surface border border-line rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-sunken border border-line text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-medium text-ink text-sm">Local-First Storage</h2>
              <p className="text-xs text-muted-ink">Powered by browser IndexedDB</p>
            </div>
          </div>
          <p className="text-xs text-muted-ink leading-relaxed font-mono">
            All your code, projects, folders, and files are stored exclusively in your browser’s IndexedDB database (<code className="text-brand">codespace-db</code>). Everything runs client-side with complete offline capability. Nothing is tracked or sent to external servers.
          </p>
          <div className="flex items-center gap-2 pt-1 text-xs text-emerald-400 font-mono">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Private & Offline Ready</span>
          </div>
        </section>

        {/* About Card */}
        <section className="bg-surface border border-line rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-sunken border border-line text-brand">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-medium text-ink text-sm">About CodeSpace</h2>
              <p className="text-xs text-muted-ink font-mono">Version 1.0.0</p>
            </div>
          </div>
          <p className="text-xs text-muted-ink leading-relaxed">
            CodeSpace is an in-browser code editor and HTML live sandbox. Features include instant code execution, nested folder structures, find & replace, undo/redo history, ZIP and JSON export/import, and responsive mobile/desktop viewports.
          </p>
        </section>
      </main>
    </div>
  );
};
