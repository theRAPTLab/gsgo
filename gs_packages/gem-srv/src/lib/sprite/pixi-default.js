/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Provides some inline default sprites

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import * as PIXI from 'pixi.js';

const triangleSVG = `
<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: Adobe Illustrator 25.2.3, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 256 256" style="enable-background:new 0 0 256 256;" xml:space="preserve">
<style type="text/css">
	.st0{fill:#00A9FF;}
	.st1{fill:#1073E8;}
</style>
<g>
	<polygon class="st0" points="128,1.66 1,221 255,221 	"/>
</g>
<g>
	<polygon class="st1" points="128,1.66 128,221 255,221 	"/>
</g>
</svg>
`;

const texture = PIXI.Texture.from(
  `data:image/svg+xml;charset=utf8,${triangleSVG}`,
  undefined,
  undefined,
  1.0
);
const sprite = new PIXI.Sprite(texture);

export { texture, sprite };
