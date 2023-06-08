
// import chalk from 'chalk';
import _ from 'underscore';

var isArray = _.isArray;

function isNumber(value) {
  return typeof value === 'number' && (value === +value); // || toString.call(value) === numberClass;
}

function isInteger(value) {
  return isNumber(value) && ((value % 1) === 0);
}

/** @ignore */
class Validator {
  constructor(verbose) {
    this.errors = [];
    this.verbose = verbose || 0;
  }

  toString() {
    if (this.errors.length) {
      return this.errors.length + ' errors';
    } else {
      return 'OK';
    }
  }

  log() {
    if (this.errors.length) {
      var isNode = process.title === 'node'; // TODO: better check
      // console.log(chalk.red.bold(this.errors.length + ' errors'));
      this.errors.forEach(function(e) {
        console.warn(isNode ? e.obj.className : e.obj, e.text);
      });
    } else {
      // console.log(chalk.green('No errors'));
    }
    return this.errors.length + ' errors';
  }

  //

  satisfies(obj, place, test, errorStr) {
    if (test.call(obj.place)) return;
    if (errorStr === undefined) errorStr = place + ' does not satisfy ' + test.toString();
    this.errors.push({obj: obj, text: errorStr});
  }

  hasType(obj, place, type) {
    if (obj[place] instanceof type) return;
    this.errors.push({obj: obj, text: place + ' is not of type ' + type.name});
  }

  hasTypeOrNull(obj, place, type) {
    if (obj[place] === null || obj[place] === undefined) return;
    if (obj[place] instanceof type) return;
    this.errors.push({obj: obj, text: place + ' is neither null nor of type ' + type.name});
  }

  isNull(obj, place) {
    if (obj[place] === null || obj[place] === undefined) return;
    this.errors.push({obj: obj, text: place + ' is not null'});
  }

  isDefined(obj, place) {
    if (obj[place] !== undefined) return;
    this.errors.push({obj: obj, text: place + ' is undefined'});
  }

  isUndefined(obj, place) {
    if (obj[place] === undefined) return;
    this.errors.push({obj: obj, text: place + ' is defined'});
  }

  isNumber(obj, place, min, max) {
    if (!isNumber(obj[place])) {
      this.errors.push({obj: obj, text: place + ' is not a number'});
    } else if (isNumber(min) && obj[place] < min) {
      this.errors.push({obj: obj, text: place + ' is too small'});
    } else if (isNumber(max) && obj[place] > max) {
      this.errors.push({obj: obj, text: place + ' is too big'});
    }
  }

  isIntegerOrNull(obj, place, min, max) {
    if (obj[place] !== null && !isInteger(obj[place])) {
      this.errors.push({obj: obj, text: place + ' is not an integer or null'});
    } else if (isNumber(min) && obj[place] < min) {
      this.errors.push({obj: obj, text: place + ' is too small'});
    } else if (isNumber(max) && obj[place] > max) {
      this.errors.push({obj: obj, text: place + ' is too big'});
    }
  }

  isInteger(obj, place, min, max) {
    if (!isInteger(obj[place])) {
      this.errors.push({obj: obj, text: place + ' is not an integer'});
    } else if (isNumber(min) && obj[place] < min) {
      this.errors.push({obj: obj, text: place + ' is too small'});
    } else if (isNumber(max) && obj[place] > max) {
      this.errors.push({obj: obj, text: place + ' is too big'});
    }
  }

  isPositiveInteger(obj, place) {
    this.isInteger(obj, place, 1);
  }

  isBoolean(obj, place) {
    if (obj[place] === true || obj[place] === false) return;
    this.errors.push({obj: obj, text: place + ' is not a boolean'});
  }

  isOneOf(obj, place, list) {
    if (list.indexOf(obj[place]) < 0) {
      this.errors.push({obj: obj, text: place + ' is not one of ' + list});
    }
  }

  isArray(obj, place, test, testDescription) {
    if (!isArray(obj[place])) {
      this.errors.push({obj: obj, text: place + ' is not an array'});
    }
    if (test && !obj[place].every(test)) {
      this.errors.push({obj: obj, text: place + ' contains non-conforming elements'});
    }
  }

  isArrayOfIntegers(obj, place, nullOk) {
    if (nullOk && obj[place] === null) return;
    if (!isArray(obj[place])) {
      this.errors.push({obj: obj, text: place + ' is not an array'});
    } else if (!obj[place].every(isInteger)) {
      this.errors.push({obj: obj, text: place + ' contains non-integers'});
    }
  }

  onlyOneOf(obj) {
    var defined = 0;
    var places = [];
    for (var a = 1; a < arguments.length; a++) {
      var place = arguments[a];
      places.push(place);
      var value = obj[place];
      if (!(value === null || value === undefined)) defined++;
    }
    if (defined > 1) {
      this.errors.push({obj: obj, text: 'More than one of [' + places.join(', ') + '] is defined'});
    }
  }
}

export default Validator;
