export interface PairingCardOptions {
  title: string;
  subtitle: string;
  statusText: string;
  qrData?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function renderPairingCard(options: PairingCardOptions): HTMLElement {
  const card = document.createElement('section');
  card.className = 'pairing-card';

  const heading = document.createElement('h2');
  heading.textContent = options.title;

  const status = document.createElement('p');
  status.className = 'pairing-status';
  status.textContent = options.statusText;

  const subtitle = document.createElement('p');
  subtitle.className = 'pairing-subtitle';
  subtitle.textContent = options.subtitle;

  const qrWrap = document.createElement('div');
  qrWrap.className = 'qr-wrap';
  if (options.qrData) {
    const img = document.createElement('img');
    img.src = options.qrData;
    img.alt = 'KYXO pairing QR code';
    qrWrap.appendChild(img);
  } else {
    qrWrap.innerHTML = '<div class="qr-placeholder">QR</div>';
  }

  const note = document.createElement('p');
  note.className = 'info-note';
  note.textContent = options.message ?? 'Session expires in 60 seconds.';

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'primary-btn';
  action.textContent = options.actionLabel ?? 'Continue';
  if (options.onAction) {
    action.addEventListener('click', options.onAction);
  }

  card.append(heading, status, subtitle, qrWrap, note, action);
  return card;
}
