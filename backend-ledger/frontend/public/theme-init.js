// Apply the saved (or system) theme before React loads, so the page never flashes the wrong theme
(function () {
  try {
    var saved = localStorage.getItem('theme');
    var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch {
    // Storage can be blocked in some private modes; the page then starts in the light theme
  }
})();
