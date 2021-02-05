
import Interval from './classes/interval';
import Pitch from './classes/pitch';
import Duration from './classes/duration';
import Harmony from './classes/harmony';
import Chord from './classes/event/chord';
import ChordSequence from './classes/event/chord-sequence';
import Note from './classes/event/note';
import NoteChord from './classes/event/note-chord';
import Rest from './classes/event/rest';
import Voice from './classes/event/voice';
import VerticalContainer from './classes/event/vertical-container';
import VoiceContainer from './classes/event/voice-container';
import AudioFile from './classes/audio-file';
import Audio from './classes/event/audio';
import Tempo from './classes/meta/tempo';
import Time from './classes/meta/time';
import Song from './classes/event/song';
import Key from './classes/meta/key';

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
