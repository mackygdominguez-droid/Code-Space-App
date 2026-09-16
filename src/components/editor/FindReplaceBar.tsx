import React, { useState, useMemo } from 'react';
import { Replace, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '../common/Button';

interface FindReplaceBarProps {
  open: boolean;
  onClose: () => void;
  content: string;
  setContent: (val: string) => void;
  taRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  open,
  onClose,
  content,
  setContent,
  taRef,
}) => {
  const [findStr, setFindStr] = useState('');
  const [replaceStr, setReplaceStr] = useState('');
  const [showReplace, setShowReplace] = useState(false);

  const matchCount = useMemo(() => {
    if (!findStr) return 0;
    return content.split(findStr).length - 1;
  }, [content, findStr]);

  if (!open) return null;

  const findNext = () => {
    const el = taRef.current;
    if (!el || !findStr) return;
    const pos = el.selectionEnd || 0;
    let nextIdx = content.indexOf(findStr, pos);
    if (nextIdx === -1) {
      nextIdx = content.indexOf(findStr, 0);
    }
    if (nextIdx !== -1) {
      el.focus();
      el.setSelectionRange(nextIdx, nextIdx + findStr.length);
    }
  };

  const findPrev = () => {
    const el = taRef.current;
    if (!el || !findStr) return;
    const pos = el.selectionStart || 0;
    let prevIdx = content.lastIndexOf(findStr, pos - findStr.length);
    if (prevIdx === -1) {
      prevIdx = content.lastIndexOf(findStr);
    }
    if (prevIdx !== -1) {
      el.focus();
      el.setSelectionRange(prevIdx, prevIdx + findStr.length);
    }
  };

  const handleReplaceOne = () => {
    const el = taRef.current;
    if (!el || !findStr) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end);

    if (selected === findStr) {
      const updated = content.substring(0, start) + replaceStr + content.substring(end);
      setContent(updated);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start, start + replaceStr.length);
        findNext();
      });
    } else {
      findNext();
    }
  };

  const handleReplaceAll = () => {
    if (!findStr) return;
    const updated = content.split(findStr).join(replaceStr);
    setContent(updated);
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-20 bg-sunken border-b border-line px-3 py-2 flex flex-col gap-2 font-mono text-xs shadow-md">
      {/* Find Row */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowReplace((prev) => !prev)}
          className={`p-1.5 rounded-md text-muted-ink hover:text-ink hover:bg-hoverbg transition-colors ${
            showReplace ? 'text-brand bg-brand/10' : ''
          }`}
          aria-label="Toggle replace"
          title="Toggle replace"
        >
          <Replace className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={findStr}
          onChange={(e) => setFindStr(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.shiftKey ? findPrev() : findNext();
            }
          }}
          placeholder="Find"
          className="h-8 flex-1 min-w-0 font-mono text-xs bg-surface border border-line rounded px-2.5 text-ink focus:outline-none focus:ring-1 focus:ring-brand"
        />

        <span className="font-mono text-[11px] text-muted-ink shrink-0 min-w-[4rem] text-right">
          {findStr ? `${matchCount} ${matchCount === 1 ? 'match' : 'matches'}` : '0 matches'}
        </span>

        <button
          type="button"
          onClick={findPrev}
          className="p-1.5 rounded text-muted-ink hover:text-ink hover:bg-hoverbg transition-colors"
          aria-label="Previous match"
          title="Previous match"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={findNext}
          className="p-1.5 rounded text-muted-ink hover:text-ink hover:bg-hoverbg transition-colors"
          aria-label="Next match"
          title="Next match"
        >
          <ChevronDown className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded text-muted-ink hover:text-ink hover:bg-hoverbg transition-colors"
          aria-label="Close"
          title="Close find"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Replace Row */}
      {showReplace && (
        <div className="flex items-center gap-2 pl-8">
          <input
            type="text"
            value={replaceStr}
            onChange={(e) => setReplaceStr(e.target.value)}
            placeholder="Replace"
            className="h-8 flex-1 min-w-0 font-mono text-xs bg-surface border border-line rounded px-2.5 text-ink focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <Button type="button" size="sm" variant="outline" onClick={handleReplaceOne}>
            Replace
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={handleReplaceAll}>
            All
          </Button>
        </div>
      )}
    </div>
  );
};
