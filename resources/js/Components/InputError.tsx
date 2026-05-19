import { HTMLAttributes } from "react";
import useTranslation from "@/hooks/useTranslation";

export default function InputError({
  message,
  className = "",
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
  const { lang } = useTranslation();
  const isAr = lang === "ar";

  const translateErrorMessage = (msg: string | undefined): string => {
    if (!msg) return "";
    
    const trimmed = msg.trim();
    
    const arMap: Record<string, string> = {
      "The first name ar field is required.": "الاسم الأول (بالعربية) مطلوب.",
      "The last name ar field is required.": "الاسم الأخير (بالعربية) مطلوب.",
      "The first name en field is required.": "الاسم الأول (بالإنجليزية) مطلوب.",
      "The last name en field is required.": "الاسم الأخير (بالإنجليزية) مطلوب.",
      "The first name ar field is required when first name en is not present.": "الاسم الأول باللغة العربية مطلوب في حال غياب الاسم بالإنجليزية.",
      "The last name ar field is required when first name ar is present.": "الاسم الأخير باللغة العربية مطلوب عند إدخال الاسم الأول.",
      "The first name en field is required when first name ar is not present.": "الاسم الأول باللغة الإنجليزية مطلوب في حال غياب الاسم بالعربية.",
      "The last name en field is required when first name en is present.": "الاسم الأخير باللغة الإنجليزية مطلوب عند إدخال الاسم الأول.",
      "The national id field is required.": "الرقم المدني / الإقامة مطلوب.",
      "The national id must be a number.": "يجب أن يكون الرقم المدني رقماً.",
      "The national id has already been taken.": "الرقم المدني مسجل مسبقاً في النظام.",
      "The phone field is required.": "رقم الجوال مطلوب.",
      "The phone has already been taken.": "رقم الجوال مسجل مسبقاً في النظام.",
      "The email field is required.": "البريد الإلكتروني مطلوب.",
      "The email has already been taken.": "البريد الإلكتروني مسجل مسبقاً في النظام.",
      "The license number field is required.": "رقم الرخصة مطلوب.",
      "The license number has already been taken.": "رقم الرخصة مسجل مسبقاً في النظام.",
      "The license expiry date field is required.": "تاريخ انتهاء الرخصة مطلوب.",
      "The license expiry date must be a date after today.": "تاريخ انتهاء الرخصة يجب أن يكون في المستقبل.",
    };

    const enMap: Record<string, string> = {
      "The first name ar field is required.": "First Name (Arabic) is required.",
      "The last name ar field is required.": "Last Name (Arabic) is required.",
      "The first name en field is required.": "First Name (English) is required.",
      "The last name en field is required.": "Last Name (English) is required.",
      "The first name ar field is required when first name en is not present.": "Arabic name is required when English is empty.",
      "The last name ar field is required when first name ar is present.": "Arabic last name is required when first name is filled.",
      "The first name en field is required when first name ar is not present.": "English name is required when Arabic is empty.",
      "The last name en field is required when first name en is present.": "English last name is required when first name is filled.",
      "The national id field is required.": "Civil ID / Iqama is required.",
      "The national id must be a number.": "Civil ID must be numeric.",
      "The national id has already been taken.": "This Civil ID is already registered.",
      "The phone field is required.": "Phone number is required.",
      "The phone has already been taken.": "This phone number is already registered.",
      "The email field is required.": "Email is required.",
      "The email has already been taken.": "This email is already registered.",
      "The license number field is required.": "License number is required.",
      "The license number has already been taken.": "This license number is already registered.",
      "The license expiry date field is required.": "License expiry date is required.",
      "The license expiry date must be a date after today.": "The license expiry date must be a date after today.",
    };

    if (isAr) {
      return arMap[trimmed] || trimmed;
    } else {
      return enMap[trimmed] || trimmed;
    }
  };

  const translatedMessage = translateErrorMessage(message);

  return message ? (
    <p
      {...props}
      className={"text-[10px] font-bold text-rose-500 mt-1 dark:text-rose-400 " + className}
    >
      {translatedMessage}
    </p>
  ) : null;
}
