import Modal from './Modal';
import SecondaryButton from './SecondaryButton';
import DangerButton from './DangerButton';
// import { useTranslation } from 'react-i18next';

interface Props {
    show: boolean;
    title: string;
    message: string;
    onClose: () => void;
    onConfirm: () => void;
    processing?: boolean;
}

export default function ConfirmationModal({ show, title, message, onClose, onConfirm, processing = false }: Props) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="sm">
            <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                </div>
                
                <h2 className="text-lg font-bold text-center text-gray-900 dark:text-gray-100">
                    {title}
                </h2>

                <p className="mt-2 text-center text-gray-600 dark:text-gray-400 text-sm">
                    {message}
                </p>

                <div className="mt-6 flex justify-center gap-3">
                    <SecondaryButton onClick={onClose} disabled={processing}>
                        Cancel
                    </SecondaryButton>
                    <DangerButton onClick={onConfirm} disabled={processing} className="bg-red-600 hover:bg-red-700">
                        {processing ? 'Processing...' : 'Delete'}
                    </DangerButton>
                </div>
            </div>
        </Modal>
    );
}
