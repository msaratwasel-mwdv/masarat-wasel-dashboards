module.exports = {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
        './resources/js/**/*.ts',
    ],

    safelist: [
        // DS Navy palette
        { pattern: /bg-\[#0f2044\]/ },
        { pattern: /text-\[#0f2044\]/ },
        { pattern: /border-\[#0f2044\]/ },
        { pattern: /ring-\[#0f2044\]/ },
        // DS Gold palette
        { pattern: /bg-\[#f5b800\]/ },
        { pattern: /text-\[#f5b800\]/ },
        { pattern: /border-\[#f5b800\]/ },
        { pattern: /ring-\[#f5b800\]/ },
        // DS Dark surfaces
        { pattern: /bg-\[#1a2845\]/ },
        { pattern: /border-\[#243460\]/ },
        // DS light blue text
        { pattern: /text-\[#7ba7e8\]/ },
        { pattern: /text-\[#8a6b00\]/ },
        { pattern: /text-\[#7a5c00\]/ },
        { pattern: /text-\[#b38600\]/ },
        { pattern: /hover:bg-\[#e0a900\]/ },
        { pattern: /hover:bg-\[#162d60\]/ },
    ],

    darkMode: 'class',

    theme: {
        extend: {
            fontFamily: {
                sans: ['Cairo', 'Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                brand: {
                    dark: '#041b3a',      // الكحلي الغامق
                    navy: '#0f172a',      // الكحلي الأغمق
                    yellow: '#facc15',    // الأصفر الذهبي
                    'yellow-light': '#fef3c7',
                    'yellow-dark': '#d97706',
                    gray: {
                        50: '#f8fafc',
                        100: '#f1f5f9',
                        200: '#e2e8f0',
                        300: '#cbd5e1',
                        400: '#94a3b8',
                        500: '#64748b',
                        600: '#475569',
                        700: '#334155',
                        800: '#1e293b',
                        900: '#0f172a',
                    }
                }
            },
            boxShadow: {
                'sidebar': '0 0 40px rgba(0, 0, 0, 0.1)',
                'card': '0 4px 20px rgba(0, 0, 0, 0.08)',
                'card-hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
            },
            animation: {
                'slide-in': 'slideIn 0.3s ease-out',
                'fade-in': 'fadeIn 0.2s ease-out',
            },
            keyframes: {
                slideIn: {
                    '0%': { transform: 'translateX(-20px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                }
            }
        },
    },

    plugins: [
        require('@tailwindcss/forms'),
    ],
};
