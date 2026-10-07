var pattern = /^(AA|A|P|M|m|d|dd)(-?\d+)$/;

var pAlts = ['dd', 'd', 'P', 'A', 'AA'];
var mAlts = ['dd', 'd', 'm', 'M', 'A', 'AA'];

var baseIntervals = [
  [0, 0],
  [1, 1],
  [2, 3],
  [3, 5],
  [4, 7],
  [5, 8],
  [6, 10],
  [7, 12]
];

function toCoord(simple) {
  var parser = simple.match(pattern);
  if (!parser) return null;

  var quality = parser[1];
  var number = +parser[2];
  var sign = number < 0 ? -1 : 1;

  number = sign < 0 ? -number : number;

  var lower = number > 8 ? (number % 7 || 7) : number;
  var octaves = (number - lower) / 7;

  var base = baseIntervals[lower - 1];
  var alts = [0, 3, 4, 7].indexOf(base[0]) >= 0 ? pAlts : mAlts;
  var alt = alts.indexOf(quality) - 2;

  if (alt === -3) return null;

  var steps = sign * ((octaves * 7) + base[0]);
  var semitones = sign * ((octaves * 12) + base[1] + alt);

  return [steps, semitones];
}

toCoord.coords = baseIntervals.slice(0);

export default toCoord;