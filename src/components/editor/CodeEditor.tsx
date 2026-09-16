import React, { useMemo, useRef } from 'react';
import { LoaderCircle } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  saving: boolean;
  innerRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, saving, innerRef }) => {
  const lineCount = useMemo(() => value.split('\n').length, [value]);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (lineNumbersRef.current && innerRef.current) {
      lineNumbersRef.current.scrollTop = innerRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const updated = value.substring(0, start) + '  ' + value.substring(end);
      onChange(updated);

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="relative flex-1 flex flex-col bg-surface min-h-0">
      {saving && (
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-4 py-2 bg-brand/10 border-b border-brand/40 text-brand text-[11px] font-mono uppercase tracking-wider">
          <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
          <span>Saving…</span>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          aria-hidden="true"
          className="shrink-0 overflow-hidden py-4 px-3 text-right bg-sunken border-r border-line font-mono text-[13px] leading-[1.6] text-muted-ink select-none min-w-[3rem]"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="leading-[1.6]">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={innerRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder='Tap "Paste All" to drop in code, or start typing...'
          className="flex-1 min-w-0 resize-none bg-surface p-4 font-mono text-[13px] leading-[1.6] text-ink outline-none border-0 placeholder:text-muted-ink selection:bg-brand/20 selection:text-ink whitespace-pre overflow-auto"
        />
      </div>
    </div>
  );
};
