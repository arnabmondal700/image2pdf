import {
  calculateImageDimensions,
  calculateImagePosition,
  calculatePageLayout,
  coerceImagesPerPage,
  getOrientedPageDimensions,
  sanitizeMargins
} from './pdf-layout-engine';

describe('pdf-layout-engine', () => {
  it('coerces unsupported images-per-page values to one-up', () => {
    expect(coerceImagesPerPage('2')).toBe(2);
    expect(coerceImagesPerPage(4)).toBe(4);
    expect(coerceImagesPerPage(3)).toBe(1);
    expect(coerceImagesPerPage('nope')).toBe(1);
  });

  it('returns oriented page dimensions', () => {
    expect(getOrientedPageDimensions('a4', 'portrait')).toEqual({ width: 210, height: 297 });
    expect(getOrientedPageDimensions('a4', 'landscape')).toEqual({ width: 297, height: 210 });
  });

  it('sanitizes margins so printable area remains available', () => {
    const margins = sanitizeMargins(
      { top: 200, bottom: 200, left: 150, right: 150 },
      210,
      297
    );

    expect(margins.left + margins.right).toBeLessThanOrEqual(200);
    expect(margins.top + margins.bottom).toBeLessThanOrEqual(287);
  });

  it('calculates a two-up layout', () => {
    const cells = calculatePageLayout(2, 210, 297, {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10
    });

    expect(cells).toHaveLength(2);
    expect(cells[0]).toEqual({ x: 10, y: 10, width: 93, height: 277 });
    expect(cells[1]).toEqual({ x: 107, y: 10, width: 93, height: 277 });
  });

  it('calculates contain, cover, and stretch dimensions', () => {
    expect(calculateImageDimensions(100, 100, 200, 100, 'contain')).toEqual({
      width: 100,
      height: 50,
      scale: 0.5
    });
    expect(calculateImageDimensions(100, 100, 200, 100, 'cover')).toEqual({
      width: 200,
      height: 100,
      scale: 1
    });
    expect(calculateImageDimensions(100, 100, 200, 100, 'stretch')).toEqual({
      width: 100,
      height: 100,
      scale: 1
    });
  });

  it('aligns images vertically inside a cell', () => {
    expect(calculateImagePosition(10, 20, 100, 100, 50, 40, 'top')).toEqual({ x: 35, y: 20 });
    expect(calculateImagePosition(10, 20, 100, 100, 50, 40, 'center')).toEqual({ x: 35, y: 50 });
    expect(calculateImagePosition(10, 20, 100, 100, 50, 40, 'bottom')).toEqual({ x: 35, y: 80 });
  });
});
