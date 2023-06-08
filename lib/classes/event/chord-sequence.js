
import _ from 'underscore';

import EventContainer from './event-container.js';
import Pitch from '../pitch.js';
import Interval from '../interval.js';

function fractionToWnJSON(fraction) {
  return [fraction.n, fraction.d, 'wn'];
}

function getChordPitches(chord) {
  var root = chord.initSubObject(chord.harmony.root, 'Pitch');
  var pitches = [root];

  _.each(chord.harmony.intervals, (interval) => {
    pitches.push(root.interval(interval));
  });

  return pitches;
}

function getChordMidiNumbers(chord) {
  return _.map(getChordPitches(chord), (pitch) => {
    return pitch.toMIDI();
  });
}

function findClosestMidiNumber(targetNumber, inputNumber) {
  var difference = targetNumber - inputNumber;
  var octaveDifference = Math.round(difference / 12);
  return inputNumber + (octaveDifference * 12);
}

function findClosestChordMidiNumber(targetNumber, chord) {
  var chordNumbers = getChordMidiNumbers(chord);

  var currentClosest = null;
  var currentDistance = null;

  _.each(chordNumbers, (n) => {
    var closest = findClosestMidiNumber(targetNumber, n);
    var distance = Math.abs(targetNumber - closest);

    if (!currentClosest || distance < currentDistance) {
      currentClosest = closest;
      currentDistance = distance;
    }
  });

  return currentClosest;
}

function closestOctaveDifference(pitchFrom, pitchTo) {
  var mod = (a, b) => (a % b + b) % b;

  // calculate closest direction to transpose
  var interval = pitchTo.interval(pitchFrom).coord[1];
  var octaveDifference = Math.sign(interval) * Math.abs(Math.floor(interval / 12));

  var chromaticDifference = mod(interval, 12);
  if (chromaticDifference > 6) {
    chromaticDifference = chromaticDifference - 12;
  }

  // is closest new root in the same octave?
  var octaveCorrection = Math.floor(pitchFrom.coord[1] / 12) - Math.floor((pitchFrom.coord[1] + chromaticDifference) / 12);

  // adjust
  octaveDifference += octaveCorrection;

  return octaveDifference;
}

function transposeNote(keyFrom, keyTo, note) {
  var pitch = note.pitch;

  var octaveDifference = closestOctaveDifference(keyFrom.root, keyTo.root);
  var octaveInterval = new Interval({coord: [octaveDifference * 7, octaveDifference * 12]});

  // transpose destination root pitch to be in closest octave

  var keyInterval = keyFrom.root.interval(keyTo.root);
  keyInterval = keyInterval.add(octaveInterval);

  // this mutates the original note rather than creating a new one, correct?
  pitch.transpose(keyInterval);

  return note;
}

function noteToAutoNote(env, chord, note) {
  var targetNumber = note.pitch.toMIDI();
  var result = findClosestChordMidiNumber(targetNumber, chord);

  if (result) {
    note.pitch = Pitch.fromMIDI(result, note);
  } else {
    note.amp = 0;
  }
}

function noteToChordNote(env, chord, note) {
  var step = env.harmonyRelation.step;

  if (!step) {
    console.error('"step" is required in harmonyRelation when using type "chordNote"!');
    note.amp = 0;
    return;
  }

  var chordNumbers = getChordMidiNumbers(chord);
  var index = (step - 1) % chordNumbers.length;
  var chordNoteNumber = chordNumbers[index];

  var targetNumber = note.pitch.toMIDI();
  var result = findClosestMidiNumber(targetNumber, chordNoteNumber);

  if (result) {
    note.pitch = Pitch.fromMIDI(result, note);
  } else {
    note.amp = 0;
  }
}

function noteToKeyNote(env, note) {
  var patternKey = env.patternKey;
  var songKey = env.songKey;

  return transposeNote(patternKey, songKey, note);
}

function getInstruments(song) {
  return (
    _.chain(song.findEvents('Voice'))
    .map(function(voice) { return voice.sound; })
    .filter(_.identity)
    .unique()
    .value()
  );
}

function generateChordPlayback(chordSequence, patternSong) {
  var song = chordSequence.env.get('song');
  var songKey = song.findMeta('Key');
  var chords = chordSequence.findEvents('Chord');
  var patternKey = patternSong.findMeta('Key');

  // make sure pattern is 1 bar long
  var pattern = (
    _.chain(patternSong.findEvents('Note'))
    .filter((note) => {
      var absWn = note.cache.absWn.valueOf();
      return absWn >= 0 && absWn < 1;
    })
    // We decided against transposing all notes, instead it only transposes key notes.
    // .map((note) => {
    //   return transposeNote(patternKey, songKey, note);
    // })
    .value()
  );

  // sort chords by time
  chords = _.sortBy(chords, (chord) => {
    return chord.cache.absTime.valueOf();
  });

  var chordEndWn = _.last(chords).cache.endWn;
  var measures = _.times(Math.ceil(chordEndWn.valueOf()), _.identity);
  var events = [];

  _.each(measures, (measure) => {
    var newEvents = _.map(pattern, (note) => {
      var out = note.toJSON();

      out.position = fractionToWnJSON(note.cache.absWn.add(measure));
      out.duration = fractionToWnJSON(note.cache.absWn.sub(note.cache.endWn));

      return out;
    });

    events = events.concat(newEvents);
  });

  var instruments = getInstruments(patternSong);

  if (instruments.length > 1) {
    console.error('Pattern contains more than 1 instrument!' +
      ' Only the first one will be used. Instruments found:', instruments);
  }

  var container = song.initSubObject({
    type: 'Voice',
    id: 'generated-chords',
    eventTimeMode: 'absolute',
    sound: instruments[0] || 'keyboard',
    events: events
  });

  container.resolve(true);

  var env = {
    song: song,
    patternSong: patternSong,
    chords: chords,
    songKey: songKey,
    patternKey: patternKey
  };

  var currentChordIndex = null;
  var currentChord = null;

  _.each(container.events, (event) => {
    if (!currentChord) {
      // https://github.com/infusion/Fraction.js/#boolean-comparen
      if (event.cache.absWn.compare(chords[0].cache.absWn) >= 0) {
        currentChord = chords[0];
        currentChordIndex = 0;
      }
    }

    var nextChordIndex = currentChordIndex + 1;
    var nextChord = chords[nextChordIndex];

    if (nextChord && event.cache.absWn.compare(nextChord.cache.absWn) >= 0) {
      currentChordIndex = nextChordIndex;
      currentChord = nextChord;

      nextChordIndex = currentChordIndex + 1;
      nextChord = chords[nextChordIndex];
    }

    if (!currentChord) {
      event.amp = 0;
      return event;
    }

    var harmonyRelation = _.extend({
      type: 'auto'
    }, event.harmonyRelation);

    env.currentChord = currentChord;
    env.nextChord = nextChord;
    env.harmonyRelation = harmonyRelation;

    var note = event;

    switch (harmonyRelation.type) {
      default:
      case 'auto': noteToAutoNote(env, currentChord, note); break;
      case 'keyNote': noteToKeyNote(env, note); break;
      case 'chordNote': noteToChordNote(env, currentChord, note); break;
    }
  });

  return container;
}

/**
 * A sequence of chords
 *
 * Convenience class to group chords horizontally, like a {@link Voice} but for {@link Chord}s
 * rather than for {@link Note}s or {@link NoteChord}s.
 *
 */
export default class ChordSequence extends EventContainer {

  generateChordPlayback(patternSong) {
    return generateChordPlayback(this, patternSong);
  }
}

ChordSequence.coerce = function(source, parent, copy) {
  if (source instanceof ChordSequence) return copy ? new ChordSequence(source, parent) : source;
  throw new Error('Cannot coerce ' + source + ' to a chord sequence!');
};

ChordSequence.itemType = 'ChordSequence';

import ItemHandler from '../../item-handler.js';
ChordSequence.defaultEventItemType = 'Chord';

ItemHandler.registerItem(ChordSequence);
