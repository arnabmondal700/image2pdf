import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';
import { OcrProgress, OcrService } from '../../services/ocr.service';
import { OcrTextExportComponent } from './ocr-text-export.component';

describe('OcrTextExportComponent', () => {
  let component: OcrTextExportComponent;
  let fixture: ComponentFixture<OcrTextExportComponent>;
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
        pages: [
          { pageNumber: 1, text: 'First page', confidence: 90 },
          { pageNumber: 2, text: 'Second page', confidence: 85 }
        ],
        totalPages: 2,
        durationMs: 25
      }),
      cancel: vi.fn()
    };

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:txt-url'),
      revokeObjectURL: vi.fn()
    });

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) }
    });

    await TestBed.configureTestingModule({
      imports: [OcrTextExportComponent],
      providers: [{ provide: OcrService, useValue: ocrService }]
    }).compileComponents();

    fixture = TestBed.createComponent(OcrTextExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should store selected file and reset result state', () => {
    component.result = { text: 'old', durationMs: 1 };
    component.error = 'Old error';

    component.onFilesSelected([new File(['image'], 'scan.jpg', { type: 'image/jpeg' })]);

    expect(component.file?.name).toBe('scan.jpg');
    expect(component.file?.url).toBe('blob:txt-url');
    expect(component.result).toBeNull();
    expect(component.error).toBeNull();
  });

  it('should extract and combine text from all OCR pages', async () => {
    component.file = {
      name: 'scan.pdf',
      url: 'blob:pdf-url',
      size: 100,
      type: 'application/pdf'
    };

    await component.extractText();

    expect(ocrService.recognize).toHaveBeenCalledWith(component.file, {
      language: 'eng',
      preserveLayout: true
    });
    expect(component.result).toEqual({ text: 'First page\n\nSecond page', durationMs: 25 });
    expect(component.isProcessing).toBe(false);
  });

  it('should surface extraction errors', async () => {
    ocrService.recognize.mockRejectedValue(new Error('OCR failed'));
    component.file = {
      name: 'scan.pdf',
      url: 'blob:pdf-url',
      size: 100,
      type: 'application/pdf'
    };

    await component.extractText();

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

  it('should download extracted text', () => {
    const click = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({ click } as unknown as HTMLAnchorElement);
    component.file = {
      name: 'scan.png',
      url: 'blob:image-url',
      size: 100,
      type: 'image/png'
    };
    component.result = { text: 'Extracted text', durationMs: 10 };

    component.downloadTxt();

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('should copy extracted text to the clipboard', async () => {
    component.result = { text: 'Extracted text', durationMs: 10 };

    await component.copyToClipboard();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Extracted text');
  });
});
