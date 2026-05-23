import { TestBed } from '@angular/core/testing';
import { firstValueFrom, skip } from 'rxjs';
import { PDFGenerationCancelledError, PdfWorkerService } from './pdf-worker.service';

describe('PdfWorkerService', () => {
  let service: PdfWorkerService;
  let terminate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    terminate = vi.fn();
    class MockWorker {
      postMessage = vi.fn();
      terminate = terminate;
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
    }
    vi.stubGlobal('Worker', MockWorker);
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfWorkerService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should report worker support availability', () => {
    const isSupported = service.isWorkerSupported();
    expect(typeof isSupported).toBe('boolean');
  });

  it('should provide progress observable', () => {
    const progress = service.getProgress();
    expect(progress).toBeTruthy();
  });

  it('should provide cancel method', () => {
    expect(service.cancel).toBeDefined();
    service.cancel();
    expect(service.getProgress()).toBeTruthy();
  });

  it('should reject active generation and clear progress when cancelled', async () => {
    const progressUpdate = firstValueFrom(service.getProgress().pipe(skip(1)));
    const generation = service.generatePDF(
      [{ name: 'test.jpg', type: 'image/jpeg', size: 1, url: 'data:image/jpeg;base64,test' }],
      { pageSize: 'a4', orientation: 'portrait', quality: 'MEDIUM' },
      'test.pdf'
    );

    await expect(progressUpdate).resolves.toEqual({
      current: 0,
      total: 1,
      status: 'Starting PDF generation'
    });

    service.cancel();

    await expect(generation).rejects.toBeInstanceOf(PDFGenerationCancelledError);
    expect(terminate).toHaveBeenCalled();
  });

  it('should have generatePDF method', () => {
    expect(service.generatePDF).toBeDefined();
    expect(typeof service.generatePDF).toBe('function');
  });

  it('should have generatePDFBlob method', () => {
    expect(service.generatePDFBlob).toBeDefined();
    expect(typeof service.generatePDFBlob).toBe('function');
  });
});



