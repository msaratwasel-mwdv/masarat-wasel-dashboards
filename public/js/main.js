// ===================================
// Main JavaScript - Global Utilities
// ===================================

// Theme Toggle Functionality
let currentTheme = localStorage.getItem('theme') || 'light';

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    updateTheme();
}

function updateTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    const themeBtn = document.querySelector('.theme-toggle');
    if (themeBtn) {
        // Clear previous content
        themeBtn.innerHTML = '';
        const icon = document.createElement('i');
        icon.className = currentTheme === 'light' ? 'ph ph-moon' : 'ph ph-sun';
        icon.style.fontSize = '24px';
        themeBtn.appendChild(icon);

        themeBtn.setAttribute('aria-label', currentTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode');
    }
}

// Language Toggle Logic Removed - Handled by separate HTML files

// Smooth Scroll Utility
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Animation on Scroll
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fadeIn');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with animation classes
    document.querySelectorAll('.feature-card, .service-card').forEach(el => {
        observer.observe(el);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    // Apply saved theme preference
    updateTheme();

    // Theme toggle button event listener
    const themeBtn = document.querySelector('.theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }

    // Initialize scroll animations
    initScrollAnimations();

    // Mobile Menu Toggle Listener
    const mobileMenuBtn = document.querySelector('.hide-desktop');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }

    // Add smooth scroll to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            if (targetId) {
                smoothScrollTo(targetId);
            }
        });
    });
});

// Form Validation Utility
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\d\s\-\+\(\)]+$/;
    return re.test(phone) && phone.replace(/\D/g, '').length >= 7;
}

// Show/Hide Password
function togglePasswordVisibility(inputId, buttonElement) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        buttonElement.textContent = '🙈';
    } else {
        input.type = 'password';
        buttonElement.textContent = '👁️';
    }
}

// Loading State Helper
function setLoadingState(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.innerHTML = '<span style="display: inline-block; animation: pulse 1s infinite;">⏳ Loading...</span>';
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Submit';
    }
}

// Show Success Message
function showSuccessMessage(message, duration = 5000) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message show';
    messageDiv.textContent = message;
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.right = '20px';
    messageDiv.style.zIndex = '9999';
    messageDiv.style.maxWidth = '400px';

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, duration);
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    const nav = document.querySelector('.navbar-nav');
    const toggleBtn = document.querySelector('.hide-desktop');

    if (nav) {
        nav.classList.toggle('active');
        const isExpanded = nav.classList.contains('active');
        toggleBtn.setAttribute('aria-expanded', isExpanded);

        // Prevent body scroll when menu is open
        document.body.style.overflow = isExpanded ? 'hidden' : '';
    }
}

// Close mobile menu when clicking a link
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link, .btn-primary');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const nav = document.querySelector('.navbar-nav');
            if (nav && nav.classList.contains('active')) {
                toggleMobileMenu();
            }
        });
    });
});

// Export for use in other scripts
window.WasalUtils = {
    toggleTheme,
    toggleMobileMenu,
    smoothScrollTo,
    validateEmail,
    validatePhone,
    togglePasswordVisibility,
    setLoadingState,
    showSuccessMessage
};
