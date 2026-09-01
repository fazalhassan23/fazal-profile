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
  LINKEDIN_SVG_PATH: `M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.8v8h2.8v-4.87c0-.26.05-.5.14-.68a1 1 0 0 1 .93-.68c.72 0 .88.61.88 1.5v4.73zm-11.25-9H10.1v-8H7.25zM8.65 4.25a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z`
};
