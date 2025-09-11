        // Tab switching functionality
        function switchTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });

            // Remove active class from all nav items
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });

            // Show the selected tab content
            const targetTab = document.getElementById(tabName + '-tab');
            if (targetTab) {
                targetTab.classList.add('active');
            }

            // Add active class to clicked nav item
            const clickedNavItem = document.querySelector(`[data-tab="${tabName}"]`);
            if (clickedNavItem) {
                clickedNavItem.classList.add('active');
            }

            // Update search placeholder based on active tab
            const searchInput = document.getElementById('searchInput');
            if (tabName === 'career') {
                searchInput.placeholder = 'Search careers';
            } else {
                searchInput.placeholder = "What's on your mind?";
            }

            // Handle tabs that don't have content yet
            if (!targetTab) {
                alert(`${tabName.charAt(0).toUpperCase() + tabName.slice(1)} section coming soon!`);
                // Revert to home tab
                document.getElementById('home-tab').classList.add('active');
                document.querySelector('[data-tab="home"]').classList.add('active');
            }
        }

        // Feature card click handlers
        function handleFeatureClick(feature) {
            console.log(`Clicked on ${feature}`);
            
            // Add click animation
            event.target.closest('.feature-card').style.transform = 'scale(0.95)';
            setTimeout(() => {
                event.target.closest('.feature-card').style.transform = '';
            }, 150);

            // Simulate navigation to feature
            const featureNames = {
                'cv-analyzer': 'CV Analyzer',
                'jobs': 'Jobs',
                'courses': 'Courses',
                'career-advice': 'Career Advice',
                'career-paths': 'Career Paths',
                'salary-insights': 'Salary Insights',
                'interviews': 'Interviews',
                'resume-builder': 'Resume Builder'
            };
            
            alert(`Opening ${featureNames[feature]}...`);
        }

        // Home page interactions
        function toggleLike(button) {
            if (button.textContent === '❤️') {
                button.textContent = '💙';
                button.style.color = '#3498db';
            } else {
                button.textContent = '❤️';
                button.style.color = '';
            }
        }

        function applyForJob() {
            alert('Redirecting to job application...');
        }

        function handleAddClick() {
            alert('Create new post...');
        }

        // Profile page interactions
        function toggleFollow() {
            const followBtn = document.querySelector('.follow-btn');
            if (followBtn.textContent === 'Follow') {
                followBtn.textContent = 'Following';
                followBtn.classList.add('following');
                
                // Update follower count
                const followerCount = document.querySelector('.stat-number');
                followerCount.textContent = '1.3k';
            } else {
                followBtn.textContent = 'Follow';
                followBtn.classList.remove('following');
                
                // Revert follower count
                const followerCount = document.querySelector('.stat-number');
                followerCount.textContent = '1.2k';
            }
        }

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            
            // Get current active tab
            const activeTab = document.querySelector('.tab-content.active');
            
            if (activeTab.id === 'career-tab') {
                // Filter feature cards in career tab
                const featureCards = document.querySelectorAll('.feature-card');
                featureCards.forEach(card => {
                    const title = card.querySelector('.feature-title').textContent.toLowerCase();
                    if (title.includes(searchTerm) || searchTerm === '') {
                        card.style.display = 'block';
                        card.style.opacity = '1';
                    } else {
                        card.style.opacity = '0.3';
                    }
                });
            } else if (activeTab.id === 'home-tab') {
                // Filter posts in home tab
                const posts = document.querySelectorAll('.post, .career-tip');
                posts.forEach(post => {
                    const content = post.textContent.toLowerCase();
                    if (content.includes(searchTerm) || searchTerm === '') {
                        post.style.display = 'block';
                        post.style.opacity = '1';
                    } else {
                        post.style.opacity = '0.3';
                    }
                });
            }
        });

        // Add interactive feedback to feature cards
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('mousedown', function() {
                this.style.transform = 'scale(0.98)';
            });
            
            card.addEventListener('mouseup', function() {
                this.style.transform = '';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = '';
            });
        });

        // Initialize the app - show home tab by default
        document.addEventListener('DOMContentLoaded', function() {
            switchTab('home');
        });

// Create Post Functionality

// Character count and post validation
function updateCharCount(textarea) {
    const charCount = textarea.value.length;
    const maxChars = 280;
    const counter = document.getElementById('char-counter');
    const postBtn = document.querySelector('.post-btn');
    
    // Update character count display
    counter.textContent = charCount;
    
    // Update styling based on character count
    const charCountElement = counter.parentElement;
    charCountElement.classList.remove('warning', 'danger');
    
    if (charCount > maxChars * 0.9) {
        charCountElement.classList.add('warning');
    }
    if (charCount > maxChars) {
        charCountElement.classList.add('danger');
    }
    
    // Enable/disable post button
    const hasContent = textarea.value.trim().length > 0;
    const withinLimit = charCount <= maxChars;
    postBtn.disabled = !hasContent || !withinLimit;
}

// Media upload handlers
function handleMediaUpload(type) {
    const mediaTypes = {
        'image': 'Image',
        'video': 'Video', 
        'document': 'Document'
    };
    
    // Create file input dynamically
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    
    // Set accept attribute based on media type
    switch(type) {
        case 'image':
            fileInput.accept = 'image/*';
            break;
        case 'video':
            fileInput.accept = 'video/*';
            break;
        case 'document':
            fileInput.accept = '.pdf,.doc,.docx,.txt';
            break;
    }
    
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            console.log(`Selected ${type}:`, file.name);
            // Here you would typically upload the file or show a preview
            showMediaPreview(file, type);
        }
    };
    
    fileInput.click();
}

// Show media preview
function showMediaPreview(file, type) {
    // Create preview element if it doesn't exist
    let previewContainer = document.querySelector('.media-preview');
    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.className = 'media-preview';
        previewContainer.innerHTML = `
            <div class="preview-header">
                <span class="preview-title">Attached Media</span>
                <button class="remove-media" onclick="removeMediaPreview()">×</button>
            </div>
            <div class="preview-content"></div>
        `;
        
        // Insert before post options
        const postOptions = document.querySelector('.post-options');
        postOptions.parentNode.insertBefore(previewContainer, postOptions);
    }
    
    const previewContent = previewContainer.querySelector('.preview-content');
    
    if (type === 'image') {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewContent.innerHTML = `
                <div class="image-preview">
                    <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
                </div>
            `;
        };
        reader.readAsDataURL(file);
    } else {
        previewContent.innerHTML = `
            <div class="file-preview">
                <div class="file-icon">${type === 'video' ? '🎥' : '📄'}</div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
        `;
    }
    
    previewContainer.style.display = 'block';
}

// Remove media preview
function removeMediaPreview() {
    const previewContainer = document.querySelector('.media-preview');
    if (previewContainer) {
        previewContainer.remove();
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Add poll functionality
function addPoll() {
    alert('Poll feature coming soon!');
}

// Add celebration functionality
function addCelebration() {
    const textarea = document.querySelector('.post-textarea');
    const celebrations = [
        '🎉 Celebrating a new achievement!',
        '🎊 Excited to share some great news!',
        '🏆 Proud moment to share!',
        '✨ Something special happened!',
        '🎯 Milestone reached!'
    ];
    
    const randomCelebration = celebrations[Math.floor(Math.random() * celebrations.length)];
    
    if (textarea.value.trim() === '') {
        textarea.value = randomCelebration + ' ';
    } else {
        textarea.value = randomCelebration + ' ' + textarea.value;
    }
    
    updateCharCount(textarea);
    textarea.focus();
}

// Cancel post
function cancelPost() {
    const textarea = document.querySelector('.post-textarea');
    const visibilitySelect = document.querySelector('.visibility-select');
    
    if (textarea.value.trim() !== '') {
        if (confirm('Are you sure you want to discard this post?')) {
            textarea.value = '';
            visibilitySelect.selectedIndex = 0;
            removeMediaPreview();
            updateCharCount(textarea);
            
            // Switch back to home tab
            switchTab('home');
        }
    } else {
        // Switch back to home tab
        switchTab('home');
    }
}

// Publish post
function publishPost() {
    const textarea = document.querySelector('.post-textarea');
    const postContent = textarea.value.trim();
    const visibility = document.querySelector('.visibility-select').value;
    
    if (postContent === '') {
        alert('Please write something before posting!');
        return;
    }
    
    // Show loading state
    const postBtn = document.querySelector('.post-btn');
    const originalText = postBtn.textContent;
    postBtn.textContent = 'Posting...';
    postBtn.disabled = true;
    
    // Simulate posting delay
    setTimeout(() => {
        // Show success message
        showPostSuccess();
        
        // Add the new post to the home feed
        addPostToFeed(postContent, visibility);
        
        // Reset form
        resetPostForm();
        
        // Switch to home tab after a short delay
        setTimeout(() => {
            switchTab('home');
        }, 1500);
        
    }, 1000);
}

// Show post success animation
function showPostSuccess() {
    const container = document.querySelector('.create-post-container');
    container.innerHTML = `
        <div class="post-success">
            <div class="success-icon">✅</div>
            <div class="success-message">Post published successfully!</div>
        </div>
    `;
}

// Add new post to home feed
function addPostToFeed(content, visibility) {
    const homeContent = document.querySelector('.home-content');
    const visibilityIcons = {
        'public': '🌍',
        'connections': '👥', 
        'private': '🔒'
    };
    
    const newPost = document.createElement('div');
    newPost.className = 'post';
    newPost.style.animation = 'fadeInUp 0.5s ease';
    newPost.innerHTML = `
        <div class="post-header">
            <div class="profile-pic" style="background: linear-gradient(45deg, #e8f4fd, #7cc7e8); display: flex; align-items: center; justify-content: center; color: #2c3e50; font-weight: bold;">J</div>
            <div class="post-author">
                Jane Doe 
                <span style="font-size: 14px; color: #6c757d; margin-left: 8px;">
                    ${visibilityIcons[visibility]} • Just now
                </span>
            </div>
            <div class="post-options">⋯</div>
        </div>
        <div class="post-content">${content}</div>
        <div class="post-actions">
            <button class="action-btn" onclick="toggleLike(this)">❤️</button>
            <button class="action-btn">💬</button>
            <button class="action-btn">🔖</button>
        </div>
    `;
    
    // Insert at the beginning of home content
    homeContent.insertBefore(newPost, homeContent.firstChild);
}

// Reset post form
function resetPostForm() {
    const textarea = document.querySelector('.post-textarea');
    const visibilitySelect = document.querySelector('.visibility-select');
    const postBtn = document.querySelector('.post-btn');
    
    if (textarea) {
        textarea.value = '';
        updateCharCount(textarea);
    }
    
    if (visibilitySelect) {
        visibilitySelect.selectedIndex = 0;
    }
    
    if (postBtn) {
        postBtn.textContent = 'Post';
        postBtn.disabled = true;
    }
    
    removeMediaPreview();
}

// Update the main handleAddClick function to show the add post tab
function handleAddClick() {
    // Reset form before showing
    setTimeout(() => {
        resetPostForm();
        // Restore the form HTML if it was replaced by success message
        const container = document.querySelector('.create-post-container');
        if (!container.querySelector('.post-form')) {
            location.reload(); // Simple way to restore the form, or you could rebuild it
        }
    }, 100);
    
    switchTab('add-post');
}

// Add CSS for fade in animation
const style = document.createElement('style');
style.textContent = `
    .media-preview {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        display: none;
    }
    
    .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }
    
    .preview-title {
        font-size: 14px;
        font-weight: 600;
        color: #6c757d;
    }
    
    .remove-media {
        background: none;
        border: none;
        font-size: 20px;
        color: #6c757d;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
    }
    
    .remove-media:hover {
        background: #e9ecef;
    }
    
    .file-preview {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .file-icon {
        font-size: 24px;
    }
    
    .file-info {
        flex: 1;
    }
    
    .file-name {
        font-size: 14px;
        font-weight: 600;
        color: #2c3e50;
        margin-bottom: 2px;
    }
    
    .file-size {
        font-size: 12px;
        color: #6c757d;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);