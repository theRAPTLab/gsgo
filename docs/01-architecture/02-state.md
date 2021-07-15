# Managing state

As I develop the GEMSTEP simulation interface I'm struck by all the kinds of state we have, and how it affects the overall user experience.

* Application Lifecycle
* Game Lifecycle
* Agent Behaviors
* Referee Evaluate
* SimState Evaluate 

Each of these have:

* a "current state"
* a selection of possible "next states"
* an associated "scope"
* "scope properties" that can be inspected
* "conditions" that are truthy or falsey
* "triggers" that test conditions to potentially emit a "next state"

These are different kinds of data. I've attempted to describe the differences in [modularity](./02-modularity.md).

# 1. Application State and APPCORE Modules

The general idea is that there are **state groups** like "locale", "devices", and so forth. Within each state group, there are a number of **keys** that can either hold a **value** like string, number, array, OR an **object** with its own **props**. 

### Creating StateGroups inside Appcore Modules

To create these state groups, you create a new instance of the StateGroupMgr it an an "appcore module", which is loaded much like datacore modules are through a main index in `modules/appcore/`

```js
// in appcore/ac-locales.js
// imported by appcore/index.js

const STATE = new StateGroupMgr('locales');
STATE.InitializeState({
  locales: [],      // key is named locales with value array
  localeNames: [],  // key is named localeNames with value array
  localeId: 0,      // key is named localeId with value number
  transform: {      // key is named transform and has object with props
    xRange: -99,    // prop xRange with value number
    yRange: -99,
    xOff: -99,
    yOff: -99,
    xScale: -99,
    yScale: -99,
    zRot: -99
});
```

The `InitializeState()` call not only creates initiate state, but also defines **what keys are considered valid**; the StateGroupMgr will not allow you to modify keys that doesn't already exist, and will display a warning in the console.

### Accessing State in a StateGroup

To access state from anywhere, there are some new UR methods available from the root client library `@gemstep/ursys/client`:

#### read
* `UR.ReadStateGroups(...groupNames) -> stateObj`
* `UR.ReadFlatStateGroups(...groupNames) -> flatStateObj`
#### write
* `UR.WriteState(selector, key, propOrObj, propValue)`
#### notification by group change
* `UR.SubscribeState(groupName, stateChangeHandler)`
* `UR.UnsubscribeState(groupName, stateChangeHandler)`

#### types
note: these are not actually implemented in typescript
```
STATE GROUP TYPE DEFINITIONS

stateObj            = { [groupName]: { [key]: value } }
flatStateObj        = { [key]: value }
changeObj           = { [key]: value }
selector            = "groupName"       _all keys in group_ 
                      "groupName.key"   _specific key in group_
stateChangeHandler  = (changeObj) => void
filterFunction      = (key,propOrObj,propValue) => [...modified args] _or_
                                                => `undefined`
```
In general, any module can access state by group name using the UR methods. You just need to know the group name, and know the format of the returned object. If you want to know what the different keys for a group are, you can refer to the `appcore` module that defines it, and be assured that the system will catch misnamed keys AND prevent you from reusing key names across different groups. 

NOTE: The StateGroupMgr class has additional methods for manipulating state, but these are only accessible from within a module that creates its class instance (e.g. an appcore module). For example:

* **change hooks** are a filter function that can be provided to ensure data conforms to expectations, like converting strings from the UI to numbers for the database
* **effect hooks** are run after a change to state is successfully updated. These are similar to notifications but for the managing module as a direct callback.

#### react init

Initialization of state groups happens _BEFORE_ React is started, so you can initialize the state of your components using the UR method `UR.ReadFlatStateGroups('group1','group2') to merge the properties you want into a flat object.

``` js
// group 'locales' contains { localeId:number, localeNames:string[] }
// group 'devices' contains { deviceList:obj[] }

class MyComponent {
  constructor() {
    this.state = UR.ReadFlatStateGroups('locales','devices');
    // state is set to { localeId, localeNames, deviceList }
  }
  render() {
     const { localeId } = this.state;
     return <>current location is {localeId}</>
  }
}
```

#### react receive state notifications

`UR.WriteState(selector, key, propOrObj, propValue)` can be invoked from anywhere, including React Components. The pattern to use with React Components is:

```
1. constructor:           this.urStateChanged = this.urStateChanged.bind(this)
2. componentDidMount:     UR.Subscribe(groupName,this.urStateChanged)
3. componentWillUnmount:  UR.Unsubscribe(groupName,this.urStateChanged)
4. urStateChanged:        called when groupName state has changed, which should this.setState()
5. render:                called when React's this.state has changed to update UI
```

The state change handler will receive a `changeObj` which has the object shape `[groupName]:{ [key]:value, [key]:{ [prop]:value } }`. You will receive groups only from the ones you have subscribed to, and you are not restricted in what groups you can subscribe to. However, you should probably make sure your initial stategroups and subscribed stategroups match for consistency.

Your state change handler can use code like this to figure out what to do:

```js
// group 'locales' contains { localeId:number, localeNames:string[] }
// group 'devices' contains { deviceList:obj[] }
import UR from '@gemstep/ursys/client'
class MyComponent {

  constructor() {
    this.state = UR.ReadFlatStateGroups('locales','devices');
    // state is set to { localeId, localeNames, deviceList }
    this.urStateChanged = this.urStateChanged.bind(this);
  }

  componentDidMount() {
    UR.SubscribeState('locales',this.urStateChanged);
  }

  componentWillUnmount() {
    UR.UnsubscribeState('locales',this.urStateChanged);
  }

  urStateChanged( changeObj ) {
    const { localeNames, localeId } = changeObj;
    if (localeNames) {
      console.log('got localeNames',localeNames);
    }
    if (localeId!==undefined)
      this.setState({localeId}); // causes re-render
    }
  }

  render() {
     const { localeId } = this.state;
     return <>current location is {localeId}</>
  }

} // end of component
```

Because StateGroupMgr require all state keys to be unique across all groups, the single `urLocalesChanged()` handler could be used to handle multiple state changes, but it might be more readable to use several change handlers to group related operations together.

#### react send state change

When your React components receive a user input event that should update the UI, you can handle it with the following pattern with `UR.WriteState(group,key,value)`. The pattern is an extension of **react receive state change**; when both of these patterns are in-use in a component, then you have a full **round trip**. 

```
1. constructor:           this.handleChange = this.handleChange.bind(this)
2. handleChange:          message data, then call UR.WriteState('group','key',value)
3. ---                    UR.WriteState() publishes state change to all subscriber

4. urStateChanged:        called when groupName state has changed, which should this.setState()
5. render:                call to setState() makes UI render with new state.localeId value
```

Example of send state, assuming the `localeID` is the value that the UI might change in a dropdown (this is non-functional pseudocode):

```js
class MyComponent {
  constructor() {
    this.state = UR.ReadFlatStateGroups("locales", "devices");
    this.urStateChanged = this.urStateChanged.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

/* from react receive state example

  componentDidMount() {
    UR.SubscribeState("locales", this.urStateChanged);
  }

  componentWillUnmount() {
    UR.UnsubscribeState("locales", this.urStateChanged);
  }

  urStateChanged(changeObj) {
    const { localeNames, localeId } = changeObj;
    if (localeNames) {
      console.log("got localeNames", localeNames);
    }
    if (localeID !== undefined) {
      this.setState({ localeID }); // causes re-render
    }
  }
*/
  
  handleChange(event) {
    const target = event.target;
    const key = target.name;
    const value = target.type === "checkbox" ? target.checked : target.value;
    if (key === "localeID") UR.WriteState("locales", key, value);
    // rely on setState in urStateChanged, which will be invoked
    // by UR.WriteState() indirectly
  }

  render() {
    return (
      <select
        name="localeId"
        value={this.state.localeId}
        onChange={this.handleChange}
      >
        <option key value>
          optionName
        </option>
      </select>
    );
  }
}

```

The `UR.WriteState()` function will lookup the 'locales' group and attempt to write key 'localeId' with the value passed in the UI event. It also **does not use React.Component.setState()** to update the UI, because our use of `UR.WriteState()` will take care of that in your `urLocalesChanged()` class method which DOES have `setState()`. This method is called if you have used `UR.Subscribe('locales',this.urLocalesChanged)`. 

The advantage to doing this in this roundabout way is that this automatically notifies other subscribed modules and React components, so they will update too. 

---

see [02-modularity](./02-modularity.md) for additional discussion of application state in the APPCORE conventions