// courses.js - Courses Management
let allCourses = [];
let enrolledCourses = [];

// Sample courses data (replace with actual API call)
const sampleCourses = [
    {
        id: 1,
        title: "Full Stack Web Development Bootcamp",
        instructor: "Sarah Johnson",
        thumbnail: null, // Will show gradient placeholder
        duration: "12 weeks",
        level: "Beginner",
        enrolled: false,
        progress: 0
    },
    {
        id: 2,
        title: "Advanced JavaScript & React",
        instructor: "Michael Chen",
        thumbnail: null,
        duration: "8 weeks",
        level: "Advanced",
        enrolled: false,
        progress: 0
    },
    {
        id: 3,
        title: "Python for Data Science",
        instructor: "Dr. Emily Rodriguez",
        thumbnail: null,
        duration: "10 weeks",
        level: "Intermediate",
        enrolled: false,
        progress: 0
    },
    {
        id: 4,
        title: "UI/UX Design Fundamentals",
        instructor: "Alex Turner",
        thumbnail: null,
        duration: "6 weeks",
        level: "Beginner",
        enrolled: false,
        progress: 0
    },
    {
        id: 5,
        title: "Mobile App Development with Flutter",
        instructor: "Jessica Martinez",
        thumbnail: null,
        duration: "14 weeks",
        level: "Intermediate",
        enrolled: false,
        progress: 0
    },
    {
        id: 6,
        title: "Machine Learning Essentials",
        instructor: "Dr. David Kim",
        thumbnail: null,
        duration: "16 weeks",
        level: "Advanced",
        enrolled: false,
        progress: 0
    }
];

// Initialize courses
function initializeCourses() {
    allCourses = [...sampleCourses];
    loadEnrolledCourses();
    renderCourses();
}

// Load enrolled courses from storage
async function loadEnrolledCourses() {
    try {
        const userId = await window.SkillenceCore.getUserId();
        if (!userId) return;

        // Check localStorage for enrolled courses
        const stored = localStorage.getItem(`enrolled_courses_${userId}`);
        if (stored) {
            enrolledCourses = JSON.parse(stored);
            // Update allCourses with enrollment status
            allCourses.forEach(course => {
                const enrolled = enrolledCourses.find(ec => ec.id === course.id);
                if (enrolled) {
                    course.enrolled = true;
                    course.progress = enrolled.progress || 0;
                }
            });
        }
    } catch (error) {
        console.error('Error loading enrolled courses:', error);
    }
}

// Save enrolled courses to storage
async function saveEnrolledCourses() {
    try {
        const userId = await window.SkillenceCore.getUserId();
        if (!userId) return;

        localStorage.setItem(`enrolled_courses_${userId}`, JSON.stringify(enrolledCourses));
    } catch (error) {
        console.error('Error saving enrolled courses:', error);
    }
}

// Render courses
function renderCourses(courses = allCourses) {
    const coursesGrid = document.getElementById('coursesGrid');
    if (!coursesGrid) return;

    if (courses.length === 0) {
        coursesGrid.innerHTML = '<p style="text-align: center; color: #6c757d;">No courses found</p>';
        return;
    }

    coursesGrid.innerHTML = courses.map(course => `
        <div class="course-card" onclick="viewCourse(${course.id})">
            <div class="course-thumbnail">
                ${course.thumbnail 
                    ? `<img src="${course.thumbnail}" alt="${course.title}">` 
                    : '📚'}
            </div>
            <div class="course-info">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-instructor">by ${course.instructor}</p>
                <div class="course-meta">
                    <span class="course-duration">⏱️ ${course.duration}</span>
                    <span class="course-level">📊 ${course.level}</span>
                </div>
                <div class="course-actions">
                    ${course.enrolled 
                        ? `<button class="continue-btn" onclick="event.stopPropagation(); continueCourse(${course.id})">Continue Learning</button>`
                        : `<button class="enroll-btn" onclick="event.stopPropagation(); enrollCourse(${course.id})">Enroll Now</button>`
                    }
                </div>
            </div>
        </div>
    `).join('');
}

// Render enrolled courses
function renderEnrolledCourses() {
    const enrolledGrid = document.getElementById('enrolledCoursesGrid');
    if (!enrolledGrid) return;

    if (enrolledCourses.length === 0) {
        enrolledGrid.innerHTML = '<p style="text-align: center; color: #6c757d;">No courses enrolled yet</p>';
        return;
    }

    enrolledGrid.innerHTML = enrolledCourses.map(course => `
        <div class="course-card" onclick="continueCourse(${course.id})">
            <div class="course-thumbnail">
                ${course.thumbnail 
                    ? `<img src="${course.thumbnail}" alt="${course.title}">` 
                    : '📚'}
            </div>
            <div class="course-info">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-instructor">by ${course.instructor}</p>
                <div class="course-progress">
                    <div class="progress-text">
                        <span>Progress</span>
                        <span>${course.progress}%</span>
                    </div>
                    <div class="progress-bar-wrapper">
                        <div class="progress-bar-inner" style="width: ${course.progress}%"></div>
                    </div>
                </div>
                <div class="course-meta">
                    <span class="course-duration">⏱️ ${course.duration}</span>
                    <span class="course-level">📊 ${course.level}</span>
                </div>
                <div class="course-actions">
                    <button class="continue-btn" onclick="event.stopPropagation(); continueCourse(${course.id})">Continue Learning</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Switch between browse and enrolled tabs
function switchCoursesTab(tab) {
    const browsTab = document.getElementById('browseCoursesTab');
    const enrolledTab = document.getElementById('enrolledCoursesTab');
    const tabBtns = document.querySelectorAll('.courses-tab-btn');

    if (tab === 'browse') {
        browsTab.classList.add('active');
        enrolledTab.classList.remove('active');
        tabBtns[0].classList.add('active');
        tabBtns[1].classList.remove('active');
        renderCourses();
    } else {
        browsTab.classList.remove('active');
        enrolledTab.classList.add('active');
        tabBtns[0].classList.remove('active');
        tabBtns[1].classList.add('active');
        renderEnrolledCourses();
    }
}

// Search courses
function searchCourses(query) {
    const filtered = allCourses.filter(course => 
        course.title.toLowerCase().includes(query.toLowerCase()) ||
        course.instructor.toLowerCase().includes(query.toLowerCase()) ||
        course.level.toLowerCase().includes(query.toLowerCase())
    );
    renderCourses(filtered);
}

// Enroll in course
async function enrollCourse(courseId) {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) return;

    const userId = await window.SkillenceCore.getUserId();
    if (!userId) {
        window.SkillenceCore.setStatus('Please sign in to enroll', 'error');
        return;
    }

    course.enrolled = true;
    course.progress = 0;
    enrolledCourses.push({...course});
    
    await saveEnrolledCourses();
    renderCourses();
    window.SkillenceCore.setStatus(`Successfully enrolled in "${course.title}"!`, 'success');
}

// Continue course (simulate progress update)
function continueCourse(courseId) {
    const course = enrolledCourses.find(c => c.id === courseId);
    if (!course) return;

    // Simulate progress increment
    course.progress = Math.min(course.progress + 10, 100);
    
    // Update in allCourses too
    const allCourse = allCourses.find(c => c.id === courseId);
    if (allCourse) allCourse.progress = course.progress;
    
    saveEnrolledCourses();
    renderEnrolledCourses();
    
    window.SkillenceCore.setStatus(
        `Progress updated! You're ${course.progress}% through "${course.title}"`, 
        'success'
    );
}

// View course details
function viewCourse(courseId) {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) return;
    
    // You can implement a modal or navigate to a course detail page
    window.SkillenceCore.setStatus(`Opening "${course.title}"...`, 'info');
}

// Export functions
window.CoursesModule = {
    initializeCourses,
    switchCoursesTab,
    searchCourses,
    enrollCourse,
    continueCourse,
    viewCourse
};

// Make functions globally accessible
window.switchCoursesTab = switchCoursesTab;
window.searchCourses = searchCourses;
window.enrollCourse = enrollCourse;
window.continueCourse = continueCourse;
window.viewCourse = viewCourse;

