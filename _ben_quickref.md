# Daily Startup

`npm start` to run full system.

`npm run gem`


# Style Guide

command-shift-p
Insert Snippet
ur-module-example

# Troubleshoot

List running processes
`ps | grep urdu`
`ps | grep _start.js`



------

/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\
  
    Example of D.Sri's Module Style
    Designed to be more like C# in its lettercasing conventions
  
  
\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

/// es6: import MODULEorCLASS from './module';
///      import { A, B } from './module';
/// cjs: const MODULEorCLASS = require('./module');
///      const { A, B } = require('./module');

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const TYPE_CONSTANT_A = 'A';
let m_collection = [];

/// MODULE HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** jsdoc comment
 *  indent to align with top
 */
function m_Method() {
  // helper functions for the module begin with m_PascalCase within module
  m_collection.push('hello');
  return 'hello';
}

/** An Extended Comment Block *************************************************\

    For in-line documentation or longer explanations of key classes
    No need to add/remove comment prefixes for each line. JUST WRITE.

\*****************************************************************************/

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** jsdoc comment
 *  indent
class MyClass {
  /* for declaring classes, one per file */
  /* remove if you're making a module (see below) */

  constructor() {
    this.propertyZ = 'Z'; // class instance prop declaration
  }

  MyClassMethod() {
    /* _NOT_ following lowercase method conventions because C# */
    m_collection.push(this.propertyZ);
  }
}
// class static declarations
MyClass.StaticMethod = () => {
  /* properties attached to class declaration are class-wide (static) */
  /* and accessible by instances, but can not access instance vars (duh) */
};
MyClass.STATIC_CONSTANT = 'foo';
MyClass.staticProperty = 'bar';

/// PUBLIC METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** jsdoc comment
 *  indent
 */
function PublicA() {}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** jsdoc comment
 *  indent
 */
function PublicB() {}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.HookPhase('MACHINE','PHASE',(...args)=>{
  /* optionally return Promise to hold phase (e.g. asset loading) */
})

/// INITIALIZATION ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// any code that runs when module is loaded
(function(){
  /* use immediately-invoked function express (IIFE) for scope safety */
  /* though you probably don't need to */
})();

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// es6: export default MODULEorCLASS;
///      export { PublicA, PublicB };
/// cjs: module.exports = MODULEorCLASS;
///      module.exports = { A, B };
