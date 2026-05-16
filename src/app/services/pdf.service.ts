import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { FileObject } from './file.service';

export type PDFPageSize = 'a4' | 'letter' | 'legal';
export type PDFOrientation = 'portrait' | 'landscape';
export type PDFQuality = 'FAST' | 'MEDIUM' | 'SLOW';

export interface PDFSettings {
  pageSize: PDFPageSize;
  orientation: PDFOrientation;
  quality: PDFQuality;
}

@Injectable({
  providedIn: 'root'
})
export class PDFService {
  /**
   * Generate PDF from uploaded images and trigger download
   */
  generatePDF(
    uploadedFiles: FileObject[],
    fileName: string = 'My_Converted_Images.pdf',
    settings: PDFSettings = { pageSize: 'a4', orientation: 'portrait', quality: 'MEDIUM' }
  ): void {
    if (uploadedFiles.length === 0) {
      console.warn('No files to convert to PDF');
      return;
    }

    try {
      const pdf = new jsPDF({
        orientation: settings.orientation,
        unit: 'mm',
        format: settings.pageSize
      });

      uploadedFiles.forEach(({ url: imgData }, index) => {
        if (index > 0) {
          pdf.addPage();
        }

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 8;
        const maxWidth = pdfWidth - margin * 2;
        const maxHeight = pdfHeight - margin * 2;
        const scale = Math.min(maxWidth / imgProps.width, maxHeight / imgProps.height);
        const imageWidth = imgProps.width * scale;
        const imageHeight = imgProps.height * scale;
        const x = (pdfWidth - imageWidth) / 2;
        const y = (pdfHeight - imageHeight) / 2;

        pdf.addImage(imgData, imgProps.fileType, x, y, imageWidth, imageHeight, undefined, settings.quality);
      });

      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
}
