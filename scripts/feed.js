// feed.js - Updated to show real data from Supabase
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
                profiles (id, full_name, job_title, profile_picture_url, industry)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range((page - 1) * 10, page * 10 - 1);

        if (error) throw error;

        window.totalPages = Math.ceil((count || 0) / 10);
        
        let feedHtml = '';
        if (posts && posts.length > 0) {
            // Fetch likes, comments, and saves count for each post
            const postsWithStats = await Promise.all(posts.map(async (post) => {
                const [likesRes, commentsRes, savesRes, userLikedRes] = await Promise.all([
                    window.supabaseClient.from('post_likes').select('id', { count: 'exact' }).eq('post_id', post.id),
                    window.supabaseClient.from('comments').select('id', { count: 'exact' }).eq('post_id', post.id),
                    window.supabaseClient.from('saved_posts').select('id', { count: 'exact' }).eq('post_id', post.id),
                    window.supabaseClient.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', userId).single()
                ]);

                return {
                    ...post,
                    likes_count: likesRes.count || 0,
                    comments_count: commentsRes.count || 0,
                    saves_count: savesRes.count || 0,
                    user_liked: !!userLikedRes.data
                };
            }));

            feedHtml = postsWithStats.map(post => renderPost(post, userId)).join('');
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

        setTimeout(() => setupLazyLoading(), 100);

        window.isLoading = false;
        setStatus(`Loaded ${posts?.length || 0} posts!`, 'success', 1500);

    } catch (error) {
        console.error('Feed error:', error);
        setStatus(`Failed to load: ${error.message}`, 'error');
        feedContainer.innerHTML = '<div class="error-message">Failed to load feed. Please refresh.</div>';
        loadingContainer.style.display = 'none';
        window.isLoading = false;
    }
}

function renderPost(post, currentUserId) {
    const timeAgo = formatTimeAgo(post.created_at);
    const isSaved = window.savedPostsManager?.isSaved(post.id) || false;
    const authorName = post.profiles?.full_name || post.profiles?.job_title || 'Anonymous User';

    return `
        <div class="post-card" data-post-id="${post.id}">
            <div class="post-header">
                <img data-src="${post.profiles?.profile_picture_url || '../images/default.jpg'}" 
                     src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 50'%3E%3Crect fill='%23f0f0f0' width='50' height='50'/%3E%3C/svg%3E"
                     alt="Avatar" class="post-avatar lazy-image" 
                     onclick="event.stopPropagation(); viewUserProfile('${post.user_id}')">
                <div class="post-author-info">
                    <div class="post-author" onclick="event.stopPropagation(); viewUserProfile('${post.user_id}')">${sanitizeHtml(authorName)}</div>
                    <div class="post-industry">${sanitizeHtml(post.profiles?.job_title || '')}</div>
                </div>
                <div class="post-time">${timeAgo}</div>
            </div>
            
            <div class="post-content">
                <p>${sanitizeHtml(post.content)}</p>
            </div>
            
            ${post.image_url ? `
                <div class="post-media">
                    <img data-src="${post.image_url}" 
                         src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 400'%3E%3Crect fill='%23f0f0f0' width='800' height='400'/%3E%3C/svg%3E"
                         class="post-image lazy-image" 
                         onclick="event.stopPropagation(); openImageModal('${post.image_url}')">
                </div>
            ` : ''}
            
            ${post.tags?.length ? `
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="tag" onclick="event.stopPropagation(); filterByTag('${tag}')">#${tag}</span>`).join(' ')}
                </div>
            ` : ''}

            <div class="post-stats">
                <span class="stat">${post.likes_count || 0} ❤️</span>
                <span class="stat">${post.comments_count || 0} 💬</span>
            </div>

            <div class="post-actions">
                <button class="action-btn ${post.user_liked ? 'liked' : ''}" 
                        onclick="event.stopPropagation(); toggleLike('${post.id}', this)">
                    ❤️ ${post.user_liked ? 'Unlike' : 'Like'}
                </button>
                <button class="action-btn" onclick="event.stopPropagation(); toggleComments('${post.id}')">
                    💬 Comment
                </button>
                <button class="action-btn" onclick="event.stopPropagation(); sharePost('${post.id}')">
                    🔄 Share
                </button>
                <button class="action-btn ${isSaved ? 'saved' : ''}" 
                        data-save-post="${post.id}"
                        onclick="event.stopPropagation(); toggleSavePost('${post.id}')">
                    ${isSaved ? '🔖 Saved' : '🔖 Save'}
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

// Toggle Like with real database
async function toggleLike(postId, button) {
    try {
        const userId = await getUserId();
        if (!userId) {
            setStatus('Please sign in to like posts', 'error');
            return;
        }

        const isLiked = button.classList.contains('liked');
        
        if (isLiked) {
            // Unlike
            const { error } = await window.supabaseClient
                .from('post_likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', userId);

            if (error) throw error;

            button.classList.remove('liked');
            button.textContent = '❤️ Like';
        } else {
            // Like
            const { error } = await window.supabaseClient
                .from('post_likes')
                .insert({ post_id: postId, user_id: userId });

            if (error) throw error;

            button.classList.add('liked');
            button.textContent = '❤️ Unlike';
        }

        // Update count
        const { count } = await window.supabaseClient
            .from('post_likes')
            .select('id', { count: 'exact' })
            .eq('post_id', postId);

        const statElement = button.closest('.post-card').querySelector('.stat');
        statElement.textContent = `${count || 0} ❤️`;

        setStatus(isLiked ? 'Unliked' : 'Liked!', 'success', 1000);

    } catch (error) {
        console.error('Toggle like error:', error);
        setStatus('Failed to update like', 'error');
    }
}

// Add Comment with real database
async function addComment(postId) {
    try {
        const textarea = document.querySelector(`#comments-${postId} textarea`);
        const content = textarea.value.trim();
        if (!content) return;

        const userId = await getUserId();
        if (!userId) {
            setStatus('Please sign in to comment', 'error');
            return;
        }

        const { error } = await window.supabaseClient
            .from('comments')
            .insert({
                post_id: postId,
                user_id: userId,
                content: content
            });

        if (error) throw error;

        textarea.value = '';
        await loadComments(postId);
        
        // Update comment count
        const { count } = await window.supabaseClient
            .from('comments')
            .select('id', { count: 'exact' })
            .eq('post_id', postId);

        const stats = document.querySelector(`[data-post-id="${postId}"] .post-stats`);
        const commentStat = stats.querySelectorAll('.stat')[1];
        commentStat.textContent = `${count || 0} 💬`;

        setStatus('Comment added!', 'success');

    } catch (error) {
        console.error('Add comment error:', error);
        setStatus('Failed to add comment', 'error');
    }
}

// Load Comments from database
async function loadComments(postId) {
    try {
        const { data: comments, error } = await window.supabaseClient
            .from('comments')
            .select(`
                id, content, created_at,
                profiles (full_name, job_title, profile_picture_url)
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        const commentsList = document.getElementById(`comments-list-${postId}`);
        if (commentsList) {
            commentsList.innerHTML = comments.map(c => `
                <div class="comment">
                    <img src="${c.profiles?.profile_picture_url || '../images/default.jpg'}" class="comment-avatar">
                    <div class="comment-content">
                        <strong>${sanitizeHtml(c.profiles?.full_name || c.profiles?.job_title || 'Anonymous')}:</strong>
                        <p>${sanitizeHtml(c.content)}</p>
                        <small>${formatTimeAgo(c.created_at)}</small>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Load comments error:', error);
    }
}
function toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    if (section) {
        section.classList.toggle('hidden');
        if (!section.classList.contains('hidden')) loadComments(postId);
    }
}

function handleCommentEnter(event, postId) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        addComment(postId);
    }
}

async function sharePost(postId) {
    if (navigator.share) {
        try {
            await navigator.share({ title: 'Skillence Post', url: window.location.href });
        } catch (err) {
            console.log('Share cancelled');
        }
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
    const feedContainer = document.getElementById('feedContainer');
    if (feedContainer) {
        new MutationObserver(watchLastPost).observe(feedContainer, { childList: true });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(async (e) => {
            if (!e.target.value) return loadTwitterFeed();
            
            const { data } = await window.supabaseClient
                .from('posts')
                .select(`
                    id, content, created_at, tags, image_url, visibility, user_id,
                    profiles (job_title, profile_picture_url, industry)
                `)
                .textSearch('content', e.target.value);
            
            const userId = await getUserId();
            document.getElementById('feedContainer').innerHTML = data.map(post => renderPost(post, userId)).join('');
            setupLazyLoading();
        }, 300));
    }
});

async function filterByTag(tag) {
    const { data } = await window.supabaseClient
        .from('posts')
        .select(`
            id, content, created_at, tags, image_url, visibility, user_id,
            profiles (job_title, profile_picture_url, industry)
        `)
        .contains('tags', [tag]);
    
    const userId = await getUserId();
    document.getElementById('feedContainer').innerHTML = data.map(post => renderPost(post, userId)).join('');
    setupLazyLoading();
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
            .select('job_title, industry, experience_level, profile_picture_url, top_skills, goals, skill_score, full_name')
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
        };

        const displayName = data.full_name || data.job_title || 'Anonymous User';

        if (elements.profileJob) elements.profileJob.textContent = displayName;
        if (elements.profileIndustry) elements.profileIndustry.textContent = data.industry || 'No Industry';
        if (elements.profileExperience) elements.profileExperience.textContent = `${data.experience_level || 'Unknown'} Level`;
        if (elements.profileSkills) elements.profileSkills.textContent = `${data.top_skills?.join(', ') || 'None'}`;
        if (elements.profileGoals) elements.profileGoals.textContent = `${data.goals?.join(', ') || 'None'}`;
        if (elements.profileAvatar) elements.profileAvatar.src = data.profile_picture_url || '../images/default.jpg';
        if (elements.cvScore) elements.cvScore.textContent = `${data.skill_score || 0}%`;
        if (elements.cvScoreProgress) elements.cvScoreProgress.style.width = `${data.skill_score || 0}%`;

        // UPDATE BUTTONS FOR VIEWED PROFILE
        const isOwnProfile = userId === currentUserId;
        const editBtn = document.getElementById('editProfileBtn');
        const followBtn = document.querySelector('.follow-btn');
        const signOutBtn = document.getElementById('sign-out-btn');

        if (editBtn) editBtn.style.display = isOwnProfile ? 'block' : 'none';
        if (followBtn) {
            followBtn.style.display = isOwnProfile ? 'none' : 'block';
            if (!isOwnProfile) {
                followBtn.onclick = () => toggleFollowUser(userId);
            }
        }
        if (signOutBtn) signOutBtn.style.display = isOwnProfile ? 'block' : 'none';

        if (!isOwnProfile) {
            checkFollowStatus(userId);
        }

        const [followersRes, followingRes] = await Promise.all([
            window.supabaseClient.from('follows').select('follower_id', { count: 'exact' }).eq('followed_id', userId),
            window.supabaseClient.from('follows').select('followed_id', { count: 'exact' }).eq('follower_id', userId)
        ]);

        updateFollowCounts(followersRes.count || 0, followingRes.count || 0);
        
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
            setupLazyLoading();
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
    if (!str) return '';
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
    window.totalPages = 1;
    setupInfiniteScroll();
    loadTwitterFeed();
    window.loadTwitterFeed = loadTwitterFeed;
});