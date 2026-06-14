import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PdfProtectComponent } from './pdf-protect.component';
import { PdfProtectionService } from '../../services/pdf-protection.service';
import { FileService, FileObject } from '../../services/file.service';
import { vi } from 'vitest';

describe('PdfProtectComponent', () => {
  let component: PdfProtectComponent;
  let fixture: ComponentFixture<PdfProtectComponent>;
  let mockPdfProtectionService: any;
  let mockFileService: any;

  beforeEach(async () => {
    mockPdfProtectionService = {
      addPassword: vi.fn().mockResolvedValue({
        blob: new Blob(['test'], { type: 'application/pdf' }),
        originalName: 'test',
        protectedName: 'test-protected'
      }),
      removePassword: vi.fn().mockResolvedValue({
        blob: new Blob(['test'], { type: 'application/pdf' }),
        originalName: 'test',
        protectedName: 'test-decrypted'
      }),
      sanitizeFileName: vi.fn((name: string) => name?.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '') || ''),
      downloadPDF: vi.fn()
    };

    mockFileService = {
      processFiles: vi.fn().mockResolvedValue({
        successful: [
          {
            name: 'document.pdf',
            type: 'application/pdf',
            size: 50000,
            url: 'blob:test-url'
          } as FileObject
        ],
        errors: []
      })
    };

    await TestBed.configureTestingModule({
      imports: [PdfProtectComponent],
      providers: [
        { provide: PdfProtectionService, useValue: mockPdfProtectionService },
        { provide: FileService, useValue: mockFileService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PdfProtectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should start in add password mode by default', () => {
    expect(component.mode).toBe('add');
  });

  it('should have correct tool definition', () => {
    expect(component.toolDefinition.id).toBe('pdf-protect');
    expect(component.toolDefinition.path).toBe('protect');
    expect(component.toolDefinition.category).toBe('secure');
    expect(component.toolDefinition.priority).toBe(60);
  });

  it('should handle file selection', async () => {
    const mockFiles = [new File(['test'], 'document.pdf', { type: 'application/pdf' })];
    await component.onFilesSelected(mockFiles);

    expect(component.uploadedPdf).toBeDefined();
    expect(component.uploadedPdf?.name).toBe('document.pdf');
    expect(component.generalError).toBeNull();
  });

  it('should handle PDF removal', () => {
    component.uploadedPdf = { name: 'test.pdf', type: 'application/pdf', size: 50000 } as FileObject;
    component.outputFileName = 'test-output';
    component.userPassword = 'password123';
    component.confirmPassword = 'password123';

    component.onPdfRemoved();

    expect(component.uploadedPdf).toBeNull();
    expect(component.outputFileName).toBe('');
    expect(component.userPassword).toBe('');
    expect(component.confirmPassword).toBe('');
  });

  it('should toggle mode correctly', () => {
    component.toggleMode('remove');
    expect(component.mode).toBe('remove');

    component.toggleMode('add');
    expect(component.mode).toBe('add');
  });

  it('should toggle password visibility', () => {
    expect(component.showUserPassword).toBe(false);
    component.togglePasswordVisibility('user');
    expect(component.showUserPassword).toBe(true);
    component.togglePasswordVisibility('user');
    expect(component.showUserPassword).toBe(false);

    expect(component.showConfirmPassword).toBe(false);
    component.togglePasswordVisibility('confirm');
    expect(component.showConfirmPassword).toBe(true);

    expect(component.showOwnerPassword).toBe(false);
    component.togglePasswordVisibility('owner');
    expect(component.showOwnerPassword).toBe(true);
  });

  it('should update permissions', () => {
    expect(component.permissions.canPrint).toBe(true);
    component.updatePermission('canPrint', false);
    expect(component.permissions.canPrint).toBe(false);
  });

  it('should disable apply button when no PDF is uploaded', () => {
    component.uploadedPdf = null;
    expect(component.isApplyDisabled()).toBe(true);
  });

  it('should disable apply button when processing', () => {
    component.uploadedPdf = { name: 'test.pdf' } as FileObject;
    component.userPassword = 'password123';
    component.confirmPassword = 'password123';
    component.isProcessing = true;
    expect(component.isApplyDisabled()).toBe(true);
  });

  it('should disable apply in add mode when passwords do not match', () => {
    component.uploadedPdf = { name: 'test.pdf' } as FileObject;
    component.mode = 'add';
    component.userPassword = 'pass1';
    component.confirmPassword = 'pass2';
    expect(component.isApplyDisabled()).toBe(true);
  });

  it('should disable apply in add mode with short password', () => {
    component.uploadedPdf = { name: 'test.pdf' } as FileObject;
    component.mode = 'add';
    component.userPassword = 'ab';
    component.confirmPassword = 'ab';
    expect(component.isApplyDisabled()).toBe(true);
  });

  it('should enable apply in add mode with valid inputs', () => {
    component.uploadedPdf = { name: 'test.pdf' } as FileObject;
    component.mode = 'add';
    component.userPassword = 'password123';
    component.confirmPassword = 'password123';
    expect(component.isApplyDisabled()).toBe(false);
  });

  it('should disable apply in remove mode without password', () => {
    component.uploadedPdf = { name: 'test.pdf' } as FileObject;
    component.mode = 'remove';
    component.userPassword = '';
    expect(component.isApplyDisabled()).toBe(true);
  });

  it('should enable apply in remove mode with password', () => {
    component.uploadedPdf = { name: 'test.pdf' } as FileObject;
    component.mode = 'remove';
    component.userPassword = 'password123';
    expect(component.isApplyDisabled()).toBe(false);
  });

  it('should call addPassword on apply in add mode', async () => {
    component.uploadedPdf = { name: 'test.pdf', type: 'application/pdf', size: 50000 } as FileObject;
    component.mode = 'add';
    component.userPassword = 'password123';
    component.confirmPassword = 'password123';
    component.outputFileName = 'my-protected';

    await component.onApply();

    expect(mockPdfProtectionService.addPassword).toHaveBeenCalledWith(
      component.uploadedPdf,
      { userPassword: 'password123' },
      'my-protected'
    );
    expect(mockPdfProtectionService.downloadPDF).toHaveBeenCalled();
  });

  it('should call addPassword with owner password when provided', async () => {
    component.uploadedPdf = { name: 'test.pdf', type: 'application/pdf', size: 50000 } as FileObject;
    component.mode = 'add';
    component.userPassword = 'password123';
    component.confirmPassword = 'password123';
    component.ownerPassword = 'ownerpass123';

    await component.onApply();

    expect(mockPdfProtectionService.addPassword).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        userPassword: 'password123',
        ownerPassword: 'ownerpass123',
        permissions: expect.any(Object)
      }),
      expect.any(String)
    );
  });

  it('should call removePassword on apply in remove mode', async () => {
    component.uploadedPdf = { name: 'test.pdf', type: 'application/pdf', size: 50000 } as FileObject;
    component.mode = 'remove';
    component.userPassword = 'currentpass';
    component.outputFileName = 'my-decrypted';

    await component.onApply();

    expect(mockPdfProtectionService.removePassword).toHaveBeenCalledWith(
      component.uploadedPdf,
      'currentpass',
      'my-decrypted'
    );
    expect(mockPdfProtectionService.downloadPDF).toHaveBeenCalled();
  });

  it('should set generalError when no PDF uploaded on apply', async () => {
    component.uploadedPdf = null;
    component.generalError = null;

    await component.onApply();

    expect(component.generalError).toBe('Please upload a PDF first');
  });

  it('should handle service errors gracefully', async () => {
    component.uploadedPdf = { name: 'test.pdf', type: 'application/pdf', size: 50000 } as FileObject;
    component.mode = 'add';
    component.userPassword = 'password123';
    component.confirmPassword = 'password123';
    mockPdfProtectionService.addPassword.mockRejectedValue(new Error('Encryption failed'));

    await component.onApply();

    expect(component.generalError).toBe('Encryption failed');
    expect(component.isProcessing).toBe(false);
  });

  it('should clear all state on clearAll', () => {
    component.uploadedPdf = { name: 'test.pdf' } as FileObject;
    component.userPassword = 'pass';
    component.mode = 'remove';

    component.clearAll();

    expect(component.uploadedPdf).toBeNull();
    expect(component.userPassword).toBe('');
    expect(component.mode).toBe('add');
  });

  it('should check passwords match', () => {
    component.userPassword = 'password123';
    component.confirmPassword = 'password123';
    expect(component.passwordsMatch()).toBe(true);

    component.confirmPassword = 'different';
    expect(component.passwordsMatch()).toBe(false);
  });

  it('should return correct button label based on state', () => {
    expect(component.getApplyButtonLabel()).toBe('Upload PDF to start');

    component.uploadedPdf = { name: 'test.pdf' } as FileObject;
    component.mode = 'add';
    expect(component.getApplyButtonLabel()).toBe('Apply Password Protection');

    component.mode = 'remove';
    expect(component.getApplyButtonLabel()).toBe('Remove Password');

    component.isProcessing = true;
    expect(component.getApplyButtonLabel()).toBe('Removing password...');

    component.mode = 'add';
    component.isProcessing = true;
    expect(component.getApplyButtonLabel()).toBe('Applying protection...');
  });

  it('should manage drag state', () => {
    expect(component.isDragging).toBe(false);
    // Use Event instead of DragEvent for jsdom compatibility
    component.onDragOverZone(new Event('dragover') as DragEvent);
    expect(component.isDragging).toBe(true);
    component.onDragLeaveZone();
    expect(component.isDragging).toBe(false);
  });

  it('should return correct info text', () => {
    expect(component.getInfoText()).toBe('Upload a PDF to begin');

    component.uploadedPdf = { name: 'test.pdf', size: 50000 } as FileObject;
    expect(component.getInfoText()).toContain('test.pdf');
    expect(component.getInfoText()).toContain('48.8 KB');
  });

  it('should get password input type', () => {
    expect(component.getPasswordInputType(false)).toBe('password');
    expect(component.getPasswordInputType(true)).toBe('text');
  });
});