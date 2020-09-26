import UR from '@gemstep/ursys/client';
import debounce from 'debounce';

import * as PIXI from 'pixi.js';
import Sprite from '../sim/lib/class-visual';
import SyncMap from '../sim/lib/class-syncmap';

const PR = UR.PrefixUtil('TestRender');

/// PIXI INSTANCES
let PIXI_APP; // PixiJS instance
let PIXI_ROOT; // PixiJS root element

/// DEMO CODE SPRITE LIBRARY
let SPRITES = {}; // sprite resources dictionary
let CONTAINERS = {}; // PixiJS contain references

/// ASSET LOADER
const LOADER = PIXI.Loader.shared;

/// RENDERER INITIALIZE -- copy to sim_render
PIXI.utils.skipHello();
if (PIXI_APP) throw Error('renderer already defined');
PIXI_APP = new PIXI.Application({ width: 512, height: 512 });
const root = new PIXI.Container();
PIXI_APP.stage.addChild(root);

/** initialize display list **/
let num = 1;
const DISPLAY_LIST = new SyncMap('DOB-SPR', {
  Constructor: Sprite,
  autoGrow: true
});
//
DISPLAY_LIST.setObjectHandlers({
  onAdd: (dobj, spr) => {
    spr.add(root);
    if (++num > 5) num = 1;
    const pick = `${num}`.padStart(2, '0');
    spr.setTexture(SPRITES.sheet.textures[`bunny${pick}.png`]);
    spr.setPosition(dobj.x, dobj.y);
  },
  onUpdate: (dobj, spr) => {
    spr.setPosition(dobj.x, dobj.y);
  },
  onRemove: spr => {}
});

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
  MakeOneBunny();
}

function MakeOneBunny() {
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

  const { bunny } = SPRITES;
  bunny.interactive = true;
  bunny.on('mousedown', onDragStart);
  bunny.on('mouseup', onDragEnd);
  bunny.on('mouseupoutside', onDragEnd);
  bunny.on('mousemove', onDragMove);
  bunny.x = 0;
  bunny.y = 0;
  bunny.zIndex = 1;
  bunny.pivot.x = bunny.width / 2;
  bunny.pivot.y = bunny.height / 2;
  bunny.width *= 2;
  bunny.height *= 2;
  root.addChild(bunny);
  root.sortableChildren = true;
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

/** hook resize */
function HookResize() {
  window.addEventListener(
    'resize',
    debounce(() => {
      const renderRoot = document.getElementById('root-renderer');
      console.log(
        ...PR('window resize', renderRoot.offsetWidth, renderRoot.offsetHeight)
      );
      PIXI_APP.renderer.resize(renderRoot.offsetWidth, renderRoot.offsetHeight);
      const { root } = CONTAINERS;
      root.x = PIXI_APP.screen.width / 2;
      root.y = PIXI_APP.screen.height / 2;
      root.pivot.x = 0; //root.width / 2;
      root.pivot.y = 0; // root.height / 2;
    }, 500)
  );
}

function HandleDisplayList(displayList) {
  const { added, updated, removed } = DISPLAY_LIST.syncFromArray(displayList);
}
function Draw() {}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// UR.SystemHook('UR', 'APP_LOAD', () => {
//   const loadSprites = (resolve, reject) => {
//     LOADER.add('static/sprites/bunny.json').load(loader => {
//       let sheet = loader.resources['static/sprites/bunny.json'].spritesheet;
//       SPRITES.bunny = new PIXI.Sprite(sheet.textures['bunny02.png']);
//       SPRITES.sheet = sheet;
//       resolve();
//     });
//   };
//   return new Promise(loadSprites);
// });

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { Init, HookResize, HandleDisplayList, Draw };
