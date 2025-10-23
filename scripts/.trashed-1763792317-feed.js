async function loadTwitterFeed() {
    const feedContainer = document.getElementById('feedContainer');
    const loadingContainer = document.getElementById('loadingContainer');
    
    if (!feedContainer || !loadingContainer) {
        console.error('Feed or loading container not found');
        setStatus('Feed container not found.', 'error');
        return;
    }

    // Ensure loading spinner is visible
    loadingContainer.style.display = 'flex';

    try {
        const userId = await getUserId();
        console.log('User ID:', userId); // Debug

        const profile = await fetchUserProfile() || {};
        console.log('Profile:', profile); // Debug

        const userInterests = [
            ...(profile.top_skills?.slice(0, 3) || []),
            profile.industry?.toLowerCase() || 'software',
            profile.job_title?.toLowerCase() || 'developer'
        ].filter(Boolean);
        console.log('User Interests:', userInterests); // Debug

        // Fetch posts from Supabase
        const { data: posts, error: postsError } = await window.supabaseClient
            .from('posts')
            .select(`
                id,
                content,
                created_at,
                tags,
                image_url,
                user_id,
                profiles!posts_user_id_fkey (job_title, profile_picture_url)
            `)
            .order('created_at', { ascending: false })
            .limit(20); // Limit to 20 for faster loading
        if (postsError) throw new Error(`Posts query failed: ${postsError.message}`);
        console.log('Fetched Posts:', posts); // Debug

        // Render posts immediately (even if jobs are slow)
        let feedHtml = '';
        if (posts && posts.length > 0) {
            feedHtml = posts.map(post => `
                <div class="post">
                    <div class="post-header">
                        <img src="${post.profiles?.profile_picture_url || '../images/default.jpg'}" 
                             alt="User Avatar" 
                             class="profile-pic" 
                             onclick="viewUserProfile('${post.user_id}')"
                             style="cursor: pointer;">
                        <div class="post-author" 
                             onclick="viewUserProfile('${post.user_id}')"
                             style="cursor: pointer;">
                            ${post.profiles?.job_title || 'Anonymous'}
                        </div>
                        <div class="post-time">${new Date(post.created_at).toLocaleString()}</div>
                        <button class="post-options">⋮</button>
                    </div>
                    <div class="post-content">${post.content}</div>
                    ${post.image_url ? `
                        <img src="${post.image_url}" alt="Post Image" class="post-image">
                    ` : ''}
                    ${post.tags?.length ? `
                        <div class="post-tags">${post.tags.map(tag => `#${tag}`).join(' ')}</div>
                    ` : ''}
                    <div class="post-actions">
                        <div class="action-group">
                            <button class="action-btn">❤️ Like</button>
                            <button class="action-btn">💬 Comment</button>
                            <button class="action-btn">🔁 Share</button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            feedHtml = '<p>No posts found. Loading jobs...</p>';
        }

        // Update feed content and hide spinner
        feedContainer.innerHTML = feedHtml;
        loadingContainer.style.display = 'none';

        // Fetch and append jobs asynchronously (non-blocking)
        const jobs = await fetchJobs(userInterests.join(' '), '') || [];
        console.log('Fetched Jobs:', jobs); // Debug

        if (jobs.length > 0) {
            const jobItems = jobs.map(job => `
                <div class="job-post">
                    <div class="job-title">${job.title || 'No Title'}</div>
                    <div class="job-company">${job.company?.display_name || 'Unknown Company'}</div>
                    <div class="job-location">${job.location?.display_name || 'No Location'}</div>
                    <div class="job-description">${job.description?.slice(0, 150) || 'No Description'}...</div>
                    <div class="job-salary">${job.salary_min ? `$${job.salary_min} - $${job.salary_max}` : 'Salary not specified'}</div>
                    <div class="post-actions">
                        <a href="${job.redirect_url || '#'}" target="_blank" class="apply-btn">Apply Now</a>
                    </div>
                </div>
            `).join('');
            feedContainer.innerHTML += jobItems;
        }

        setStatus('Feed loaded successfully!', 'success');
    } catch (error) {
        console.error('Error loading feed:', error);
        setStatus(`Failed to load feed: ${error.message}`, 'error');
        feedContainer.innerHTML = '<p>Failed to load feed. Please try again.</p>';
        loadingContainer.style.display = 'none'; // Hide spinner on error
    }
}