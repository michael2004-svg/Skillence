// courses.js - Enhanced Courses Management with Database Integration
let allCourses = [];
let enrolledCourses = [];
let currentCourse = null;

// Initialize courses from database
async function initializeCourses() {
    try {
        await loadCoursesFromDatabase();
        await loadEnrolledCourses();
        renderCourses();
    } catch (error) {
        console.error('Error initializing courses:', error);
        window.SkillenceCore.setStatus('Failed to load courses', 'error');
    }
}

// Load courses from Supabase
async function loadCoursesFromDatabase() {
    try {
        const { data, error } = await window.supabaseClient
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        allCourses = data || [];
        
        // If no courses exist, you can optionally seed some sample data
        if (allCourses.length === 0) {
            console.log('No courses found in database');
        }
    } catch (error) {
        console.error('Error loading courses:', error);
        throw error;
    }
}

// Load enrolled courses for current user
async function loadEnrolledCourses() {
    try {
        const userId = await window.SkillenceCore.getUserId();
        if (!userId) return;

        const { data, error } = await window.supabaseClient
            .from('course_enrollments')
            .select(`
                *,
                courses (*)
            `)
            .eq('user_id', userId);

        if (error) throw error;
        
        enrolledCourses = data?.map(enrollment => ({
            ...enrollment.courses,
            enrollment_id: enrollment.id,
            progress: enrollment.progress,
            enrolled_at: enrollment.enrolled_at,
            completed: enrollment.completed
        })) || [];

    } catch (error) {
        console.error('Error loading enrolled courses:', error);
    }
}

// Render courses grid
function renderCourses(courses = allCourses) {
    const coursesGrid = document.getElementById('coursesGrid');
    if (!coursesGrid) return;

    if (courses.length === 0) {
        coursesGrid.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6c757d;">
                <p style="font-size: 18px; margin-bottom: 10px;">No courses available yet</p>
                <p style="font-size: 14px;">Check back soon for new courses!</p>
            </div>
        `;
        return;
    }

    coursesGrid.innerHTML = courses.map(course => {
        const isEnrolled = enrolledCourses.some(ec => ec.id === course.id);
        const enrolledCourse = enrolledCourses.find(ec => ec.id === course.id);
        
        return `
            <div class="course-card" onclick="viewCourse(${course.id})">
                <div class="course-thumbnail" style="background: ${!course.image_url ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'none'};">
                    ${course.image_url 
                        ? `<img src="${course.image_url}" alt="${course.title}" style="width: 100%; height: 100%; object-fit: cover;">` 
                        : `<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 48px;">📚</div>`
                    }
                    ${course.price > 0 
                        ? `<div class="course-price-badge">$${parseFloat(course.price).toFixed(2)}</div>`
                        : `<div class="course-price-badge free">FREE</div>`
                    }
                </div>
                <div class="course-info">
                    <h3 class="course-title">${course.title}</h3>
                    <p class="course-instructor">by ${course.instructor_name || 'Platform Instructor'}</p>
                    ${course.description ? `<p class="course-description">${course.description.substring(0, 100)}${course.description.length > 100 ? '...' : ''}</p>` : ''}
                    <div class="course-meta">
                        <span class="course-duration">⏱️ ${course.duration || 'Self-paced'}</span>
                        <span class="course-level">📊 ${course.level || 'All Levels'}</span>
                    </div>
                    ${isEnrolled ? `
                        <div class="course-progress-mini">
                            <div class="progress-bar-wrapper">
                                <div class="progress-bar-inner" style="width: ${enrolledCourse.progress || 0}%"></div>
                            </div>
                            <span class="progress-text">${enrolledCourse.progress || 0}% Complete</span>
                        </div>
                    ` : ''}
                    <div class="course-actions">
                        ${isEnrolled 
                            ? `<button class="continue-btn" onclick="event.stopPropagation(); continueCourse(${course.id})">Continue Learning</button>`
                            : `<button class="enroll-btn" onclick="event.stopPropagation(); enrollCourse(${course.id})">
                                ${course.price > 0 ? `Enroll - $${parseFloat(course.price).toFixed(2)}` : 'Enroll Free'}
                            </button>`
                        }
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render enrolled courses
function renderEnrolledCourses() {
    const enrolledGrid = document.getElementById('enrolledCoursesGrid');
    if (!enrolledGrid) return;

    if (enrolledCourses.length === 0) {
        enrolledGrid.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6c757d;">
                <p style="font-size: 18px; margin-bottom: 10px;">No courses enrolled yet</p>
                <p style="font-size: 14px;">Browse courses and start learning!</p>
            </div>
        `;
        return;
    }

    enrolledGrid.innerHTML = enrolledCourses.map(course => `
        <div class="course-card" onclick="continueCourse('${course.id}')">
            <div class="course-thumbnail" style="background: ${!course.thumbnail_url ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'none'};">
                ${course.thumbnail_url 
                    ? `<img src="${course.thumbnail_url}" alt="${course.title}" style="width: 100%; height: 100%; object-fit: cover;">` 
                    : `<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 48px;">📚</div>`
                }
                ${course.completed ? '<div class="course-completed-badge">✓ Completed</div>' : ''}
            </div>
            <div class="course-info">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-instructor">by ${course.instructor_name}</p>
                <div class="course-progress">
                    <div class="progress-text">
                        <span>Progress</span>
                        <span>${course.progress || 0}%</span>
                    </div>
                    <div class="progress-bar-wrapper">
                        <div class="progress-bar-inner" style="width: ${course.progress || 0}%"></div>
                    </div>
                </div>
                <div class="course-meta">
                    <span class="course-duration">⏱️ ${course.duration || 'Self-paced'}</span>
                    <span class="course-level">📊 ${course.level || 'All Levels'}</span>
                </div>
                <div class="course-actions">
                    <button class="continue-btn" onclick="event.stopPropagation(); continueCourse('${course.id}')">
                        ${course.completed ? 'Review Course' : 'Continue Learning'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Switch between browse and enrolled tabs
function switchCoursesTab(tab) {
    const browseTab = document.getElementById('browseCoursesTab');
    const enrolledTab = document.getElementById('enrolledCoursesTab');
    const tabBtns = document.querySelectorAll('.courses-tab-btn');

    if (tab === 'browse') {
        browseTab.classList.add('active');
        enrolledTab.classList.remove('active');
        tabBtns[0].classList.add('active');
        tabBtns[1].classList.remove('active');
        renderCourses();
    } else {
        browseTab.classList.remove('active');
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
        course.instructor_name.toLowerCase().includes(query.toLowerCase()) ||
        (course.level && course.level.toLowerCase().includes(query.toLowerCase())) ||
        (course.description && course.description.toLowerCase().includes(query.toLowerCase())) ||
        (course.category && course.category.toLowerCase().includes(query.toLowerCase()))
    );
    renderCourses(filtered);
}

// Enroll in course
async function enrollCourse(courseId) {
    try {
        const userId = await window.SkillenceCore.getUserId();
        if (!userId) {
            window.SkillenceCore.setStatus('Please sign in to enroll', 'error');
            return;
        }

        const course = allCourses.find(c => c.id === courseId);
        if (!course) return;

        // Check if already enrolled
        const alreadyEnrolled = enrolledCourses.some(ec => ec.id === courseId);
        if (alreadyEnrolled) {
            window.SkillenceCore.setStatus('You are already enrolled in this course', 'info');
            return;
        }

        // For paid courses, you would integrate payment here
        if (course.price > 0) {
            const confirmEnroll = confirm(`This course costs $${course.price.toFixed(2)}. Proceed with enrollment?\n\n(Payment integration coming soon - enrolling for free in demo)`);
            if (!confirmEnroll) return;
        }

        // Insert enrollment
        const { data, error } = await window.supabaseClient
            .from('course_enrollments')
            .insert({
                user_id: userId,
                course_id: courseId,
                progress: 0,
                completed: false
            })
            .select()
            .single();

        if (error) throw error;

        // Reload enrolled courses
        await loadEnrolledCourses();
        renderCourses();
        
        window.SkillenceCore.setStatus(`Successfully enrolled in "${course.title}"!`, 'success');
        
    } catch (error) {
        console.error('Error enrolling in course:', error);
        window.SkillenceCore.setStatus('Failed to enroll in course', 'error');
    }
}

// Continue/Open course
async function continueCourse(courseId) {
    try {
        const course = enrolledCourses.find(c => c.id === courseId) || allCourses.find(c => c.id === courseId);
        if (!course) return;

        currentCourse = course;

        // Load course modules
        const { data: modules, error } = await window.supabaseClient
            .from('course_modules')
            .select('*')
            .eq('course_id', courseId)
            .order('order_index', { ascending: true });

        if (error) throw error;

        // Open course viewer modal
        openCourseViewer(course, modules || []);
        
    } catch (error) {
        console.error('Error loading course:', error);
        window.SkillenceCore.setStatus('Failed to load course content', 'error');
    }
}

// Open course viewer modal
function openCourseViewer(course, modules) {
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'course-viewer-modal';
    modal.innerHTML = `
        <div class="course-viewer-container">
            <div class="course-viewer-header">
                <h2>${course.title}</h2>
                <button class="close-viewer-btn" onclick="closeCourseViewer()">✕</button>
            </div>
            <div class="course-viewer-body">
                <div class="course-sidebar">
                    <h3>Course Content</h3>
                    <div class="modules-list">
                        ${modules.length > 0 
                            ? modules.map((module, index) => `
                                <div class="module-item" onclick="loadModule('${module.id}')">
                                    <span class="module-number">${index + 1}</span>
                                    <span class="module-title">${module.title}</span>
                                    <span class="module-duration">${module.duration_minutes || 0} min</span>
                                </div>
                            `).join('')
                            : '<p class="no-modules">No modules available yet</p>'
                        }
                    </div>
                    ${course.content_url ? `
                        <button class="download-course-btn" onclick="window.open('${course.content_url}', '_blank')">
                            📄 Download Course PDF
                        </button>
                    ` : ''}
                </div>
                <div class="course-content-area">
                    <div id="courseContentViewer" class="content-viewer">
                        <div class="content-placeholder">
                            <h3>Welcome to ${course.title}</h3>
                            <p>${course.description || 'Select a module from the sidebar to begin learning.'}</p>
                            ${course.content_url ? `
                                <iframe src="${course.content_url}" class="pdf-viewer" frameborder="0"></iframe>
                            ` : ''}
                        </div>
                    </div>
                    <div class="content-actions">
                        <button class="mark-complete-btn" onclick="markModuleComplete()">Mark as Complete</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load first module if available
    if (modules.length > 0) {
        loadModule(modules[0].id);
    }
}

// Load module content
async function loadModule(moduleId) {
    try {
        const { data: module, error } = await window.supabaseClient
            .from('course_modules')
            .select('*')
            .eq('id', moduleId)
            .single();

        if (error) throw error;

        const contentViewer = document.getElementById('courseContentViewer');
        if (!contentViewer) return;

        let contentHtml = '';
        
        if (module.content_url) {
            // PDF or document
            if (module.content_url.endsWith('.pdf')) {
                contentHtml = `
                    <div class="module-content">
                        <h3>${module.title}</h3>
                        <iframe src="${module.content_url}" class="pdf-viewer" frameborder="0"></iframe>
                        <a href="${module.content_url}" target="_blank" class="download-link">📄 Open in new tab</a>
                    </div>
                `;
            } else {
                contentHtml = `
                    <div class="module-content">
                        <h3>${module.title}</h3>
                        <iframe src="${module.content_url}" class="pdf-viewer" frameborder="0"></iframe>
                    </div>
                `;
            }
        }
        
        if (module.video_url) {
            contentHtml += `
                <div class="video-container">
                    <iframe src="${module.video_url}" frameborder="0" allowfullscreen class="video-player"></iframe>
                </div>
            `;
        }
        
        if (!module.content_url && !module.video_url) {
            contentHtml = `
                <div class="content-placeholder">
                    <h3>${module.title}</h3>
                    <p>Content for this module is being prepared.</p>
                </div>
            `;
        }

        contentViewer.innerHTML = contentHtml;
        contentViewer.dataset.moduleId = moduleId;
        
    } catch (error) {
        console.error('Error loading module:', error);
        window.SkillenceCore.setStatus('Failed to load module', 'error');
    }
}

// Mark module as complete
async function markModuleComplete() {
    try {
        const contentViewer = document.getElementById('courseContentViewer');
        const moduleId = contentViewer?.dataset.moduleId;
        
        if (!moduleId) {
            window.SkillenceCore.setStatus('No module selected', 'error');
            return;
        }

        const userId = await window.SkillenceCore.getUserId();
        if (!userId) return;

        // Mark module complete
        const { error: progressError } = await window.supabaseClient
            .from('module_progress')
            .upsert({
                user_id: userId,
                module_id: moduleId,
                completed: true,
                completed_at: new Date().toISOString()
            });

        if (progressError) throw progressError;

        // Update course progress
        await updateCourseProgress(currentCourse.id);
        
        window.SkillenceCore.setStatus('Module marked as complete!', 'success');
        
    } catch (error) {
        console.error('Error marking module complete:', error);
        window.SkillenceCore.setStatus('Failed to update progress', 'error');
    }
}

// Update overall course progress
async function updateCourseProgress(courseId) {
    try {
        const userId = await window.SkillenceCore.getUserId();
        if (!userId) return;

        // Get total modules
        const { data: modules, error: modulesError } = await window.supabaseClient
            .from('course_modules')
            .select('id')
            .eq('course_id', courseId);

        if (modulesError) throw modulesError;

        // Get completed modules
        const { data: completedModules, error: progressError } = await window.supabaseClient
            .from('module_progress')
            .select('module_id')
            .eq('user_id', userId)
            .eq('completed', true)
            .in('module_id', modules.map(m => m.id));

        if (progressError) throw progressError;

        const totalModules = modules.length;
        const completed = completedModules.length;
        const progress = totalModules > 0 ? Math.round((completed / totalModules) * 100) : 0;

        // Update enrollment progress
        const { error: updateError } = await window.supabaseClient
            .from('course_enrollments')
            .update({ 
                progress,
                completed: progress === 100
            })
            .eq('user_id', userId)
            .eq('course_id', courseId);

        if (updateError) throw updateError;

        // Reload enrolled courses
        await loadEnrolledCourses();
        
    } catch (error) {
        console.error('Error updating course progress:', error);
    }
}

// Close course viewer
function closeCourseViewer() {
    const modal = document.querySelector('.course-viewer-modal');
    if (modal) {
        modal.remove();
    }
    currentCourse = null;
    // Refresh courses display
    switchCoursesTab('enrolled');
}

// View course details (before enrollment)
function viewCourse(courseId) {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) return;
    
    const isEnrolled = enrolledCourses.some(ec => ec.id === courseId);
    
    if (isEnrolled) {
        continueCourse(courseId);
    } else {
        // Show course details modal
        showCourseDetails(course);
    }
}

// Show course details modal
function showCourseDetails(course) {
    const modal = document.createElement('div');
    modal.className = 'course-details-modal';
    modal.innerHTML = `
        <div class="course-details-container">
            <button class="close-details-btn" onclick="this.closest('.course-details-modal').remove()">✕</button>
            <div class="course-details-header">
                <div class="course-thumbnail-large" style="background: ${!course.thumbnail_url ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'none'};">
                    ${course.thumbnail_url 
                        ? `<img src="${course.thumbnail_url}" alt="${course.title}">` 
                        : '<div style="font-size: 80px;">📚</div>'
                    }
                </div>
                <div class="course-details-info">
                    <h2>${course.title}</h2>
                    <p class="course-instructor">Instructor: ${course.instructor_name}</p>
                    <div class="course-meta-large">
                        <span>⏱️ ${course.duration || 'Self-paced'}</span>
                        <span>📊 ${course.level || 'All Levels'}</span>
                        <span>${course.price > 0 ? `💰 $${course.price.toFixed(2)}` : '🎁 FREE'}</span>
                    </div>
                    <div class="course-description-full">
                        <h3>About this course</h3>
                        <p>${course.description || 'No description available.'}</p>
                    </div>
                    <button class="enroll-btn-large" onclick="enrollCourse('${course.id}'); this.closest('.course-details-modal').remove();">
                        ${course.price > 0 ? `Enroll Now - $${course.price.toFixed(2)}` : 'Enroll for Free'}
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Export functions
window.CoursesModule = {
    initializeCourses,
    switchCoursesTab,
    searchCourses,
    enrollCourse,
    continueCourse,
    viewCourse,
    closeCourseViewer,
    markModuleComplete
};

// Make functions globally accessible
window.switchCoursesTab = switchCoursesTab;
window.searchCourses = searchCourses;
window.enrollCourse = enrollCourse;
window.continueCourse = continueCourse;
window.viewCourse = viewCourse;
window.closeCourseViewer = closeCourseViewer;
window.loadModule = loadModule;
window.markModuleComplete = markModuleComplete;