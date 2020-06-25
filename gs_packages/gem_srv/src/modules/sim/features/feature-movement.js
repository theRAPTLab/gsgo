import Feature from './feature';

/* temp */
const MovementPack = {
  name: 'Movement',
  initialize: pm => {
    pm.Hook('INPUT', this.HandleInput);
  },
  agentInit: agent => {
    this.agent = agent;
  },
  setController: x => {
    console.log(`setting control to ${x}`);
  }
};
