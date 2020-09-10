import * as PIXI from 'pixi.js';

let PIXI_APP;
let PIXI_ROOT;
let SPRITES = {};
let CONTAINERS = {};
const LOADER = PIXI.Loader.shared;

/** initialize at runtime */
PIXI.utils.skipHello();
if (PIXI_APP) throw Error('renderer already defined');
PIXI_APP = new PIXI.Application({ width: 512, height: 512 });
const root = new PIXI.Container();
PIXI_APP.stage.addChild(root);

/** initalizze and attach renderer view to element */
function Init(element) {
  document.body.style.margin = '0px';
  //
  PIXI_APP.renderer.autoResize = true;
  PIXI_APP.renderer.view.style.position = 'absolute';
  PIXI_APP.renderer.view.style.display = 'block';
  PIXI_ROOT = element;
  PIXI_ROOT.innerHTML = '';
  PIXI_ROOT.appendChild(PIXI_APP.view);
  PIXI_APP.renderer.resize(PIXI_ROOT.offsetWidth, PIXI_ROOT.offsetHeight);
  //
  const { bunny } = SPRITES;
  bunny.interactive = true;
  bunny.on('mousedown', onDragStart);
  bunny.on('mouseup', onDragEnd);
  bunny.on('mouseupoutside', onDragEnd);
  bunny.on('mousemove', onDragMove);
  bunny.x = 0;
  bunny.y = 0;
  bunny.pivot.x = bunny.width / 2;
  bunny.pivot.y = bunny.height / 2;
  root.addChild(bunny);
  root.x = PIXI_APP.screen.width / 2;
  root.y = PIXI_APP.screen.height / 2;
  root.pivot.x = root.width / 2;
  root.pivot.y = root.height / 2;
  CONTAINERS.root = root;
  //
  PIXI_APP.ticker.add(delta => {
    bunny.rotation -= 0.01 * delta;
  });
}

function onDragStart(event) {
  // store a reference to the data
  // the reason for this is because of multitouch
  // we want to track the movement of this particular touch
  this.data = event.data;
  this.alpha = 0.5;
  this.dragging = true;
}

function onDragEnd() {
  this.alpha = 1;
  this.dragging = false;
  // set the interaction data to null
  this.data = null;
}

function onDragMove() {
  if (this.dragging) {
    const newPosition = this.data.getLocalPosition(this.parent);
    this.x = newPosition.x;
    this.y = newPosition.y;
  }
}

/** hook resize */
function HookResize(element) {
  window.addEventListener('resize', () => {
    PIXI_APP.renderer.resize(element.offsetWidth, element.offsetHeight);
    const { root } = CONTAINERS;
    root.x = PIXI_APP.screen.width / 2;
    root.y = PIXI_APP.screen.height / 2;
    root.pivot.x = root.width / 2;
    root.pivot.y = root.height / 2;
  });
}

function Draw() {
  console.log('drawing');
}

function UR_ModuleInit(UR_EXEC) {
  UR_EXEC.Hook('APP_LOAD', () => {
    console.log('hooking APP_LOAD');
    const loadSprites = (resolve, reject) => {
      console.log('loadSprites EXEC_LOAD');
      LOADER.add('static/sprites/bunny.json').load(loader => {
        let sheet = loader.resources['static/sprites/bunny.json'].spritesheet;
        SPRITES.bunny = new PIXI.Sprite(sheet.textures['bunny02.png']);
        resolve();
      });
    };
    return new Promise(loadSprites);
  });
}

export default { Init, HookResize, Draw, UR_ModuleInit };
