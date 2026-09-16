import React from 'react';
import { Copy, Scissors, Eraser, Search, Undo2, Redo2 } from 'lucide-react';

interface EditorToolbarProps {
  onCopyAll: () => void;
  onCutAll: () => void;
  onDeleteSelection: () => void;
  onFindReplace: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onCopyAll,
  onCutAll,
  onDeleteSelection,
  onFindReplace,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const btnClass =
    'p-2 rounded-md text-muted-ink hover:text-ink active:text-ink active:bg-hoverbg transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer';

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto">
      <button
        type="button"
        onClick={onCopyAll}
        className={btnClass}
        aria-label="Copy all"
        title="Copy all"
      >
        <Copy className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onCutAll}
        className={btnClass}
        aria-label="Cut all"
        title="Cut all"
      >
        <Scissors className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onDeleteSelection}
        className={btnClass}
        aria-label="Delete selection"
        title="Delete selection"
      >
        <Eraser className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onFindReplace}
        className={btnClass}
        aria-label="Find & replace"
        title="Find & replace"
      >
        <Search className="w-4 h-4" />
      </button>

      <span className="w-px h-5 bg-line mx-1 shrink-0" />

      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className={btnClass}
        aria-label="Undo"
        title="Undo"
      >
        <Undo2 className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className={btnClass}
        aria-label="Redo"
        title="Redo"
      >
        <Redo2 className="w-4 h-4" />
      </button>
    </div>
  );
};
