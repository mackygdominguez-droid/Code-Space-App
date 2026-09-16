import React, { useState, useEffect, useMemo } from 'react';
import { Folder as FolderIcon, Check } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '../common/Button';
import type { Project, Folder, DestinationOption } from '../../types';

interface MoveCopyFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  allFolders: Folder[];
  mode?: 'copy' | 'move';
  onConfirm: (dest: { projectId: string; folderId: string | null }) => void;
}

export const MoveCopyFileDialog: React.FC<MoveCopyFileDialogProps> = ({
  open,
  onOpenChange,
  projects,
  allFolders,
  mode = 'move',
  onConfirm,
}) => {
  const [selected, setSelected] = useState<DestinationOption | null>(null);

  useEffect(() => {
    if (open) setSelected(null);
  }, [open]);

  const options: DestinationOption[] = useMemo(() => {
    const list: DestinationOption[] = [];
    (projects || []).forEach((proj) => {
      list.push({
        projectId: proj.id,
        folderId: null,
        label: `${proj.name} (root)`,
      });

      const projFolders = (allFolders || []).filter((f) => f.project_id === proj.id);
      projFolders.forEach((folder) => {
        const segments: string[] = [];
        let curr: Folder | undefined = folder;
        while (curr) {
          segments.unshift(curr.name);
          curr = curr.parent_folder_id
            ? projFolders.find((f) => f.id === curr?.parent_folder_id)
            : undefined;
        }
        list.push({
          projectId: proj.id,
          folderId: folder.id,
          label: `${proj.name} / ${segments.join(' / ')}`,
        });
      });
    });
    return list;
  }, [projects, allFolders]);

  const keyFor = (opt: { projectId: string; folderId: string | null }) =>
    `${opt.projectId}:${opt.folderId || 'root'}`;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'copy' ? 'Copy to' : 'Move to'}
      description="Choose a destination project or folder"
      className="max-w-md"
    >
      <div className="space-y-4">
        <div className="max-h-[55vh] overflow-y-auto space-y-1 pr-1">
          {options.map((opt) => {
            const isSelected = selected && keyFor(selected) === keyFor(opt);
            return (
              <button
                key={keyFor(opt)}
                type="button"
                onClick={() => setSelected(opt)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md transition-colors ${
                  isSelected
                    ? 'bg-hoverbg text-ink ring-1 ring-brand/50'
                    : 'text-muted-ink hover:bg-hoverbg hover:text-ink'
                }`}
              >
                <FolderIcon className="w-4 h-4 shrink-0 text-brand" />
                <span className="flex-1 min-w-0 truncate font-mono text-xs">{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-brand shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!selected}
            onClick={() => {
              if (selected) {
                onConfirm({ projectId: selected.projectId, folderId: selected.folderId });
                onOpenChange(false);
              }
            }}
          >
            {mode === 'copy' ? 'Copy here' : 'Move here'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
