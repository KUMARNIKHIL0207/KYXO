export function renderHome(): HTMLElement {
  const root = document.createElement('main');
  root.className = 'app-shell';

  const hero = document.createElement('section');
  hero.className = 'home-card';

  const badge = document.createElement('div');
  badge.className = 'status-inline';
  badge.textContent = 'LOCAL • P2P • E2E';

  const title = document.createElement('h1');
  title.textContent = 'KYXO';

  const subtitle = document.createElement('p');
  subtitle.className = 'eyebrow';
  subtitle.textContent = 'KYELESS YIELD XFER OFFLINE';

  const actions = document.createElement('div');
  actions.className = 'action-row';

  const sendButton = document.createElement('button');
  sendButton.type = 'button';
  sendButton.className = 'primary-btn';
  sendButton.textContent = 'SEND FILE';

  const receiveButton = document.createElement('button');
  receiveButton.type = 'button';
  receiveButton.className = 'secondary-btn';
  receiveButton.textContent = 'RECEIVE FILE';

  const settingsButton = document.createElement('button');
  settingsButton.type = 'button';
  settingsButton.className = 'tertiary-btn';
  settingsButton.textContent = 'SETTINGS';

  actions.append(sendButton, receiveButton, settingsButton);

  const info = document.createElement('div');
  info.className = 'info-panel';
  info.innerHTML = `
    <p><strong>Mode:</strong> Local-first transfer</p>
    <p><strong>Security:</strong> Browser-based pairing only</p>
    <p><strong>Scope:</strong> Same Wi‑Fi, hotspot, or LAN</p>
  `;

  hero.append(badge, title, subtitle, actions, info);
  root.appendChild(hero);

  return root;
}
