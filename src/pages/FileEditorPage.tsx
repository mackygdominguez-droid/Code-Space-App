import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Check,
  ClipboardPaste,
  FileJson,
  Download,
  Trash2,
  Code,
  Eye,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { ActionMenu } from '../components/common/ActionMenu';
import { useToast } from '../components/common/Toast';
import { CodeEditor } from '../components/editor/CodeEditor';
import { FindReplaceBar } from '../components/editor/FindReplaceBar';
import { PreviewFrame } from '../components/editor/PreviewFrame';
import { EditorToolbar } from '../components/editor/EditorToolbar';
import { NonPreviewFileView } from '../components/editor/NonPreviewFileView';
import { DeleteConfirmDialog } from '../components/dialogs/DeleteConfirmDialog';
import {
  getFileMeta,
  getProject,
  getFileContent,
  saveFileContent,
  deleteFileMeta,
  deleteFileContent,
  getProjectFiles,
  exportSingleFileJson,
  exportSingleFileRaw,
} from '../lib/db';
import type { FileMeta, Project, ActionItem } from '../types';

export const FileEditorPage: React.FC = () => {
  const { projectId, fileId } = useParams<{ projectId: string; fileId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [file, setFile] = useState<FileMeta | null>(null);
  const [allProjectFiles, setAllProjectFiles] = useState<FileMeta[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor content & undo/redo history
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(0);

  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Editor views
  const [activeTab, setActiveTab] = useState<'source' | 'preview'>('source');
  const [previewViewport, setPreviewViewport] = useState<'full' | 'mobile'>('full');
  const [previewKey, setPreviewKey] = useState(0);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isDirty = content !== savedContent;
  const isHtml = useMemo(() => {
    const name = file?.name?.toLowerCase() || '';
    return name.endsWith('.html') || name.endsWith('.htm');
  }, [file]);

  const htmlFiles = useMemo(
    () => allProjectFiles.filter((f) => f.name.endsWith('.html') || f.name.endsWith('.htm')),
    [allProjectFiles]
  );

  // Load File & Content
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!projectId || !fileId) return;
      setLoading(true);
      try {
        const [proj, meta, initialContent, projFiles] = await Promise.all([
          getProject(projectId),
          getFileMeta(fileId),
          getFileContent(fileId),
          getProjectFiles(projectId),
        ]);

        if (!mounted) return;
        if (!meta) {
          navigate(`/project/${projectId}`);
          return;
        }

        setProject(proj);
        setFile(meta);
        setAllProjectFiles(projFiles);
        setContent(initialContent || '');
        setSavedContent(initialContent || '');
        setHistory([initialContent || '']);
        setHistoryIdx(0);
      } catch {
        toast({ title: 'Error opening file', variant: 'destructive' });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [projectId, fileId]);

  // Content change with history recording
  const handleContentChange = useCallback((newVal: string) => {
    setContent(newVal);
    setHistory((prev) => {
      const next = prev.slice(0, historyIdx + 1);
      return [...next, newVal];
    });
    setHistoryIdx((prev) => prev + 1);
  }, [historyIdx]);

  const canUndo = historyIdx > 0;
  const canRedo = historyIdx < history.length - 1;

  const handleUndo = () => {
    if (canUndo) {
      const prevVal = history[historyIdx - 1];
      setHistoryIdx((i) => i - 1);
      setContent(prevVal);
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const nextVal = history[historyIdx + 1];
      setHistoryIdx((i) => i + 1);
      setContent(nextVal);
    }
  };

  // Save functionality
  const handleSave = async () => {
    if (!fileId || saving) return;
    setSaving(true);
    try {
      await saveFileContent(fileId, content);
      setSavedContent(content);
      setJustSaved(true);
      setPreviewKey((k) => k + 1);
      setTimeout(() => setJustSaved(false), 2000);
      toast({ title: 'Saved successfully' });
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut: Cmd+S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsFindOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, fileId, saving]);

  // Quick Action Handlers
  const handleCopyAll = () => {
    navigator.clipboard.writeText(content);
    toast({ title: 'Copied all code to clipboard' });
  };

  const handleCutAll = () => {
    navigator.clipboard.writeText(content);
    handleContentChange('');
    toast({ title: 'Cut all code' });
  };

  const handleDeleteSelection = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start !== end) {
      const updated = content.substring(0, start) + content.substring(end);
      handleContentChange(updated);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start;
      });
    } else {
      toast({ title: 'Select text to delete' });
    }
  };

  const handlePasteAll = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleContentChange(text);
        toast({ title: 'Pasted code' });
      }
    } catch {
      const manual = prompt('Paste your code here:');
      if (manual != null) {
        handleContentChange(manual);
      }
    }
  };

  const handleDeleteFile = async () => {
    if (!file) return;
    try {
      await deleteFileMeta(file.id);
      await deleteFileContent(file.id);
      toast({ title: 'File deleted' });
      navigate(`/project/${file.project_id}`);
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const headerActions: ActionItem[] = useMemo(() => {
    if (!file) return [];
    return [
      {
        label: 'Download as JSON',
        icon: FileJson,
        onClick: () => exportSingleFileJson(project, file),
      },
      {
        label: 'Download file',
        icon: Download,
        onClick: () => exportSingleFileRaw(file),
      },
      {
        label: 'Delete',
        icon: Trash2,
        variant: 'destructive',
        onClick: () => setIsDeleteOpen(true),
      },
    ];
  }, [project, file]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <p className="font-mono text-xs text-muted-ink">Loading CodeSpace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Top Header */}
      <header className="shrink-0 border-b border-line px-3 py-2 bg-surface/90 backdrop-blur-xs">
        <div className="flex items-center justify-between gap-2 max-w-full">
          {/* Left: Back & Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => navigate(`/project/${projectId}`)}
              className="p-1.5 -ml-1 text-muted-ink hover:text-ink transition-colors cursor-pointer rounded-md"
              aria-label="Back to project"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-mono text-sm font-semibold text-ink truncate">
                {file?.name || 'untitled'}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-brand/10 text-brand border border-brand/20 shrink-0">
                local
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile Tab Switcher */}
            <div className="flex md:hidden items-center bg-sunken p-0.5 rounded-md border border-line">
              <button
                type="button"
                onClick={() => setActiveTab('source')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  activeTab === 'source'
                    ? 'bg-surface text-ink font-semibold shadow-xs'
                    : 'text-muted-ink hover:text-ink'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Source</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-surface text-ink font-semibold shadow-xs'
                    : 'text-muted-ink hover:text-ink'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={handlePasteAll}
              className="hidden sm:inline-flex gap-1.5 text-xs h-8"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              Paste All
            </Button>

            <Button
              size="sm"
              variant={isDirty ? 'default' : 'outline'}
              onClick={handleSave}
              disabled={saving}
              className="gap-1.5 text-xs h-8 px-3"
            >
              {justSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </>
              )}
            </Button>

            <ActionMenu actions={headerActions} />
          </div>
        </div>
      </header>

      {/* Main Workspace: Split View on Desktop, Tabbed on Mobile */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left Side: Code Editor */}
        <div
          className={`flex-1 flex flex-col min-h-0 border-r border-line ${
            activeTab === 'source' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <div className="relative flex-1 flex flex-col min-h-0">
            <FindReplaceBar
              open={isFindOpen}
              onClose={() => setIsFindOpen(false)}
              content={content}
              setContent={handleContentChange}
              taRef={textareaRef}
            />

            <CodeEditor
              value={content}
              onChange={handleContentChange}
              saving={saving}
              innerRef={textareaRef}
            />
          </div>

          {/* Bottom Editor Toolbar & Quick Actions */}
          <div className="shrink-0 flex items-center justify-between px-3 py-1.5 bg-sunken border-t border-line text-xs font-mono">
            <EditorToolbar
              onCopyAll={handleCopyAll}
              onCutAll={handleCutAll}
              onDeleteSelection={handleDeleteSelection}
              onFindReplace={() => setIsFindOpen((prev) => !prev)}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
            />

            <div className="flex items-center gap-3 text-muted-ink text-[11px]">
              <span className="hidden sm:inline">
                {content.length} chars · {new Blob([content]).size} B
              </span>
              <button
                type="button"
                onClick={handlePasteAll}
                className="sm:hidden text-brand hover:underline font-semibold"
              >
                Paste All
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Live HTML Sandbox or Non-Preview View */}
        <div
          className={`flex-1 flex flex-col min-h-0 ${
            activeTab === 'preview' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {isHtml ? (
            <PreviewFrame
              content={content}
              previewKey={previewKey}
              viewport={previewViewport}
              onRefresh={() => setPreviewKey((k) => k + 1)}
              onToggleViewport={() =>
                setPreviewViewport((prev) => (prev === 'full' ? 'mobile' : 'full'))
              }
              files={htmlFiles}
              activeFileId={file?.id}
              onSwitchFile={(targetId) => navigate(`/project/${projectId}/file/${targetId}`)}
            />
          ) : (
            <NonPreviewFileView file={file} content={content} />
          )}
        </div>
      </div>

      {/* Delete File Dialog */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        itemName={file?.name}
        onConfirm={handleDeleteFile}
      />
    </div>
  );
};
