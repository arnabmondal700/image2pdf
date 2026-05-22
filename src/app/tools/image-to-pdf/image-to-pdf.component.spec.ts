import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ChangeDetectorRef } from '@angular/core';
declare const jasmine: any;

import { ImageToPdfComponent } from './image-to-pdf.component';
import { FileService, FileObject } from '../../services/file.service';
import { ImageOptimizerService } from '../../services/image-optimizer.service';
import { PDFService, type PDFSettings } from '../../services/pdf.service';
import { PdfSettingsStorageService } from '../../services/pdf-settings-storage.service';
import { PdfExtractionService } from '../../services/pdf-extraction.service';

describe('ImageToPdfComponent', () => {
  let component: ImageToPdfComponent;
  let fixture: ComponentFixture<ImageToPdfComponent>;
  let fileService: any;
  let imageOptimizer: any;
  let pdfService: any;
  let settingsStorage: any;
  let pdfExtraction: any;

  beforeEach(async () => {
    const fileServiceSpy = jasmine.createSpyObj('FileService', ['processFiles']);
    const imageOptimizerSpy = jasmine.createSpyObj('ImageOptimizerService', [
      'optimizeImage'
    ]);
    const pdfServiceSpy = jasmine.createSpyObj('PDFService', ['generatePDF']);
    const settingsStorageSpy = jasmine.createSpyObj('PdfSettingsStorageService', [
      'loadSettings',
      'saveSettings'
    ]);
    const pdfExtractionSpy = jasmine.createSpyObj('PdfExtractionService', [
      'extractPdfAsImages',
      'isPdfSupported'
    ]);

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
        { provide: PdfSettingsStorageService, useValue: settingsStorageSpy },
        { provide: PdfExtractionService, useValue: pdfExtractionSpy }
      ]
    }).compileComponents();

    fileService = TestBed.inject(FileService);
    imageOptimizer = TestBed.inject(ImageOptimizerService);
    pdfService = TestBed.inject(PDFService);
    settingsStorage = TestBed.inject(PdfSettingsStorageService);
    pdfExtraction = TestBed.inject(PdfExtractionService);

    fixture = TestBed.createComponent(ImageToPdfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default PDF settings', () => {
    settingsStorage.loadSettings.and.returnValue(null);
    const cdr = TestBed.inject(ChangeDetectorRef);
    const newComponent = new ImageToPdfComponent(
      fileService,
      imageOptimizer,
      pdfService,
      settingsStorage,
      pdfExtraction,
      cdr
    );
    expect(newComponent.pdfSettings).toBeDefined();
    expect(newComponent.pdfSettings.pageSize).toBe('a4');
    expect(newComponent.pdfSettings.orientation).toBe('portrait');
  });

  it('should load saved settings on initialization', () => {
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
    settingsStorage.loadSettings.and.returnValue(savedSettings);
    const cdr = TestBed.inject(ChangeDetectorRef);
    const newComponent = new ImageToPdfComponent(
      fileService,
      imageOptimizer,
      pdfService,
      settingsStorage,
      pdfExtraction,
      cdr
    );
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

    fileService.processFiles.and.returnValue(
      Promise.resolve({ successful: [mockFile], errors: [] })
    );

    await component.onFilesSelected([new File(['test'], 'test.png', { type: 'image/png' })]);

    expect(component.uploadedFiles).toContain(mockFile);
    expect(component.validationErrors.length).toBe(0);
  });

  it('should handle file validation errors', async () => {
    fileService.processFiles.and.returnValue(
      Promise.resolve({
        successful: [],
        errors: [{ fileName: 'test.pdf', reason: 'unsupported-type' as const }]
      })
    );

    await component.onFilesSelected([new File(['test'], 'test.pdf', { type: 'application/pdf' })]);

    expect(component.uploadedFiles.length).toBe(0);
    expect(component.validationErrors.length).toBe(1);
  });

  it('should remove file from upload queue', () => {
    const mockFile: FileObject = {
      name: 'test.png',
      url: 'data:image/png;base64,test',
      size: 1024,
      type: 'image/png',
      fileType: 'image'
    };
    component.uploadedFiles = [mockFile];

    component.onFileRemoved(0);

    expect(component.uploadedFiles.length).toBe(0);
  });

  it('should reorder files via drag-drop', () => {
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

    component.onFileReordered({ from: 0, to: 1 });

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
    expect(settingsStorage.saveSettings).toHaveBeenCalledWith(newSettings);
  });

  it('should set tool definition correctly', () => {
    expect(component.toolDefinition.id).toBe('image-to-pdf');
    expect(component.toolDefinition.name).toBe('Image to PDF');
    expect(component.toolDefinition.enabled).toBe(true);
    expect(component.toolDefinition.category).toBe('convert');
  });
});
