// profile.js - Complete Profile Management
class ProfileManager {
    constructor() {
        this.currentUserId = null;
        this.init();
    }

    async init() {
        this.currentUserId = await getUserId();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Profile edit button
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => this.showEditModal());
        }

        // Followers/Following click handlers
        const followersCount = document.getElementById('followers-count');
        const followingCount = document.getElementById('following-count');
        
        if (followersCount) {
            followersCount.style.cursor = 'pointer';
            followersCount.addEventListener('click', () => this.showFollowersList('followers'));
        }
        
        if (followingCount) {
            followingCount.style.cursor = 'pointer';
            followingCount.addEventListener('click', () => this.showFollowersList('following'));
        }
    }

    async showEditModal() {
        const profile = await fetchUserProfile();
        if (!profile) return;

        const modal = document.createElement('div');
        modal.className = 'profile-edit-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Profile</h2>
                    <button class="modal-close" onclick="this.closest('.profile-edit-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="edit-full-name" class="form-input" value="${profile.full_name || ''}" placeholder="Enter your full name">
                    </div>
                    
                    <div class="form-group">
                        <label>Job Title</label>
                        <input type="text" id="edit-job-title" class="form-input" value="${profile.job_title || ''}" placeholder="e.g., Software Engineer">
                    </div>
                    
                    <div class="form-group">
                        <label>Industry</label>
                        <select id="edit-industry" class="form-input">
                            <option value="">Select Industry</option>
                            <option value="Technology" ${profile.industry === 'Technology' ? 'selected' : ''}>Technology</option>
                            <option value="Healthcare" ${profile.industry === 'Healthcare' ? 'selected' : ''}>Healthcare</option>
                            <option value="Finance" ${profile.industry === 'Finance' ? 'selected' : ''}>Finance</option>
                            <option value="Education" ${profile.industry === 'Education' ? 'selected' : ''}>Education</option>
                            <option value="Marketing" ${profile.industry === 'Marketing' ? 'selected' : ''}>Marketing</option>
                            <option value="Design" ${profile.industry === 'Design' ? 'selected' : ''}>Design</option>
                            <option value="Sales" ${profile.industry === 'Sales' ? 'selected' : ''}>Sales</option>
                            <option value="Other" ${profile.industry === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Experience Level</label>
                        <select id="edit-experience" class="form-input">
                            <option value="Beginner" ${profile.experience_level === 'Beginner' ? 'selected' : ''}>Beginner</option>
                            <option value="Intermediate" ${profile.experience_level === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                            <option value="Expert" ${profile.experience_level === 'Expert' ? 'selected' : ''}>Expert</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Location</label>
                        <input type="text" id="edit-location" class="form-input" value="${profile.location || ''}" placeholder="City, Country">
                    </div>
                    
                    <div class="form-group">
                        <label>Profile Picture</label>
                        <input type="file" id="edit-profile-picture" class="form-input" accept="image/*">
                        <div class="current-picture" style="margin-top: 10px;">
                            <img src="${profile.profile_picture_url || '../images/default.jpg'}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Top Skills (comma separated)</label>
                        <input type="text" id="edit-skills" class="form-input" value="${profile.top_skills?.join(', ') || ''}" placeholder="JavaScript, Python, React">
                    </div>
                    
                    <div class="form-group">
                        <label>Goals (comma separated)</label>
                        <input type="text" id="edit-goals" class="form-input" value="${profile.goals?.join(', ') || ''}" placeholder="Learn AI, Build SaaS, Get promoted">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.profile-edit-modal').remove()">Cancel</button>
                    <button class="btn-primary" onclick="window.profileManager.saveProfile()">Save Changes</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async saveProfile() {
        try {
            setStatus('Saving profile...', 'info');
            
            const fullName = document.getElementById('edit-full-name').value.trim();
            const jobTitle = document.getElementById('edit-job-title').value.trim();
            const industry = document.getElementById('edit-industry').value;
            const experienceLevel = document.getElementById('edit-experience').value;
            const location = document.getElementById('edit-location').value.trim();
            const skillsInput = document.getElementById('edit-skills').value.trim();
            const goalsInput = document.getElementById('edit-goals').value.trim();
            const profilePictureFile = document.getElementById('edit-profile-picture').files[0];

            const skills = skillsInput ? skillsInput.split(',').map(s => s.trim()).filter(Boolean) : [];
            const goals = goalsInput ? goalsInput.split(',').map(g => g.trim()).filter(Boolean) : [];

            let profilePictureUrl = null;

            // Upload profile picture if selected
            if (profilePictureFile) {
                profilePictureUrl = await this.uploadProfilePicture(profilePictureFile);
            }

            const updateData = {
                full_name: fullName,
                job_title: jobTitle,
                industry: industry,
                experience_level: experienceLevel,
                location: location,
                top_skills: skills,
                goals: goals,
                updated_at: new Date().toISOString()
            };

            if (profilePictureUrl) {
                updateData.profile_picture_url = profilePictureUrl;
            }

            const { error } = await window.supabaseClient
                .from('profiles')
                .update(updateData)
                .eq('id', this.currentUserId);

            if (error) throw error;

            setStatus('Profile updated successfully! ✨', 'success');
            document.querySelector('.profile-edit-modal')?.remove();
            
            // Refresh profile display
            await fetchUserProfile(true);

        } catch (error) {
            console.error('Save profile error:', error);
            setStatus(`Failed to update profile: ${error.message}`, 'error');
        }
    }

    async uploadProfilePicture(file) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `profile_pictures/${this.currentUserId}_${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await window.supabaseClient.storage
                .from('profile_pictures')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data } = window.supabaseClient.storage
                .from('profile_pictures')
                .getPublicUrl(fileName);

            return data.publicUrl;
        } catch (error) {
            console.error('Profile picture upload error:', error);
            throw error;
        }
    }

    async showFollowersList(type) {
        try {
            const viewingUserId = sessionStorage.getItem('viewingUserId') || this.currentUserId;
            
            let data, error;
            
            if (type === 'followers') {
                const result = await window.supabaseClient
                    .from('follows')
                    .select(`
                        follower_id,
                        profiles!follows_follower_id_fkey (
                            id,
                            full_name,
                            job_title,
                            profile_picture_url
                        )
                    `)
                    .eq('followed_id', viewingUserId);
                data = result.data;
                error = result.error;
            } else {
                const result = await window.supabaseClient
                    .from('follows')
                    .select(`
                        followed_id,
                        profiles!follows_followed_id_fkey (
                            id,
                            full_name,
                            job_title,
                            profile_picture_url
                        )
                    `)
                    .eq('follower_id', viewingUserId);
                data = result.data;
                error = result.error;
            }

            if (error) throw error;

            this.renderFollowersModal(data, type);

        } catch (error) {
            console.error('Load followers error:', error);
            setStatus(`Failed to load ${type}: ${error.message}`, 'error');
        }
    }

    renderFollowersModal(data, type) {
        const modal = document.createElement('div');
        modal.className = 'followers-modal';
        
        const users = data.map(item => item.profiles).filter(Boolean);
        
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${type === 'followers' ? 'Followers' : 'Following'}</h2>
                    <button class="modal-close" onclick="this.closest('.followers-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${users.length === 0 ? `
                        <div class="empty-state">
                            <p>No ${type} yet</p>
                        </div>
                    ` : `
                        <div class="followers-list">
                            ${users.map(user => `
                                <div class="follower-item" onclick="viewUserProfile('${user.id}'); document.querySelector('.followers-modal').remove();">
                                    <img src="${user.profile_picture_url || '../images/default.jpg'}" class="follower-avatar">
                                    <div class="follower-info">
                                        <div class="follower-name">${sanitizeHtml(user.full_name || user.job_title || 'Anonymous')}</div>
                                        <div class="follower-title">${sanitizeHtml(user.job_title || '')}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }
}

// Initialize
let profileManager;
document.addEventListener('DOMContentLoaded', () => {
    profileManager = new ProfileManager();
    window.profileManager = profileManager;
});

// Add Edit Profile button dynamically
document.addEventListener('DOMContentLoaded', () => {
    const profileActions = document.querySelector('.profile-actions');
    if (profileActions) {
        const editBtn = document.createElement('button');
        editBtn.id = 'editProfileBtn';
        editBtn.className = 'edit-profile-btn';
        editBtn.textContent = '✏️ Edit Profile';
        editBtn.style.display = 'none'; // Hidden by default
        profileActions.insertBefore(editBtn, profileActions.firstChild);
    }
});

// Show edit button only on own profile
async function updateEditButtonVisibility() {
    const currentUserId = await getUserId();
    const viewingUserId = sessionStorage.getItem('viewingUserId');
    const editBtn = document.getElementById('editProfileBtn');
    
    if (editBtn) {
        if (!viewingUserId || viewingUserId === currentUserId) {
            editBtn.style.display = 'block';
        } else {
            editBtn.style.display = 'none';
        }
    }
}

// Call this when switching to profile tab
document.addEventListener('DOMContentLoaded', () => {
    const originalSwitchTab = window.switchTab;
    window.switchTab = function(tab) {
        originalSwitchTab(tab);
        if (tab === 'profile') {
            setTimeout(updateEditButtonVisibility, 100);
        }
    };
});