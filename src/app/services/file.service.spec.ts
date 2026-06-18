import { FileObject, FileService } from './file.service';

describe('FileService', () => {
  let service: FileService;

  beforeEach(() => {
    service = new FileService();
  });

  it('reports unsupported file types without reading the file', async () => {
    const file = new File(['plain text'], 'notes.txt', { type: 'text/plain' });

    const result = await service.processFiles([file]);

    expect(result.successful).toEqual([]);
    expect(result.errors).toEqual([
      { fileName: 'notes.txt', reason: 'unsupported-type' }
    ]);
  });

  it('reports oversized image files', async () => {
    const oversizedBytes = new Uint8Array(50 * 1024 * 1024 + 1);
    const file = new File([oversizedBytes], 'large.jpg', { type: 'image/jpeg' });

    const result = await service.processFiles([file]);

    expect(result.successful).toEqual([]);
    expect(result.errors).toEqual([
      { fileName: 'large.jpg', reason: 'exceeds-size-limit' }
    ]);
  });

  it('processes valid image files with metadata', async () => {
    const file = new File(['image'], 'photo.png', { type: 'image/png' });

    const result = await service.processFiles([file]);

    expect(result.errors).toEqual([]);
    expect(result.successful).toHaveLength(1);
    expect(result.successful[0].name).toBe('photo.png');
    expect(result.successful[0].size).toBe(file.size);
    expect(result.successful[0].type).toBe('image/png');
    expect(result.successful[0].url).toContain('data:image/png');
  });

  it('reorders files while preserving the source array', () => {
    const files: FileObject[] = [
      { name: 'one.png', url: 'one', size: 1, type: 'image/png' },
      { name: 'two.png', url: 'two', size: 1, type: 'image/png' },
      { name: 'three.png', url: 'three', size: 1, type: 'image/png' }
    ];

    const reordered = service.reorderFiles(files, 0, 2);

    expect(reordered.map((file) => file.name)).toEqual(['two.png', 'three.png', 'one.png']);
    expect(files.map((file) => file.name)).toEqual(['one.png', 'two.png', 'three.png']);
  });
});
