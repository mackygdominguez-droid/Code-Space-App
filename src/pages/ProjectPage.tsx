import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Folder as FolderIcon,
  FolderPlus,
  FileCode,
  FileText,
  Plus,
  Trash2,
  Pencil,
  Copy,
  FolderInput,
  Share2,
  FileJson,
  Download,
  Upload,
  CheckSquare,
  Check,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { ActionMenu } from '../components/common/ActionMenu';
import { BottomBar } from '../components/common/BottomBar';
import { useToast } from '../components/common/Toast';
import { NewFileDialog } from '../components/dialogs/NewFileDialog';
import { NewFolderDialog } from '../components/dialogs/NewFolderDialog';
import { RenameDialog } from '../components/dialogs/RenameDialog';
import { DeleteConfirmDialog } from '../components/dialogs/DeleteConfirmDialog';
import { MoveCopyFileDialog } from '../components/dialogs/MoveCopyFileDialog';
import { MoveFolderDialog } from '../components/dialogs/MoveFolderDialog';
import {
  getProject,
  getProjects,
  getProjectFolders,
  getAllFolders,
  getProjectFiles,
  getAllFiles,
  createFile,
  updateFileMeta,
  deleteFileMeta,
  deleteFileContent,
  getFileContent,
  saveFileContent,
  createFolder,
  updateFolder,
  deleteFolder,
  exportFolderOrProjectZip,
  exportFolderOrProjectJson,
  exportSingleFileRaw,
  exportSingleFileJson,
  deleteProject,
  deleteProjectFiles,
  deleteProjectFolders,
} from '../lib/db';
import type { Project, Folder, FileMeta, ActionItem, BreadcrumbSegment } from '../types';

export const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allFoldersList, setAllFoldersList] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Selection / Bulk mode
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dialog states
  const [isNewFileOpen, setIsNewFileOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: 'file' | 'folder' | 'project' | 'bulk' } | null>(null);
  const [moveCopyFileTarget, setMoveCopyFileTarget] = useState<{ file: FileMeta; mode: 'move' | 'copy' } | null>(null);
  const [moveFolderTarget, setMoveFolderTarget] = useState<Folder | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    if (!projectId) return;
    try {
      const [proj, flds, fls, projs, allFlds] = await Promise.all([
        getProject(projectId),
        getProjectFolders(projectId, 'name'),
        getProjectFiles(projectId, 'name'),
        getProjects(),
        getAllFolders(),
      ]);
      if (!proj) {
        navigate('/');
        return;
      }
      setProject(proj);
      setFolders(flds);
      setFiles(fls);
      setAllProjects(projs);
      setAllFoldersList(allFlds);
    } catch {
      toast({ title: 'Error loading project', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  // Filter items in current directory
  const currentFolders = useMemo(
    () => folders.filter((f) => (f.parent_folder_id || null) === currentFolderId),
    [folders, currentFolderId]
  );
  const currentFiles = useMemo(
    () => files.filter((f) => (f.parent_folder_id || null) === currentFolderId),
    [files, currentFolderId]
  );

  // Breadcrumbs calculation
  const breadcrumbs: BreadcrumbSegment[] = useMemo(() => {
    if (!project) return [];
    const crumbs: BreadcrumbSegment[] = [{ id: null, name: project.name }];
    if (!currentFolderId) return crumbs;

    const stack: BreadcrumbSegment[] = [];
    let curr = folders.find((f) => f.id === currentFolderId);
    while (curr) {
      stack.unshift({ id: curr.id, name: curr.name });
      curr = curr.parent_folder_id ? folders.find((f) => f.id === curr?.parent_folder_id) : undefined;
    }
    return [...crumbs, ...stack];
  }, [project, currentFolderId, folders]);

  const handleGoBack = () => {
    if (currentFolderId) {
      const current = folders.find((f) => f.id === currentFolderId);
      setCurrentFolderId(current?.parent_folder_id || null);
    } else {
      navigate('/');
    }
  };

  // Create Handlers
  const handleCreateFile = async (name: string) => {
    if (!projectId) return;
    try {
      const file = await createFile({
        name,
        project_id: projectId,
        parent_folder_id: currentFolderId,
      });
      await saveFileContent(file.id, '');
      toast({ title: 'File created' });
      setIsNewFileOpen(false);
      await loadData();
      navigate(`/project/${projectId}/file/${file.id}`);
    } catch {
      toast({ title: 'Failed to create file', variant: 'destructive' });
    }
  };

  const handleCreateFolder = async (name: string) => {
    if (!projectId) return;
    try {
      await createFolder({
        name,
        project_id: projectId,
        parent_folder_id: currentFolderId,
      });
      toast({ title: 'Folder created' });
      setIsNewFolderOpen(false);
      loadData();
    } catch {
      toast({ title: 'Failed to create folder', variant: 'destructive' });
    }
  };

  // Rename Handlers
  const handleRenameSubmit = async (newName: string) => {
    if (!renameTarget) return;
    try {
      if (renameTarget.type === 'file') {
        await updateFileMeta(renameTarget.id, { name: newName });
      } else {
        await updateFolder(renameTarget.id, { name: newName });
      }
      toast({ title: 'Renamed' });
      setRenameTarget(null);
      loadData();
    } catch {
      toast({ title: 'Rename failed', variant: 'destructive' });
    }
  };

  // Delete Handlers
  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'bulk') {
        for (const id of selectedIds) {
          const isF = files.some((f) => f.id === id);
          if (isF) {
            await deleteFileMeta(id);
            await deleteFileContent(id);
          } else {
            await deleteFolder(id);
          }
        }
        setSelectedIds(new Set());
        setIsSelectMode(false);
        toast({ title: 'Deleted selected items' });
      } else if (deleteTarget.type === 'file') {
        await deleteFileMeta(deleteTarget.id);
        await deleteFileContent(deleteTarget.id);
        toast({ title: 'File deleted' });
      } else if (deleteTarget.type === 'folder') {
        await deleteFolder(deleteTarget.id);
        toast({ title: 'Folder deleted' });
      } else if (deleteTarget.type === 'project' && projectId) {
        await deleteProjectFiles(projectId);
        await deleteProjectFolders(projectId);
        await deleteProject(projectId);
        toast({ title: 'Project deleted' });
        navigate('/');
        return;
      }
      setDeleteTarget(null);
      loadData();
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  // File Actions
  const handleDuplicateFile = async (file: FileMeta) => {
    try {
      const content = await getFileContent(file.id);
      const dotIdx = file.name.lastIndexOf('.');
      const base = dotIdx >= 0 ? file.name.slice(0, dotIdx) : file.name;
      const ext = dotIdx >= 0 ? file.name.slice(dotIdx) : '';
      const newName = `${base} copy${ext}`;

      const duplicated = await createFile({
        name: newName,
        project_id: file.project_id,
        parent_folder_id: file.parent_folder_id,
      });
      await saveFileContent(duplicated.id, content);
      toast({ title: 'File duplicated' });
      loadData();
    } catch {
      toast({ title: 'Duplicate failed', variant: 'destructive' });
    }
  };

  const handleMoveCopyFile = async (dest: { projectId: string; folderId: string | null }) => {
    if (!moveCopyFileTarget) return;
    const { file, mode } = moveCopyFileTarget;
    try {
      if (mode === 'move') {
        await updateFileMeta(file.id, {
          project_id: dest.projectId,
          parent_folder_id: dest.folderId,
        });
        toast({ title: 'Moved file' });
      } else {
        const content = await getFileContent(file.id);
        const copy = await createFile({
          name: file.name,
          project_id: dest.projectId,
          parent_folder_id: dest.folderId,
        });
        await saveFileContent(copy.id, content);
        toast({ title: 'Copied file' });
      }
      setMoveCopyFileTarget(null);
      loadData();
    } catch {
      toast({ title: 'Action failed', variant: 'destructive' });
    }
  };

  const handleMoveFolder = async (destinationFolderId: string | null) => {
    if (!moveFolderTarget) return;
    try {
      await updateFolder(moveFolderTarget.id, {
        parent_folder_id: destinationFolderId,
      });
      toast({ title: 'Moved folder' });
      setMoveFolderTarget(null);
      loadData();
    } catch {
      toast({ title: 'Move failed', variant: 'destructive' });
    }
  };

  const handleShareFile = (file: FileMeta) => {
    const url = `${window.location.origin}/project/${file.project_id}/file/${file.id}`;
    if (navigator.share) {
      navigator.share({ title: file.name, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard' });
    }
  };

  // Upload Handlers
  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!projectId || !e.target.files) return;
    try {
      const uploaded: File[] = Array.from(e.target.files);
      for (const f of uploaded) {
        const text = await f.text();
        const created = await createFile({
          name: f.name,
          project_id: projectId,
          parent_folder_id: currentFolderId,
        });
        await saveFileContent(created.id, text);
      }
      toast({ title: `Uploaded ${uploaded.length} file(s)` });
      loadData();
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      e.target.value = '';
    }
  };

  const handleUploadFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!projectId || !e.target.files) return;
    try {
      const uploaded: File[] = Array.from(e.target.files);
      const folderMap: Record<string, string> = {};

      for (const file of uploaded) {
        const relPath = (file as any).webkitRelativePath || file.name;
        const parts = relPath.split('/');
        const fileName = parts.pop() || file.name;

        let parentId = currentFolderId;
        let cumulative = '';

        for (const part of parts) {
          cumulative = cumulative ? `${cumulative}/${part}` : part;
          if (!folderMap[cumulative]) {
            const newF = await createFolder({
              name: part,
              project_id: projectId,
              parent_folder_id: parentId,
            });
            folderMap[cumulative] = newF.id;
          }
          parentId = folderMap[cumulative];
        }

        const text = await file.text();
        const createdFile = await createFile({
          name: fileName,
          project_id: projectId,
          parent_folder_id: parentId,
        });
        await saveFileContent(createdFile.id, text);
      }
      toast({ title: `Uploaded folder with ${uploaded.length} files` });
      loadData();
    } catch {
      toast({ title: 'Folder upload failed', variant: 'destructive' });
    } finally {
      e.target.value = '';
    }
  };

  // Action Menu Lists
  const headerActions: ActionItem[] = [
    {
      label: 'Select items',
      icon: CheckSquare,
      onClick: () => {
        setIsSelectMode(true);
        setSelectedIds(new Set());
      },
    },
    {
      label: 'Download as ZIP',
      icon: Download,
      onClick: () => {
        const name = breadcrumbs[breadcrumbs.length - 1]?.name || 'project';
        exportFolderOrProjectZip(name, currentFolderId, folders, files);
      },
    },
    {
      label: 'Download as JSON',
      icon: FileJson,
      onClick: () => exportFolderOrProjectJson(project, currentFolderId, folders, files),
    },
    {
      label: 'Upload file',
      icon: Upload,
      onClick: () => fileInputRef.current?.click(),
    },
    {
      label: 'Upload folder',
      icon: FolderPlus,
      onClick: () => folderInputRef.current?.click(),
    },
  ];

  const getFolderActions = (folder: Folder): ActionItem[] => [
    {
      label: 'Rename',
      icon: Pencil,
      onClick: () => setRenameTarget({ id: folder.id, name: folder.name, type: 'folder' }),
    },
    {
      label: 'Move folder',
      icon: FolderInput,
      onClick: () => setMoveFolderTarget(folder),
    },
    {
      label: 'Download as ZIP',
      icon: Download,
      onClick: () => exportFolderOrProjectZip(folder.name, folder.id, folders, files),
    },
    {
      label: 'Download as JSON',
      icon: FileJson,
      onClick: () => exportFolderOrProjectJson(project, folder.id, folders, files),
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: () => setDeleteTarget({ id: folder.id, name: folder.name, type: 'folder' }),
    },
  ];

  const getFileActions = (file: FileMeta): ActionItem[] => [
    {
      label: 'Rename',
      icon: Pencil,
      onClick: () => setRenameTarget({ id: file.id, name: file.name, type: 'file' }),
    },
    {
      label: 'Duplicate',
      icon: Copy,
      onClick: () => handleDuplicateFile(file),
    },
    {
      label: 'Move to',
      icon: FolderInput,
      onClick: () => setMoveCopyFileTarget({ file, mode: 'move' }),
    },
    {
      label: 'Copy to',
      icon: Copy,
      onClick: () => setMoveCopyFileTarget({ file, mode: 'copy' }),
    },
    {
      label: 'Share',
      icon: Share2,
      onClick: () => handleShareFile(file),
    },
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
      onClick: () => setDeleteTarget({ id: file.id, name: file.name, type: 'file' }),
    },
  ];

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const all = new Set<string>();
    currentFolders.forEach((f) => all.add(f.id));
    currentFiles.forEach((f) => all.add(f.id));
    setSelectedIds(all);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background grid-bg">
      {/* Header with Breadcrumb */}
      <header className="shrink-0 border-b border-line px-4 py-3 bg-surface/40 backdrop-blur-xs">
        <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
          <button
            type="button"
            onClick={handleGoBack}
            className="p-2 -ml-2 text-muted-ink hover:text-ink transition-colors cursor-pointer"
            aria-label="Go back"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Breadcrumb path */}
          <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-sm font-medium">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.id || 'root'}>
                  {idx > 0 && <ChevronRight className="w-4 h-4 text-muted-ink shrink-0" />}
                  <button
                    type="button"
                    onClick={() => setCurrentFolderId(crumb.id)}
                    className={`truncate cursor-pointer hover:underline ${
                      isLast ? 'text-ink font-semibold' : 'text-muted-ink hover:text-ink'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <ActionMenu actions={headerActions} />
        </div>
      </header>

      {/* Select Mode Bar */}
      {isSelectMode && (
        <div className="bg-sunken border-b border-line px-4 py-2 text-xs font-mono flex items-center justify-between max-w-4xl mx-auto w-full">
          <span className="text-muted-ink">
            {selectedIds.size} of {currentFolders.length + currentFiles.length} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-brand hover:underline cursor-pointer"
            >
              Select all
            </button>
            <span className="text-muted-ink">·</span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-muted-ink hover:text-ink cursor-pointer"
            >
              Deselect all
            </button>
          </div>
        </div>
      )}

      {/* Content List */}
      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-2 max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 rounded-md bg-surface animate-pulse border border-line" />
            ))}
          </div>
        ) : currentFolders.length === 0 && currentFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-16 h-16 rounded-md bg-surface border border-line flex items-center justify-center mb-4 text-muted-ink">
              <FolderIcon className="w-8 h-8" />
            </div>
            <h2 className="font-medium text-ink text-base">No files yet</h2>
            <p className="text-sm text-muted-ink mt-1">Tap below to create your first file or folder.</p>
          </div>
        ) : (
          <>
            {/* Folders */}
            {currentFolders.map((folder) => {
              const isSelected = selectedIds.has(folder.id);
              const subCount = files.filter((f) => f.parent_folder_id === folder.id).length;

              return (
                <div
                  key={folder.id}
                  className="flex items-stretch border border-line bg-surface rounded-md overflow-hidden hover:border-brand/40 transition-colors shadow-xs"
                >
                  {isSelectMode ? (
                    <button
                      type="button"
                      onClick={() => toggleSelect(folder.id)}
                      className="flex-1 flex items-center gap-3.5 p-3.5 text-left cursor-pointer hover:bg-hoverbg/50"
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          isSelected ? 'bg-brand border-brand text-brand-fg' : 'border-line bg-sunken'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <FolderIcon className="w-5 h-5 text-brand shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-ink truncate text-sm">{folder.name}</p>
                        <p className="text-xs text-muted-ink font-mono mt-0.5">
                          {subCount} {subCount === 1 ? 'file' : 'files'}
                        </p>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCurrentFolderId(folder.id)}
                      className="flex-1 flex items-center gap-3.5 p-3.5 active:bg-hoverbg hover:bg-hoverbg/50 transition-colors text-left cursor-pointer min-w-0"
                    >
                      <FolderIcon className="w-5 h-5 text-brand shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-ink truncate text-sm">{folder.name}</p>
                        <p className="text-xs text-muted-ink font-mono mt-0.5">
                          {subCount} {subCount === 1 ? 'file' : 'files'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-ink shrink-0" />
                    </button>
                  )}

                  {!isSelectMode && (
                    <div className="shrink-0 flex items-center pr-1 bg-surface">
                      <ActionMenu actions={getFolderActions(folder)} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Files */}
            {currentFiles.map((file) => {
              const isSelected = selectedIds.has(file.id);
              const isHtml = file.name.endsWith('.html') || file.name.endsWith('.htm');

              return (
                <div
                  key={file.id}
                  className="flex items-stretch border border-line bg-surface rounded-md overflow-hidden hover:border-brand/40 transition-colors shadow-xs"
                >
                  {isSelectMode ? (
                    <button
                      type="button"
                      onClick={() => toggleSelect(file.id)}
                      className="flex-1 flex items-center gap-3.5 p-3.5 text-left cursor-pointer hover:bg-hoverbg/50"
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          isSelected ? 'bg-brand border-brand text-brand-fg' : 'border-line bg-sunken'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      {isHtml ? (
                        <FileCode className="w-5 h-5 text-brand shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-muted-ink shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-ink truncate text-sm font-mono">{file.name}</p>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(`/project/${projectId}/file/${file.id}`)}
                      className="flex-1 flex items-center gap-3.5 p-3.5 active:bg-hoverbg hover:bg-hoverbg/50 transition-colors text-left cursor-pointer min-w-0"
                    >
                      {isHtml ? (
                        <FileCode className="w-5 h-5 text-brand shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-muted-ink shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-ink truncate text-sm font-mono">{file.name}</p>
                      </div>
                    </button>
                  )}

                  {!isSelectMode && (
                    <div className="shrink-0 flex items-center pr-1 bg-surface">
                      <ActionMenu actions={getFileActions(file)} />
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </main>

      {/* Bottom Bar */}
      <BottomBar>
        <div className="max-w-4xl mx-auto w-full">
          {isSelectMode ? (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsSelectMode(false);
                  setSelectedIds(new Set());
                }}
                className="flex-1 h-12"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={selectedIds.size === 0}
                onClick={() =>
                  setDeleteTarget({
                    id: 'bulk',
                    name: `${selectedIds.size} items`,
                    type: 'bulk',
                  })
                }
                className="flex-1 h-12 gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedIds.size})
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsNewFileOpen(true)}
                className="flex-1 h-12 text-sm sm:text-base gap-2 shadow-md"
              >
                <Plus className="w-5 h-5" />
                New File
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsNewFolderOpen(true)}
                className="flex-1 h-12 text-sm sm:text-base gap-2"
              >
                <FolderPlus className="w-5 h-5" />
                New Folder
              </Button>
            </div>
          )}
        </div>
      </BottomBar>

      {/* Hidden File / Folder Upload Inputs */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleUploadFiles}
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleUploadFolder}
        {...({ webkitdirectory: '', directory: '' } as any)}
        className="hidden"
      />

      {/* Dialogs */}
      <NewFileDialog
        open={isNewFileOpen}
        onOpenChange={setIsNewFileOpen}
        onSubmit={handleCreateFile}
      />

      <NewFolderDialog
        open={isNewFolderOpen}
        onOpenChange={setIsNewFolderOpen}
        onSubmit={handleCreateFolder}
      />

      <RenameDialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        initialName={renameTarget?.name}
        onSubmit={handleRenameSubmit}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={deleteTarget?.name}
        bulk={deleteTarget?.type === 'bulk'}
        onConfirm={handleDeleteSubmit}
      />

      <MoveCopyFileDialog
        open={!!moveCopyFileTarget}
        onOpenChange={(open) => !open && setMoveCopyFileTarget(null)}
        projects={allProjects}
        allFolders={allFoldersList}
        mode={moveCopyFileTarget?.mode}
        onConfirm={handleMoveCopyFile}
      />

      <MoveFolderDialog
        open={!!moveFolderTarget}
        onOpenChange={(open) => !open && setMoveFolderTarget(null)}
        folders={folders.filter((f) => f.id !== moveFolderTarget?.id)}
        projectName={project?.name}
        onConfirm={handleMoveFolder}
      />
    </div>
  );
};
