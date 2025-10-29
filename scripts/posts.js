async function publishPost() {
    try {
        const userId = await getUserId();
        if (!userId) return setStatus('Please sign in to post.', 'error');

        const content = document.querySelector('.post-textarea').value.trim();
        if (!content) return setStatus('Post content cannot be empty.', 'error');

        const imageFile = document.getElementById('postImage').files[0];
        const visibility = document.querySelector('.visibility-select').value;

        setStatus('Publishing...', 'info');

        // Generate smart tags
        const profile = await fetchUserProfile();
        const tags = extractTags(content, profile);

        // Create post with proper structure
        const { data: post, error } = await window.supabaseClient
            .from('posts')
            .insert({ 
                user_id: userId, 
                content, 
                tags, 
                visibility 
            })
            .select('id')
            .single();

        if (error) throw error;

        // Upload image if present
        if (imageFile) {
            const imageUrl = await uploadPostImage(imageFile, userId, post.id);
            if (imageUrl) {
                await window.supabaseClient
                    .from('posts')
                    .update({ image_url: imageUrl })
                    .eq('id', post.id);
            }
        }

        // Reset form
        resetPostForm();
        setStatus('Post published! 🎉', 'success');
        switchTab('home');
        
        // Refresh feed
        if (typeof loadTwitterFeed === 'function') {
            loadTwitterFeed();
        }

    } catch (error) {
        console.error('Post error:', error);
        setStatus(`Failed to publish: ${error.message}`, 'error');
    }
}

function extractTags(content, profile) {
    const contentTags = (content.match(/#[^\s]+/g) || [])
        .map(tag => tag.slice(1).toLowerCase())
        .filter(tag => tag.length > 1);

    const profileTags = [
        ...(profile?.top_skills || []).slice(0, 3),
        profile?.job_title?.toLowerCase(),
        profile?.industry?.toLowerCase()
    ].filter(Boolean);

    return [...new Set([...contentTags, ...profileTags])].slice(0, 8);
}

async function uploadPostImage(file, userId, postId) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `posts/${userId}/${postId}_${Date.now()}.${fileExt}`;
        
        const { error } = await window.supabaseClient.storage
            .from('post_images')
            .upload(fileName, file);

        if (error) throw error;

        const { data } = window.supabaseClient.storage.from('post_images').getPublicUrl(fileName);
        return data.publicUrl;
    } catch (error) {
        console.error('Image upload failed:', error);
        setStatus('Image upload failed, posting without image', 'warning');
        return null;
    }
}

function updateCharCount(textarea) {
    const count = textarea.value.length;
    const counter = document.getElementById('char-counter');
    const postBtn = document.querySelector('.post-btn');
    
    if (counter) counter.textContent = count;
    if (postBtn) postBtn.disabled = count === 0;
}

function previewPostImage(input) {
    if (!input.files[0]) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewImage = document.getElementById('previewImage');
        const imagePreview = document.getElementById('imagePreview');
        
        if (previewImage) previewImage.src = e.target.result;
        if (imagePreview) imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(input.files[0]);
}

function removePostImage() {
    const imagePreview = document.getElementById('imagePreview');
    const postImage = document.getElementById('postImage');
    
    if (imagePreview) imagePreview.style.display = 'none';
    if (postImage) postImage.value = '';
}

function resetPostForm() {
    const textarea = document.querySelector('.post-textarea');
    const postImage = document.getElementById('postImage');
    const imagePreview = document.getElementById('imagePreview');
    const postBtn = document.querySelector('.post-btn');
    const charCounter = document.getElementById('char-counter');
    
    if (textarea) textarea.value = '';
    if (postImage) postImage.value = '';
    if (imagePreview) imagePreview.style.display = 'none';
    if (postBtn) postBtn.disabled = true;
    if (charCounter) charCounter.textContent = '0';
}

function cancelPost() {
    resetPostForm();
    if (typeof switchTab === 'function') {
        switchTab('home');
    }
}

// Make functions available globally
window.publishPost = publishPost;
window.updateCharCount = updateCharCount;
window.previewPostImage = previewPostImage;
window.removePostImage = removePostImage;
window.cancelPost = cancelPost;