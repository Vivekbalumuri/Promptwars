export function severityFor(density) {
  if (density >= 72) return 'critical';
  if (density >= 45) return 'caution';
  return 'normal';
}

export function fmtClock(min) {
  if (min <= 45) return `${min}'`;
  if (min === 46) return 'HT';
  return `${min - 1}'`;
}

export function stripFence(text) {
  return text.replace(/```json/gi, '').replace(/```/g, '').trim();
}

export function initialGates() {
  return [
    'Gate A — North Plaza',
    'Gate B — Northeast',
    'Gate C — East Concourse',
    'Gate D — Southeast',
    'Gate E — South Plaza',
    'Gate F — Southwest',
    'Gate G — West Concourse',
    'Gate H — Northwest',
  ].map((name, i) => ({
    id: name[5],
    name,
    density: 25 + Math.round(Math.random() * 20),
    queue: 2,
    trend: 'steady',
    staff: 4 + Math.round(Math.random() * 4),
    open: i !== 6,
  }));
}
