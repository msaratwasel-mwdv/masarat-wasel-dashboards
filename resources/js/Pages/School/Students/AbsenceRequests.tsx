import React, { useState } from "react";
import SchoolAuthenticatedLayout from "@/Layouts/SchoolAuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import useTranslation from "@/hooks/useTranslation";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";

interface Student {
    id: number;
    full_name: string;
}

interface Guardian {
    id: number;
    name: string;
}

interface AbsenceRequest {
    id: number;
    student_id: number;
    guardian_id: number;
    date: string;
    type: string;
    reason: string;
    status: string;
    rejection_reason?: string;
    student: Student;
    guardian: Guardian;
}

interface Props {
    auth: { user: any };
    absenceRequests: {
        data: AbsenceRequest[];
        links: any;
    };
}

export default function AbsenceRequests({ auth, absenceRequests }: Props) {
    const { t } = useTranslation();
    const [processingRequest, setProcessingRequest] = useState<AbsenceRequest | null>(null);
    const [action, setAction] = useState<'approve' | 'reject' | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const openProcessModal = (request: AbsenceRequest, type: 'approve' | 'reject') => {
        setProcessingRequest(request);
        setAction(type);
        setRejectionReason("");
    };

    const closeProcessModal = () => {
        setProcessingRequest(null);
        setAction(null);
    };

    const handleProcess = () => {
        if (!processingRequest) return;

        router.post(route("school.absence-requests.process", processingRequest.id), {
            status: action === 'approve' ? 'approved' : 'rejected',
            rejection_reason: rejectionReason,
        }, {
            onSuccess: () => closeProcessModal(),
        });
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'morning': return t('Morning Only');
            case 'afternoon': return t('Afternoon Only');
            case 'full_day': return t('Full Day');
            default: return type;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="px-3 py-1 text-xs font-bold text-green-700 bg-green-100 rounded-full">{t('Approved')}</span>;
            case 'rejected':
                return <span className="px-3 py-1 text-xs font-bold text-red-700 bg-red-100 rounded-full">{t('Rejected')}</span>;
            default:
                return <span className="px-3 py-1 text-xs font-bold text-orange-700 bg-orange-100 rounded-full">{t('Pending')}</span>;
        }
    };

    return (
        <SchoolAuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-3xl font-extrabold text-[#0e7490] dark:text-cyan-400">
                    {t("Absence Requests")}
                </h2>
            }
        >
            <Head title={t("Absence Requests")} />

            <div className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="p-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-[30px]">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-[#0e7490] text-white rounded-[20px] shadow-sm">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-[#0e7490] dark:text-cyan-400">
                                {t("Manage Absence Requests")}
                            </h3>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {t("Review and process student absence requests submitted by guardians.")}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-gray-100 dark:border-gray-700 rounded-[20px]">
                        <table className="min-w-full text-start">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b-2 border-gray-200 dark:border-gray-600">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">{t("Student")}</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">{t("Guardian")}</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">{t("Date")}</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">{t("Type")}</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">{t("Reason")}</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-start">{t("Status")}</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[#0e7490] dark:text-cyan-400 uppercase text-end">{t("Actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {absenceRequests.data.length > 0 ? (
                                    absenceRequests.data.map((request) => (
                                        <tr key={request.id} className="transition-colors hover:bg-cyan-50 dark:hover:bg-cyan-900/10">
                                            <td className="px-6 py-4 text-sm font-bold text-gray-800 dark:text-white">{request.student.full_name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{request.guardian.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-mono">{request.date}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{getTypeLabel(request.type)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" title={request.reason}>{request.reason}</td>
                                            <td className="px-6 py-4 text-sm">{getStatusBadge(request.status)}</td>
                                            <td className="px-6 py-4 text-end">
                                                {request.status === 'pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => openProcessModal(request, 'approve')}
                                                            className="px-4 py-2 text-white bg-green-600 rounded-xl hover:bg-green-700 transition-all font-bold text-sm shadow-sm"
                                                        >
                                                            {t('Approve')}
                                                        </button>
                                                        <button
                                                            onClick={() => openProcessModal(request, 'reject')}
                                                            className="px-4 py-2 text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all font-bold text-sm shadow-sm"
                                                        >
                                                            {t('Reject')}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-center text-gray-400">{t("No absence requests found")}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal show={!!processingRequest} onClose={closeProcessModal}>
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-4 text-[#0e7490] dark:text-cyan-400">
                        {action === 'approve' ? t('Approve Request') : t('Reject Request')}
                    </h2>
                    <p className="mb-4 text-gray-600 dark:text-gray-400">
                        {t('Are you sure you want to ')} {action === 'approve' ? t('approve') : t('reject')} {t(' the absence request for ')} <strong>{processingRequest?.student.full_name}</strong>?
                    </p>

                    {action === 'reject' && (
                        <div className="mb-4">
                            <InputLabel value={t('Rejection Reason')} />
                            <TextInput
                                className="w-full mt-1"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder={t('Enter reason for rejection...')}
                                required
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton onClick={closeProcessModal}>{t('Cancel')}</SecondaryButton>
                        <PrimaryButton 
                            onClick={handleProcess}
                            className={action === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                        >
                            {action === 'approve' ? t('Approve') : t('Reject')}
                        </PrimaryButton>
                    </div>
                </div>
            </Modal>
        </SchoolAuthenticatedLayout>
    );
}
