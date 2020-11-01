import { IKeyword, ScriptUnit, Script } from 'lib/t-script';

class AgentTemplate {
  source: Script;
  constructor() {
    this.source = []; // array of keywordArr source
  }
  /** convert exprStr to keywordArr */
  parseString(exprStr: string): ScriptUnit {
    console.log('convert a string into a keyword array');
    return ['keyword'];
  }
  // convert updata to keywordArr + index
  // this is a UI interface receiving a specific message from the ui
  convertStateToKeywordArr(updata, index) {
    console.log('convert incoming update data to a keyword array');
    return ['keywordArr', index];
  }

  // compile the source to template
  compileTemplate() {
    console.log('compiling this.source to templates');
  }

  // given source, update it
  renderSource() {
    console.log('return sourceJSX');
  }

  updateSource(updata) {
    console.log('update the source through serialize of object');
  }

  //
}
