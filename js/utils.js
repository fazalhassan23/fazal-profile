window.PortfolioUtils = {
  escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },
  LINKEDIN_SVG_PATH: `M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.8v8h2.8v-4.87c0-.26.05-.5.14-.68a1 1 0 0 1 .93-.68c.72 0 .88.61.88 1.5v4.73zm-11.25-9H10.1v-8H7.25zM8.65 4.25a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z`,
  GITHUB_SVG_PATH: `M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z`,
  getLinkedInSvg(size = 15) {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true" style="display:inline-block;vertical-align:middle;flex-shrink:0;"><path d="${this.LINKEDIN_SVG_PATH}"/></svg>`;
  },
  getGitHubSvg(size = 15) {
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true" style="display:inline-block;vertical-align:middle;flex-shrink:0;"><path d="${this.GITHUB_SVG_PATH}"/></svg>`;
  }
};
