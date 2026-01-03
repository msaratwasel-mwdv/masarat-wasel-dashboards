import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    darkMode: 'class',

    theme: {
        extend: {
            fontFamily: {
                sans: ['Cairo', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // نفس ألوان EduTrack
                brand: {
                    dark: '#13395e',      // الكحلي الغامق للقائمة الجانبية
                    primary: '#1e293b',   // درجة أفتح قليلاً
                    yellow: '#facc15',    // الأصفر الذهبي
                    light: '#f8fafc',     // خلفية الصفحة الفاتحة جداً
                    gray: '#64748b',      // للنصوص الثانوية
                }
            }
        },
    },

    plugins: [forms],
};
