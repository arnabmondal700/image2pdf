import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';
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

    class FakeURL {
      static createObjectURL = vi.fn(() => 'blob:txt-url');
      static revokeObjectURL = vi.fn();
      constructor() {}
    }
    vi.stubGlobal('URL', FakeURL as any);

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) }
    });

    await TestBed.configureTestingModule({
      imports: [OcrTextExportComponent],
      providers: [
        { provide: OcrService, useValue: ocrService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OcrTextExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should store selected file and reset result state', () => {
    component.text = 'old';
    component.error = 'Old error';

    component.onFilesSelected([new File(['image'], 'scan.jpg', { type: 'image/jpeg' })]);

    expect(component.file?.name).toBe('scan.jpg');
    expect(component.file?.url).toBe('blob:txt-url');
    expect(component.text).toBe('');
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
    expect(component.text).toBe('First page\n\nSecond page');
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
    expect(component.text).toBe('');
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
    component.text = 'Extracted text';

    component.downloadTxt();

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('should copy extracted text to the clipboard', async () => {
    component.text = 'Extracted text';

    await component.copyText();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Extracted text');
  });
});
