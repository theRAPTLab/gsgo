/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  RENDERER MODULE

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/
import UR from '@gemstep/ursys/client';
import debounce from 'debounce';
import * as PIXI from 'pixi.js';
import Visual, {
  MakeDraggable,
  MakeHoverable,
  MakeSelectable
} from 'lib/class-visual';
import SyncMap from 'lib/class-syncmap';
import { SetModelRP, SetTrackerRP, SetAnnotRP } from 'modules/datacore/dc-render';
import FLAGS from 'modules/flags';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('RENDER');
/// PIXI & HTML DOM
let PIXI_APP; // PixiJS instance
let PIXI_DIV; // PixiJS root div element
const CONTAINERS = {}; // PixiJS container reference
/// RENDERPASS SYNCMAPS
let RP_DOBJ_TO_VOBJ; // renderpass for normal visuals
let RP_PTRAK_TO_VOBJ; // renderpass for ptrack marker sprites
let RP_ANNOT_TO_VOBJ; // renderpass for annotation marker sprites
/// SETTINGS
let SETTINGS = {};

/// PHASE MACHINE INTERFACES //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/// MODULE METHODS ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function Init(element) {
  // if PIXI_APP already exists, maybe we just need to reattach the canvas
  if (PIXI_APP) {
    if (!PIXI_DIV) throw Error('RendererInit: on reattach no valid div to use');
    if (PIXI_DIV.hasChildNodes()) {
      console.log(...PR('reattaching render canvas'));
      PIXI_DIV.appendChild(PIXI_APP.view);
      return;
    }
  }
  // first time initialization
  // Initialize PIXI APP
  if (!element) throw Error('received null element for Renderer.Init()');
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
  // XGUI PROBLEM: Can't get accurate width/height
  PIXI_APP.renderer.resize(PIXI_DIV.offsetWidth, PIXI_DIV.offsetHeight);
  // end XGUI problem

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

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // map model display objects to sprites
  RP_DOBJ_TO_VOBJ = new SyncMap({
    Constructor: Visual,
    autoGrow: true,
    name: 'DisplayObjectToVisual'
  });
  RP_DOBJ_TO_VOBJ.setMapFunctions({
    onAdd: (dobj, vobj) => {
      // copy parameters
      vobj.setPosition(dobj.x, dobj.y);
      if (!dobj.skin) throw Error('missing skin property');

      // copy selection states?
      // Set selection state from flags.
      // This needs to be set before the setTexture call
      // because they are added/removed on the vobj with setTexture
      vobj.setSelected(dobj.flags & FLAGS.SELECTION.SELECTED);
      vobj.setHovered(dobj.flags & FLAGS.SELECTION.HOVERED);
      vobj.setGrouped(dobj.flags & FLAGS.SELECTION.GROUPED);
      vobj.setCaptive(dobj.flags & FLAGS.SELECTION.CAPTIVE);
      vobj.setGlowing(dobj.flags & FLAGS.SELECTION.GLOWING);

      vobj.setAlpha(dobj.alpha);
      vobj.setTexture(dobj.skin, dobj.frame);
      vobj.setScale(dobj.scale, dobj.scaleY);
      // has to be called after setTexture so font placement can be calculated
      // has to be called after setScale so font placement can be calculated relative to scale
      if (dobj.text) vobj.setText(dobj.text);
      if (dobj.meter)
        vobj.setMeter(
          dobj.meter,
          dobj.meterClr,
        );

      if (dobj.mode === 1 && SETTINGS.actable) {
        // add drag-and-drop and selection handlers
        MakeDraggable(vobj);
        // add hover handler
        MakeHoverable(vobj);
        // selection is handled by drag
        // // add selectable handler
        // MakeSelectable(vobj);
      }

      // add to scene
      vobj.add(CONTAINERS.Root);
    },
    onUpdate: (dobj, vobj) => {
      if (!vobj.isDragging) vobj.setPosition(dobj.x, dobj.y);
      if (!dobj.dragging) {
        vobj.sprite.tint = 0xffffff;
        vobj.sprite.alpha = 1;
      } else {
        vobj.sprite.tint = 0xff0000;
        vobj.sprite.alpha = 0.5;
      }

      // Set selection state from flags.
      // This needs to be set before the setTexture call
      // because they are added/removed on the vobj with setTexture
      vobj.setSelected(dobj.flags & FLAGS.SELECTION.SELECTED);
      vobj.setHovered(dobj.flags & FLAGS.SELECTION.HOVERED);
      vobj.setGrouped(dobj.flags & FLAGS.SELECTION.GROUPED);
      vobj.setCaptive(dobj.flags & FLAGS.SELECTION.CAPTIVE);
      vobj.setGlowing(dobj.flags & FLAGS.SELECTION.GLOWING);

      // inefficient texture update
      vobj.setAlpha(dobj.alpha);
      vobj.setTexture(dobj.skin, dobj.frame);
      vobj.setScale(dobj.scale, dobj.scaleY);
      // has to be called after setTexture so font placement can be calculated
      // has to be called after setScale so font placement can be calculated relative to scale
      if (dobj.text) vobj.setText(dobj.text);
      if (dobj.meter)
        vobj.setMeter(
          dobj.meter,
          dobj.meterClr,
        );

      // force vobj rotation, scale, alpha for PIXI testing
      // see sim-agents.js for TestJitterAgents
      // TestRenderParameters(dobj, vobj);
    },
    shouldRemove: () => true,
    onRemove: () => {}
  });
  // make sure datacore has access to it for pure data manipulation
  SetModelRP(RP_DOBJ_TO_VOBJ);

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // map ptrack markers
  RP_PTRAK_TO_VOBJ = new SyncMap({
    Constructor: Visual,
    autoGrow: true,
    name: 'TrackEntityToVisual'
  });
  const SCALE = 200;
  RP_PTRAK_TO_VOBJ.setMapFunctions({
    onAdd: (ent, vobj) => {
      // copy parameters
      vobj.setPosition(ent.x * SCALE, ent.y * SCALE);
      vobj.setTexture('bunny.json', 0);
      vobj.add(CONTAINERS.Root);
    },
    onUpdate: (ent, vobj) => {
      vobj.setPosition(ent.x * SCALE, ent.y * SCALE);
    },
    shouldRemove: () => true,
    onRemove: () => {}
  });
  // make sure datacore has access to it for pure data manipulation
  SetTrackerRP(RP_PTRAK_TO_VOBJ);

  /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // map student input controls
  RP_ANNOT_TO_VOBJ = new SyncMap({
    Constructor: Visual,
    autoGrow: true,
    name: 'InputEventToVisual'
  });
  RP_ANNOT_TO_VOBJ.setMapFunctions({});
  // make sure datacore has access to it for pure data manipulation
  SetAnnotRP(RP_PTRAK_TO_VOBJ);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function HookResize(element) {
  // element is usually window
  element.addEventListener(
    'resize',
    debounce(() => {
      const renderRoot = document.getElementById('root-renderer');
      if (renderRoot) {
        console.log(
          ...PR('window resize', renderRoot.offsetWidth, renderRoot.offsetHeight)
        );
        PIXI_APP.renderer.resize(renderRoot.offsetWidth, renderRoot.offsetHeight);
        const { Root } = CONTAINERS;
        Root.x = PIXI_APP.screen.width / 2;
        Root.y = PIXI_APP.screen.height / 2;
        Root.pivot.x = 0; //root.width / 2;
        Root.pivot.y = 0; // root.height / 2;
      } else {
        console.log('note: no #root-renderer to resize');
      }
    }, 500)
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SetGlobalConfig(opt) {
  const { actable } = opt;
  SETTINGS.actable = actable || false; // default non-interative
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let updateFrames = 0;
function UpdateDisplayList(dobjs) {
  if (!RP_DOBJ_TO_VOBJ) return;
  RP_DOBJ_TO_VOBJ.syncFromArray(dobjs);
  // HCON.plot(
  //   `${updateFrames++} renderer updated ${dobjs.length} DOBJs in changelists`,
  //   1
  // );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function UpdatePTrackList(dobjs) {
  RP_PTRAK_TO_VOBJ.syncFromArray(dobjs);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function UpdateAnnotationList(dobjs) {
  RP_ANNOT_TO_VOBJ.syncFromArray(dobjs);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetDisplayList() {
  // TODO: expand this to return all display objects from all render passes
  return RP_DOBJ_TO_VOBJ.getMappedObjects(); // array of display objects
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let renderFrames = 0;
function Render() {
  if (!RP_DOBJ_TO_VOBJ) return;
  RP_DOBJ_TO_VOBJ.mapObjects();
  // RP_PTRAK_TO_VOBJ.mapObjects(); // in api-input right now
  // RP_PTRAK_TO_VOBJ.mapObjects();
  const synced = RP_DOBJ_TO_VOBJ.getMappedObjects();
  // HCON.plot(`renderer synced ${synced.length} DOBJS to Sprites`, 2);
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  SetGlobalConfig,
  Init,
  HookResize,
  UpdateDisplayList,
  UpdatePTrackList,
  UpdateAnnotationList,
  GetDisplayList,
  Render
};
