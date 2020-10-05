But first...let's take a few minutes to look at **Jest**. These notes are a work in progress.

## Basic Installation and Running

```
npm i jest --save-dev
npm i @types/jest --save-dev # to install intellisense autocomplete
jest # run test defined in *.spec.js in __tests__
```

## Example Test

```javascript
describe("Filter function", ()=>{
  test("it should filter a search term (link)", () => {
    // actual test block
    // define inputs
    const input = [
      { id:1, url: "https://link1" },
      { id:2, url: "https://link2" },
      { id:3, url: "https://link3" }
    };
    // define outputs
    const output = [{ id:3, url:"https://link3" }];
    // actual test expression
    expect(filterByTerm(input,"link"))
      .toEqual(output);
  }
});
```

Code Coverage
--

Code coverage is an automated test that sees if all statements in the tested functions are tested for or "covered". It does this through some kind of static analysis I am guessing.
```
npm test -- --coverage 
```
or  you can jest configuration in package.json under "jest" property:
```
package.json
{ 
  ...
  "jest": { 
    collectCoverage: true, 
    coverageReporters ["html"]
  },
  ...
}
```
Alternatively, create a file called `jest.config.js`

```
// jest.config.js
//Sync object
module.exports = {
  collectCoverage: true, 
  coverageReporters ["html"]
};

//Or async function
module.exports = async () => {
  return {
    collectCoverage: true, 
    coverageReporters ["html"]
  };
};
```



## Testing React Components

There is something called `react-testing-library` though the code below uses `react-test-renderer`

```js
import React from "react";
import { create } from "react-test-renderer"; // this is something used in testing

describe("Button component", () => {
  test("it shows the expected text when clicked (testing the wrong way!)", () => {
    const component = create(<Button text="SUBSCRIBE TO BASIC" />);
    const instance = component.getInstance();
    expect(instance.state.text).toBe("");
  });
});
// will fail because Button doesn't exist, so just start adding stuff
// also checking internal state is bad, because we should test what people SEE
// these are called "functional tests" Cypress is used for this. 
// rule of thumb: do not test implemenation for UI components
// check instead what user will see (not internal vars)

jest.spyOn(window,"fetch").mockImplemeation(()=>{});
// replaces window.fetch with mockImplementation that returns what we want
// so we don't have to use external APIs
```

### Snapshot Matching

If you use the `expect(reactnode).toMatchSnapshot()`, jest creates a text snapshot of what was rendered the first time it is run. This is saved in the source code with `.snap` extensions, and commited. However, they're "brittle" since output can change. That said, since the updated snapshots are diffed in the repo on commit, it is useful for **code review**. 

## Reference - Kinds of Matchers

See [expect](https://jestjs.io/docs/en/expect) reference for the various "toBe..." matchers

### Rules of Thumb for Jest

* the `*.spec.js` files are where you can put together your tests
* for a unit test, you would call your unit and provide it with mocked data. The `jest` objects can create many mocked elements like functions, async calls, etc. 
* form: `describe('description', ()=> { test('test descript',()=>{ expect().toBe...} }`
* pattern: `expect(...).toBe()` You can **wrap** your own functions inside of `expect()` as well.

