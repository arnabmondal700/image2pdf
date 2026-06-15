vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  getDocument: vi.fn(() => ({
    promise: Promise.reject(new Error('Invalid PDF')),
  })),
}));

import { TestBed } from '@angular/core/testing';
import { MixedDocumentService } from './mixed-document.service';
import { PdfExtractionService } from './pdf-extraction.service';
import { FileService } from './file.service';
import { DocumentItem } from '../models/document-item.model';

describe('MixedDocumentService', () => {
  let service: MixedDocumentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MixedDocumentService,
        PdfExtractionService,
        FileService,
      ],
    });
    service = TestBed.inject(MixedDocumentService);
    service.resetIdCounter();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate unique IDs', () => {
    const id1 = service.generateId();
    const id2 = service.generateId();
    expect(id1).not.toBe(id2);
  });

  describe('Queue Operations', () => {
    let items: DocumentItem[];

    beforeEach(() => {
      items = [
        {
          id: service.generateId(),
          type: 'image',
          name: 'test1.jpg',
          order: 0,
          rotation: 0,
          selected: false,
        },
        {
          id: service.generateId(),
          type: 'image',
          name: 'test2.jpg',
          order: 1,
          rotation: 0,
          selected: false,
        },
        {
          id: service.generateId(),
          type: 'image',
          name: 'test3.jpg',
          order: 2,
          rotation: 0,
          selected: false,
        },
      ];
    });

    it('should reorder items', () => {
      const result = service.reorderItems(items, 0, 2);
      expect(result[0].name).toBe('test2.jpg');
      expect(result[1].name).toBe('test3.jpg');
      expect(result[2].name).toBe('test1.jpg');
      expect(result[0].order).toBe(0);
      expect(result[1].order).toBe(1);
      expect(result[2].order).toBe(2);
    });

    it('should not reorder if same index', () => {
      const result = service.reorderItems(items, 1, 1);
      expect(result.length).toBe(3);
      expect(result[0].name).toBe('test1.jpg');
    });

    it('should remove items by indices', () => {
      const result = service.removeItems(items, [1]);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('test1.jpg');
      expect(result[1].name).toBe('test3.jpg');
    });

    it('should remove multiple items', () => {
      const result = service.removeItems(items, [0, 2]);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('test2.jpg');
    });

    it('should rotate an item by 90 degrees', () => {
      const result = service.rotateItem(items, 1);
      expect(result[1].rotation).toBe(90);
    });

    it('should wrap rotation to 360 degrees', () => {
      const rotated45 = [{ ...items[0], rotation: 45 }];
      const result = service.rotateItem(rotated45, 0);
      expect(result[0].rotation).toBe(135);
    });

    it('should duplicate items', () => {
      const result = service.duplicateItems(items, [0, 2]);
      expect(result.length).toBe(5);
      expect(result[0].name).toBe('test1.jpg');
      expect(result[1].name).toBe('test1.jpg (Copy)');
      expect(result[2].name).toBe('test2.jpg');
      expect(result[3].name).toBe('test3.jpg');
      expect(result[4].name).toBe('test3.jpg (Copy)');
    });

    it('should duplicate a single item', () => {
      const result = service.duplicateItems(items, [0]);
      expect(result.length).toBe(4);
      expect(result[0].name).toBe('test1.jpg');
      expect(result[1].name).toBe('test1.jpg (Copy)');
    });

    it('should toggle selection', () => {
      const result = service.toggleSelection(items, 1);
      expect(result[1].selected).toBe(true);
      expect(result[0].selected).toBeFalsy();
    });

    it('should select a range of items', () => {
      const result = service.selectRange(items, 0, 2);
      expect(result[0].selected).toBe(true);
      expect(result[1].selected).toBe(true);
      expect(result[2].selected).toBe(true);
    });

    it('should toggle select all', () => {
      const selected = service.selectAll(items);
      expect(selected.every((i) => i.selected === true)).toBe(true);
      const deselected = service.selectAll(selected);
      expect(deselected.every((i) => i.selected === false)).toBe(true);
    });

    it('should clear selection', () => {
      const selected = items.map((i) => ({ ...i, selected: true }));
      const result = service.clearSelection(selected);
      expect(result.every((i) => i.selected === false)).toBe(true);
    });

    it('should get selected indices', () => {
      const selected = items.map((i, idx) => ({ ...i, selected: idx === 1 }));
      const indices = service.getSelectedIndices(selected);
      expect(indices).toEqual([1]);
    });

    it('should delete selected items', () => {
      const selected = items.map((i, idx) => ({ ...i, selected: idx === 1 }));
      const result = service.deleteSelected(selected);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('test1.jpg');
      expect(result[1].name).toBe('test3.jpg');
    });

    it('should rotate selected items', () => {
      const selected = items.map((i, idx) => ({ ...i, selected: idx === 1 }));
      const result = service.rotateSelected(selected);
      expect(result[1].rotation).toBe(90);
      expect(result[0].rotation).toBe(0);
    });

    it('should duplicate selected items', () => {
      const selected = items.map((i, idx) => ({ ...i, selected: idx === 1 }));
      const result = service.duplicateSelected(selected);
      expect(result.length).toBe(4);
    });

    it('should move item up', () => {
      const result = service.moveUp(items, 2);
      expect(result[1].name).toBe('test3.jpg');
      expect(result[2].name).toBe('test2.jpg');
    });

    it('should move item down', () => {
      const result = service.moveDown(items, 0);
      expect(result[0].name).toBe('test2.jpg');
      expect(result[1].name).toBe('test1.jpg');
    });

    it('should not move first item up', () => {
      const result = service.moveUp(items, 0);
      expect(result).toEqual(items);
    });

    it('should not move last item down', () => {
      const result = service.moveDown(items, 2);
      expect(result).toEqual(items);
    });
  });

  describe('Validation', () => {
    it('should reject empty queue', () => {
      const result = service.validateQueue([]);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Queue is empty. Add at least one item.');
    });

    it('should accept valid queue with only images', () => {
      const items: DocumentItem[] = [
        {
          id: service.generateId(),
          type: 'image',
          name: 'test.jpg',
          order: 0,
          url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        },
      ];
      const result = service.validateQueue(items);
      expect(result.valid).toBe(true);
    });

    it('should detect missing page index for PDF items', () => {
      const items: DocumentItem[] = [
        {
          id: service.generateId(),
          type: 'pdf-page',
          name: 'test.pdf - Page 1',
          order: 0,
          pdfPageIndex: undefined,
        },
      ];
      const result = service.validateQueue(items);
      expect(result.valid).toBe(false);
    });

    it('should detect out of range page index', () => {
      const items: DocumentItem[] = [
        {
          id: service.generateId(),
          type: 'pdf-page',
          name: 'test.pdf - Page 999',
          order: 0,
          pdfPageIndex: 10,
          sourcePdfPageCount: 5,
        },
      ];
      const result = service.validateQueue(items);
      expect(result.valid).toBe(false);
    });

    it('should detect missing URL', () => {
      const items: DocumentItem[] = [
        {
          id: service.generateId(),
          type: 'image',
          name: 'test.jpg',
          order: 0,
          url: undefined,
        },
      ];
      const result = service.validateQueue(items);
      expect(result.valid).toBe(false);
    });

    it('should validate mixed queue with valid items', () => {
      const items: DocumentItem[] = [
        {
          id: service.generateId(),
          type: 'image',
          name: 'image.jpg',
          order: 0,
          url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        },
        {
          id: service.generateId(),
          type: 'pdf-page',
          name: 'doc.pdf - Page 1',
          order: 1,
          pdfPageIndex: 0,
          sourcePdfPageCount: 3,
          url: 'blob:test',
        },
      ];
      const result = service.validateQueue(items);
      expect(result.valid).toBe(true);
    });
  });
});