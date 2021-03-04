
import _ from 'underscore';

/** @ignore */
export default class Env {
  constructor(defaultValues, parent) {
    this.setParent(parent);
    this._values = _.extend({}, defaultValues);
  }

  getParent() {
    return this._parentEnv;
  }

  setParent(parent) {
    if (parent && !(parent instanceof Env)) {
      throw new Error('Parent env must be an instance of the Env class');
    }
    this._parentEnv = parent;
  }

  getValues() {
    return this._values;
  }

  getAllValues() {
    var p = this.getParent();

    if (p) {
      return _.extend({}, this.getValues(), p.getAllValues());
    } else {
      return _.extend({}, this.getValues());
    }
  }

  get(name) {
    if (this.getValues()[name] !== undefined) {
      return this.getValues()[name];
    } else if (this.getParent()) {
      return this.getParent().get(name);
    }
  }

  set(name, value) {
    this._values[name] = value;
  }

  toJSON() {
    return _.mapObject(this._values, (value) => {
      if (_.isObject(value) && value.toJSON) {
        return value.toJSON();
      } else {
        return value;
      }
    });
  }
}
