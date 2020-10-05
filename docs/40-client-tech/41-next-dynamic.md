/// DYNAMIC IMPORT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let RPIXI;
let PIXI;
(async () => {
  RPIXI = await import('react-pixi-fiber');
  PIXI = await import('pixi.js');
  console.log(PIXI, RPIXI);
})();

<Stage options={{ backgroundColor: 0xf00000, height: 600, width: 800 }}>
  <Sprite texture={dict.bunny.textures['bunny01.png']} />
</Stage>
,



THis doesn't work

const ReactPixiFiber = dynamic(
    () =>
      import('react-pixi-fiber').then(mod => {
        console.log('got pixi fiber mod', mod);
        return mod;
      }),
    {
      ssr: false
    }
  );
  const PIXI = dynamic(
    () =>
      import('pixi.js').then(mod => {
        console.log('got pixi mod', mod);
        return mod;
      }),
    { ssr: false }
  );

  next/dynamic wraps the contents in a component of some kind with a render function.

  maybe the syntax is to remove the ()? NOPE

  Apparently the way next/dynamic works is that it HAS to be a component.
  So we wrap components we don't want rendering int.
  
  WebGL resizing the canvas
  https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html

  Using Refs with Pixi
  https://www.protectator.ch/post/pixijs-v4-in-a-react-component

  Responsive PixiJS
  https://stackoverflow.com/questions/59663955/react-pixi-responsive-stage

