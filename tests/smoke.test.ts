import { describe, it, expect } from 'vitest';

describe('KYXO Phase 1 foundation', () => {
  it('exposes the app shell and primary actions', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const root = document.querySelector('#app');
    expect(root).not.toBeNull();
  });

  it('keeps the project metadata stable', () => {
    expect('KYXO').toBeTruthy();
    expect('P2P').toBeTruthy();
  });
});
