// Initialize Supabase
try {
  const supabase = window.supabase.createClient(
    'https://anzrbwcextohaatvwvvh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuenJid2NleHRvaGFhdHZ3dnZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NjE2NDgsImV4cCI6MjA3MzIzNzY0OH0.DSJBwubiIAqEXDqVZMuJLUrsgY9vBKDQuPQBPIItHuw'
  );

  // DOM Elements
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const fullNameInput = document.getElementById('fullName');
  const rememberMeCheckbox = document.getElementById('rememberMe');
  const signUpBtn = document.getElementById('signUpBtn');
  const signInBtn = document.getElementById('signInBtn');
  const signOutBtn = document.getElementById('signOutBtn');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const resendEmailBtn = document.getElementById('resendEmailBtn');
  const statusMessage = document.getElementById('status-message');
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  const authForm = document.getElementById('auth-form');
  const forgotPasswordForm = document.getElementById('forgot-password-form');
  const signedInState = document.getElementById('signed-in-state');
  const userEmail = document.getElementById('user-email');
  const modeText = document.getElementById('mode-text');
  const modeLink = document.getElementById('mode-link');
  const nameField = document.getElementById('name-field');
  const subtitle = document.querySelector('.subtitle');

  let isSignUpMode = false;
  let isForgotPasswordMode = false;
  let lastSignUpEmail = '';
  let sessionTimeoutTimer = null;
  let sessionWarningTimer = null;
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const SESSION_WARNING = 25 * 60 * 1000; // 25 minutes (5 min warning)

  // Session Activity Tracking
  function resetSessionTimeout() {
    if (sessionTimeoutTimer) clearTimeout(sessionTimeoutTimer);
    if (sessionWarningTimer) clearTimeout(sessionWarningTimer);
    
    // Set warning timer (5 minutes before timeout)
    sessionWarningTimer = setTimeout(() => {
      showSessionWarning();
    }, SESSION_WARNING);
    
    // Set timeout timer
    sessionTimeoutTimer = setTimeout(() => {
      handleSessionTimeout();
    }, SESSION_TIMEOUT);
  }

  function showSessionWarning() {
    if (confirm('⏰ Your session will expire in 5 minutes due to inactivity. Click OK to stay signed in.')) {
      resetSessionTimeout();
      setStatus('✅ Session extended!', 'success', 3000);
    }
  }

  async function handleSessionTimeout() {
    setStatus('⏰ Your session has expired due to inactivity. Please sign in again.', 'info', 8000);
    await signOut();
  }

  // Track user activity
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, () => {
      if (document.getElementById('signed-in-state').style.display === 'block') {
        resetSessionTimeout();
      }
    });
  });

  // UI Helpers
  function setStatus(message, type = 'info', duration = 5000) {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.className = `status-message show status-${type}`;
    setTimeout(() => statusMessage.classList.remove('show'), duration);
  }

  function showLoading(text = 'Processing...') {
    if (!loadingText || !loadingOverlay) return;
    loadingText.textContent = text;
    loadingOverlay.classList.add('show');
  }

  function hideLoading() {
    if (!loadingOverlay) return;
    loadingOverlay.classList.remove('show');
  }

  function showSignedInState(session) {
    if (!authForm || !signedInState || !userEmail) return;
    authForm.style.display = 'none';
    forgotPasswordForm.style.display = 'none';
    signedInState.style.display = 'block';
    userEmail.textContent = session.user.email;
    
    // Show email verification status
    const verificationStatus = document.getElementById('verificationStatus');
    if (verificationStatus) {
      if (session.user.email_confirmed_at) {
        verificationStatus.innerHTML = '✅ <span style="color: #059669;">Email Verified</span>';
      } else {
        verificationStatus.innerHTML = '⚠️ <span style="color: #f59e0b;">Email Not Verified</span>';
      }
    }
    
    resetSessionTimeout();
  }

  function showAuthForm() {
    if (!authForm || !signedInState) return;
    authForm.style.display = 'block';
    forgotPasswordForm.style.display = 'none';
    signedInState.style.display = 'none';
    if (sessionTimeoutTimer) clearTimeout(sessionTimeoutTimer);
    if (sessionWarningTimer) clearTimeout(sessionWarningTimer);
  }

  function showForgotPasswordForm() {
    if (!forgotPasswordForm) return;
    authForm.style.display = 'none';
    forgotPasswordForm.style.display = 'block';
    signedInState.style.display = 'none';
    isForgotPasswordMode = true;
  }

  function validateInputs(email, password, fullName = null) {
    if (!email) {
      setStatus('📧 Please enter your email address.', 'error');
      emailInput?.focus();
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus('📧 Please enter a valid email address (e.g., name@example.com).', 'error');
      emailInput?.focus();
      return false;
    }
    if (password !== null) {
      if (!password) {
        setStatus('🔒 Please enter a password.', 'error');
        passwordInput?.focus();
        return false;
      }
      if (password.length < 6) {
        setStatus('🔒 Password must be at least 6 characters long.', 'error');
        passwordInput?.focus();
        return false;
      }
    }
    if (fullName !== null && !fullName.trim()) {
      setStatus('👤 Please enter your full name.', 'error');
      fullNameInput?.focus();
      return false;
    }
    return true;
  }

  function disableButtons(disabled) {
    if (signUpBtn) signUpBtn.disabled = disabled;
    if (signInBtn) signInBtn.disabled = disabled;
    if (signOutBtn) signOutBtn.disabled = disabled;
  }

  // Password Strength Checker
  function checkPasswordStrength(password) {
    let strength = 0;
    const feedback = [];

    if (password.length >= 8) {
      strength += 1;
      feedback.push('✓ Good length');
    } else {
      feedback.push('✗ Use 8+ characters');
    }

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      strength += 1;
      feedback.push('✓ Mixed case');
    } else {
      feedback.push('✗ Mix uppercase & lowercase');
    }

    if (/\d/.test(password)) {
      strength += 1;
      feedback.push('✓ Has numbers');
    } else {
      feedback.push('✗ Add numbers');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength += 1;
      feedback.push('✓ Has special characters');
    }

    return { strength, feedback };
  }

  // Password Toggle
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      togglePasswordBtn.textContent = type === 'password' ? '👁️' : '🙈';
      togglePasswordBtn.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
    });
  }

  // Password Strength Indicator
  if (passwordInput) {
    let strengthIndicator = document.getElementById('password-strength');
    
    passwordInput.addEventListener('input', (e) => {
      const password = e.target.value;
      if (!strengthIndicator && password.length > 0 && isSignUpMode) {
        strengthIndicator = document.createElement('div');
        strengthIndicator.id = 'password-strength';
        strengthIndicator.className = 'password-strength';
        passwordInput.parentElement.appendChild(strengthIndicator);
      }

      if (password.length > 0 && isSignUpMode && strengthIndicator) {
        const { strength } = checkPasswordStrength(password);
        const strengthText = ['Weak', 'Fair', 'Good', 'Strong'];
        const strengthClass = ['weak', 'fair', 'good', 'strong'];
        
        strengthIndicator.innerHTML = `
          <div class="strength-bar">
            <div class="strength-fill strength-${strengthClass[strength]}" style="width: ${(strength + 1) * 25}%"></div>
          </div>
          <div class="strength-text">Password strength: ${strengthText[strength] || 'Weak'}</div>
        `;
        strengthIndicator.style.display = 'block';
      } else if (strengthIndicator) {
        strengthIndicator.style.display = 'none';
      }
    });
  }

  // Email Validation
  if (emailInput) {
    emailInput.addEventListener('blur', (e) => {
      const email = e.target.value.trim();
      if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        emailInput.classList.add('input-error');
      } else {
        emailInput.classList.remove('input-error');
      }
    });

    emailInput.addEventListener('input', () => {
      emailInput.classList.remove('input-error');
    });
  }

  // Toggle Mode
  if (modeLink) {
    modeLink.addEventListener('click', (e) => {
      e.preventDefault();
      isSignUpMode = !isSignUpMode;
      statusMessage.classList.remove('show');

      if (isSignUpMode) {
        nameField.style.display = 'block';
        signInBtn.style.display = 'none';
        signUpBtn.style.display = 'flex';
        document.getElementById('rememberMeContainer').style.display = 'none';
        document.getElementById('forgotPasswordContainer').style.display = 'none';
        modeText.textContent = 'Already have an account? ';
        modeLink.textContent = 'Sign in';
        subtitle.textContent = 'Create your account';
        setStatus('👋 Welcome! Let\'s create your account.', 'info', 3000);
      } else {
        nameField.style.display = 'none';
        signInBtn.style.display = 'flex';
        signUpBtn.style.display = 'none';
        document.getElementById('rememberMeContainer').style.display = 'flex';
        document.getElementById('forgotPasswordContainer').style.display = 'block';
        modeText.textContent = "Don't have an account? ";
        modeLink.textContent = 'Create one';
        subtitle.textContent = 'Sign in to your account';
        setStatus('👋 Welcome back! Sign in to continue.', 'info', 3000);
        
        const strengthIndicator = document.getElementById('password-strength');
        if (strengthIndicator) strengthIndicator.style.display = 'none';
      }
    });
  }

  // Forgot Password
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      showForgotPasswordForm();
      setStatus('🔑 Enter your email to reset your password', 'info', 4000);
    });
  }

  // Back to Sign In from Forgot Password
  const backToSignInBtn = document.getElementById('backToSignIn');
  if (backToSignInBtn) {
    backToSignInBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showAuthForm();
      isForgotPasswordMode = false;
      setStatus('👋 Welcome back!', 'info', 2000);
    });
  }

  // Send Password Reset
  const sendResetBtn = document.getElementById('sendResetBtn');
  if (sendResetBtn) {
    sendResetBtn.addEventListener('click', async () => {
      const resetEmail = document.getElementById('resetEmail').value.trim();
      
      if (!resetEmail || !/^\S+@\S+\.\S+$/.test(resetEmail)) {
        setStatus('📧 Please enter a valid email address', 'error');
        return;
      }

      disableButtons(true);
      showLoading('📧 Sending reset link...');

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
          redirectTo: window.location.origin + '/templates/reset-password.html'
        });
        
        if (error) throw error;

        setStatus(`✅ Password reset link sent to ${resetEmail}!\n\nCheck your inbox and spam folder.`, 'success', 10000);
        document.getElementById('resetEmail').value = '';
        
        setTimeout(() => {
          showAuthForm();
          isForgotPasswordMode = false;
        }, 3000);
      } catch (err) {
        console.error('Password reset error:', err);
        setStatus(`❌ Failed to send reset email: ${err.message}`, 'error');
      } finally {
        disableButtons(false);
        hideLoading();
      }
    });
  }

  // Resend Confirmation Email
  if (resendEmailBtn) {
    resendEmailBtn.addEventListener('click', async () => {
      const email = lastSignUpEmail || emailInput.value.trim();
      
      if (!email) {
        setStatus('📧 Please enter your email address first', 'error');
        return;
      }

      showLoading('📧 Resending confirmation email...');

      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email
        });
        
        if (error) throw error;

        setStatus(`✅ Confirmation email resent to ${email}!\n\nCheck your inbox and spam folder.`, 'success', 8000);
        resendEmailBtn.disabled = true;
        resendEmailBtn.textContent = '✓ Email Sent';
        
        setTimeout(() => {
          resendEmailBtn.disabled = false;
          resendEmailBtn.textContent = 'Resend Email';
        }, 60000); // Re-enable after 1 minute
      } catch (err) {
        console.error('Resend email error:', err);
        setStatus(`❌ Failed to resend email: ${err.message}`, 'error');
      } finally {
        hideLoading();
      }
    });
  }

  // Sign Up
  async function signUp() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const fullName = fullNameInput.value.trim();

    if (!validateInputs(email, password, fullName)) return;

    disableButtons(true);
    showLoading("🚀 Creating your account...");
    lastSignUpEmail = email;

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

      if (data?.user && !data.session) {
        setStatus(
          `✅ Account created successfully!\n\n📧 Please check ${email} for a confirmation link.\n💡 Check spam folder if you don't see it.`, 
          "success", 
          15000
        );
        
        // Show resend button
        if (resendEmailBtn) {
          resendEmailBtn.style.display = 'inline-flex';
        }
        
        fullNameInput.value = "";
        emailInput.value = "";
        passwordInput.value = "";
        
        setTimeout(() => {
          if (modeLink && isSignUpMode) {
            setStatus('✉️ Once confirmed, sign in here!', 'info', 5000);
            modeLink.click();
          }
        }, 4000);
      } else if (data?.session) {
        setStatus("✅ Account created! Taking you to onboarding...", "success", 3000);
        setTimeout(() => {
          window.location.href = "../templates/onboarding.html";
        }, 1500);
      }
    } catch (err) {
      console.error("Sign-up error:", err);
      
      let errorMessage = '❌ Sign up failed: ';
      if (err.message.includes('already registered')) {
        errorMessage += 'This email is already registered. Try signing in instead!';
        setTimeout(() => {
          if (modeLink && isSignUpMode) modeLink.click();
        }, 2000);
      } else if (err.message.includes('invalid email')) {
        errorMessage += 'Please enter a valid email address.';
      } else if (err.message.includes('password')) {
        errorMessage += 'Password does not meet requirements.';
      } else {
        errorMessage += err.message;
      }
      
      setStatus(errorMessage, "error", 8000);
    } finally {
      disableButtons(false);
      hideLoading();
    }
  }

  // Sign In
  async function signIn() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberMeCheckbox?.checked || false;

    if (!validateInputs(email, password)) return;

    disableButtons(true);
    showLoading("🔐 Signing you in...");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          persistSession: rememberMe
        }
      });
      
      if (error) throw error;

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('skillence_remember_me', 'true');
      } else {
        localStorage.removeItem('skillence_remember_me');
      }

      setStatus("✅ Welcome back! Redirecting...", "success", 2000);
      setTimeout(() => {
        window.location.href = "../templates/home.html";
      }, 1500);
    } catch (err) {
      console.error("Sign-in error:", err);
      
      let errorMessage = '❌ Sign in failed: ';
      if (err.message.includes('Invalid login credentials')) {
        errorMessage += 'Email or password is incorrect. Please try again.';
      } else if (err.message.includes('Email not confirmed')) {
        errorMessage += 'Please confirm your email first. Check your inbox for the confirmation link.';
        if (resendEmailBtn) {
          resendEmailBtn.style.display = 'inline-flex';
          lastSignUpEmail = email;
        }
      } else {
        errorMessage += err.message;
      }
      
      setStatus(errorMessage, "error", 8000);
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
      
      localStorage.removeItem('skillence_remember_me');
      if (sessionTimeoutTimer) clearTimeout(sessionTimeoutTimer);
      if (sessionWarningTimer) clearTimeout(sessionWarningTimer);
      
      setStatus("✅ Successfully signed out! See you soon!", "success");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Sign-out error:", err);
      setStatus(`❌ Sign out failed: ${err.message}`, "error");
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
          if (isForgotPasswordMode) {
            sendResetBtn?.click();
          } else if (isSignUpMode) {
            signUp();
          } else {
            signIn();
          }
        }
      });
    }
  });

  // Load remember me preference
  if (rememberMeCheckbox && localStorage.getItem('skillence_remember_me')) {
    rememberMeCheckbox.checked = true;
  }

  // Session Check
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (session) {
      showLoading("🔍 Checking your profile...");
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('job_title')
          .eq('id', session.user.id)
          .single();
        
        hideLoading();
        
        if (error) throw error;

        if (data?.job_title) {
          setStatus(`✅ Welcome back! Redirecting to home...`, "success");
          setTimeout(() => {
            window.location.href = "../templates/home.html";
          }, 1500);
        } else {
          setStatus(`👋 Let's set up your profile!`, "success");
          setTimeout(() => {
            window.location.href = "../templates/onboarding.html";
          }, 1500);
        }
        showSignedInState(session);
      } catch (err) {
        console.error('Profile check error:', err);
        hideLoading();
        setStatus(`⚠️ Redirecting to onboarding...`, "info");
        setTimeout(() => {
          window.location.href = "../templates/onboarding.html";
        }, 1500);
      }
    } else {
      showAuthForm();
      setStatus("👋 Welcome to Skillence! Sign in or create an account.", "info", 4000);
    }
  });

  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log("Auth state changed:", event, session);
    
    if (event === "PASSWORD_RECOVERY") {
      setStatus("🔑 Please enter your new password", "info", 5000);
      window.location.href = "../templates/reset-password.html";
    }
    
    if (event === "SIGNED_IN" && session) {
      showLoading("🔍 Checking your profile...");
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('job_title')
          .eq('id', session.user.id)
          .single();
        
        hideLoading();
        
        if (error) throw error;

        if (data?.job_title) {
          setStatus(`✅ Welcome back!`, "success");
          window.location.href = "../templates/home.html";
        } else {
          setStatus(`👋 Let's complete your profile!`, "success");
          window.location.href = "../templates/onboarding.html";
        }
        showSignedInState(session);
      } catch (err) {
        console.error('Profile check error:', err);
        hideLoading();
        window.location.href = "../templates/onboarding.html";
      }
    } else if (event === "SIGNED_OUT") {
      showAuthForm();
      setStatus("👋 You have been signed out.", "info");
    }
  });
} catch (err) {
  console.error('Supabase initialization failed:', err);
  alert('⚠️ Connection error. Please refresh the page.');
}