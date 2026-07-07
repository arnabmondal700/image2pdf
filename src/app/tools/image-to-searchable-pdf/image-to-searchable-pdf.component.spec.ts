import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { OcrProgress, OcrService } from '../../services/ocr.service';
import { ImageToSearchablePdfComponent } from './image-to-searchable-pdf.component';

describe('ImageToSearchablePdfComponent', () => {
  let component: ImageToSearchablePdfComponent;
  let fixture: ComponentFixture<ImageToSearchablePdfComponent>;
  let progressSubject: BehaviorSubject<OcrProgress | null>;
  let ocrService: {
    getProgress: ReturnType<typeof vi.fn>;
    recognize: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    progressSubject = new BehaviorSubject<OcrProgress | null>(null);
    ocrService = {
      getProgress: vi.fn(() => progressSubject.asObservable()),
      recognize: vi.fn().mockResolvedValue({
        pages: [{ pageNumber: 1, text: 'Needle OCR text', confidence: 92 }],
        totalPages: 1,
        durationMs: 10
      }),
      cancel: vi.fn()
    };

    class FakeURL {
      static createObjectURL = vi.fn(() => 'blob:test-url');
      static revokeObjectURL = vi.fn();
      constructor() {}
    }
    vi.stubGlobal('URL', FakeURL as any);

    await TestBed.configureTestingModule({
      imports: [ImageToSearchablePdfComponent],
      providers: [
        { provide: OcrService, useValue: ocrService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ImageToSearchablePdfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should store the selected file and clear previous results', () => {
    component.result = { blob: new Blob(['old']), name: 'old.pdf' };
    component.error = 'Old error';

    component.onFilesSelected([new File(['image'], 'scan.png', { type: 'image/png' })]);

    expect(component.file?.name).toBe('scan.png');
    expect(component.file?.url).toBe('blob:test-url');
    expect(component.result).toBeNull();
    expect(component.error).toBeNull();
  });

  it('should create a searchable PDF result from OCR output', async () => {
    const pdfBlob = new Blob(['pdf'], { type: 'application/pdf' });
    vi.spyOn(component as any, 'buildSearchablePdf').mockResolvedValue(pdfBlob);
    component.file = {
      name: 'scan.png',
      url: 'blob:test-url',
      size: 100,
      type: 'image/png'
    };

    await component.createSearchablePdf();

    expect(ocrService.recognize).toHaveBeenCalledWith(component.file, {
      language: 'eng',
      preserveLayout: true
    });
    expect(component.result).toEqual({ blob: pdfBlob, name: 'scan_searchable.pdf' });
    expect(component.isProcessing).toBe(false);
  });

  it('should surface OCR errors', async () => {
    ocrService.recognize.mockRejectedValue(new Error('OCR failed'));
    component.file = {
      name: 'scan.png',
      url: 'blob:test-url',
      size: 100,
      type: 'image/png'
    };

    await component.createSearchablePdf();

    expect(component.error).toBe('OCR failed');
    expect(component.result).toBeNull();
    expect(component.isProcessing).toBe(false);
  });

  it('should track progress updates from the OCR service', () => {
    progressSubject.next({ current: 1, total: 2, status: 'Recognizing page 2 of 2...' });

    expect(component.progress).toEqual({
      current: 1,
      total: 2,
      status: 'Recognizing page 2 of 2...'
    });
  });

  it('should cancel OCR through the service', () => {
    component.isProcessing = true;
    component.progress = { current: 0, total: 1, status: 'Starting OCR...' };

    component.cancel();

    expect(ocrService.cancel).toHaveBeenCalled();
    expect(component.isProcessing).toBe(false);
    expect(component.progress).toBeNull();
  });

  it('should download the generated PDF', () => {
    const click = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({ click } as unknown as HTMLAnchorElement);
    component.result = { blob: new Blob(['pdf'], { type: 'application/pdf' }), name: 'scan_searchable.pdf' };

    component.download();

    expect(URL.createObjectURL).toHaveBeenCalledWith(component.result.blob);
    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('should draw OCR text into the invisible text layer', () => {
    const drawText = vi.fn();
    const fakePage = {
      getSize: () => ({ width: 600, height: 800 }),
      drawText
    };
    const fakeFont = {
      widthOfTextAtSize: (text: string, size: number) => text.length * size * 0.5
    };
    const fakePdf = {
      rgb: vi.fn((r: number, g: number, b: number) => ({ r, g, b }))
    };

    (component as any).drawInvisibleTextLayer(fakePdf, fakePage, fakeFont, 'Needle OCR text');

    expect(drawText).toHaveBeenCalledWith(
      expect.stringContaining('Needle OCR text'),
      expect.objectContaining({ opacity: 0.01 })
    );
  });
});
