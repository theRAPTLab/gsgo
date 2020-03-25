/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  A bound value is

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class ValueBinding {
  constructor(key, val) {
    this.key = key;
    this.val = val;
  }

  getValue() {
    return this.val;
  }

  getKey() {
    return this.key;
  }

  setValue(val) {
    this.val = val;
    this.notifyListeners();
  }

  notifyListeners() {
    console.log(`${this.key}=${this.val} notifying listeners if there were any`);
  }
} // class ValueObject

/// MODULE DECLARATION ////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export default ValueBinding;
