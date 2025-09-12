// Initialize Supabase
try {
  const supabase = window.supabase.createClient(
    'https://anzrbwcextohaatvwvvh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuenJid2NleHRvaGFhdHZ3dnZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NjE2NDgsImV4cCI6MjA3MzIzNzY0OH0.DSJBwubiIAqEXDqVZMuJLUrsgY9vBKDQuPQBPIItHuw'
  );
  console.log('Supabase client initialized:', supabase);

  // DOM Elements
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const fullNameInput = document.getElementById('fullName');
  const signUpBtn = document.getElementById('signUpBtn');
  const signInBtn = document.getElementById('signInBtn');
  const signOutBtn = document.getElementById('signOutBtn');
  const statusMessage = document.getElementById('status-message');
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  const authForm = document.getElementById('auth-form');
  const signedInState = document.getElementById('signed-in-state');
  const userEmail = document.getElementById('user-email');
  const modeText = document.getElementById('mode-text');
  const modeLink = document.getElementById('mode-link');
  const nameField = document.getElementById('name-field');
  const subtitle = document.querySelector('.subtitle');

  let isSignUpMode = false;

  // UI Helpers
  function setStatus(message, type = 'info', duration = 5000) {
    if (!statusMessage) {
      console.error("statusMessage element is null");
      return;
    }
    statusMessage.textContent = message;
    statusMessage.className = `status-message show status-${type}`;
    setTimeout(() => {
      statusMessage.classList.remove('show');
    }, duration);
  }

  function showLoading(text = 'Processing...') {
    if (!loadingText || !loadingOverlay) {
      console.error("Loading elements missing:", { loadingText, loadingOverlay });
      return;
    }
    loadingText.textContent = text;
    loadingOverlay.classList.add('show');
  }

  function hideLoading() {
    if (!loadingOverlay) {
      console.error("loadingOverlay is null");
      return;
    }
    loadingOverlay.classList.remove('show');
  }

  function showSignedInState(session) {
    if (!authForm || !signedInState || !userEmail) {
      console.error("DOM elements missing:", { authForm, signedInState, userEmail });
      setStatus("UI error: Required elements not found.", "error");
      return;
    }
    authForm.style.display = 'none';
    signedInState.style.display = 'block';
    userEmail.textContent = session.user.email;
  }

  function showAuthForm() {
    if (!authForm || !signedInState) {
      console.error("DOM elements missing:", { authForm, signedInState });
      setStatus("UI error: Required elements not found.", "error");
      return;
    }
    authForm.style.display = 'block';
    signedInState.style.display = 'none';
  }

  function validateInputs(email, password) {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setStatus('Please enter a valid email address.', 'error');
      return false;
    }
    if (!password || password.length < 6) {
      setStatus('Password must be at least 6 characters long.', 'error');
      return false;
    }
    return true;
  }

  function disableButtons(disabled) {
    if (signUpBtn) signUpBtn.disabled = disabled;
    if (signInBtn) signInBtn.disabled = disabled;
    if (signOutBtn) signOutBtn.disabled = disabled;
  }

  // Toggle Mode
  if (modeLink) {
    modeLink.addEventListener('click', (e) => {
      e.preventDefault();
      isSignUpMode = !isSignUpMode;

      if (isSignUpMode) {
        nameField.style.display = 'block';
        signInBtn.style.display = 'none';
        signUpBtn.style.display = 'flex';
        modeText.textContent = 'Already have an account? ';
        modeLink.textContent = 'Sign in';
        subtitle.textContent = 'Create your account';
      } else {
        nameField.style.display = 'none';
        signInBtn.style.display = 'flex';
        signUpBtn.style.display = 'none';
        modeText.textContent = "Don't have an account? ";
        modeLink.textContent = 'Create one';
        subtitle.textContent = 'Sign in to your account';
      }
    });
  }

  // Sign Up
  async function signUp() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const fullName = fullNameInput.value.trim();

    if (!validateInputs(email, password)) return;
    if (!fullName) {
      setStatus("Please enter your full name.", "error");
      return;
    }

    disableButtons(true);
    showLoading("Creating your account...");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/templates/onboarding.html',
          data: { full_name: fullName }
        }
      });
      if (error) throw error;

      setStatus("Account created! Redirecting to onboarding...", "success", 8000);
      setTimeout(() => {
        window.location.href = "../templates/onboarding.html";
      }, 1500);

      fullNameInput.value = "";
      emailInput.value = "";
      passwordInput.value = "";
    } catch (err) {
      console.error("Sign-up error:", err);
      setStatus(`Sign up failed: ${err.message}`, "error");
    } finally {
      disableButtons(false);
      hideLoading();
    }
  }

  // Sign In
  async function signIn() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!validateInputs(email, password)) return;

    disableButtons(true);
    showLoading("Signing you in...");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;

      setStatus("Successfully signed in! Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "../templates/home.html";
      }, 1500);
    } catch (err) {
      console.error("Sign-in error:", err);
      setStatus(`Sign in failed: ${err.message}`, "error");
    } finally {
      disableButtons(false);
      hideLoading();
    }
  }

  // Sign Out
  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setStatus("Successfully signed out!", "success");
    } catch (err) {
      console.error("Sign-out error:", err);
      setStatus(`Sign out failed: ${err.message}`, "error");
    }
  }

  // Event Listeners
  if (signInBtn) signInBtn.addEventListener("click", signIn);
  if (signUpBtn) signUpBtn.addEventListener("click", signUp);
  if (signOutBtn) signOutBtn.addEventListener("click", signOut);

  [emailInput, passwordInput, fullNameInput].forEach((input) => {
    if (input) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          if (isSignUpMode) {
            signUp();
          } else {
            signIn();
          }
        }
      });
    }
  });

  // Session Check and Onboarding Status
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (session) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('job_title')
          .eq('id', session.user.id)
          .single();
        if (error) throw error;

        if (data?.job_title) {
          setStatus(`Welcome back, ${session.user.email}! Redirecting to home...`, "success");
          setTimeout(() => {
            window.location.href = "../templates/home.html";
          }, 1500);
        } else {
          setStatus(`Welcome, ${session.user.email}! Redirecting to onboarding...`, "success");
          setTimeout(() => {
            window.location.href = "../templates/onboarding.html";
          }, 1500);
        }
        showSignedInState(session);
      } catch (err) {
        console.error('Profile check error:', err);
        setStatus(`Error checking profile: ${err.message}`, "error");
      }
    } else {
      showAuthForm();
      setStatus("Please sign in to continue.", "info");
    }
  });

  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Auth state changed:", event, session);
    if (event === "SIGNED_IN" && session) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('job_title')
          .eq('id', session.user.id)
          .single();
        if (error) throw error;

        if (data?.job_title) {
          setStatus(`Welcome back, ${session.user.email}! Redirecting to home...`, "success");
          window.location.href = "../templates/home.html";
        } else {
          setStatus(`Welcome, ${session.user.email}! Redirecting to onboarding...`, "success");
          window.location.href = "../templates/onboarding.html";
        }
        showSignedInState(session);
      } catch (err) {
        console.error('Profile check error:', err);
        setStatus(`Error checking profile: ${err.message}`, "error");
        window.location.href = "../templates/onboarding.html";
      }
    } else if (event === "SIGNED_OUT") {
      showAuthForm();
      setStatus("You have been signed out.", "info");
    }
  });
} catch (err) {
  console.error('Supabase client initialization failed:', err);
}