import React from 'react';
import { Smartphone, Monitor, RotateCcw } from 'lucide-react';
import type { FileMeta } from '../../types';

interface PreviewFrameProps {
  content: string;
  previewKey: number;
  viewport: 'full' | 'mobile';
  onRefresh: () => void;
  onToggleViewport: () => void;
  files?: FileMeta[];
  activeFileId?: string;
  onSwitchFile?: (fileId: string) => void;
}

export const PreviewFrame: React.FC<PreviewFrameProps> = ({
  content,
  previewKey,
  viewport,
  onRefresh,
  onToggleViewport,
  files = [],
  activeFileId,
  onSwitchFile,
}) => {
  const isMobile = viewport === 'mobile';
  const hasMultipleHtmlFiles = files && files.length > 1;

  return (
    <div className="flex-1 flex flex-col bg-sunken min-h-0 relative">
      {/* Top Preview Controls */}
      <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-line bg-surface/50 text-xs font-mono">
        <div className="flex items-center gap-2 text-muted-ink">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] uppercase tracking-wider">Preview Canvas</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleViewport}
            className="p-1.5 rounded-md text-muted-ink hover:text-ink hover:bg-hoverbg transition-colors flex items-center gap-1 text-[11px]"
            title={isMobile ? 'Switch to Full desktop view' : 'Switch to Mobile (390px) view'}
          >
            {isMobile ? <Monitor className="w-3.5 h-3.5 text-brand" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isMobile ? 'Desktop' : 'Mobile'}</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="p-1.5 rounded-md text-muted-ink hover:text-ink hover:bg-hoverbg transition-colors"
            title="Reload preview"
            aria-label="Reload preview"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 overflow-auto flex items-start justify-center bg-sunken p-0 sm:p-2">
        <div
          className={`transition-all duration-200 h-full ${
            isMobile
              ? 'w-[390px] max-w-full my-auto rounded-xl shadow-2xl overflow-hidden border border-line bg-black'
              : 'w-full h-full'
          }`}
        >
          <iframe
            key={previewKey}
            title="HTML preview"
            srcDoc={content || ''}
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
            className="w-full h-full bg-white border-0"
          />
        </div>
      </div>

      {/* File Switcher Tabs at bottom if project has multiple HTML files */}
      {hasMultipleHtmlFiles && onSwitchFile && (
        <div className="flex items-center gap-1 overflow-x-auto px-2 py-1.5 border-t border-line bg-sunken no-scrollbar">
          {files.map((f) => {
            const isActive = f.id === activeFileId;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSwitchFile(f.id)}
                className={`shrink-0 px-2.5 py-1 rounded-md font-mono text-xs truncate max-w-[140px] transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-brand text-brand-fg font-semibold'
                    : 'text-muted-ink hover:text-ink hover:bg-hoverbg'
                }`}
              >
                {f.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
