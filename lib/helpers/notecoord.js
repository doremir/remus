var notes = {
  c: [0, 0],
  d: [1, 2],
  e: [2, 4],
  f: [3, 5],
  g: [4, 7],
  a: [5, 9],
  b: [6, 11],
  h: [6, 11]
};

function notecoord(name) {
  return name in notes ? [notes[name][0], notes[name][1]] : null;
}

notecoord.notes = notes;
notecoord.A4 = [33, 57];
notecoord.sharp = [0, 1];

export default notecoord;