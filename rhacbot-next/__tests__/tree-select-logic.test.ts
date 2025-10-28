/**
 * Tree Select Logic Test Suite
 * 
 * Tests the hierarchical tree selection logic for the Send Message page.
 * Ensures proper parent-child relationships and correct backend request formatting.
 * 
 * Hierarchy:
 * - Campuswide (root)
 *   - Region Campus (e.g., North Campus, South Campus, West Campus)
 *     - Building (individual residence halls)
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock buildings data matching the structure in buildings.json
const mockBuildings = [
  { id: 1, name: 'Building A', region: 'North' },
  { id: 2, name: 'Building B', region: 'North' },
  { id: 3, name: 'Building C', region: 'South' },
  { id: 4, name: 'Building D', region: 'South' },
  { id: 5, name: 'Building E', region: 'West' },
  { id: 6, name: 'Building F', region: 'West' },
];

// Helper to build tree structure (mimicking the component logic)
function buildTreeData(buildings: typeof mockBuildings) {
  const buildingsByRegion = buildings.reduce((acc: Record<string, typeof mockBuildings>, b) => {
    const region = b.region || 'Unknown';
    if (!acc[region]) acc[region] = [];
    acc[region].push(b);
    return acc;
  }, {});

  const regionNodes = Object.entries(buildingsByRegion).map(([regionName, regionBuildings]) => ({
    title: `${regionName} Campus`,
    value: `region-${regionName}`,
    selectable: true,
    children: regionBuildings.map((building) => ({ 
      title: building.name, 
      value: String(building.id),
      selectable: true 
    })),
  }));

  return [{
    title: 'Campuswide',
    value: 'region-all',
    selectable: true,
    children: regionNodes
  }];
}

// Helper to simulate the tree select change handler logic
function handleTreeSelectChange(newValue: any[], treeData: any[]) {
  const valueSet = new Set(newValue.map((v: any) => v.value || v));
  const resultValues: any[] = [];

  const allRegionsNode = treeData[0];
  const allRegionValue = 'region-all';
  const allRegions: string[] = [];
  const regionToBuildings = new Map<string, string[]>();
  
  allRegionsNode.children?.forEach((regionNode: any) => {
    const regionValue = String(regionNode.value);
    allRegions.push(regionValue);
    
    if (regionNode.children && regionNode.children.length > 0) {
      const buildingIds = regionNode.children.map((child: any) => String(child.value));
      regionToBuildings.set(regionValue, buildingIds);
    }
  });

  if (valueSet.has(allRegionValue)) {
    resultValues.push({ value: allRegionValue, label: 'Campuswide' });
    return resultValues;
  }

  const allRegionsSelected = allRegions.every((r) => valueSet.has(r));
  if (allRegionsSelected && allRegions.length > 0) {
    resultValues.push({ value: allRegionValue, label: 'Campuswide' });
    return resultValues;
  }

  valueSet.forEach((value) => {
    const strValue = String(value);
    
    if (strValue.startsWith('region-') && strValue !== allRegionValue) {
      const buildings = regionToBuildings.get(strValue) || [];
      
      // If region is explicitly selected, keep it regardless of children
      // OR if all children are selected, keep the region
      const allChildrenSelected = buildings.length > 0 && buildings.every((bid) => valueSet.has(bid));
      
      // Keep the region if it's selected directly or all children are selected
      const regionNode = allRegionsNode.children?.find((n: any) => n.value === strValue);
      resultValues.push({ value: strValue, label: regionNode?.title || strValue });
      // Remove children from valueSet so they don't appear individually
      buildings.forEach((bid) => valueSet.delete(bid));
    }
  });

  valueSet.forEach((value) => {
    const strValue = String(value);
    if (!strValue.startsWith('region-')) {
      let buildingName = strValue;
      allRegionsNode.children?.forEach((regionNode: any) => {
        const child = regionNode.children?.find((c: any) => String(c.value) === strValue);
        if (child) buildingName = child.title || strValue;
      });
      resultValues.push({ value: strValue, label: buildingName });
    }
  });

  regionToBuildings.forEach((buildings, regionValue) => {
    const regionInResult = resultValues.some((v) => v.value === regionValue);
    if (!regionInResult && buildings.length > 0) {
      const allChildrenSelected = buildings.every((bid) => 
        resultValues.some((v) => v.value === bid)
      );
      if (allChildrenSelected) {
        const filteredValues = resultValues.filter((v) => !buildings.includes(v.value));
        const regionNode = allRegionsNode.children?.find((n: any) => n.value === regionValue);
        filteredValues.push({ 
          value: regionValue, 
          label: regionNode?.title || regionValue 
        });
        resultValues.length = 0;
        resultValues.push(...filteredValues);
      }
    }
  });

  return resultValues;
}

// Helper to extract backend request format from selection
function extractBackendFormat(selectedValues: any[]) {
  const regions: string[] = [];
  const buildingIds: string[] = [];

  selectedValues.forEach((valueObj: any) => {
    const value = valueObj.value || valueObj;
    const strValue = String(value);
    if (strValue.startsWith('region-')) {
      regions.push(strValue.replace('region-', ''));
    } else {
      buildingIds.push(strValue);
    }
  });

  return { regions, buildingIds };
}

describe('Tree Select Logic - Hierarchy Structure', () => {
  let treeData: any[];

  beforeEach(() => {
    treeData = buildTreeData(mockBuildings);
  });

  it('should create a three-level hierarchy: Campuswide > Region Campus > Buildings', () => {
    expect(treeData).toHaveLength(1);
    expect(treeData[0].value).toBe('region-all');
    expect(treeData[0].title).toBe('Campuswide');
    expect(treeData[0].children).toHaveLength(3); // North, South, West
  });

  it('should have correct region nodes as children of Campuswide', () => {
    const regions = treeData[0].children;
    const regionNames = regions.map((r: any) => r.title);
    expect(regionNames).toContain('North Campus');
    expect(regionNames).toContain('South Campus');
    expect(regionNames).toContain('West Campus');
  });

  it('should have buildings as children of each region', () => {
    const northRegion = treeData[0].children.find((r: any) => r.title === 'North Campus');
    expect(northRegion.children).toHaveLength(2); // Building A, B
    expect(northRegion.children[0].title).toBe('Building A');
    expect(northRegion.children[0].value).toBe('1');
  });
});

describe('Tree Select Logic - Parent Selection Behavior', () => {
  let treeData: any[];

  beforeEach(() => {
    treeData = buildTreeData(mockBuildings);
  });

  it('should select "Campuswide" and return only that when "Campuswide" is checked', () => {
    const selection = [{ value: 'region-all', label: 'Campuswide' }];
    const result = handleTreeSelectChange(selection, treeData);
    
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('region-all');
  });

  it('should auto-select "Campuswide" when all individual regions are selected', () => {
    const selection = [
      { value: 'region-North', label: 'North Campus' },
      { value: 'region-South', label: 'South Campus' },
      { value: 'region-West', label: 'West Campus' }
    ];
    const result = handleTreeSelectChange(selection, treeData);
    
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('region-all');
    expect(result[0].label).toBe('Campuswide');
  });

  it('should select region when region checkbox is checked', () => {
    const selection = [{ value: 'region-North', label: 'North Campus' }];
    const result = handleTreeSelectChange(selection, treeData);
    
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('region-North');
    expect(result[0].label).toBe('North Campus');
  });

  it('should select all buildings in region when region is checked', () => {
    // When user clicks region, TreeSelect will include region + all buildings
    const selection = [
      { value: 'region-North', label: 'North Campus' },
      { value: '1', label: 'Building A' },
      { value: '2', label: 'Building B' }
    ];
    const result = handleTreeSelectChange(selection, treeData);
    
    // Should collapse to just the region
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('region-North');
  });
});

describe('Tree Select Logic - Child Selection Behavior', () => {
  let treeData: any[];

  beforeEach(() => {
    treeData = buildTreeData(mockBuildings);
  });

  it('should show individual buildings when only some are selected', () => {
    const selection = [
      { value: '1', label: 'Building A' }
    ];
    const result = handleTreeSelectChange(selection, treeData);
    
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('1');
    expect(result[0].label).toBe('Building A');
  });

  it('should auto-select region when all buildings in that region are manually selected', () => {
    const selection = [
      { value: '1', label: 'Building A' },
      { value: '2', label: 'Building B' }
    ];
    const result = handleTreeSelectChange(selection, treeData);
    
    // Should collapse to the region
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('region-North');
    expect(result[0].label).toBe('North Campus');
  });

  it('should deselect region when one building is deselected', () => {
    // Start with region selected, user deselects one building
    const selection = [
      { value: '1', label: 'Building A' }
      // Building B (id: 2) is not in selection
    ];
    const result = handleTreeSelectChange(selection, treeData);
    
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('1');
    // Region should not be in result
    expect(result.find((r) => r.value === 'region-North')).toBeUndefined();
  });

  it('should maintain other building selections when parent is deselected', () => {
    const selection = [
      { value: '1', label: 'Building A' },
      { value: '3', label: 'Building C' }
    ];
    const result = handleTreeSelectChange(selection, treeData);
    
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.value === '1')).toBeDefined();
    expect(result.find((r) => r.value === '3')).toBeDefined();
  });
});

describe('Tree Select Logic - Mixed Selection Behavior', () => {
  let treeData: any[];

  beforeEach(() => {
    treeData = buildTreeData(mockBuildings);
  });

  it('should handle mixed region and individual building selections', () => {
    const selection = [
      { value: 'region-North', label: 'North' },
      { value: 'region-North', label: 'North' },
      { value: '1', label: 'Building A' },
      { value: '2', label: 'Building B' },
      { value: '3', label: 'Building C' }
    ];
    const result = handleTreeSelectChange(selection, treeData);
    
    // Should have North region + Building C
    expect(result.find((r) => r.value === 'region-North')).toBeDefined();
    expect(result.find((r) => r.value === '3')).toBeDefined();
    // Buildings A and B should be absorbed into North region
    expect(result.find((r) => r.value === '1')).toBeUndefined();
    expect(result.find((r) => r.value === '2')).toBeUndefined();
  });

  it('should handle two complete regions and one partial region', () => {
    const selection = [
      { value: 'region-North', label: 'North' },
      { value: '1', label: 'Building A' },
      { value: '2', label: 'Building B' },
      { value: 'region-South', label: 'South' },
      { value: '3', label: 'Building C' },
      { value: '4', label: 'Building D' },
      { value: '5', label: 'Building E' }
      // Building F (id: 6) not selected
    ];
    const result = handleTreeSelectChange(selection, treeData);
    
    expect(result.find((r) => r.value === 'region-North')).toBeDefined();
    expect(result.find((r) => r.value === 'region-South')).toBeDefined();
    expect(result.find((r) => r.value === '5')).toBeDefined();
    expect(result.find((r) => r.value === 'region-West')).toBeUndefined();
  });
});

describe('Backend Request Format - Region Selections', () => {
  let treeData: any[];

  beforeEach(() => {
    treeData = buildTreeData(mockBuildings);
  });

  it('should send "all" when "Campuswide" is selected', () => {
    const selection = [{ value: 'region-all', label: 'Campuswide' }];
    const result = handleTreeSelectChange(selection, treeData);
    const backendFormat = extractBackendFormat(result);
    
    expect(backendFormat.regions).toEqual(['all']);
    expect(backendFormat.buildingIds).toEqual([]);
  });

  it('should send region name when region is selected', () => {
    const selection = [{ value: 'region-North', label: 'North Campus' }];
    const result = handleTreeSelectChange(selection, treeData);
    const backendFormat = extractBackendFormat(result);
    
    expect(backendFormat.regions).toEqual(['North']);
    expect(backendFormat.buildingIds).toEqual([]);
  });

  it('should send multiple region names when multiple regions selected', () => {
    const selection = [
      { value: 'region-North', label: 'North' },
      { value: '1', label: 'Building A' },
      { value: '2', label: 'Building B' },
      { value: 'region-South', label: 'South' },
      { value: '3', label: 'Building C' },
      { value: '4', label: 'Building D' }
    ];
    const result = handleTreeSelectChange(selection, treeData);
    const backendFormat = extractBackendFormat(result);
    
    expect(backendFormat.regions).toContain('North');
    expect(backendFormat.regions).toContain('South');
    expect(backendFormat.regions).toHaveLength(2);
    expect(backendFormat.buildingIds).toEqual([]);
  });

  it('should send building IDs when individual buildings are selected', () => {
    const selection = [
      { value: '1', label: 'Building A' },
      { value: '3', label: 'Building C' }
    ];
    const result = handleTreeSelectChange(selection, treeData);
    const backendFormat = extractBackendFormat(result);
    
    expect(backendFormat.regions).toEqual([]);
    expect(backendFormat.buildingIds).toEqual(['1', '3']);
  });

  it('should send both regions and building IDs for mixed selections', () => {
    const selection = [
      { value: 'region-North', label: 'North' },
      { value: '1', label: 'Building A' },
      { value: '2', label: 'Building B' },
      { value: '3', label: 'Building C' }
    ];
    const result = handleTreeSelectChange(selection, treeData);
    const backendFormat = extractBackendFormat(result);
    
    expect(backendFormat.regions).toEqual(['North']);
    expect(backendFormat.buildingIds).toEqual(['3']);
  });
});

describe('Backend Request Format - Edge Cases', () => {
  let treeData: any[];

  beforeEach(() => {
    treeData = buildTreeData(mockBuildings);
  });

  it('should handle empty selection', () => {
    const selection: any[] = [];
    const result = handleTreeSelectChange(selection, treeData);
    const backendFormat = extractBackendFormat(result);
    
    expect(backendFormat.regions).toEqual([]);
    expect(backendFormat.buildingIds).toEqual([]);
  });

  it('should not send duplicate regions', () => {
    const selection = [
      { value: 'region-North', label: 'North' },
      { value: 'region-North', label: 'North' }
    ];
    const result = handleTreeSelectChange(selection, treeData);
    const backendFormat = extractBackendFormat(result);
    
    expect(backendFormat.regions).toEqual(['North']);
  });

  it('should not send building IDs when their parent region is selected', () => {
    const selection = [
      { value: 'region-North', label: 'North' },
      { value: '1', label: 'Building A' },
      { value: '2', label: 'Building B' }
    ];
    const result = handleTreeSelectChange(selection, treeData);
    const backendFormat = extractBackendFormat(result);
    
    expect(backendFormat.regions).toEqual(['North']);
    expect(backendFormat.buildingIds).toEqual([]);
  });

  it('should handle selecting all regions individually (should become "all")', () => {
    const selection = [
      { value: 'region-North', label: 'North' },
      { value: 'region-South', label: 'South' },
      { value: 'region-West', label: 'West' }
    ];
    const result = handleTreeSelectChange(selection, treeData);
    const backendFormat = extractBackendFormat(result);
    
    expect(backendFormat.regions).toEqual(['all']);
    expect(backendFormat.buildingIds).toEqual([]);
  });
});

describe('Backend Request Format - Real-world Scenarios', () => {
  let treeData: any[];

  beforeEach(() => {
    treeData = buildTreeData(mockBuildings);
  });

  it('should handle "announce to entire campus" scenario', () => {
    const selection = [{ value: 'region-all', label: 'All Regions' }];
    const result = handleTreeSelectChange(selection, treeData);
    const backendFormat = extractBackendFormat(result);
    
    expect(backendFormat.regions).toEqual(['all']);
    expect(backendFormat.buildingIds).toEqual([]);
  });

  it('should handle "announce to one region" scenario', () => {
    const selection = [
      { value: 'region-North', label: 'North' },
      { value: '1', label: 'Building A' },
      { value: '2', label: 'Building B' }
    ];
    const result = handleTreeSelectChange(selection, treeData);
    const backendFormat = extractBackendFormat(result);
    
    expect(backendFormat.regions).toEqual(['North']);
    expect(backendFormat.buildingIds).toEqual([]);
  });

  it('should handle "announce to specific buildings only" scenario', () => {
    const selection = [
      { value: '1', label: 'Building A' },
      { value: '4', label: 'Building D' }
    ];
    const result = handleTreeSelectChange(selection, treeData);
    const backendFormat = extractBackendFormat(result);
    
    expect(backendFormat.regions).toEqual([]);
    expect(backendFormat.buildingIds).toEqual(['1', '4']);
  });

  it('should handle "announce to two regions and one specific building" scenario', () => {
    const selection = [
      { value: 'region-North', label: 'North' },
      { value: '1', label: 'Building A' },
      { value: '2', label: 'Building B' },
      { value: 'region-South', label: 'South' },
      { value: '3', label: 'Building C' },
      { value: '4', label: 'Building D' },
      { value: '5', label: 'Building E' }
    ];
    const result = handleTreeSelectChange(selection, treeData);
    const backendFormat = extractBackendFormat(result);
    
    expect(backendFormat.regions).toContain('North');
    expect(backendFormat.regions).toContain('South');
    expect(backendFormat.buildingIds).toEqual(['5']);
  });
});
