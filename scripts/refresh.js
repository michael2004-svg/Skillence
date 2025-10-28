class PullToRefresh {
    constructor() {
        this.startY = 0;
        this.pulling = false;
        this.threshold = 80;
        this.init();
    }
    
    init() {
        let refreshIndicator = null;
        
        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0 && e.touches[0]) {
                this.startY = e.touches[0].pageY;
                this.pulling = true;
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            if (this.pulling && e.touches[0]) {
                const currentY = e.touches[0].pageY;
                const distance = currentY - this.startY;
                
                if (distance > 20 && !refreshIndicator) {
                    refreshIndicator = this.showIndicator();
                }
                
                if (refreshIndicator) {
                    const rotation = Math.min(distance * 2, 360);
                    refreshIndicator.style.transform = `translateY(${Math.min(distance, 100)}px) rotate(${rotation}deg)`;
                }
            }
        });
        
        document.addEventListener('touchend', async (e) => {
            if (this.pulling && e.changedTouches[0]) {
                const endY = e.changedTouches[0].pageY;
                const distance = endY - this.startY;
                
                if (distance > this.threshold) {
                    await this.refresh();
                }
                
                if (refreshIndicator) {
                    refreshIndicator.remove();
                    refreshIndicator = null;
                }
                
                this.pulling = false;
            }
        });
    }
    
    showIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'pull-refresh-indicator';
        indicator.innerHTML = '🔄';
        document.body.appendChild(indicator);
        return indicator;
    }
    
    async refresh() {
        const activeTab = document.querySelector('.tab-content.active');
        
        if (activeTab?.id === 'home-tab' && typeof loadTwitterFeed === 'function') {
            await loadTwitterFeed();
        } else if (activeTab?.id === 'profile-tab' && typeof fetchUserProfile === 'function') {
            await fetchUserProfile(true);
        } else if (activeTab?.id === 'notifications-tab' && window.NotificationsModule) {
            await window.NotificationsModule.loadNotifications();
        }
        
        if (typeof setStatus === 'function') {
            setStatus('Refreshed!', 'success', 1500);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if ('ontouchstart' in window) {
        new PullToRefresh();
    }
});

