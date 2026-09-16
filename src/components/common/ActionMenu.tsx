import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import type { ActionItem } from '../../types';

export interface ActionMenuProps {
  actions: ActionItem[];
  className?: string;
  triggerClassName?: string;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ actions, className = '', triggerClassName = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`p-2 -mr-2 text-muted-ink hover:text-ink active:text-ink transition-colors rounded-md ${triggerClassName}`}
        aria-label="More options"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 rounded-md bg-surface border border-line shadow-xl py-1 z-40 focus:outline-none animate-in fade-in zoom-in-95 duration-100">
          {actions.map((action, index) => {
            const Icon = action.icon;
            const isDestructive = action.variant === 'destructive';
            return (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  action.onClick();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono text-left transition-colors cursor-pointer ${
                  isDestructive
                    ? 'text-red-400 hover:bg-red-950/40 hover:text-red-300'
                    : 'text-ink hover:bg-hoverbg'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
