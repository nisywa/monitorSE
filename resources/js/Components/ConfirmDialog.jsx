import React from 'react';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, isLoading = false }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
                <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Menghapus...' : 'Hapus'}
                    </button>
                </div>
            </div>
        </div>
    );
}
