import { Injectable } from '@angular/core';
import { moveItemInArray } from '@angular/cdk/drag-drop';

export interface FileObject {
  name: string;
  url: string;
  size: number;
  type: string;
  fileType?: 'image' | 'pdf'; // NEW: Track if image or PDF
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
  private readonly allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  private readonly allowedPdfTypes = ['application/pdf'];
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  /**
   * Get all allowed file types (images + PDFs)
   */
  getAllowedTypes(): string[] {
    return [...this.allowedImageTypes, ...this.allowedPdfTypes];
  }

  /**
   * Detect if file is image or PDF
   */
  detectFileType(mimeType: string): 'image' | 'pdf' | null {
    if (this.allowedImageTypes.includes(mimeType)) {
      return 'image';
    }
    if (this.allowedPdfTypes.includes(mimeType)) {
      return 'pdf';
    }
    return null;
  }

  /**
   * Check if file type is supported (image or PDF)
   */
  isFileTypeSupported(mimeType: string): boolean {
    return this.getAllowedTypes().includes(mimeType);
  }

  /**
   * Validate if a file is an allowed type (image or PDF) and size
   */
  private validateFile(file: File): { valid: boolean; error?: FileValidationError } {
    if (!this.isFileTypeSupported(file.type)) {
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
          const fileType = this.detectFileType(file.type);
          processedFiles.push({
            name: file.name,
            url: result,
            size: file.size,
            type: file.type,
            fileType: fileType || 'image' // Default to image if detection fails
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
