const ADZUNA_APP_ID = '724c6349';
const ADZUNA_APP_KEY = 'e06868faee5fb3550529d4dad01e29f3';
const ADZUNA_COUNTRY = 'us';

let lastFetchedJobs = [];

async function fetchJobs(what = '', where = '') {
    if (!ADZUNA_APP_ID || ADZUNA_APP_ID === 'YOUR_APP_ID_HERE') {
        setStatus('Please configure your Adzuna API credentials in jobs.js', 'error');
        return [];
    }

    const params = new URLSearchParams({
        app_id: ADZUNA_APP_ID,
        app_key: ADZUNA_APP_KEY,
        what: what,
        where: where,
        results_per_page: 10,
        sort_by: 'date'
    });

    const apiUrl = `https://api.adzuna.com/v1/api/jobs/${ADZUNA_COUNTRY}/search/1?${params.toString()}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        const data = await response.json();
        lastFetchedJobs = data.results || [];
        return lastFetchedJobs;
    } catch (error) {
        console.error('Adzuna API Error:', error);
        setStatus(`Failed to fetch jobs: ${error.message}. Check your API credentials.`, 'error');
        return [];
    }
}

function renderJobs(jobs) {
    const jobsList = document.getElementById('jobsList');
    if (!jobsList) {
        console.error('Jobs list container not found');
        return;
    }

    if (jobs.length === 0) {
        jobsList.innerHTML = '<p>No jobs found. Try adjusting your search.</p>';
        return;
    }

    jobsList.innerHTML = jobs.map(job => `
        <div class="job-card">
            <div class="job-title">${job.title}</div>
            <div class="job-company">${job.company?.display_name || 'N/A'}</div>
            <div class="job-location">${job.location?.display_name || 'N/A'}</div>
            <div class="job-salary">${job.salary_min ? `$${job.salary_min} - $${job.salary_max}` : 'Salary not specified'}</div>
            <div class="job-description">${job.description?.slice(0, 150)}...</div>
            <a href="${job.redirect_url}" target="_blank" class="job-link">Apply Now</a>
        </div>
    `).join('');
}

async function searchJobs() {
    const whatInput = document.getElementById('jobsSearchWhat');
    const whereInput = document.getElementById('jobsSearchWhere');
    const what = whatInput ? whatInput.value.trim() : '';
    const where = whereInput ? whereInput.value.trim() : '';

    const jobsList = document.getElementById('jobsList');
    if (jobsList) {
        jobsList.innerHTML = '<p>Loading jobs...</p>';
    }

    const jobs = await fetchJobs(what, where);
    renderJobs(jobs);

    if (!what && !where) {
        whatInput.value = '';
        whereInput.value = '';
    }
}

function handleFeatureClick(feature) {
    const featuresGrid = document.querySelector('.features-grid');
    const jobsSection = document.getElementById('jobsSection');
    if (feature === 'cv-analyzer') {
        switchTab('cv-analyzer');
    } else if (feature === 'jobs') {
        if (featuresGrid) featuresGrid.style.display = 'none';
        if (jobsSection) {
            jobsSection.classList.remove('hidden');
            jobsSection.classList.add('show');
        }
        searchJobs();
    } else if (feature === 'courses') {
        setStatus('Courses feature not implemented yet.', 'info');
    } else if (feature === 'mentorship') {
        setStatus('Mentorship feature not implemented yet.', 'info');
    } else {
        setStatus(`Opening ${feature}...`, 'info');
    }
}