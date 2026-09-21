import './styles.css';
import { renderHome } from './ui/home';

const app = document.querySelector('#app');

if (!app) {
  throw new Error('App root element not found');
}

app.innerHTML = '';
app.appendChild(renderHome());
