// Tab Switching
let currentTab = 'discord';

function switchTab(tab) {
    if (currentTab === tab) return;
    currentTab = tab;

    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('.nav-link');

    // Remove active class from all tabs and pages
    navLinks.forEach(el => el.classList.remove('active'));
    pages.forEach(el => {
        el.classList.remove('active');
        el.classList.remove('slide-in-left', 'slide-in-right', 'slide-in-scale');
    });

    // Add active class to selected tab and page
    document.getElementById(`tab-${tab}`).classList.add('active');
    const newPage = document.getElementById(`page-${tab}`);
    newPage.classList.add('active');

    // Direction-based animation
    const tabOrder = ['discord', 'music', 'about'];
    const currentIndex = tabOrder.indexOf(tab === 'discord' ? 'music' : 'discord');
    const newIndex = tabOrder.indexOf(tab);

    if (tab === 'about') {
        newPage.classList.add('slide-in-scale');
    } else if (newIndex > currentIndex) {
        newPage.classList.add('slide-in-right');
    } else {
        newPage.classList.add('slide-in-left');
    }

    // Stagger card animations
    const cards = newPage.querySelectorAll('.card');
    cards.forEach((card, i) => {
        card.classList.remove('animate-in');
        void card.offsetWidth; // Force reflow
        card.classList.add('animate-in');
    });
}
