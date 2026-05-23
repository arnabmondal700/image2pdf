import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GeneratePDFButtonComponent } from './generate-pdf-button.component';

describe('GeneratePDFButtonComponent', () => {
  let component: GeneratePDFButtonComponent;
  let fixture: ComponentFixture<GeneratePDFButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneratePDFButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GeneratePDFButtonComponent);
    component = fixture.componentInstance;
  });

  it('should disable generation without files', () => {
    component.uploadedFiles = [];

    expect(component.isDisabled()).toBe(true);
  });

  it('should emit generate when files are ready', () => {
    const emit = vi.spyOn(component.generateClicked, 'emit');
    component.uploadedFiles = [
      { name: 'one.jpg', type: 'image/jpeg', size: 1, url: 'data:image/jpeg;base64,one' }
    ];

    component.onGenerateClick();

    expect(emit).toHaveBeenCalled();
  });

  it('should report progress percent and label while generating', () => {
    component.generationProgress = {
      current: 2,
      total: 4,
      status: 'Processing image 3 of 4'
    };

    expect(component.getProgressPercent()).toBe(50);
    expect(component.getProgressLabel()).toBe('Processing image 3 of 4');
  });

  it('should emit cancel only while generating', () => {
    const emit = vi.spyOn(component.cancelClicked, 'emit');
    const event = new Event('click');
    const stopPropagation = vi.spyOn(event, 'stopPropagation');

    component.isGenerating = true;
    component.onCancelClick(event);

    expect(stopPropagation).toHaveBeenCalled();
    expect(emit).toHaveBeenCalled();
  });
});
