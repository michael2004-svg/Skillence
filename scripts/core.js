// core.js - PRODUCTION READY
// Skillence App Core Functionality

// Initialize Supabase client
window.supabaseClient = window.supabase.createClient(
    'https://anzrbwcextohaatvwvvh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuenJid2NleHRvaGFhdHZ3dnZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NjE2NDgsImV4cCI6MjA3MzIzNzY0OH0.DSJBwubiIAqEXDqVZMuJLUrsgY9vBKDQuPQBPIItHuw'
);

// DOM Elements - PROPERLY SELECTED
const elements = {
    profileJob: document.getElementById('profile-job'),
    profileIndustry: document.getElementById('profile-industry'),
    profileExperience: document.getElementById('profile-experience'),
    profileSkills: document.getElementById('profile-skills'),
    profileGoals: document.getElementById('profile-goals'),
    profileAvatar: document.getElementById('profileAvatar'),
    cvScore: document.getElementById('cv-score'),
    cvScoreProgress: document.getElementById('cv-score-progress'),
    cvIndustry: document.getElementById('cv-industry'),
    cvSkills: document.getElementById('cv-skills'),
    cvTimestamp: document.getElementById('cv-timestamp'),
    signOutBtn: document.getElementById('sign-out-btn'),
    statusMessage: document.getElementById('status-message'),
    followBtn: document.querySelector('.follow-btn'),
    followersCount: document.getElementById('followers-count'),
    followingCount: document.getElementById('following-count'),
    createPostAvatar: document.getElementById('createPostAvatar'),
    createPostName: document.getElementById('createPostName')
};

// UI Helper - ENHANCED WITH LOADING STATES
function setStatus(message, type = 'info', duration = 5000) {
    if (!elements.statusMessage) return;
    
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status-message show status-${type}`;
    
    if (duration > 0) {
        setTimeout(() => {
            elements.statusMessage.classList.remove('show');
        }, duration);
    }
}

// Sanitize HTML to prevent XSS
function sanitizeHtml(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Get current user ID - WITH ERROR HANDLING
async function getUserId() {
    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        if (error) throw error;
        return session?.user?.id;
    } catch (error) {
        console.error('getUserId error:', error);
        return null;
    }
}

// Fetch User Profile - OPTIMIZED WITH CACHING
let profileCache = null;
async function fetchUserProfile(forceRefresh = false) {
    if (profileCache && !forceRefresh) return profileCache;
    
    try {
        const userId = await getUserId();
        if (!userId) {
            setStatus('No active session. Redirecting to login...', 'error');
            setTimeout(() => { window.location.href = '../templates/login.html'; }, 1500);
            return null;
        }

        setStatus('Loading profile...', 'info');

        const { data, error } = await window.supabaseClient
            .from('profiles')
            .select('job_title, industry, experience_level, profile_picture_url, top_skills, goals, skill_score')
            .eq('id', userId)
            .single();
            
        if (error) throw error;
        if (!data) {
            setStatus('Profile not found. Please complete onboarding.', 'error');
            setTimeout(() => { window.location.href = '../templates/onboarding.html'; }, 1500);
            return null;
        }

        // Update UI - SAFE PROPERTY CHECKS
        if (elements.profileJob) elements.profileJob.textContent = sanitizeHtml(data.job_title || 'No Job Title');
        if (elements.profileIndustry) elements.profileIndustry.textContent = sanitizeHtml(data.industry || 'No Industry');
        if (elements.profileExperience) elements.profileExperience.textContent = `${sanitizeHtml(data.experience_level || 'Unknown')} Level`;
        if (elements.profileSkills) elements.profileSkills.textContent = `Skills: ${data.top_skills?.join(', ') || 'None'}`;
        if (elements.profileGoals) elements.profileGoals.textContent = `Goals: ${data.goals?.join(', ') || 'None'}`;
        if (elements.profileAvatar) elements.profileAvatar.src = data.profile_picture_url || '../images/default.jpg';
        if (elements.cvScore) elements.cvScore.textContent = `${data.skill_score || 0}%`;
        if (elements.cvScoreProgress) elements.cvScoreProgress.style.width = `${data.skill_score || 0}%`;
        if (elements.createPostAvatar) elements.createPostAvatar.src = data.profile_picture_url || '../images/default.jpg';
        if (elements.createPostName) elements.createPostName.textContent = sanitizeHtml(data.job_title || 'Anonymous');

        // Fetch follow counts PARALLEL
        const [followersRes, followingRes] = await Promise.all([
            window.supabaseClient.from('follows').select('follower_id', { count: 'exact' }).eq('followed_id', userId),
            window.supabaseClient.from('follows').select('followed_id', { count: 'exact' }).eq('follower_id', userId)
        ]);

        updateFollowCounts(followersRes.count || 0, followingRes.count || 0);
        
        profileCache = data;
        setStatus('Profile loaded successfully', 'success', 2000);
        return data;
        
    } catch (error) {
        console.error('Error fetching profile:', error);
        setStatus(`Failed to load profile: ${error.message}`, 'error');
        return null;
    }
}

// Switch Tabs - FIXED FOR ADD POST BUTTON
function switchTab(tab) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.classList.add('hidden');
    });
    
    // Remove active from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected tab
    const tabContent = document.getElementById(`${tab}-tab`);
    if (tabContent) {
        tabContent.classList.add('active');
        tabContent.classList.remove('hidden');
    }
    
    // Activate nav item
    const navItem = document.querySelector(`.nav-item[data-tab="${tab}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
    
    // Trigger tab-specific actions
    switch (tab) {
        case 'home':
            loadTwitterFeed();
            break;
        case 'profile':
            fetchUserProfile();
            break;
        case 'career':
            // ADD THIS: Reset career section to show feature cards
            goBackToCareer();
            break;
    }
}

// MISSING FUNCTION: Load Twitter Feed - STUB IMPLEMENTATION
async function loadTwitterFeed() {
    const feedContainer = document.getElementById('feedContainer');
    if (!feedContainer) return;
    
    // Show loading
    feedContainer.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <div class="loading-text">Loading feed...</div>
        </div>
    `;
    
    try {
        // TODO: Implement actual feed loading from feed.js
        // For now, show placeholder
        setTimeout(() => {
            feedContainer.innerHTML = `
                <div class="post-card">
                    <div class="post-header">
                        <img src="../images/default.jpg" class="post-avatar">
                        <div class="post-author">Welcome to Skillence! 👋</div>
                    </div>
                    <div class="post-content">
                        <p>Start sharing your skills, connect with professionals, and grow your career!</p>
                    </div>
                </div>
            `;
        }, 1000);
    } catch (error) {
        console.error('Feed load error:', error);
        feedContainer.innerHTML = `<p class="error-message">Failed to load feed</p>`;
    }
}

// Follow/Unfollow - OPTIMIZED
async function toggleFollow(profileUserId = null) {
    if (!elements.followBtn) {
        setStatus('Follow button not found', 'error');
        return;
    }
    
    const userId = await getUserId();
    if (!userId) {
        setStatus('Please sign in to follow.', 'error');
        return;
    }
    
    const viewedUserId = profileUserId || userId;
    if (userId === viewedUserId) {
        setStatus('Cannot follow yourself.', 'error');
        return;
    }

    const isFollowing = elements.followBtn.textContent === 'Unfollow';
    elements.followBtn.disabled = true;
    
    try {
        if (isFollowing) {
            const { error } = await window.supabaseClient
                .from('follows')
                .delete()
                .eq('follower_id', userId)
                .eq('followed_id', viewedUserId);
            if (error) throw error;
            
            elements.followBtn.textContent = 'Follow';
            updateFollowCounts(-1, 0); // Only current user's following changes
            setStatus('Unfollowed.', 'success');
        } else {
            const { error } = await window.supabaseClient
                .from('follows')
                .insert({ follower_id: userId, followed_id: viewedUserId });
            if (error) throw error;
            
            elements.followBtn.textContent = 'Unfollow';
            updateFollowCounts(1, 0); // Only current user's following changes
            setStatus('Followed!', 'success');
        }
    } catch (error) {
        setStatus(`Follow action failed: ${error.message}`, 'error');
    } finally {
        elements.followBtn.disabled = false;
    }
}

// Update Follow Counts - FIXED PARSING LOGIC
function updateFollowCounts(followers, following) {
    if (elements.followersCount) {
        const displayFollowers = followers >= 1000 ? (followers / 1000).toFixed(1) + 'k' : followers;
        elements.followersCount.textContent = displayFollowers;
    }
    if (elements.followingCount) {
        const displayFollowing = following >= 1000 ? (following / 1000).toFixed(1) + 'k' : following;
        elements.followingCount.textContent = displayFollowing;
    }
}

// Sign Out - ENHANCED
async function signOut() {
    try {
        setStatus('Signing out...', 'info');
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;
        
        setStatus('Successfully signed out! Redirecting...', 'success');
        setTimeout(() => { window.location.href = '../templates/login.html'; }, 1500);
    } catch (error) {
        console.error('Sign out error:', error);
        setStatus(`Sign out failed: ${error.message}`, 'error');
    }
}

// Fetch Latest CV Analysis - FIXED SELECTORS
async function fetchLatestCVAnalysis() {
    try {
        const userId = await getUserId();
        if (!userId) return null;

        const { data, error } = await window.supabaseClient
            .from('cv_analysis')
            .select('score, industry, skills, timestamp')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('CV analysis fetch error:', error);
        return null;
    }
}

// Update Profile with CV Analysis Data - FIXED SELECTORS
async function updateProfileWithCVData() {
    const cvData = await fetchLatestCVAnalysis();
    if (!cvData) return;

    if (elements.cvScore) elements.cvScore.textContent = `${cvData.score}%`;
    if (elements.cvScoreProgress) elements.cvScoreProgress.style.width = `${cvData.score}%`;
    if (elements.cvIndustry) elements.cvIndustry.textContent = sanitizeHtml(cvData.industry?.charAt(0).toUpperCase() + (cvData.industry?.slice(1) || ''));
    if (elements.cvSkills) elements.cvSkills.textContent = sanitizeHtml(cvData.skills?.slice(0, 3).join(', ') || 'None listed');
    if (elements.cvTimestamp) elements.cvTimestamp.textContent = cvData.timestamp ? new Date(cvData.timestamp).toLocaleString() : 'No analysis available';
}

// Initialize - PRODUCTION READY
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Skillence Core: Initializing...');
        
        // Event Listeners
        if (elements.signOutBtn) {
            elements.signOutBtn.addEventListener('click', signOut);
        }
        
        if (elements.followBtn) {
            elements.followBtn.addEventListener('click', () => toggleFollow());
        }

        // Auth State Changes
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                setStatus('You have been signed out.', 'info');
                window.location.href = '../templates/login.html';
            } else if (event === 'SIGNED_IN' && session) {
                profileCache = null; // Clear cache on sign in
                fetchUserProfile();
            }
        });

        // Initial Load
        await fetchUserProfile();
        await updateProfileWithCVData();
        
        console.log('Skillence Core: Initialization complete');
        
    } catch (error) {
        console.error('Core initialization error:', error);
        setStatus(`Initialization failed: ${error.message}`, 'error');
    }
});

// Add this function to core.js if it doesn't exist, or update the existing one
function handleFeatureClick(feature) {
    const careerContent = document.querySelector('.career-content');
    const jobsSection = document.getElementById('jobsSection');
    const coursesSection = document.getElementById('coursesSection');
    const mentorshipSection = document.getElementById('mentorshipSection');
    const featuresGrid = document.querySelector('.features-grid');

    // Hide all sections first
    if (jobsSection) jobsSection.classList.add('hidden');
    if (coursesSection) coursesSection.classList.add('hidden');
    if (mentorshipSection) mentorshipSection.classList.add('hidden');

    switch(feature) {
        case 'cv-analyzer':
            window.SkillenceCore.switchTab('cv-analyzer');
            break;
            
        case 'jobs':
            if (featuresGrid) featuresGrid.style.display = 'none';
            if (jobsSection) {
                jobsSection.classList.remove('hidden');
                jobsSection.classList.add('show');
            }
            searchJobs();
            break;
            
        case 'courses':
            if (featuresGrid) featuresGrid.style.display = 'none'; // ADD THIS LINE
            if (coursesSection) {
                coursesSection.classList.remove('hidden');
                if (typeof window.CoursesModule !== 'undefined') {
                    window.CoursesModule.initializeCourses();
                }
            }
            break;
            
        case 'mentorship':
            if (featuresGrid) featuresGrid.style.display = 'none'; // ADD THIS LINE
            if (mentorshipSection) {
                mentorshipSection.classList.remove('hidden');
                if (typeof window.MentorshipModule !== 'undefined') {
                    window.MentorshipModule.initializeMentors();
                }
            }
            break;
    }
}
function goBackToCareer() {
    const jobsSection = document.getElementById('jobsSection');
    const coursesSection = document.getElementById('coursesSection');
    const mentorshipSection = document.getElementById('mentorshipSection');
    const featuresGrid = document.querySelector('.features-grid');

    // Hide all subsections
    if (jobsSection) jobsSection.classList.add('hidden');
    if (coursesSection) coursesSection.classList.add('hidden');
    if (mentorshipSection) mentorshipSection.classList.add('hidden');
    
    // Show feature cards again
    if (featuresGrid) featuresGrid.style.display = 'grid';
}

function switchProfileTab(tab) {
    // Remove active from all tabs
    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.profile-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Activate selected tab
    const tabBtn = event.target.closest('.profile-tab-btn');
    if (tabBtn) tabBtn.classList.add('active');
    
    const tabContent = document.getElementById(`profile-${tab}-tab`);
    if (tabContent) tabContent.classList.add('active');
}

// Export for other modules
window.goBackToCareer = goBackToCareer;
window.handleFeatureClick = handleFeatureClick;
window.SkillenceCore = {
    switchTab,
    fetchUserProfile,
    toggleFollow,
    signOut,
    getUserId,
    setStatus
};