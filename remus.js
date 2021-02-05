
import Fraction from 'fraction.js';

import Store from './lib/store.js';

import AudioFile from './lib/classes/audio-file';
import Duration from './lib/classes/duration';
import Harmony from './lib/classes/harmony';
import Interval from './lib/classes/interval';
import Item from './lib/classes/item';
import Pitch from './lib/classes/pitch';
import MusicPtr from './lib/music-ptr';

import Audio from './lib/classes/event/audio';
import Chord from './lib/classes/event/chord';
import ChordSequence from './lib/classes/event/chord-sequence';
import Clef from './lib/classes/meta/clef';
import Mode from './lib/classes/mode';
import Note from './lib/classes/event/note';
import NoteChord from './lib/classes/event/note-chord';
import Rest from './lib/classes/event/rest';
import Song from './lib/classes/event/song';
import VerticalContainer from './lib/classes/event/vertical-container';
import Voice from './lib/classes/event/voice';
import VoiceContainer from './lib/classes/event/voice-container';
import Tempo from './lib/classes/meta/tempo';
import Time from './lib/classes/meta/time';
import Key from './lib/classes/meta/key';
import Tuplet from './lib/classes/event/tuplet';

import Score from './lib/score/score';

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
