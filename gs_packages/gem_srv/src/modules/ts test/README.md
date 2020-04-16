```
// test snippet
// (1) prettier: extra lines to be removed, double quotes, missing semicolons, weird indents
// (2) eslint: warnings in extra lines, trailing spaces
// (3) prettier: arrow function single parameter wrapped with paren
// (4) eslint/tslint: module path resolution
// manual check
// (5) check default formatter (right-click 'format document with...' should be Prettier)
// (6) check that module tsconfig.paths are linted, by inducing error in path
// (7) in .ts and .tsx files, type warnings should appear for 'str' and imported modules

/* 8< cut here */
import Moo from "config/app.settings"
		import GEM_CONFIG from "@gemstep/globals"


const foo = (a) => {
    const { PROJECT_NAME } = Moo;
return `${PROJECT_NAME} ${GEM_CONFIG.NAME} ${a}`
} 
      console.log(foo);
```

