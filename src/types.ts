import type React from 'react';

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_date: string;
  updated_date: string;
}

export interface Folder {
  id: string;
  name: string;
  project_id: string;
  parent_folder_id: string | null;
  created_date: string;
  updated_date: string;
}

export interface FileMeta {
  id: string;
  name: string;
  project_id: string;
  parent_folder_id: string | null;
  created_date: string;
  updated_date: string;
}

export interface ActionItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

export interface BreadcrumbSegment {
  id: string | null;
  name: string;
}

export interface DestinationOption {
  projectId: string;
  folderId: string | null;
  label: string;
}

export interface ExportData {
  version: number;
  exportedAt: string;
  projects: Project[];
  folders: Folder[];
  files: FileMeta[];
  content: Record<string, string>;
}
