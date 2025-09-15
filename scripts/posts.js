async function uploadPostImage(file, userId, postId) {
    if (!file) return null;
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}_${postId}_${Date.now()}.${fileExt}`;
        const { error } = await window.supabaseClient.storage
            .from('post_images')
            .upload(fileName, file);
        if (error) throw error;

        const { data } = window.supabaseClient.storage
            .from('post_images')
            .getPublicUrl(fileName);
        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading post image:', error);
        setStatus(`Failed to upload image: ${error.message}`, 'error');
        return null;
    }
}

async function publishPost() {
    try {
        const userId = await getUserId();
        if (!userId) {
            setStatus('Please sign in to post.', 'error');
            return;
        }

        const textarea = document.querySelector('.post-textarea');
        const content = textarea.value.trim();
        const postImage = document.getElementById('postImage').files[0];
        const visibility = document.querySelector('.visibility-select').value;

        if (!content) {
            setStatus('Post content cannot be empty.', 'error');
            return;
        }

        const profile = await fetchUserProfile();
        const cvData = await fetchLatestCVAnalysis();
        const tags = [
            ...(content.match(/#[^\s]+/g)?.map(tag => tag.slice(1).toLowerCase()) || []),
            ...(cvData?.skills?.slice(0, 3) || []),
            ...(profile?.top_skills?.slice(0, 3) || []),
            profile?.job_title?.toLowerCase() || ''
        ].filter((v, i, a) => v && a.indexOf(v) === i);

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

        let imageUrl = null;
        if (postImage) {
            imageUrl = await uploadPostImage(postImage, userId, post.id);
            if (imageUrl) {
                const { error: updateError } = await window.supabaseClient
                    .from('posts')
                    .update({ image_url: imageUrl })
                    .eq('id', post.id);
                if (updateError) throw updateError;
            }
        }

        setStatus('Post published successfully!', 'success');
        textarea.value = '';
        document.getElementById('postImage').value = '';
        document.getElementById('imagePreview').style.display = 'none';
        document.querySelector('.post-btn').disabled = true;
        switchTab('home');
    } catch (error) {
        console.error('Error publishing post:', error);
        setStatus(`Failed to publish post: ${error.message}`, 'error');
    }
}

function updateCharCount(textarea) {
    const charCounter = document.getElementById('char-counter');
    const postBtn = document.querySelector('.post-btn');
    const count = textarea.value.length;
    charCounter.textContent = count;
    postBtn.disabled = count === 0;
}

function previewPostImage(input) {
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');
    const postBtn = document.querySelector('.post-btn');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            imagePreview.style.display = 'block';
            postBtn.disabled = document.querySelector('.post-textarea').value.length === 0;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function removePostImage() {
    const imagePreview = document.getElementById('imagePreview');
    const postImage = document.getElementById('postImage');
    const postBtn = document.querySelector('.post-btn');
    imagePreview.style.display = 'none';
    postImage.value = '';
    postBtn.disabled = document.querySelector('.post-textarea').value.length === 0;
}

function cancelPost() {
    document.querySelector('.post-textarea').value = '';
    document.getElementById('postImage').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.querySelector('.post-btn').disabled = true;
    switchTab('home');
}

function handleMediaUpload(type) {
    setStatus(`${type} upload is not implemented yet.`, 'info');
}

function addPoll() {
    setStatus('Poll creation is not implemented yet.', 'info');
}

function addCelebration() {
    setStatus('Celebration post is not implemented yet.', 'info');
}