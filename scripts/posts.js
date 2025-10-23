//post.js
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

        // Create post
        const { data: post, error } = await supabase
            .from('posts')
            .insert({ user_id: userId, content, tags, visibility })
            .select('id')
            .single();

        if (error) throw error;

        // Upload image if present
        if (imageFile) {
            const imageUrl = await uploadPostImage(imageFile, userId, post.id);
            if (imageUrl) {
                await supabase.from('posts').update({ image_url: imageUrl }).eq('id', post.id);
            }
        }

        // Reset form
        resetPostForm();
        setStatus('Post published! 🎉', 'success');
        switchTab('home');
        loadTwitterFeed(); // Refresh feed

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
        
        const { error } = await supabase.storage
            .from('post_images')
            .upload(fileName, file);

        if (error) throw error;

        const { data } = supabase.storage.from('post_images').getPublicUrl(fileName);
        return data.publicUrl;
    } catch (error) {
        console.error('Image upload failed:', error);
        throw error;
    }
}

function updateCharCount(textarea) {
    const count = textarea.value.length;
    document.getElementById('char-counter').textContent = count;
    document.querySelector('.post-btn').disabled = count === 0;
}

function previewPostImage(input) {
    if (!input.files[0]) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('imagePreview').style.display = 'block';
    };
    reader.readAsDataURL(input.files[0]);
}

function removePostImage() {
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('postImage').value = '';
}

function resetPostForm() {
    document.querySelector('.post-textarea').value = '';
    document.getElementById('postImage').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.querySelector('.post-btn').disabled = true;
    document.getElementById('char-counter').textContent = '0';
}

function cancelPost() {
    resetPostForm();
    switchTab('home');
}