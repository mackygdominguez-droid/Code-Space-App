import JSZip from 'jszip';
import type { Project, Folder, FileMeta, ExportData } from '../types';

const DB_NAME = 'codespace-db';
const DB_VERSION = 2;
const STORE_FILES = 'files';
const STORE_PROJECTS = 'projects';
const STORE_FOLDERS = 'folders';
const STORE_FILEMETA = 'filemeta';

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_FILES)) {
          db.createObjectStore(STORE_FILES);
        }
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_FOLDERS)) {
          db.createObjectStore(STORE_FOLDERS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_FILEMETA)) {
          db.createObjectStore(STORE_FILEMETA, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

const getISOString = () => new Date().toISOString();

function sortByField<T extends Record<string, any>>(list: T[], sortKey?: string): T[] {
  if (!sortKey) return list;
  const isDesc = sortKey.startsWith('-');
  const key = isDesc ? sortKey.slice(1) : sortKey;
  const sorted = [...list].sort((a, b) => {
    const valA = a[key];
    const valB = b[key];
    if (valA == null) return 1;
    if (valB == null) return -1;
    return valA < valB ? -1 : valA > valB ? 1 : 0;
  });
  return isDesc ? sorted.reverse() : sorted;
}

async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve((request.result as T[]) || []);
    request.onerror = () => reject(request.error);
  });
}

async function getFromStore<T>(storeName: string, id: string): Promise<T | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve((request.result as T) || null);
    request.onerror = () => reject(request.error);
  });
}

async function putToStore<T>(storeName: string, value: T): Promise<T> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.put(value);
    tx.oncomplete = () => resolve(value);
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteFromStore(storeName: string, id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// File Content Store (key-value)
export async function getFileContent(fileId: string): Promise<string> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FILES, 'readonly');
    const store = tx.objectStore(STORE_FILES);
    const req = store.get(fileId);
    req.onsuccess = () => resolve((req.result as string) || '');
    req.onerror = () => reject(req.error);
  });
}

export async function saveFileContent(fileId: string, content: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FILES, 'readwrite');
    const store = tx.objectStore(STORE_FILES);
    store.put(content, fileId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteFileContent(fileId: string): Promise<void> {
  return deleteFromStore(STORE_FILES, fileId);
}

// Projects
export async function getProjects(sort?: string): Promise<Project[]> {
  const projects = await getAllFromStore<Project>(STORE_PROJECTS);
  return sortByField(projects, sort);
}

export async function getProject(id: string): Promise<Project | null> {
  return getFromStore<Project>(STORE_PROJECTS, id);
}

export async function createProject(data: { name: string; description?: string; id?: string }): Promise<Project> {
  const now = getISOString();
  const project: Project = {
    id: data.id || generateUUID(),
    name: data.name,
    description: data.description || '',
    created_date: now,
    updated_date: now,
  };
  await putToStore(STORE_PROJECTS, project);
  return project;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  const existing = await getProject(id);
  if (!existing) return null;
  const updated: Project = {
    ...existing,
    ...updates,
    id,
    updated_date: getISOString(),
  };
  await putToStore(STORE_PROJECTS, updated);
  return updated;
}

export async function deleteProject(id: string): Promise<void> {
  return deleteFromStore(STORE_PROJECTS, id);
}

// Folders
export async function getProjectFolders(projectId: string, sort?: string): Promise<Folder[]> {
  const all = await getAllFromStore<Folder>(STORE_FOLDERS);
  const filtered = all.filter((f) => f.project_id === projectId);
  return sortByField(filtered, sort);
}

export async function getAllFolders(): Promise<Folder[]> {
  return getAllFromStore<Folder>(STORE_FOLDERS);
}

export async function createFolder(data: {
  name: string;
  project_id: string;
  parent_folder_id?: string | null;
  id?: string;
}): Promise<Folder> {
  const now = getISOString();
  const folder: Folder = {
    id: data.id || generateUUID(),
    name: data.name,
    project_id: data.project_id,
    parent_folder_id: data.parent_folder_id || null,
    created_date: now,
    updated_date: now,
  };
  await putToStore(STORE_FOLDERS, folder);
  return folder;
}

export async function updateFolder(id: string, updates: Partial<Folder>): Promise<Folder | null> {
  const existing = await getFromStore<Folder>(STORE_FOLDERS, id);
  if (!existing) return null;
  const updated: Folder = {
    ...existing,
    ...updates,
    id,
    updated_date: getISOString(),
  };
  await putToStore(STORE_FOLDERS, updated);
  return updated;
}

export async function deleteFolder(id: string): Promise<void> {
  return deleteFromStore(STORE_FOLDERS, id);
}

export async function deleteProjectFolders(projectId: string): Promise<void> {
  const all = await getAllFolders();
  for (const f of all) {
    if (f.project_id === projectId) {
      await deleteFolder(f.id);
    }
  }
}

// Files (Meta)
export async function getFileMeta(id: string): Promise<FileMeta | null> {
  return getFromStore<FileMeta>(STORE_FILEMETA, id);
}

export async function getProjectFiles(projectId: string, sort?: string): Promise<FileMeta[]> {
  const all = await getAllFromStore<FileMeta>(STORE_FILEMETA);
  const filtered = all.filter((f) => f.project_id === projectId);
  return sortByField(filtered, sort);
}

export async function getAllFiles(): Promise<FileMeta[]> {
  return getAllFromStore<FileMeta>(STORE_FILEMETA);
}

export async function createFile(data: {
  name: string;
  project_id: string;
  parent_folder_id?: string | null;
  id?: string;
}): Promise<FileMeta> {
  const now = getISOString();
  const file: FileMeta = {
    id: data.id || generateUUID(),
    name: data.name,
    project_id: data.project_id,
    parent_folder_id: data.parent_folder_id || null,
    created_date: now,
    updated_date: now,
  };
  await putToStore(STORE_FILEMETA, file);
  return file;
}

export async function updateFileMeta(id: string, updates: Partial<FileMeta>): Promise<FileMeta | null> {
  const existing = await getFileMeta(id);
  if (!existing) return null;
  const updated: FileMeta = {
    ...existing,
    ...updates,
    id,
    updated_date: getISOString(),
  };
  await putToStore(STORE_FILEMETA, updated);
  return updated;
}

export async function deleteFileMeta(id: string): Promise<void> {
  return deleteFromStore(STORE_FILEMETA, id);
}

export async function deleteProjectFiles(projectId: string): Promise<void> {
  const all = await getAllFiles();
  for (const f of all) {
    if (f.project_id === projectId) {
      await deleteFileMeta(f.id);
      await deleteFileContent(f.id);
    }
  }
}

// Helper: Sanitize name for downloads
export function sanitizeFilename(name: string): string {
  return (name || 'untitled').replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Helper: Trigger Browser Download
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export / Import logic
export async function buildFolderZip(
  zipFolder: JSZip | null,
  currentFolderId: string | null,
  folders: Folder[],
  files: FileMeta[]
): Promise<void> {
  if (!zipFolder) return;

  // Add files in this folder
  const currentFiles = files.filter((f) => (f.parent_folder_id || null) === currentFolderId);
  for (const file of currentFiles) {
    const content = await getFileContent(file.id);
    zipFolder.file(file.name, content);
  }

  // Add child folders recursively
  const childFolders = folders.filter((f) => (f.parent_folder_id || null) === currentFolderId);
  for (const child of childFolders) {
    const subZip = zipFolder.folder(sanitizeFilename(child.name));
    await buildFolderZip(subZip, child.id, folders, files);
  }
}

export async function exportAllZip(projects: Project[], folders: Folder[], files: FileMeta[]): Promise<void> {
  const zip = new JSZip();
  for (const proj of projects) {
    const projFolders = folders.filter((f) => f.project_id === proj.id);
    const projFiles = files.filter((f) => f.project_id === proj.id);
    const sub = zip.folder(sanitizeFilename(proj.name));
    await buildFolderZip(sub, null, projFolders, projFiles);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob('codespace-export.zip', blob);
}

export async function exportFolderOrProjectZip(
  name: string,
  folderId: string | null,
  folders: Folder[],
  files: FileMeta[]
): Promise<void> {
  const zip = new JSZip();
  const root = zip.folder(sanitizeFilename(name));
  await buildFolderZip(root, folderId || null, folders, files);
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(`${sanitizeFilename(name)}.zip`, blob);
}

function getSubtree(folderId: string | null, allFolders: Folder[], allFiles: FileMeta[]) {
  if (!folderId) {
    return { folders: [...allFolders], files: [...allFiles] };
  }
  const root = allFolders.find((f) => f.id === folderId);
  const folderIds = new Set<string>([folderId]);
  const includedFolders = root ? [root] : [];
  let queue = [folderId];

  while (queue.length > 0) {
    const nextQueue: string[] = [];
    allFolders.forEach((f) => {
      if (queue.includes(f.parent_folder_id || '') && !folderIds.has(f.id)) {
        folderIds.add(f.id);
        includedFolders.push(f);
        nextQueue.push(f.id);
      }
    });
    queue = nextQueue;
  }

  const includedFiles = allFiles.filter((f) => f.parent_folder_id && folderIds.has(f.parent_folder_id));
  return { folders: includedFolders, files: includedFiles };
}

async function generateJsonPayload(projects: Project[], folders: Folder[], files: FileMeta[]): Promise<string> {
  const contentMap: Record<string, string> = {};
  for (const f of files) {
    contentMap[f.id] = await getFileContent(f.id);
  }
  const payload: ExportData = {
    version: 2,
    exportedAt: new Date().toISOString(),
    projects,
    folders,
    files,
    content: contentMap,
  };
  return JSON.stringify(payload, null, 2);
}

export async function exportAllJson(projects: Project[], folders: Folder[], files: FileMeta[]): Promise<void> {
  const json = await generateJsonPayload(projects, folders, files);
  downloadBlob('codespace-export.json', new Blob([json], { type: 'application/json' }));
}

export async function exportFolderOrProjectJson(
  project: Project | null,
  folderId: string | null,
  allFolders: Folder[],
  allFiles: FileMeta[]
): Promise<void> {
  const { folders, files } = getSubtree(folderId, allFolders, allFiles);
  const currentFolder = folderId ? allFolders.find((f) => f.id === folderId) : null;
  const name = currentFolder ? currentFolder.name : project?.name || 'project';
  const json = await generateJsonPayload(project ? [project] : [], folders, files);
  downloadBlob(`${sanitizeFilename(name)}.json`, new Blob([json], { type: 'application/json' }));
}

export async function exportSingleFileJson(project: Project | null, file: FileMeta): Promise<void> {
  const content = await getFileContent(file.id);
  const payload: ExportData = {
    version: 2,
    exportedAt: new Date().toISOString(),
    projects: project ? [project] : [],
    folders: [],
    files: [file],
    content: { [file.id]: content },
  };
  downloadBlob(`${sanitizeFilename(file.name)}.json`, new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
}

export async function exportSingleFileRaw(file: FileMeta): Promise<void> {
  const content = await getFileContent(file.id);
  downloadBlob(file.name, new Blob([content || ''], { type: 'text/plain' }));
}

export async function importJson(jsonString: string): Promise<{ projects: number; folders: number; files: number }> {
  const data: Partial<ExportData> = JSON.parse(jsonString);
  const rawProjects = data.projects || [];
  const rawFolders = data.folders || [];
  const rawFiles = data.files || [];
  const contentMap = data.content || {};

  const projectIdMap: Record<string, string> = {};
  for (const p of rawProjects) {
    const created = await createProject({ name: p.name, description: p.description });
    projectIdMap[p.id] = created.id;
  }

  const folderIdMap: Record<string, string> = {};
  const queue = [...rawFolders];
  let safetyCounter = 0;
  while (queue.length > 0 && safetyCounter++ < 2000) {
    for (let i = queue.length - 1; i >= 0; i--) {
      const f = queue[i];
      const targetProjectId = projectIdMap[f.project_id];
      if (!targetProjectId) {
        queue.splice(i, 1);
        continue;
      }
      if (!f.parent_folder_id || folderIdMap[f.parent_folder_id]) {
        const parentId = f.parent_folder_id ? folderIdMap[f.parent_folder_id] : null;
        const created = await createFolder({
          name: f.name,
          project_id: targetProjectId,
          parent_folder_id: parentId,
        });
        folderIdMap[f.id] = created.id;
        queue.splice(i, 1);
      }
    }
  }

  let fileCount = 0;
  for (const f of rawFiles) {
    const targetProjectId = projectIdMap[f.project_id];
    if (!targetProjectId) continue;
    const parentId = f.parent_folder_id ? folderIdMap[f.parent_folder_id] || null : null;
    const created = await createFile({
      name: f.name,
      project_id: targetProjectId,
      parent_folder_id: parentId,
    });
    const content = contentMap[f.id] || '';
    await saveFileContent(created.id, content);
    fileCount++;
  }

  return {
    projects: rawProjects.length,
    folders: rawFolders.length,
    files: fileCount,
  };
}

// Initial Data Seeding
export async function seedInitialDataIfNeeded(): Promise<void> {
  const existingProjects = await getProjects();
  const targetProjectId = 'bc669da2-5b17-46f9-b13e-a4efaae7d886';
  const targetFileId = 'f337c429-fb68-48b4-b3ca-42caad9945a1';

  const hasTargetProject = existingProjects.some((p) => p.id === targetProjectId);

  if (hasTargetProject) {
    // Already seeded
    return;
  }

  if (existingProjects.length === 0) {
    // Seed the target project and starter files
    const proj = await createProject({
      id: targetProjectId,
      name: 'Welcome to CodeSpace',
      description: 'Your offline-first browser workspace and HTML sandbox',
    });

    // Create index.html (the file matching user URL)
    const indexHtml = await createFile({
      id: targetFileId,
      name: 'index.html',
      project_id: proj.id,
      parent_folder_id: null,
    });

    const sampleHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeSpace Demo</title>
  <style>
    :root {
      --bg: #0d0f15;
      --card: #161922;
      --text: #f1f5f9;
      --muted: #94a3b8;
      --brand: #06b6d4;
      --accent: #10b981;
    }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 24px;
      box-sizing: border-box;
      background-image: radial-gradient(circle at 50% 30%, #1e293b 0%, #0d0f15 70%);
    }
    .card {
      background: var(--card);
      border: 1px solid #262a36;
      border-radius: 16px;
      padding: 36px 32px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: rgba(6, 182, 212, 0.12);
      border: 1px solid rgba(6, 182, 212, 0.3);
      color: var(--brand);
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 12px;
      letter-spacing: -0.02em;
    }
    p {
      color: var(--muted);
      line-height: 1.6;
      margin: 0 0 24px;
      font-size: 15px;
    }
    .counter-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    button {
      background: var(--brand);
      color: #0d0f15;
      border: none;
      font-weight: 600;
      font-size: 14px;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    .count {
      font-size: 24px;
      font-weight: 700;
      min-width: 48px;
      font-family: monospace;
    }
    .features {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      text-align: left;
      margin-top: 24px;
      border-top: 1px solid #262a36;
      padding-top: 20px;
    }
    .feat {
      font-size: 13px;
      color: var(--muted);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .feat span {
      color: var(--accent);
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
      Live Preview Active
    </div>
    <h1>Welcome to CodeSpace</h1>
    <p>Edit this code in the Source tab and see changes update immediately in real-time. Full offline storage powered by IndexedDB.</p>
    
    <div class="counter-box">
      <button onclick="decrement()">-</button>
      <span class="count" id="counter">0</span>
      <button onclick="increment()">+</button>
    </div>

    <div class="features">
      <div class="feat"><span>✓</span> Offline-first</div>
      <div class="feat"><span>✓</span> Instant Preview</div>
      <div class="feat"><span>✓</span> ZIP/JSON Export</div>
      <div class="feat"><span>✓</span> Nested Folders</div>
    </div>
  </div>

  <script>
    let count = 0;
    const el = document.getElementById('counter');
    function increment() {
      count++;
      el.textContent = count;
    }
    function decrement() {
      count--;
      el.textContent = count;
    }
  </script>
</body>
</html>`;

    await saveFileContent(indexHtml.id, sampleHtmlContent);

    // Create a style.css file
    const cssFile = await createFile({
      name: 'styles.css',
      project_id: proj.id,
      parent_folder_id: null,
    });
    await saveFileContent(
      cssFile.id,
      `/* CodeSpace Styles */\nbody {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n`
    );

    // Create a README.md file
    const readmeFile = await createFile({
      name: 'README.md',
      project_id: proj.id,
      parent_folder_id: null,
    });
    await saveFileContent(
      readmeFile.id,
      `# CodeSpace\n\nWelcome to your offline-first code space. You can create files, folders, and preview HTML directly in your browser.`
    );
  }
}
