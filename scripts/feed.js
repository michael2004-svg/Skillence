// feed.js - COMPLETE WITH PROFILE POSTS
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

function renderPost(post, currentUserId) {
    const timeAgo = formatTimeAgo(post.created_at);
    const randomLikes = Math.floor(Math.random() * 50);

    return `
        <div class="post-card" data-post-id="${post.id}">
            <div class="post-header">
                <img src="${post.profiles?.profile_picture_url || '../images/default.jpg'}" 
                     alt="Avatar" class="post-avatar" 
                     onclick="event.stopPropagation(); viewUserProfile('${post.user_id}')" loading="lazy">
                <div class="post-author-info" onclick="event.stopPropagation(); viewUserProfile('${post.user_id}')">
                    <div class="post-author">${post.profiles?.job_title || 'Anonymous'}</div>
                    <div class="post-industry">${post.profiles?.industry || ''}</div>
                </div>
                <div class="post-time">${timeAgo}</div>
                <button class="post-options" onclick="event.stopPropagation()">⋮</button>
            </div>

            <div class="post-content" onclick="toggleComments('${post.id}')" style="cursor: pointer;">
                ${sanitizeHtml(post.content)}
            </div>
            
            ${post.image_url ? `
                <div class="post-media">
                    <img src="${post.image_url}" class="post-image" 
                         onclick="event.stopPropagation(); openImageModal('${post.image_url}')" loading="lazy">
                </div>
            ` : ''}
            
            ${post.tags?.length ? `
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="tag" onclick="event.stopPropagation(); filterByTag('${tag}')">#${tag}</span>`).join(' ')}
                </div>
            ` : ''}

            <div class="post-stats">
                <span class="stat">${randomLikes} ❤️</span>
                <span class="stat">${Math.floor(Math.random() * 10)} 💬</span>
            </div>

            <div class="post-actions">
                <button class="action-btn liked" onclick="event.stopPropagation(); toggleLike('${post.id}')">
                    ❤️ Unlike
                </button>
                <button class="action-btn" onclick="event.stopPropagation(); toggleComments('${post.id}')">
                    💬 Comment
                </button>
                <button class="action-btn" onclick="event.stopPropagation(); sharePost('${post.id}')">
                    🔄 Share
                </button>
            </div>

            <div class="comments-section hidden" id="comments-${post.id}">
                <div class="comment-input">
                    <textarea placeholder="Write a comment..." 
                             onkeydown="handleCommentEnter(event, '${post.id}')"></textarea>
                    <button onclick="event.stopPropagation(); addComment('${post.id}')">Post</button>
                </div>
                <div class="comments-list" id="comments-list-${post.id}"></div>
            </div>
        </div>
    `;
}

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

async function sharePost(postId) {
    if (navigator.share) {
        await navigator.share({ title: 'Skillence Post', url: window.location.href });
    } else {
        await navigator.clipboard.writeText(window.location.href);
        setStatus('Link copied!', 'success');
    }
}

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

async function filterByTag(tag) {
    const { data } = await window.supabaseClient
        .from('posts')
        .select('*')
        .contains('tags', [tag]);
    
    document.getElementById('feedContainer').innerHTML = data.map(post => renderPost(post)).join('');
    setStatus(`Showing #${tag} posts`, 'info');
}

function viewUserProfile(userId) {
    sessionStorage.setItem('viewingUserId', userId);
    window.SkillenceCore.switchTab('profile');
    loadViewedUserProfile(userId);
}

async function loadViewedUserProfile(userId) {
    try {
        const currentUserId = await getUserId();
        
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .select('job_title, industry, experience_level, profile_picture_url, top_skills, goals, skill_score')
            .eq('id', userId)
            .single();
            
        if (error) throw error;
        if (!data) return;

        const elements = {
            profileJob: document.getElementById('profile-job'),
            profileIndustry: document.getElementById('profile-industry'),
            profileExperience: document.getElementById('profile-experience'),
            profileSkills: document.getElementById('profile-skills'),
            profileGoals: document.getElementById('profile-goals'),
            profileAvatar: document.getElementById('profileAvatar'),
            cvScore: document.getElementById('cv-score'),
            cvScoreProgress: document.getElementById('cv-score-progress'),
            followBtn: document.querySelector('.follow-btn'),
            signOutBtn: document.getElementById('sign-out-btn')
        };

        if (elements.profileJob) elements.profileJob.textContent = data.job_title || 'No Job Title';
        if (elements.profileIndustry) elements.profileIndustry.textContent = data.industry || 'No Industry';
        if (elements.profileExperience) elements.profileExperience.textContent = `${data.experience_level || 'Unknown'} Level`;
        if (elements.profileSkills) elements.profileSkills.textContent = `${data.top_skills?.join(', ') || 'None'}`;
        if (elements.profileGoals) elements.profileGoals.textContent = `${data.goals?.join(', ') || 'None'}`;
        if (elements.profileAvatar) elements.profileAvatar.src = data.profile_picture_url || '../images/default.jpg';
        if (elements.cvScore) elements.cvScore.textContent = `${data.skill_score || 0}%`;
        if (elements.cvScoreProgress) elements.cvScoreProgress.style.width = `${data.skill_score || 0}%`;

        const isOwnProfile = userId === currentUserId;
        if (elements.followBtn) {
            elements.followBtn.style.display = isOwnProfile ? 'none' : 'block';
            if (!isOwnProfile) {
                elements.followBtn.onclick = () => toggleFollowUser(userId);
            }
        }
        if (elements.signOutBtn) {
            elements.signOutBtn.style.display = isOwnProfile ? 'block' : 'none';
        }

        if (!isOwnProfile) {
            checkFollowStatus(userId);
        }

        const [followersRes, followingRes] = await Promise.all([
            window.supabaseClient.from('follows').select('follower_id', { count: 'exact' }).eq('followed_id', userId),
            window.supabaseClient.from('follows').select('followed_id', { count: 'exact' }).eq('follower_id', userId)
        ]);

        updateFollowCounts(followersRes.count || 0, followingRes.count || 0);
        
        // Load user's posts
        await loadUserPosts(userId);
        
    } catch (error) {
        console.error('Error loading user profile:', error);
        setStatus(`Failed to load profile: ${error.message}`, 'error');
    }
}

async function loadUserPosts(userId) {
    try {
        const { data: posts, error } = await window.supabaseClient
            .from('posts')
            .select(`
                id, content, created_at, tags, image_url, visibility, user_id,
                profiles (job_title, profile_picture_url, industry)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        const postsContainer = document.getElementById('profile-posts-container');
        if (!postsContainer) return;

        const currentUserId = await getUserId();
        
        if (posts && posts.length > 0) {
            postsContainer.innerHTML = posts.map(post => renderPost(post, currentUserId)).join('');
        } else {
            postsContainer.innerHTML = `
                <div class="no-posts">
                    <div class="no-posts-icon">📝</div>
                    <p class="no-posts-text">No posts yet</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading user posts:', error);
    }
}

async function toggleFollowUser(profileUserId) {
    const followBtn = document.querySelector('.follow-btn');
    if (!followBtn) return;
    
    const userId = await getUserId();
    if (!userId) {
        setStatus('Please sign in to follow.', 'error');
        return;
    }
    
    if (userId === profileUserId) {
        setStatus('Cannot follow yourself.', 'error');
        return;
    }

    const isFollowing = followBtn.textContent.trim() === 'Unfollow';
    followBtn.disabled = true;
    
    try {
        if (isFollowing) {
            const { error } = await window.supabaseClient
                .from('follows')
                .delete()
                .eq('follower_id', userId)
                .eq('followed_id', profileUserId);
            if (error) throw error;
            
            followBtn.textContent = 'Follow';
            setStatus('Unfollowed.', 'success');
        } else {
            const { error } = await window.supabaseClient
                .from('follows')
                .insert({ follower_id: userId, followed_id: profileUserId });
            if (error) throw error;
            
            followBtn.textContent = 'Unfollow';
            setStatus('Followed!', 'success');
        }
        
        // Refresh follow counts
        loadViewedUserProfile(profileUserId);
    } catch (error) {
        setStatus(`Follow action failed: ${error.message}`, 'error');
    } finally {
        followBtn.disabled = false;
    }
}

async function checkFollowStatus(viewedUserId) {
    try {
        const currentUserId = await getUserId();
        if (!currentUserId) return;
        
        const { data, error } = await window.supabaseClient
            .from('follows')
            .select('*')
            .eq('follower_id', currentUserId)
            .eq('followed_id', viewedUserId)
            .single();
        
        const followBtn = document.querySelector('.follow-btn');
        if (followBtn) {
            followBtn.textContent = data ? 'Unfollow' : 'Follow';
        }
    } catch (error) {
        const followBtn = document.querySelector('.follow-btn');
        if (followBtn) followBtn.textContent = 'Follow';
    }
}

function updateFollowCounts(followers, following) {
    const followersCount = document.getElementById('followers-count');
    const followingCount = document.getElementById('following-count');
    
    if (followersCount) {
        const displayFollowers = followers >= 1000 ? (followers / 1000).toFixed(1) + 'k' : followers;
        followersCount.textContent = displayFollowers;
    }
    if (followingCount) {
        const displayFollowing = following >= 1000 ? (following / 1000).toFixed(1) + 'k' : following;
        followingCount.textContent = displayFollowing;
    }
}

function openImageModal(imageUrl) {
    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal-overlay" onclick="this.remove()">
            <img src="${imageUrl}" class="modal-image">
        </div>
    `);
}

function sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatTimeAgo(date) {
    const diff = Date.now() - new Date(date);
    return diff < 60000 ? 'Just now' : 
           diff < 3600000 ? `${Math.floor(diff/60000)}m` : 
           diff < 86400000 ? `${Math.floor(diff/3600000)}h` :
           `${Math.floor(diff/86400000)}d`;
}

function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    window.page = 1;
    window.isLoading = false;
    setupInfiniteScroll();
    loadTwitterFeed();
    window.loadTwitterFeed = loadTwitterFeed;
});