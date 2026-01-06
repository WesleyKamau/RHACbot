/**
 * Tests for type validation functions
 */

import {
  isValidBuildingId,
  isValidRegionTarget,
  validateMessageBody,
} from '@/lib/types';

describe('Type validation functions', () => {
  describe('isValidBuildingId', () => {
    it('should accept valid building IDs', () => {
      expect(isValidBuildingId(0)).toBe(true);
      expect(isValidBuildingId(1)).toBe(true);
      expect(isValidBuildingId(20)).toBe(true);
      expect(isValidBuildingId(40)).toBe(true);
    });

    it('should reject invalid building IDs', () => {
      expect(isValidBuildingId(-1)).toBe(false);
      expect(isValidBuildingId(41)).toBe(false);
      expect(isValidBuildingId(100)).toBe(false);
      expect(isValidBuildingId(NaN)).toBe(false);
    });

    it('should reject non-integers', () => {
      expect(isValidBuildingId(1.5)).toBe(false);
      expect(isValidBuildingId(3.14)).toBe(false);
    });
  });

  describe('isValidRegionTarget', () => {
    it('should accept valid regions (case-insensitive)', () => {
      expect(isValidRegionTarget('north')).toBe(true);
      expect(isValidRegionTarget('NORTH')).toBe(true);
      expect(isValidRegionTarget('south')).toBe(true);
      expect(isValidRegionTarget('west')).toBe(true);
      expect(isValidRegionTarget('all')).toBe(true);
      expect(isValidRegionTarget('ALL')).toBe(true);
    });

    it('should reject invalid regions', () => {
      expect(isValidRegionTarget('invalid')).toBe(false);
      expect(isValidRegionTarget('')).toBe(false);
      expect(isValidRegionTarget('northwest')).toBe(false);
    });
  });

  describe('validateMessageBody', () => {
    it('should accept valid message bodies', () => {
      expect(validateMessageBody('Hello world')).toBeNull();
      expect(validateMessageBody('A'.repeat(100))).toBeNull();
      expect(validateMessageBody('A'.repeat(1000))).toBeNull();
    });

    it('should reject empty or whitespace-only messages', () => {
      expect(validateMessageBody('')).toBeTruthy();
      expect(validateMessageBody('   ')).toBeTruthy();
      expect(validateMessageBody('\n\t')).toBeTruthy();
    });

    it('should reject messages that are too long', () => {
      const longMessage = 'A'.repeat(1001);
      const error = validateMessageBody(longMessage);
      expect(error).toBeTruthy();
      expect(error).toContain('1000');
    });
  });
});
