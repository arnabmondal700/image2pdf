const { mockPdfInstances } = vi.hoisted(() => ({
  mockPdfInstances: [] as MockPdfInstance[]
}));

interface MockPdfInstance {
  addImage: ReturnType<typeof vi.fn>;
  addPage: ReturnType<typeof vi.fn>;
  clip: ReturnType<typeof vi.fn>;
  discardPath: ReturnType<typeof vi.fn>;
  getImageProperties: ReturnType<typeof vi.fn>;
  output: ReturnType<typeof vi.fn>;
  rect: ReturnType<typeof vi.fn>;
  restoreGraphicsState: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  saveGraphicsState: ReturnType<typeof vi.fn>;
  setFillColor: ReturnType<typeof vi.fn>;
}

vi.mock('jspdf', () => ({
  jsPDF: class {
    addImage = vi.fn();
    addPage = vi.fn();
    clip = vi.fn();
    discardPath = vi.fn();
    getImageProperties = vi.fn(() => ({ width: 200, height: 100, fileType: 'JPEG' }));
    output = vi.fn(() => new Blob(['pdf'], { type: 'application/pdf' }));
    rect = vi.fn();
    restoreGraphicsState = vi.fn();
    save = vi.fn();
    saveGraphicsState = vi.fn();
    setFillColor = vi.fn();

    constructor() {
      mockPdfInstances.push(this);
    }
  }
}));

import { FileObject } from './file.service';
import { PDFService } from './pdf.service';
import { PDFGenerationCancelledError, PdfWorkerService } from './pdf-worker.service';

describe('PDFService', () => {
  let service: PDFService;
  let mockWorkerService: Partial<PdfWorkerService>;
  const files: FileObject[] = [
    { name: 'one.jpg', url: 'data:image/jpeg;base64,one', size: 1, type: 'image/jpeg' },
    { name: 'two.jpg', url: 'data:image/jpeg;base64,two', size: 1, type: 'image/jpeg' },
    { name: 'three.jpg', url: 'data:image/jpeg;base64,three', size: 1, type: 'image/jpeg' }
  ];

  beforeEach(() => {
    mockPdfInstances.length = 0;
    mockWorkerService = {
      isWorkerSupported: vi.fn(() => false),
      getProgress: vi.fn(),
      generatePDF: vi.fn(),
      generatePDFBlob: vi.fn(),
      cancel: vi.fn()
    };
    service = new PDFService(mockWorkerService as PdfWorkerService);
  });

  it('applies background color and saves the generated PDF', () => {
    service.generatePDF([files[0]], 'single.pdf', {
      pageSize: 'a4',
      orientation: 'portrait',
      quality: 'MEDIUM',
      backgroundColor: '#ff0000'
    });

    const pdf = mockPdfInstances[0];
    expect(pdf.setFillColor).toHaveBeenCalledWith('#ff0000');
    expect(pdf.rect).toHaveBeenCalledWith(0, 0, 210, 297, 'F');
    expect(pdf.addImage).toHaveBeenCalledOnce();
    expect(pdf.save).toHaveBeenCalledWith('single.pdf');
  });

  it('coerces imagesPerPage string values before layout generation', () => {
    service.generatePDF(files, 'two-up.pdf', {
      pageSize: 'a4',
      orientation: 'portrait',
      quality: 'MEDIUM',
      imagesPerPage: '2' as never
    });

    const pdf = mockPdfInstances[0];
    expect(pdf.addImage).toHaveBeenCalledTimes(3);
    expect(pdf.addPage).toHaveBeenCalledOnce();
  });

  it('clips cover images to their layout cell', () => {
    service.generatePDF([files[0]], 'cover.pdf', {
      pageSize: 'a4',
      orientation: 'portrait',
      quality: 'MEDIUM',
      imageFit: 'cover'
    });

    const pdf = mockPdfInstances[0];
    expect(pdf.saveGraphicsState).toHaveBeenCalledOnce();
    expect(pdf.clip).toHaveBeenCalledOnce();
    expect(pdf.discardPath).toHaveBeenCalledOnce();
    expect(pdf.restoreGraphicsState).toHaveBeenCalledOnce();
  });

  it('does not generate an empty PDF', () => {
    service.generatePDF([], 'empty.pdf');

    expect(mockPdfInstances).toEqual([]);
  });

  it('does not fall back to main-thread generation when worker generation is cancelled', async () => {
    mockWorkerService.isWorkerSupported = vi.fn(() => true);
    mockWorkerService.generatePDF = vi.fn(() => Promise.reject(new PDFGenerationCancelledError()));
    service = new PDFService(mockWorkerService as PdfWorkerService);

    await expect(service.generatePDF([files[0]], 'cancelled.pdf')).rejects.toBeInstanceOf(PDFGenerationCancelledError);
    expect(mockPdfInstances).toEqual([]);
  });
});
