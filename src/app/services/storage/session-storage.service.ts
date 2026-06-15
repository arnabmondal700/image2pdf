import { Injectable, inject } from '@angular/core';
import { IndexedDbService, type StoredSessionFile, type WorkspaceSession } from './indexed-db.service';
import type { FileObject } from '../file.service';

/**
 * Session storage service for persisting uploaded file state across page refreshes.
 *
 * - Stores uploaded files in IndexedDB (data URLs included) so that users do not
 *   lose their work on accidental navigation or refresh.
 * - Manages workspace sessions — groups of files tied to a specific tool.
 * - Falls back gracefully when IndexedDB is unavailable.
 */
@Injectable({
  providedIn: 'root',
})
export class SessionStorageService {
  private readonly db = inject(IndexedDbService);
  private readonly dbAvailable = IndexedDbService.isAvailable();
  private readonly activeSessions = new Map<string, FileObject[]>();

  // ─── Session lifecycle ────────────────────────────────────────────────

  /**
   * Create a new workspace session and persist its file list.
   * Replaces any previous session with the same ID.
   */
  async createSession(
    sessionId: string,
    toolId: string,
    label: string,
    files: FileObject[],
  ): Promise<void> {
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    const meta: WorkspaceSession = {
      id: sessionId,
      toolId,
      label,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fileCount: files.length,
      totalSize,
    };

    this.activeSessions.set(sessionId, [...files]);

    if (this.dbAvailable) {
      try {
        await this.db.workspaceSessions.put(meta);
        await this.persistFiles(sessionId, files);
      } catch (err) {
        console.error('[SessionStorage] IndexedDB write failed, keeping in-memory:', err);
      }
    }
  }

  /**
   * Load a previously persisted session.  Returns the file list or `null` if
   * the session does not exist in any storage layer.
   */
  async loadSession(sessionId: string): Promise<FileObject[] | null> {
    // 1. Check in-memory cache first.
    const cached = this.activeSessions.get(sessionId);
    if (cached) {
      return cached;
    }

    // 2. Try IndexedDB.
    if (this.dbAvailable) {
      try {
        const rows = await this.db.sessionFiles
          .where('sessionId')
          .equals(sessionId)
          .toArray();

        if (rows.length > 0) {
          const files: FileObject[] = rows.map((r) => ({
            name: r.name,
            url: r.url,
            size: r.size,
            type: r.type,
            fileType: r.fileType,
            rotation: r.rotation,
          }));
          this.activeSessions.set(sessionId, files);
          return files;
        }
      } catch (err) {
        console.error('[SessionStorage] IndexedDB read failed:', err);
      }
    }

    return null;
  }

  /**
   * Delete a session and all its files from every storage layer.
   */
  async deleteSession(sessionId: string): Promise<void> {
    this.activeSessions.delete(sessionId);

    if (this.dbAvailable) {
      try {
        await this.db.sessionFiles.where('sessionId').equals(sessionId).delete();
        await this.db.workspaceSessions.delete(sessionId);
      } catch (err) {
        console.error('[SessionStorage] IndexedDB delete failed:', err);
      }
    }
  }

  /**
   * List all persisted workspace sessions, newest first.
   */
  async listSessions(toolId?: string): Promise<WorkspaceSession[]> {
    if (!this.dbAvailable) return [];

    try {
      let collection = this.db.workspaceSessions.orderBy('updatedAt').reverse();
      if (toolId) {
        collection = collection.filter((s) => s.toolId === toolId) as typeof collection;
      }
      return collection.toArray();
    } catch {
      return [];
    }
  }

  // ─── File-level helpers ───────────────────────────────────────────────

  /**
   * Persist a full file list, replacing any existing files for the same session.
   */
  private async persistFiles(sessionId: string, files: FileObject[]): Promise<void> {
    // Remove old entries for this session.
    await this.db.sessionFiles.where('sessionId').equals(sessionId).delete();

    // Store each file as a separate row.
    const rows: StoredSessionFile[] = files.map((f) => ({
      sessionId,
      name: f.name,
      url: f.url,
      size: f.size,
      type: f.type,
      fileType: f.fileType,
      rotation: f.rotation,
    }));

    await this.db.sessionFiles.bulkAdd(rows);
  }

  /**
   * Append a single file to an existing session and persist the delta.
   */
  async addFileToSession(sessionId: string, file: FileObject): Promise<void> {
    const existing = (await this.loadSession(sessionId)) ?? [];
    existing.push(file);
    this.activeSessions.set(sessionId, existing);

    if (this.dbAvailable) {
      try {
        const row: StoredSessionFile = {
          sessionId,
          name: file.name,
          url: file.url,
          size: file.size,
          type: file.type,
          fileType: file.fileType,
          rotation: file.rotation,
        };
        await this.db.sessionFiles.add(row);
        await this.touchSession(sessionId);
      } catch (err) {
        console.error('[SessionStorage] IndexedDB addFile failed:', err);
      }
    }
  }

  /**
   * Remove a file from a session by index and persist.
   */
  async removeFileFromSession(sessionId: string, index: number): Promise<void> {
    const existing = (await this.loadSession(sessionId)) ?? [];
    if (index < 0 || index >= existing.length) return;

    const removed = existing[index];
    existing.splice(index, 1);
    this.activeSessions.set(sessionId, existing);

    if (this.dbAvailable) {
      try {
        // Delete the matching row from IndexedDB.  We match by name+url to
        // avoid ambiguity when multiple rows share the same name.
        await this.db.sessionFiles
          .where({ sessionId, name: removed.name, url: removed.url })
          .delete();
        await this.touchSession(sessionId);
      } catch (err) {
        console.error('[SessionStorage] IndexedDB removeFile failed:', err);
      }
    }
  }

  /**
   * Reorder files in a persisted session.
   */
  async reorderFilesInSession(
    sessionId: string,
    reordered: FileObject[],
  ): Promise<void> {
    this.activeSessions.set(sessionId, [...reordered]);

    if (this.dbAvailable) {
      try {
        // Full replace: delete all and re-add.
        await this.persistFiles(sessionId, reordered);
        await this.touchSession(sessionId);
      } catch (err) {
        console.error('[SessionStorage] IndexedDB reorder failed:', err);
      }
    }
  }

  // ─── Internal ─────────────────────────────────────────────────────────

  /**
   * Bump the updatedAt timestamp of a session.
   */
  private async touchSession(sessionId: string): Promise<void> {
    try {
      await this.db.workspaceSessions
        .where('id')
        .equals(sessionId)
        .modify({ updatedAt: Date.now() });
    } catch {
      // Silently ignore – session metadata is best-effort.
    }
  }
}