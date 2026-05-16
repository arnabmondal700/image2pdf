import { Injectable } from '@angular/core';

export interface FileObject {
  name: string;
  url: string;
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
  validateFile(file: File): boolean {
    if (!this.allowedTypes.includes(file.type)) {
      console.warn(`File type ${file.type} not allowed`);
      return false;
    }
    if (file.size > this.maxFileSize) {
      console.warn(`File size exceeds 10MB limit`);
      return false;
    }
    return true;
  }

  /**
   * Process FileList into FileObject array with DataURL conversion
   */
  processFiles(files: FileList | File[]): Promise<FileObject[]> {
    return new Promise((resolve, reject) => {
      const processedFiles: FileObject[] = [];
      let loadedCount = 0;
      const totalFiles = files.length;

      console.log('processFiles called with', totalFiles, 'files');

      if (!files || totalFiles === 0) {
        console.log('No files provided');
        resolve([]);
        return;
      }

      Array.from(files).forEach((file, index) => {
        console.log(`Processing file ${index}:`, file.name, file.type);

        if (!this.validateFile(file)) {
          console.warn(`File ${file.name} failed validation`);
          loadedCount++;
          if (loadedCount === totalFiles) {
            console.log('All files processed, resolving:', processedFiles);
            resolve(processedFiles);
          }
          return;
        }

        const reader = new FileReader();
        
        reader.onload = (e: ProgressEvent<FileReader>) => {
          const result = e.target?.result as string;
          console.log(`File ${file.name} loaded successfully`);
          processedFiles.push({
            name: file.name,
            url: result
          });
          loadedCount++;
          console.log(`Loaded ${loadedCount}/${totalFiles} files`);
          if (loadedCount === totalFiles) {
            console.log('All files processed, resolving:', processedFiles);
            resolve(processedFiles);
          }
        };

        reader.onerror = (error) => {
          console.error(`Failed to read file ${file.name}:`, error);
          loadedCount++;
          if (loadedCount === totalFiles) {
            console.log('All files processed (with errors), resolving:', processedFiles);
            resolve(processedFiles);
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
    const draggedFile = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);

    // Adjust drop index if dragging from above
    const adjustedDropIndex =
      draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newFiles.splice(adjustedDropIndex, 0, draggedFile);

    return newFiles;
  }

  /**
   * Remove a file from the list by index
   */
  removeFile(files: FileObject[], index: number): FileObject[] {
    return files.filter((_, i) => i !== index);
  }
}
