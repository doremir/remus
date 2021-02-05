
import Item from './item.js';
import scientific from 'scientific-notation';
import helmholtz from 'helmholtz';
import defaults from '../defaults.js';
import knowledge from '../knowledge.js';
import notecoord from 'notecoord';
import vector from '../vector.js';
import Interval from './interval.js';
import misc from '../misc.js';
// import chalk from 'chalk.js';
import _ from 'underscore';
var isNumber = _.isNumber;
var isObject = _.isObject;
var isString = _.isString;

function pad(str, ch, len) {
  for (; len > 0; len--) {
    str += ch;
  }

  return str;
}

/**
 * Pitch representation.
 *
 * Three types of pitches are supported:
 *
 * * Exact tone-height (in *mmel* units, see below)
 * * Tone-height category (in *tcu* above C0)
 * * Structural pitch category, i.e. tones including “spelling” (F# ≠ Gb)
 *
 * Exact tone-height is measured in *mmel*, which is a floating-point number corresponding to MIDI note numbers.
 * Examples (at concert pitch 440 Hz): 0.0 = C-1 = 8.18 Hz, 69.0 = A4 = 440 Hz.
 *
 * Tone-height category is measured in *tcu* (Tone-height Category Units), which defaults to 12 per octave (semitones),
 * but that may be overridden per song or even locally in e.g. a specific voice, setting `tcuPerOctave` in `env`.
 * Note that tone-height category must be an integer. If higher resolution is needed, the pitch resolution should
 * be changed, globally or locally.
 *
 * *(Possible extensions: pitch-class/chroma, i.e. tone-height without octave information, and corresponding tonal
 * representation without octave)*
 *
 * **Note** that more than one of the pitch types can be simultaneously present in the same Pitch object.
 * For example, an imported MIDI file will only have tone-heights set, while structural pitch categories may
 * be added later by some analysis process.
 *
 * #### Additional data
 *
 * The tone-height and tonal representations can be complemented by a value for *pitch deviation* in cents.
 * This is stored in the property `pitchDeviation`.
 */
export default class Pitch extends Item {
  /**
   * @ignore
   */
  static getSlots() {
    return super.getSlots().concat(['mmel', 'tcu', 'coord', 'pitchDeviation']);
  }

  /**
   * @ignore
   */
  inspect() {
    // var repr = [];
    // var color = chalk.green;
    // if (this.coord) {
    //   var text = color.bold(this.scientific());
    //   if (this.pitchDeviation) {
    //     text += color(' ' + (this.pitchDeviation > 0 ? '+' : '') + this.pitchDeviation + 'c');
    //   }
    //   repr.push(text);
    // }
    // if (this.tcu) {
    //   repr.push(color.bold(this.tcu) + ' ' +
    //   (this.env.get('tcuPerOctave') === defaults.tcuPerOctave ? color('tcu') : color('tcu[' + this.env.get('tcuPerOctave') + ']')));
    // }
    // if (this.mmel) { repr.push(color.bold(this.mmel.toFixed(2)) + ' ' + color('mmel')); }

    // return color('<') + repr.join(', ') + color('>');
  }

  /**
   * The octave of the pitch, according to Scientific Pitch Notation.
   *
   * *Note* that the reference pitch 0 mmel = 0 tcu = notecoord [0, 0],
   * so Pitch.fromMIDI(0).octave() will return -1 rather than 0.
   *
   * *Note* that for structural pitch categories (coords), this is the
   * "nominal" octave, i.e. the octave of `Cb5` is 5, even though it sounds like `B4`
   * @return {number}
   */
  octave() {
    if (this.coord) { return Math.floor(this.coord[0] / (this.env.get('stepsPerOctave') || defaults.stepsPerOctave)) - 1; }
    if (isNumber(this.mmel)) { return Math.floor(this.mmel / 12) - 1; }
    if (isNumber(this.tcu)) { return Math.floor(this.tcu / (this.env.get('tcuPerOctave') || defaults.tcuPerOctave)) - 1; }
  }

  /**
   * The name of the pitch class, i.e. without accidentals and octave, 'A', 'B', 'C' etc.
   * Currently only valid for 7 steps per octave (the normal case).
   * @return {string}
   */
  name() {
    let spo = this.env.get('stepsPerOctave') || defaults.stepsPerOctave;
    if (spo % 7 !== 0) {
      throw new Error('Cannot give a name for pitches when stepsPerOctave isn\'t a multiple of 7');
    }
    let coord = this.toCoord();
    if (!coord) {
      throw new Error('Cannot give a name for undefined pitch');
    }
    return knowledge.tones[misc.mod(coord[0], spo) / (spo / 7)];
  }

  /**
   * The numeric value of the pitch's accidental, in tcu units.
   * For the normal case of 12 tcu per octave, this means # = 1, b = -1, bb = -2 etc.
   * @return {number}
   */
  accidentalValue() {
    let spo = this.env.get('stepsPerOctave') || defaults.stepsPerOctave;
    let tpo = this.env.get('tcuPerOctave') || defaults.tcuPerOctave;
    let coord = this.toCoord();
    if (coord && spo % 7 === 0 && tpo % 12 === 0) {
      let octave = Math.floor(coord[0] / spo); // Don't use this.octave(), as it returns the "scientific" octave
      let name = knowledge.tones[misc.mod(coord[0], spo) / (spo / 7)];
      return coord[1] - (octave * tpo + knowledge.pitches[name][1] * (tpo / 12));
    }
    return null;
  }

  /**
   * A string representation of the accidenal.
   * Only supported for 12 or 24 tcu per octave.
   * Returns '!' for unknown accidentals.
   * @return {string}
   */
  accidental() {
    let accVal = this.accidentalValue();
    if (!accVal) return ''; // Both for 0 and null
    let tpo = this.env.get('tcuPerOctave') || defaults.tcuPerOctave;
    if (tpo === 12) {
      return knowledge.quarterToneAccidentals[accVal * 2 + 4] || '!';
    } else if (tpo % 24 === 0) {
      accVal /= (tpo / 24);
      return knowledge.quarterToneAccidentals[accVal + 4] || '!';
    } else {
      return '!';
    }
  }

  fifths() {
    let spo = this.env.get('stepsPerOctave') || defaults.stepsPerOctave;
    if (spo % 7 !== 0) {
      throw new Error('Cannot get fifths for pitches when stepsPerOctave isn\'t a multiple of 7');
    }
    let coord = this.toCoord();
    if (!coord) {
      throw new Error('Cannot get fifths for an undefined pitch');
    }
    let fifths = [0, 2, 4, -1, 1, 3, 5][misc.mod(coord[0], spo) / (spo / 7)];
    let accVal = this.accidentalValue();
    if (accVal % 1 !== 0) {
      throw new Error('Cannot get fifths value for non-semitone pitch');
    }
    return fifths + accVal * 7;
  }

  /**
   * Returns the piano key number of the pitch
   * @param {boolean} [white] Count white keys only
   * @return {number}
   */
  pianoKey(white) {
    if (white) {
      return this.coord[0] - 4; // TODO: fix
    } else {
      return this.toMIDI() - 8;
    }
  }

  /**
  * Returns an integer ranging from 0-127 representing a MIDI pitch value
  * @return {number}
  */
  toMIDI() {
    let tpo = this.env.get('tcuPerOctave') || defaults.tcuPerOctave;
    if (isNumber(this.tcu)) { return Math.round(this.tcu / (tpo / 12)); }
    if (this.coord) { return Math.round(this.coord[1] / (tpo / 12)); }
    if (isNumber(this.mmel)) { return Math.round(this.mmel); }
  }

  /**
   * Calculates and returns the frequency of the pitch.
   * @param {number} [concertPitch=440]
   * @return {number}
   */
  toFrequency(concertPitch = 440) {
    if (this.mmel) {
      return concertPitch * Math.pow(2, (this.mmel - knowledge.A4[1]) / 12);
    }
    var tpo = this.env.get('tcuPerOctave') || defaults.tcuPerOctave;
    if (isNumber(this.tcu)) {
      return concertPitch * Math.pow(2, ((this.tcu / (tpo / 12)) - knowledge.A4[1]) / tpo);
    }

    if (this.coord) {
      return concertPitch * Math.pow(2, ((this.coord[1] / (tpo / 12)) - knowledge.A4[1]) / tpo);
    }
  }

  /**
   * The pitch class index (chroma) of the pitch
   * @return {number}
   */
  chroma() {
    let tpo = this.env.get('tcuPerOctave') || defaults.tcuPerOctave;
    if (this.coord) { return ((this.coord[1] % tpo) + tpo) % tpo; }  // works with negatvive numbers
    if (this.tcu) { return ((this.tcu % tpo) + tpo) % tpo; }
    return ((this.toTcu() % tpo) + tpo) % tpo;
  }

  /**
   * Get the pitch as a *mmel* value.
   * @return {number}
   */
  toMmel() {
    if (isNumber(this.mmel)) { return this.mmel; }
    let tpo = this.env.get('tcuPerOctave') || defaults.tcuPerOctave;
    if (isNumber(this.tcu)) { return this.tcu / (tpo / 12); }
    if (this.coord) { return this.coord[1] / (tpo / 12); }
  }

  /**
   * Get the pitch as a *tcu* value.
   * @return {number}
   */
  toTcu() {
    if (isNumber(this.tcu)) { return this.tcu; }
    let tpo = this.env.get('tcuPerOctave') || defaults.tcuPerOctave;
    if (isNumber(this.mmel)) { return Math.round(this.mmel * (tpo / 12)); }
    if (this.coord) { return this.coord[1]; }
  }

  /**
   * Get the pitch as a *coord* value.
   * @return {number}
   */
  toCoord() {
    if (this.coord) { return this.coord; }
    var tcu = this.toTcu();
    if (isNumber(tcu)) {
      let tpo = this.env.get('tcuPerOctave') || defaults.tcuPerOctave;
      let spo = this.env.get('stepsPerOctave') || defaults.stepsPerOctave;
      var steps = Math.round(tcu / (tpo / spo)); // TODO: better algorithm
      return [steps, tcu];
    }
  }

  /**
   * ? Transpose the pitch by an interval. Returns a new Pitch value, the current object is not changed.
   * ? The parameter can be anything that can be coerced to an {@link Interval}.
   * @todo What exactly does this function do??
   * @param interval
   * @return {Pitch}
   */
  interval(interval) {
    if (isString(interval)) { interval = Interval.fromString(interval); }

    if (interval instanceof Interval) {
      return new Pitch({coord: vector.add(this.coord, interval.coord)});
    } else if (interval instanceof Pitch) {
      return new Interval({coord: vector.sub(interval.coord, this.coord)}); // ?
    }
  }

  /**
   * Destructively transpose the pitch by a given qualified interval.
   * @param {Interval} interval
   * @return {Pitch}
   *
   * @todo
   * Currently only supports structural pitch categories
   */
  transpose(interval) {
    this.coord = vector.add(this.coord, interval.coord);
    return this;
  }

  /**
   * Destructively transpose the pitch by a given interval, following the given key.
   * @param interval (integer or Interval object)
   * @param {Key} [key]
   * @return {Pitch}
   *
   * @todo
   * Move to some better place and refactor!
   * Don't assume 7/12
   */
  diatonicTranspose(interval, key) {
    let steps = interval instanceof Interval ? interval.coord[0] : interval;

    if (!key) {
      var song = this.env.get('song');
      key = song.findMeta('Key');
    }

    if (!key) throw new Error('No key given explicitly or in env');
    let thisStep = Interval.between(key.root, this);
    let stepsFromRoot = steps + thisStep.coord[0];
    let newPitch = key.step(stepsFromRoot);
    if (this.coord) this.coord = newPitch.coord; // Ugly!
    if (this.tcu) this.tcu = newPitch.toTcu();
    return this;
  }

  /**
   * Returns the Helmholtz notation form of the pitch (`C,,`, `d'`, `F#` `g#''` etc.)
   * @return {string}
   */
  helmholtz() {
    var octave = this.octave();
    var name = this.name();
    name = octave < 3 ? name.toUpperCase() : name.toLowerCase();
    var padchar = octave < 3 ? ',' : '\'';
    var padcount = octave < 2 ? 2 - octave : octave - 3;

    return pad(name + this.accidental(), padchar, padcount);
  }

  /**
   * Returns the scientific notation form of the pitch (`E4`, `Bb3`, `C#7` etc.)
   * @return {string}
   */
  scientific() {
    return this.name().toUpperCase() + this.accidental() + this.octave();
  }

  // /**
  //  * Returns pitches that are enharmonic with this pitch.
  //  */
  // enharmonics(oneaccidental) {
  //   var key = this.key(), limit = oneaccidental ? 2 : 3;
  //
  //   return ['m3', 'm2', 'm-2', 'm-3']
  //     .map(this.interval.bind(this))
  //     .filter(function(pitch) {
  //     var acc = pitch.accidentalValue();
  //     var diff = key - (pitch.key() - acc);
  //
  //     if (diff < limit && diff > -limit) {
  //       pitch.coord = vector.add(pitch.coord, vector.mul(knowledge.sharp, diff - acc));
  //       return true;
  //     }
  //   });
  // },
  //
  // solfege(scale, showOctaves) {
  //   var interval = scale.tonic.interval(this), solfege, stroke, count;
  //   if (interval.direction() === 'down')
  //     interval = interval.invert();
  //
  //   if (showOctaves) {
  //     count = (this.key(true) - scale.tonic.key(true)) / 7;
  //     count = (count >= 0) ? Math.floor(count) : -(Math.ceil(-count));
  //     stroke = (count >= 0) ? '\'' : ',';
  //   }
  //
  //   solfege = knowledge.intervalSolfege[interval.simple(true).toString()];
  //   return (showOctaves) ? pad(solfege, stroke, Math.abs(count)) : solfege;
  // },
  //
  // scaleDegree(scale) {
  //   var inter = scale.tonic.interval(this);
  //
  //   // If the direction is down, or we're dealing with an octave - invert it
  //   if (inter.direction() === 'down' ||
  //      (inter.coord[1] === 0 && inter.coord[0] !== 0)) {
  //     inter = inter.invert();
  //   }
  //
  //   inter = inter.simple(true).coord;
  //
  //   return scale.scale.reduce(function(index, current, i) {
  //     var coord = Interval.fromString(current).coord;
  //     return coord[0] === inter[0] && coord[1] === inter[1] ? i + 1 : index;
  //   }, 0);
  // }

  /**
   * Returns a string representation of the pitch.
   * @return {string}
   *
   * **NOTE:** This is currently *not* the inverse of {@link Pitch.fromString}, it is just for
   * creating a human-readable string.
   */
  toString() {
    var repr = [];
    if (this.coord) {
      var text = this.scientific();
      if (this.pitchDeviation) {
        text += ' ' + (this.pitchDeviation > 0 ? '+' : '') + this.pitchDeviation + 'c';
      }
      repr.push(text);
    }
    if (this.tcu) {
      let tpo = this.env.get('tcuPerOctave') || defaults.tcuPerOctave;
      repr.push(this.tcu + ' ' +
      (tpo === defaults.tcuPerOctave ? 'tcu' : 'tcu[' + this.env.get('tcuPerOctave') + ']'));
    }

    if (this.mmel) { repr.push(this.mmel.toFixed(2) + ' ' + 'mmel'); }

    return '<' + repr.join(', ') + '>';
  }

  /**
    * @ignore
    */
  toJSON() {
    // Only mmel
    if (isNumber(this.mmel) && !this.coord && !isNumber(this.tcu)) {
      return [this.mmel, 'mmel'];
    }
    // Only tcu
    if (isNumber(this.tcu) && !this.coord && !isNumber(this.mmel)) {
      return this.tcu;
    }
    // Only coord
    if (this.coord && !isNumber(this.tcu) && !isNumber(this.mmel) && !this.pitchDeviation) {
      if (this.env.get('stepsPerOctave') === 7 &&
        (this.env.get('tcuPerOctave') === 12 || this.env.get('tcuPerOctave') % 24 === 0) &&
        this.coord[1] % 1 === 0 && this.accidental() !== '!') {
        return this.scientific();
      } else {
        return this.coord;
      }
    }

    return this;
  }

  /**
   * @ignore
   */
  toXML(rootName) {
    return misc.buildXML(this.toXMLObject(), {rootName: rootName || 'pitch'});
  }

  /**
   * @ignore
   */
  toXMLObject() {
    return { step: this.name().toUpperCase(), alter: this.accidentalValue(), octave: this.octave() };
  }

  /**
   * @ignore
   */
  toVexFlow() {
    return this.name() + '/' + this.octave();
  }

  vexFlowAccidental() {
    if (this.coord) {
      var accVal = this.accidentalValue();
      if (accVal === undefined) return undefined;
      let tpo = this.env.get('tcuPerOctave') || defaults.tcuPerOctave;
      if (tpo === 12) {
        return knowledge.vexFlowAccidentals[accVal * 2 + 4] || '!';
      } else if (tpo % 24 === 0) {
        accVal /= (tpo / 24);
        return knowledge.vexFlowAccidentals[accVal + 4] || '?';
      } else {
        return 'r';
      }
    }
    return 'u';
  }

  /**
   * @ignore
   */
  doValidate() {
    var validator = super.doValidate();
    return validator;
  }
}

Pitch.coerce = function(source, parent, copy) {
  if (source instanceof Pitch) {
    if (copy || (source.parent !== parent)) return new Pitch(source, parent);
    else return source;
  }
  if (isString(source)) { return Pitch.fromString(source, parent); }
  if (source instanceof Array && source.length === 2 && isString(source[1])) {
    return Pitch.fromUnit(source[0], source[1], parent);
  }
  if (source instanceof Array && source.length === 2 && isNumber(source[1])) {
    return new Pitch({coord: source}, parent);
  }
  if (isNumber(source)) { return new Pitch({tcu: source}, parent); }
  if (isObject(source) && (isNumber(source.mmel) || isNumber(source.tcu) || source.coord)) {
    return new Pitch(source, parent);
  }

  throw new Error('Cannot coerce ' + source + ' to a pitch!');
};

Pitch.fromString = function(name, parent) {
  if (name && name.replace) name = name.replace('♭', 'b').replace('𝄫', 'bb').replace('♯', '#').replace('𝄪', 'x').replace('##', 'x');
  var match = name.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
  if (match) { return Pitch.fromUnit(match[1], match[2]); }
  var coord = scientific(name);
  if (!coord) { coord = helmholtz(name); }
  if (!coord) { throw new Error('Cannot coerce ' + name + ' to a pitch!'); }
  // Hackish: since we use C-1 as reference point, adjust by one octave
  coord[0] += 7;
  coord[1] += 12;

  var spo = (parent ? parent.env.get('stepsPerOctave') : null) || defaults.stepsPerOctave;
  var tpo = (parent ? parent.env.get('tcuPerOctave') : null) || defaults.tcuPerOctave;
  if (spo % 7 === 0 && tpo % 12 === 0) {
    coord[0] *= (spo / 7);
    coord[1] *= (tpo / 12);
    return new Pitch({coord: coord}, parent);
  }
  throw new Error('Cannot use fromString unless tcuPerOctave is a multiple of 12 and stepsPerOctave is a multiple of 7');
};

Pitch.fromUnit = function(value, unit, parent) {
  switch (unit) {
    case 'Hz': return Pitch.fromFrequency(value, parent);
    case 'mmel': return new Pitch({mmel: parseFloat(value)}, parent);
    case 'tcu': return new Pitch({tcu: parseInt(value)}, parent);
    case 'MIDI': return Pitch.fromMIDI(value, parent);
    default: throw new Error('Invalid pitch unit: ' + unit);
  }
};

// Pitch.fromKey = function(key) {
//   var semitones = key - knowledge.A4[1] + 8;
//   var steps = Math.round(semitones * 7/12)
//   return new Pitch([steps, semitones]);
// }

Pitch.fromFrequency = function(fq, parent) {
  var concertPitch = (parent ? parent.env.get('concertPitch') : null) || 440;
  var key = knowledge.A4[1] + (12 * ((Math.log(fq) - Math.log(concertPitch)) / Math.log(2)));
  // key = Math.round(key);
  // originalFq = concertPitch * Math.pow(2, (key - 49) / 12);
  // cents = 1200 * (Math.log(fq / originalFq) / Math.log(2));

  return new Pitch({mmel: key}, parent); // , pitchDeviation: cents};
};

Pitch.fromMIDI = function(pitch, parent) {
  var tpo = (parent ? parent.env.get('tcuPerOctave') : null) || defaults.tcuPerOctave;
  if (tpo % 12 === 0) {
    return new Pitch({tcu: pitch * (tpo / 12)}, parent);
  }

  throw new Error('Cannot use fromMIDI unless tcuPerOctave is a multiple of 12');
};

Pitch.fromXML = function(xml, parent) {
  var obj = misc.parseXML(xml, {explicitArray: false, mergeAttrs: true, explicitCharkey: false}, parent);
  return Pitch.fromXMLObject(obj, parent);
};

Pitch.fromXMLObject = function(obj, parent) {
  var coord = notecoord.notes[obj.step.toLowerCase()].slice();
  coord[1] += parseInt(obj.alter) || 0;
  var octave = parseInt(obj.octave);
  coord = vector.add(coord, octave.octaves); // TODO: verify that this is the correct octave!
  return new Pitch({coord: coord}, parent);
};

Pitch.itemType = 'Pitch';

import ItemHandler from '../item-handler.js';
ItemHandler.registerItem(Pitch);
