// ===================================
// Login Form JavaScript
// ===================================

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');

    if (!loginForm) return;

    // Password toggle functionality
    window.togglePassword = function () {
        const passwordInput = document.getElementById('password');
        const toggleButton = document.querySelector('.password-toggle');

        if (!passwordInput || !toggleButton) return;

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleButton.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleButton.textContent = '👁️';
        }
    };

    // Form submission
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Get form values
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        const rememberMe = document.getElementById('rememberMe')?.checked;

        // Basic validation
        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }

        // Validate email format
        if (window.WasalUtils && !window.WasalUtils.validateEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }

        // Show loading state
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.innerHTML = '⏳ Signing in...';

        // Simulate API call
        setTimeout(() => {
            // In production, you would make an actual API call here
            console.log('Login attempt:', {
                email,
                password: '********', // Never log actual passwords
                rememberMe
            });

            // Simulate successful login
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            }

            // Show success message
            alert('Login successful! Redirecting to dashboard...');

            // Reset button
            submitButton.disabled = false;
            submitButton.textContent = originalText;

            // In production, redirect to dashboard
            // window.location.href = 'dashboard.html';
        }, 1500);
    });

    // Load remembered email if exists
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        const emailInput = document.getElementById('email');
        const rememberCheckbox = document.getElementById('rememberMe');

        if (emailInput) emailInput.value = rememberedEmail;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }

    // Helper function to show errors
    function showError(message) {
        // Create or update error message element
        let errorDiv = document.querySelector('.login-error-message');

        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'login-error-message';
            errorDiv.style.cssText = `
                background-color: #fee2e2;
                color: #ef4444;
                padding: 12px 16px;
                border-radius: 8px;
                margin-bottom: 16px;
                font-size: 14px;
                text-align: center;
                animation: fadeIn 0.3s ease-out;
            `;

            const firstFormGroup = loginForm.querySelector('.form-group');
            if (firstFormGroup) {
                loginForm.insertBefore(errorDiv, firstFormGroup);
            }
        }

        errorDiv.textContent = `⚠️ ${message}`;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv) {
                errorDiv.style.opacity = '0';
                setTimeout(() => errorDiv.remove(), 300);
            }
        }, 5000);
    }

    // Enter key handling
    document.getElementById('email')?.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            document.getElementById('password')?.focus();
        }
    });
});
