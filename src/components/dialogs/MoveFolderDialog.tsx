import React, { useState, useEffect, useMemo } from 'react';
import { Folder as FolderIcon, Check } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '../common/Button';
import type { Folder } from '../../types';

interface MoveFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: Folder[];
  projectName?: string;
  onConfirm: (destinationFolderId: string | null) => void;
}

export const MoveFolderDialog: React.FC<MoveFolderDialogProps> = ({
  open,
  onOpenChange,
  folders,
  projectName = 'Project',
  onConfirm,
}) => {
  const [selectedId, setSelectedId] = useState<string | null | 'unselected'>('unselected');

  useEffect(() => {
    if (open) setSelectedId('unselected');
  }, [open]);

  const options = useMemo(() => {
    const list = [{ id: null as string | null, label: `${projectName} (root)` }];

    folders.forEach((folder) => {
      const segments: string[] = [];
      let curr: Folder | undefined = folder;
      while (curr) {
        segments.unshift(curr.name);
        curr = curr.parent_folder_id
          ? folders.find((f) => f.id === curr?.parent_folder_id)
          : undefined;
      }
      list.push({
        id: folder.id,
        label: `${projectName} / ${segments.join(' / ')}`,
      });
    });

    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [folders, projectName]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Choose destination"
      description="Select where you want to place this folder"
      className="max-w-md"
    >
      <div className="space-y-4">
        <div className="max-h-[50vh] overflow-y-auto space-y-1 pr-1">
          {options.map((opt) => {
            const isSelected = selectedId === opt.id;
            return (
              <button
                key={opt.id || 'root'}
                type="button"
                onClick={() => setSelectedId(opt.id)}
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
            disabled={selectedId === 'unselected'}
            onClick={() => {
              if (selectedId !== 'unselected') {
                onConfirm(selectedId);
                onOpenChange(false);
              }
            }}
          >
            Move here
          </Button>
        </div>
      </div>
    </Modal>
  );
};
