// mentorship.js - Mentorship Management
let allMentors = [];

// Sample mentors data (replace with actual API call)
const sampleMentors = [
    {
        id: 1,
        name: "Dr. Sarah Johnson",
        title: "Senior Software Architect",
        avatar: null,
        rating: 4.9,
        reviewCount: 127,
        expertise: ["Software Architecture", "Cloud Computing", "Team Leadership"],
        experience: "15+ years",
        sessions: 250,
        responseTime: "< 2 hours"
    },
    {
        id: 2,
        name: "Michael Chen",
        title: "Full Stack Developer & Educator",
        avatar: null,
        rating: 4.8,
        reviewCount: 89,
        expertise: ["React", "Node.js", "TypeScript", "Web Development"],
        experience: "10+ years",
        sessions: 180,
        responseTime: "< 4 hours"
    },
    {
        id: 3,
        name: "Dr. Emily Rodriguez",
        title: "Data Science Lead",
        avatar: null,
        rating: 5.0,
        reviewCount: 156,
        expertise: ["Machine Learning", "Python", "Data Analysis", "AI"],
        experience: "12+ years",
        sessions: 310,
        responseTime: "< 1 hour"
    },
    {
        id: 4,
        name: "Alex Turner",
        title: "Senior UX Designer",
        avatar: null,
        rating: 4.7,
        reviewCount: 94,
        expertise: ["UI/UX Design", "Figma", "User Research", "Product Design"],
        experience: "8+ years",
        sessions: 145,
        responseTime: "< 3 hours"
    },
    {
        id: 5,
        name: "Jessica Martinez",
        title: "Mobile Development Expert",
        avatar: null,
        rating: 4.9,
        reviewCount: 112,
        expertise: ["Flutter", "React Native", "iOS", "Android"],
        experience: "9+ years",
        sessions: 198,
        responseTime: "< 2 hours"
    },
    {
        id: 6,
        name: "David Kim",
        title: "DevOps Engineer",
        avatar: null,
        rating: 4.8,
        reviewCount: 78,
        expertise: ["Docker", "Kubernetes", "AWS", "CI/CD"],
        experience: "11+ years",
        sessions: 167,
        responseTime: "< 4 hours"
    }
];

// Initialize mentors
function initializeMentors() {
    allMentors = [...sampleMentors];
    renderMentors();
}

// Render mentors
function renderMentors(mentors = allMentors) {
    const mentorsGrid = document.getElementById('mentorsGrid');
    if (!mentorsGrid) return;

    if (mentors.length === 0) {
        mentorsGrid.innerHTML = '<p style="text-align: center; color: #6c757d;">No mentors found</p>';
        return;
    }

    mentorsGrid.innerHTML = mentors.map(mentor => `
        <div class="mentor-card">
            <div class="mentor-header">
                <div class="mentor-avatar" style="background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: 700;">
                    ${mentor.avatar 
                        ? `<img src="${mentor.avatar}" alt="${mentor.name}" class="mentor-avatar">` 
                        : mentor.name.charAt(0)}
                </div>
                <div class="mentor-info">
                    <h3 class="mentor-name">${mentor.name}</h3>
                    <p class="mentor-title">${mentor.title}</p>
                    <div class="mentor-rating">
                        ⭐ ${mentor.rating}
                        <span class="rating-count">(${mentor.reviewCount} reviews)</span>
                    </div>
                </div>
            </div>
            
            <div class="mentor-expertise">
                <div class="expertise-label">Expertise</div>
                <div class="expertise-tags">
                    ${mentor.expertise.map(exp => 
                        `<span class="expertise-tag">${exp}</span>`
                    ).join('')}
                </div>
            </div>
            
            <div class="mentor-stats">
                <div class="mentor-stat">
                    <span class="stat-value">${mentor.sessions}+</span>
                    <span class="stat-label">Sessions</span>
                </div>
                <div class="mentor-stat">
                    <span class="stat-value">${mentor.experience}</span>
                    <span class="stat-label">Experience</span>
                </div>
                <div class="mentor-stat">
                    <span class="stat-value">${mentor.responseTime}</span>
                    <span class="stat-label">Response</span>
                </div>
            </div>
            
            <div class="mentor-actions">
                <button class="book-btn" onclick="bookMentor(${mentor.id})">Book Session</button>
                <button class="view-profile-btn" onclick="viewMentorProfile(${mentor.id})">View Profile</button>
            </div>
        </div>
    `).join('');
}

// Search mentors
function searchMentors(query) {
    const filtered = allMentors.filter(mentor => 
        mentor.name.toLowerCase().includes(query.toLowerCase()) ||
        mentor.title.toLowerCase().includes(query.toLowerCase()) ||
        mentor.expertise.some(exp => exp.toLowerCase().includes(query.toLowerCase()))
    );
    renderMentors(filtered);
}

// Book mentor session
async function bookMentor(mentorId) {
    const mentor = allMentors.find(m => m.id === mentorId);
    if (!mentor) return;

    const userId = await window.SkillenceCore.getUserId();
    if (!userId) {
        window.SkillenceCore.setStatus('Please sign in to book a session', 'error');
        return;
    }

    // Here you would typically open a booking modal or navigate to booking page
    window.SkillenceCore.setStatus(
        `Booking session with ${mentor.name}... (Feature coming soon!)`, 
        'info'
    );
    
    // You can implement a modal for selecting date/time here
}

// View mentor profile
function viewMentorProfile(mentorId) {
    const mentor = allMentors.find(m => m.id === mentorId);
    if (!mentor) return;

    // You can implement a modal or navigate to mentor profile page
    window.SkillenceCore.setStatus(`Opening ${mentor.name}'s profile...`, 'info');
}

// Export functions
window.MentorshipModule = {
    initializeMentors,
    searchMentors,
    bookMentor,
    viewMentorProfile
};

// Make functions globally accessible
window.searchMentors = searchMentors;
window.bookMentor = bookMentor;
window.viewMentorProfile = viewMentorProfile;

