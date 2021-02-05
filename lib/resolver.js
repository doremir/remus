// import Tempo from './classes/tempo.js';

import misc from './misc.js';
import Duration from './classes/duration.js';
import Fraction from 'fraction.js';

export function createState(item, globals) {
  var state = {
    tempo: item.cache.tempo || getPrevGlobal(item.cache.absTime, globals, 'Tempo', true),
    time: item.cache.time || getPrevGlobal(item.cache.absTime, globals, 'Time', true), // || {beats: [1, 1, 1, 1], denom: 4},
    key: item.cache.key || getPrevGlobal(item.cache.absTime, globals, 'Key', true),
    scale: item.parent ? item.parent.cache.scale : new Fraction(1),
    absWn: item.cache.absWn,
    absTime: item.cache.absTime,
    item: item // for debugging
  };
  if (!state.tempo) {
    if (state.parent) console.warn('createState could not find tempo for ', item, globals);
    // console.warn("... ", getNextGlobal(0, globals, "Tempo", false));
    // console.warn("... ", getNextGlobal(0, globals, "Tempo", true));
  }
  state.sPerWn = state.tempo ? state.tempo.sPerWn() : null;
  return state;
}

// function copyState(state, except) {
//   var copy = {};
//   Object.keys(state).forEach(function(key) {
//     if (!except || except.indexOf(key) < 0) copy[key] = state[key];
//   });
//   return copy;
// }

function getNextGlobal(absTime, globals, type, inclusive) {
  var pos = 0;
  if (inclusive) {
    while (globals[pos] && ((globals[pos].cache.absTime < absTime) || (type && !(globals[pos].type === type)))) pos++;
  } else {
    while (globals[pos] && ((globals[pos].cache.absTime <= absTime) || (type && !(globals[pos].type === type)))) pos++;
  }
  return globals[pos];
}

function getPrevGlobal(absTime, globals, type, inclusive) {
  var pos = globals.length - 1;
  if (inclusive) {
    while (globals[pos] && ((globals[pos].cache.absTime > absTime) || (type && !(globals[pos].type === type)))) pos--;
  } else {
    while (globals[pos] && ((globals[pos].cache.absTime >= absTime) || (type && !(globals[pos].type === type)))) pos--;
  }
  return globals[pos];
}

export function updateState(state, meta) {
  // console.log("UpdateState! ", state, meta);
  switch (meta.type) {
    case 'Tempo':
      state.tempo = meta;
      state.sPerWn = meta.sPerWn();
      // console.log("At " + state.absWn + " Tempo is now " + meta.bpm + "BPM, sPerWn = " + state.sPerWn);
      break;
    case 'Time':
      state.time = meta;
      break;
    case 'Key':
      state.key = meta;
      break;
  }
}

// Update state with globals found at the current position
// TODO: make more efficient
export function maybeUpdateState(state, globals) {
  for (var i = 0; i < globals.length; i++) {
    var g = globals[i];
    if (g.cache.absTime.equals(state.absTime)) {
      updateState(state, g);
    }
  }
}

export function stepState(state, duration, globals) {
  if (!duration) return;
  if (duration.isZero()) return;
  if (!state.tempo) {
    // console.warn("CANNOT STEP: duration: ", duration, "state: ", state);
    throw Error('Cannot step without a tempo!');
  }
  if (duration.value < 0) return stepStateBw(state, duration, globals);
  return stepStateFw(state, duration, globals);
}

function stepStateFw(state, duration, globals) {
  var s;
  var rest;
  var step;

  if (!duration.isTime) console.log('Duration is ', duration, ' in stepStateFw'); // if duration is not a Duration object
  if (duration.isTime()) {
    s = state.scale.mul(duration.toSeconds());
    var nextTempo = getNextGlobal(state.absTime, globals, 'Tempo');
    if (!nextTempo || (nextTempo.cache.absTime > (state.absTime + s))) {
      // Simple step
      state.absTime = state.absTime.add(s);
      state.absWn = state.absWn.add(new Fraction(s, state.sPerWn));
    } else {
      // Step to next tempo change
      step = nextTempo.cache.absTime.sub(state.absTime);
      state.absTime = nextTempo.cache.absTime; // avoid precision error
      state.absWn = state.absWn.add(new Fraction(step, state.sPerWn));
      maybeUpdateState(state, globals);
      // Call recursively with resting duration
      rest = s.sub(step);
      if (rest > 0) {
        stepState(state, Duration.coerce({value: rest, unit: 's'}), globals);
      }
    }
  } else {
    var wn;
    switch (duration.unit) {
      case 'wn': wn = duration.value; break;
      case 'beats': wn = wnPerBeat(state).mul(duration.value); break;
      case 'measures': wn = wnPerMeasure(state).mul(duration.value); break;
      default:
        console.log('Bad duration unit: ', duration.unit);
        throw Error('Bad duration unit: ' + duration.unit);
    }
    wn = state.scale.mul(wn);

    var nextGlobal = getNextGlobal(state.absTime, globals);
    s = wn.mul(state.sPerWn);
    // if (nextGlobal) console.log('nextGlobal: ', nextGlobal.type, nextGlobal.cache.absTime, 'state.absTime: ', state.absTime, 's: ', s);
    if (!nextGlobal || (nextGlobal.cache.absTime > (state.absTime.add(s)))) {
      // Simple step
      // console.log('simple step', wn);
      state.absTime = state.absTime.add(wn.mul(state.sPerWn));
      state.absWn = state.absWn.add(wn);
    } else {
      // Step to next global
      step = nextGlobal.cache.absWn.sub(state.absWn);
      // console.log('split step', wn.valueOf(), step.valueOf(), state.absWn.valueOf(), nextGlobal.cache.absWn.valueOf());
      state.absTime = state.absTime.add(step.mul(state.sPerWn));
      state.absWn = nextGlobal.cache.absWn; // avoid precision error
      maybeUpdateState(state, globals);
      // Call recursively with resting duration
      rest = wn.sub(step);
      // console.log("rest is " + rest.valueOf());
      if (rest > 0) {
        stepState(state, Duration.coerce({value: rest, unit: 'wn'}), globals);
      }
    }
  }
}

function stepStateBw(state, duration, globals) {
  var rest;
  var step;
  var s;

  if (!duration.isTime) console.log('Duration is ', duration, ' in stepStateBw'); // if duration is not a Duration object
  if (duration.isTime()) {
    s = state.mul.scale(duration.toSeconds());
    var prevTempo = getPrevGlobal(state.absTime, globals, 'Tempo');
    if (!prevTempo || (prevTempo.cache.absTime < (state.absTime.add(s)))) {
      // Simple step
      state.absTime = state.absTime.add(s); // duration is negative
      state.absWn = state.absWn.add(s.div(state.sPerWn));
    } else {
      // Step to next tempo change
      step = prevTempo.cache.absTime.sub(state.absTime);
      state.absTime = prevTempo.cache.absTime; // avoid precision error
      state.absWn = state.absWn.add(step.div(state.sPerWn));
      maybeUpdateState(state, globals); // TODO!!
      // Call recursively with resting duration
      rest = s.sub(step);
      if (rest < 0) {
        stepState(state, Duration.coerce({value: rest, unit: 's'}), globals);
      }
    }
  } else {
    var a;
    switch (duration.unit) {
      case 'wn': a = duration.value; break;
      case 'beats': a = wnPerBeat(state).mul(duration.value); break;
      case 'measures': a = wnPerMeasure(state).mul(duration.value); break;
      default:
        console.log('Bad duration unit: ' + duration.unit);
        throw Error('Bad duration unit: ' + duration.unit);
    }
    a = state.scale.mul(a);

    var prevGlobal = getPrevGlobal(state.absTime, globals);
    s = a.mul(state.sPerWn);
    // if (prevGlobal) console.log('prevGlobal: ', prevGlobal.type, prevGlobal.cache.absTime, 'state.absTime: ', state.absTime, 's: ', s);
    if (!prevGlobal || (prevGlobal.cache.absTime < (state.absTime.add(s)))) {
      // Simple step
      // console.log('simple step', a);
      state.absTime = state.absTime.add((new Fraction(a)).mul(state.sPerWn));
      state.absWn = state.absWn.add(a);
    } else {
      // Step to next global
      step = prevGlobal.cache.absWn.sub(state.absWn);
      console.log('split step', a, step, state.absWn, prevGlobal.cache.absWn);
      state.absTime = state.absTime.add(step.mul(state.sPerWn));
      state.absWn = prevGlobal.cache.absWn; // avoid precision error
      maybeUpdateState(state, globals); // TODO!
      // Call recursively with resting duration
      rest = a.sub(step);
      if (rest < 0) {
        stepState(state, Duration.coerce({value: rest, unit: 'wn'}), globals);
      }
    }
  }
}

// temp
function wnPerBeat(state) {
  return new Fraction(state.time.beats[0], state.time.denom);
}

function wnPerMeasure(state) {
  return new Fraction(misc.sumArray(state.time.beats), state.time.denom);
}

// import misc from './misc.js';
// import _ from 'underscore';
// import Duration from './classes/duration.js';
// import VerticalContainer from './classes/vertical-container.js';
// import Song from './classes/song.js';
// import Voice from './classes/voice.js';
// import Tempo from './classes/tempo.js';
// import Fraction from 'fraction.js';

// function setParents(item) {
//   var children = item.events ? item.events.slice(0) : [];
//   if (!item.cache) item.cache = {};
//   // Make sure master objects come first
//   // TODO: Sorting in Chrome (and Opera) is not stable,
//   // so we can't do sorting this way
// //   children.sort(function(a, b) {
// //     if (a.master) return -1;
// //     if (b.master) return 1;
// //     return 0;
// //   });
//   item.cache.children = children;
//   item.cache.enabled = item.parent ? !!(item.parent.cache.enabled && item.enabled) : !!item.enabled;
//   item.cache.amp = _.isNumber(item.amp) ? item.amp : (item.parent ? item.parent.cache.amp : 1.0);
//   var no = 0;
//   children.forEach(function(child) {
//     // child.parent = item;
//     setParents(child);
//     child.cache.no = no++;
//   });
// }

// function copyState(state, except) {
//   var copy = {};
//   Object.keys(state).forEach(function(key) {
//     if (!except || except.indexOf(key) < 0) copy[key] = state[key];
//   });
//   return copy;
// }

// function getNextGlobal(absTime, globals, type) {
//   var pos = 0;
//   while (globals[pos] && ((globals[pos].cache.absTime <= absTime) || (type && !(globals[pos].type === type)))) pos++;
//   return globals[pos];
// }

// function getPrevGlobal(absTime, globals, type) {
//   var pos = globals.length - 1;
//   while (globals[pos] && ((globals[pos].cache.absTime >= absTime) || (type && !(globals[pos].type === type)))) pos--;
//   return globals[pos];
// }

// // Update state with globals found at the current position
// // TODO: make more efficient
// function updateState(state, globals) {
//   for (var i = 0; i < globals.length; i++) {
//     var g = globals[i];
//     if (g.cache.absTime === state.absTime) {
//       switch (g.type) {
//         case 'Tempo':
//           state.tempo = g;
//           state.sPerWn = g.sPerWn();
//           break;
//         case 'Time':
//           state.time = g;
//           break;
//       }
//     }
//   }
// }

// function stepState(state, duration, globals) {
//   // console.log('stepState: ' + duration);
//   if (!duration) return;
//   if (duration.absolute) { // duration may actually be a Position
//     // Absolute position
//     throw Error('TODO: Absolute position');
//   } else {
//     // Relative position
//     if (duration.isZero()) return;
//     if (duration.value < 0) return stepStateBw(state, duration, globals);
//     return stepStateFw(state, duration, globals);
//   }
// }

// function stepStateFw(state, duration, globals) {
//   var s;
//   var rest;
//   var step;

//   if (!duration.isTime) console.log('Duration is ', duration, ' in stepStateFw'); // if duration is not a Duration object
//   if (duration.isTime()) {
//     s = duration.toFloatSeconds();
//     var nextTempo = getNextGlobal(state.absTime, globals, 'Tempo');
//     if (!nextTempo || (nextTempo.cache.absTime > (state.absTime + s))) {
//       // Simple step
//       state.absTime += s;
//       state.absWn += s / state.sPerWn;
//     } else {
//       // Step to next tempo change
//       step = nextTempo.cache.absTime - state.absTime;
//       state.absTime = nextTempo.cache.absTime; // avoid precision error
//       state.absWn += step / state.sPerWn;
//       updateState(state, globals);
//       // Call recursively with resting duration
//       rest = s - step;
//       if (rest > 0) {
//         stepState(state, Duration.coerce({num: rest, unit: 's'}), globals);
//       }
//     }
//   } else {
//     var a;
//     switch (duration.unit) {
//       case 'wn': a = duration.toFloat(); break;
//       case 'beats': a = wnPerBeat(state) * duration.toFloat(); break;
//       case 'measures': a = wnPerMeasure(state) * duration.toFloat(); break;
//       default:
//         console.log('Bad duration unit: ' + duration.unit);
//         throw Error('Bad duration unit: ' + duration.unit);
//     }

//     var nextGlobal = getNextGlobal(state.absTime, globals);
//     s = a * state.sPerWn;
//     if (nextGlobal) console.log('nextGlobal: ', nextGlobal.type, nextGlobal.cache.absTime, 'state.absTime: ', state.absTime, 's: ', s);
//     if (!nextGlobal || (nextGlobal.cache.absTime > (state.absTime + s))) {
//       // Simple step
//       // console.log('simple step', a);
//       state.absTime += a * state.sPerWn;
//       state.absWn += a;
//     } else {
//       // Step to next global
//       step = nextGlobal.cache.absWn - state.absWn;
//       console.log('split step', a, step, state.absWn, nextGlobal.cache.absWn);
//       state.absTime += step * state.sPerWn;
//       state.absWn = nextGlobal.cache.absWn; // avoid precision error
//       updateState(state, globals);
//       // Call recursively with resting duration
//       rest = a - step;
//       if (rest > 0) {
//         stepState(state, Duration.coerce({num: rest, unit: 'wn'}), globals);
//       }
//     }
//   }
// }

// function stepStateBw(state, duration, globals) {
//   var rest;
//   var step;
//   var s;

//   if (!duration.isTime) console.log('Duration is ', duration, ' in stepStateBw'); // if duration is not a Duration object
//   if (duration.isTime()) {
//     s = duration.toFloatSeconds();
//     var prevTempo = getPrevGlobal(state.absTime, globals, 'Tempo');
//     if (!prevTempo || (prevTempo.cache.absTime < (state.absTime + s))) {
//       // Simple step
//       state.absTime += s; // duration is negative
//       state.absWn += s / state.sPerWn;
//     } else {
//       // Step to next tempo change
//       step = prevTempo.cache.absTime - state.absTime;
//       state.absTime = nextTempo.cache.absTime; // avoid precision error
//       state.absWn += step / state.sPerWn;
//       updateState(state, globals); // TODO!!
//       // Call recursively with resting duration
//       rest = s - step;
//       if (rest < 0) {
//         stepState(state, Duration.coerce({num: rest, unit: 's'}), globals);
//       }
//     }
//   } else {
//     var a;
//     switch (duration.unit) {
//       case 'wn': a = duration.toFloat(); break;
//       case 'beats': a = wnPerBeat(state) * duration.toFloat(); break;
//       case 'measures': a = wnPerMeasure(state) * duration.toFloat(); break;
//       default:
//         console.log('Bad duration unit: ' + duration.unit);
//         throw Error('Bad duration unit: ' + duration.unit);
//     }

//     var prevGlobal = getPrevGlobal(state.absTime, globals);
//     s = a * state.sPerWn;
//     if (prevGlobal) console.log('prevGlobal: ', prevGlobal.type, prevGlobal.cache.absTime, 'state.absTime: ', state.absTime, 's: ', s);
//     if (!prevGlobal || (prevGlobal.cache.absTime < (state.absTime + s))) {
//       // Simple step
//       // console.log('simple step', a);
//       state.absTime += a * state.sPerWn;
//       state.absWn += a;
//     } else {
//       // Step to next global
//       step = prevGlobal.cache.absWn - state.absWn;
//       console.log('split step', a, step, state.absWn, prevGlobal.cache.absWn);
//       state.absTime += step * state.sPerWn;
//       state.absWn = prevGlobal.cache.absWn; // avoid precision error
//       updateState(state, globals); // TODO!
//       // Call recursively with resting duration
//       rest = a - step;
//       if (rest < 0) {
//         stepState(state, Duration.coerce({num: rest, unit: 'wn'}), globals);
//       }
//     }
//   }
// }

// // function sPerWn(tempo) {
// //   return 60 / (tempo.bpm * tempo.beat); // TODO: use fraction
// // }

// // temp
// function wnPerBeat(state) {
//   return new Fraction(state.time.beats[0], state.time.denom);
// }

// function wnPerMeasure(state) {
//   return new Fraction(misc.sumArray(state.time.beats), state.time.denom);
// }

// function resolveGlobals(item, state, globals) {
//   var oldState = copyState(state);
//   item.cache.children.forEach(function(child) {
//     if ((item instanceof VerticalContainer) || (item instanceof Song)) {
//       state = copyState(oldState);
//       // throw new Error('VerticalContainer cannot currently contain globals');
//     }
//     if (child.position && child.position.absolute) {
//       if (!child.position.isTime()) console.log('Warning: absolute position is only supported for time units');
//       state = copyState(oldState);
//       stepState(state, child.position, globals);
//       // throw new Error('Absolute positioning of globals not supported');
//     } else if (child.position) {
//       stepState(state, child.position, globals);
//     }

//     switch (child.type) {
//       case 'Time':
//         globals.push(child);
//         state.time = child;
//         state.sPerWn = state.tempo.sPerWn();
//         console.log(state.absWn, state.absTime, 'At Time, new sPerWn: ', state.sPerWn);
//         break;
//       case 'Tempo':
//         globals.push(child);
//         state.tempo = child;
//         state.sPerWn = state.tempo.sPerWn();
//         console.log(state.absWn, state.absTime, 'At Tempo, new sPerWn: ', state.sPerWn);
//         break;
//     }
//     child.cache.absWn = state.absWn;
//     child.cache.absTime = state.absTime;

//     resolveGlobals(child, state, globals);
//   });
//   state = oldState;
// }

// function resolveItem(item, state, globals, result) {
//   var oldState = copyState(state);
//   var maxEndTime = 0;
//   var maxEndWn = 0;

//   // Calculate left trim
//   if (item.trimLeft && !item.trimLeft.isZero()) {
//     stepState(state, item.trimLeft, globals);
//     item.cache.trimmedStartWn = state.absWn;
//     item.cache.trimmedStartTime = state.absTime;
//     state = copyState(oldState);
//   }

//   item.cache.children.forEach(function(child) {
//     // console.log('-- ', child.type, state.tempo, state.time);

//     if ((item instanceof VerticalContainer) || (item instanceof Song)) { // item.type === 'VerticalContainer' || item.type === 'NoteChord') {
//       state = copyState(oldState);
//     }
//     if (child.position && child.position.absolute) {
//       if (!child.position.isTime()) console.log('Warning: absolute position is only supported for time units');
//       state = copyState(oldState);
//       stepState(state, child.position, globals);
//     } else if (child.position) {
//       stepState(state, child.position, globals);
//     }

//     var absWn = state.absWn;
//     var absTime = state.absTime;
//     child.cache.absWn = absWn;
//     child.cache.absTime = absTime;

//     resolveItem(child, state, globals, result);

//     // If child has an explicit duration, use it
//     if (child.duration) {
//       stepState(state, child.duration, globals);
//     } else if (child.cache.maxChildEndTime) {
//     // Otherwise, check if child has a duration derived from its children
//       var diff = child.cache.maxChildEndTime - state.absTime;
//       stepState(state, Duration.coerce({num: diff, unit: 's'}), globals);
//     } else if (item.duration && ((item instanceof VerticalContainer) || (item instanceof Song))) {
//       // If the child still doesn't have a duration, expand children of VerticalContainer
//       // (including inherited classes, such as NoteChord) to the duration of the parent
//       stepState(state, item.duration, globals);
//     }
//     var endWn = state.absWn;
//     var endTime = state.absTime;
//     child.cache.endWn = endWn;
//     child.cache.endTime = endTime;
//     if (endTime > maxEndTime) maxEndTime = endTime;
//     if (endWn > maxEndWn) maxEndWn = endWn;

//     result.push({absWn: absWn, absTime: absTime, endWn: endWn, endTime: endTime, event: child});
//   });

//   // Calculate right trim
//   // TODO: Are we in the right position (i.e. the end of the current event) here?
//   if (item.trimRight && !item.trimRight.isZero()) {
//     stepState(state, item.trimRight.inverse(), globals);
//     item.cache.trimmedEndWn = state.absWn;
//     item.cache.trimmedEndTime = state.absTime;
//   }

//   state = oldState;
//   if (!item.duration && maxEndTime) {
//     item.cache.maxChildEndTime = maxEndTime;
//     // item.cache.endTime = maxEndTime;
//     // item.cache.endWn = maxEndWn;
//   }
// }

// function propagateTrim(item) {
//   // Left trim
//   if (item.parent && (item.parent.cache.trimmedStartTime !== undefined)) {
//     if ((item.cache.trimmedStartTime === undefined) || (item.cache.trimmedStartTime < item.parent.cache.trimmedStartTime)) {
//       item.cache.trimmedStartTime = item.parent.cache.trimmedStartTime;
//       item.cache.trimmedStartWn = item.parent.cache.trimmedStartWn;
//     }
//   }

//   // Right trim
//   if (item.parent && (item.parent.cache.trimmedEndTime !== undefined)) {
//     if ((item.cache.trimmedEndTime === undefined) || (item.cache.trimmedEndTime > item.parent.cache.trimmedEndTime)) {
//       item.cache.trimmedEndTime = item.parent.cache.trimmedEndTime;
//       item.cache.trimmedEndWn = item.parent.cache.trimmedEndWn;
//     }
//   }

//   // Set trimmedStart and trimmedEnd
//   if ((item.cache.trimmedStartTime !== undefined) && (item.cache.absTime < item.cache.trimmedStartTime)) {
//     item.cache.trimmedStart = true;
//     item.cache.skip = (item.cache.trimmedStartTime > item.cache.absTime) ? (item.cache.trimmedStartTime - item.cache.absTime) : 0;
//     // TEMPORARY:
//     // Set enabled to false for Notes or NoteChords that have a trimmed start
//     if (((item.type === 'Note') || (item.type === 'NoteChord')) && (item.cache.skip > 0)) item.cache.enabled = false;
//   }
//   if ((item.cache.trimmedEndTime !== undefined) && item.cache.absTime > item.cache.trimmedEndTime) {
//     item.cache.trimmedStart = true;
//     if ((item.type === 'Note') || (item.type === 'NoteChord')) item.cache.enabled = false;
//   }

//   // Propagate to children
//   if (item.cache.children) {
//     item.cache.children.forEach(function(child) {
//       propagateTrim(child);
//     });
//   }
// }

// export default {
//   resolve: function(item) {
//     // Set parents
//     setParents(item);

//     // Resolve time
//     var globals = [];
//     var state = {
//       tempo: new Tempo({bpm: 120, beat: 1 / 4}),
//       time: {beats: [1, 1, 1, 1], denom: 4},
//       sPerWn: 2,
//       absWn: 0,
//       absTime: 0
//     };
//     resolveGlobals(item, state, globals);
//     var firstTempo = _.find(globals, (x) => { return x.type === 'Tempo'; }) || new Tempo({ bpm: 120, beat: 1 / 4 });
//     var firstTime = _.find(globals, (x) => { return x.type === 'Time'; }) || { beats: [1, 1, 1, 1], denom: 4 };
//     // console.log('firstTempo: ', firstTempo, '  sPerWn: ', sPerWn(firstTempo));
//     console.log('----- Resolving items ------');
//     // Resolve time
//     var result = [];
//     state = {
//       tempo: firstTempo,
//       time: firstTime,
//       sPerWn: firstTempo.sPerWn(),
//       absWn: 0,
//       absTime: 0
//     };
//     resolveItem(item, state, globals, result);
//     if (!item.cache.absTime) {
//       item.cache.absTime = 0;
//       item.cache.absWn = 0;
//     }
//     propagateTrim(item);
//     // console.log('State:   ', state);
//     console.log('Globals:');
//     globals.forEach(function(g) {
//       console.log(g.cache.absWn, g.cache.absTime, g);
//     });
//     var items = result.sort(function(a, b) {
//       return a.absTime - b.absTime;
//     });
//     var voices = _.filter(items, (x) => { return x.event instanceof Voice; });
//     var programChanges = [];
//     voices.forEach((v) => {
//       var voice = v.event;
//       // console.log('ok voice: ', voice);
//       if (voice.sound && voice.cache.enabled) {
//         programChanges.push({
//           absWn: voice.cache.absWn,
//           absTime: voice.cache.absTime,
//           sound: voice.sound,
//           channel: voice.channel
//         });
//       }
//     });

//     return {
//       startTempo: firstTempo,
//       voices: voices,
//       programChanges: programChanges,
//       events: items
//     };
//   }
// };

