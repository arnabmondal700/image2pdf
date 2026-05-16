import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileObject } from '../../services/file.service';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

@Component({
  selector: 'image-editor-modal',
  templateUrl: './image-editor-modal.component.html',
  styleUrls: ['./image-editor-modal.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ImageEditorModalComponent implements AfterViewInit, OnChanges {
  @Input() file: FileObject | null = null;
  @Input() index: number | null = null;
  @Output() editApplied = new EventEmitter<{ index: number; url: string }>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild('editorCanvas') private editorCanvas?: ElementRef<HTMLCanvasElement>;

  isLoaded = false;
  rotation = 0;
  cropRect: Rect | null = null;

  private image: HTMLImageElement | null = null;
  private imageBounds: Rect | null = null;
  private dragStartPoint: Point | null = null;
  private isSelecting = false;

  ngAfterViewInit() {
    this.loadImage();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['file'] && this.editorCanvas) {
      this.loadImage();
    }
  }

  close() {
    this.closed.emit();
  }

  rotateLeft() {
    this.rotation = (this.rotation + 270) % 360;
    this.resetCropAndDraw();
  }

  rotateRight() {
    this.rotation = (this.rotation + 90) % 360;
    this.resetCropAndDraw();
  }

  onPointerDown(event: PointerEvent) {
    if (!this.isLoaded || !this.imageBounds) return;

    const point = this.clampPointToImage(this.getCanvasPoint(event));
    this.dragStartPoint = point;
    this.cropRect = { x: point.x, y: point.y, width: 0, height: 0 };
    this.isSelecting = true;
    this.editorCanvas?.nativeElement.setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent) {
    if (!this.isSelecting || !this.dragStartPoint) return;

    const point = this.clampPointToImage(this.getCanvasPoint(event));
    this.cropRect = this.normalizeRect(this.dragStartPoint, point);
    this.draw();
  }

  onPointerUp(event: PointerEvent) {
    if (!this.isSelecting) return;

    this.isSelecting = false;
    this.editorCanvas?.nativeElement.releasePointerCapture(event.pointerId);

    if (!this.isCropValid()) {
      this.cropRect = this.imageBounds ? { ...this.imageBounds } : null;
    }
    this.draw();
  }

  applyEdit() {
    if (!this.file || this.index === null || !this.image || !this.imageBounds || !this.cropRect || !this.isCropValid()) {
      return;
    }

    const rotatedCanvas = this.createRotatedCanvas();
    const scaleX = rotatedCanvas.width / this.imageBounds.width;
    const scaleY = rotatedCanvas.height / this.imageBounds.height;
    const sourceX = Math.max(0, Math.round((this.cropRect.x - this.imageBounds.x) * scaleX));
    const sourceY = Math.max(0, Math.round((this.cropRect.y - this.imageBounds.y) * scaleY));
    const sourceWidth = Math.min(rotatedCanvas.width - sourceX, Math.round(this.cropRect.width * scaleX));
    const sourceHeight = Math.min(rotatedCanvas.height - sourceY, Math.round(this.cropRect.height * scaleY));

    if (sourceWidth <= 0 || sourceHeight <= 0) return;

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = sourceWidth;
    outputCanvas.height = sourceHeight;

    const context = outputCanvas.getContext('2d');
    if (!context) return;

    context.drawImage(rotatedCanvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
    this.editApplied.emit({ index: this.index, url: outputCanvas.toDataURL('image/jpeg', 0.92) });
  }

  isCropValid(): boolean {
    return !!this.cropRect && this.cropRect.width >= 20 && this.cropRect.height >= 20;
  }

  private loadImage() {
    const canvas = this.editorCanvas?.nativeElement;
    if (!this.file || !canvas) return;

    this.isLoaded = false;
    this.rotation = 0;
    this.cropRect = null;
    this.imageBounds = null;
    this.drawEmptyState();

    const image = new Image();
    image.onload = () => {
      this.image = image;
      this.isLoaded = true;
      this.resetCropAndDraw();
    };
    image.src = this.file.url;
  }

  private resetCropAndDraw() {
    this.calculateImageBounds();
    this.cropRect = this.imageBounds ? { ...this.imageBounds } : null;
    this.draw();
  }

  private draw() {
    const canvas = this.editorCanvas?.nativeElement;
    if (!canvas || !this.image || !this.imageBounds) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#f4f6f8';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const rotatedCanvas = this.createRotatedCanvas();
    context.drawImage(rotatedCanvas, this.imageBounds.x, this.imageBounds.y, this.imageBounds.width, this.imageBounds.height);

    if (this.cropRect) {
      context.save();
      context.fillStyle = 'rgba(17, 24, 39, 0.52)';
      context.beginPath();
      context.rect(0, 0, canvas.width, canvas.height);
      context.rect(this.cropRect.x, this.cropRect.y, this.cropRect.width, this.cropRect.height);
      context.fill('evenodd');

      context.strokeStyle = '#ffffff';
      context.lineWidth = 2;
      context.strokeRect(this.cropRect.x, this.cropRect.y, this.cropRect.width, this.cropRect.height);

      context.strokeStyle = '#4a90e2';
      context.lineWidth = 1;
      context.setLineDash([6, 4]);
      context.strokeRect(
        this.cropRect.x + 4,
        this.cropRect.y + 4,
        Math.max(0, this.cropRect.width - 8),
        Math.max(0, this.cropRect.height - 8)
      );
      context.restore();
    }
  }

  private drawEmptyState() {
    const canvas = this.editorCanvas?.nativeElement;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#f4f6f8';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#667085';
    context.font = '16px sans-serif';
    context.textAlign = 'center';
    context.fillText('Loading image...', canvas.width / 2, canvas.height / 2);
  }

  private calculateImageBounds() {
    const canvas = this.editorCanvas?.nativeElement;
    if (!canvas || !this.image) return;

    const rotatedWidth = this.rotation % 180 === 0 ? this.image.naturalWidth : this.image.naturalHeight;
    const rotatedHeight = this.rotation % 180 === 0 ? this.image.naturalHeight : this.image.naturalWidth;
    const padding = 24;
    const scale = Math.min((canvas.width - padding * 2) / rotatedWidth, (canvas.height - padding * 2) / rotatedHeight);
    const width = rotatedWidth * scale;
    const height = rotatedHeight * scale;

    this.imageBounds = {
      x: (canvas.width - width) / 2,
      y: (canvas.height - height) / 2,
      width,
      height
    };
  }

  private createRotatedCanvas(): HTMLCanvasElement {
    const image = this.image;
    if (!image) return document.createElement('canvas');

    const canvas = document.createElement('canvas');
    const isSideways = this.rotation % 180 !== 0;
    canvas.width = isSideways ? image.naturalHeight : image.naturalWidth;
    canvas.height = isSideways ? image.naturalWidth : image.naturalHeight;

    const context = canvas.getContext('2d');
    if (!context) return canvas;

    context.save();
    switch (this.rotation) {
      case 90:
        context.translate(canvas.width, 0);
        context.rotate(Math.PI / 2);
        break;
      case 180:
        context.translate(canvas.width, canvas.height);
        context.rotate(Math.PI);
        break;
      case 270:
        context.translate(0, canvas.height);
        context.rotate((3 * Math.PI) / 2);
        break;
    }
    context.drawImage(image, 0, 0);
    context.restore();

    return canvas;
  }

  private getCanvasPoint(event: PointerEvent): Point {
    const canvas = this.editorCanvas?.nativeElement;
    if (!canvas) return { x: 0, y: 0 };

    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * canvas.height
    };
  }

  private clampPointToImage(point: Point): Point {
    if (!this.imageBounds) return point;

    return {
      x: Math.min(Math.max(point.x, this.imageBounds.x), this.imageBounds.x + this.imageBounds.width),
      y: Math.min(Math.max(point.y, this.imageBounds.y), this.imageBounds.y + this.imageBounds.height)
    };
  }

  private normalizeRect(start: Point, end: Point): Rect {
    return {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y)
    };
  }
}
