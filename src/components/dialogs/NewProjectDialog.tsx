import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from '../common/Button';

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
}

export const NewProjectDialog: React.FC<NewProjectDialogProps> = ({ open, onOpenChange, onSubmit }) => {
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
    <Modal open={open} onOpenChange={onOpenChange} title="New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="project-name" className="text-xs font-mono uppercase tracking-wider text-muted-ink">
            Project Name
          </label>
          <input
            id="project-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="My project"
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
