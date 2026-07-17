import '@testing-library/jest-dom';
// axe-core may be used directly in tests for accessibility assertions
import 'axe-core';

// Ensure jsdom has a document title and html lang for axe checks
if (typeof document !== 'undefined') {
	// Ensure there's a <title> element for axe's document-title rule
	if (!document.title) document.title = 'Prompt Wars Dashboard';
	if (document.head && !document.head.querySelector('title')) {
		const t = document.createElement('title');
		t.textContent = document.title || 'Prompt Wars Dashboard';
		document.head.appendChild(t);
	}
	if (document.documentElement && !document.documentElement.lang) document.documentElement.lang = 'en';

	// Force a robust canvas getContext mock to avoid jsdom "Not implemented" errors when axe queries canvases
	try {
		if (typeof HTMLCanvasElement !== 'undefined') {
			HTMLCanvasElement.prototype.getContext = HTMLCanvasElement.prototype.getContext || function () {
				return {
					getImageData: () => ({ data: [] }),
					putImageData: () => {},
					createImageData: () => ({ width: 0, height: 0, data: [] }),
				};
			};
		}
	} catch (e) {
		// ignore in environments where HTMLCanvasElement is unavailable
	}
}
