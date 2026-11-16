
import _ from 'underscore';

import EventContainer from './event-container.js';
import Pitch from '../pitch.js';
import Interval from '../interval.js';
import Fraction from 'fraction.js';

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

    if (currentClosest == null || distance < currentDistance) {
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

  if (result != null) {
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

  if (result != null) {
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
  const song = chordSequence.env.get('song');
  const chords = chordSequence.findEvents('Chord').filter(chord => chord.harmony?.root)
    .sort((first, second) => first.cache.absWn.compare(second.cache.absWn));
  if (!chords.length) return null;
  const endWn = chords[chords.length - 1].cache.endWn;
  const targetMeasure = song.findEvents('Voice')[0]?.cache?.time?.getMeasureWn?.() || new Fraction(1);
  const sourceMeasure = patternSong.findEvents('Voice')[0]?.cache?.time?.getMeasureWn?.() || new Fraction(1);
  const sources = patternSong.findEvents('Voice').filter(source => source.findEvents('Note').length);
  if (!sources.length) return null;
  const firstPosition = sources.reduce((first, source) =>
    source.cache.absWn.compare(first) < 0 ? source.cache.absWn : first, sources[0].cache.absWn);
  const origin = firstPosition.div(sourceMeasure).floor().mul(sourceMeasure);
  const period = patternSong.cache.endWn?.sub(origin);
  if (!period || period.compare(0) <= 0) return null;
  const scale = targetMeasure.div(sourceMeasure);
  const cycle = targetMeasure.mul(Math.ceil(Number(period.div(sourceMeasure)) - 1e-9));
  const voices = sources.map(source => {
    const events = [];
    for (let start = new Fraction(0); start.compare(endWn) < 0; start = start.add(cycle)) {
      for (const note of source.findEvents('Note')) {
        const position = start.add(note.cache.absWn.sub(origin).mul(scale));
        const end = position.add(note.cache.endWn.sub(note.cache.absWn).mul(scale));
        const duration = (end.compare(endWn) > 0 ? endWn : end).sub(position);
        if (position.compare(endWn) >= 0 || duration.compare(0) <= 0) continue;
        events.push({ ...note.toJSON(), type: 'Note', amp: note.cache.amp,
          position: fractionToWnJSON(position), duration: fractionToWnJSON(duration) });
      }
    }
    return { type: 'Voice', sound: source.sound || 'keyboard', eventTimeMode: 'absolute', events };
  });
  const container = song.initSubObject(voices.length === 1 ? voices[0]
    : { type: 'VerticalContainer', eventTimeMode: 'absolute', events: voices });
  container.id = 'generated-chords';
  container.resolve(true);
  const env = { song, patternSong, songKey: song.findMeta('Key'), patternKey: patternSong.findMeta('Key') };
  for (const note of container.findEvents('Note')) {
    let chordIndex = 0;
    while (chords[chordIndex + 1] && note.cache.absWn.compare(chords[chordIndex + 1].cache.absWn) >= 0) chordIndex++;
    const chord = chords[chordIndex];
    if (note.cache.absWn.compare(chord.cache.absWn) < 0) { note.amp = 0; continue; }
    env.harmonyRelation = { type: 'auto', ...(note.harmonyRelation || {}) };
    switch (env.harmonyRelation.type) {
      case 'keyNote':
        if (env.songKey && env.patternKey) noteToKeyNote(env, note);
        break;
      case 'chordNote': noteToChordNote(env, chord, note); break;
      case 'absolute': break;
      default: noteToAutoNote(env, chord, note); break;
    }
  }
  return container;
}

function generateSparseChordPlayback(chordSequence, patternSong, repeatEveryWn) {
  const song = chordSequence.env.get('song');
  const repeat = Number(new Fraction(repeatEveryWn).valueOf());
  if (!Number.isFinite(repeat) || repeat <= 0) throw new RangeError('Chord repeat interval must be positive');
  const chords = chordSequence.findEvents('Chord').filter(chord => chord.cache?.absWn)
    .sort((first, second) => first.cache.absWn.compare(second.cache.absWn));
  const pattern = patternSong.findEvents('Note').filter(note => {
    const position = Number(note.cache?.absWn?.valueOf());
    return Number.isFinite(position) && position >= 0 && position < 1;
  });
  if (!chords.length || !pattern.length) return null;
  const triggers = new Map();
  for (const chord of chords) {
    const start = chord.cache.absWn;
    const end = chord.cache.endWn;
    if (!end) continue;
    triggers.set(`${start.n}/${start.d}`, { position: start, chord });
    for (let beat = Math.ceil(Number(start.valueOf()) / repeat + 1e-9);
      beat <= Math.floor(Number(end.valueOf()) / repeat - 1e-9); beat++) {
      const position = new Fraction(repeatEveryWn).mul(beat);
      const key = `${position.n}/${position.d}`;
      if (!triggers.has(key)) triggers.set(key, { position, chord });
    }
  }
  const sorted = [...triggers.values()].sort((first, second) => first.position.compare(second.position));
  const events = [];
  for (let index = 0; index < sorted.length; index++) {
    const trigger = sorted[index];
    const end = sorted[index + 1]?.position || chords[chords.length - 1].cache.endWn;
    if (!end || end.compare(trigger.position) <= 0) continue;
    for (const template of pattern) {
      const position = trigger.position.add(template.cache.absWn);
      const duration = end.sub(position);
      if (duration.compare(0) <= 0) continue;
      events.push({ ...template.toJSON(), position: fractionToWnJSON(position), duration: fractionToWnJSON(duration) });
    }
  }
  const voice = song.initSubObject({ type: 'Voice', id: 'generated-chords', eventTimeMode: 'absolute',
    sound: getInstruments(patternSong)[0] || 'keyboard', events });
  voice.resolve(true);
  let chordIndex = 0;
  for (const event of voice.events.slice().sort((first, second) => first.cache.absWn.compare(second.cache.absWn))) {
    while (sorted[chordIndex + 1] && event.cache.absWn.compare(sorted[chordIndex + 1].position) >= 0) chordIndex++;
    const chord = sorted[chordIndex]?.chord;
    if (!chord) { event.amp = 0; continue; }
    const env = { harmonyRelation: { type: 'auto', ...(event.harmonyRelation || {}) } };
    if (env.harmonyRelation.type === 'chordNote') noteToChordNote(env, chord, event);
    else noteToAutoNote(env, chord, event);
  }
  return voice;
}

/**
 * A sequence of chords
 *
 * Convenience class to group chords horizontally, like a {@link Voice} but for {@link Chord}s
 * rather than for {@link Note}s or {@link NoteChord}s.
 *
 */
export default class ChordSequence extends EventContainer {

  generateChordPlayback(patternSong, { sparse = false, repeatEveryWn = 1 } = {}) {
    return sparse ? generateSparseChordPlayback(this, patternSong, repeatEveryWn) : generateChordPlayback(this, patternSong);
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
