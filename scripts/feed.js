async function loadTwitterFeed() {
    const feedContainer = document.getElementById('feedContainer');
    if (!feedContainer) {
        console.error('Feed container not found');
        return;
    }

    feedContainer.innerHTML = '<p>Loading feed...</p>';

    try {
        const userId = await getUserId();
        if (!userId) {
            feedContainer.innerHTML = '<p>Please sign in to view your feed.</p>';
            setStatus('Please sign in to view your feed.', 'error');
            return;
        }

        const profile = await fetchUserProfile();
        const profession = profile?.job_title || 'Software Engineer';
        const cvData = await fetchLatestCVAnalysis();
        const industry = cvData?.industry || profile?.industry || 'technology';
        const skills = profile?.top_skills || [];

        const { data: interests, error: interestsError } = await window.supabaseClient
            .from('user_interests')
            .select('interest')
            .eq('user_id', userId);
        if (interestsError) {
            console.error('Error fetching interests:', interestsError);
            throw interestsError;
        }

        const userInterests = [
            ...(interests?.map(i => i.interest.toLowerCase()) || []),
            ...(cvData?.skills?.slice(0, 5) || []),
            ...(skills || []),
            industry.toLowerCase(),
            profession.toLowerCase()
        ].filter((v, i, a) => v && a.indexOf(v) === i);

        const { data: posts, error: postError } = await window.supabaseClient
            .from('posts')
            .select(`
                id, content, created_at, tags, image_url,
                profiles!posts_user_id_fkey (job_title, profile_picture_url)
            `)
            .order('created_at', { ascending: false })
            .limit(15);
        if (postError) {
            console.error('Error fetching posts:', postError);
            throw postError;
        }

        const scoredPosts = posts.map(post => ({
            ...post,
            type: 'post',
            score: post.tags?.some(tag => userInterests.includes(tag.toLowerCase())) ? 1 : 0,
            created: post.created_at
        }));

        const searchTerm = profession || industry;
        const jobs = await fetchJobs(searchTerm);
        const scoredJobs = jobs.map(job => ({
            ...job,
            type: 'job',
            score: job.title.toLowerCase().includes(profession.toLowerCase()) ||
                   job.category?.label.toLowerCase().includes(industry.toLowerCase()) ? 1 : 0,
            created: job.created
        }));

        const feedItems = [];
        const maxItems = 20;
        const postRatio = 2;
        let postIndex = 0, jobIndex = 0;

        while (feedItems.length < maxItems && (postIndex < scoredPosts.length || jobIndex < scoredJobs.length)) {
            for (let i = 0; i < postRatio && postIndex < scoredPosts.length && feedItems.length < maxItems; i++) {
                feedItems.push(scoredPosts[postIndex++]);
            }
            if (jobIndex < scoredJobs.length && feedItems.length < maxItems) {
                feedItems.push(scoredJobs[jobIndex++]);
            }
        }

        feedItems.sort((a, b) => {
            if (a.score !== b.score) return b.score - a.score;
            return new Date(b.created) - new Date(a.created);
        });

        if (feedItems.length === 0) {
            feedContainer.innerHTML = '<p>No posts or jobs available. Try posting or searching for jobs!</p>';
            return;
        }

        feedContainer.innerHTML = '';
        feedItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = item.type === 'job' ? 'post job-post' : 'post';
            if (item.type === 'job') {
                itemDiv.innerHTML = `
                    <div class="post-header">
                        <img class="profile-pic" src="../images/default-company.jpg" alt="${item.company?.display_name || 'Company'}">
                        <div class="post-author">${item.company?.display_name || 'N/A'}</div>
                        <div class="post-time">${new Date(item.created).toLocaleString()}</div>
                        <div class="post-options">⋯</div>
                    </div>
                    <div class="post-content">is hiring: ${item.title} (${item.location?.display_name || 'N/A'})</div>
                    <div class="post-actions">
                        <button class="action-btn" onclick="toggleLike(this, '${item.id}', '${item.category?.label || ''}')">❤️</button>
                        <button class="action-btn" onclick="commentOnPost('${item.id}')">💬</button>
                        <button class="action-btn" onclick="sharePost('${item.id}')">🔖</button>
                        <button class="apply-btn" onclick="applyForJob('${item.id}')">Apply</button>
                    </div>
                `;
            } else {
                itemDiv.innerHTML = `
                    <div class="post-header">
                        <img class="profile-pic" src="${item.profiles?.profile_picture_url || '../images/default.jpg'}" alt="${item.profiles?.job_title || 'Anonymous'}">
                        <div class="post-author">${item.profiles?.job_title || 'Anonymous'}</div>
                        <div class="post-time">${new Date(item.created).toLocaleString()}</div>
                        <div class="post-options">⋯</div>
                    </div>
                    <div class="post-content">${item.content}</div>
                    ${item.image_url ? `<img class="post-image" src="${item.image_url}" alt="Post Image">` : ''}
                    <div class="post-actions">
                        <button class="action-btn" onclick="toggleLike(this, '${item.id}', '${item.tags?.[0] || ''}')">❤️</button>
                        <button class="action-btn" onclick="commentOnPost('${item.id}')">💬</button>
                        <button class="action-btn" onclick="sharePost('${item.id}')">🔖</button>
                    </div>
                `;
            }
            feedContainer.appendChild(itemDiv);
        });
    } catch (error) {
        console.error('Error loading feed:', error);
        feedContainer.innerHTML = '<p>Failed to load feed. Please try again later.</p>';
        setStatus(`Failed to load feed: ${error.message}`, 'error');
    }
}

// Apply for Job
async function applyForJob(adzunaJobId) {
    try {
        const userId = await getUserId();
        if (!userId) {
            setStatus('Please sign in to apply.', 'error');
            return;
        }

        const { error } = await window.supabaseClient
            .from('job_applications')
            .insert({ user_id: userId, adzuna_job_id: adzunaJobId });
        if (error) throw error;

        setStatus('Job application submitted! Redirecting to apply...', 'success');
        const job = lastFetchedJobs.find(j => j.id === adzunaJobId);
        if (job?.redirect_url) {
            window.open(job.redirect_url, '_blank');
        }
    } catch (error) {
        console.error('Error applying for job:', error);
        setStatus(`Failed to apply: ${error.message}`, 'error');
    }
}

// Placeholder functions for post interactions
function toggleLike(button, postId, tag) {
    button.classList.toggle('liked');
    setStatus(`Liked post ${postId}`, 'success');
}

function commentOnPost(postId) {
    setStatus(`Commenting on post ${postId} is not implemented yet.`, 'info');
}

function sharePost(postId) {
    setStatus(`Sharing post ${postId} is not implemented yet.`, 'info');
}

// Initialize feed
document.addEventListener('DOMContentLoaded', loadTwitterFeed);