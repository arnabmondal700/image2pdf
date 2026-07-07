vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  getDocument: vi.fn(() => ({
    promise: Promise.reject(new Error('Invalid PDF'))
  }))
}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { ImageToPdfComponent } from './image-to-pdf.component';
import { FileService, FileObject } from '../../services/file.service';
import { ImageOptimizerService } from '../../services/image-optimizer.service';
import { PDFService, type PDFSettings } from '../../services/pdf.service';
import { GenerationProgress, PdfWorkerService } from '../../services/pdf-worker.service';
import { PdfSettingsStorageService } from '../../services/pdf-settings-storage.service';
import { PdfExtractionService } from '../../services/pdf-extraction.service';
import { ExportService } from '../../services/export.service';
import { SessionStorageService } from '../../services/storage/session-storage.service';
import { ImageEditorStateService } from '../../services/image-editor-state.service';

describe('ImageToPdfComponent', () => {
  let component: ImageToPdfComponent;
  let fixture: ComponentFixture<ImageToPdfComponent>;
  let fileService: any;
  let imageOptimizer: any;
  let pdfService: any;
  let pdfWorkerService: any;
  let settingsStorage: any;
  let pdfExtraction: any;
  let exportService: any;
  let sessionStorage: any;
  let progressSubject: BehaviorSubject<GenerationProgress | null>;

  beforeEach(async () => {
    progressSubject = new BehaviorSubject<GenerationProgress | null>(null);
    const fileServiceSpy = { processFiles: vi.fn() };
    const imageOptimizerSpy = { optimizeImage: vi.fn() };
    const pdfServiceSpy = { generatePDF: vi.fn(() => Promise.resolve()) };
    const pdfWorkerServiceSpy = {
      getProgress: vi.fn(() => progressSubject.asObservable()),
      cancel: vi.fn()
    };
    const settingsStorageSpy = {
      loadSettings: vi.fn(() => Promise.resolve(null)),
      saveSettings: vi.fn(() => Promise.resolve(undefined)),
      saveSettingsSync: vi.fn()
    };
    const pdfExtractionSpy = {
      extractPdfAsImages: vi.fn(),
      isPdfSupported: vi.fn()
    };
    const exportServiceSpy = {
      export: vi.fn(() => Promise.resolve())
    };
    const sessionStorageSpy = {
      createSession: vi.fn().mockResolvedValue(undefined),
      loadSession: vi.fn().mockResolvedValue(null)
    };

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        DragDropModule,
        ImageToPdfComponent
      ],
      providers: [
        { provide: FileService, useValue: fileServiceSpy },
        { provide: ImageOptimizerService, useValue: imageOptimizerSpy },
        { provide: PDFService, useValue: pdfServiceSpy },
        { provide: PdfWorkerService, useValue: pdfWorkerServiceSpy },
        { provide: PdfSettingsStorageService, useValue: settingsStorageSpy },
        { provide: PdfExtractionService, useValue: pdfExtractionSpy },
        { provide: ExportService, useValue: exportServiceSpy },
        { provide: SessionStorageService, useValue: sessionStorageSpy as any },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        },
        {
          provide: ImageEditorStateService,
          useValue: { openEditor: vi.fn(), closeEditor: vi.fn(), isEditorOpen: vi.fn() }
        }
      ]
    }).compileComponents();

    fileService = TestBed.inject(FileService);
    imageOptimizer = TestBed.inject(ImageOptimizerService);
    pdfService = TestBed.inject(PDFService);
    pdfWorkerService = TestBed.inject(PdfWorkerService);
    settingsStorage = TestBed.inject(PdfSettingsStorageService);
    pdfExtraction = TestBed.inject(PdfExtractionService);
    exportService = TestBed.inject(ExportService);
    sessionStorage = TestBed.inject(SessionStorageService);

    fixture = TestBed.createComponent(ImageToPdfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default PDF settings', () => {
    settingsStorage.loadSettings.mockResolvedValue(null);
    const sessionStorageService = {
      createSession: vi.fn().mockResolvedValue(undefined),
      loadSession: vi.fn().mockResolvedValue(null)
    } as any;
    const cdr = { detectChanges: vi.fn() } as unknown as ChangeDetectorRef;
    const newComponent = new ImageToPdfComponent(
      fileService,
      imageOptimizer,
      pdfService,
      pdfWorkerService,
      settingsStorage,
      pdfExtraction,
      exportService,
      sessionStorageService,
      cdr
    );
    expect(newComponent.pdfSettings).toBeDefined();
    expect(newComponent.pdfSettings.pageSize).toBe('a4');
    expect(newComponent.pdfSettings.orientation).toBe('portrait');
  });

  it('should load saved settings on initialization', async () => {
    const savedSettings: PDFSettings = {
      pageSize: 'letter',
      orientation: 'landscape',
      quality: 'MEDIUM',
      marginTop: 10,
      marginBottom: 10,
      marginLeft: 10,
      marginRight: 10,
      imageFit: 'cover',
      imageAlignment: 'center',
      backgroundColor: '#f5f5f5',
      imagesPerPage: 2
    };
    settingsStorage.loadSettings.mockResolvedValue(savedSettings);
    const sessionStorageService = {
      createSession: vi.fn().mockResolvedValue(undefined),
      loadSession: vi.fn().mockResolvedValue(null)
    } as any;
    const cdr = { detectChanges: vi.fn() } as unknown as ChangeDetectorRef;
    const newComponent = new ImageToPdfComponent(
      fileService,
      imageOptimizer,
      pdfService,
      pdfWorkerService,
      settingsStorage,
      pdfExtraction,
      exportService,
      sessionStorageService,
      cdr
    );
    // Allow async restoreSettings() to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(newComponent.pdfSettings.pageSize).toBe('letter');
    expect(newComponent.pdfSettings.orientation).toBe('landscape');
  });

  it('should process image files on selection', async () => {
    const mockFile: FileObject = {
      name: 'test.png',
      url: 'data:image/png;base64,test',
      size: 1024,
      type: 'image/png',
      fileType: 'image'
    };

    fileService.processFiles.mockResolvedValue(
      Promise.resolve({ successful: [mockFile], errors: [] })
    );

    await component.onFilesSelected([new File(['test'], 'test.png', { type: 'image/png' })]);

    expect(component.uploadedFiles).toContain(mockFile);
    expect(component.validationErrors.length).toBe(0);
  });

  it('should handle file validation errors', async () => {
    fileService.processFiles.mockResolvedValue(
      Promise.resolve({
        successful: [],
        errors: [{ fileName: 'test.pdf', reason: 'unsupported-type' as const }]
      })
    );

    await component.onFilesSelected([new File(['test'], 'test.pdf', { type: 'application/pdf' })]);

    expect(component.uploadedFiles.length).toBe(0);
    expect(component.validationErrors.length).toBe(1);
  });

  it('should remove file from upload queue', async () => {
    const mockFile: FileObject = {
      name: 'test.png',
      url: 'data:image/png;base64,test',
      size: 1024,
      type: 'image/png',
      fileType: 'image'
    };
    component.uploadedFiles = [mockFile];

    await component.onFileRemoved(0);

    expect(component.uploadedFiles.length).toBe(0);
  });

  it('should reorder files via drag-drop', async () => {
    const file1: FileObject = {
      name: 'file1.png',
      url: 'data:image/png;base64,test1',
      size: 1024,
      type: 'image/png'
    };
    const file2: FileObject = {
      name: 'file2.png',
      url: 'data:image/png;base64,test2',
      size: 1024,
      type: 'image/png'
    };

    component.uploadedFiles = [file1, file2];

    await component.onFileReordered({ from: 0, to: 1 });

    expect(component.uploadedFiles[0].name).toBe('file2.png');
    expect(component.uploadedFiles[1].name).toBe('file1.png');
  });

  it('should update PDF settings and save to storage', () => {
    const newSettings: PDFSettings = {
      pageSize: 'legal',
      orientation: 'landscape',
      quality: 'FAST',
      marginTop: 5,
      marginBottom: 5,
      marginLeft: 5,
      marginRight: 5,
      imageFit: 'stretch',
      imageAlignment: 'center',
      backgroundColor: '#ffffff',
      imagesPerPage: 4
    };

    component.onPDFSettingsChanged(newSettings);

    expect(component.pdfSettings).toEqual(newSettings);
    expect(settingsStorage.saveSettingsSync).toHaveBeenCalledWith(newSettings, 'image-to-pdf');
  });

  it('should track worker generation progress', () => {
    const progress: GenerationProgress = {
      current: 1,
      total: 3,
      status: 'Processing image 2 of 3'
    };

    progressSubject.next(progress);

    expect(component.generationProgress).toEqual(progress);
  });

  it('should cancel generation through worker service', () => {
    component.isGenerating = true;
    component.generationProgress = {
      current: 1,
      total: 3,
      status: 'Processing image 2 of 3'
    };

    component.onCancelGeneration();

    expect(pdfWorkerService.cancel).toHaveBeenCalled();
    expect(component.isGenerating).toBe(false);
    expect(component.generationProgress).toBeNull();
  });

  it('should set tool definition correctly', () => {
    expect(component.toolDefinition.id).toBe('image-to-pdf');
    expect(component.toolDefinition.name).toBe('Image to PDF');
    expect(component.toolDefinition.enabled).toBe(true);
    expect(component.toolDefinition.category).toBe('convert');
  });
});