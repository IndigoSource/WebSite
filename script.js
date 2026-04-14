// Discord User ID
const DISCORD_ID = '1280375078873337938';

// Lanyard API base URL
const LANYARD_API = 'https://api.lanyard.rest';

// Background Image - Set to URL, local file path, or leave empty for default gradient
// Examples: 'https://example.com/bg.jpg', 'images/background.png', or ''
const BACKGROUND_IMAGE = 'https://i.pinimg.com/originals/59/b2/34/59b2349684d902730f710b65f05ecb80.gif';

// Social Links - Edit these to change your social media links
const SOCIAL_LINKS = [
    {
        name: 'GitHub',
        url: 'https://github.com/IndigoSource',
        icon: 'github',
        hoverColor: '#6e7681'
    },
    {
        name: 'Spotify',
        url: 'https://open.spotify.com/user/inyncjgcvphzzixdfdeyqgct0',
        icon: 'spotify',
        hoverColor: '#1db954'
    },
    {
        name: 'Roblox',
        url: 'https://www.roblox.com/users/72986445/profile',
        icon: 'roblox',
        hoverColor: '#e2231a'
    },
    {
        name: 'Last.fm',
        url: 'https://www.last.fm/user/indifrog',
        icon: 'lastfm',
        hoverColor: '#d5100d'
    }
];

// WebSocket connection
let ws = null;
let reconnectTimer = null;

// DOM Elements
const avatar = document.getElementById('avatar');
const username = document.getElementById('username');
const discriminator = document.getElementById('discriminator');
const customStatus = document.getElementById('custom-status');
const statusIndicator = document.getElementById('status-indicator');
const activityContainer = document.getElementById('activity-container');

// Check if we're on a page with Discord status elements
const hasDiscordElements = avatar && username && discriminator;

// Initialize the page
async function init() {
    if (!hasDiscordElements) return; // Skip if elements don't exist

    try {
        // Fetch initial data from REST API
        const response = await fetch(`${LANYARD_API}/v1/users/${DISCORD_ID}`);
        const data = await response.json();

        if (data.success) {
            updateProfile(data.data);
        } else {
            console.error('Failed to fetch Lanyard data:', data);
            showError();
        }

        // Connect to WebSocket for real-time updates
        connectWebSocket();
    } catch (error) {
        console.error('Error initializing:', error);
        showError();
    }
}

// Update profile with Discord data
function updateProfile(data) {
    const { discord_user, discord_status, activities, kv } = data;
    
    // Update username
    username.textContent = discord_user.display_name || discord_user.username;
    discriminator.textContent = `@${discord_user.username}`;
    
    // Update avatar with Discord profile picture
    if (discord_user.avatar) {
        const avatarUrl = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${discord_user.avatar}.png?size=256`;
        avatar.src = avatarUrl;
        // Also set as favicon
        document.getElementById('favicon').href = avatarUrl;
    } else {
        // Default Discord avatar
        const defaultAvatar = `https://cdn.discordapp.com/embed/avatars/${(BigInt(DISCORD_ID) >> 22n) % 6n}.png`;
        avatar.src = defaultAvatar;
    }
    
    // Update status indicator
    updateStatusIndicator(discord_status);

    // Update custom status emoji under username
    updateCustomStatusEmoji(activities);

    // Update activities
    updateActivities(activities);
}

// Update status indicator color
function updateStatusIndicator(status) {
    statusIndicator.className = 'status-indicator';
    
    switch (status) {
        case 'online':
            statusIndicator.classList.add('online');
            break;
        case 'idle':
            statusIndicator.classList.add('idle');
            break;
        case 'dnd':
            statusIndicator.classList.add('dnd');
            break;
        case 'offline':
            statusIndicator.classList.add('offline');
            break;
        default:
            statusIndicator.classList.add('offline');
    }
}

// Update activities display
function updateActivities(activities) {
    if (!activities || activities.length === 0) {
        activityContainer.innerHTML = '<p class="no-activity">No activity</p>';
        return;
    }
    
    activityContainer.innerHTML = '';
    
    activities.forEach(activity => {
        // Skip custom status activity type
        if (activity.type === 4) return;
        
        const activityElement = createActivityElement(activity);
        activityContainer.appendChild(activityElement);
    });
    
    // If no activities were added (only custom status)
    if (activityContainer.children.length === 0) {
        activityContainer.innerHTML = '<p class="no-activity">No activity</p>';
    }
}

// Create activity element
function createActivityElement(activity) {
    const div = document.createElement('div');
    div.className = 'activity';

    // Get large image if available
    let imageUrl = null;
    let activityLink = null;
    
    if (activity.assets && activity.assets.large_image) {
        const imageId = activity.assets.large_image;
        if (imageId.startsWith('mp:external/')) {
            // Spotify cover image
            imageUrl = `https://media.discordapp.net/external/${imageId.replace('mp:external/', '')}`;
        } else if (activity.application_id) {
            // Regular activity image
            imageUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${imageId}.png`;
        }
    }

    // Build activity details
    let details = '';
    let state = '';
    let timer = '';

    if (activity.name === 'Spotify' && activity.sync_id) {
        // Spotify specific display
        details = activity.details || 'Unknown Song';
        state = activity.state || 'Unknown Artist';
        activityLink = `https://open.spotify.com/track/${activity.sync_id}`;

        // Add Spotify album art
        if (activity.assets && activity.assets.large_image) {
            imageUrl = `https://i.scdn.co/image/${activity.assets.large_image.replace('spotify:', '')}`;
        }
    } else {
        details = activity.details || activity.name;
        state = activity.state || '';
    }

    // Timer for elapsed time
    if (activity.timestamps && activity.timestamps.start) {
        const startTime = new Date(activity.timestamps.start);
        timer = `Started ${formatTimeDifference(startTime)}`;
    }

    // Wrap in link if available
    const content = `
        ${imageUrl ? `<img src="${imageUrl}" alt="${activity.name}" class="activity-image">` : ''}
        <div class="activity-details">
            ${details ? `<h3>${activityLink ? `<a href="${activityLink}" target="_blank" class="activity-link">${details}</a>` : details}</h3>` : ''}
            ${state ? `<p>${state}</p>` : ''}
            ${timer ? `<p class="activity-timer">${timer}</p>` : ''}
        </div>
    `;

    div.innerHTML = content;

    return div;
}

// Update custom status emoji under username
function updateCustomStatusEmoji(activities) {
    if (!customStatus) return;

    const customActivity = activities?.find(a => a.type === 4);

    if (!customActivity || !customActivity.emoji) {
        customStatus.innerHTML = '';
        return;
    }

    const emoji = customActivity.emoji;
    let emojiHTML = '';

    if (emoji.id) {
        // Custom Discord emoji
        const format = emoji.animated ? 'gif' : 'png';
        emojiHTML = `<img src="https://cdn.discordapp.com/emojis/${emoji.id}.${format}?size=24" alt="${emoji.name || 'emoji'}" class="emoji-custom">`;
    } else if (emoji.name) {
        // Unicode emoji
        emojiHTML = `<span class="emoji-text">${emoji.name}</span>`;
    }

    const statusTextContent = customActivity.state || '';
    customStatus.innerHTML = `${emojiHTML}${statusTextContent ? `<span>${escapeHtml(statusTextContent)}</span>` : ''}`;
}

// Format time difference
function formatTimeDifference(date) {
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Social media SVG icons
const SOCIAL_ICONS = {
    github: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`,
    spotify: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>`,
    roblox: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 302.7 302.7" fill="currentColor"><path d="M120.5,271.7c-110.9-28.6-120-31-119.9-31.5C0.7,239.6,62.1,0.5,62.2,0.4c0,0,54,13.8,119.9,30.8s120,30.8,120.1,30.8c0.2,0,0.2,0.4,0.1,0.9c-0.2,1.5-61.5,239.3-61.7,239.5C240.6,302.5,186.5,288.7,120.5,271.7z M174.9,158c3.2-12.6,5.9-23.1,6-23.4c0.1-0.5-2.3-1.2-23.2-6.6c-12.8-3.3-23.5-5.9-23.6-5.8c-0.3,0.3-12.1,46.6-12,46.7c0.2,0.2,46.7,12.2,46.8,12.1C168.9,180.9,171.6,170.6,174.9,158L174.9,158z"/></svg>`,
    lastfm: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.36 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96z"/></svg>`,
    discord: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6548-.2476-1.2809-.5495-1.872-.8924a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1924.3718-.2914a.0743.0743 0 01.0771-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-.8286 0-1.5-1.0368-1.5-2.3129 0-1.276.6586-2.3128 1.5-2.3128.8414 0 1.5108 1.0457 1.5 2.3129 0 1.276-.6586 2.3128-1.5 2.3128zm7.9748 0c-.8286 0-1.5-1.0368-1.5-2.3129 0-1.276.6586-2.3128 1.5-2.3128.8414 0 1.5108 1.0457 1.5 2.3129 0 1.276-.6586 2.3128-1.5 2.3128z"/></svg>`
};

// Render social links
function renderSocialLinks() {
    const grid = document.getElementById('social-grid');
    if (!grid) return;

    grid.innerHTML = SOCIAL_LINKS.map(link => `
        <a href="${escapeHtml(link.url)}" class="social-link ${escapeHtml(link.icon)}" target="_blank" rel="noopener noreferrer" style="--hover-color: ${link.hoverColor}">
            ${SOCIAL_ICONS[link.icon] || ''}
            ${escapeHtml(link.name)}
        </a>
    `).join('');
}

// Connect to Lanyard WebSocket
function connectWebSocket() {
    if (ws) {
        ws.close();
    }
    
    ws = new WebSocket('wss://lanyard.cnrad.dev/socket');
    
    ws.onopen = () => {
        console.log('WebSocket connected');
        // Subscribe to user
        ws.send(JSON.stringify({
            op: 2,
            d: { subscribe_to_id: DISCORD_ID }
        }));
    };
    
    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        switch (message.op) {
            case 1: // Hello
                // Start heartbeat
                const interval = message.d.heartbeat_interval;
                startHeartbeat(interval);
                break;
            case 0: // Dispatch
                if (message.t === 'INIT_STATE' || message.t === 'PRESENCE_UPDATE') {
                    updateProfile(message.d);
                }
                break;
        }
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
        console.log('WebSocket disconnected, reconnecting...');
        // Reconnect after 5 seconds
        reconnectTimer = setTimeout(connectWebSocket, 5000);
    };
}

// Heartbeat to keep WebSocket alive
let heartbeatInterval = null;

function startHeartbeat(interval) {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
    
    heartbeatInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ op: 3 }));
        }
    }, interval);
}

// Show error state
function showError() {
    username.textContent = 'Error';
    discriminator.textContent = 'Could not load Discord status';
    activityContainer.innerHTML = '<p class="no-activity">Unable to fetch activity</p>';
}

// Update timer displays periodically
setInterval(() => {
    const activities = activityContainer.querySelectorAll('.activity');
    activities.forEach(activityEl => {
        const timerEl = activityEl.querySelector('.activity-timer');
        if (timerEl && timerEl.textContent.includes('Started')) {
            // This is simplified - in production you'd store the start time
            // and recalculate here
        }
    });
}, 60000); // Update every minute

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    init();
    applyBackground();
    startClock();
    renderSocialLinks();
});

// Apply background image if set
function applyBackground() {
    if (BACKGROUND_IMAGE && BACKGROUND_IMAGE.trim() !== '') {
        document.body.style.backgroundImage = `url('${BACKGROUND_IMAGE}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.style.backgroundRepeat = 'no-repeat';
    }
}

// PST Clock
function startClock() {
    const clockEl = document.getElementById('clock');
    if (!clockEl) return;

    function updateClock() {
        const now = new Date();
        const pstTime = now.toLocaleTimeString('en-US', {
            timeZone: 'America/Los_Angeles',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        const pstDate = now.toLocaleDateString('en-US', {
            timeZone: 'America/Los_Angeles',
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        clockEl.innerHTML = `<span class="clock-time">${pstTime}</span><span class="clock-date">${pstDate}</span><span class="clock-timezone">PST</span>`;
    }

    updateClock();
    setInterval(updateClock, 1000);
}
