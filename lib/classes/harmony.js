
import Item from './item.js';
import knowledge from '../knowledge.js';
import Pitch from './pitch.js';
import Interval from './interval.js';
import misc from '../misc.js';
import xml2js from 'xml2js';
import { ArrayOf } from '../item-handler.js';
// import var chalk from 'chalk';
import _ from 'underscore';

var get = _.get; // require('lodash.get');
// var difference = _.difference;

function simpleInterval(i) {
  return i.toString();
}

export default class Harmony extends Item {
  /** @ignore */
  static getSlots() {
    return Object.assign({
      root: {
        type: Pitch,
        nullOk: true,
        default: null,
        coerce: true,
        owned: true
      },
      intervals: {
        type: ArrayOf.Interval,
        coerce: true,
        default: [],
        owned: true
      },
      bass: {
        type: Pitch,
        nullOk: true,
        default: null,
        coerce: true,
        owned: true
      },
      kindText: {
        type: String,
        nullOk: true,
        default: null
      }
    }, super.getSlots());
  }

  /** @ignore */
  inspect() {
    // return chalk.dim('<') + chalk.yellow.bold(this.toString()) + ' ' + chalk.yellow(this.intervals) + chalk.dim('>');
  }

  // getRootPitch() {
  //   if (this.rootPitch) {
  //     return this.rootPitch;
  //   } else if (this.root instanceof Pitch) {
  //     return this.root;
  //   } else if (this.root) {
  //     this.rootPitch = this.initSubObject(this.root, 'Pitch');
  //     return this.rootPitch;
  //   }

  //   return null;
  // }

  // getBassPitch() {
  //   if (this.bassPitch) {
  //     return this.bassPitch;
  //   } else if (this.bass instanceof Pitch) {
  //     return this.bass;
  //   } else if (this.bass) {
  //     this.bassPitch = this.initSubObject(this.bass, 'Pitch');
  //     return this.bassPitch;
  //   }

  //   return null;
  // }

  pitches() {
    var root = this.root; // getRootPitch();
    var pitches = [root];
    for (let interval of this.intervals) {
      pitches.push(root.interval(interval));
    }
    return pitches;
  }

  simple() {
    return this.pitches().map(function(n) { return n.toString(true); });
  }

  isMajor() {
    return this.intervals.map(simpleInterval).indexOf('M3') >= 0;
  }

  isMinor() {
    return this.intervals.map(simpleInterval).indexOf('m3') >= 0;
  }

  isDominant() {
    var intervals = this.intervals.map(simpleInterval);
    return intervals.indexOf('M3') >= 0 && intervals.indexOf('m7') >= 0;
  }

  dominant(additional) {
    return this.interval('P5');
  }

  subdominant(additional) {
    return this.interval('P4');
  }

  parallel() {
    var quality = this.quality();

    if (this.harmonyType() !== 'triad' || !(quality === 'major' || quality === 'minor')) {
      throw new Error('Only major/minor triads have parallel harmonies');
    }

    if (this.isMajor()) {
      return Harmony.fromKind(this.root.interval('m-3'), 'minor');
    } else {
      return Harmony.fromKind(this.root.interval('m3'), 'major');
    }
  }

  quality() {
    var third;
    var fifth;
    var seventh;
    var intervals = this.intervals;

    for (let i of intervals) {
      if (i.number() === 3) {
        third = i;
      } else if (i.number() === 5) {
        fifth = i;
      } else if (i.number() === 7) {
        seventh = i;
      }
    }

    if (!third) {
      return;
    }

    third = (third.direction() === 'down') ? third.invert() : third;
    third = third.simple().toString();

    if (fifth) {
      fifth = (fifth.direction === 'down') ? fifth.invert() : fifth;
      fifth = fifth.simple().toString();
    }

    if (seventh) {
      seventh = (seventh.direction === 'down') ? seventh.invert() : seventh;
      seventh = seventh.simple().toString();
    }

    if (third === 'M3') {
      if (fifth === 'A5') {
        return 'augmented';
      } else if (fifth === 'P5') {
        return (seventh === 'm7') ? 'dominant' : 'major';
      }

      return 'major';
    } else if (third === 'm3') {
      if (fifth === 'P5') {
        return 'minor';
      } else if (fifth === 'd5') {
        return (seventh === 'm7') ? 'half-diminished' : 'diminished';
      }

      return 'minor';
    }
  }

  kind() {
    var degrees = {};
    [2, 3, 4, 5, 6, 7].map(function(x) {
      var interval = this.getDegree(x);
      degrees[x] = interval ? interval.quality() : null;
    }, this);

    // SPECIAL
    if (!degrees[3] && degrees[7] === 'm' && degrees[2] === 'M' && degrees[4] === 'P') {
      return 'dominant-11th';
    }
    if (degrees[7] === 'm' && degrees[3] === 'M' && degrees[6] === 'M') {
      return 'dominant-13th';
    }
    if (degrees[5] === 'P' && this.intervals.length === 1) {
      return 'power';
    }

    // MAJOR CHORDS
    if (degrees[3] === 'M') {
      // Augmented
      if (degrees[5] === 'A') {
        if (degrees[7] === 'm') { return 'augmented-seventh'; }
        return 'augmented';
      }
      // Dominants
      if (degrees[7] === 'm') {
        if (degrees[2] === 'M') { return 'dominant-ninth'; }
        if (degrees[4] === 'P') { return 'dominant-eleventh'; }
        return 'dominant';
      }
      // Major sevenths
      if (degrees[7] === 'M') {
        if (degrees[6] === 'M') { return 'major-13th'; }
        if (degrees[2] === 'M') { return 'major-ninth'; }
        return 'major-seventh';
      }
      // Other major harmonies
      if (degrees[5] === 'A') { return 'augmented'; }
      if (degrees[6] === 'M') { return 'major-sixth'; }
      return 'major';
    }

    // MINOR CHORDS
    if (degrees[3] === 'm') {
      // Diminished & half-diminished
      if (degrees[5] === 'd') {
        if (degrees[7] === 'd') { return 'diminished-seventh'; }
        if (!degrees[7] && degrees[6] === 'M') {
           // arguably wrong but very common spelling of diminished chords
          return 'diminished-seventh';
        }
        if (degrees[7] === 'm') { return 'half-diminished'; }
        return 'diminished';
      }
      // Sevenths
      if (degrees[7] === 'm') {
        if (degrees[2] === 'M') { return 'minor-ninth'; }
        return 'minor-seventh';
      }
      // Other minor harmonies
      if (degrees[6] === 'M') { return 'minor-sixth'; }
      if (degrees[7] === 'M') { return 'major-minor'; }
      return 'minor';
    }

    // SUSPENDED
    if (degrees[5] === 'P' || !degrees[5]) {
      if (degrees[2] === 'M') { return 'suspended-second'; }
      if (degrees[4] === 'P') { return 'suspended-fourth'; }
    }

    if ((degrees[7] === 'm') && !degrees[3]) {
      return 'dominant';
    }

    return 'other';
  }

  harmonyType() { // In need of better name
    let intervals = this.intervals;
    let length = intervals.length;
    let name;

    if (length === 1) {
      return 'dyad';
    } else if (length === 2) {
      let has = {third: false, fifth: false};
      for (let interval of intervals) {
        let invert = interval.invert();
        if (interval.base() in has) {
          has[interval.base()] = true;
        } else if (invert.base() in has) {
          has[invert.base()] = true;
        }
      }
      name = (has.third && has.fifth) ? 'triad' : 'trichord';
    } else if (length === 3) {
      let has = {third: false, fifth: false, seventh: false};
      for (let interval of intervals) {
        let invert = interval.invert();
        if (interval.base() in has) {
          has[interval.base()] = true;
        } else if (invert.base() in has) {
          has[invert.base()] = true;
        }
      }

      if (has.third && has.fifth && has.seventh) {
        name = 'tetrad';
      }
    }

    return name || 'unknown';
  }

  getDegree(interval) {
    var intervals = this.intervals;

    interval = (interval - 1) % 7;

    for (let i of intervals) {
      if ((i.number() - 1) % 7 === interval) {
        return i;
      }
    }
    return null;
  }

  // get(interval) {
  //   var intervals = this.intervals, i, length;
  //   if (typeof interval === 'number') {
  //     for (i = 0, length = intervals.length; i < length; i++) {
  //       if (intervals[i].number() === interval) {
  //         return this.root.interval(intervals[i]);
  //       }
  //     }
  //     return null;
  //   } else if (typeof interval === 'string' && interval in knowledge.stepNumber) {
  //     interval = knowledge.stepNumber[interval];
  //     for (i = 0, length = intervals.length; i < length; i++) {
  //       if (intervals[i].number() === interval) {
  //         return this.root.interval(intervals[i]);
  //       }
  //     }
  //
  //     return null;
  //   } else {
  //     throw new Error('Invalid interval name');
  //   }
  // },

  interval(interval, parent = null) {
    var rootPitch = this.getRootPitch();
    let root = rootPitch && rootPitch.interval ? rootPitch.interval(interval) : rootPitch;
    let bass = this.getBassPitch() && this.getBassPitch().interval ? this.getBassPitch().interval(interval) : this.getBassPitch();
    return new Harmony({root: root, bass: bass, intervals: misc.clone(this.intervals), kindText: this.kindText}, parent);
  }

  transpose(interval) {
    var rootPitch = this.getRootPitch();
    if (rootPitch) rootPitch.transpose(interval);
    if (this.getBassPitch() && this.getBassPitch().transpose) this.getBassPitch().transpose(interval);
    return this;
  }

  toXML() {
    var rootPitch = this.getRootPitch();
    var root = { step: rootPitch.name().toUpperCase(), alter: rootPitch.accidentalValue(), text: rootPitch.text };
    var bass;

    if (this.getBassPitch()) {
      bass = { step: this.getBassPitch().name().toUpperCase(), alter: this.getBassPitch().accidentalValue(), text: this.getBassPitch().text };
    }

    var kind = this.kind();
    var kindText = this.kindText;
    var xml = '';
    xml += '<harmony>\n';
    xml += '  <root>\n';

    if (root.text && root.text !== root.step) {
      xml += '    <root-step text="' + root.text + '">' + root.step + '</root-step>\n';
    } else {
      xml += '    <root-step>' + root.step + '</root-step>\n';
    }

    if (root.alter) {
      xml += '    <root-alter>' + root.alter + '</root-alter>\n';
    }

    xml += '  </root>\n';

    if (bass) {
      xml += '  <bass>\n';
      if (bass.text && bass.text !== bass.step) {
        xml += '    <bass-step text="' + bass.text + '">' + bass.step + '</bass-step>\n';
      } else {
        xml += '    <bass-step>' + bass.step + '</bass-step>\n';
      }
      if (bass.alter) {
        xml += '    <bass-alter>' + bass.alter + '</bass-alter>\n';
      }
      xml += '  </bass>\n';
    }

    if (kindText) {
      xml += '<kind text="' + kindText + '">' + kind + '</kind>\n';
    } else {
      xml += '<kind>' + kind + '</kind>\n';
    }
    // this.degrees.forEach(function(degree) {
    //   xml += '<degree>\n';
    //   xml += (typeof degree.text === 'string') ? ('  <degree-type text="' + degree.text + '">') : '<degree-type>';
    //   xml += degree.type;
    //   xml += '</degree-type>\n';
    //   xml += '<degree-value>' + degree.step + '</degree-value>\n';
    //   switch (degree.type) {
    //   case 'add':
    //     // TODO
    //     break;
    //   case 'alter':
    //     xml += '<degree-alter>' + degree.semitones + '</degree-alter>\n';
    //     break;
    //   case 'subtract':
    //     // TODO
    //     break;
    //   }
    //   xml += '</degree>\n';
    // });
    xml += '</harmony>\n';
    return xml;
  }

  toString() {
    // var rootPitch = this.getRootPitch();
    // var bassPitch = this.getBassPitch();

    let root = this.root.text || (this.root.name().toUpperCase() + this.root.accidental());
    let kind = this.kindText || knowledge.chordShort[this.kind()] || '';
    let bass = '';

    if (this.bass) {
      if (this.bass.text) {
        bass = '/' + this.bass.text;
      } else {
        bass = '/' + this.bass.name().toUpperCase() + this.bass.accidental();
      }
    }

    // TODO: additions, alterations, subtractions
    return root + kind + bass;
  }

  /**
   * @ignore
   */
  toJSON() {
    var obj = super.toJSON();
    if (obj.intervals) {
      obj.intervals = obj.intervals.map(i => i.toString());
    }
    return obj;
  }

  defaultVoicings() {
    let kind = this.kind();
    let voicings = null;

    var degrees = {};
    [2, 3, 4, 5, 6, 7].map(function(x) {
      var interval = this.getDegree(x);
      degrees[x] = interval ? interval.quality() : null;
    }, this);

    //
    // First, test for a few special or common chords
    //

    // 7#9
    if ((kind === 'dominant' || kind === 'dominant-ninth') && degrees[2] === 'A') {
      voicings = [['P1', 'M3', 'm7', 'a9'],
                  ['P1', 'M3', 'm7', 'P1', 'a9'],
                  ['M3', 'm7', 'P1', 'a9'],
                  ['M3', 'm7', 'a9']];
    } else if (kind === 'major' && degrees[2] === 'M') { // major add9
      voicings = [['P1', 'M2', 'M3', 'P5'],
                  ['P5', 'P1', 'M2', 'M3'],
                  ['M2', 'M3', 'P5', 'P1']];
    } else if (kind === 'minor' && degrees[2] === 'M') { // minor add9
      voicings = [['P1', 'M2', 'm3', 'P5'],
                  ['P5', 'P1', 'M2', 'm3'],
                  ['M2', 'm3', 'P5', 'P1']];
    } else {
      //
      // All other chords get their default voicings
      //
      switch (kind) {
        case 'major': voicings = misc.allRotations(['P1', 'M3', 'P5']); break;
        case 'minor': voicings = misc.allRotations(['P1', 'm3', 'P5']); break;
        case 'augmented': voicings = misc.allRotations(['P1', 'M3', 'A5']); break;
        case 'diminished': voicings = misc.allRotations(['P1', 'm3', 'd5']); break;
        case 'dominant': voicings = misc.allRotations(['P1', 'M3', 'P5', 'm7']); break;
        case 'major-seventh': voicings = misc.allRotations(['P1', 'M3', 'P5', 'M7']); break;
        case 'minor-seventh': voicings = misc.allRotations(['P1', 'm3', 'P5', 'm7']); break;
        case 'diminished-seventh': voicings = misc.allRotations(['P1', 'm3', 'd5', 'd7']); break;
        case 'augmented-seventh': voicings = misc.allRotations(['P1', 'M3', 'A5', 'm7']); break;
        case 'half-diminished': voicings = misc.allRotations(['P1', 'm3', 'd5', 'm7']); break;
        case 'major-minor': voicings = misc.allRotations(['P1', 'm3', 'P5', 'M7']); break;
        case 'dominant-suspended-fourth': voicings = misc.allRotations(['P1', 'P4', 'P5', 'm7']); break;
        case 'major-sixth': voicings = misc.allRotations(['P1', 'M3', 'P5', 'M6']); break;
        case 'minor-sixth': voicings = misc.allRotations(['P1', 'm3', 'P5', 'M6']); break;
        case 'dominant-ninth': voicings = [['P1', 'M3', 'm7', 'M2'],
                                           ['m7', 'M2', 'M3'],
                                           ['M2', 'M3', 'm7'],
                                           ['M2', 'M3', 'P5', 'm7'],
                                           ['M3', 'm7', 'M2']]; break;
        case 'major-ninth': voicings = [['P1', 'M3', 'M7', 'M2'],
                                        ['M7', 'M2', 'M3'],
                                        ['M2', 'M3', 'M7'],
                                        ['M2', 'M3', 'P5', 'M7'],
                                        ['M3', 'M7', 'M2']]; break;
        case 'minor-ninth': voicings = [['P1', 'm3', 'm7', 'M2'],
                                        ['m7', 'M2', 'm3'],
                                        ['m7', 'M2', 'm3', 'P5'],
                                        ['M2', 'm3', 'm7'],
                                        ['M2', 'm3', 'P5', 'm7'],
                                        ['m3', 'm7', 'M2']]; break;
        case 'dominant-11th': voicings = misc.allRotations(['m7', 'M2', 'P4']); break;
        case 'minor-11th': voicings = misc.allRotations(['m7', 'm3', 'P4']); break;
        case 'dominant-13th': voicings = [['m7', 'M2', 'M3', 'M6']]; break; // 9th is removed below if not present
        case 'minor-13th': voicings = misc.allRotations(['m7', 'M2', 'm3', 'M6']); break; // same here
        case 'suspended-second': voicings = [['P1', 'M2', 'P5'], ['P5', 'P1', 'M2']]; break;
        case 'suspended-fourth': voicings = misc.allRotations(['P1', 'P4', 'P5']); break;
        case 'power': voicings = [['P1', 'P5'], ['P5', 'P1']]; break;
      }
    }

    if (!voicings) return [];

    // Filter out notes that aren't present as degrees
    // and alter notes according to the degrees
    // KNOWN ISSUE: cannot handle more than one existance of each degree, e.g. M3 m10
    for (let v = 0; v < voicings.length; v++) {
      voicings[v] = voicings[v].filter(interval => {
        return (interval === 'P1' || degrees[interval[1]]);
      }).map(interval => {
        if (interval === 'P1') return interval;
        return degrees[interval[1]] + interval[1];
      });
    }

    // Add missing degrees
    for (let d = 2; d <= 7; d++) {
      if (!degrees[d]) continue;
      for (let v = 0; v < voicings.length; v++) {
        if (voicings[v].map(i => { return +i[1]; }).indexOf(d) >= 0) continue;
        // The degree d is missing from this voicing. Find out where to insert it.
        // console.log('Missing interval: ', d, degrees[d]);
        let pos = 0;
        for (let p = 0; p < voicings[v].length - 1; p++) {
          let x = voicings[v][p][1];
          let y = voicings[v][p + 1][1];
          if (y < x) y += 7;
          if (x < d && d < y) {
            pos = p + 1;
            break;
          }
        }
        // The new degree is to be inserted at position pos (which defaults to 0)
        let interval = degrees[d] + d;
        // console.log('Inserting ' + interval + ' at position ' + pos + ' in array ' + voicings[v]);
        voicings[v].splice(pos, 0, interval);
      }
    }

    return voicings;
  }
}

Harmony.coerce = function(source, parent, copy) {
  if (source instanceof Harmony) {
    if (copy) {
      return new Harmony(source, parent);
    } else {
      return source;
    }
  }
  if (typeof source === 'string') { return Harmony.fromString(source, parent); }
  if (_.isObject(source) && source.isChord) { return new Harmony(source.harmony, parent); }
  throw new Error('Cannot coerce ' + source + ' to a harmony!');
};

// Helper
function find(elem, array) {
  return array.indexOf(elem) >= 0;
}

// Helper
function addInterval(step, acc) {
  var defaultAddAlter = 'xPMMPPMmPMMPPM';
  var interval = Interval.fromString(defaultAddAlter[step] + step); // concatenation
  interval.coord[1] += acc;
  return interval;
}

Harmony.fromString = function(str, parent) {
  // N.C.
  if (str.match(/^\\s*N\\.?\\s*C\\.?\\s*$/i) || str.match(/^\\s*no\\s*harmony/i)) {
    return new Harmony({}, parent);
  }

  // Normal harmonies
  var matches = str.match(/^\(?([A-Ga-gHh](?:[x𝄪𝄫]|[#♯]+|[b♭]+)?)\s*(\(?(.*?)((?:(?:add|no|omit)[#b𝄪♯♭𝄫]*\d+|[#b𝄪♯♭𝄫]+\d+)*)\)?)(?:\/([A-Ga-gHh](?:[x𝄪𝄫]|[#♯]+|[b♭]+)?))?$/i);
  if (matches) {
    var root = Pitch.fromString(matches[1], parent);
    // root.text = matches[1];
    var rest = matches[2].trim();
    const delta = String.fromCharCode(8710);  // ∆
    var main = matches[3].trim().replace(/\(/g, '').replace(/\^/g, delta);
    var extra = matches[4].trim().replace(/\^/g, delta);
    main = main.replace(/\^/g, delta);
    rest = rest.replace(/\^/g, delta);
    main = main.replace(String.fromCharCode(916), delta);  // there are two identical-looking deltas,
    rest = rest.replace(String.fromCharCode(916), delta);  // coerce to one of them
    var bass = matches[5] ? Pitch.fromString(matches[5], parent) : null;
    // if (bass) bass.text = matches[5];

    var kind;
    var override = {};
    // console.log(root, 'rest: ' + rest, 'main: ' + main, 'extra: ' + extra, bass);

    // Triads (excluding diminished, which is tested for below)
    if (!main) kind = 'major';
    else if (find(main, ['-', 'm', 'mi', 'min'])) kind = 'minor';
    else if (find(main, ['aug', '+', '+5', '#5'])) kind = 'augmented';
    // Sevenths
    else if (main === '7') kind = 'dominant';
    else if (find(main, ['ø', 'ø7', 'Ø', 'Ø7', '0', '07']) ||
      find(rest.replace(/\\\(/g, ''), ['-7b5', 'm7b5', 'm7-5', 'mi7b5'])) kind = 'half-diminished';
    else if (find(main, ['aug7', '7#5', '+7', '7+', '7+5'])) kind = 'augmented-seventh';
    else if (find(main, ['maj', 'maj7', delta, `${delta}7`, 'M', 'M7'])) kind = 'major-seventh';
    else if (find(main, ['-7', 'm7', 'mi7'])) kind = 'minor-seventh';
    else if (find(main, ['dim', 'dim7', 'o', '°', 'o7', '°7'])) kind = 'diminished-seventh';
    else if (find(main, ['7sus', '7sus4', 'sus7'])) kind = 'dominant-suspended-fourth'; // XXX
    else if (rest.match(/^(\-|m|mi|min)[\/\(]?(M9|\u22069|maj9)/)) {  // \u2206 = 8710 = delta
      kind = 'major-minor';
      override[9] = 'M';
    } else if (rest.match(/^(\-|m|mi|min)[\/\(]?(\\+7|maj(?!9)|M7?|\u2206|\u22067|maj7)/)) {
      kind = 'major-minor';
    } else if (rest.match(/(\+5?|aug)?[\/\(]?(\\+7|M7|\u2206|\u22067|maj7)/)) {
      kind = 'major-seventh';
      override[5] = 'A';
    } else if (find(main, ['6', 'M6', 'maj6'])) {
      // Sixths
      kind = 'major-sixth';
    } else if (find(main, ['-6', 'm6', 'mi6'])) kind = 'minor-sixth';
    else if (find(main, ['6/9', '69', '9/6'])) {
      kind = 'major-sixth';
      override[9] = 'M';
    } else if (main === '9') {
      // Ninths
      kind = 'dominant-ninth';
    } else if (find(main, ['M9', 'maj9', '\u22069'])) kind = 'major-ninth';
    else if (find(main, ['-9', 'm9', 'mi9'])) kind = 'minor-ninth';
    else if (main === 'm2') { // synonym for madd9
      kind = 'minor';
      override[9] = 'M';
    } else if (find(main, ['11', '9sus', '9sus4'])) {
      // 11ths
      kind = 'dominant-11th';
    } else if (find(main, ['M11', 'maj11', 'Δ11'])) kind = 'major-11th';
    else if (find(main, ['-11', 'm11', 'mi11'])) kind = 'minor-11th';
    // 13ths
    else if (main === '13') kind = 'dominant-13th';
    else if (find(main, ['M13', 'maj13', 'Δ13'])) kind = 'major-13th';
    else if (find(main, ['-13', 'm13', 'mi13'])) kind = 'minor-13th';
    // Suspended
    else if (main === 'sus2') kind = 'suspended-second';
    else if (find(main, ['sus', 'sus4'])) kind = 'suspended-fourth';
    // Other
    else if (find(main, ['5', 'no3'])) kind = 'power';

    var intervals = {};
    var defaultIntervals = knowledge.chordDegrees[kind];
    for (let x in defaultIntervals) intervals[x] = defaultIntervals[x];
    for (let x in override) intervals[x] = override[x];

    extra.split(/(\D+\d+)/).forEach(function(x) {
      if (x) {
        var matches = x.match(/^[ \(\)]*(add|no|omit)?([#b]?)(\d+)/);
        if (matches) {
          var acc = knowledge.accidentals.indexOf(matches[2]) - 2;
          if (acc < -2) acc = 0;
          var step = matches[3];
          if (step >= 2 && step <= 13) {
            // console.log(matches[1], acc, step);
            if (matches[1] === 'add') {
              if (acc === 0) intervals[step] = 'xxMMPPMmPMMPPM'[step];
              else if (acc === 1) intervals[step] = 'xxAAAAAAAAAAAA'[step];
              else if (acc === -1) intervals[step] = 'xxmmddmmdmmddm'[step];
            } else if (find(matches[1], ['no', 'omit'])) {
              delete intervals[step];
            } else if (acc !== 0) {
              if (acc === 1) intervals[step] = 'xxAAAAAAAAAAAA'[step];
              else if (acc === -1) intervals[step] = 'xxmmddmmdmmddm'[step];
            }
          }
        }
      }
    });

    let intervalList = [];
    for (let i in intervals) intervalList.push(Interval.fromString(intervals[i] + i, parent));

    return new Harmony({root: root, intervals: intervalList, bass: bass, kindText: rest}, parent);
  }
};

Harmony.fromKind = function(root, kind, bass, kindText) {
  var intervals = {};
  var defaultIntervals = knowledge.chordDegrees[kind];
  for (let x in defaultIntervals) intervals[x] = defaultIntervals[x];
  let intervalList = [];
  for (let i in intervals) intervalList.push(Interval.fromString(intervals[i] + i, parent));

  return new Harmony({root: root, intervals: intervalList, bass: bass, kindText: kindText}, parent);
}

Harmony.fromXML = function(xml) {
  var parser = xml2js.Parser({
    tagNameProcessors: [misc.dashToCamel],
    explicitArray: false,
    mergeAttrs: true,
    explicitCharkey: true});
  var result;
  parser.parseString(xml, function(err, obj) {
    if (err) { console.error(err); return; }

    // console.log(get(obj, 'harmony.root[0].rootStep[0]'));
    var root = Pitch.fromString(get(obj, 'harmony.root.rootStep._'));
    root.coord[1] += parseFloat(get(obj, 'harmony.root.rootAlter._', 0));
    var bass = get(obj, 'harmony.bass.bassStep._');
    if (bass) {
      bass = Pitch.fromString(bass);
      bass.coord[1] += parseFloat(get(obj, 'harmony.bass.bassAlter._', 0));
    }
    var kind = get(obj, 'harmony.kind._');
    // var text = get(obj, 'harmony.kind.text');

    // TODO: follow the spec regarding degree-alter:
    // The degree-type element can be add, alter, or
    // subtract. If the degree-type is alter or subtract, the
    // degree-alter is relative to the degree already in the
    // harmony based on its kind element. If the degree-type is
    // add, the degree-alter is relative to a dominant harmony
    // (major and perfect intervals except for a minor
    // seventh).
    // [http://www.musicxml.com/for-developers/musicxml-dtd/direction-elements/]

    var degrees = [];
    var ds = get(obj, 'harmony.degree');
    if (!(ds instanceof Array)) ds = [ds];
    ds.forEach(function(d) {
      var step = get(d, 'degreeValue._');
      var acc = parseInt(get(d, 'degreeAlter._', 0));
      var text = get(d, 'degreeType.text');
      if (step) {
        switch (d.degreeType._) {
          case 'add': degrees.push({type: 'add', step: step, interval: addInterval(step, acc), text: text}); break;
          case 'subtract': degrees.push({type: 'subtract', step: step, text: text}); break;
          case 'alter': degrees.push({type: 'alter', step: step, semitones: acc, text: text}); break;
        }
      }
    });

    result = new Harmony({root: root, intervals: degrees, bass: bass, kindText: kind}); // TODO
  });
  return result;
};

Harmony.itemType = 'Harmony';

import ItemHandler from '../item-handler.js';
ItemHandler.registerItem(Harmony);
