// About Me - loads from about-me.json
async function loadAboutMe() {
    try {
        const response = await fetch('/about-me.json');
        const data = await response.json();
        renderAboutMe(data);
    } catch (error) {
        console.error('Error loading about me:', error);
        document.getElementById('about-me-container').innerHTML = '<p class="no-activity">Could not load about me</p>';
    }
}

function renderAboutMe(data) {
    const container = document.getElementById('about-me-container');
    if (!container) return;

    let html = '';

    // Intro section
    html += `<div class="about-me-intro"><p>${escapeHtml(data.intro)}</p></div>`;

    // Sections
    html += '<div class="about-me-sections">';

    data.sections.forEach(section => {
        const iconSvg = getIcon(section.icon);
        html += `
            <div class="about-section">
                <h3>${iconSvg} ${escapeHtml(section.title)}</h3>
        `;

        if (section.type === 'text') {
            html += `<p>${escapeHtml(section.content)}</p>`;
        } else if (section.type === 'list') {
            html += '<ul>';
            section.items.forEach(item => {
                html += `<li>${escapeHtml(item)}</li>`;
            });
            html += '</ul>';
        } else if (section.type === 'html') {
            // Raw HTML if you need custom formatting
            html += section.content;
        }

        html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
}

function getIcon(name) {
    const icons = {
        check: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
        code: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>`,
        star: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
        mail: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`,
        music: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`,
        gamepad: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>`,
        link: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`,
    };
    return icons[name] || icons.link;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load when DOM is ready, or immediately if already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAboutMe);
} else {
    loadAboutMe();
}

