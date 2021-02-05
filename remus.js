
import Fraction from 'fraction.js';

import Store from './lib/store.js';

import AudioFile from './lib/classes/audio-file.js';
import Duration from './lib/classes/duration.js';
import Harmony from './lib/classes/harmony.js';
import Interval from './lib/classes/interval.js';
import Item from './lib/classes/item.js';
import Pitch from './lib/classes/pitch.js';
import MusicPtr from './lib/music-ptr.js';

import Audio from './lib/classes/event/audio.js';
import Chord from './lib/classes/event/chord.js';
import ChordSequence from './lib/classes/event/chord-sequence.js';
import Clef from './lib/classes/meta/clef.js';
import Mode from './lib/classes/mode.js';
import Note from './lib/classes/event/note.js';
import NoteChord from './lib/classes/event/note-chord.js';
import Rest from './lib/classes/event/rest.js';
import Song from './lib/classes/event/song.js';
import VerticalContainer from './lib/classes/event/vertical-container.js';
import Voice from './lib/classes/event/voice.js';
import VoiceContainer from './lib/classes/event/voice-container.js';
import Tempo from './lib/classes/meta/tempo.js';
import Time from './lib/classes/meta/time.js';
import Key from './lib/classes/meta/key.js';
import Tuplet from './lib/classes/event/tuplet.js';

import Score from './lib/score/score.js';

import NoteSplit from 'note-split';

export default {
  Store: Store,

  Fraction: Fraction,
  Interval: Interval,
  Pitch: Pitch,
  Duration: Duration,
  Mode: Mode,
  Note: Note,
  NoteChord: NoteChord,
  Rest: Rest,
  Harmony: Harmony,
  Chord: Chord,
  ChordSequence: ChordSequence,
  Voice: Voice,
  VerticalContainer: VerticalContainer,
  VoiceContainer: VoiceContainer,
  AudioFile: AudioFile,
  Audio: Audio,
  Tempo: Tempo,
  Time: Time,
  Clef: Clef,
  Song: Song,
  Key: Key,
  Tuplet: Tuplet,
  Item: Item,
  MusicPtr: MusicPtr,

  Score: Score,

  debug: {
    NoteSplit: NoteSplit
  },

  interval: Interval.coerce,
  pitch: Pitch.coerce,
  duration: Duration.coerce,
  mode: Mode.coerce,
  note: Note.coerce,
  noteChord: NoteChord.coerce,
  rest: Rest.coerce,
  harmony: Harmony.coerce,
  chord: Chord.coerce,
  chordSequence: ChordSequence.coerce,
  voice: Voice.coerce,
  verticalContainer: VerticalContainer.coerce,
  voiceContainer: VoiceContainer.coerce,
  audioFile: AudioFile.coerce,
  audio: Audio.coerce,
  tempo: Tempo.coerce,
  time: Time.coerce,
  clef: Clef.coerce,
  song: Song.coerce,
  key: Key.coerce,
  tuplet: Tuplet.coerce,

};