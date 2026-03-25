/**
 * SCS Platform - Join Form
 * Handles form submission states: idle, transmitting, received
 */

(function() {
  'use strict';

  const joinBtn = document.getElementById('join-btn');
  const joinForm = document.getElementById('join-form');

  if (!joinBtn || !joinForm) return;

  // Form states
  const STATE_IDLE = 'idle';
  const STATE_TRANSMITTING = 'transmitting';
  const STATE_RECEIVED = 'received';

  let currentState = STATE_IDLE;
  let stateTimeout = null;

  function setButtonState(state) {
    // Clear any existing timeout
    if (stateTimeout) {
      clearTimeout(stateTimeout);
      stateTimeout = null;
    }

    // Remove all state classes
    joinBtn.classList.remove('state-idle', 'state-transmitting', 'state-received');

    currentState = state;

    switch (state) {
      case STATE_IDLE:
        joinBtn.classList.add('state-idle');
        joinBtn.innerHTML = '⟩ TRANSMIT APPLICATION';
        joinBtn.disabled = false;
        break;

      case STATE_TRANSMITTING:
        joinBtn.classList.add('state-transmitting');
        joinBtn.innerHTML = '⟩ TRANSMITTING...';
        joinBtn.disabled = true;
        break;

      case STATE_RECEIVED:
        joinBtn.classList.add('state-received');
        joinBtn.innerHTML = '⟩ RECEIVED. STANDBY.';
        joinBtn.disabled = true;
        // Return to idle after 5 seconds
        stateTimeout = setTimeout(() => {
          setButtonState(STATE_IDLE);
        }, 5000);
        break;
    }
  }

  // Form submission handler
  joinForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get form data
    const alias = joinForm.querySelector('#alias')?.value;
    const email = joinForm.querySelector('#email')?.value;
    const interest = joinForm.querySelector('#interest')?.value;
    const message = joinForm.querySelector('#message')?.value;

    // Basic validation
    if (!alias || !email || !interest) {
      showMessage('Please fill in all required fields', 'error');
      return;
    }

    // Show transmitting state
    setButtonState(STATE_TRANSMITTING);

    // Simulate form submission (1.2 seconds)
    setTimeout(() => {
      // Show success message
      showMessage('Application received! We will contact you soon.', 'success');

      // Set button to received state
      setButtonState(STATE_RECEIVED);

      // Reset form
      joinForm.reset();

    }, 1200);
  });

  // Show/hide message
  function showMessage(text, type) {
    const messageEl = joinForm.querySelector('.form-message');
    if (!messageEl) return;

    messageEl.textContent = text;
    messageEl.className = 'form-message';
    messageEl.classList.add(type);
    messageEl.style.display = 'block';

    // Hide after 5 seconds
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 5000);
  }

  // Add click handler to button
  joinBtn.addEventListener('click', () => {
    if (currentState === STATE_IDLE) {
      joinForm.dispatchEvent(new Event('submit'));
    }
  });

})();
