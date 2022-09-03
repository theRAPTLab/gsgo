/* eslint-disable max-classes-per-file */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  implementation of keyword "ifProp" command object

      `ifProp Fish.energyLevel gt 0 [[ ... ]]`
      `ifProp Fish.name eq 'Wanda' [[ ... ]]`

  SPECIAL HACK supports comparison to a prop value:

      `ifProp Fish.energyLevel gt Fish.threshold [[ ... ]]`

  ...but there is no GUI support for entering or modifying this
  ...and it will display as an error in the wizard.

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import Keyword, { K_DerefProp } from 'lib/class-keyword';
import * as SIMDATA from 'modules/datacore/dc-sim-data';
import SM_Object from 'lib/class-sm-object';

/// CLASS DEFINITION //////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export class ifProp extends Keyword {
  // base properties defined in KeywordDef
  constructor() {
    super('ifProp');
    this.args = [
      'prop:objref',
      'method:method',
      'methodArgs:{...}',
      'consequent:block',
      'alternate:block'
    ];
  }
  /** create smc blueprint code objects */
  compile(unit: TKWArguments): TOpcode[] {
    const [kw, objref, methodName, arg, consq, alter] = unit;
    const deref = K_DerefProp(objref);

    const code = [];
    code.push((agent, state) => {
      // `conditionTest` is the result of the <prop><method><arg> call
      const conditionTest = () => {
        const p = deref(agent, state.ctx);
        let comparator;
        // HACK: Allow comparisons to props e.g.
        //   `ifProp agent.energyLevel gt agent.threshold [[ ... ]]`
        // `arg` is normally a value, e.g. '10' or 'foo'
        // But we want to support comparisons agains props,
        // so we check if arg is an object reference.  If it is,
        // we derefence it and get its value.
        if (typeof arg === 'object') {
          const argfn = K_DerefProp(arg);
          const argresult = argfn(agent, state.ctx);
          if (argresult instanceof SM_Object) {
            comparator = argresult.value;
          } else {
            console.error('Unknown argument type:', argresult);
          }
        } else {
          comparator = arg;
        }
        if (p && p[methodName as string])
          return p[methodName as string](comparator);
      };
      const vals = conditionTest().value;
      const result = this.utilFirstValue(vals);
      if (result && consq) agent.exec(consq, state.ctx);
      if (!result && alter) agent.exec(alter, state.ctx);
    });
    return code;
  }

  /** custom keyword validator */
  validate(unit: TScriptUnit): TValidatedScriptUnit {
    const [kwTok, objrefTok, methodTok, argToks, cnsTok, altTok] = unit;
    const vtoks = [];
    vtoks.push(this.shelper.anyKeyword(kwTok));
    vtoks.push(this.shelper.agentObjRef(objrefTok)); // agent.propName, propName, Blueprint.propName
    vtoks.push(this.shelper.methodName(methodTok));
    vtoks.push(...this.shelper.argsList([argToks]));
    const vlog = this.makeValidationLog(vtoks);
    return { validationTokens: vtoks, validationLog: vlog };
  }
} // end of keyword definition

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// see above for keyword export
SIMDATA.RegisterKeyword(ifProp);
