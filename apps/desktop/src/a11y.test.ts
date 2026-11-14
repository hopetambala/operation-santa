import {describe, expect, it} from 'vitest';
import {activateTab, dialogTabStop} from './a11y';

function tabs(labels: string[]) {
  const state = {focused: '', clicked: ''};
  const stops = labels.map(label => ({
    label,
    focus() { state.focused = label; },
    click() { state.clicked = label; },
  }));
  return {state, stops};
}

describe('tab lists', () => {
  it('ArrowRight activates the next tab and wraps', () => {
    const {state, stops} = tabs(['Review', 'Uploads', 'Approved']);
    const prevented = {value: false};
    activateTab({key: 'ArrowRight', preventDefault() { prevented.value = true; }, tabs: stops, hit: stops[2]});
    expect(prevented.value).toBe(true);
    expect(state.focused).toBe('Review');
    expect(state.clicked).toBe('Review');
  });
  it('ArrowLeft wraps from the first tab to the last', () => {
    const {state, stops} = tabs(['Review', 'Uploads']);
    activateTab({key: 'ArrowLeft', preventDefault() {}, tabs: stops, hit: stops[0]});
    expect(state.clicked).toBe('Uploads');
  });
  it('Home and End jump to the ends', () => {
    const {state, stops} = tabs(['Review', 'Uploads', 'Approved']);
    activateTab({key: 'Home', preventDefault() {}, tabs: stops, hit: stops[2]});
    expect(state.clicked).toBe('Review');
    activateTab({key: 'End', preventDefault() {}, tabs: stops, hit: stops[0]});
    expect(state.clicked).toBe('Approved');
  });
  it('ignores keys that are not arrows, Home, or End, and a target that is not a tab', () => {
    const {state, stops} = tabs(['Review', 'Uploads']);
    const prevented = {value: false};
    activateTab({key: 'Enter', preventDefault() { prevented.value = true; }, tabs: stops, hit: stops[0]});
    activateTab({key: 'ArrowRight', preventDefault() { prevented.value = true; }, tabs: stops, hit: null});
    expect(prevented.value).toBe(false);
    expect(state.clicked).toBe('');
  });
});

describe('dialog focus trap', () => {
  it('sends Tab from the dialog shell to the first stop and Shift+Tab to the last', () => {
    expect(dialogTabStop(false, true, false, -1, 3)).toBe(0);
    expect(dialogTabStop(true, true, false, -1, 3)).toBe(2);
  });
  it('wraps at the ends and leaves a middle stop to the browser', () => {
    expect(dialogTabStop(false, false, true, 2, 3)).toBe(0);
    expect(dialogTabStop(true, false, true, 0, 3)).toBe(2);
    expect(dialogTabStop(false, false, true, 1, 3)).toBeNull();
    expect(dialogTabStop(true, false, true, 1, 3)).toBeNull();
  });
  it('pulls focus back when it has left the dialog, and stays put when nothing is tabbable', () => {
    expect(dialogTabStop(false, false, false, -1, 3)).toBe(0);
    expect(dialogTabStop(true, false, false, -1, 3)).toBe(2);
    expect(dialogTabStop(false, true, false, -1, 0)).toBe(-1);
  });
});
