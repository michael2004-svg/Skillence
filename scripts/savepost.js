class SavedPostsManager {
    constructor() {
        this.savedPosts = new Set();
        this.loadSavedPosts();
    }
    
    async loadSavedPosts() {
        const userId = await getUserId();
        if (!userId) return;
        
        try {
            const { data } = await window.supabaseClient
                .from('saved_posts')
                .select('post_id')
                .eq('user_id', userId);
            
            if (data) {
                this.savedPosts = new Set(data.map(d => d.post_id));
            }
        } catch (error) {
            console.log('Saved posts table not available, using local storage');
            const saved = localStorage.getItem('savedPosts');
            if (saved) {
                this.savedPosts = new Set(JSON.parse(saved));
            }
        }
    }
    
    async toggleSave(postId) {
        const userId = await getUserId();
        if (!userId) {
            setStatus('Please sign in to save posts', 'error');
            return;
        }
        
        if (this.savedPosts.has(postId)) {
            await this.unsavePost(postId, userId);
        } else {
            await this.savePost(postId, userId);
        }
        
        this.updateSaveButton(postId);
    }
    
    async savePost(postId, userId) {
        try {
            await window.supabaseClient
                .from('saved_posts')
                .insert({ user_id: userId, post_id: postId });
            
            this.savedPosts.add(postId);
            setStatus('Post saved!', 'success', 1500);
        } catch (error) {
            // Fallback to localStorage
            this.savedPosts.add(postId);
            localStorage.setItem('savedPosts', JSON.stringify([...this.savedPosts]));
            setStatus('Post saved locally!', 'success', 1500);
        }
    }
    
    async unsavePost(postId, userId) {
        try {
            await window.supabaseClient
                .from('saved_posts')
                .delete()
                .eq('user_id', userId)
                .eq('post_id', postId);
            
            this.savedPosts.delete(postId);
            setStatus('Post unsaved', 'info', 1500);
        } catch (error) {
            // Fallback to localStorage
            this.savedPosts.delete(postId);
            localStorage.setItem('savedPosts', JSON.stringify([...this.savedPosts]));
            setStatus('Post unsaved', 'info', 1500);
        }
    }
    
    isSaved(postId) {
        return this.savedPosts.has(postId);
    }
    
    updateSaveButton(postId) {
        const btn = document.querySelector(`[data-save-post="${postId}"]`);
        if (btn) {
            const isSaved = this.isSaved(postId);
            btn.innerHTML = isSaved ? '🔖 Saved' : '🔖 Save';
            btn.classList.toggle('saved', isSaved);
        }
    }
}

// Initialize
let savedPostsManager;
document.addEventListener('DOMContentLoaded', () => {
    savedPostsManager = new SavedPostsManager();
});

// Export
window.SavedPostsManager = SavedPostsManager;
window.toggleSavePost = (postId) => {
    if (savedPostsManager) {
        savedPostsManager.toggleSave(postId);
    }
};

