import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from '../common/Button';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName?: string;
  onConfirm: () => void;
  bulk?: boolean;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  itemName = '',
  onConfirm,
  bulk = false,
}) => {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (open) setConfirmText('');
  }, [open]);

  const canConfirm = bulk ? true : confirmText.trim().toLowerCase() === itemName.trim().toLowerCase();

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
      onOpenChange(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={bulk ? `Delete ${itemName}?` : `Delete "${itemName}"?`}
      description="This action cannot be undone."
    >
      <div className="space-y-4">
        {!bulk && (
          <div className="space-y-2">
            <p className="text-xs text-muted-ink">
              Please type <span className="font-mono text-ink font-semibold">{itemName}</span> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={itemName}
              className="flex h-10 w-full rounded-md border border-line bg-sunken px-3 py-1 font-mono text-sm text-ink placeholder:text-muted-ink focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
};
