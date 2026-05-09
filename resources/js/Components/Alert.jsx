import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Alert({ type, message }) {
    const { flash } = usePage().props;
    const [visible, setVisible] = useState(false);

    // Support both props dan flash message
    const displayMessage = message || flash?.success || flash?.error;
    const displayType = type || (flash?.success ? 'success' : 'error');

    useEffect(() => {
        if (displayMessage) {
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [displayMessage]);

    if (!visible || !displayMessage) return null;

    const bgColor = displayType === 'success' ? 'bg-green-500' : 'bg-red-500';
    const icon = displayType === 'success' 
        ? '✓' 
        : '✕';

    return (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all flex items-center gap-3 ${bgColor}`}>
            <span className="text-lg">{icon}</span>
            <span>{displayMessage}</span>
        </div>
    );
}