// Initialize Supabase
try {
  const supabase = window.supabase.createClient(
    'https://anzrbwcextohaatvwvvh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuenJid2NleHRvaGFhdHZ3dnZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NjE2NDgsImV4cCI6MjA3MzIzNzY0OH0.DSJBwubiIAqEXDqVZMuJLUrsgY9vBKDQuPQBPIItHuw'
  );
  console.log('Supabase client initialized:', supabase);

  // DOM Elements
  const form = document.getElementById('onboarding-form');
  const statusMessage = document.getElementById('status-message');
  const submitBtn = document.getElementById('submit-onboarding');

  // UI Helper
  function setStatus(message, type = 'info', duration = 5000) {
    console.log(`Status: ${message} (${type})`);
    if (!statusMessage) {
      console.warn("statusMessage element not found");
      return;
    }
    statusMessage.textContent = message;
    statusMessage.className = `status-message show status-${type}`;
    setTimeout(() => {
      statusMessage.classList.remove('show');
    }, duration);
  }

  // Check if Onboarding is Needed
  async function checkOnboardingStatus() {
    try {
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }
      if (!session?.session) {
        setStatus("No active session. Redirecting to login...", "error");
        setTimeout(() => { window.location.href = "../templates/login.html"; }, 1500);
        return;
      }

      console.log('Checking onboarding status for user:', session.session.user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('job_title')
        .eq('id', session.session.user.id)
        .maybeSingle();
      if (error) {
        console.error('Profile query error:', error);
        throw error;
      }
      if (data?.job_title) {
        console.log('Onboarding already completed, redirecting to home...');
        window.location.href = '../templates/home.html';
      } else {
        console.log('Onboarding needed for user:', session.session.user.id);
        // Check if profile exists
        const { data: profileExists, error: existsError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.session.user.id)
          .maybeSingle();
        if (existsError) {
          console.error('Profile existence check error:', existsError);
          throw existsError;
        }
        if (!profileExists) {
          console.log('No profile exists, creating one...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({ id: session.session.user.id });
          if (insertError) {
            console.error('Profile insert error:', insertError);
            throw insertError;
          }
          console.log('Profile row created for user:', session.session.user.id);
        } else {
          console.log('Profile already exists, no insert needed.');
        }
      }
    } catch (err) {
      console.error('Onboarding status check error:', err);
      setStatus(`Error checking onboarding status: ${err.message}`, 'error');
    }
  }

  // Handle Form Submission
  async function handleOnboardingSubmit(event) {
    event.preventDefault(); // Prevent default form submission
    event.stopPropagation(); // Stop event bubbling
    if (!submitBtn) {
      console.error('Submit button not found');
      return;
    }
    submitBtn.disabled = true;

    try {
      const profilePicture = document.getElementById('profile-picture')?.files[0];
      const jobTitle = document.getElementById('job-title')?.value.trim();
      const industry = document.getElementById('industry')?.value;
      const experienceLevel = document.getElementById('experience-level')?.value;
      const topSkillsInput = document.getElementById('top-skills')?.value;
      const goals = document.getElementById('goals')
        ? Array.from(document.getElementById('goals').selectedOptions).map(opt => opt.value)
        : [];

      // Validate inputs
      if (!jobTitle || !industry || !experienceLevel || !topSkillsInput || goals.length === 0) {
        setStatus("Please fill all required fields.", "error");
        submitBtn.disabled = false;
        return;
      }

      // Sanitize topSkills to ensure valid string array
      const topSkills = topSkillsInput
        .split(',')
        .map(s => String(s.trim()))
        .filter(s => s)
        .slice(0, 5);
      if (topSkills.length === 0) {
        setStatus("Please provide at least one valid skill.", "error");
        submitBtn.disabled = false;
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }
      if (!session) {
        setStatus("No active session. Redirecting to login...", "error");
        submitBtn.disabled = false;
        setTimeout(() => { window.location.href = "../templates/login.html"; }, 1500);
        return;
      }

      let profilePictureUrl = null;
      if (profilePicture) {
        const fileName = `${session.user.id}/${Date.now()}_${profilePicture.name}`;
        console.log('Uploading profile picture to images bucket:', fileName);
        try {
          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, profilePicture, { upsert: true });
          if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw uploadError;
          }
          const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
          profilePictureUrl = urlData.publicUrl;
          console.log('Profile picture URL:', profilePictureUrl);
        } catch (uploadErr) {
          console.warn('Failed to upload profile picture, proceeding without image:', uploadErr);
          setStatus("Failed to upload profile picture, saving profile without image.", "warning");
        }
      }

      console.log('Upserting profile with:', { jobTitle, industry, experienceLevel, topSkills, goals, profilePictureUrl });
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          job_title: jobTitle,
          industry,
          experience_level: experienceLevel,
          top_skills: topSkills,
          goals,
          profile_picture_url: profilePictureUrl,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      if (upsertError) {
        console.error('Profile upsert error:', upsertError);
        throw upsertError;
      }

      setStatus("Profile updated! Redirecting to home...", "success");
      setTimeout(() => { window.location.href = "../templates/home.html"; }, 1500);
    } catch (err) {
      console.error("Onboarding error:", err);
      setStatus(`Error: ${err.message || 'Unexpected error occurred'}`, "error");
      submitBtn.disabled = false;
    }
  }

  // Initialize
  if (form) {
    form.addEventListener('submit', handleOnboardingSubmit);
  } else {
    console.error('Onboarding form not found');
  }
  checkOnboardingStatus();
} catch (err) {
  console.error('Supabase client initialization failed:', err);
}