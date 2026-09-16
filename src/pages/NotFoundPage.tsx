import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileQuestion } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 bg-background grid-bg text-center">
      <div className="w-16 h-16 rounded-xl bg-surface border border-line flex items-center justify-center mb-4 text-brand shadow-sm">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-semibold text-ink">Page Not Found</h1>
      <p className="text-xs text-muted-ink mt-2 max-w-sm">
        The project, folder, or file you requested could not be located.
      </p>
      <div className="mt-6">
        <Button onClick={() => navigate('/')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to CodeSpace
        </Button>
      </div>
    </div>
  );
};
