import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { FileObject } from './file.service';

@Injectable({
  providedIn: 'root'
})
export class PDFService {
  /**
   * Generate PDF from uploaded images and trigger download
   */
  generatePDF(uploadedFiles: FileObject[], fileName: string = 'My_Converted_Images.pdf'): void {
    if (uploadedFiles.length === 0) {
      console.warn('No files to convert to PDF');
      return;
    }

    try {
      // Create a new PDF document (default is A4, portrait)
      const pdf = new jsPDF();

      uploadedFiles.forEach(({ url: imgData }, index) => {
        // Add a new page for every image after the first one
        if (index > 0) {
          pdf.addPage();
        }

        // Calculate dimensions to fit the image nicely on an A4 page
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Add the image to the current PDF page
        pdf.addImage(imgData, imgProps.fileType, 0, 0, pdfWidth, pdfHeight);
      });

      // Download the final PDF
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
}
