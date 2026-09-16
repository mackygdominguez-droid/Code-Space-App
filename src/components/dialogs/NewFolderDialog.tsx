import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from '../common/Button';

interface NewFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
}

export const NewFolderDialog: React.FC<NewFolderDialogProps> = ({ open, onOpenChange, onSubmit }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setName('');
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onSubmit(trimmed);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="New Folder">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="folder-name" className="text-xs font-mono uppercase tracking-wider text-muted-ink">
            Folder name
          </label>
          <input
            id="folder-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="components, styles, assets"
            className="flex h-10 w-full rounded-md border border-line bg-sunken px-3 py-1 font-mono text-sm text-ink placeholder:text-muted-ink focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim()}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
};
