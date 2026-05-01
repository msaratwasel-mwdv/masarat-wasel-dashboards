// resources/js/Components/GuardianWizard.tsx
import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import useTranslation from "@/hooks/useTranslation";

interface Guardian {
    id: number;
    name: string;
    name_en?: string;
    phone?: string;
    national_id?: string;
    address?: string;
    home_number?: string;
    image?: string;
    email?: string;
}

interface GuardianWizardProps {
    onSearchSubmit: (e: React.FormEvent) => void;
    onCreateSubmit: (e: React.FormEvent) => void;
    searchProcessing: boolean;
    createProcessing: boolean;
    guardianResult?: {
        found: boolean;
        guardian: Guardian | null;
    } | null;
    onStepChange?: (step: 1 | 2 | 3) => void;
}

export const GuardianWizard: React.FC<GuardianWizardProps> = ({
    onSearchSubmit,
    onCreateSubmit,
    searchProcessing,
    createProcessing,
    guardianResult,
    onStepChange,
}) => {
    const { t } = useTranslation();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const guardianSearchForm = useForm({ national_id: "" });
    const guardianCreateForm = useForm({
        name: "",
        name_en: "",
        national_id: "",
        phone: "",
        email: "",
        address: "",
        home_number: "",
        image: null as File | null,
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            guardianCreateForm.setData("image", file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        guardianCreateForm.setData("image", null);
        setPreviewImage(null);
    };

    return (
        <div className="space-y-6">
            {/* Step 1: Search Guardian */}
            {!showCreateForm && (
                <div className="space-y-4">
                    <div className="text-start rtl:text-start">
                        <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                            {t("Search Guardian")}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t("Search by Civil ID to find existing guardian.")}
                        </p>
                    </div>

                    <form onSubmit={onSearchSubmit} className="space-y-4">
                        <div>
                            <InputLabel
                                value={t("Civil ID")}
                                className="mb-2"
                            />
                            <div className="flex gap-3">
                                <TextInput
                                    value={guardianSearchForm.data.national_id}
                                    onChange={(e) =>
                                        guardianSearchForm.setData(
                                            "national_id",
                                            e.target.value
                                        )
                                    }
                                    className="flex-1"
                                    placeholder="10xxxxxxxxx"
                                    required
                                />
                                <PrimaryButton
                                    type="submit"
                                    disabled={searchProcessing}
                                >
                                    {searchProcessing
                                        ? t("Searching...")
                                        : t("Search")}
                                </PrimaryButton>
                            </div>
                        </div>
                    </form>

                    {/* Search Results */}
                    {guardianResult && (
                        <div
                            className={`p-4 rounded-xl border ${
                                guardianResult.found
                                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                                    : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700"
                            }`}
                        >
                            {guardianResult.found && guardianResult.guardian ? (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-green-700 dark:text-green-400">
                                            ✓ {t("Guardian Found")}
                                        </p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            {guardianResult.guardian.name} (
                                            {guardianResult.guardian.phone})
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {t("Civil ID")}:{" "}
                                            {
                                                guardianResult.guardian
                                                    .national_id
                                            }
                                        </p>
                                    </div>
                                    <PrimaryButton
                                        onClick={() => onStepChange?.(3)}
                                    >
                                        {t("Select & Continue")}
                                    </PrimaryButton>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-yellow-700 dark:text-yellow-400">
                                            ⚠️{" "}
                                                {t("Guardian Not Found")}
                                        </p>
                                        <p className="text-sm text-yellow-600 dark:text-yellow-300">
                                                {t("No guardian was found with this national ID. Create a new guardian below")}
                                        </p>
                                    </div>
                                    <PrimaryButton
                                        onClick={() => setShowCreateForm(true)}
                                    >
                                            {t("Create New Guardian")}
                                    </PrimaryButton>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Create Guardian Form */}
            {showCreateForm && (
                <div className="space-y-6">
                    <div className="text-start rtl:text-start">
                        <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
                            {t("Create New Guardian")}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t("Enter supervisor details")}
                        </p>
                    </div>

                    <form onSubmit={onCreateSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* الاسم بالعربي */}
                            <div className="md:col-span-2">
                                <InputLabel
                                    value={t("Guardian Name (Arabic)") + " *"}
                                />
                                <TextInput
                                    value={guardianCreateForm.data.name}
                                    onChange={(e) =>
                                        guardianCreateForm.setData(
                                            "name",
                                            e.target.value
                                        )
                                    }
                                    className="w-full"
                                    required
                                />
                                <InputError
                                    message={guardianCreateForm.errors.name}
                                />
                            </div>

                            {/* الاسم بالإنجليزي */}
                            <div className="md:col-span-2">
                                <InputLabel
                                    value={t("Guardian Name (English)")}
                                />
                                <TextInput
                                    value={guardianCreateForm.data.name_en}
                                    onChange={(e) =>
                                        guardianCreateForm.setData(
                                            "name_en",
                                            e.target.value
                                        )
                                    }
                                    className="w-full"
                                />
                            </div>

                            {/* الرقم المدني */}
                            <div>
                                <InputLabel value={t("Civil ID") + " *"} />
                                <TextInput
                                    value={guardianCreateForm.data.national_id}
                                    onChange={(e) =>
                                        guardianCreateForm.setData(
                                            "national_id",
                                            e.target.value
                                        )
                                    }
                                    className="w-full"
                                    required
                                />
                                <InputError
                                    message={
                                        guardianCreateForm.errors.national_id
                                    }
                                />
                            </div>

                            {/* رقم الهاتف */}
                            <div>
                                <InputLabel value={t("Phone Number") + " *"} />
                                <TextInput
                                    value={guardianCreateForm.data.phone}
                                    onChange={(e) =>
                                        guardianCreateForm.setData(
                                            "phone",
                                            e.target.value
                                        )
                                    }
                                    className="w-full"
                                    required
                                    placeholder="+968XXXXXXXXX"
                                />
                                <InputError
                                    message={guardianCreateForm.errors.phone}
                                />
                            </div>

                            {/* البريد الإلكتروني */}
                            <div className="md:col-span-2">
                                <InputLabel value={t("Email")} />
                                <TextInput
                                    type="email"
                                    value={guardianCreateForm.data.email}
                                    onChange={(e) =>
                                        guardianCreateForm.setData(
                                            "email",
                                            e.target.value
                                        )
                                    }
                                    className="w-full"
                                    placeholder="example@email.com"
                                />
                            </div>

                            {/* العنوان */}
                            <div className="md:col-span-2">
                                <InputLabel value={t("Address")} />
                                <TextInput
                                    value={guardianCreateForm.data.address}
                                    onChange={(e) =>
                                        guardianCreateForm.setData(
                                            "address",
                                            e.target.value
                                        )
                                    }
                                    className="w-full"
                                />
                            </div>

                            {/* رقم المنزل */}
                            <div>
                                <InputLabel value={t("Home Number")} />
                                <TextInput
                                    value={guardianCreateForm.data.home_number}
                                    onChange={(e) =>
                                        guardianCreateForm.setData(
                                            "home_number",
                                            e.target.value
                                        )
                                    }
                                    className="w-full"
                                />
                            </div>

                            {/* صورة ولي الأمر */}
                            <div className="md:col-span-2">
                                <InputLabel value={t("Guardian Photo")} />
                                <div className="relative flex flex-col items-center justify-center gap-4 p-6 transition-colors border-2 border-gray-300 border-dashed cursor-pointer dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400">
                                    {guardianCreateForm.data.image ||
                                    previewImage ? (
                                        <div className="flex items-center w-full gap-4">
                                            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-lg dark:border-gray-700">
                                                <img
                                                    src={
                                                        previewImage ||
                                                        (guardianCreateForm.data
                                                            .image
                                                            ? URL.createObjectURL(
                                                                  guardianCreateForm
                                                                      .data
                                                                      .image
                                                              )
                                                            : "")
                                                    }
                                                    className="object-cover w-full h-full"
                                                        alt={t("Guardian Photo")}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {guardianCreateForm.data
                                                        .image?.name ||
                                                            t("Guardian Photo")}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveImage}
                                                    className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                                >
                                                        {t("Remove")}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-3xl text-gray-400">
                                                📷
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {t("Click to upload guardian photo")}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        PNG, JPG {t("up to 5MB")}
                                                </p>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleImageChange}
                                            />
                                        </>
                                    )}
                                </div>
                                <InputError
                                    message={guardianCreateForm.errors.image}
                                />
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <SecondaryButton
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                            >
                                {t("Back")}
                            </SecondaryButton>
                            <PrimaryButton
                                type="submit"
                                disabled={createProcessing}
                            >
                                {createProcessing
                                    ? t("Saving...")
                                    : t("Create Guardian")}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
