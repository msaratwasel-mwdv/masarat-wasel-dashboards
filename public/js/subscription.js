// ===================================
// Subscription Form JavaScript
// ===================================

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('subscriptionForm');

    if (!form) return;

    // Plan selection handling
    window.selectPlan = function (planName) {
        // Remove selected class from all cards
        document.querySelectorAll('.pricing-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Add selected class to clicked card
        const selectedCard = document.querySelector(`[data-plan="${planName}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }

        // Update hidden input
        const planInput = document.getElementById('selectedPlan');
        if (planInput) {
            planInput.value = planName;
        }
    };

    // Form validation
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Get form values
        const formData = {
            username: document.getElementById('username')?.value,
            password: document.getElementById('password')?.value,
            schoolNameArabic: document.getElementById('schoolNameArabic')?.value,
            schoolNameEnglish: document.getElementById('schoolNameEnglish')?.value,
            city: document.getElementById('city')?.value,
            principal: document.getElementById('principal')?.value,
            countryCode: document.getElementById('countryCode')?.value,
            phone: document.getElementById('phone')?.value,
            language: document.getElementById('language')?.value,
            selectedPlan: document.getElementById('selectedPlan')?.value,
            notes: document.getElementById('notes')?.value
        };

        // Validate phone number
        const phoneNumber = formData.phone;
        if (phoneNumber && !window.WasalUtils?.validatePhone(phoneNumber)) {
            alert('Please enter a valid phone number');
            return;
        }

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.innerHTML = '⏳ Processing...';

        // Simulate API call
        setTimeout(() => {
            // Show success message
            const successMessage = document.getElementById('successMessage');
            if (successMessage) {
                successMessage.classList.add('show');

                // Scroll to top to show message
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            // Log form data (in production, send to backend)
            console.log('Subscription Data:', formData);

            // Reset button
            submitButton.disabled = false;
            submitButton.textContent = originalText;

            // Reset form after delay
            setTimeout(() => {
                form.reset();
                if (successMessage) {
                    successMessage.classList.remove('show');
                }
                // Reset to recommended plan
                selectPlan('advanced');
            }, 5000);
        }, 1500);
    });

    // Phone number formatting
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
            // Remove non-numeric characters except + and -
            let value = e.target.value.replace(/[^\d\-\+\s]/g, '');
            e.target.value = value;
        });
    }

    // Password strength indicator (optional enhancement)
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function (e) {
            const password = e.target.value;
            let strength = 0;

            if (password.length >= 8) strength++;
            if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
            if (/\d/.test(password)) strength++;
            if (/[@$!%*?&#]/.test(password)) strength++;

            // You can show a strength indicator here
            // For now, just console log
            const strengthText = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
            console.log('Password strength:', strengthText[strength] || 'Very Weak');
        });
    }
});
