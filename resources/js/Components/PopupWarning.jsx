import { useState, useEffect } from 'react';

export default function PopupWarning({ show, title, message, onClose, type = 'warning' }) {
    const [visible, setVisible] = useState(show);

    useEffect(() => {
        setVisible(show);
    }, [show]);

    const handleClose = () => {
        setVisible(false);
        onClose?.();
    };

    if (!visible) return null;

    const bgColor = {
        warning: 'bg-yellow-50 border-yellow-200',
        error: 'bg-red-50 border-red-200',
        success: 'bg-green-50 border-green-200',
        info: 'bg-blue-50 border-blue-200',
    }[type];

    const iconBgColor = {
        warning: 'bg-yellow-100',
        error: 'bg-red-100',
        success: 'bg-green-100',
        info: 'bg-blue-100',
    }[type];

    const iconColor = {
        warning: 'text-yellow-600',
        error: 'text-red-600',
        success: 'text-green-600',
        info: 'text-blue-600',
    }[type];

    const buttonColor = {
        warning: 'bg-yellow-600 hover:bg-yellow-700',
        error: 'bg-red-600 hover:bg-red-700',
        success: 'bg-green-600 hover:bg-green-700',
        info: 'bg-blue-600 hover:bg-blue-700',
    }[type];

    const icons = {
        warning: (
            <svg className={`w-12 h-12 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
        ),
        error: (
            <svg className={`w-12 h-12 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
        ),
        success: (
            <svg className={`w-12 h-12 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
        ),
        info: (
            <svg className={`w-12 h-12 ${iconColor}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
        ),
    }[type];

    return (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
            <div className={`bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden border ${bgColor}`}>
                {/* Header dengan Close Button */}
                <div className="flex items-start justify-between p-6 pb-4">
                    <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`${iconBgColor} rounded-full p-3 flex-shrink-0`}>
                            {icons}
                        </div>
                        
                        {/* Title */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                        </div>
                    </div>

                    {/* Close Button (X) */}
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors ml-2 flex-shrink-0"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Message */}
                <div className="px-6 pb-6">
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {message}
                    </p>
                </div>

                {/* Footer dengan OK Button */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className={`${buttonColor} text-white font-medium py-2 px-6 rounded-lg transition-colors`}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}
