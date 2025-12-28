import { ImgHTMLAttributes } from "react";

export default function ApplicationLogo(
  props: ImgHTMLAttributes<HTMLImageElement>
) {
  return (
    <img
      {...props}
      src="/images/logo-white.png" // تأكد أنك وضعت الصورة هنا
      alt="Wasel Logo"
      className={`object-contain ${props.className}`}
    />
  );
}
