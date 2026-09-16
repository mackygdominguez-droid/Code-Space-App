import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from '../common/Button';

interface NewFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
}

export const NewFileDialog: React.FC<NewFileDialogProps> = ({ open, onOpenChange, onSubmit }) => {
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
    <Modal open={open} onOpenChange={onOpenChange} title="New File">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="file-name" className="text-xs font-mono uppercase tracking-wider text-muted-ink">
            File name
          </label>
          <input
            id="file-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="index.html, style.css, app.py"
            className="flex h-10 w-full rounded-md border border-line bg-sunken px-3 py-1 font-mono text-sm text-ink placeholder:text-muted-ink focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <p className="text-xs text-muted-ink">Any file type — type the full name with extension.</p>
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
