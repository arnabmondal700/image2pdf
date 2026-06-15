import { Injectable } from '@angular/core';
import Dexie, { type Table } from 'dexie';

/**
 * Database schema for IndexedDB persistence
 *
 * Tables:
 * - pdfSettings: Stores PDF settings per tool (keyed by toolId)
 * - sessionFiles: Stores uploaded FileObject arrays per session
 * - mixedBuilderItems: Stores DocumentItem arrays for the mixed builder
 * - workspaceSessions: Stores active workspace session metadata
 */
export interface StoredPdfSettings {
  toolId: string;
  settings: Record<string, unknown>;
  updatedAt: number;
}

export interface StoredSessionFile {
  id?: number;
  sessionId: string;
  name: string;
  url: string;
  size: number;
  type: string;
  fileType?: 'image' | 'pdf';
  rotation?: number;
}

export interface StoredMixedBuilderItem {
  id?: number;
  sessionId: string;
  itemId: string;
  name: string;
  type: 'image' | 'pdf-page';
  order: number;
  rotation?: number;
  selected?: boolean;
  mimeType?: string;
  width?: number;
  height?: number;
  /** Serialized thumbnail data URL */
  thumbnail?: string;
  /** Serialized file data (base64 data URL for images, blob URL ref) */
  url?: string;
  /** Original PDF filename for pdf-page items */
  originalPdfName?: string;
  pdfPageIndex?: number;
  sourcePdfPageCount?: number;
}

export interface WorkspaceSession {
  id: string;
  toolId: string;
  label: string;
  createdAt: number;
  updatedAt: number;
  /** Number of files in the session */
  fileCount: number;
  /** Total size of all files in bytes */
  totalSize: number;
}

@Injectable({
  providedIn: 'root',
})
export class IndexedDbService extends Dexie {
  pdfSettings!: Table<StoredPdfSettings, string>;
  sessionFiles!: Table<StoredSessionFile, number>;
  mixedBuilderItems!: Table<StoredMixedBuilderItem, number>;
  workspaceSessions!: Table<WorkspaceSession, string>;

  constructor() {
    super('Image2PDF');

    this.version(1).stores({
      pdfSettings: 'toolId, updatedAt',
      sessionFiles: '++id, sessionId, name, fileType',
      mixedBuilderItems: '++id, sessionId, type, order',
      workspaceSessions: 'id, toolId, updatedAt',
    });
  }

  /**
   * Check whether IndexedDB is available in this browser/environment.
   * Useful for testing fallback behaviour.
   */
  static isAvailable(): boolean {
    try {
      return typeof indexedDB !== 'undefined' && indexedDB !== null;
    } catch {
      return false;
    }
  }
}