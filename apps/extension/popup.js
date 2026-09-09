// Comitai LinkedIn extension — popup UI logic. Talks to background.js via
// runtime messages; never calls the API directly (see background.js for why).

function sendMessage(message) {
  return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
}

const loggedOutView = document.getElementById('loggedOutView');
const loggedInView = document.getElementById('loggedInView');
const loginError = document.getElementById('loginError');
const userEmail = document.getElementById('userEmail');
const apiBaseInput = document.getElementById('apiBase');

async function render() {
  const status = await sendMessage({ type: 'GET_STATUS' });
  loggedOutView.hidden = status.loggedIn;
  loggedInView.hidden = !status.loggedIn;
  if (status.loggedIn) userEmail.textContent = status.user.email;

  const { apiBase } = await sendMessage({ type: 'GET_API_BASE' });
  apiBaseInput.value = apiBase;
}

document.getElementById('loginButton').addEventListener('click', async () => {
  loginError.hidden = true;
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const result = await sendMessage({ type: 'LOGIN', email, password });
  if (!result.success) {
    loginError.textContent = result.error || 'Login falhou.';
    loginError.hidden = false;
    return;
  }
  await render();
});

document.getElementById('logoutButton').addEventListener('click', async () => {
  await sendMessage({ type: 'LOGOUT' });
  await render();
});

document.getElementById('saveApiBase').addEventListener('click', async () => {
  await sendMessage({ type: 'SET_API_BASE', apiBase: apiBaseInput.value.trim() });
});

render();
