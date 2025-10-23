// === Career Feature Enhancements ===

// Helper: show/hide sections
function handleFeatureClick(feature) {
  const jobsSection = document.getElementById('jobsSection');
  const coursesSection = document.getElementById('coursesSection');
  const mentorshipSection = document.getElementById('mentorshipSection');

  [jobsSection, coursesSection, mentorshipSection].forEach(s => s?.classList.add('hidden'));

  if (feature === 'jobs') jobsSection.classList.remove('hidden');
  if (feature === 'courses') {
    coursesSection.classList.remove('hidden');
    loadCourses();
  }
  if (feature === 'mentorship') {
    mentorshipSection.classList.remove('hidden');
    loadMentors();
  }
  if (feature === 'cv-analyzer') switchTab('cv-analyzer');
}

// === COURSES ===
async function loadCourses() {
  const list = document.getElementById('coursesList');
  if (!list) return;
  list.innerHTML = '<p>Loading courses...</p>';

  try {
    const { data, error } = await window.supabaseClient.from('courses').select('*').order('id', { ascending: true });
    if (error) throw error;

    if (!data.length) {
      list.innerHTML = '<p>No courses available yet.</p>';
      return;
    }

    list.innerHTML = data.map(course => `
      <div class="feature-card">
        <img src="${course.image_url || '../images/default-course.jpg'}" style="width:100%;border-radius:12px;margin-bottom:10px;object-fit:cover;height:140px;">
        <div class="feature-title">${course.title}</div>
        <p style="font-size:14px;color:#6c757d;margin:8px 0;">${course.description}</p>
        <p style="font-size:13px;color:#667eea;font-weight:600;">${course.level} • ${course.duration}</p>
        <button class="apply-btn" style="margin-top:10px;" onclick="window.open('${course.link}', '_blank')">Start Course</button>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading courses:', err);
    list.innerHTML = '<p>Failed to load courses.</p>';
  }
}

function searchCourses() {
  const q = document.getElementById('coursesSearchInput').value.toLowerCase();
  const cards = document.querySelectorAll('#coursesList .feature-card');
  cards.forEach(card => {
    const match = card.textContent.toLowerCase().includes(q);
    card.style.display = match ? 'block' : 'none';
  });
}

// === MENTORSHIP ===
async function loadMentors() {
  const list = document.getElementById('mentorsList');
  if (!list) return;
  list.innerHTML = '<p>Loading mentors...</p>';

  try {
    const { data, error } = await window.supabaseClient.from('mentors').select('*').order('id', { ascending: true });
    if (error) throw error;

    if (!data.length) {
      list.innerHTML = '<p>No mentors found yet.</p>';
      return;
    }

    list.innerHTML = data.map(mentor => `
      <div class="feature-card">
        <img src="${mentor.image_url || '../images/default-user.jpg'}" style="width:100%;border-radius:12px;margin-bottom:10px;object-fit:cover;height:160px;">
        <div class="feature-title">${mentor.name}</div>
        <p style="font-size:14px;color:#6c757d;margin:6px 0;">${mentor.title}</p>
        <p style="font-size:13px;color:#2c3e50;line-height:1.4;">${mentor.bio}</p>
        <div style="font-size:13px;color:#667eea;margin:8px 0;">${mentor.expertise?.join(', ') || ''}</div>
        <button class="apply-btn" onclick="window.open('${mentor.booking_link}', '_blank')">📅 Book Meeting</button>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading mentors:', err);
    list.innerHTML = '<p>Failed to load mentors.</p>';
  }
}

function searchMentors() {
  const q = document.getElementById('mentorshipSearchInput').value.toLowerCase();
  const cards = document.querySelectorAll('#mentorsList .feature-card');
  cards.forEach(card => {
    const match = card.textContent.toLowerCase().includes(q);
    card.style.display = match ? 'block' : 'none';
  });
}

