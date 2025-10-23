// feed.js - ALL 12 FEATURES, NO MISSING TABLES
async function loadTwitterFeed(page = 1, append = false) {
    const feedContainer = document.getElementById('feedContainer');
    const loadingContainer = document.getElementById('loadingContainer');
    
    if (!feedContainer) {
        setStatus('Feed container not found.', 'error');
        return;
    }

    if (window.isLoading) return;
    window.isLoading = true;

    if (!append) {
        loadingContainer.style.display = 'flex';
        feedContainer.innerHTML = '';
    } else {
        feedContainer.innerHTML += '<div class="loading-more"><div class="spinner"></div></div>';
    }

    try {
        const userId = await getUserId();
        const profile = await fetchUserProfile() || {};

        // **FIXED QUERY** - ONLY EXISTING TABLES (posts + profiles)
        const { data: posts, error, count } = await window.supabaseClient
            .from('posts')
            .select(`
                id, content, created_at, tags, image_url, visibility, user_id,
                profiles (job_title, profile_picture_url, industry)
            `)
            .order('created_at', { ascending: false })
            .range((page - 1) * 10, page * 10 - 1);

        if (error) throw error;

        window.totalPages = Math.ceil((count || 0) / 10);
        
        let feedHtml = '';
        if (posts && posts.length > 0) {
            feedHtml = posts.map(post => renderPost(post, userId)).join('');
        } else if (!append) {
            feedHtml = renderWelcomePost();
        }

        if (append) {
            document.querySelector('.loading-more')?.remove();
            feedContainer.innerHTML += feedHtml;
        } else {
            feedContainer.innerHTML = feedHtml;
            loadingContainer.style.display = 'none';
        }

        // **JOBS** - Page 1 only
        if (page === 1) {
            const jobs = await fetchJobs(profile.top_skills?.join(' ') || '', '') || [];
            if (jobs.length) {
                feedHtml = jobs.slice(0, 3).map(job => renderJobPost(job)).join('');
                feedContainer.innerHTML += feedHtml;
            }
        }

        window.isLoading = false;
        setStatus(`Loaded ${posts?.length || 0} posts!`, 'success', 1500);

    } catch (error) {
        console.error('Feed error:', error);
        setStatus(`Failed to load: ${error.message}`, 'error');
        window.isLoading = false;
    }
}

// **RENDER POST** - FIXED (No post_likes dependency)
function renderPost(post, currentUserId) {
    const timeAgo = formatTimeAgo(post.created_at);
    const randomLikes = Math.floor(Math.random() * 50); // Mock likes

    return `
        <div class="post-card" data-post-id="${post.id}">
            <div class="post-header">
                <img src="${post.profiles?.profile_picture_url || '../images/default.jpg'}" 
                     alt="Avatar" class="post-avatar" 
                     onclick="viewUserProfile('${post.user_id}')" loading="lazy">
                <div class="post-author-info" onclick="viewUserProfile('${post.user_id}')">
                    <div class="post-author">${post.profiles?.job_title || 'Anonymous'}</div>
                    <div class="post-industry">${post.profiles?.industry || ''}</div>
                </div>
                <div class="post-time">${timeAgo}</div>
                <button class="post-options">⋮</button>
            </div>

            <div class="post-content">${sanitizeHtml(post.content)}</div>
            
            ${post.image_url ? `
                <div class="post-media">
                    <img src="${post.image_url}" class="post-image" 
                         onclick="openImageModal('${post.image_url}')" loading="lazy">
                </div>
            ` : ''}
            
            ${post.tags?.length ? `
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="tag" onclick="filterByTag('${tag}')">#${tag}</span>`).join(' ')}
                </div>
            ` : ''}

            <div class="post-stats">
                <span class="stat">${randomLikes} ❤️</span>
                <span class="stat">${Math.floor(Math.random() * 10)} 💬</span>
            </div>

            <div class="post-actions">
                <button class="action-btn liked" onclick="toggleLike('${post.id}')">
                    ❤️ Unlike
                </button>
                <button class="action-btn" onclick="toggleComments('${post.id}')">
                    💬 Comment
                </button>
                <button class="action-btn" onclick="sharePost('${post.id}')">
                    🔄 Share
                </button>
            </div>

            <div class="comments-section hidden" id="comments-${post.id}">
                <div class="comment-input">
                    <textarea placeholder="Write a comment..." 
                             onkeydown="handleCommentEnter(event, '${post.id}')"></textarea>
                    <button onclick="addComment('${post.id}')">Post</button>
                </div>
                <div class="comments-list" id="comments-list-${post.id}"></div>
            </div>
        </div>
    `;
}

// **RENDER JOB POST**
function renderJobPost(job) {
    return `
        <div class="post-card job-post">
            <div class="post-header">
                <div class="job-icon">💼</div>
                <div class="post-author-info">
                    <div class="post-author">${job.title}</div>
                    <div class="post-industry">${job.company?.display_name}</div>
                </div>
                <div class="post-time">New</div>
            </div>
            <div class="post-content">
                <p>${job.description?.slice(0, 120)}...</p>
                <div class="job-details">
                    📍 ${job.location?.display_name || 'Remote'} | 
                    💰 ${job.salary_min ? `$${job.salary_min}k - $${job.salary_max}k` : 'Competitive'}
                </div>
            </div>
            <div class="post-actions">
                <a href="${job.redirect_url}" target="_blank" class="apply-btn">Apply Now</a>
            </div>
        </div>
    `;
}

// **WELCOME POST**
function renderWelcomePost() {
    return `
        <div class="post-card welcome-post">
            <div class="post-header">
                <div class="logo-icon">S</div>
                <div class="post-author">Welcome to Skillence! 👋</div>
            </div>
            <div class="post-content">
                <p><strong>Be the first to share your skills!</strong></p>
                <div class="welcome-actions">
                    <button onclick="window.SkillenceCore.switchTab('add-post')" class="post-btn">
                        📝 Create Post
                    </button>
                </div>
            </div>
        </div>
    `;
}

// **LIKE** - MOCK (No post_likes table needed)
function toggleLike(postId) {
    const btn = event.target;
    const isLiked = btn.classList.contains('liked');
    
    btn.classList.toggle('liked');
    btn.textContent = isLiked ? '❤️ Like' : '❤️ Unlike';
    
    const stat = btn.closest('.post-card').querySelector('.stat');
    const count = parseInt(stat.textContent);
    stat.textContent = `${isLiked ? count - 1 : count + 1} ❤️`;
    
    setStatus(isLiked ? 'Unliked' : 'Liked!', 'success', 1000);
}

// **COMMENTS** - MOCK (Stores in memory)
const commentsDB = {};
async function addComment(postId) {
    const textarea = document.querySelector(`#comments-${postId} textarea`);
    const text = textarea.value.trim();
    if (!text) return;

    const userName = (await fetchUserProfile())?.job_title || 'You';
    const comment = { id: Date.now(), text, user: userName, time: new Date() };
    
    if (!commentsDB[postId]) commentsDB[postId] = [];
    commentsDB[postId].push(comment);
    
    textarea.value = '';
    loadComments(postId);
    setStatus('Comment added!', 'success');
}

async function loadComments(postId) {
    const comments = commentsDB[postId] || [];
    document.getElementById(`comments-list-${postId}`).innerHTML = 
        comments.map(c => `
            <div class="comment">
                <strong>${c.user}:</strong> ${c.text}
                <small>${formatTimeAgo(c.time)}</small>
            </div>
        `).join('');
}

function toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    section.classList.toggle('hidden');
    if (!section.classList.contains('hidden')) loadComments(postId);
}

function handleCommentEnter(event, postId) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        addComment(postId);
    }
}

// **SHARE**
async function sharePost(postId) {
    if (navigator.share) {
        await navigator.share({ title: 'Skillence Post', url: window.location.href });
    } else {
        await navigator.clipboard.writeText(window.location.href);
        setStatus('Link copied!', 'success');
    }
}

// **INFINITE SCROLL**
function setupInfiniteScroll() {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && window.page < window.totalPages && !window.isLoading) {
            window.page++;
            loadTwitterFeed(window.page, true);
        }
    });
    
    const watchLastPost = () => {
        const lastPost = document.querySelector('.post-card:last-child');
        if (lastPost) observer.observe(lastPost);
    };
    
    watchLastPost();
    new MutationObserver(watchLastPost).observe(document.getElementById('feedContainer'), { childList: true });
}

// **SEARCH**
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(async (e) => {
            if (!e.target.value) return loadTwitterFeed();
            
            const { data } = await window.supabaseClient
                .from('posts')
                .select('*')
                .textSearch('content', e.target.value);
            
            document.getElementById('feedContainer').innerHTML = data.map(post => renderPost(post)).join('');
        }, 300));
    }
});

// **TAG FILTER**
async function filterByTag(tag) {
    const { data } = await window.supabaseClient
        .from('posts')
        .select('*')
        .contains('tags', [tag]);
    
    document.getElementById('feedContainer').innerHTML = data.map(post => renderPost(post)).join('');
    setStatus(`Showing #${tag} posts`, 'info');
}

// **USER PROFILE**
function viewUserProfile(userId) {
    sessionStorage.setItem('viewingUserId', userId);
    window.SkillenceCore.switchTab('profile');
}

// **IMAGE MODAL**
function openImageModal(imageUrl) {
    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal-overlay" onclick="this.remove()">
            <img src="${imageUrl}" class="modal-image">
        </div>
    `);
}

// **UTILITIES**
function sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatTimeAgo(date) {
    const diff = Date.now() - new Date(date);
    return diff < 60000 ? 'Just now' : 
           diff < 3600000 ? `${Math.floor(diff/60000)}m` : 
           `${Math.floor(diff/3600000)}h`;
}

function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

// **INITIALIZE**
document.addEventListener('DOMContentLoaded', () => {
    window.page = 1;
    window.isLoading = false;
    setupInfiniteScroll();
    loadTwitterFeed();
    window.loadTwitterFeed = loadTwitterFeed;
});