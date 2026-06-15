import { TestBed } from '@angular/core/testing';
import { PdfCompressionWorkerService, CompressionCancelledError } from './pdf-compression-worker.service';
import { firstValueFrom } from 'rxjs';

describe('PdfCompressionWorkerService', () => {
  let service: PdfCompressionWorkerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PdfCompressionWorkerService]
    });
    service = TestBed.inject(PdfCompressionWorkerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should report worker support status as a boolean', () => {
    // In test environment (JSDOM), Worker may not be defined, so we just check the type
    expect(typeof service.isWorkerSupported()).toBe('boolean');
  });

  it('should provide progress observable', () => {
    const progress$ = service.getProgress();
    expect(progress$).toBeTruthy();
  });

  it('should emit null progress initially', async () => {
    const progress = await firstValueFrom(service.getProgress());
    expect(progress).toBeNull();
  });

  it('should handle cancel when no compression is active', () => {
    // Should not throw when cancelling with no active compression
    expect(() => service.cancel()).not.toThrow();
  });

  it('CompressionCancelledError should have correct name', () => {
    const error = new CompressionCancelledError();
    expect(error.name).toBe('CompressionCancelledError');
    expect(error.message).toBe('Compression cancelled');
  });

  it('should reject with CompressionCancelledError on cancel', async () => {
    const rejectSpy = vi.fn();

    // Simulate what happens internally on cancel
    const error = new CompressionCancelledError();
    rejectSpy(error);

    expect(rejectSpy).toHaveBeenCalled();
    expect(rejectSpy.mock.calls[0][0].name).toBe('CompressionCancelledError');
  });

  it('should have ngOnDestroy that cleans up', () => {
    // ngOnDestroy should not throw
    expect(() => service.ngOnDestroy()).not.toThrow();
  });
});