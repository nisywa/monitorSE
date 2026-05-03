import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Alert() {
    const { flash } = usePage().props;
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (flash.success || flash.error) {
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    if (!visible) return null;

    return (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
            flash.success ? 'bg-green-500' : 'bg-red-500'
        }`}>
            {flash.success || flash.error}
        </div>
    );
}