// Initialize Supabase
const supabase = window.supabase.createClient(
    'https://anzrbwcextohaatvwvvh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuenJid2NleHRvaGFhdHZ3dnZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NjE2NDgsImV4cCI6MjA3MzIzNzY0OH0.DSJBwubiIAqEXDqVZMuJLUrsgY9vBKDQuPQBPIItHuw'
);

// State Management
const state = {
    currentStep: 1,
    totalSteps: 4,
    formData: {
        profilePicture: null,
        profilePictureUrl: null,
        jobTitle: '',
        industry: '',
        experienceLevel: '',
        skills: [],
        goals: []
    }
};

// Common Skills Suggestions
const skillsSuggestions = [
    'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'HTML/CSS',
    'UI/UX Design', 'Graphic Design', 'Product Design', 'Figma', 'Adobe XD',
    'Project Management', 'Agile', 'Scrum', 'Leadership', 'Communication',
    'Data Analysis', 'SQL', 'Excel', 'Data Visualization',
    'Digital Marketing', 'SEO', 'Content Marketing', 'Social Media',
    'Sales', 'Customer Service', 'Negotiation', 'Public Speaking'
];

// DOM Elements
const elements = {
    form: document.getElementById('onboarding-form'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    submitBtn: document.getElementById('submitBtn'),
    progressFill: document.getElementById('progressFill'),
    statusMessage: document.getElementById('statusMessage'),
    uploadArea: document.getElementById('uploadArea'),
    profilePictureInput: document.getElementById('profile-picture'),
    previewImage: document.getElementById('previewImage'),
    uploadPreview: document.getElementById('uploadPreview'),
    jobTitleInput: document.getElementById('job-title'),
    industrySelect: document.getElementById('industry'),
    skillsInput: document.getElementById('top-skills'),
    skillsList: document.getElementById('skillsList'),
    skillsSuggestions: document.getElementById('skillsSuggestions'),
    profileReview: document.getElementById('profileReview'),
    agreeTerms: document.getElementById('agreeTerms')
};

// Utility Functions
function setStatus(message, type = 'info', duration = 5000) {
    if (!elements.statusMessage) return;
    
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status-message show ${type}`;
    
    if (duration > 0) {
        setTimeout(() => {
            elements.statusMessage.classList.remove('show');
        }, duration);
    }
}

function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Step Navigation
function updateProgress() {
    const progress = (state.currentStep / state.totalSteps) * 100;
    elements.progressFill.style.width = `${progress}%`;
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNum < state.currentStep) {
            step.classList.add('completed');
        } else if (stepNum === state.currentStep) {
            step.classList.add('active');
        }
    });
    
    // Show/hide form steps
    document.querySelectorAll('.form-step').forEach((step, index) => {
        step.classList.remove('active');
        if (index + 1 === state.currentStep) {
            step.classList.add('active');
        }
    });
    
    // Update buttons
    elements.prevBtn.style.display = state.currentStep === 1 ? 'none' : 'inline-flex';
    elements.nextBtn.style.display = state.currentStep === state.totalSteps ? 'none' : 'inline-flex';
    elements.submitBtn.style.display = state.currentStep === state.totalSteps ? 'inline-flex' : 'none';
}

function nextStep() {
    if (!validateCurrentStep()) return;
    
    if (state.currentStep < state.totalSteps) {
        state.currentStep++;
        
        if (state.currentStep === state.totalSteps) {
            populateReview();
        }
        
        updateProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function prevStep() {
    if (state.currentStep > 1) {
        state.currentStep--;
        updateProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Step Validation
function validateCurrentStep() {
    switch (state.currentStep) {
        case 1: return validateStep1();
        case 2: return validateStep2();
        case 3: return validateStep3();
        case 4: return validateStep4();
        default: return true;
    }
}

function validateStep1() {
    const jobTitle = elements.jobTitleInput?.value.trim();
    const industry = elements.industrySelect?.value;
    const experience = document.querySelector('input[name="experience"]:checked');
    
    if (!jobTitle) {
        setStatus('Please enter your job title', 'error');
        elements.jobTitleInput?.focus();
        return false;
    }
    
    if (jobTitle.length < 2) {
        setStatus('Job title must be at least 2 characters', 'error');
        elements.jobTitleInput?.focus();
        return false;
    }
    
    if (!industry) {
        setStatus('Please select your industry', 'error');
        elements.industrySelect?.focus();
        return false;
    }
    
    if (!experience) {
        setStatus('Please select your experience level', 'error');
        return false;
    }
    
    state.formData.jobTitle = jobTitle;
    state.formData.industry = industry;
    state.formData.experienceLevel = experience.value;
    
    return true;
}

function validateStep2() {
    if (state.formData.skills.length === 0) {
        setStatus('Please add at least one skill', 'error');
        elements.skillsInput?.focus();
        return false;
    }
    
    if (state.formData.skills.length > 5) {
        setStatus('Maximum 5 skills allowed', 'error');
        return false;
    }
    
    return true;
}

function validateStep3() {
    const selectedGoals = Array.from(document.querySelectorAll('input[name="goals"]:checked'))
        .map(cb => cb.value);
    
    if (selectedGoals.length === 0) {
        setStatus('Please select at least one goal', 'error');
        return false;
    }
    
    state.formData.goals = selectedGoals;
    return true;
}

function validateStep4() {
    if (!elements.agreeTerms?.checked) {
        setStatus('Please agree to the Terms of Service and Privacy Policy', 'error');
        return false;
    }
    
    return true;
}

// Profile Picture Upload
function setupProfilePictureUpload() {
    if (elements.uploadArea) {
        elements.uploadArea.addEventListener('click', () => {
            elements.profilePictureInput?.click();
        });
    }
    
    if (elements.profilePictureInput) {
        elements.profilePictureInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    setStatus('Image must be less than 5MB', 'error');
                    return;
                }
                
                if (!file.type.startsWith('image/')) {
                    setStatus('Please upload an image file', 'error');
                    return;
                }
                
                state.formData.profilePicture = file;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    elements.previewImage.src = e.target.result;
                    elements.previewImage.style.display = 'block';
                    elements.uploadPreview.querySelector('.preview-placeholder').style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// Skills Management
function setupSkillsInput() {
    if (!elements.skillsInput) return;
    
    elements.skillsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill(elements.skillsInput.value.trim());
        }
    });
    
    elements.skillsInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        
        if (query.length >= 2) {
            const matches = skillsSuggestions.filter(skill => 
                skill.toLowerCase().includes(query) && 
                !state.formData.skills.includes(skill)
            ).slice(0, 5);
            
            showSkillsSuggestions(matches);
        } else {
            hideSkillsSuggestions();
        }
    });
    
    document.addEventListener('click', (e) => {
        if (!elements.skillsInput?.contains(e.target) && 
            !elements.skillsSuggestions?.contains(e.target)) {
            hideSkillsSuggestions();
        }
    });
}

function showSkillsSuggestions(suggestions) {
    if (!elements.skillsSuggestions) return;
    
    if (suggestions.length === 0) {
        hideSkillsSuggestions();
        return;
    }
    
    elements.skillsSuggestions.innerHTML = suggestions.map(skill => 
        `<div class="skill-suggestion" onclick="addSkill('${skill}')">${skill}</div>`
    ).join('');
    
    elements.skillsSuggestions.classList.add('show');
}

function hideSkillsSuggestions() {
    if (elements.skillsSuggestions) {
        elements.skillsSuggestions.classList.remove('show');
        elements.skillsSuggestions.innerHTML = '';
    }
}

function addSkill(skill) {
    if (!skill) return;
    
    if (state.formData.skills.length >= 5) {
        setStatus('Maximum 5 skills allowed', 'warning', 2000);
        return;
    }
    
    if (state.formData.skills.includes(skill)) {
        setStatus('Skill already added', 'warning', 2000);
        return;
    }
    
    state.formData.skills.push(skill);
    renderSkills();
    
    if (elements.skillsInput) {
        elements.skillsInput.value = '';
    }
    
    hideSkillsSuggestions();
}

function removeSkill(skill) {
    state.formData.skills = state.formData.skills.filter(s => s !== skill);
    renderSkills();
}

function renderSkills() {
    if (!elements.skillsList) return;
    
    if (state.formData.skills.length === 0) {
        elements.skillsList.innerHTML = '';
        return;
    }
    
    elements.skillsList.innerHTML = state.formData.skills.map(skill => `
        <div class="skill-tag">
            ${sanitizeInput(skill)}
            <span class="remove-skill" onclick="removeSkill('${skill}')">×</span>
        </div>
    `).join('');
}

// Review Profile
function populateReview() {
    if (!elements.profileReview) return;
    
    let html = '';
    
    if (state.formData.profilePicture) {
        const previewUrl = elements.previewImage?.src;
        html += `
            <div class="review-item">
                <div class="review-label">Profile Picture</div>
                <img src="${previewUrl}" class="review-profile-picture" alt="Profile Picture">
            </div>
        `;
    }
    
    html += `
        <div class="review-item">
            <div class="review-label">Job Title</div>
            <div class="review-value">${sanitizeInput(state.formData.jobTitle)}</div>
        </div>
        <div class="review-item">
            <div class="review-label">Industry</div>
            <div class="review-value">${sanitizeInput(state.formData.industry)}</div>
        </div>
        <div class="review-item">
            <div class="review-label">Experience Level</div>
            <div class="review-value">${sanitizeInput(state.formData.experienceLevel)}</div>
        </div>
        <div class="review-item">
            <div class="review-label">Skills</div>
            <div class="review-value">
                <div class="skills-list">
                    ${state.formData.skills.map(skill => 
                        `<span class="skill-tag">${sanitizeInput(skill)}</span>`
                    ).join('')}
                </div>
            </div>
        </div>
        <div class="review-item">
            <div class="review-label">Goals</div>
            <div class="review-value">${state.formData.goals.map(sanitizeInput).join(', ')}</div>
        </div>
    `;
    
    elements.profileReview.innerHTML = html;
}

// Form Submission - FIXED
async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateCurrentStep()) return;
    
    elements.submitBtn.disabled = true;
    elements.submitBtn.innerHTML = `
        <span>Creating Profile...</span>
        <span class="spinner-small"></span>
    `;
    
    try {
        // Get user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
            setStatus('No active session. Redirecting to login...', 'error');
            setTimeout(() => {
                window.location.href = '../templates/login.html';
            }, 1500);
            return;
        }
        
        const userId = session.user.id;
        
        // Upload profile picture if provided
        let profilePictureUrl = null;
        
        if (state.formData.profilePicture) {
            setStatus('Uploading profile picture...', 'info', 0);
            
            const fileName = `${userId}/${Date.now()}_${state.formData.profilePicture.name}`;
            
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(fileName, state.formData.profilePicture, { upsert: true });
            
            if (uploadError) {
                console.warn('Profile picture upload failed:', uploadError);
                setStatus('Continuing without profile picture...', 'warning', 2000);
            } else {
                const { data: urlData } = supabase.storage
                    .from('images')
                    .getPublicUrl(fileName);
                
                profilePictureUrl = urlData.publicUrl;
            }
        }
        
        // Save profile data
        setStatus('Saving your profile...', 'info', 0);
        
        const profileData = {
            id: userId,
            job_title: state.formData.jobTitle,
            industry: state.formData.industry,
            experience_level: state.formData.experienceLevel,
            top_skills: state.formData.skills,
            goals: state.formData.goals,
            profile_picture_url: profilePictureUrl,
            updated_at: new Date().toISOString()
        };
        
        const { error: upsertError } = await supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' });
        
        if (upsertError) throw upsertError;
        
        // Add user interests - FIXED: Use try-catch instead of .catch()
        if (state.formData.skills.length > 0) {
            try {
                const interests = state.formData.skills.map(skill => ({
                    user_id: userId,
                    interest: skill.toLowerCase()
                }));
                
                const { error: interestsError } = await supabase
                    .from('user_interests')
                    .upsert(interests, { 
                        onConflict: 'user_id,interest',
                        ignoreDuplicates: true 
                    });
                
                if (interestsError) {
                    console.log('User interests table not available:', interestsError);
                }
            } catch (interestsErr) {
                console.log('Could not save user interests:', interestsErr);
            }
        }
        
        // Success!
        setStatus('🎉 Profile created successfully! Redirecting...', 'success', 3000);
        
        setTimeout(() => {
            window.location.href = '../templates/home.html';
        }, 2000);
        
    } catch (error) {
        console.error('Onboarding error:', error);
        setStatus(`Error: ${error.message || 'Unexpected error occurred'}`, 'error');
        elements.submitBtn.disabled = false;
        elements.submitBtn.innerHTML = 'Complete Profile 🎉';
    }
}

// Check Onboarding Status
async function checkOnboardingStatus() {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
            setStatus('No active session. Redirecting to login...', 'error');
            setTimeout(() => {
                window.location.href = '../templates/login.html';
            }, 1500);
            return;
        }
        
        // Check if profile already completed
        const { data, error } = await supabase
            .from('profiles')
            .select('job_title, industry')
            .eq('id', session.user.id)
            .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        
        // If profile exists and is complete, redirect to home
        if (data && data.job_title && data.industry) {
            console.log('Onboarding already completed');
            window.location.href = '../templates/home.html';
            return;
        }
        
        // Ensure profile row exists
        if (!data) {
            console.log('Creating profile row...');
            const { error: insertError } = await supabase
                .from('profiles')
                .insert({ id: session.user.id });
            
            if (insertError && insertError.code !== '23505') {
                throw insertError;
            }
        }
        
    } catch (error) {
        console.error('Onboarding status check error:', error);
        setStatus(`Error: ${error.message}`, 'error');
    }
}

// Input Validation Feedback
function setupInputValidation() {
    if (elements.jobTitleInput) {
        elements.jobTitleInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            const feedback = document.getElementById('jobTitleFeedback');
            
            if (!feedback) return;
            
            if (value.length === 0) {
                feedback.textContent = '';
                e.target.classList.remove('error', 'success');
            } else if (value.length < 2) {
                feedback.textContent = 'Too short';
                feedback.className = 'input-feedback error';
                e.target.classList.add('error');
                e.target.classList.remove('success');
            } else {
                feedback.textContent = 'Looks good!';
                feedback.className = 'input-feedback success';
                e.target.classList.add('success');
                e.target.classList.remove('error');
            }
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Onboarding: Initializing...');
    
    // Check authentication
    checkOnboardingStatus();
    
    // Setup event listeners
    if (elements.form) {
        elements.form.addEventListener('submit', handleSubmit);
    }
    
    if (elements.prevBtn) {
        elements.prevBtn.addEventListener('click', prevStep);
    }
    
    if (elements.nextBtn) {
        elements.nextBtn.addEventListener('click', nextStep);
    }
    
    // Setup features
    setupProfilePictureUpload();
    setupSkillsInput();
    setupInputValidation();
    
    // Initialize progress
    updateProgress();
    
    console.log('Onboarding: Ready');
});

// Export functions for inline onclick handlers
window.addSkill = addSkill;
window.removeSkill = removeSkill;