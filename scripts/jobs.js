const ADZUNA_APP_ID = '724c6349';
const ADZUNA_APP_KEY = 'e06868faee5fb3550529d4dad01e29f3';
const ADZUNA_COUNTRY = 'us';

let lastFetchedJobs = [];

async function fetchJobs(what = '', where = '') {
    if (!ADZUNA_APP_ID || ADZUNA_APP_ID === 'YOUR_APP_ID_HERE') {
        if (typeof setStatus === 'function') {
            setStatus('Please configure your Adzuna API credentials in jobs.js', 'error');
        }
        return [];
    }

    const params = new URLSearchParams({
        app_id: ADZUNA_APP_ID,
        app_key: ADZUNA_APP_KEY,
        what: what || '',
        where: where || '',
        results_per_page: 20,
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
        if (typeof setStatus === 'function') {
            setStatus(`Failed to fetch jobs: ${error.message}`, 'error');
        }
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
        jobsList.innerHTML = `
            <div class="no-jobs">
                <div class="no-jobs-icon">💼</div>
                <p class="no-jobs-text">No jobs found</p>
                <p class="no-jobs-subtext">Try adjusting your search criteria</p>
            </div>
        `;
        return;
    }

    jobsList.innerHTML = jobs.map(job => `
        <div class="job-card">
            <div class="job-header">
                <div class="job-title">${job.title || 'Untitled Position'}</div>
                <div class="job-company">${job.company?.display_name || 'Company Not Listed'}</div>
            </div>
            <div class="job-details">
                <div class="job-detail-item">
                    <span class="job-icon">📍</span>
                    <span>${job.location?.display_name || 'Location Not Specified'}</span>
                </div>
                ${job.salary_min ? `
                    <div class="job-detail-item">
                        <span class="job-icon">💰</span>
                        <span>$${Number(job.salary_min).toLocaleString()} - $${Number(job.salary_max).toLocaleString()}</span>
                    </div>
                ` : '<div class="job-detail-item"><span class="job-icon">💰</span><span>Salary not specified</span></div>'}
                <div class="job-detail-item">
                    <span class="job-icon">🕒</span>
                    <span>${job.contract_time || 'Full-time'}</span>
                </div>
            </div>
            <div class="job-description">${job.description?.slice(0, 200) || 'No description available'}...</div>
            <div class="job-footer">
                <span class="job-posted">${formatJobDate(job.created)}</span>
                <a href="${job.redirect_url}" target="_blank" class="job-apply-btn">
                    Apply Now →
                </a>
            </div>
        </div>
    `).join('');
}

function formatJobDate(dateString) {
    if (!dateString) return 'Recently posted';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
}

async function searchJobs() {
    const whatInput = document.getElementById('jobsSearchWhat');
    const whereInput = document.getElementById('jobsSearchWhere');
    const what = whatInput ? whatInput.value.trim() : '';
    const where = whereInput ? whereInput.value.trim() : '';

    const jobsList = document.getElementById('jobsList');
    if (jobsList) {
        jobsList.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <div class="loading-text">Searching for jobs...</div>
            </div>
        `;
    }

    const jobs = await fetchJobs(what, where);
    renderJobs(jobs);
    
    if (typeof setStatus === 'function') {
        setStatus(`Found ${jobs.length} jobs`, 'success', 2000);
    }
}

// Initialize jobs section
document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.querySelector('.jobs-section .search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchJobs);
    }
    
    // Allow Enter key to trigger search
    const searchInputs = document.querySelectorAll('.jobs-section .search-input');
    searchInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchJobs();
            }
        });
    });
});

// Export for use in feed
window.fetchJobs = fetchJobs;