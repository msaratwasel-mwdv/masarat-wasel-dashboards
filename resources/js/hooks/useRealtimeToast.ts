import { toast } from 'react-toastify';
import useTranslation from '@/hooks/useTranslation';

// We map event types to sound effects
/* const sounds = {
    emergency: new Audio('/sounds/emergency.mp3'),
    notification: new Audio('/sounds/notification.mp3'),
    success: new Audio('/sounds/success.mp3')
}; */

export function useRealtimeToast() {
    const { isRtl } = useTranslation();

    const notifyEvent = (type: 'emergency' | 'notification' | 'bus_request' | 'trip_update', title: string, message: string) => {
        // Play sound if applicable
        if (type === 'emergency') {
            // sounds.emergency.play().catch(e => console.log('Audio play blocked:', e));
            toast.error(`${title}\n${message}`, {
                position: isRtl ? "top-left" : "top-right",
                autoClose: false, // Emergencies should stay until closed
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "colored",
            });
        } else if (type === 'bus_request') {
            // sounds.notification.play().catch(e => console.log('Audio play blocked:', e));
            toast.info(`${title}\n${message}`, {
                position: isRtl ? "top-left" : "top-right",
                autoClose: 5000,
            });
        } else if (type === 'notification') {
            toast(`${title}\n${message}`, {
                position: isRtl ? "top-left" : "top-right",
                autoClose: 3000,
            });
        } else {
            toast.success(`${title}\n${message}`, {
                position: isRtl ? "top-left" : "top-right",
                autoClose: 3000,
            });
        }
    };

    return { notifyEvent };
}
