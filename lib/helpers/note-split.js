import Fraction from 'fraction.js';

Math.log2 = Math.log2 || function(value) {
  return Math.log(value) * Math.LOG2E;
};

function is_representable(duration, max_dots = 2) {
  const lognum = Math.log2(duration.n);
  switch (max_dots) {
    case 2: return lognum === Math.round(lognum) || duration.n === 3 || duration.n === 7;
    case 1: return lognum === Math.round(lognum) || duration.n === 3;
    case 0: return lognum === Math.round(lognum);
    default: throw new Error('Unsupported max_dots: ' + max_dots);
  }
}

function split(position, duration, beats, beat_denom = 4, rest = false, max_dots = 2) {
  let measure_duration = new Fraction(beats, beat_denom);
  let measure_position = position.mod(measure_duration);

  if (measure_position.add(duration) > measure_duration) {
    duration = measure_duration.sub(measure_position);
  }

  if (duration.n === 0) throw new Error('Zero duration in split!');

  if ((measure_position.n === 0) && is_representable(duration, max_dots)) {
    return duration;
  }

  let division = new Fraction(1, measure_position.d);
  if (duration >= division) return division;
  do {
    if (max_dots >= 1 && duration.n === 3 && duration.d >= division.d * 2 && (!rest || division.d > beat_denom)) {
      return duration;
    }
    if (max_dots >= 2 && duration.n === 7 && duration.d >= division.d * 4 && (!rest || division.d > beat_denom)) {
      return duration;
    }
    division = division.div(2);
  } while (duration < division);
  return division;
}

function divide(durations, measure_length, beat_length, position = new Fraction(0), rest = false, max_dots = 2) {
  let beats = measure_length.div(beat_length).valueOf();
  var result = [];
  for (var index = 0; index < durations.length; index++) {
    var duration = durations[index];
    let note = [];
    while (duration > 0) {
      const cut = split(position, duration, beats, 4, rest, max_dots);
      note.push(cut);
      position = position.add(cut);
      duration = duration.sub(cut);
    }
    result.push(note);
  }
  return result;
}

export default {
  split,
  divide
};