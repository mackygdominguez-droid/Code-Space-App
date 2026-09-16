import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Settings, Download, FileJson, Upload, Plus, Folder, FolderOpen, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { ActionMenu } from '../components/common/ActionMenu';
import { BottomBar } from '../components/common/BottomBar';
import { useToast } from '../components/common/Toast';
import { NewProjectDialog } from '../components/dialogs/NewProjectDialog';
import { DeleteConfirmDialog } from '../components/dialogs/DeleteConfirmDialog';
import { RenameDialog } from '../components/dialogs/RenameDialog';
import {
  getProjects,
  getAllFiles,
  createProject,
  updateProject,
  deleteProject,
  deleteProjectFolders,
  deleteProjectFiles,
  exportAllZip,
  exportAllJson,
  getAllFolders,
  importJson,
  seedInitialDataIfNeeded,
} from '../lib/db';
import type { Project, ActionItem } from '../types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [renameTarget, setRenameTarget] = useState<Project | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      await seedInitialDataIfNeeded();
      const [projs, files] = await Promise.all([getProjects('-created_date'), getAllFiles()]);
      setProjects(projs);

      const counts: Record<string, number> = {};
      files.forEach((f) => {
        counts[f.project_id] = (counts[f.project_id] || 0) + 1;
      });
      setFileCounts(counts);
    } catch {
      toast({ title: 'Failed to load projects', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProject = async (name: string) => {
    try {
      const created = await createProject({ name });
      toast({ title: 'Project created' });
      setIsNewOpen(false);
      await loadData();
      navigate(`/project/${created.id}`);
    } catch {
      toast({ title: 'Failed to create project', variant: 'destructive' });
    }
  };

  const handleRenameProject = async (name: string) => {
    if (!renameTarget) return;
    try {
      await updateProject(renameTarget.id, { name });
      toast({ title: 'Renamed' });
      setRenameTarget(null);
      loadData();
    } catch {
      toast({ title: 'Rename failed', variant: 'destructive' });
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    try {
      const id = deleteTarget.id;
      await deleteProjectFiles(id);
      await deleteProjectFolders(id);
      await deleteProject(id);
      toast({ title: 'Project deleted' });
      setDeleteTarget(null);
      loadData();
    } catch {
      toast({ title: 'Failed to delete project', variant: 'destructive' });
    }
  };

  const handleExportZip = async () => {
    try {
      const [projs, folders, files] = await Promise.all([getProjects(), getAllFolders(), getAllFiles()]);
      await exportAllZip(projs, folders, files);
      toast({ title: 'Download started' });
    } catch {
      toast({ title: 'Download failed', variant: 'destructive' });
    }
  };

  const handleExportJson = async () => {
    try {
      const [projs, folders, files] = await Promise.all([getProjects(), getAllFolders(), getAllFiles()]);
      await exportAllJson(projs, folders, files);
      toast({ title: 'Download started' });
    } catch {
      toast({ title: 'Download failed', variant: 'destructive' });
    }
  };

  const handleImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        const result = await importJson(text);
        toast({ title: `Imported ${result.projects} project(s), ${result.files} file(s)` });
        loadData();
      } catch {
        toast({ title: 'Import failed', variant: 'destructive' });
      } finally {
        e.target.value = '';
      }
    }
  };

  const headerActions: ActionItem[] = [
    { label: 'Export all (ZIP)', icon: Download, onClick: handleExportZip },
    { label: 'Export all (JSON)', icon: FileJson, onClick: handleExportJson },
    { label: 'Import JSON', icon: Upload, onClick: () => fileInputRef.current?.click() },
  ];

  const getCardActions = (proj: Project): ActionItem[] => [
    { label: 'Rename', icon: Pencil, onClick: () => setRenameTarget(proj) },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteTarget(proj) },
  ];

  return (
    <div className="flex flex-col h-[100dvh] bg-background grid-bg">
      {/* Header */}
      <header className="shrink-0 border-b border-line px-4 py-4 bg-surface/40 backdrop-blur-xs">
        <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
          <div className="w-8 h-8 rounded-md bg-brand text-brand-fg flex items-center justify-center shrink-0 shadow-sm">
            <Terminal className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-ink tracking-tight truncate">CodeSpace</h1>
            <p className="text-xs text-muted-ink font-mono uppercase tracking-wider">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="p-2 -mr-1 text-muted-ink hover:text-ink transition-colors cursor-pointer"
            aria-label="Settings"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          <ActionMenu actions={headerActions} />
        </div>
      </header>

      {/* Main List */}
      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-2 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[68px] rounded-md bg-surface animate-pulse border border-line" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-16 h-16 rounded-md bg-surface border border-line flex items-center justify-center mb-4 text-muted-ink">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h2 className="font-medium text-ink text-base">No projects yet</h2>
            <p className="text-sm text-muted-ink mt-1">Create your first project to start coding.</p>
          </div>
        ) : (
          projects.map((proj) => {
            const count = fileCounts[proj.id] || 0;
            return (
              <div
                key={proj.id}
                className="flex items-stretch border border-line bg-surface rounded-md overflow-hidden hover:border-brand/40 transition-colors shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/project/${proj.id}`)}
                  className="flex-1 min-w-0 flex items-center gap-3.5 p-4 active:bg-hoverbg hover:bg-hoverbg/50 transition-colors text-left cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-md bg-sunken border border-line text-brand flex items-center justify-center shrink-0">
                    <Folder className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-ink truncate text-sm">{proj.name}</h3>
                    <p className="text-xs text-muted-ink font-mono uppercase tracking-wider mt-0.5">
                      {count} {count === 1 ? 'file' : 'files'}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-ink shrink-0" />
                </button>

                <div className="shrink-0 flex items-center pr-1 bg-surface">
                  <ActionMenu actions={getCardActions(proj)} />
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Bottom Bar */}
      <BottomBar>
        <div className="max-w-4xl mx-auto w-full">
          <Button onClick={() => setIsNewOpen(true)} className="w-full h-12 text-base gap-2 shadow-md">
            <Plus className="w-5 h-5" />
            New Project
          </Button>
        </div>
      </BottomBar>

      {/* Dialogs */}
      <NewProjectDialog
        open={isNewOpen}
        onOpenChange={setIsNewOpen}
        onSubmit={handleCreateProject}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={deleteTarget?.name}
        onConfirm={handleDeleteProject}
      />

      <RenameDialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        initialName={renameTarget?.name}
        onSubmit={handleRenameProject}
      />

      <input
        type="file"
        accept=".json,application/json"
        ref={fileInputRef}
        onChange={handleImportJsonFile}
        className="hidden"
      />
    </div>
  );
};
