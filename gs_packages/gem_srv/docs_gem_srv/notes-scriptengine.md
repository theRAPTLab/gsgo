create an agent template
```js
// add the agent creation function
AgentFactory.AddTemplate( 'Flower', agent => {
  // 1. define props
  agent.defProp('currentHealth',new GSNumber(100));
  // 2. add features
  agent.addFeature('Movement');
  // 3. set prop values
  agent.prop('x').setTo(10);
  // 4. invoke methods with literal values or prop names
  agent.feature('Movement').setController('student');
  // 5. specify a condition to execute a block or invoke method
  agent
    .if(agent=>agent.prop('x').gt(agent.prop('y'))
    .then(agent=>agent.prop('y').add(1));
});
```

create an agent from a template
```js
const agent = AgentFactory.MakeAgent('Bob The Flower',{type:'Flower'});
```

## Notes on Programming

The tricky part of 5. is that this is not easily scriptable by students. We can
use this kind of code when authoring features.

For students, we need to have something that we can push into a data structure
that is interpreted at runtime.

So we have to define a second language here:

```js
function defProp(prop,GVar,value) {
  // op functions return a current context
  const op = (agent,stack)=>{
    stack.clear();
    stack.push(agent.defProp(prop,new GVar(value)); 
  };
  return op;
}
function addFeature(feature) {
  const op = (agent,stack)=>{
    stack.clear();
    stack.push(agent.addFeature(feature)) // return contet
  };
  return op;
}
function prop(prop) {
  const op = (agent,stack)=>{
    stack.clear();
    stack.push(agent.prop(feature)); // return context
  };
  return op;
}
function feature(feature) {
  const op = (agent,stack) => {
    stack.clear();
    stack.push(agent.feature(feature)); // return context
  };
  return op;
}
function invoke(args) {
  const ref = args.shift();
  const op = (agent,stack)=>{
    const context = stack.pop();
    const result = context[ref](args);
    if (result) stack.push(result);
  };
  return op;
}
// context stack
// value stack
/*/

context push 'prop' 'x' 
result push $ 'lt' 10 
context pop

result pop isTrue
block 

  context push 'prop' 'y'
  result push 'add' 1
  context pop

  context push 'feature 'Movement' 
  'setController' 'student'
  'prop' 'buzz' 'setTo' 12
  context pop

block end
/*/
function if(args) {
  const 
}

function m_GetOp(opkey,...tokens) {
  const f = OPS_TABLE[opkey];
  const op = f(tokens);
  return op;
}

// recursive compile
const compiled = [];
function compile(...tokens) {
  const toks=[...tokens]; // make copy
  while (toks.length>0) {
    const opkey = toks.shift();
    const op = m_GetOp(opkey,toks); // (agent,stack)=>{}
    compiled.push(op);
  }
}

class SMOP {
  constructor(opkey, ...params) {
    this.opkey = opkey;
    // everything must be a literal or obj reference
    this.params = [...params];
    this.op = m_GetOpFunction(opkey,this.params);
  }
  decode(agent,stack) {
    return this.op(agent,stack);
  }
}

const template = AgentFactory.AddTemplate('Flower');
// 1. define props
template.op(new SMOP('defProp','currentHealth',GSNumber,100);
// 2. add features
template.op(new SMOP('addFeature','Movement'));
// 3. set prop values
template.op(new SMOP('prop','currentHealth','setTo',100));
// 4. invoke methods with literal values of prop names
template.op(new SMOP('feature','Movement');
template.op(new SMOP('invoke','setController','student'); // chained
// 5. specify a condition to execute a block of code or invoke method
template.op(new SMOP('if','prop','currentHealth','eq',10));
```
How does this look in terms of running?
``` js
const stack = [];
const program = [...];
function run () {
  let i = 0;
  while (i<program.length) {
    const op = program[i];
    if (op.decode(agent,stack)) i++;
  }
}
```


## DEFINITIONS OF TERMS

I designed the stack machine opcodes in this [spreadsheet](https://docs.google.com/spreadsheets/d/1jLPHsRAsP65oHNrtxJOpEgP6zbS1xERLEz9B0SC5CTo/edit#gid=934723724).

```js
// program runner
function run(agent, program) {
  const stack=[];
  const scope=[];
  const flags={};
  const mem = { agent, stack, scope, flags };
  program.forEach(op=>op(mem));
}

// opfunction for CALL METHOD with return values on stack
// scoped!
const CALL = (methodName,...args) => {
  return (mem) => {
    const scope = mem.scope();
    mem.stackPush(...args);
		scope.method(methodName)(mem.stack);
  };
}
// opfunction for retrieving a property on stack
// scoped!
const PROP = (propName) => {
  return (mem) => {
    const scope=mem.scope();
    mem.push(scope.prop(propName));
  };
}



```

