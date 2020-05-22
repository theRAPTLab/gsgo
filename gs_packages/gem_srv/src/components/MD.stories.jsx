import React from 'react';
import { MD } from './MD';

export default { title: 'Wireframe/Markdown', component: MD };

export const description = () => (
  <MD>markdown text **rendered** as _expected_</MD>
);
export const byBlock = () => <MD source="markdown text" />;
export const byNesting = () => <MD>markdown text</MD>;
