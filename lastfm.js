// Last.fm API Integration
const LAST_FM_USERNAME = 'indifrog';

// DOM Elements
const nowPlayingTitle = document.getElementById('now-playing-title');
const nowPlayingAlbum = document.getElementById('now-playing-album');
const trackName = document.getElementById('track-name');
const trackArtist = document.getElementById('track-artist');
const trackAlbum = document.getElementById('track-album');
const scrobbleCount = document.getElementById('scrobble-count');
const recentTracksList = document.getElementById('recent-tracks-list');
const topArtistsList = document.getElementById('top-artists-list');

// Initialize
async function initLastFM() {
    try {
        await loadNowPlaying();
        await loadRecentTracks();
        await loadTopArtists();
        
        // Refresh every 30 seconds
        setInterval(async () => {
            await loadNowPlaying();
            await loadRecentTracks();
        }, 30000);
    } catch (error) {
        console.error('Error initializing Last.fm:', error);
        showLastFMError();
    }
}

// Fetch from Last.fm API via backend proxy
async function lastFMFetch(method, params = {}) {
    const url = new URL('/api/lastfm', window.location.origin);
    url.searchParams.set('method', method);
    url.searchParams.set('user', LAST_FM_USERNAME);

    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`Last.fm API error: ${response.status}`);
    }
    const data = await response.json();
    
    if (data.error) {
        throw new Error(`Last.fm API Error ${data.error}: ${data.message}`);
    }
    
    return data;
}

// Load now playing track
async function loadNowPlaying() {
    try {
        const data = await lastFMFetch('user.getrecenttracks', { limit: 1 });
        const recentTracks = data.recenttracks?.track;

        if (!recentTracks || recentTracks.length === 0) {
            showNoTracks();
            return;
        }

        const track = recentTracks[0];
        const isNowPlaying = track['@attr'] && track['@attr'].nowplaying;

        // Update UI
        nowPlayingTitle.textContent = isNowPlaying ? 'Now Playing' : 'Last Played';

        trackName.textContent = track.name || 'Unknown Track';
        trackArtist.textContent = track.artist?.['#text'] || 'Unknown Artist';
        trackAlbum.textContent = track.album?.['#text'] || 'Unknown Album';

        // Album art
        const images = track.image || [];
        const albumArt = images.find(img => img.size === 'extralarge') ||
                        images.find(img => img.size === 'large') ||
                        images[images.length - 1];

        if (albumArt && albumArt['#text']) {
            nowPlayingAlbum.src = albumArt['#text'];
        } else {
            nowPlayingAlbum.src = 'https://via.placeholder.com/200x200/1e1f22/949ba4?text=No+Art';
        }

        // Scrobble count
        await loadScrobbleCount(track.name, track.artist?.['#text']);

    } catch (error) {
        console.error('Error loading now playing:', error);
        showNoTracks();
    }
}

// Load scrobble count for a track
async function loadScrobbleCount(trackName, artistName) {
    try {
        const data = await lastFMFetch('track.getinfo', {
            track: trackName,
            artist: artistName,
            username: LAST_FM_USERNAME
        });
        
        if (data.track && data.track.userplaycount) {
            scrobbleCount.textContent = `${data.track.userplaycount.toLocaleString()} scrobbles`;
        } else {
            scrobbleCount.textContent = '0 scrobbles';
        }
    } catch (error) {
        scrobbleCount.textContent = '0 scrobbles';
    }
}

// Load recent tracks
async function loadRecentTracks() {
    try {
        const data = await lastFMFetch('user.getrecenttracks', { limit: 10 });
        const recentTracks = data.recenttracks?.track;

        if (!recentTracks) {
            recentTracksList.innerHTML = '<p class="no-activity">No tracks found</p>';
            return;
        }

        recentTracksList.innerHTML = '';

        recentTracks.forEach((track, index) => {
            if (index === 0) return; // Skip first track (shown in now playing)

            const trackElement = createTrackElement(track);
            recentTracksList.appendChild(trackElement);
        });

        if (recentTracksList.children.length === 0) {
            recentTracksList.innerHTML = '<p class="no-activity">No recent tracks</p>';
        }

    } catch (error) {
        console.error('Error loading recent tracks:', error);
        recentTracksList.innerHTML = '<p class="no-activity">Could not load tracks</p>';
    }
}

// Create track element
function createTrackElement(track) {
    const div = document.createElement('div');
    div.className = 'track-item';

    const albumArt = track.image.find(img => img.size === 'large') ||
                    track.image[track.image.length - 1];

    const date = new Date(track.date?.uts * 1000 || Date.now());
    const timeAgo = getTimeAgo(date);

    // Build Last.fm URL for the track
    const trackUrl = `https://www.last.fm/music/${encodeURIComponent(track.artist['#text'])}/_/${encodeURIComponent(track.name)}`;

    div.innerHTML = `
        <a href="${trackUrl}" target="_blank" class="track-item-link">
            <img src="${albumArt['#text'] || 'https://via.placeholder.com/64x64/1e1f22/949ba4?text=?'}"
                 alt="${track.album?.name || 'Album'}"
                 class="track-item-album">
            <div class="track-item-info">
                <div class="track-item-name">${track.name || 'Unknown Track'}</div>
                <div class="track-item-artist">${track.artist['#text'] || 'Unknown Artist'}</div>
                <div class="track-item-album-name">${track.album?.name || 'Unknown Album'}</div>
            </div>
        </a>
        <div class="track-item-time">${timeAgo}</div>
    `;

    return div;
}

// Load top artists
async function loadTopArtists() {
    try {
        const data = await lastFMFetch('user.gettopartists', { period: '1month', limit: 8 });
        const artists = data.topartists?.artist;

        if (!artists || artists.length === 0) {
            topArtistsList.innerHTML = '<p class="no-activity">No artists found</p>';
            return;
        }

        topArtistsList.innerHTML = '';

        artists.forEach(artist => {
            const artistElement = createArtistElement(artist);
            topArtistsList.appendChild(artistElement);
        });

    } catch (error) {
        console.error('Error loading top artists:', error);
        topArtistsList.innerHTML = '<p class="no-activity">Could not load artists</p>';
    }
}

// Create artist element
function createArtistElement(artist) {
    const div = document.createElement('div');
    div.className = 'artist-item';
    
    div.innerHTML = `
        <img src="${artist.image[0]?.['#text'] || 'https://via.placeholder.com/64x64/1e1f22/949ba4?text=?'}" 
             alt="${artist.name}" 
             class="artist-item-image">
        <div class="artist-item-info">
            <div class="artist-item-name">${artist.name}</div>
            <div class="artist-item-plays">${artist.playcount.toLocaleString()} plays</div>
        </div>
    `;
    
    return div;
}

// Get time ago string
function getTimeAgo(date) {
    const seconds = Math.floor((Date.now() - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

// Show no tracks state
function showNoTracks() {
    nowPlayingTitle.textContent = 'No Tracks Found';
    trackName.textContent = '-';
    trackArtist.textContent = '-';
    trackAlbum.textContent = '-';
    scrobbleCount.textContent = '0 scrobbles';
    nowPlayingAlbum.src = 'https://via.placeholder.com/200x200/1e1f22/949ba4?text=No+Art';
}

// Show error state
function showLastFMError() {
    nowPlayingTitle.textContent = 'Error';
    trackName.textContent = 'Could not load Last.fm data';
    trackArtist.textContent = 'Check API key and username';
    trackAlbum.textContent = '-';
    scrobbleCount.textContent = '-';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure config is loaded
    setTimeout(initLastFM, 100);
});
