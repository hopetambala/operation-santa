// Tab and dialog keyboard decisions. Pure so tests can run them without the desktop shell.

type TabStop = {focus: () => void; click: () => void};

/** Automatic tab activation: arrows move and select, Home and End jump, anything else is ignored. */
export function activateTab(e: {key: string; preventDefault: () => void; tabs: readonly TabStop[]; hit: TabStop | null}) {
  const key = e.key;
  if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Home' && key !== 'End') return;
  const i = e.hit ? e.tabs.indexOf(e.hit) : -1;
  if (i < 0) return;
  e.preventDefault();
  const next = key === 'Home' ? e.tabs[0] : key === 'End' ? e.tabs[e.tabs.length - 1] : e.tabs[(i + (key === 'ArrowRight' ? 1 : -1) + e.tabs.length) % e.tabs.length];
  next?.focus();
  next?.click();
}

/**
 * Index Tab should move to inside a dialog.
 * null: the browser's own move stays inside the dialog.
 * -1: nothing is tabbable, so keep focus where it is.
 * The dialog node itself is not a stop. Shift+Tab from it used to leave the window.
 */
export function dialogTabStop(shift: boolean, onDialog: boolean, inside: boolean, index: number, count: number): number | null {
  if (count === 0) return -1;
  const last = count - 1;
  if (shift && (onDialog || !inside || index <= 0)) return last;
  if (!shift && (onDialog || !inside || index < 0 || index === last)) return 0;
  return null;
}
