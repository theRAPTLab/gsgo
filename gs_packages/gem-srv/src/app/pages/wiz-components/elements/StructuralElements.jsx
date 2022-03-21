/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Common Small Components for rendering the Wizard GUI

  the css classe names are defined in lib/gem-ui.css

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import {
  TokenToString,
  UnpackToken,
  DecodeTokenPrimitive
} from 'script/transpiler-v2';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const SPECIAL_IDENTS = [
  'BLUEPRINT',
  'TAG',
  'PROGRAM',
  'INIT',
  'DEFINE',
  'UPDATE',
  'CONDITION'
];
const SPECIAL_KEYWORDS = ['useFeature', 'addFeature', 'addProp'];
const CONDITION_KEYWORDS = ['every', 'when'];
const INFO_TYPES = {
  blueprint: {},
  symbol: {
    summary: {
      color: 'rgba(0, 59, 118, 0.88)',
      fontWeight: 'bold'
      // backgroundColor: 'rgba(0, 59, 118, 0.25)',
      // margin: '-10px -10px -5px -10px',
      // padding: '10px 10px 5px 10px'
    }
  },
  dev: {},
  note: {}
};

/// COMPONENT MANAGEMENT //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** contains full-width Stackables */
function FlexStack(props) {
  const { children, className, style, id, color } = props;
  const s = { ...style, display: 'flex', flexDirection: 'column', flexGap: 0 };
  if (typeof color === 'string') s.backgroundColor = color;
  return (
    <div id={id} className={className} style={s}>
      {children}
    </div>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** contains full-width Stackables */
function GridStack(props) {
  const { children, className, style, color } = props;
  const colorStyle = INFO_TYPES[color];
  const s = {
    display: 'grid',
    gridTemplateRows: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: 0,
    ...colorStyle,
    ...style
  };
  if (typeof color === 'string') s.backgroundColor = color;
  return (
    <div className={className} style={s}>
      {children}
    </div>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** a collapsable element for a Stack */
function StackUnit(props) {
  const {
    label = 'label',
    className,
    style,
    type,
    open = false,
    sticky = false,
    wrap = false,
    children
  } = props;
  const { summary, details } = INFO_TYPES[type] || {};
  const s = { padding: '10px 10px 5px 10px', margin: 0, ...details, ...style };
  if (wrap) s.whiteSpace = 'normal';
  const classes = [];
  if (sticky) classes.push('sticky');
  if (className) classes.push('className');
  return (
    <details
      className={classes.join(' ')}
      style={s}
      open={open}
      onClick={e => {
        if (sticky) e.preventDefault();
      }}
    >
      <summary style={summary}>{label}</summary>
      {children}
    </details>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function StackText(props) {
  const { children, className, style, color } = props;
  const colorStyle = INFO_TYPES[color];
  const s = {
    padding: '10px 10px 5px 10px',
    margin: 0,
    whiteSpace: 'normal',
    ...colorStyle,
    ...style
  };
  return <div style={s}>{children}</div>;
}

/// TOKEN LINES ///////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GBlankLine() {
  return <div className="gwiz gtoken">&nbsp;</div>;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GLineNum(props) {
  const { lineNum, level } = props;
  const tokenKey = `${Number(lineNum)},0`;
  const indent = level * 2;
  return (
    <div
      className="gwiz gtoken first"
      data-key={tokenKey}
      style={{ marginRight: `${indent}rem` }}
    >
      {lineNum}
    </div>
  );
} /// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GLine(props) {
  const { lineNum, level, children, selected } = props;
  const classes = selected ? 'gwiz gline selected' : 'gwiz gline';
  return (
    <>
      <div className={classes}>
        <GLineNum lineNum={lineNum} level={level} />
        {children}
      </div>
    </>
  );
}

/// TOKENS ////////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** tokens contain the scriptUnit tokenTypes, which are not
 *  the same as the keyword argment types. We can use the keyword symbol
 *  table information to render tokens in the future.
 */
function GToken(props) {
  const { tokenKey, token, selected, position } = props;
  const [type, value] = UnpackToken(token); // simple values or object
  let label;
  switch (type) {
    case 'identifier':
      label = value;
      break;
    case 'objref':
      label = value.join('.');
      break;
    case 'string':
      label = `"${value}"`;
      break;
    case 'value':
      label = typeof value === 'boolean' ? `<${value}>` : Number(value);
      break;
    case 'boolean':
      label = `<${value}>`;
      break;
    default:
      label = TokenToString(token);
  }
  // blank line? Just emit a line space
  if (label === '') {
    return <GBlankLine />;
  }
  let classes = selected
    ? 'gwiz gtoken styleOpen selected'
    : 'gwiz gtoken styleOpen';
  // special types? use additional classes
  if (type === 'identifier' && position === 0) classes += ' styleKey';
  if (type === 'comment') classes += ' styleComment';
  if (type === 'directive') classes += ' stylePragma';
  if (SPECIAL_IDENTS.includes(label)) classes += ' stylePragma';
  if (SPECIAL_KEYWORDS.includes(label)) classes += ' styleDefine';
  if (CONDITION_KEYWORDS.includes(label)) classes += ' styleCond';
  classes += ` ${type}Type`;
  // if not, emit the token element
  return (
    <div className={classes} data-key={tokenKey}>
      {label}
    </div>
  );
}

/// LABEL TOKEN ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GLabelToken(props) {
  const { name } = props;
  return (
    <div
      className="gwiz gtoken"
      role="none"
      style={{
        backgroundColor: '#003b76e0',
        color: 'white',
        fontWeight: 'bold',
        minWidth: '100px'
      }}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        console.log(e.target.name);
      }}
    >
      {name}
    </div>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function GSymbolToken(props) {
  const { symbolType, choice, unitText } = props;
  const cnames = ['gwiz', 'gtoken', 'clickable'];
  if (choice === unitText) cnames.push('chosen');

  const token = `${symbolType}-${choice}`;
  return (
    <div className={cnames.join(' ')} data-choice={token}>
      {choice}
    </div>
  );
}

/// EXPORTS ///////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export { GLine, GBlankLine };
export { GToken, GLabelToken, GSymbolToken };
export { GridStack, FlexStack, StackUnit, StackText };
