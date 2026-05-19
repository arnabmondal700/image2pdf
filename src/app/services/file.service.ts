import { Injectable } from '@angular/core';
import { moveItemInArray } from '@angular/cdk/drag-drop';

export interface FileObject {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface FileValidationError {
  fileName: string;
  reason: 'unsupported-type' | 'exceeds-size-limit' | 'read-error' | 'pdf-generation-error';
}

export interface ProcessFilesResult {
  successful: FileObject[];
  errors: FileValidationError[];
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private readonly allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  /**
   * Validate if a file is an allowed image type and size
   */
  private validateFile(file: File): { valid: boolean; error?: FileValidationError } {
    if (!this.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: { fileName: file.name, reason: 'unsupported-type' }
      };
    }
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: { fileName: file.name, reason: 'exceeds-size-limit' }
      };
    }
    return { valid: true };
  }

  /**
   * Process FileList into FileObject array with DataURL conversion
   */
  processFiles(files: FileList | File[]): Promise<ProcessFilesResult> {
    return new Promise((resolve) => {
      const processedFiles: FileObject[] = [];
      const errors: FileValidationError[] = [];
      let loadedCount = 0;
      const totalFiles = files.length;

      if (!files || totalFiles === 0) {
        resolve({ successful: [], errors: [] });
        return;
      }

      Array.from(files).forEach((file) => {
        const validation = this.validateFile(file);
        
        if (!validation.valid) {
          if (validation.error) {
            errors.push(validation.error);
          }
          loadedCount++;
          if (loadedCount === totalFiles) {
            resolve({ successful: processedFiles, errors });
          }
          return;
        }

        const reader = new FileReader();
        
        reader.onload = (e: ProgressEvent<FileReader>) => {
          const result = e.target?.result as string;
          processedFiles.push({
            name: file.name,
            url: result,
            size: file.size,
            type: file.type
          });
          loadedCount++;
          if (loadedCount === totalFiles) {
            resolve({ successful: processedFiles, errors });
          }
        };

        reader.onerror = () => {
          errors.push({
            fileName: file.name,
            reason: 'read-error'
          });
          loadedCount++;
          if (loadedCount === totalFiles) {
            resolve({ successful: processedFiles, errors });
          }
        };

        reader.readAsDataURL(file);
      });
    });
  }

  /**
   * Reorder files array based on drag and drop indices
   */
  reorderFiles(
    files: FileObject[],
    draggedIndex: number,
    dropIndex: number
  ): FileObject[] {
    if (draggedIndex === null || draggedIndex === dropIndex) {
      return files;
    }

    const newFiles = [...files];
    moveItemInArray(newFiles, draggedIndex, dropIndex);

    return newFiles;
  }

  /**
   * Remove a file from the list by index
   */
  removeFile(files: FileObject[], index: number): FileObject[] {
    return files.filter((_, i) => i !== index);
  }
}
