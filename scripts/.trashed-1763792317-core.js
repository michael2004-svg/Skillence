// Initialize Supabase client
window.supabaseClient = window.supabase.createClient(
    'https://anzrbwcextohaatvwvvh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuenJid2NleHRvaGFhdHZ3dnZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NjE2NDgsImV4cCI6MjA3MzIzNzY0OH0.DSJBwubiIAqEXDqVZMuJLUrsgY9vBKDQuPQBPIItHuw'
);

// DOM Elements
const profileJob = document.getElementById('profile-job');
const profileIndustry = document.getElementById('profile-industry');
const profileExperience = document.getElementById('profile-experience');
const profileSkills = document.getElementById('profile-skills');
const profileGoals = document.getElementById('profile-goals');
const profileAvatar = document.getElementById('profileAvatar');
const profileSkillScore = document.getElementById('cv-score');
const profileSkillProgress = document.getElementById('cv-score-progress');
const signOutBtn = document.getElementById('sign-out-btn');
const statusMessage = document.getElementById('status-message');
const followBtn = document.querySelector('.follow-btn');
const followingElement = document.getElementById('following-count');
const followersElement = document.getElementById('followers-count');
const createPostAvatar = document.getElementById('createPostAvatar');
const createPostName = document.getElementById('createPostName');

// UI Helper
function setStatus(message, type = 'info', duration = 5000) {
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

// Get current user ID
async function getUserId() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    return session?.user?.id;
}

// Fetch User Profile
async function fetchUserProfile() {
    try {
        const userId = await getUserId();
        if (!userId) {
            setStatus('No active session. Redirecting to login...', 'error');
            setTimeout(() => { window.location.href = '../templates/login.html'; }, 1500);
            return null;
        }

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

        if (profileJob) profileJob.textContent = data.job_title || 'No Job Title';
        if (profileIndustry) profileIndustry.textContent = data.industry || 'No Industry';
        if (profileExperience) profileExperience.textContent = `${data.experience_level || 'Unknown'} Level`;
        if (profileSkills) profileSkills.textContent = `Skills: ${data.top_skills?.join(', ') || 'None'}`;
        if (profileGoals) profileGoals.textContent = `Goals: ${data.goals?.join(', ') || 'None'}`;
        if (profileAvatar) profileAvatar.src = data.profile_picture_url || '../images/default.jpg';
        if (profileSkillScore) profileSkillScore.textContent = `${data.skill_score || 0}%`;
        if (profileSkillProgress) profileSkillProgress.style.width = `${data.skill_score || 0}%`;
        if (createPostAvatar) createPostAvatar.src = data.profile_picture_url || '../images/default.jpg';
        if (createPostName) createPostName.textContent = data.job_title || 'Anonymous';

        // Fetch follow counts
        const [followersRes, followingRes] = await Promise.all([
            window.supabaseClient.from('follows').select('follower_id').eq('followed_id', userId),
            window.supabaseClient.from('follows').select('followed_id').eq('follower_id', userId)
        ]);

        if (followersElement) {
            const followers = followersRes.data?.length || 0;
            followersElement.textContent = followers >= 1000 ? (followers / 1000).toFixed(1) + 'k' : followers;
        }
        if (followingElement) {
            const following = followingRes.data?.length || 0;
            followingElement.textContent = following >= 1000 ? (following / 1000).toFixed(1) + 'k' : following;
        }

        return data;
    } catch (error) {
        console.error('Error fetching profile:', error);
        setStatus(`Failed to load profile: ${error.message}`, 'error');
        return null;
    }
}

// Switch Tabs
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.classList.add('hidden');
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const tabContent = document.getElementById(`${tab}-tab`);
    if (tabContent) {
        tabContent.classList.add('active');
        tabContent.classList.remove('hidden');
    }
    const navItem = document.querySelector(`.nav-item[data-tab="${tab}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
    if (tab === 'home') {
        loadTwitterFeed();
    } else if (tab === 'profile') {
        fetchUserProfile();
    }
}

// Follow/Unfollow
async function toggleFollow(profileUserId = null) {
    if (!followBtn) {
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

    const isFollowing = followBtn.textContent === 'Unfollow';
    try {
        if (isFollowing) {
            const { error } = await window.supabaseClient
                .from('follows')
                .delete()
                .eq('follower_id', userId)
                .eq('followed_id', viewedUserId);
            if (error) throw error;
            followBtn.textContent = 'Follow';
            updateFollowCounts(-1, -1);
            setStatus('Unfollowed.', 'success');
        } else {
            const { error } = await window.supabaseClient
                .from('follows')
                .insert({ follower_id: userId, followed_id: viewedUserId });
            if (error) throw error;
            followBtn.textContent = 'Unfollow';
            updateFollowCounts(1, 1);
            setStatus('Followed!', 'success');
        }
    } catch (error) {
        setStatus(`Follow action failed: ${error.message}`, 'error');
    }
}

// Update Follow Counts
function updateFollowCounts(deltaFollowing, deltaFollowers) {
    if (followingElement) {
        let count = parseInt(followingElement.textContent.replace(/[^0-9]/g, '')) || 0;
        count += deltaFollowing;
        followingElement.textContent = count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count;
    }
    if (followersElement) {
        let count = parseInt(followersElement.textContent.replace(/[^0-9]/g, '')) || 0;
        count += deltaFollowers;
        followersElement.textContent = count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count;
    }
}

// Sign Out
async function signOut() {
    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;
        setStatus('Successfully signed out! Redirecting...', 'success');
        setTimeout(() => { window.location.href = '../templates/login.html'; }, 1500);
    } catch (error) {
        setStatus(`Sign out failed: ${error.message}`, 'error');
    }
}

// Fetch Latest CV Analysis
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

// Update Profile with CV Analysis Data
async function updateProfileWithCVData() {
    const cvData = await fetchLatestCVAnalysis();
    if (cvData) {
        if (cvScoreElement) {
            cvScoreElement.textContent = `${cvData.score}%`;
            cvScoreProgress.style.width = `${cvData.score}%`;
        }
        if (cvIndustryElement) {
            cvIndustryElement.textContent = cvData.industry.charAt(0).toUpperCase() + cvData.industry.slice(1);
        }
        if (cvSkillsElement) {
            cvSkillsElement.textContent = cvData.skills.slice(0, 3).join(', ') || 'None listed';
        }
        if (cvTimestampElement) {
            cvTimestampElement.textContent = new Date(cvData.timestamp).toLocaleString();
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await fetchUserProfile();
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                setStatus('You have been signed out.', 'info');
                window.location.href = '../templates/login.html';
            } else if (event === 'SIGNED_IN' && session) {
                fetchUserProfile();
            }
        });
        if (signOutBtn) {
            signOutBtn.addEventListener('click', signOut);
        }
    } catch (error) {
        setStatus(`Initialization error: ${error.message}`, 'error');
    }
});