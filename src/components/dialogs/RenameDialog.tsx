import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from '../common/Button';

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  onSubmit: (name: string) => void;
}

export const RenameDialog: React.FC<RenameDialogProps> = ({
  open,
  onOpenChange,
  initialName = '',
  onSubmit,
}) => {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === initialName) {
      onOpenChange(false);
      return;
    }
    onSubmit(trimmed);
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Rename">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="rename-input" className="text-xs font-mono uppercase tracking-wider text-muted-ink">
            New Name
          </label>
          <input
            id="rename-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="flex h-10 w-full rounded-md border border-line bg-sunken px-3 py-1 font-mono text-sm text-ink placeholder:text-muted-ink focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || name.trim() === initialName}>
            Rename
          </Button>
        </div>
      </form>
    </Modal>
  );
};
