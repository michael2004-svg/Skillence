// notifications.js - Complete Notification System

// In-memory notifications storage
let notificationsDB = [];
let unreadCount = 0;

// Notification types
const NOTIFICATION_TYPES = {
    LIKE: 'like',
    COMMENT: 'comment',
    FOLLOW: 'follow',
    MENTION: 'mention',
    POST: 'post'
};

// Initialize notifications
async function initializeNotifications() {
    await loadNotifications();
    updateNotificationBadge();
}

// Load notifications from database or generate mock data
async function loadNotifications() {
    try {
        const userId = await getUserId();
        if (!userId) return;

        // Try to load from Supabase (if notifications table exists)
        const { data, error } = await window.supabaseClient
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (!error && data) {
            notificationsDB = data;
        } else {
            // Generate mock notifications if table doesn't exist
            notificationsDB = await generateMockNotifications(userId);
        }

        unreadCount = notificationsDB.filter(n => !n.is_read).length;
        renderNotifications();
        updateNotificationBadge();

    } catch (error) {
        console.error('Error loading notifications:', error);
        // Fallback to mock data
        notificationsDB = await generateMockNotifications(await getUserId());
        renderNotifications();
    }
}

// Generate mock notifications
async function generateMockNotifications(userId) {
    const mockUsers = [
        { name: 'Sarah Johnson', action: 'started following you', type: NOTIFICATION_TYPES.FOLLOW, time: Date.now() - 3600000 },
        { name: 'Mike Chen', action: 'liked your post about JavaScript frameworks', type: NOTIFICATION_TYPES.LIKE, time: Date.now() - 120000 },
        { name: 'Emily Rodriguez', action: 'commented on your post', type: NOTIFICATION_TYPES.COMMENT, time: Date.now() - 7200000 },
        { name: 'Alex Kumar', action: 'mentioned you in a post', type: NOTIFICATION_TYPES.MENTION, time: Date.now() - 86400000 },
        { name: 'Jessica Lee', action: 'started following you', type: NOTIFICATION_TYPES.FOLLOW, time: Date.now() - 172800000 },
        { name: 'David Park', action: 'liked your post', type: NOTIFICATION_TYPES.LIKE, time: Date.now() - 259200000 },
        { name: 'Rachel Green', action: 'commented: "Great insights!"', type: NOTIFICATION_TYPES.COMMENT, time: Date.now() - 345600000 }
    ];

    return mockUsers.map((user, index) => ({
        id: `notif_${index}`,
        user_id: userId,
        actor_name: user.name,
        action: user.action,
        type: user.type,
        created_at: new Date(user.time).toISOString(),
        is_read: index > 1, // First 2 are unread
        post_id: user.type === NOTIFICATION_TYPES.LIKE || user.type === NOTIFICATION_TYPES.COMMENT ? 'post_123' : null
    }));
}

// Render notifications
function renderNotifications() {
    const container = document.getElementById('notificationsContainer');
    if (!container) return;

    if (notificationsDB.length === 0) {
        container.innerHTML = `
            <div class="no-notifications">
                <div class="no-notifications-icon">🔔</div>
                <p class="no-notifications-text">No notifications yet</p>
                <p class="no-notifications-subtext">When someone interacts with your content, you'll see it here</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notificationsDB.map(notification => 
        renderNotificationItem(notification)
    ).join('');
}

// Render single notification item
function renderNotificationItem(notification) {
    const iconMap = {
        [NOTIFICATION_TYPES.LIKE]: { emoji: '❤️', class: 'like' },
        [NOTIFICATION_TYPES.COMMENT]: { emoji: '💬', class: 'comment' },
        [NOTIFICATION_TYPES.FOLLOW]: { emoji: '👤', class: 'follow' },
        [NOTIFICATION_TYPES.MENTION]: { emoji: '@', class: 'mention' },
        [NOTIFICATION_TYPES.POST]: { emoji: '📝', class: 'post' }
    };

    const icon = iconMap[notification.type] || { emoji: '🔔', class: 'default' };
    const timeAgo = formatTimeAgo(notification.created_at);
    const unreadClass = notification.is_read ? '' : 'unread';

    return `
        <div class="notification-item ${unreadClass}" 
             onclick="handleNotificationClick('${notification.id}', '${notification.post_id || ''}')" 
             data-notification-id="${notification.id}">
            <div class="notification-icon ${icon.class}">${icon.emoji}</div>
            <div class="notification-content">
                <div class="notification-text">
                    <strong>${sanitizeHtml(notification.actor_name)}</strong> 
                    ${sanitizeHtml(notification.action)}
                </div>
                <div class="notification-time">${timeAgo}</div>
            </div>
            ${!notification.is_read ? '<div class="notification-badge"></div>' : ''}
        </div>
    `;
}

// Handle notification click
async function handleNotificationClick(notificationId, postId) {
    // Mark as read
    await markNotificationAsRead(notificationId);

    // Navigate to post if applicable
    if (postId) {
        // Switch to home tab and scroll to post
        window.SkillenceCore.switchTab('home');
        setTimeout(() => {
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            if (postElement) {
                postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                postElement.classList.add('highlight-post');
                setTimeout(() => postElement.classList.remove('highlight-post'), 2000);
            }
        }, 300);
    }
}

// Mark notification as read
async function markNotificationAsRead(notificationId) {
    const notification = notificationsDB.find(n => n.id === notificationId);
    if (!notification || notification.is_read) return;

    notification.is_read = true;
    unreadCount = Math.max(0, unreadCount - 1);

    // Update UI
    const notifElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
    if (notifElement) {
        notifElement.classList.remove('unread');
        const badge = notifElement.querySelector('.notification-badge');
        if (badge) badge.remove();
    }

    updateNotificationBadge();

    // Try to update in database
    try {
        await window.supabaseClient
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);
    } catch (error) {
        console.log('Notification update skipped (table may not exist)');
    }

    setStatus('Notification marked as read', 'success', 1500);
}

// Mark all as read
async function markAllAsRead() {
    notificationsDB.forEach(n => n.is_read = true);
    unreadCount = 0;

    renderNotifications();
    updateNotificationBadge();

    try {
        const userId = await getUserId();
        await window.supabaseClient
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId);
    } catch (error) {
        console.log('Bulk notification update skipped');
    }

    setStatus('All notifications marked as read', 'success', 2000);
}

// Update notification badge
function updateNotificationBadge() {
    const badge = document.querySelector('.notification-dot');
    const bellIcon = document.querySelector('.notification-bell');
    
    if (badge) {
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
    }

    // Update bell icon animation
    if (bellIcon && unreadCount > 0) {
        bellIcon.classList.add('has-notifications');
    } else if (bellIcon) {
        bellIcon.classList.remove('has-notifications');
    }

    // Update nav badge
    const navNotifIcon = document.querySelector('[data-tab="notifications"] .nav-icon');
    if (navNotifIcon && unreadCount > 0) {
        if (!navNotifIcon.querySelector('.notification-count')) {
            navNotifIcon.style.position = 'relative';
            navNotifIcon.insertAdjacentHTML('beforeend', `
                <span class="notification-count">${unreadCount > 9 ? '9+' : unreadCount}</span>
            `);
        } else {
            const countElement = navNotifIcon.querySelector('.notification-count');
            countElement.textContent = unreadCount > 9 ? '9+' : unreadCount;
        }
    } else if (navNotifIcon) {
        const countElement = navNotifIcon.querySelector('.notification-count');
        if (countElement) countElement.remove();
    }
}

// Add new notification (for real-time updates)
function addNotification(notification) {
    notificationsDB.unshift(notification);
    if (!notification.is_read) {
        unreadCount++;
    }
    
    renderNotifications();
    updateNotificationBadge();

    // Show toast notification
    showNotificationToast(notification);
}

// Show toast notification
function showNotificationToast(notification) {
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
        <div class="toast-icon">🔔</div>
        <div class="toast-content">
            <div class="toast-title">New Notification</div>
            <div class="toast-message">${sanitizeHtml(notification.actor_name)} ${sanitizeHtml(notification.action)}</div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Filter notifications
function filterNotifications(type) {
    const container = document.getElementById('notificationsContainer');
    if (!container) return;

    let filtered = notificationsDB;
    if (type !== 'all') {
        filtered = notificationsDB.filter(n => n.type === type);
    }

    container.innerHTML = filtered.map(n => renderNotificationItem(n)).join('');

    // Update active filter button
    document.querySelectorAll('.notification-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === type) {
            btn.classList.add('active');
        }
    });
}

// Utility functions
function sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatTimeAgo(date) {
    const diff = Date.now() - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeNotifications();
    
    // Refresh notifications every 30 seconds
    setInterval(() => {
        if (document.getElementById('notifications-tab')?.classList.contains('active')) {
            loadNotifications();
        }
    }, 30000);
});

// Export functions
window.NotificationsModule = {
    initializeNotifications,
    loadNotifications,
    markNotificationAsRead,
    markAllAsRead,
    addNotification,
    filterNotifications
};

