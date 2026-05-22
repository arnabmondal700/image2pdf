import { TestBed } from '@angular/core/testing';
import { ToolRegistryService } from '../tools/tool-registry.service';
import type { ToolDefinition } from '../tools/tool.interface';

describe('ToolRegistryService', () => {
  let service: ToolRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToolRegistryService]
    });
    service = TestBed.inject(ToolRegistryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have pre-registered tools', () => {
    const tools = service.getAllTools();
    expect(tools.length).toBeGreaterThan(0);
  });

  it('should get tool by ID', () => {
    const tool = service.getTool('image-to-pdf');
    expect(tool).toBeDefined();
    expect(tool?.id).toBe('image-to-pdf');
  });

  it('should return null for non-existent tool', () => {
    const tool = service.getTool('non-existent-tool');
    expect(tool).toBeNull();
  });

  it('should get only enabled tools', () => {
    const enabledTools = service.getEnabledTools();
    const allDisabled = enabledTools.every((tool) => tool.enabled === true);
    expect(allDisabled).toBe(true);
  });

  it('should filter tools by category', () => {
    const conversionTools = service.getToolsByCategory('convert');
    expect(conversionTools.length).toBeGreaterThan(0);
    const allConversion = conversionTools.every((tool) => tool.category === 'convert');
    expect(allConversion).toBe(true);
  });

  it('should register new tool', () => {
    const newTool: ToolDefinition = {
      id: 'test-tool',
      name: 'Test Tool',
      description: 'Test tool description',
      icon: 'test-icon',
      path: 'test-tool',
      category: 'convert',
      enabled: true,
      priority: 1
    };

    service.registerTool(newTool);
    const registered = service.getTool('test-tool');
    expect(registered).toEqual(newTool);
  });

  it('should sort tools by priority', () => {
    const tools = service.getEnabledTools();
    for (let i = 0; i < tools.length - 1; i++) {
      expect(tools[i].priority).toBeLessThanOrEqual(tools[i + 1].priority);
    }
  });

  it('should have image-to-pdf tool as first enabled tool', () => {
    const enabledTools = service.getEnabledTools();
    const firstTool = enabledTools[0];
    expect(firstTool.id).toBe('image-to-pdf');
  });

  it('should have pdf-preview tool as second enabled tool', () => {
    const enabledTools = service.getEnabledTools();
    const secondTool = enabledTools[1];
    expect(secondTool.id).toBe('pdf-preview');
  });

  it('should have disabled tools not included in enabled list', () => {
    const enabledTools = service.getEnabledTools();
    const toolIds = enabledTools.map((t) => t.id);
    expect(toolIds).not.toContain('pdf-merge');
    expect(toolIds).not.toContain('pdf-split');
    expect(toolIds).not.toContain('pdf-compress');
  });

  it('should return tools sorted by priority when getting all tools', () => {
    const tools = service.getAllTools();
    for (let i = 0; i < tools.length - 1; i++) {
      expect(tools[i].priority).toBeLessThanOrEqual(tools[i + 1].priority);
    }
  });
});
