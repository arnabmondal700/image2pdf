import { TestBed } from '@angular/core/testing';
import { PdfWorkerService } from './pdf-worker.service';

describe('PdfWorkerService', () => {
  let service: PdfWorkerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfWorkerService);
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

  it('should have generatePDF method', () => {
    expect(service.generatePDF).toBeDefined();
    expect(typeof service.generatePDF).toBe('function');
  });

  it('should have generatePDFBlob method', () => {
    expect(service.generatePDFBlob).toBeDefined();
    expect(typeof service.generatePDFBlob).toBe('function');
  });
});



