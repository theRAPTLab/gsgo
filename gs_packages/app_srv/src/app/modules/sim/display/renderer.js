/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  RENDERER MODULE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import UR from '@gemstep/ursys/client';
import debounce from 'debounce';
import * as PIXI from 'pixi.js';
import Visual, { MakeDraggable } from '../lib/class-visual';
import SyncMap from '../lib/class-syncmap';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('RENDER');
const HCON = UR.HTMLConsoleUtil('console-bottom');
/// PIXI & HTML DOM
let PIXI_APP; // PixiJS instance
let PIXI_DIV; // PixiJS root div element
const CONTAINERS = {}; // PixiJS container reference
/// RENDERPASS SYNCMAPS
let RP_MODEL_TO_VOBJ; // renderpass for model sprites
let RP_PTRAK_SPR; // renderpass for ptrack marker sprites
let RP_ANNOT_SPR; // renderpass for annotation marker sprites

/// MODULE HELPERS /////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// MODULE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Init(element) {
  // Initialize PIXI APP
  if (PIXI_APP) throw Error('renderer already defined');
  PIXI.utils.skipHello();
  PIXI_APP = new PIXI.Application({ width: 512, height: 512 });
  // CSS styling
  document.body.style.margin = '0px';
  PIXI_DIV = element;
  PIXI_DIV.innerHTML = '';
  PIXI_APP.renderer.view.style.position = 'absolute';
  PIXI_APP.renderer.view.style.display = 'block';
  //
  PIXI_DIV.appendChild(PIXI_APP.view);
  PIXI_APP.renderer.autoResize = true;
  PIXI_APP.renderer.resize(PIXI_DIV.offsetWidth, PIXI_DIV.offsetHeight);

  // create PIXI root container and add to renderer
  const root = new PIXI.Container();
  root.sortableChildren = true;
  root.x = PIXI_APP.screen.width / 2; // center root
  root.y = PIXI_APP.screen.height / 2;
  root.pivot.x = root.width / 2; // set origin to center of root
  root.pivot.y = root.height / 2;
  PIXI_APP.stage.addChild(root);
  // save
  CONTAINERS.Root = root;

  // map model display objects to sprites
  RP_MODEL_TO_VOBJ = new SyncMap('1-D2V', {
    Constructor: Visual,
    autoGrow: true
  });

  // object handlers for 1-D2V
  let temp_num = 1;
  const doScale = true;
  const doRotate = true;
  const doAlpha = true;

  RP_MODEL_TO_VOBJ.setObjectHandlers({
    onAdd: (dobj, vobj) => {
      MakeDraggable(vobj);
      vobj.add(CONTAINERS.Root);
      if (++temp_num > 4) temp_num = 1;
      // vobj.setTextureById(2, temp_num);
      vobj.setTexture('default');
      vobj.setAngle(Math.random() * 180);
      if (!vobj.sprite.draggin) vobj.setPosition(dobj.x, dobj.y);
    },
    onUpdate: (dobj, vobj) => {
      if (!vobj.sprite.dragging) vobj.setPosition(dobj.x, dobj.y);
      // HACK: this should be a dobj.parm 'angle'
      if (doRotate) {
        vobj.turnAngle(vobj.refId % 2 ? 2 : -2);
      }
      // HACK: this should be a dobj.parm 'scale'
      if (doScale) {
        let { x } = vobj.getScale();
        x += (Math.random() - 0.5) * 0.05;
        if (x > 0.75) x = 0.5;
        if (x < 0.1) x = 0.1;
        vobj.setScale(x, x);
      }
      if (doAlpha) vobj.setAlpha(0.5);
    },
    shouldRemove: vobj => true,
    onRemove: vobj => {}
  });

  // RP_MODEL_TO_VOBJ.setObjectHandlers()

  // map ptrack markers
  RP_PTRAK_SPR = new SyncMap('2-PTK', {
    Constructor: Visual,
    autoGrow: true
  });
  // RP_PTRAK_SPR.setObjectHandlers()

  // map student input controls
  RP_ANNOT_SPR = new SyncMap('3-ANO', {
    Constructor: Visual,
    autoGrow: true
  });
  // RP_ANNOT_SPR.setObjectHandlers()
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function HookResize(element) {
  // element is usually window
  element.addEventListener(
    'resize',
    debounce(() => {
      const renderRoot = document.getElementById('root-renderer');
      console.log(
        ...PR('window resize', renderRoot.offsetWidth, renderRoot.offsetHeight)
      );
      PIXI_APP.renderer.resize(renderRoot.offsetWidth, renderRoot.offsetHeight);
      const { Root } = CONTAINERS;
      Root.x = PIXI_APP.screen.width / 2;
      Root.y = PIXI_APP.screen.height / 2;
      Root.pivot.x = 0; //root.width / 2;
      Root.pivot.y = 0; // root.height / 2;
    }, 500)
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function UpdateModelList(dobjs) {
  RP_MODEL_TO_VOBJ.syncFromArray(dobjs);
  HCON.plot(`updated model list ${dobjs.length}`, 1);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function UpdatePTrackList(dobjs) {
  RP_PTRAK_SPR.syncFromArray(dobjs);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function UpdateAnnotationList(dobjs) {
  RP_ANNOT_SPR.syncFromArray(dobjs);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Render() {
  RP_MODEL_TO_VOBJ.processSyncedObjects();
  RP_PTRAK_SPR.processSyncedObjects();
  RP_PTRAK_SPR.processSyncedObjects();
  const synced = RP_MODEL_TO_VOBJ.getSyncedObjects();
  HCON.plot('renderer called', 0);
  HCON.plot(`synced count ${synced.length}`, 0, 20);
}

/// PHASE MACHINE DIRECT INTERFACE ////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
UR.SystemHook('SIM', 'RESET', () => {
  console.log(...PR('SIM.RESET'));
});

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  Init,
  HookResize,
  UpdateModelList,
  UpdatePTrackList,
  UpdateAnnotationList,
  Render
};
