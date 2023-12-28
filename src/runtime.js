/* This file is attached to every compiled .js file from `glg make`
 */

export class Db {
  constructor(facts) {
    this.facts = facts || [];
    this.listeners = [];
  }

  commit(facts) {
    this.facts = this.facts.concat(facts);

    this._triggerChanges();
  }

  onChange(listener) {
    this.listeners.push(listener);
  }

  _triggerChanges() {
    for (const listener of this.listeners) {
      listener.apply(this);
    }
  }
}
