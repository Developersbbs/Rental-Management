import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ScrapItemModal = ({ isOpen, onClose, item, onSubmit }) => {
    const [scrapCategory, setScrapCategory] = useState('');
    const [additionalDetails, setAdditionalDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !item) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Combine category and details
        const finalReason = scrapCategory === 'Other'
            ? additionalDetails
            : `${scrapCategory}${additionalDetails ? ` - ${additionalDetails}` : ''}`;

        try {
            await onSubmit(item._id, finalReason);
            onClose();
        } catch (error) {
            console.error('Error scrapping item:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const scrapCategories = [
        "Damaged Beyond Repair",
        "Lost / Missing",
        "Obsolete / End of Life",
        "Sold / Liquidated",
        "Other"
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[160] p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Confirm Scrap Item
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-300">
                            Are you sure you want to mark item <strong>{item.uniqueIdentifier}</strong> as SCRAPPED?
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                            This action indicates the item is damaged beyond repair or disposed of. It will be removed from available inventory.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Reason Category *
                        </label>
                        <select
                            required
                            value={scrapCategory}
                            onChange={(e) => setScrapCategory(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                        >
                            <option value="" disabled>Select a reason...</option>
                            {scrapCategories.map((category) => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Additional Details {scrapCategory !== 'Other' && '(Optional)'} {scrapCategory === 'Other' && '*'}
                        </label>
                        <textarea
                            required={scrapCategory === 'Other'}
                            value={additionalDetails}
                            onChange={(e) => setAdditionalDetails(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                            rows="3"
                            placeholder={scrapCategory === 'Other' ? "Please specify the reason..." : "Any specific details (e.g., Ticket #123, Accident report...)"}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600 transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center justify-center min-w-[120px] transition-colors shadow-lg shadow-red-500/30"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Processing...' : 'Confirm Scrap'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScrapItemModal;
