const REQUIRED_ORIGINS = [
  '*://*.taobao.com/*',
  '*://*.tmall.com/*',
  '*://*.weidian.com/*',
  '*://*.1688.com/*',
  '*://*.cnfans.com/*',
  '*://*.acbuy.com/*',
  '*://*.oopbuy.com/*',
];

const extensionApi = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);

function containsPermissions() {
  if (!extensionApi || !extensionApi.permissions || typeof extensionApi.permissions.contains !== 'function') {
    return Promise.resolve(true);
  }

  const result = extensionApi.permissions.contains({ origins: REQUIRED_ORIGINS });
  if (result && typeof result.then === 'function') {
    return result;
  }

  return new Promise((resolve) => {
    extensionApi.permissions.contains({ origins: REQUIRED_ORIGINS }, resolve);
  });
}

function requestPermissions() {
  if (!extensionApi || !extensionApi.permissions || typeof extensionApi.permissions.request !== 'function') {
    return Promise.resolve(false);
  }

  const result = extensionApi.permissions.request({ origins: REQUIRED_ORIGINS });
  if (result && typeof result.then === 'function') {
    return result;
  }

  return new Promise((resolve) => {
    extensionApi.permissions.request({ origins: REQUIRED_ORIGINS }, resolve);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const panel = document.getElementById('permission-panel');
  const button = document.getElementById('grant-access');
  const message = document.getElementById('permission-message');

  if (!panel || !button || !message) {
    return;
  }

  const showMessage = (text, isError = false) => {
    message.textContent = text;
    message.classList.remove('hidden');
    message.style.color = isError ? '#d0342c' : '#1a7f37';
  };

  try {
    const hasPermissions = await containsPermissions();
    if (!hasPermissions) {
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  } catch (error) {
    panel.classList.remove('hidden');
    showMessage('Unable to verify permissions. Please try granting access.', true);
  }

  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Requesting…';
    message.classList.add('hidden');
    message.textContent = '';

    try {
      const granted = await requestPermissions();
      if (granted) {
        panel.classList.remove('hidden');
        showMessage('Access granted! Return to Safari to start shopping with Hauler.', false);
        button.textContent = 'Grant Access';
        button.classList.add('hidden');
      } else {
        showMessage('Access was not granted. You can try again when you are ready.', true);
      }
    } catch (error) {
      showMessage('Something went wrong while requesting access. Please try again.', true);
    } finally {
      if (!button.classList.contains('hidden')) {
        button.disabled = false;
        button.textContent = 'Grant Access';
      }
    }
  });
});
