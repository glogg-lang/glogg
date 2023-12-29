/* This file is attached to every compiled .js file from `glg make`
 */

export class Db {
  constructor() {
    this.facts = [];
    this.listeners = [];
  }

  commit(facts) {
    const factsToCommit = facts.filter((newFact) => {
      for (const oldFact of this.facts) {
        if (deepEqual(oldFact, newFact)) {
          return false;
        }
      }

      return true;
    });

    if (factsToCommit.length === 0) {
      return;
    }

    this.facts = this.facts.concat(factsToCommit);

    this._triggerChanges();
  }

  onChange(listener) {
    this.listeners.push(listener);
  }

  _triggerChanges() {
    for (const listener of this.listeners) {
      listener.call(this);
    }
  }
}

function deepEqual(left, right) {
  if (left === right) {
    return true;
  }

  if (typeof left !== "object" || typeof right !== "object") {
    return false;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  leftKeys.sort();
  rightKeys.sort();

  for (const key of leftKeys) {
    if (!deepEqual(left[key], right[key])) {
      return false;
    }
  }

  return true;
}
