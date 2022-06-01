/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/*///////////////////////////////// ABOUT \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*\

  Global Style Objects for all Wizard React Elements
  Includes both style objects and building-block components

  note that the component styling in DevWizard uses PICO CSS as a base,
  so review that library as you adjust styles. Our master PICO CSS file
  is a copy of the official one and is located in src/lib/vendor

\*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ * /////////////////////////////////////*/

import React from 'react';
import { UnpackToken, TokenValue } from 'script/tools/script-tokenizer';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const BG_COL = '#ddd';
const PAD = '10px';
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

/// LAYOUT CSS ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const sGrid = {
  display: 'grid',
  width: '100vw',
  height: '100vh',
  gridTemplateRows: 'auto 1fr auto',
  gridTemplateColumns: '50% auto' // force
};
export const sHead = {
  gridColumn: '1 / 3',
  // extra styling
  padding: PAD,
  backgroundColor: BG_COL
};
export const sLeft = {
  gridColumn: '1 / 2',
  // extra styling
  boxSizing: 'border-box',
  overflowY: 'hidden',
  overflowX: 'none',
  // grid
  display: 'grid',
  gridTemplateRows: '1fr auto' // view+editor stack
};
export const sRight = {
  gridColumn: '2 / 3',
  // extra styling
  whiteSpace: 'pre',
  overflowY: 'scroll',
  overflowX: 'none'
};
export const sFoot = {
  gridColumn: '1 / 3',
  // extra styling
  padding: PAD,
  backgroundColor: BG_COL
};

/// GRID LAYOUT CSS ///////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const sButtonGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
  gap: '10px'
};
export const sButtonBreak = {
  gridColumnStart: 1
};

/// LEFT: SCRIPT VIEW /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const sScriptView = {
  overflowY: 'scroll',
  overflowX: 'none',
  whiteSpace: 'nowrap'
};

/// LEFT: SCRIPT UNIT EDITOR //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const sScriptUnitEditor = {
  backgroundColor: 'rgba(255, 166, 0, 0.10)',
  padding: '10px'
};

/// RIGHT: SCRIPT TEXT EDITOR /////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const sScriptText = {
  fontSize: '12px',
  lineHeight: 1,
  whiteSpace: 'pre-line',
  // background appearance
  margin: 0,
  borderRadius: 0,
  backgroundColor: '#2d2d2d'
};

/// ERROR BOX STYLING CSS /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const sError = {
  textAlign: 'right',
  backgroundColor: 'red',
  color: 'white'
};

/// UPPER RIGHT BUTTON CONSOLE STYLING CSS ////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const sButtonConsole = {
  position: 'absolute',
  right: '8px',
  top: '8px',
  height: '50px',
  display: 'inline-flex',
  flexDirection: 'row',
  gap: '8px'
};
/// INPUT ELEMENT STYLING /////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export const buttonStyle = {
  whiteSpace: 'nowrap',
  margin: 0
};

/// COMPONENT MANAGEMENT //////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
/** contains full-width Stackables */
export function FlexStack(props) {
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
export function GridStack(props) {
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
export function StackUnit(props) {
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
export function StackText(props) {
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
export function GBlankLine() {
  return <div className="gwiz gtoken">&nbsp;</div>;
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GLineNum(props) {
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
export function GLine(props) {
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
export function GToken(props) {
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
      label = TokenValue(token);
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

/** tokens displayed in the SelectEditorLineSlot */
export function GValidationToken(props) {
  const { tokenKey, position, selected, type, label, viewState, isSlot } = props;
  let classes = selected
    ? 'gwiz gtoken styleOpen selected'
    : 'gwiz gtoken styleOpen';
  // special types? use additional classes
  if (type === 'identifier' && dataSelectKey === 0) classes += ' styleKey';
  if (type === 'comment') classes += ' styleComment';
  if (type === 'directive') classes += ' stylePragma';
  if (SPECIAL_IDENTS.includes(label)) classes += ' stylePragma';
  if (SPECIAL_KEYWORDS.includes(label)) classes += ' styleDefine';
  if (CONDITION_KEYWORDS.includes(label)) classes += ' styleCond';
  // set expected data type color, but overriden by viewState
  classes += ` ${type}Type`;
  // slot-specific viewState overrides TValidationErrorCodes
  if (viewState === 'valid') classes += ''; // no style change
  if (viewState === 'invalid') classes += ' styleFlagInvalid';
  if (viewState === 'extra') classes += ' styleFlagInvalid';
  if (viewState === 'empty') classes += ' styleFlagEmpty';
  if (viewState === 'vague') classes += ' styleFlagDisabled';
  if (viewState === 'unexpected')
    classes += ' styleFlagInvalid styleFlagOverflow';
  return (
    <div className={classes} data-slotkey={dataSelectKey}>
      {label}
    </div>
  );
}

/// LABEL TOKEN ////////////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GLabelToken(props) {
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
        console.log(e.target['data-key']);
      }}
    >
      {name}
    </div>
  );
}
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
export function GSymbolToken(props) {
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
