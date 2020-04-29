```
COMPONENT SUPPORTED PROPS

border={1|0} borderTop, borderLeft, etc
borderColor="primary.main", etc
display="inline" "block", {{xs:'none}}
displayPrint="none" "block"
overflow="hidden" "visible"
textOverflow "clip" "ellipses"
visibility="visible" "hidden
whiteSpace="nowrap" "normal"
Box display, flexDirection, etc
color, bgcolor
zIndex
position="absolute", top={40}, left, etc
boxShadow={0} {1} etc
width={1} = 100%, {10} = 10px, {1/4} = 25%, "75%" = valid css, "auto"
height={1}, {10}, {1/4}, "33%"
minHeight, maxHeight
boxSizing="content-box" (default), "border-box" the BETTER WAY
m={-2| margin -16px, {0.5} 4px
spacing m|p e.g. mx="auto" horizontal centering, t b l r x y
textAlign="left" center right
fontWeight="fontWeightLight", {500}
fontSize="fontSize", "h6.fontSize"
fontStyle, fontFamily, letterSpacing, lineHeight


BREAKPOINT HELPERS
in theme.breakpoints defined as: 0=xs 600=sm 960=md 1280=lg 1920=xl ->
in styles, can specify as:
	[theme.breakpoints.down('sm')]: { style }
	[theme.breakpoints.up('sm')]: { style }
	[theme.breakpoints.only('lg')]: { style }
	[theme.breakpoints.between('sm','lg')]: { style }
for JS: see useMediaQuery hook

DENSITY can be selectively applied for these components in some prop:
	Button Fab FilledInput FormControl FormHelperText IconButton
	InputBase InputLabel ListItem OutlinedInput Table
	TextField ToolBar

CONTAINER
most basic element. full width and centered content
maxWidth="sm" 
fixed match minWidth of current breakpoint

BOX
does not implement breakpoints. use CSS to position and style

GRID 
is auto layout using flexbox
container item props to set flexbox props on Grid component
spacing={1}, etc
xs={1..12} specify up from xs, can have multiple breakpoint widths defined
```

```
THEME DEFAULTS

palette
common .black .white
type "light"
primary, secondary, error, warning, info, success
	.light .main .dark .contrastText
grey
	50 100 200 300 400 500 600 700 800 900, A100, A200, A400, A700
	.contrastThreshold, getContrastText() augmentColor(), tonalOffset
text .primary .secondary .disabled .hint
background .paper .default
action .active .hover .hoverOpacity .selected .selectedOpacity
action .disabled .disabledBackground .disabledOpacity
action .focus .focusOpacity .activatedOpacity
typography
	htmlFontSize, pxToRem() round() fontFamily, fontSize
	fontWeightLight fontWeightRegular, fontWeightMedium, fontWeightBold
	h1-h6: fontFamily fontWeight fontSize lineHeight lineSpacing
	subtitle1, subtitle2
	body1, body2
	button, caption, overline
spacing()
shape .borderRadius
transitions
	easing: 
		easeOut, easeIn, sharp, easeInOut="cubic-bezier(0.5,0.0.2,1)"
	duration:	
		shortest, shorter, short, standard, complex, 
		enteringScreen, leavingScreen
	create()
	getAutoHeightDuration()
zIndex:
	mobileStepper speedDial appBar drawer modal snackbar tooltip

```

