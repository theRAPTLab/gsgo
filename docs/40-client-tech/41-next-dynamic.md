/// DYNAMIC IMPORT ////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
let RPIXI;
let PIXI;
(async () => {
  RPIXI = await import('react-pixi-fiber');
  PIXI = await import('pixi.js');
  console.log(PIXI, RPIXI);
})();

{' '}
<Stage options={{ backgroundColor: 0xf00000, height: 600, width: 800 }}>
  <Sprite />
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

  