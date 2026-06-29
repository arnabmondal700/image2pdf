import { Injectable, signal } from '@angular/core';
import { FileObject } from './file.service';

@Injectable({ providedIn: 'root' })
export class ImageEditorStateService {
  private readonly _editingFile = signal<FileObject | null>(null);
  private readonly _editingFileIndex = signal<number | null>(null);

  readonly editingFile = this._editingFile.asReadonly();
  readonly editingFileIndex = this._editingFileIndex.asReadonly();

  open(file: FileObject, index: number): void {
    this._editingFile.set(file);
    this._editingFileIndex.set(index);
  }

  close(): void {
    this._editingFile.set(null);
    this._editingFileIndex.set(null);
  }
}