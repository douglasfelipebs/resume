// ============================================
// Profile Picture Handling
// ============================================

const heroImage = document.getElementById('heroImage');
const heroImagePlaceholder = document.getElementById('heroImagePlaceholder');

if (heroImage && heroImagePlaceholder) {
    // Show placeholder if image fails to load
    heroImage.onerror = () => {
        heroImage.style.display = 'none';
        heroImagePlaceholder.style.display = 'flex';
    };
    
    // Ensure image is visible if it loads successfully
    heroImage.onload = () => {
        heroImage.style.display = 'block';
        heroImagePlaceholder.style.display = 'none';
    };
}

// ============================================
// Navigation Functionality
// ============================================

const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

// Mobile menu toggle
navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// Navbar scroll effect
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

// Active navigation link highlighting.
// Home follows the section in view. Other pages keep one item selected.
const updateActiveNav = () => {
    const page = document.body.dataset.page || 'home';

    if (page !== 'home') {
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.nav === page);
        });
        return;
    }

    const spySections = Array.from(document.querySelectorAll('#work, #demos, #contact'));
    let current = '';
    const scrollPosition = window.pageYOffset + 150;

    spySections.forEach((section, index) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        const isLast = index === spySections.length - 1;

        if (scrollPosition >= sectionTop && (isLast || scrollPosition < sectionTop + sectionHeight)) {
            current = section.id;
        }
    });

    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
};

window.addEventListener('scroll', updateActiveNav);
updateActiveNav(); // Initial call

// Smooth scrolling for navigation links (only for internal links)
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // Only prevent default for internal links (starting with #)
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const targetSection = document.querySelector(href);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }
        // External links will work normally
    });
});

// ============================================
// Scroll Animation (Fade In)
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Optional: Unobserve after animation to improve performance
            // observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all elements with fade-in class
document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
});

// ============================================
// Hero Scroll Indicator Click
// ============================================

const scrollIndicator = document.querySelector('.scroll-indicator');
if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
        const aboutSection = document.querySelector('#work') || document.querySelector('#about');
        if (aboutSection) {
            const offsetTop = aboutSection.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
}

// ============================================
// Performance Optimization
// ============================================

// Throttle scroll events
let ticking = false;

function onScroll() {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            updateActiveNav();
            ticking = false;
        });
        ticking = true;
    }
}

window.addEventListener('scroll', onScroll, { passive: true });

// ============================================
// Keyboard Navigation
// ============================================

// ESC key to close mobile menu
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    }
});

// ============================================
// Console Message
// ============================================

console.log('%c👋 Hello! Thanks for checking out my portfolio.', 'color: #00ff88; font-size: 16px; font-weight: bold;');
console.log('%cBuilt with vanilla HTML, CSS, and JavaScript.', 'color: #00ff88; font-size: 12px;');

