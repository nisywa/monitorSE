import React from 'react';
import ReactDOM from 'react-dom/client';
import '../css/app.css';

function App() {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <h1 className="text-3xl font-bold text-blue-600">
                Monitoring App - Berhasil!
            </h1>
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);