
import Interval from './classes/interval.js';
import Pitch from './classes/pitch.js';
import Duration from './classes/duration.js';
import Harmony from './classes/harmony.js';
import Chord from './classes/event/chord.js';
import ChordSequence from './classes/event/chord-sequence.js';
import Note from './classes/event/note.js';
import NoteChord from './classes/event/note-chord.js';
import Rest from './classes/event/rest.js';
import Voice from './classes/event/voice.js';
import VerticalContainer from './classes/event/vertical-container.js';
import VoiceContainer from './classes/event/voice-container.js';
import AudioFile from './classes/audio-file.js';
import Audio from './classes/event/audio.js';
import Tempo from './classes/meta/tempo.js';
import Time from './classes/meta/time.js';
import Song from './classes/event/song.js';
import Key from './classes/meta/key.js';

export default {
  typeMap: {
    Interval: Interval,
    Pitch: Pitch,
    Duration: Duration,
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
    Song: Song,
    Key: Key
  },
  ignoredProperties: ['parent', 'cache'],

  store: function(obj) {
    var getObjectTypeString = this.getObjectTypeString.bind(this);
    var ignoredProperties = this.ignoredProperties;
    return JSON.stringify(obj, function(k, v) {
      var typeStr = getObjectTypeString(v);
      if (typeStr) {
        var obj = {type: typeStr};
        for (var i in v) {
          if (ignoredProperties.indexOf(i) < 0) { obj[i] = v[i]; }
        }
        return obj;
      } else {
        return v;
      }
    });
  },

  restore: function(str) {
    var root = JSON.parse(str);

    return new Song(root);
  },

  bless: function(obj) {
    return this.restore(this.store(obj));
  },

  strToProto: function(str) {
    return this.typeMap[str];
  },

  getObjectTypeString: function(obj) {
    for (var typeStr in this.typeMap) {
      var proto = this.typeMap[typeStr];
      if (proto.isPrototypeOf(obj) || obj instanceof proto) { return typeStr; }
    }
    return null;
  }
};
