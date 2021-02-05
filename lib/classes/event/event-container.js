
import _ from 'underscore';
import Event from './event.js';
import Note from './note.js';
import Duration from '../duration.js';
import ItemHandler from '../../item-handler.js';
import Fraction from 'fraction.js';
import misc from '../../misc.js';
import { createState, stepState, updateState } from '../../resolver.js';

/**
 * Base class for events that can contain other events.
 *
 * Event containers store their child events in two lists:
 * `events` and `metas`. The `events` list is for Notes, Rests, Chords,
 * Audio clips etc, while the `metas` list is used to store "meta-events"
 * like Time, Key and Tempo.
 *
 * EventContainers can be nested, e.g. a Song could contain a voice, which
 * in turn contains a NoteChord, containing some Notes.
 *
 * **Note** that `metas` cannot be nested. Events in `metas` also cannot
 * have (non-zero) duration — they only have position.
 *
 * All event containers have a *time mode* for its `events` and `metas` lists.
 * Time mode can be either `absolute` or `relative`. This determines how
 * the position of the contained events are interpreted.
 *
 * * In **absolute time mode**, positions are related to the parent container's start position
 * * In **relative time mode**, positions are related to the previous event's end position
 *
 * Subclasses of EventContainer specify a default time mode, however that can be
 * overridden in individual objects if needed.
 *
 * For example, VerticalContainer have the default `eventTimeMode` set to `absolute`.
 * This means that Notes in a NoteChord relate to the beginning of the NoteChord by default,
 * while NoteChords in a Voice are placed after each other by default (since the default
 * `eventTimeMode` for Voice is `relative`).
 */
export default class EventContainer extends Event {
  /**
   * @ignore
   */
  static getSlots() {
    return super.getSlots().concat(['eventTimeMode', 'metaTimeMode', 'scale']);
  }

  /*
   * @ignore
   */
  constructor(properties, parent) {
    if (!properties) properties = {};
    super(properties, parent);

    this.initEvents(properties.events || [], this.defaultEventItemType); // Why not just specify events and metas as slots??
    this.metas = this.initSubObjects(properties.metas);
  }

  /** @ignore */
  initEvents(events, defaultItemType) {
    var ItemConstructor = defaultItemType ? ItemHandler.getConstructor(defaultItemType) : null;
    this.events = this.initSubObjects(events, ItemConstructor);
  }

  /** @ignore */
  init() {
    super.init();
    this.eventTimeMode = this.eventTimeMode || this.defaultEventTimeMode;
    this.metaTimeMode = this.metaTimeMode || this.defaultMetaTimeMode;
    /** @type {Fraction} */
    this.scale = this.scale === undefined ? null : new Fraction(this.scale);
    return this;
  }

  /** @ignore */
  clone() {
    let copy = super.clone();
    copy.events = misc.clone(this.events);
    copy.metas = misc.clone(this.metas);
    return copy;
  }

  /**
   * Returns immediate children of the specified class, or matching the specified function.
   * @param {?(string|function)} [selector] - A string, a function or `null` (for matching all items)
   * @return {Array}
   */
  childEvents(selector) {
    var selectorFunction = null;

    if (_.isFunction(selector)) {
      selectorFunction = selector;
    } else if (_.isString(selector)) {
      selectorFunction = (item) => {
        return item.type === selector;
      };
    } else {
      selectorFunction = v => true;
    }

    return _.filter(this.events, selectorFunction);
  }

  /**
   * Returns descendents of the specified class, or matching the specified function.
   * @param {?(string|function)} [selector] - A string, a function or `null` (for matching all items)
   * @return {Array}
   */
  findEvents(selector) {
    var events = this.childEvents(selector);

    _.each(this.events, (event) => {        // NB: Go through the unfiltered this.events, in order to search the whole tree
      if (event instanceof EventContainer) {
        events = events.concat(event.findEvents(selector));
      }
    });

    return events;
  }

  /**
   * Find the first descendent of the specified class, or matching the specified function.
   * @param {?(string|function)} [selector] - A string, a function or `null` (for matching all items)
   * @return {Event?}
   */
  findEvent(selector) {
    var events = this.findEvents(selector); // TODO: stop at first match instead of finding all
    return events ? events[0] : null;
  }

  /**
   * Returns immediate child metas of the specified class, or matching the specified function.
   * @param {?(string|function)} [selector] - A string, a function or `null` (for matching all items)
   * @return {Array}
   */
  childMetas(selector) {
    var selectorFunction = null;

    if (_.isFunction(selector)) {
      selectorFunction = selector;
    } else if (_.isString(selector)) {
      selectorFunction = (item) => {
        return item.type === selector;
      };
    } else {
      selectorFunction = v => true;
    }

    return _.filter(this.metas, selectorFunction);
  }

  /**
   * Returns descendent metas of the specified class, or matching the specified function.
   * @param {?(string|function)} [selector] - A string, a function or `null` (for matching all items)
   * @return {Array}
   */
  findMetas(selector) {
    var metas = this.childMetas(selector);

    _.each(this.events, (event) => {        // NB: Go through the unfiltered this.events, in order to search the whole tree
      if (event instanceof EventContainer) {
        metas = metas.concat(event.findMetas(selector));
      }
    });

    return metas;
  }

  /**
   * Find the first meta of the specified class, or matching the specified function.
   * @param {?(string|function)} [selector] - A string, a function or `null` (for matching all items)
   * @return {Event?}
   */
  findMeta(selector) {
    var metas = this.findMetas(selector); // TODO: stop at first match instead of finding all
    return metas ? metas[0] : null;
  }

  /**
   * @ignore
   */
  toJSON() {
    var obj = super.toJSON();
    if (obj.scale instanceof Fraction && obj.scale.valueOf() === 1) delete obj.scale;
    if (obj.eventTimeMode === this.defaultEventTimeMode) delete obj.eventTimeMode;
    if (obj.metaTimeMode === this.defaultMetaTimeMode) delete obj.metaTimeMode;
    obj.events = _.map(this.childEvents(), event => event.toJSON());
    let metas = this.childMetas();
    if (metas && metas.length) obj.metas = _.map(metas, meta => meta.toJSON());
    return obj;
  }

  /**
   * @ignore
   */
  doValidate() {
    var validator = super.doValidate();
    validator.isOneOf(this, 'eventTimeMode', ['absolute', 'relative']);
    validator.isOneOf(this, 'metaTimeMode', ['absolute', 'relative']);
    validator.hasTypeOrNull(this, 'scale', Fraction);
    return validator;
  }

  enableAutoResolver() {
    super.enableAutoResolver();
    _.each(this.childEvents(), (event) => { event.enableAutoResolver(); });
  }

  disableAutoResolver() {
    super.disableAutoResolver();
    _.each(this.childEvents(), (event) => { event.disableAutoResolver(); });
  }

  /**
   * @ignore
   */
  get defaultEventTimeMode() {
    return 'relative';
  }

  /**
   * @ignore
   */
  get defaultMetaTimeMode() {
    return 'relative';
  }

  /**
   * @protected
   */
  resolveMetas(force = false) {
    super.resolveMetas(force);
    if (!this.metas || this.metas.length === 0) return false;

    // TODO: handle unsorted absolute lists

    var absolute = this.metaTimeMode === 'absolute';
    var state = absolute ? null : createState(this, this.cache.globals);
    this.metas.forEach(child => {
      if (child.position) {
        if (absolute) {
          if (!child.position.isFixed()) throw Error('Absolute meta lists must only have fixed duration units');
          state = createState(this, this.cache.globals);
        } else {
          if (child.position.value < 0) throw Error('Negative time values not allowed in relative meta list');
        }
        stepState(state, child.position, this.cache.globals);
      }
      child.cache.absTime = state.absTime;
      child.cache.absWn = state.absWn;
      child.cache.tempo = state.tempo;
      child.cache.time = state.time;
      child.cache.sPerWn = state.sPerWn;
      child.cache.key = state.key;
      // child.env.set("tempo", state.tempo);
      // child.env.set("time", state.time);
      // child.env.set("sPerWn", state.sPerWn);
      switch (child.type) {
        case 'Time':
        case 'Tempo':
        case 'Key':
          this.cache.globals = _.sortBy(this.cache.globals.concat(child), 'absTime');
          if (child.type === 'Tempo') state.tempo = child;
          if (child.type === 'Time') state.time = child;
          if (child.type === 'Key') state.key = child;
          updateState(state, child);
          break;
      }
      child.localResolve();
    });

    return true; // TODO!
  }

    /**
   * Find overlapping events.
   * Returns an array of arrays, where each top-level array is a "cluster" of overlapping events
   * @return {Array}
   */
  findOverlappingEvents() {
    this.resolve();
    if (!this.events) return [];
    // Sort events by start time
    var events = this.events.slice().sort((a, b) => { return a.cache.absTime.sub(b.cache.absTime); });
    var clusters = [];
    var overlapping = [];
    var max = null;
    var lastEvent = null;
    _.each(events, (event) => {
      if (lastEvent && (max > event.cache.absTime)) {
        // Overlap
        max = max > event.cache.endTime ? max : event.cache.endTime;
        if (overlapping[overlapping.length - 1] !== lastEvent) overlapping.push(lastEvent);
        overlapping.push(event);
      } else {
        // No overlap
        max = event.cache.endTime;
        if (overlapping.length) {
          clusters.push(overlapping);
          overlapping = [];
        }
      }
      lastEvent = event;
    });
    if (overlapping.length) clusters.push(overlapping);
    return clusters;
  }

 /**
   * Non-destructivly (but see note below) split the EventContainer based on the layer slot of the contained events.
   * @param {bool} [resetLayerSlot=false] - Set the layer slot to null for all events after splitting
   * @return {Array} - Returns a list of new containers of the same class as the original EventContainer
   * NOTE: In the current implementation, the EventContainer is cloned, but its events aren't.
   * This means that the newly created EventContainers will share data with the original EventContainer,
   * and if resetLayerSlot is used, layers will be reset also in the original EventContainer.
   */
  splitByLayers(resetLayerSlot = false) {
    if (this.eventTimeMode !== 'absolute') {
      throw new Error('splitByLayers can currently only be used with absolute-time containers');
    }
    // TODO: handle relative mode
    var newEventLists = [];
    _.each(this.events, (event) => {
      var layer = event.layer || 0;
      if (!newEventLists[layer]) newEventLists[layer] = [];
      newEventLists[layer].push(event);
      if (resetLayerSlot) event.layer = null;
    });
    return newEventLists.map((events) => {
      var container = this.clone();
      container.events = events;
      return container;
    }, this);
  }

  static mergeIntoLayers(containers) {
    // Sanity check
    if (containers.length === 0) throw new Error('Empty array passed to mergeIntoLayers');
    if (_.uniq(containers.map((c) => { return c.type; })).length !== 1) {
      console.warn('Non-uniform array passed to mergeIntoLayers');
    }
    // Can currently only handle absolute time mode
    _.each(containers, (container) => {
      if (container.eventTimeMode !== 'absolute') {
        throw new Error('mergeIntoLayers can currently only be used with absolute-time containers');
      }
    });
    // TODO: check for existing layers in the passed containers, and preferly do something about them
    // (might be so simple as to call splitByLayers on every container)

    var container = containers[0].clone();
    _.each(container.events, (event) => { event.layer = 0; });
    for (var i = 1; i < containers.length; i++) {
      _.each(containers[i].events, (event) => {
        event.layer = i;    // TODO: this is a destructive operation! Document or handle differently
        container.events.push(event);
      });
    }

    return container;
  }

  // unwrapNotes() {
  //   if (this.eventTimeMode !== 'absolute') {
  //     throw new Error('unwrapNotes can currently only be used with absolute-time containers');
  //   }
  //   if (!this.events) return null;
  //   this.resolve();
  //   let notes = this.findEvents('Note');
  //   _.each(notes, (note) => {
  //     note.position = new Duration({ value: note.cache.absTime, unit: 's'});
  //   });
  //   this.events = notes;
  // }

  // Very Simple Version:
  // - can only handle containers in absolute time mode
  // - the actual Note objects being unwrapped cannot have an explicit [non-zero] position
  // - unwrapping is not recursive, only one level deep (may be a feature though)
  unwrapNotes() {
    if (this.eventTimeMode !== 'absolute') {
      throw new Error('unwrapNotes can currently only be used with absolute-time containers');
    }
    if (!this.events) return null;
    let notes = [];
    this.events = _.filter(this.events, (event) => {
      if (event.events) { // Duck typing
        let single = event.events.length === 1;
        event.events = _.filter(event.events, (child) => {
          if (child instanceof Note) {
            if (child.position && child.position.value !== 0) {
              throw new Error('unwrapNotes can currently not handle notes with explicit position');
            }
            child.position = single ? event.position : new Duration(event.position); // Reuse if possible
            notes.push(child);
            return false;
          }
          return true;
        });
        return event.events.length > 0; // Keep the event if there are sub-events left in it
      }
    });
    this.events = this.events.concat(notes); // Add the extracted notes. TODO: sort by position?
  }

  /**
   * Identify overlapping events (using {@link findOverlappingEvents()}) and
   * assign ther layer slot, so that each event belongs to a non-overlapping layer.
   * Non-overlapping events get their layer slot set to null.
   * NOTE: Currently, no regard is given existing layer assignments; they are just discarded.
   */
  assignOverlapsToLayers() {
    // Reset existing layer assignments
    // TODO: Keep existing layer assignments
    _.each(this.events, (event) => { event.layer = null; });

    // Loop over overlap clusters one by one, as they are guaranteed to be disjoint
    var clusters = this.findOverlappingEvents();
    _.each(clusters, (cluster) => {
      var layers = [];
      _.each(cluster, (event) => {
        // Check if this event fits into an existing layer
        for (var i = 0; i < layers.length; i++) {
          if (event.cache.absTime >= layers[i]) {
            event.layer = i;
            layers[i] = event.cache.endTime;
            return;
          }
        }
        // Doesn't fit in any existing layer, create a new one
        event.layer = layers.length;
        layers.push(event.cache.endTime);
      });
    });
  }

  // Very Simple Version:
  // - can only handle containers in absolute time mode
  // - the actual Note objects being unwrapped cannot have an explicit [non-zero] position
  // - unwrapping is not recursive, only one level deep (may be a feature though)
  wrapNotes() {
    if (this.eventTimeMode !== 'absolute') {
      throw new Error('wrapNotes can currently only be used with absolute-time containers');
    }
    if (!this.events) return null;
    let NoteChord = ItemHandler.getConstructor('NoteChord'); // Can't import NoteChord (circular dependency)
    let noteChords = {}; // map position -> object
    this.events = _.filter(this.events, (note) => {
      if (!(note instanceof Note)) return true; // Keep non-Note items
      let pos = note.position ? note.position.toString() : 'no';
      let dur = note.duration ? note.duration.toString() : 'no';
      let ident = pos + ' ' + dur;
      let noteChord = noteChords[ident];
      if (!noteChord) {
        noteChord = NoteChord.coerce({}); // cannot call new NoteChord(), it is not a function (but why really?)
        noteChord.position = note.position;
        noteChord.duration = note.duration;
        noteChords[ident] = noteChord;
      }
      note.position = null;
      note.duration = null;
      noteChord.events.push(note);
      return false; // Remove the Note from the event list
    });
    // Add the new noteChords. TODO: sort by position?
    this.events = this.events.concat(_.values(noteChords));
  }

  /**
   * Get pitch statistics of descendant notes
   * Return an object with the keys `min`, `max`, `mean` and `median`,
   * representing pitches in `mmel` units.
   * @return {Object}
   */
  getAmbitus() {
    let pitches = this.findEvents('Note').map((note) => {
      return note.pitch.toMmel();
    });
    pitches.sort();
    let count = pitches.length;
    if (!count) return null;
    let median = count % 2
      ? pitches[Math.ceil(count / 2) - 1]  // odd number of elements: take the middle value
      : (pitches[count / 2 - 1] + pitches[count / 2]) / 2; // even number: take the mean of the two middle values
    return {
      min: pitches[0],
      max: pitches[count - 1],
      mean: pitches.reduce((a, b) => { return a + b; }) / count,
      median: median
    };
  }

}
