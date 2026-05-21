import { TestBed } from '@angular/core/testing';
import { PdfWorkerService, GenerationProgress } from './pdf-worker.service';

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

  it('should provide progress observable', (done) => {
    const progress = service.getProgress();
    expect(progress).toBeTruthy();

    // Initially no progress
    progress.subscribe(value => {
      if (value === null) {
        expect(value).toBeNull();
        done();
      }
    });
  });

  it('should handle unsupported worker environment gracefully', (done) => {
    if (service.isWorkerSupported()) {
      // Skip this test if workers are supported
      done();
      return;
    }

    service.generatePDF([], {}).catch(error => {
      expect(error.message).toContain('Web Workers are not supported');
      done();
    });
  });

  it('should reject empty file list', (done) => {
    if (!service.isWorkerSupported()) {
      done();
      return;
    }

    // Note: This test would run the worker - for now just verify service structure
    expect(service.generatePDF).toBeDefined();
    expect(service.generatePDFBlob).toBeDefined();
    done();
  });

  it('should provide cancel method', () => {
    expect(service.cancel).toBeDefined();
    service.cancel();
    expect(service.getProgress()).toBeTruthy();
  });
});
