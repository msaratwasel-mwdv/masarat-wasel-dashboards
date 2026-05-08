import { useEffect } from 'react';

/**
 * Hook to safely subscribe to a specific Echo event on a given channel.
 * Gracefully handles cases where window.Echo is not yet initialized.
 */
export function useEchoEvent(
    channelType: 'public' | 'private' | 'presence',
    channelName: string,
    eventName: string,
    callback: (data: any) => void
) {
    useEffect(() => {
        // Only run if Echo is available on the window object
        if (typeof window !== 'undefined' && window.Echo) {
            
            let channel;
            
            if (channelType === 'private') {
                channel = window.Echo.private(channelName);
            } else if (channelType === 'presence') {
                channel = window.Echo.join(channelName);
            } else {
                channel = window.Echo.channel(channelName);
            }

            channel.listen(eventName, (e: any) => {
                console.debug(`[Echo] Event received on ${channelName}: ${eventName}`, e);
                callback(e);
            });

            return () => {
                channel.stopListening(eventName);
            };
        } else {
            console.warn('[Echo] window.Echo is not initialized yet.');
        }
    }, [channelType, channelName, eventName, callback]);
}
