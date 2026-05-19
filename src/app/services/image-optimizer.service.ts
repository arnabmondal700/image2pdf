import { Injectable } from '@angular/core';
import { FileObject } from './file.service';
import { PDFQuality } from './pdf.service';

interface OptimizationPreset {
  maxDimension: number;
  quality: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageOptimizerService {
  private readonly presets: Record<PDFQuality, OptimizationPreset> = {
    FAST: { maxDimension: 1200, quality: 0.68 },
    MEDIUM: { maxDimension: 1800, quality: 0.82 },
    SLOW: { maxDimension: 2400, quality: 0.92 }
  };

  async optimizeFiles(files: FileObject[], quality: PDFQuality): Promise<FileObject[]> {
    const preset = this.presets[quality];
    return Promise.all(files.map((file) => this.optimizeFile(file, preset)));
  }

  private async optimizeFile(file: FileObject, preset: OptimizationPreset): Promise<FileObject> {
    const image = await this.loadImage(file.url);
    const scale = Math.min(1, preset.maxDimension / Math.max(image.naturalWidth, image.naturalHeight));

    if (scale === 1 && file.type === 'image/jpeg') {
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext('2d');
    if (!context) {
      return file;
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const optimizedUrl = canvas.toDataURL('image/jpeg', preset.quality);
    return {
      ...file,
      url: optimizedUrl,
      size: this.estimateDataUrlSize(optimizedUrl),
      type: 'image/jpeg'
    };
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Unable to optimize image'));
      image.src = url;
    });
  }

  private estimateDataUrlSize(dataUrl: string): number {
    const commaIndex = dataUrl.indexOf(',');
    const base64Length = commaIndex >= 0 ? dataUrl.length - commaIndex - 1 : dataUrl.length;
    return Math.round((base64Length * 3) / 4);
  }
}
