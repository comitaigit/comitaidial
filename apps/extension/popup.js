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
const pendingActionsEmpty = document.getElementById('pendingActionsEmpty');
const pendingActionsList = document.getElementById('pendingActionsList');

const ACTION_TYPE_LABELS = {
  LINKEDIN_CONNECT: 'Conectar',
  LINKEDIN_MESSAGE: 'Mensagem',
};

function actionContentText(action) {
  if (action.type === 'LINKEDIN_CONNECT') {
    return action.payload?.note || '(sem nota — só o convite padrão)';
  }
  return action.payload?.message || '(sem conteúdo gerado)';
}

// Renders each pending LINKEDIN_CONNECT/LINKEDIN_MESSAGE Action as a card:
// the BDR opens the person's profile, performs the action THEMSELVES using
// LinkedIn's own UI (this extension never clicks it for them — see
// apps/extension/AGENTS.md on why), then confirms with "Feito"/"Pular".
async function loadPendingActions() {
  const response = await sendMessage({ type: 'GET_PENDING_LINKEDIN_ACTIONS' });
  const actions =
    response.success && Array.isArray(response.result) ? response.result : [];

  pendingActionsList.innerHTML = '';
  pendingActionsEmpty.hidden = actions.length > 0;

  for (const action of actions) {
    const card = document.createElement('div');
    card.className = 'action-card';

    const typeEl = document.createElement('div');
    typeEl.className = 'action-type';
    typeEl.textContent = ACTION_TYPE_LABELS[action.type] || action.type;
    card.appendChild(typeEl);

    const personEl = document.createElement('div');
    personEl.className = 'action-person';
    if (action.person?.linkedinUrl) {
      const link = document.createElement('a');
      link.href = action.person.linkedinUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = action.person.name;
      personEl.appendChild(link);
    } else {
      personEl.textContent = action.person?.name || 'Contato';
    }
    card.appendChild(personEl);

    const contentEl = document.createElement('div');
    contentEl.className = 'action-content';
    contentEl.textContent = actionContentText(action);
    card.appendChild(contentEl);

    const buttonsEl = document.createElement('div');
    buttonsEl.className = 'action-buttons';

    const doneButton = document.createElement('button');
    doneButton.className = 'done';
    doneButton.textContent = 'Feito';
    doneButton.addEventListener('click', async () => {
      await sendMessage({
        type: 'COMPLETE_LINKEDIN_ACTION',
        actionId: action.id,
      });
      await loadPendingActions();
    });

    const skipButton = document.createElement('button');
    skipButton.className = 'secondary';
    skipButton.textContent = 'Pular';
    skipButton.addEventListener('click', async () => {
      await sendMessage({ type: 'SKIP_LINKEDIN_ACTION', actionId: action.id });
      await loadPendingActions();
    });

    buttonsEl.appendChild(doneButton);
    buttonsEl.appendChild(skipButton);
    card.appendChild(buttonsEl);

    pendingActionsList.appendChild(card);
  }
}

async function render() {
  const status = await sendMessage({ type: 'GET_STATUS' });
  loggedOutView.hidden = status.loggedIn;
  loggedInView.hidden = !status.loggedIn;
  if (status.loggedIn) {
    userEmail.textContent = status.user.email;
    await loadPendingActions();
  }

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
