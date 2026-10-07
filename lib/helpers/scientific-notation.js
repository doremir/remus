import coords from './notecoord.js';
import accval from './accidental-value.js';

export default function scientific(name) {
  var format = /^([a-h])(x|#|bb|b?)(-?\d*)/i;

  var parser = name.match(format);
  if (!(parser && name === parser[0] && parser[3].length)) return;

  var noteName = parser[1];
  var octave = +parser[3];
  var accidental = parser[2].length ? parser[2].toLowerCase() : '';

  var accidentalValue = accval.interval(accidental);
  var coord = coords(noteName.toLowerCase());

  coord[0] += octave * 7 + accidentalValue[0];
  coord[1] += octave * 12 + accidentalValue[1];

  return coord;
}