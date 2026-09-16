import React from 'react';

export const BottomBar: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`shrink-0 bg-sunken/95 backdrop-blur-sm border-t border-line px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${className}`}
    >
      {children}
    </div>
  );
};
