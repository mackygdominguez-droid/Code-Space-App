import React, { useMemo } from 'react';
import { FileText, Download } from 'lucide-react';
import { Button } from '../common/Button';
import { exportSingleFileRaw } from '../../lib/db';
import type { FileMeta } from '../../types';

interface NonPreviewFileViewProps {
  file: FileMeta | null;
  content: string;
}

export const NonPreviewFileView: React.FC<NonPreviewFileViewProps> = ({ file, content }) => {
  const ext = useMemo(() => {
    const name = file?.name || '';
    const lastDot = name.lastIndexOf('.');
    return lastDot >= 0 ? name.slice(lastDot + 1).toUpperCase() : 'FILE';
  }, [file]);

  const sizeStr = useMemo(() => {
    const size = new Blob([content || '']).size;
    if (size < 1024) return `${size} B`;
    if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1048576).toFixed(1)} MB`;
  }, [content]);

  const handleDownload = () => {
    if (file) {
      exportSingleFileRaw(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-sunken min-h-0 overflow-y-auto">
      <div className="flex flex-col items-center justify-center text-center px-6 py-16 my-auto">
        <div className="w-20 h-20 rounded-xl bg-surface border border-line flex items-center justify-center mb-5 shadow-sm">
          <FileText className="w-10 h-10 text-brand" />
        </div>
        <h2 className="font-mono text-base font-semibold text-ink truncate max-w-full">
          {file?.name || 'File'}
        </h2>
        <p className="text-xs text-muted-ink font-mono uppercase tracking-wider mt-1">
          {ext} · {sizeStr}
        </p>
        <p className="text-sm text-muted-ink mt-4 max-w-xs leading-normal">
          This file type opens in your device or can be edited in the source editor.
        </p>
        <div className="mt-6">
          <Button variant="outline" onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};
