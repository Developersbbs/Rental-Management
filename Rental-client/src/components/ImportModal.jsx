import React, { useState } from 'react';
import { toast } from 'react-toastify';

const ImportModal = ({
    isOpen,
    onClose,
    onImport,
    title = "Import Bulk Inward",
    description = "Columns: Product ID (or Name), Quantity, Purchase Cost, Batch Number, Brand, Model, Condition, Notes",
    sampleData = null,
    fileName = "sample_import.csv"
}) => {
    const [file, setFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const downloadSample = () => {
        if (!sampleData || !sampleData.length) return;

        const headers = Object.keys(sampleData[0]);
        const csvContent = [
            headers.join(','),
            ...sampleData.map(row =>
                headers.map(header => {
                    const value = row[header] === null || row[header] === undefined ? '' : row[header];
                    // Escape quotes and handle commas
                    const cell = typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))
                        ? `"${value.replace(/"/g, '""')}"`
                        : value;
                    return cell;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            toast.error('Please select a spreadsheet file');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setIsLoading(true);
        try {
            await onImport(formData);
            toast.success('Import completed successfully');
            setFile(null); // Reset file input
            onClose();
        } catch (error) {
            console.error('Import error:', error);
            const message = error.response?.data?.message || error.response?.data?.error || error.message || (typeof error === 'string' ? error : 'Import failed');
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {sampleData && (
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={downloadSample}
                                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download Sample Format
                            </button>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Select Spreadsheet File *
                        </label>
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv, .ods, .ots, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/vnd.oasis.opendocument.spreadsheet, text/csv"
                            onChange={handleFileChange}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/40 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/60"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Supported: Excel (.xlsx, .xls), LibreOffice (.ods), and CSV
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 italic">
                            {description}
                        </p>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-md font-semibold transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-semibold transition-colors disabled:bg-blue-300 dark:disabled:bg-blue-800"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Importing...' : 'Import'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ImportModal;
