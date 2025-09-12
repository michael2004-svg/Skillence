// Initialize Supabase client
try {
  const supabase = window.supabase.createClient(
    'https://anzrbwcextohaatvwvvh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuenJid2NleHRvaGFhdHZ3dnZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NjE2NDgsImV4cCI6MjA3MzIzNzY0OH0.DSJBwubiIAqEXDqVZMuJLUrsgY9vBKDQuPQBPIItHuw'
  );
  console.log('Supabase client initialized:', supabase);

  // DOM Elements
  const profileName = document.getElementById('profile-name');
  const profileJob = document.getElementById('profile-job');
  const profileExperience = document.getElementById('profile-experience');
  const profileAvatar = document.querySelector('.profile-avatar img');
  const signOutBtn = document.getElementById('sign-out-btn');
  const statusMessage = document.getElementById('status-message');
  const followBtn = document.querySelector('.follow-btn');
  const followingElement = document.getElementById('following-count');
  const followersElement = document.getElementById('followers-count');

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

  // Fetch User Profile
  async function fetchUserProfile() {
    console.log('Fetching user profile...');
    try {
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session fetch error:", sessionError);
        setStatus(`Failed to fetch session: ${sessionError.message}`, "error");
        setTimeout(() => { window.location.href = "../templates/login.html"; }, 1500);
        return null;
      }
      if (!session?.session) {
        console.error("No active session");
        setStatus("No active session. Redirecting to login...", "error");
        setTimeout(() => { window.location.href = "../templates/login.html"; }, 1500);
        return null;
      }
      console.log('Session user ID:', session.session.user.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, job_title, experience_level, profile_picture_url")
        .eq("id", session.session.user.id)
        .single();
      if (error) {
        console.error("Profile fetch error:", error);
        setStatus(`Failed to load profile: ${error.message}`, "error");
        return null;
      }
      if (!data) {
        console.warn("No profile data found for user ID:", session.session.user.id);
        setStatus("Profile not found. Please complete your profile.", "error");
        return null;
      }
      if (profileName && data.full_name) {
        console.log('Updating profile name to:', data.full_name);
        profileName.textContent = data.full_name;
      }
      if (profileJob && data.job_title) {
        console.log('Updating job title to:', data.job_title);
        profileJob.textContent = data.job_title;
      }
      if (profileExperience && data.experience_level) {
        console.log('Updating experience level to:', data.experience_level);
        profileExperience.textContent = `${data.experience_level} Level`;
      }
      if (profileAvatar && data.profile_picture_url) {
        console.log('Updating profile picture to:', data.profile_picture_url);
        profileAvatar.src = data.profile_picture_url;
      }
      return data;
    } catch (err) {
      console.error("Unexpected error in fetchUserProfile:", err);
      setStatus(`Error fetching profile: ${err.message || "Unexpected error"}`, "error");
      return null;
    }
  }

  // Fetch User Profile and Follow Counts
  async function fetchUserProfileAndCounts(profileUserId = null) {
    console.log('Fetching profile and counts...');
    const result = await fetchUserProfile();
    if (!result) return null;

    const currentUserId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!currentUserId) {
      console.warn("No current user ID");
      return result;
    }

    try {
      const { count: followingCount, error: followingError } = await supabase
        .from("follows")
        .select("*", { count: 'exact', head: true })
        .eq("follower_id", currentUserId);
      if (followingError) throw followingError;

      const viewedUserId = profileUserId || currentUserId;
      const { count: followersCount, error: followersError } = await supabase
        .from("follows")
        .select("*", { count: 'exact', head: true })
        .eq("followed_id", viewedUserId);
      if (followersError) throw followersError;

      if (followingElement) {
        followingElement.textContent = followingCount || 0;
      }
      if (followersElement) {
        followersElement.textContent = followersCount || 0;
      }

      console.log('Follow counts updated:', { following: followingCount, followers: followersCount });
      return { ...result, followingCount, followersCount };
    } catch (err) {
      console.error("Error fetching follow counts:", err);
      setStatus(`Error fetching counts: ${err.message}`, "error");
      return result;
    }
  }

  // Toggle Follow
  async function toggleFollow(profileUserId = null) {
    if (!followBtn) {
      console.error("Follow button not found");
      setStatus("Follow button not found", "error");
      return;
    }

    const currentUserId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!currentUserId) {
      setStatus("No active session. Please sign in.", "error");
      return;
    }

    const viewedUserId = profileUserId || currentUserId;
    if (currentUserId === viewedUserId) {
      setStatus("Cannot follow yourself.", "error");
      return;
    }

    const isFollowing = followBtn.textContent === 'Unfollow';
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("followed_id", viewedUserId);
        if (error) throw error;
        followBtn.textContent = 'Follow';
        updateFollowCounts(-1, -1);
        setStatus("Unfollowed.", "success");
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, followed_id: viewedUserId });
        if (error) throw error;
        followBtn.textContent = 'Unfollow';
        updateFollowCounts(1, 1);
        setStatus("Followed!", "success");
      }
    } catch (err) {
      console.error("Follow toggle error:", err);
      setStatus(`Follow action failed: ${err.message}`, "error");
      followBtn.textContent = isFollowing ? 'Unfollow' : 'Follow';
    }
  }

  // Update Follow Counts
  function updateFollowCounts(deltaFollowing, deltaFollowers) {
    if (followingElement) {
      let currentCount = parseInt(followingElement.textContent.replace(/[^0-9]/g, '')) || 0;
      currentCount += deltaFollowing;
      followingElement.textContent = currentCount >= 1000 ? (currentCount / 1000).toFixed(1) + 'k' : currentCount;
    }
    if (followersElement) {
      let currentCount = parseInt(followersElement.textContent.replace(/[^0-9]/g, '')) || 0;
      currentCount += deltaFollowers;
      followersElement.textContent = currentCount >= 1000 ? (currentCount / 1000).toFixed(1) + 'k' : currentCount;
    }
    console.log('Follow counts updated:', { deltaFollowing, deltaFollowers });
  }

  // Sign Out
  async function signOut() {
    console.log('Attempting sign-out');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign-out error:", error);
        setStatus(`Sign out failed: ${error.message}`, "error");
        return;
      }
      console.log('Sign-out successful');
      setStatus("Successfully signed out! Redirecting...", "success");
      setTimeout(() => {
        console.log('Redirecting to index.html');
        window.location.href = "../templates/login.html";
      }, 1500);
    } catch (err) {
      console.error("Unexpected sign-out error:", err);
      setStatus(`Sign out error: ${err.message || "Unexpected error occurred"}`, "error");
    }
  }

  // Existing Functions
  function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    const tabContent = document.getElementById(`${tab}-tab`);
    if (tabContent) {
      tabContent.classList.add('active');
    }
    const navItem = document.querySelector(`.nav-item[data-tab="${tab}"]`);
    if (navItem) {
      navItem.classList.add('active');
    }
  }

  function toggleLike(button) {
    button.classList.toggle('liked');
    button.textContent = button.classList.contains('liked') ? '❤️ Liked' : '❤️';
  }

  function applyForJob() {
    alert("Job application submitted!");
  }

  function handleAddClick() {
    switchTab('add-post');
  }

  function markAsRead(notification) {
    notification.classList.remove('unread');
    notification.querySelector('.notification-badge')?.remove();
  }

  function updateCharCount(textarea) {
    const charCounter = document.getElementById('char-counter');
    if (charCounter) {
      charCounter.textContent = textarea.value.length;
      const postBtn = document.querySelector('.post-btn');
      postBtn.disabled = textarea.value.length === 0;
    }
  }

  function handleMediaUpload(type) {
    alert(`Uploading ${type}...`);
  }

  function addPoll() {
    alert("Adding a poll...");
  }

  function addCelebration() {
    alert("Adding a celebration...");
  }

  function cancelPost() {
    document.querySelector('.post-textarea').value = '';
    updateCharCount(document.querySelector('.post-textarea'));
    switchTab('home');
  }

  function publishPost() {
    alert("Post published!");
    cancelPost();
  }

  function handleFeatureClick(feature) {
    if (feature === 'cv-analyzer') {
      switchTab('cv-analyzer');
    } else {
      alert(`Opening ${feature}...`);
    }
  }

  function uploadCV() {
    const cvUpload = document.getElementById('cvUpload');
    const result = document.getElementById('result');
    if (cvUpload.files.length > 0) {
      result.textContent = `Analyzing ${cvUpload.files[0].name}...`;
    } else {
      result.textContent = "Please select a file to upload.";
    }
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, setting up listeners');
    try {
      await fetchUserProfileAndCounts();
      if (signOutBtn) {
        console.log('Sign-out button found, attaching listener');
        signOutBtn.addEventListener('click', () => {
          console.log('Sign-out button clicked');
          signOut();
        });
      } else {
        console.error('Sign-out button not found');
      }
      if (followBtn) {
        console.log('Follow button found');
        const currentUserId = (await supabase.auth.getSession()).data.session?.user.id;
        if (currentUserId) {
          const { data } = await supabase
            .from("follows")
            .select("id")
            .eq("follower_id", currentUserId)
            .eq("followed_id", currentUserId);
          followBtn.textContent = data?.length ? 'Unfollow' : 'Follow';
        }
      } else {
        console.error('Follow button not found');
      }

      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session);
        if (event === 'SIGNED_OUT') {
          setStatus('You have been signed out.', 'info');
          window.location.href = '../templates/login.html';
        } else if (event === 'SIGNED_IN' && session) {
          fetchUserProfileAndCounts();
        }
      });
    } catch (err) {
      console.error('Initialization error:', err);
      setStatus('Error initializing app: ' + err.message, 'error');
    }
  });
} catch (err) {
  console.error('Supabase client initialization failed:', err);
}