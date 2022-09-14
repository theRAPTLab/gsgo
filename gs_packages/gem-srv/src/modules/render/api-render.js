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
import ERROR from 'modules/error-mgr';

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
/// PIXI_DIV > PIXI_APP . stage > Root > Boundary
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
  const size = 512;
  PIXI_APP = new PIXI.Application({
    width: size,
    height: size,
    backgroundColor: 0x222222
  });
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
  RescaleToFit(size);

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
      // zIndex needs to be set before updateTransform is called
      vobj.setZIndex(dobj.zIndex);
      vobj.setPosition(dobj.x, dobj.y);
      // if (!dobj.skin) throw Error('missing skin property');
      vobj.setVisible(dobj.visible);
      vobj.setAlpha(dobj.alpha);
      vobj.setTexture(dobj.skin, dobj.frame);
      vobj.setScale(dobj.scale, dobj.scaleY);
      vobj.setRotation(dobj.rotation);
      // has to be called after setTexture and
      // setScale so font placement can be calculated relative to scale
      if (dobj.text !== undefined) vobj.setText(dobj.text);
      if (dobj.meter !== undefined)
        vobj.setMeter(
          dobj.meter,
          dobj.meterClr,
          dobj.meterPosition,
          dobj.flags & FLAGS.SELECTION.LARGEMETER
        );
      if (dobj.graph !== undefined)
        vobj.setGraph(dobj.graph, dobj.flags & FLAGS.SELECTION.LARGEMETER);
      else if (dobj.barGraph !== undefined) {
        vobj.setBarGraph(dobj.barGraph, dobj.barGraphLabels);
      }

      // Set selection state from flags.
      // This needs to be set before the setTexture call
      // because they are added/removed on the vobj with setTexture
      vobj.setSelected(dobj.flags & FLAGS.SELECTION.SELECTED);
      vobj.setHovered(dobj.flags & FLAGS.SELECTION.HOVERED);
      vobj.setGrouped(dobj.flags & FLAGS.SELECTION.GROUPED);
      vobj.setCaptive(dobj.flags & FLAGS.SELECTION.CAPTIVE);
      vobj.setGlowing(dobj.flags & FLAGS.SELECTION.GLOWING);
      vobj.setColorize(dobj.color);
      vobj.applyFilters();

      if (dobj.debug) vobj.setDebug(dobj.debug);

      // Old Approach: Only enable drag and hover if controlMode is puppet (1)
      // But this doesn't work for two reasons:
      // 1. Input controlled agents (controlMode 3) need to be hoverable and selectable
      // 2. Selection needs to be handled by draggable so we can distinguish between
      //    drags and selections.
      // if (dobj.mode === 1 && SETTINGS.actable) {

      // New Approach: Make everything Draggable and Hoverable regardless of controlMode
      // draggable will take care of testing whether it is allowed to override
      // based on controlMode
      if (SETTINGS.actable) {
        // add drag-and-drop and selection handlers
        MakeDraggable(vobj);
        // add hover handler
        MakeHoverable(vobj);
        // selection is handled by drag
        // MakeSelectable(vobj);
      }

      // add to scene
      vobj.add(CONTAINERS.Root);
    },
    onUpdate: (dobj, vobj) => {
      // zIndex needs to be set before updateTransform is called
      vobj.setZIndex(dobj.zIndex);
      if (!vobj.isDragging) vobj.setPosition(dobj.x, dobj.y);
      if (!dobj.dragging) {
        vobj.sprite.tint = 0xffffff;
        vobj.sprite.alpha = 1;
      } else {
        vobj.sprite.tint = 0xff0000;
        vobj.sprite.alpha = 0.5;
      }

      // inefficient texture update
      vobj.setVisible(dobj.visible);
      vobj.setAlpha(dobj.alpha);
      vobj.setTexture(dobj.skin, dobj.frame);
      vobj.setScale(dobj.scale, dobj.scaleY);
      vobj.setRotation(dobj.rotation);
      // has to be called after setTexture and
      // setScale so font placement can be calculated relative to scale
      if (dobj.text !== undefined) vobj.setText(dobj.text);
      if (dobj.meter !== undefined)
        vobj.setMeter(
          dobj.meter,
          dobj.meterClr,
          dobj.meterPosition,
          dobj.flags & FLAGS.SELECTION.LARGEMETER
        );
      else vobj.removeMeter();
      if (dobj.graph !== undefined)
        vobj.setGraph(dobj.graph, dobj.flags & FLAGS.SELECTION.LARGEMETER);
      else if (dobj.barGraph !== undefined) {
        vobj.setBarGraph(dobj.barGraph, dobj.barGraphLabels);
      } else vobj.removeGraph();

      // Set selection state from flags.
      // This needs to be set before the setTexture call
      // because they are added/removed on the vobj with setTexture
      vobj.setSelected(dobj.flags & FLAGS.SELECTION.SELECTED);
      vobj.setHovered(dobj.flags & FLAGS.SELECTION.HOVERED);
      vobj.setGrouped(dobj.flags & FLAGS.SELECTION.GROUPED);
      vobj.setCaptive(dobj.flags & FLAGS.SELECTION.CAPTIVE);
      vobj.setGlowing(dobj.flags & FLAGS.SELECTION.GLOWING);
      vobj.setColorize(dobj.color);
      vobj.applyFilters();
      // force vobj rotation, scale, alpha for PIXI testing
      // see sim-agents.js for TestJitterAgents
      // TestRenderParameters(dobj, vobj);

      if (dobj.debug) vobj.setDebug(dobj.debug);
      else vobj.removeDebug();
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
function HookResize(element, cb) {
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
        if (cb && typeof cb === 'function')
          return cb(renderRoot.offsetWidth, renderRoot.offsetHeight);
      } else {
        console.log('note: no #root-renderer to resize');
      }
    }, 500)
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/// Rescales Root to fit in PIXI_DIV
function RescaleToFit(width, height = width) {
  const scaleFactor = Math.min(
    PIXI_DIV.offsetWidth / width,
    PIXI_DIV.offsetHeight / height
  );
  CONTAINERS.Root.scale.set(scaleFactor);
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function SetBoundary(width, height, bgcolor = 0x000000) {
  // Stage
  let boundaryRect = CONTAINERS.Boundary;
  if (!boundaryRect) {
    boundaryRect = new PIXI.Graphics();
    boundaryRect.zIndex = -1000;
    CONTAINERS.Boundary = boundaryRect;
    CONTAINERS.Root.addChild(boundaryRect);
  }
  boundaryRect.beginFill(bgcolor);
  boundaryRect.drawRect(-width / 2, -height / 2, width, height);
  boundaryRect.endFill();

  RescaleToFit(width, height);
  UR.CallMessage('BOUNDARY_UPDATE'); // tell PanelSimulation to recalculate size
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetPixiAppScreenSize() {
  const renderRoot = document.getElementById('root-renderer');
  return { width: renderRoot.offsetWidth, height: renderRoot.offsetHeight };
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GetPixiRootScale() {
  return { x: CONTAINERS.Root.scale.x, y: CONTAINERS.Root.scale.y };
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
function ReportMemory(frametime) {
  if (frametime % 300) {
    const baseTexturesCount = Object.keys(PIXI.utils.BaseTextureCache).length;
    const textureCount = Object.keys(PIXI.utils.TextureCache).length;
    console.log('baseTextures textures:', baseTexturesCount, textureCount);
    // console.log('baseTextures', Object.keys(PIXI.utils.TextureCache));
    // console.log('ProgramCache', PIXI.utils.ProgramCache);
  }
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let renderFrames = 0;
let ABORT_RENDER = false;
function Render() {
  if (ABORT_RENDER) return;
  try {
    if (!RP_DOBJ_TO_VOBJ) return;
    RP_DOBJ_TO_VOBJ.mapObjects();
    // RP_PTRAK_TO_VOBJ.mapObjects(); // in api-input right now
    // RP_PTRAK_TO_VOBJ.mapObjects();
    const synced = RP_DOBJ_TO_VOBJ.getMappedObjects();
    // HCON.plot(`renderer synced ${synced.length} DOBJS to Sprites`, 2);
  } catch (caught) {
    ABORT_RENDER = true;
    ERROR(`render system error...aborting frame updates`, {
      source: 'renderer',
      where: 'api-render.Render',
      caught
    });
  }
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export {
  SetGlobalConfig,
  Init,
  HookResize,
  SetBoundary,
  GetPixiAppScreenSize,
  GetPixiRootScale,
  UpdateDisplayList,
  UpdatePTrackList,
  UpdateAnnotationList,
  GetDisplayList,
  ReportMemory,
  Render
};
