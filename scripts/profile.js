// profile.js - FIXED VERSION
class ProfileManager {
    constructor() {
        this.currentUserId = null;
        this.init();
    }

    async init() {
        this.currentUserId = await getUserId();
        console.log('ProfileManager initialized with userId:', this.currentUserId);
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Set up edit profile button with delegation
        document.addEventListener('click', (e) => {
            if (e.target.id === 'editProfileBtn' || e.target.closest('#editProfileBtn')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Edit button clicked!');
                this.showEditModal();
            }
        });

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
        console.log('Opening edit modal...');
        const profile = await fetchUserProfile();
        if (!profile) {
            console.error('No profile data available');
            setStatus('Could not load profile data', 'error');
            return;
        }

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
                        <div class="current-picture">
                            <img src="${profile.profile_picture_url || '../images/default.jpg'}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-top: 10px;">
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
                    <button class="btn-primary" id="saveProfileBtn">Save Changes</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        console.log('Edit modal added to DOM');

        // Add event listener to save button
        document.getElementById('saveProfileBtn').addEventListener('click', () => this.saveProfile());
    }

    async saveProfile() {
        try {
            console.log('Saving profile...');
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
                console.log('Uploading profile picture...');
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

            console.log('Update data:', updateData);

            const { error } = await window.supabaseClient
                .from('profiles')
                .update(updateData)
                .eq('id', this.currentUserId);

            if (error) throw error;

            console.log('Profile updated successfully');
            setStatus('Profile updated successfully! ✨', 'success');
            document.querySelector('.profile-edit-modal')?.remove();
            
            // Force refresh profile data
            profileCache = null;
            await fetchUserProfile(true);

        } catch (error) {
            console.error('Save profile error:', error);
            setStatus(`Failed to update profile: ${error.message}`, 'error');
        }
    }

    async uploadProfilePicture(file) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${this.currentUserId}_${Date.now()}.${fileExt}`;
            
            console.log('Uploading file:', fileName);

            const { error: uploadError } = await window.supabaseClient.storage
                .from('profile_pictures')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data } = window.supabaseClient.storage
                .from('profile_pictures')
                .getPublicUrl(fileName);

            console.log('Upload successful:', data.publicUrl);
            return data.publicUrl;
        } catch (error) {
            console.error('Profile picture upload error:', error);
            setStatus('Image upload failed, continuing without image', 'warning');
            return null;
        }
    }

    async showFollowersList(type) {
        try {
            const viewingUserId = sessionStorage.getItem('viewingUserId') || this.currentUserId;
            
            console.log('Loading', type, 'for user:', viewingUserId);
            
            let data, error;
            
            if (type === 'followers') {
                const result = await window.supabaseClient
                    .from('follows')
                    .select(`
                        follower_id,
                        follower:profiles!follows_follower_id_fkey (
                            id,
                            full_name,
                            job_title,
                            profile_picture_url
                        )
                    `)
                    .eq('followed_id', viewingUserId);
                
                console.log('Followers query result:', result);
                data = result.data?.map(item => ({ profiles: item.follower })) || [];
                error = result.error;
            } else {
                const result = await window.supabaseClient
                    .from('follows')
                    .select(`
                        followed_id,
                        followed:profiles!follows_followed_id_fkey (
                            id,
                            full_name,
                            job_title,
                            profile_picture_url
                        )
                    `)
                    .eq('follower_id', viewingUserId);
                
                console.log('Following query result:', result);
                data = result.data?.map(item => ({ profiles: item.followed })) || [];
                error = result.error;
            }

            if (error) throw error;

            console.log('Processed data:', data);
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
        
        console.log('Rendering modal with users:', users);
        
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

// Update button visibility based on profile ownership
async function updateProfileButtons() {
    const currentUserId = await getUserId();
    const viewingUserId = sessionStorage.getItem('viewingUserId');
    const isOwnProfile = !viewingUserId || viewingUserId === currentUserId;
    
    const editBtn = document.getElementById('editProfileBtn');
    const followBtn = document.querySelector('.follow-btn');
    const signOutBtn = document.getElementById('sign-out-btn');
    
    console.log('Updating buttons:', { 
        currentUserId, 
        viewingUserId, 
        isOwnProfile, 
        editBtn: !!editBtn, 
        followBtn: !!followBtn, 
        signOutBtn: !!signOutBtn 
    });
    
    if (editBtn) {
        editBtn.style.display = isOwnProfile ? 'inline-block' : 'none';
        console.log('Edit button display set to:', editBtn.style.display);
    }
    
    if (followBtn) {
        followBtn.style.display = isOwnProfile ? 'none' : 'inline-block';
        console.log('Follow button display set to:', followBtn.style.display);
    }
    
    if (signOutBtn) {
        signOutBtn.style.display = isOwnProfile ? 'inline-block' : 'none';
        console.log('Sign out button display set to:', signOutBtn.style.display);
    }
}

// Initialize
let profileManager;
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing ProfileManager...');
    profileManager = new ProfileManager();
    window.profileManager = profileManager;
    window.updateProfileButtons = updateProfileButtons;
    
    // Update buttons when profile tab is accessed
    setTimeout(updateProfileButtons, 1000);
});