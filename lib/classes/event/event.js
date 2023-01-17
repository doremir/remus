
import Item from '../item.js';
import Duration from '../duration.js';
import Syllable from '../syllable.js';
import _ from 'underscore';
import { createState, stepState } from '../../resolver.js';
import Fraction from 'fraction.js';

/**
 * Base class for all Items that can be placed in a timeline.
 *
 * All events have a position (although it may be implicit). Some
 * events also have a duration (Note, Rest, Voice, etc.), while other
 * have no extent (Key, Time, etc.)
 *
 * Durations need not always be explicit: under certain circumstances,
 * durations are inherited either "upward" or "downward" in the tree.
 *
 * For example, Notes in a NoteChord inherit their duration from the
 * NoteChord, unless overridden in the individual Note objects. A
 * VoiceContainer, on the other hand, automatically expands to the
 * duration of its child Voice objects, unless the VoiceContainer have
 * an explicit duration.
 *
 * To get the absolute position or duration of an event, the event
 * need to be *resolved*. After resolving, the absolute time values
 * can be read from `event.cache`:
 *
 * Key                              | Value
 * -------------------------------- | -------------------------
 * `event.cache.absTime`            | Start time in seconds
 * `event.cache.absWn`              | Start time in wn (whole notes)
 * `event.cache.endTime`            | End time in seconds (not relevant for events that lack extent)
 * `event.cache.endWn`              | End time in wn
 * `event.cache.trimmedStartTime`   | Start time in seconds, taking trim into account
 * `event.cache.trimmedStartWn`     | Trimmed start time in wn
 * `event.cache.trimmedEndTime`     | Trimmed end time in seconds
 * `event.cache.trimmedEndWn`       | Trimmed end time in wn
 * `event.cache.skip`               | Amount of time in seconds to skip from the beginning, e.g. for audio files
 * `event.cache.playbackTimingTime` | Playback timing offset in seconds
 *
 *  ### Other cache values
 *
 * Key                            | Value
 * ------------------------------ | ----------------------
 * `event.cache.amp`              | Volume. 1.0 is the default
 * `event.cache.enabled`          | Item and all of its anchestors is enabled

 */
export default class Event extends Item {
  /** @ignore */
  static getSlots() {
    return Object.assign({
      position: {
        type: Duration,
        nullOk: true,
        default: null,
        coerce: true,
        owned: true
      },
      duration: {
        type: Duration,
        nullOk: true,
        default: null,
        coerce: true,
        owned: true
      },
      anchor: {
        type: Duration,
        nullOk: true,
        default: null,
        coerce: true,
        owned: true
      },
      offset: {
        type: Duration,
        nullOk: true,
        default: null,
        coerce: true,
        owned: true
      },
      trimLeft: {
        type: Duration,
        nullOk: true,
        default: null,
        coerce: true,
        owned: true
      },
      trimRight: {
        type: Duration,
        nullOk: true,
        default: null,
        coerce: true,
        owned: true
      },
      amp: {
        type: Number,
        default: 1.0
      },
      repeat: {
        type: Number,
        default: 1
      },
      stepDuration: {
        type: Boolean,
        default: this.defaultStepDuration
      },
      playbackTiming: {
        type: Duration,
        coerce: true,
        owned: true,
        nullOk: true,
        default: null
      },
      score: {
        type: Object,
        undefinedOk: true
      },
      playback: {
        type: Object,
        undefinedOk: true
      },
      layer: {
        nullOk: true,
        default: null
      },
      syllables: {
        type: Syllable.arrayOf,
        coerce: true,
        owned: true,
        default: null,
        nullOk: true
      },
      visible: {
        type: Boolean,
        default: true
      }
    }, super.getSlots());
  }

  /**
   * @ignore
   */
  init() {
    super.init();

    if (this.offset) {
      console.warn('offset is deprecated');
    }

    return this;
  }

  /**
   * @ignore
   */
  doValidate() {
    var validator = super.doValidate();
    validator.hasTypeOrNull(this, 'position', Duration);
    validator.hasTypeOrNull(this, 'duration', Duration);
    validator.hasTypeOrNull(this, 'anchor', Duration);
    validator.hasTypeOrNull(this, 'offset', Duration);
    validator.hasTypeOrNull(this, 'trimLeft', Duration);
    validator.hasTypeOrNull(this, 'trimRight', Duration);
    validator.hasTypeOrNull(this, 'playbackTiming', Duration);
    validator.isNumber(this, 'amp', 0, null);
    validator.isIntegerOrNull(this, 'layer', 0);
    validator.isInteger(this, 'repeat', 0, null);
    validator.isBoolean(this, 'stepDuration');
    return validator;
  }

  /**
   * @param {boolean} [force=false] Force resolve, even if `shouldResolve` is `false`
   */
  resolve(force = false) {
    // super.resolve(force);
    // if (force || this.shouldResolve) {
    if (true) { // TEMP: always resolve, because shouldResolve is not implemented correctly!
      var changed = this.resolveEvents(force) || changed;
      if (changed || force) {
        this.resolveTrim();
        this.resolveRepeats();
      }
    }
    this.localResolve();
  }

  /**
   * @protected
   * Called internally by resolveEvents
   */
  resolveMetas(force) {
    // See EventContainer for more interesting stuff
    this.cache.globals = (this.parent && this.parent.cache.globals) ? this.parent.cache.globals : [];
    return false;
  }

  /**
   * @protected
   * Called internally by resolve
   */
  resolveEvents(force) {
    // console.warn("resolving ", this);

    if (this.parent && this.parent.shouldResolve) {
      console.warn('Using outdated parent when resolving ', this);
    }

    // Remember old values for comparision
    var oldAbsTime = this.cache.absTime;
    var oldEndTime = this.cache.endTime;
    var oldAbsWn = this.cache.absWn;
    var oldEndWn = this.cache.endWn;

    // Simple inherited properties
    this.cache.enabled = this.parent ? !!(this.parent.cache.enabled && this.enabled) : !!this.enabled;
    let parentAmp = this.parent ? this.parent.cache.amp : 1.0;
    this.cache.amp = _.isNumber(this.amp) ? (this.amp * parentAmp) : parentAmp;
    let parentScale = this.parent ? this.parent.cache.scale : new Fraction(1);
    this.cache.scale = this.scale ? parentScale.mul(this.scale) : parentScale;

    // Start time
    var refTime = this.parent ? this.parent.cache.absTime : new Fraction(0);   // reference point
    var refWn = this.parent ? this.parent.cache.absWn : new Fraction(0);
    var defTime = refTime;                                                // default, if no position given
    var defWn = refWn;
    if (this.parent && this.parent.eventTimeMode === 'relative' &&
        this.cache.prevSibling && this.cache.prevSibling.stepDuration) {
      defTime = this.cache.prevSibling.cache.endTime;
      defWn = this.cache.prevSibling.cache.endWn;
    }
    this.cache.absTime = defTime;
    this.cache.absWn = defWn;
    if (this.parent) {
      var state = createState(this, this.parent ? this.parent.cache.globals : []);
      if (this.position && !this.position.isZero()) {
        stepState(state, this.position, this.parent.cache.globals);
        this.cache.absTime = state.absTime;
        this.cache.absWn = state.absWn;
      }
      this.cache.tempo = state.tempo;
      this.cache.time = state.time;
      this.cache.sPerWn = state.sPerWn;
      this.cache.key = state.key;
    } else {
      if (this.position && !this.position.isZero()) {
        throw Error('Top object cannot have a non-zero position');
      }
    }

    // Now that we know the start time of the event, we resolve the meta list
    this.resolveMetas();

    // console.log("After resolveMetas() for ", this, this.cache.globals);

    // Inherit explicit durations from parent
    var duration = this.duration || ((this.inheritExplitDuration && this.parent) ? this.parent.cache.duration : null);
    this.cache.duration = duration;

    // Mark as resolved before propagating to children
    this.shouldResolve = false;

    // Propagate
    var children = this.events ? this.events.slice(0) : [];
    var maxEndTime = this.cache.absTime;
    var maxEndWn = this.cache.absWn;
    this.cache.children = children;
    for (var no = 0; no < children.length; no++) {
      var child = children[no];
      if (child.parent !== this) {
        console.warn('Bad parent in %s %o', child.type, child);
      }
      child.cache.no = no;
      child.cache.prevSibling = children[no - 1];
      child.cache.nextSibling = children[no + 1];
      child.resolveEvents(force);
      child.localResolve();
      if (child.cache.endTime > maxEndTime) maxEndTime = child.cache.endTime;
      if (child.cache.endWn > maxEndWn) maxEndWn = child.cache.endWn;
    }

    if (duration && !duration.isZero()) { // Explicit duration in this object, or inherited from parent
      state = createState(this, this.cache.globals);
      stepState(state, duration, this.cache.globals);
      this.cache.endTime = state.absTime;
      this.cache.endWn = state.absWn;
    } else {
      this.cache.endTime = maxEndTime;
      this.cache.endWn = maxEndWn;
    }

    // Temp: cache.durations
    // if (this.cache.endWn) {
    //   this.cache.durations = [this.cache.endWn.sub(this.cache.absWn)];
    // }

    // Return true if timing changed
    return (this.cache.absTime !== oldAbsTime ||
      this.cache.endTime !== oldEndTime ||
      !this.cache.absWn.equals(oldAbsWn) ||
      !this.cache.endWn.equals(oldEndWn));
  }

  /**
   * @protected
   * Called internally by resolve
   */
  resolveTrim() {
    // Start values are the boundaries of the event
    this.cache.trimmedStartTime = this.cache.absTime;
    this.cache.trimmedStartWn = this.cache.absWn;
    this.cache.trimmedEndTime = this.cache.endTime;
    this.cache.trimmedEndWn = this.cache.endWn;
    this.cache.skip = 0;

    // Left Trim
    if (this.trimLeft && this.trimLeft.value > 0) {
      let state = createState(this, this.cache.globals);
      stepState(state, this.trimLeft, this.cache.globals);
      this.cache.trimmedStartTime = state.absTime;
      this.cache.trimmedStartWn = state.absWn;
    }
    // Right Trim
    if (this.trimRight && this.trimRight.value > 0) {
      // TODO!!!
      // this.cache.tempo is not defined here! (Yes, it is??)

      let state = createState(this, this.cache.globals);
      let actualDuration = Duration.coerce([this.cache.endWn.sub(this.cache.absWn), 'wn']);
      // console.log(">> actualDuration", actualDuration, this.cache.endTime.sub(this.cache.absTime));
      // console.log("Before stepping: ", state);
      stepState(state, actualDuration, this.cache.globals);
      // console.log("After stepping: ", state);
      // console.log(">> trimRight: ", this.trimRight, state.absTime);
      stepState(state, this.trimRight.inverse(), this.cache.globals);
      // console.log(">> inverted trimRight", this.trimRight.inverse(), state.absTime);
      this.cache.trimmedEndTime = state.absTime;
      this.cache.trimmedEndWn = state.absWn;
    }

    // Store this object's "own" trim, unaffected by inherited values (needed for e.g. repeats)
    this.cache.ownTrimmedStartTime = this.cache.trimmedStartTime;
    this.cache.ownTrimmedStartWn = this.cache.trimmedStartWn;
    this.cache.ownTrimmedEndTime = this.cache.trimmedEndTime;
    this.cache.ownTrimmedEndWn = this.cache.trimmedEndWn;

    // Adjust left trim so that it uses the maximum of the own and the inherited value
    if (this.parent && (this.parent.cache.trimmedStartTime !== undefined)) {
      if (this.cache.trimmedStartTime < this.parent.cache.trimmedStartTime) {
        this.cache.trimmedStartTime = this.parent.cache.trimmedStartTime;
        this.cache.trimmedStartWn = this.parent.cache.trimmedStartWn;
      }
    }

    // Same for right trim
    if (this.parent && (this.parent.cache.trimmedEndTime !== undefined)) {
      if (this.cache.trimmedEndTime > this.parent.cache.trimmedEndTime) {
        this.cache.trimmedEndTime = this.parent.cache.trimmedEndTime;
        this.cache.trimmedEndWn = this.parent.cache.trimmedEndWn;
      }
    }

    // Set trimmedStart
    if (this.cache.absTime < this.cache.trimmedStartTime) {
      this.cache.trimmedStart = true;
      this.cache.skip = this.cache.trimmedStartTime - this.cache.absTime;
      // TEMPORARY:
      // Set enabled to false for Notes or NoteChords that have a trimmed start
      if (((this.type === 'Note') || (this.type === 'NoteChord')) && (this.cache.skip > 0)) this.cache.enabled = false;
    }
    if ((this.cache.trimmedEndTime !== undefined) && this.cache.absTime > this.cache.trimmedEndTime) {
      this.cache.trimmedStart = true; // sic!
      if ((this.type === 'Note') || (this.type === 'NoteChord')) this.cache.enabled = false;
    }

    // Propagate to children
    if (this.cache.children) {
      this.cache.children.forEach(function(child) {
        child.resolveTrim();
      });
    }
  }

  /**
   * @protected
   * Called internally by resolve
   */
  resolveRepeats() {
    this.cache.repeats = this.parent ? this.parent.cache.repeats : [];
    if (this.repeat !== 1) {
      this.cache.repeats = this.cache.repeats.slice(); // copy on write
      this.cache.repeats.push({
        count: this.repeat,
        periodTime: this.cache.ownTrimmedEndTime.sub(this.cache.ownTrimmedStartTime),
        periodWn: this.cache.ownTrimmedEndWn.sub(this.cache.ownTrimmedStartWn)
      });
    }
    if (this.cache.children) {
      this.cache.children.forEach((child) => {
        child.resolveRepeats();
      });
    }
  }

  /** @ignore */
  localResolve() {
    super.localResolve();
    if (this.playbackTiming) {
      if (this.playbackTiming.isTime()) {
        this.cache.playbackTimingTime = this.playbackTiming.toSeconds();
      } else if (this.playbackTiming.unit === 'wn') {
        this.cache.playbackTimingTime = this.playbackTiming.value.mul(this.cache.sPerWn);
      } else {
        console.error('Bad unit in playbackTiming');
      }
    }
  }

  /**
   * @ignore
   */
  toJSON() {
    var obj = super.toJSON();
    if (obj.stepDuration === this.constructor.defaultStepDuration) delete obj.stepDuration;
    if (this.parent && obj.type === this.parent.constructor.defaultEventItemType) delete obj.type;
    if (obj.amp === 1.0) delete obj.amp;
    if (obj.repeat === 1) delete obj.repeat;
    return obj;
  }
}

Event.defaultStepDuration = true; // true means automatic
