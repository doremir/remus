var accidentalValues = {
  'bb': -2,
  'b': -1,
  '': 0,
  '#': 1,
  'x': 2
};

function accidentalNumber(accidental) {
  return accidentalValues[accidental];
}

accidentalNumber.interval = function(accidental) {
  var value = accidentalValues[accidental];
  return [0, value];
};

export default accidentalNumber;