import React from "react";

// تعريف أنواع الخصائص (Props) لضمان الدعم الكامل لـ TypeScript
interface OmaniRialProps {
  size?: number | string; // حجم الشعار (الافتراضي 24)
  color?: string; // لون الشعار (الافتراضي لون النص المحيط)
  className?: string; // لإضافة كلاسات Tailwind أو CSS خارجية
}

const OmaniRial: React.FC<OmaniRialProps> = ({
  size = "1em",
  color = "currentColor",
  className = "inline-block align-middle",
}) => {
  return (
    <svg
      id="OmaniRial_Symbol"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 2736.46 843.47"
      width="auto"
      height={size}
      className={className}
      style={{
        flexShrink: 0,
      }}
    >
      <g fill={color}>
        {/* مسارات الرمز (Paths) مستخرجة من ملفك الأصلي */}
        <path d="M1763.68,442.78l45.71-82.79,156.27-.37c-1.56-58.06,20.14-128.93,58.17-173.5,46.34-54.3,115.4-27.63,161.54,11.98,5.82,4.99,22.82,20.21,22.58,26.93l-30.86,117.94c-36.47-40.56-83.3-85.47-143.16-75.47-11.27,1.88-26.48,12.6-32.28,22.36-14.43,24.25,15.49,53.68,31.72,69.75h437.78l-46.1,83.16h-309.95c13.29,11.36,32.13,21.87,48.28,28.94,8.46,3.7,40.8,16.2,47.95,16.2h188.69l-46.1,83.16h-661.54l46.33-83.16h291.08l-33.27-45.15h-232.86Z" />
      </g>
    </svg>
  );
};

export default OmaniRial;
