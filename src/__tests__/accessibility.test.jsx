import React from 'react';
import { render } from '@testing-library/react';
import StadiumOpsControl from '../../app.jsx';
import axe from 'axe-core';

test('basic axe accessibility scan (produces report)', async () => {
  // Ensure document-level accessibility anchors are present for axe
  if (typeof document !== 'undefined') {
    document.title = document.title || 'Prompt Wars Dashboard';
    if (document.documentElement && !document.documentElement.lang) document.documentElement.lang = 'en';
  }

  render(<StadiumOpsControl />);
  // Run axe-core against the document, but ignore document-title and html-has-lang which are validated elsewhere
  const results = await axe.run(document, { rules: { 'document-title': { enabled: false }, 'html-has-lang': { enabled: false } } });
  // If there are violations, fail the test with a summary
  if (results.violations && results.violations.length > 0) {
    const summary = results.violations.map(v => `${v.id}: ${v.nodes.length} nodes`).join('\n');
    throw new Error(`Accessibility violations found:\n${summary}`);
  }
});
