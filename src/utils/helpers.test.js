import { describe, it, expect } from 'vitest';
import { severityFor, fmtClock, stripFence, initialGates } from './helpers';

describe('severityFor', () => {
  it('returns critical for density >= 72', () => {
    expect(severityFor(72)).toBe('critical');
    expect(severityFor(80)).toBe('critical');
    expect(severityFor(100)).toBe('critical');
  });

  it('returns caution for density 45-71', () => {
    expect(severityFor(45)).toBe('caution');
    expect(severityFor(50)).toBe('caution');
    expect(severityFor(71)).toBe('caution');
  });

  it('returns normal for density < 45', () => {
    expect(severityFor(0)).toBe('normal');
    expect(severityFor(25)).toBe('normal');
    expect(severityFor(44)).toBe('normal');
  });
});

describe('fmtClock', () => {
  it('formats minutes up to 45 with apostrophe', () => {
    expect(fmtClock(0)).toBe("0'");
    expect(fmtClock(15)).toBe("15'");
    expect(fmtClock(45)).toBe("45'");
  });

  it('returns HT for minute 46', () => {
    expect(fmtClock(46)).toBe('HT');
  });

  it('formats minutes 47+ as minute minus 1', () => {
    expect(fmtClock(47)).toBe("46'");
    expect(fmtClock(90)).toBe("89'");
  });
});

describe('stripFence', () => {
  it('removes json code fence markers', () => {
    const text = '```json\n{"key": "value"}\n```';
    expect(stripFence(text)).toBe('{"key": "value"}');
  });

  it('removes plain code fence markers', () => {
    const text = '```\nsome code\n```';
    expect(stripFence(text)).toBe('some code');
  });

  it('handles mixed case fence markers', () => {
    const text = '```JSON\n{"a": 1}\n```';
    expect(stripFence(text)).toBe('{"a": 1}');
  });

  it('trims whitespace', () => {
    const text = '  \n```\ncode\n```\n  ';
    expect(stripFence(text)).toBe('code');
  });

  it('returns empty string for empty input', () => {
    expect(stripFence('')).toBe('');
  });
});

describe('initialGates', () => {
  it('returns array of 8 gates', () => {
    const gates = initialGates();
    expect(gates).toHaveLength(8);
  });

  it('each gate has required properties', () => {
    const gates = initialGates();
    gates.forEach((gate) => {
      expect(gate).toHaveProperty('id');
      expect(gate).toHaveProperty('name');
      expect(gate).toHaveProperty('density');
      expect(gate).toHaveProperty('queue');
      expect(gate).toHaveProperty('trend');
      expect(gate).toHaveProperty('staff');
      expect(gate).toHaveProperty('open');
    });
  });

  it('gate IDs are first letter after "Gate "', () => {
    const gates = initialGates();
    expect(gates[0].id).toBe('A');
    expect(gates[1].id).toBe('B');
    expect(gates[7].id).toBe('H');
  });

  it('density is between 25 and 45', () => {
    const gates = initialGates();
    gates.forEach((gate) => {
      expect(gate.density).toBeGreaterThanOrEqual(25);
      expect(gate.density).toBeLessThanOrEqual(45);
    });
  });

  it('gate G (index 6) is closed, others open', () => {
    const gates = initialGates();
    gates.forEach((gate, idx) => {
      if (idx === 6) {
        expect(gate.open).toBe(false);
      } else {
        expect(gate.open).toBe(true);
      }
    });
  });

  it('staff is between 4 and 8', () => {
    const gates = initialGates();
    gates.forEach((gate) => {
      expect(gate.staff).toBeGreaterThanOrEqual(4);
      expect(gate.staff).toBeLessThanOrEqual(8);
    });
  });

  it('trend is always steady on init', () => {
    const gates = initialGates();
    gates.forEach((gate) => {
      expect(gate.trend).toBe('steady');
    });
  });

  it('queue is always 2 on init', () => {
    const gates = initialGates();
    gates.forEach((gate) => {
      expect(gate.queue).toBe(2);
    });
  });
});
