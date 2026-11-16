export function createTimingMap(points) {
  const grouped = new Map();
  for (const point of points) {
    if (!Number.isFinite(point.scoreTime) || !Number.isFinite(point.audioTime) || point.audioTime < 0) continue;
    const values = grouped.get(point.scoreTime) || [];
    values.push(point.audioTime);
    grouped.set(point.scoreTime, values);
  }
  const anchors = [];
  for (const [scoreTime, values] of [...grouped].sort((first, second) => first[0] - second[0])) {
    values.sort((first, second) => first - second);
    const middle = Math.floor(values.length / 2);
    const audioTime = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
    if (!anchors.length || audioTime > anchors[anchors.length - 1].audioTime) anchors.push({ scoreTime, audioTime });
  }
  if (anchors.length < 2) return null;

  const interpolate = (time, source, target) => {
    let low = 0;
    let high = anchors.length - 1;
    while (low < high) {
      const middle = Math.floor((low + high + 1) / 2);
      if (anchors[middle][source] <= time) low = middle;
      else high = middle - 1;
    }
    const index = Math.min(low, anchors.length - 2);
    const start = anchors[index];
    const end = anchors[index + 1];
    return start[target] + (time - start[source]) * (end[target] - start[target]) / (end[source] - start[source]);
  };
  return {
    anchors,
    toAudioTime: time => interpolate(time, 'scoreTime', 'audioTime'),
    toScoreTime: time => interpolate(time, 'audioTime', 'scoreTime'),
  };
}