import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, DollarSign, Save, ArrowLeft, Download, Eye, Printer } from 'lucide-react';
import rentalService from '../../services/rentalService';
import paymentAccountService from '../../services/paymentAccountService';

const RentalReturn = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [rental, setRental] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [downloading, setDownloading] = useState(false);

    const [returnItems, setReturnItems] = useState([]);
    const [billingDetails, setBillingDetails] = useState({
        discountPercent: 0,
        taxPercent: 18,
        paidDueAmount: 0,
        paymentMethod: 'cash',
        paymentAccountId: '',
        isManualOverride: false,
        customizedTotalAmount: 0
    });
    const [billPreview, setBillPreview] = useState(null);
    const [paymentAccounts, setPaymentAccounts] = useState([]);

    useEffect(() => {
        const fetchRental = async () => {
            try {
                const data = await rentalService.getRentalById(id);
                setRental(data);

                // Initialize return items state
                const items = data.items.map(item => ({
                    itemId: item.item._id, // Use the actual ProductItem _id, not the rental item array element _id
                    productName: item.item?.name || item.item?.uniqueIdentifier || 'Unknown Product',
                    returnCondition: 'good', // Default
                    damageCost: 0,
                    damageReason: '', // Added damage reason
                    isReturning: true,
                    accessories: item.accessories ? item.accessories.map(acc => ({
                        accessoryId: acc.accessoryId?._id || acc.accessoryId, // Handle populated or unpopulated
                        name: acc.name,
                        serialNumber: acc.serialNumber,
                        status: 'returned', // Default: returned, missing, damaged
                        damageCost: 0,
                        replacementCost: acc.accessoryId?.replacementCost || 0 // Store replacement cost
                    })) : []
                }));
                setReturnItems(items);
            } catch (err) {
                setError('Failed to load rental details');
            } finally {
                setLoading(false);
            }
        };
        fetchRental();
        fetchPaymentAccounts();
    }, [id]);

    const fetchPaymentAccounts = async () => {
        try {
            const data = await paymentAccountService.getAllPaymentAccounts({ status: 'active' });
            setPaymentAccounts(data.accounts || []);
        } catch (error) {
            console.error('Error fetching payment accounts:', error);
            setPaymentAccounts([]);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...returnItems];
        newItems[index][field] = value;
        setReturnItems(newItems);
    };

    const handleAccessoryChange = (itemIndex, accIndex, field, value) => {
        const newItems = [...returnItems];
        newItems[itemIndex].accessories[accIndex][field] = value;

        // Auto-fill cost if status changes to missing or damaged
        if (field === 'status') {
            const accessory = newItems[itemIndex].accessories[accIndex];
            if ((value === 'missing' || value === 'damaged') && (accessory.damageCost === 0 || accessory.damageCost === '0')) {
                newItems[itemIndex].accessories[accIndex].damageCost = accessory.replacementCost;
            } else if (value === 'returned' || value === 'with_item') {
                newItems[itemIndex].accessories[accIndex].damageCost = 0;
            }
        }

        setReturnItems(newItems);
    };

    const calculateEstimatedTotal = () => {
        if (!rental) return 0;
        let totalRentalCost = 0;
        let totalDamageCost = 0;
        const returningItems = returnItems.filter(i => i.isReturning);

        returningItems.forEach(item => {
            const rentalItem = rental?.items?.find(ri => ri.item._id === item.itemId);
            if (rentalItem) {
                const durationMs = new Date() - new Date(rental.outTime);
                const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
                const durationDays = Math.ceil(durationHours / 24);
                let itemCost = 0;
                if (rentalItem.rentType === 'hourly') {
                    itemCost = durationHours * rentalItem.rentAtTime;
                } else {
                    itemCost = durationDays * rentalItem.rentAtTime;
                }
                totalRentalCost += itemCost;
            }
            totalDamageCost += parseFloat(item.damageCost || 0);
            if (item.accessories && item.accessories.length > 0) {
                item.accessories.forEach(acc => {
                    if (acc.status !== 'with_item' && acc.status !== 'returned') {
                        totalDamageCost += parseFloat(acc.damageCost || 0);
                    }
                });
            }
        });
        const subtotal = totalRentalCost + totalDamageCost;
        const discountAmount = (subtotal * parseFloat(billingDetails.discountPercent || 0)) / 100;
        const amountAfterDiscount = subtotal - discountAmount;
        const taxAmount = (amountAfterDiscount * parseFloat(billingDetails.taxPercent || 0)) / 100;
        return amountAfterDiscount + taxAmount;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const returnData = {
                returnItems: returnItems.filter(i => i.isReturning).map(i => ({
                    itemId: i.itemId,
                    returnCondition: i.returnCondition,
                    damageCost: parseFloat(i.damageCost),
                    damageReason: i.damageReason, // Send damage reason
                    accessories: i.accessories.map(acc => ({
                        accessoryId: acc.accessoryId,
                        status: acc.status,
                        damageCost: parseFloat(acc.damageCost)
                    }))
                })),
                discountPercent: parseFloat(billingDetails.discountPercent),
                taxPercent: parseFloat(billingDetails.taxPercent),
                paidDueAmount: parseFloat(billingDetails.paidDueAmount),
                paymentMethod: billingDetails.paymentMethod,
                paymentAccountId: billingDetails.paymentAccountId || undefined,
                customizedTotalAmount: billingDetails.isManualOverride ? parseFloat(billingDetails.customizedTotalAmount) : undefined
            };

            const result = await rentalService.returnRental(id, returnData);
            setSuccess('Rental returned successfully!');
            setBillPreview(result.bill);

            // Navigate to billing history after short delay to show success message
            setTimeout(() => {
                navigate('/rentals/billing-history');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to process return');
        }
    };

    const handleDownloadPDF = async () => {
        if (!billPreview || !billPreview._id) {
            setError('No bill available to download');
            return;
        }

        try {
            setDownloading(true);
            setError('');

            const blob = await rentalService.downloadInvoice(billPreview._id);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Invoice-${billPreview.billNumber}.pdf`;
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setSuccess('Invoice downloaded successfully!');
        } catch (err) {
            setError(err.message || 'Failed to download invoice');
        } finally {
            setDownloading(false);
        }
    };

    const handlePreviewPDF = async () => {
        if (!billPreview || !billPreview._id) {
            setError('No bill available to preview');
            return;
        }

        try {
            setDownloading(true);
            setError('');

            const blob = await rentalService.downloadInvoice(billPreview._id);
            const url = window.URL.createObjectURL(blob);

            // Open in new tab
            window.open(url, '_blank');

            // Cleanup after a delay to ensure the tab opens
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 100);

            setSuccess('Invoice opened in new tab!');
        } catch (err) {
            setError(err.message || 'Failed to preview invoice');
        } finally {
            setDownloading(false);
        }
    };

    const handlePrintPDF = async () => {
        if (!billPreview || !billPreview._id) {
            setError('No bill available to print');
            return;
        }

        try {
            setDownloading(true);
            setError('');

            const blob = await rentalService.downloadInvoice(billPreview._id);
            const url = window.URL.createObjectURL(blob);

            // Create hidden iframe for printing
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = url;
            document.body.appendChild(iframe);

            iframe.onload = () => {
                iframe.contentWindow.print();

                // Cleanup after print dialog closes
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    window.URL.revokeObjectURL(url);
                }, 1000);
            };

            setSuccess('Print dialog opened!');
        } catch (err) {
            setError(err.message || 'Failed to print invoice');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;
    if (!rental) return <div className="p-6">Rental not found</div>;

    return (
        <div className="p-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
            <button onClick={() => navigate(-1)} className="mb-4 flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </button>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Process Return: {rental.rentalId}</h1>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
            {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Return Items</h2>

                        <div className="space-y-4">
                            {returnItems.map((item, index) => (
                                <div key={item.itemId} className="border p-4 rounded-lg dark:border-slate-600">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-medium text-gray-900 dark:text-white">{item.productName}</h3>
                                            <label className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                <input
                                                    type="checkbox"
                                                    checked={item.isReturning}
                                                    onChange={(e) => handleItemChange(index, 'isReturning', e.target.checked)}
                                                    className="mr-2"
                                                />
                                                Mark as Returning
                                            </label>
                                        </div>
                                    </div>

                                    {item.isReturning && (
                                        <div className="mt-2 space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition</label>
                                                    <select
                                                        value={item.returnCondition}
                                                        onChange={(e) => handleItemChange(index, 'returnCondition', e.target.value)}
                                                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                    >
                                                        <option value="good">Good</option>
                                                        <option value="fair">Fair</option>
                                                        <option value="poor">Poor</option>
                                                        <option value="damaged">Damaged</option>
                                                    </select>
                                                </div>
                                                {item.returnCondition === 'damaged' && (
                                                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Damage Cost (₹)</label>
                                                            <input
                                                                type="number"
                                                                value={item.damageCost}
                                                                onChange={(e) => handleItemChange(index, 'damageCost', e.target.value)}
                                                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Damage Reason</label>
                                                            <input
                                                                type="text"
                                                                value={item.damageReason}
                                                                onChange={(e) => handleItemChange(index, 'damageReason', e.target.value)}
                                                                placeholder="Describe the damage..."
                                                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Accessories Return Section */}
                                            {item.accessories && item.accessories.length > 0 && (
                                                <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded border dark:border-slate-600">
                                                    <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2">Accessories Return</h4>
                                                    <div className="space-y-2">
                                                        {item.accessories.map((acc, accIndex) => (
                                                            <div key={accIndex} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-white dark:bg-slate-800 p-2 rounded border dark:border-slate-600">
                                                                <div className="text-sm">
                                                                    <span className="font-medium text-gray-900 dark:text-white">{acc.name}</span>
                                                                    {acc.serialNumber && <span className="text-xs text-gray-500 dark:text-gray-400 block">{acc.serialNumber}</span>}
                                                                </div>
                                                                <div>
                                                                    <select
                                                                        value={acc.status}
                                                                        onChange={(e) => handleAccessoryChange(index, accIndex, 'status', e.target.value)}
                                                                        className="w-full text-xs p-1 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                                    >
                                                                        <option value="returned">Returned</option>
                                                                        <option value="missing">Missing</option>
                                                                        <option value="damaged">Damaged</option>
                                                                    </select>
                                                                </div>
                                                                {(acc.status === 'missing' || acc.status === 'damaged') && (
                                                                    <div>
                                                                        <input
                                                                            type="number"
                                                                            placeholder="Cost"
                                                                            value={acc.damageCost}
                                                                            onChange={(e) => handleAccessoryChange(index, accIndex, 'damageCost', e.target.value)}
                                                                            className="w-full text-xs p-1 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Summary & Actions */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Billing Details</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={billingDetails.discountPercent}
                                    onChange={(e) => setBillingDetails({ ...billingDetails, discountPercent: e.target.value })}
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={billingDetails.taxPercent}
                                    onChange={(e) => setBillingDetails({ ...billingDetails, taxPercent: e.target.value })}
                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                />
                            </div>

                            <div className="pt-2 border-t dark:border-slate-600">
                                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={billingDetails.isManualOverride}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            let seedAmount = 0;
                                            if (isChecked) {
                                                // Seed with amount after discount (base)
                                                const returningItems = returnItems.filter(i => i.isReturning);
                                                let totalRentalCost = 0;
                                                let totalDamageCost = 0;
                                                returningItems.forEach(item => {
                                                    const rentalItem = rental?.items?.find(ri => ri.item._id === item.itemId);
                                                    if (rentalItem) {
                                                        const durationMs = new Date() - new Date(rental.outTime);
                                                        const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
                                                        const durationDays = Math.ceil(durationHours / 24);
                                                        let itemCost = 0;
                                                        if (rentalItem.rentType === 'hourly') {
                                                            itemCost = durationHours * rentalItem.rentAtTime;
                                                        } else {
                                                            itemCost = durationDays * rentalItem.rentAtTime;
                                                        }
                                                        totalRentalCost += itemCost;
                                                    }
                                                    totalDamageCost += parseFloat(item.damageCost || 0);
                                                    if (item.accessories && item.accessories.length > 0) {
                                                        item.accessories.forEach(acc => {
                                                            if (acc.status !== 'with_item' && acc.status !== 'returned') {
                                                                totalDamageCost += parseFloat(acc.damageCost || 0);
                                                            }
                                                        });
                                                    }
                                                });
                                                const subtotal = totalRentalCost + totalDamageCost;
                                                const discountAmount = (subtotal * parseFloat(billingDetails.discountPercent || 0)) / 100;
                                                seedAmount = (subtotal - discountAmount).toFixed(2);
                                            }

                                            setBillingDetails({
                                                ...billingDetails,
                                                isManualOverride: isChecked,
                                                customizedTotalAmount: isChecked ? seedAmount : 0
                                            });
                                        }}
                                        className="mr-2 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    Enable Manual Amount Override
                                </label>

                                {billingDetails.isManualOverride && (
                                    <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                                        <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 mb-1 uppercase tracking-wider">
                                            Custom Base Amount (Excl. Tax) (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={billingDetails.customizedTotalAmount}
                                            onChange={(e) => setBillingDetails({ ...billingDetails, customizedTotalAmount: e.target.value })}
                                            className="w-full p-2 border-2 border-amber-500 rounded bg-amber-50 dark:bg-amber-900/10 dark:text-white font-bold text-lg"
                                            placeholder="Enter base amount"
                                        />
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 italic">
                                            GST will be calculated and added on top of this amount.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Payment Section */}
                            <div className="border-t pt-4 mt-4 dark:border-slate-600">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Payment Details</h3>

                                {/* Calculate estimated amounts */}
                                {(() => {
                                    const returningItems = returnItems.filter(i => i.isReturning);
                                    let totalRentalCost = 0;
                                    let totalDamageCost = 0;
                                    // Calculate rental item costs
                                    returningItems.forEach(item => {
                                        const rentalItem = rental?.items?.find(ri => ri.item._id === item.itemId);
                                        if (rentalItem) {
                                            const durationMs = new Date() - new Date(rental.outTime);
                                            const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
                                            const durationDays = Math.ceil(durationHours / 24);
                                            let itemCost = 0;
                                            if (rentalItem.rentType === 'hourly') {
                                                itemCost = durationHours * rentalItem.rentAtTime;
                                            } else {
                                                itemCost = durationDays * rentalItem.rentAtTime;
                                            }
                                            totalRentalCost += itemCost;
                                        }
                                        // Item damage cost
                                        totalDamageCost += parseFloat(item.damageCost || 0);
                                        // Accessory damage cost
                                        if (item.accessories && item.accessories.length > 0) {
                                            item.accessories.forEach(acc => {
                                                if (acc.status !== 'with_item' && acc.status !== 'returned') {
                                                    totalDamageCost += parseFloat(acc.damageCost || 0);
                                                }
                                            });
                                        }
                                    });
                                    const subtotal = totalRentalCost + totalDamageCost;
                                    const discountAmount = (subtotal * parseFloat(billingDetails.discountPercent || 0)) / 100;
                                    const amountAfterDiscount = subtotal - discountAmount;
                                    const taxPercent = parseFloat(billingDetails.taxPercent || 0);
                                    const taxAmount = (amountAfterDiscount * taxPercent) / 100;
                                    const calculatedTotal = amountAfterDiscount + taxAmount;

                                    // Treatment: Custom Input is now the BASE (Excl. Tax)
                                    const customBase = parseFloat(billingDetails.customizedTotalAmount) || 0;
                                    const finalTaxAmount = billingDetails.isManualOverride
                                        ? (customBase * taxPercent) / 100
                                        : taxAmount;

                                    const totalAmount = billingDetails.isManualOverride
                                        ? (customBase + finalTaxAmount)
                                        : calculatedTotal;

                                    const dueAmount = Math.max(0, totalAmount - (rental?.advancePayment || 0));
                                    const paidDue = parseFloat(billingDetails.paidDueAmount || 0);
                                    const remainingDue = Math.max(0, dueAmount - paidDue);

                                    // Determine payment status
                                    let paymentStatus = 'pending';
                                    let statusColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
                                    if (remainingDue <= 0) {
                                        paymentStatus = 'paid';
                                        statusColor = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
                                    } else if (paidDue > 0) {
                                        paymentStatus = 'partial';
                                        statusColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
                                    }

                                    return (
                                        <>
                                            <div className="space-y-2 mb-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        {billingDetails.isManualOverride ? 'Custom Base Amount:' : 'Estimated Total:'}
                                                    </span>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        ₹{billingDetails.isManualOverride
                                                            ? (parseFloat(billingDetails.customizedTotalAmount) || 0).toFixed(2)
                                                            : totalAmount.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">GST ({taxPercent}%):</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">₹{finalTaxAmount.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">Advance Paid:</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">₹{rental?.advancePayment || 0}</span>
                                                </div>
                                                <div className="flex justify-between text-sm font-semibold border-t pt-2 dark:border-slate-600">
                                                    <span className="text-gray-700 dark:text-gray-300">Due Amount:</span>
                                                    <span className="text-red-600 dark:text-red-400">₹{dueAmount.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Amount Paid Now
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={dueAmount}
                                                    step="0.01"
                                                    value={billingDetails.paidDueAmount}
                                                    onChange={(e) => {
                                                        const value = Math.min(parseFloat(e.target.value) || 0, dueAmount);
                                                        setBillingDetails({ ...billingDetails, paidDueAmount: value });
                                                    }}
                                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                    placeholder="0.00"
                                                />
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Max: ₹{dueAmount.toFixed(2)}
                                                </p>
                                            </div>

                                            {/* Payment Method */}
                                            <div className="mb-3">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Payment Method <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={billingDetails.paymentMethod}
                                                    onChange={(e) => setBillingDetails({ ...billingDetails, paymentMethod: e.target.value })}
                                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                    required
                                                >
                                                    <option value="cash">Cash</option>
                                                    <option value="card">Card</option>
                                                    <option value="upi">UPI</option>
                                                    <option value="bank_transfer">Bank Transfer</option>
                                                </select>
                                            </div>

                                            {/* Payment Account */}
                                            <div className="mb-3">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Payment Account <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={billingDetails.paymentAccountId}
                                                    onChange={(e) => setBillingDetails({ ...billingDetails, paymentAccountId: e.target.value })}
                                                    className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                    required
                                                >
                                                    <option value="">Select Account</option>
                                                    {paymentAccounts.map(account => (
                                                        <option key={account._id} value={account._id}>
                                                            {account.name} - ₹{account.currentBalance.toLocaleString()}
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Select which account will receive this payment
                                                </p>
                                            </div>

                                            <div className="space-y-2 mb-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">Remaining Due:</span>
                                                    <span className="font-medium text-gray-900 dark:text-white">₹{remainingDue.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">Payment Status:</span>
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor}`}>
                                                        {paymentStatus.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            <div className="border-t pt-4 mt-4 dark:border-slate-600">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    <div className="flex justify-between mb-1">
                                        <span>Rental Duration:</span>
                                        <span>{rental ? Math.ceil((new Date() - new Date(rental.outTime)) / (1000 * 60 * 60)) : 0} hours</span>
                                    </div>
                                </div>
                                <div className="flex justify-between mb-2 text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Advance Paid:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">₹{rental?.advancePayment || 0}</span>
                                </div>
                            </div>

                            {!billPreview ? (
                                <button
                                    onClick={handleSubmit}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center"
                                >
                                    <CheckCircle className="w-5 h-5 mr-2" /> Complete Return
                                </button>
                            ) : (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-4 mt-4">
                                    <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">Bill Generated</h3>
                                    <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-700 dark:text-gray-300">Subtotal:</span>
                                            <span className="text-gray-900 dark:text-white">₹{billPreview.subtotal?.toFixed(2)}</span>
                                        </div>
                                        {billPreview.discountPercent > 0 && (
                                            <div className="flex justify-between text-red-600 dark:text-red-400">
                                                <span>Discount ({billPreview.discountPercent}%):</span>
                                                <span>-₹{billPreview.discount?.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-gray-700 dark:text-gray-300">After Discount:</span>
                                            <span className="text-gray-900 dark:text-white">₹{(billPreview.subtotal - billPreview.discount)?.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-700 dark:text-gray-300">Tax ({billPreview.taxPercent}%):</span>
                                            <span className="text-gray-900 dark:text-white">+₹{billPreview.taxAmount?.toFixed(2)}</span>
                                        </div>
                                        <div className="border-t border-green-200 dark:border-green-800 pt-1 mt-1"></div>
                                        <div className="flex justify-between font-semibold">
                                            <span className="text-gray-700 dark:text-gray-300">Total Amount:</span>
                                            <span className="text-gray-900 dark:text-white">₹{billPreview.totalAmount?.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Advance Paid:</span>
                                            <span className="text-gray-700 dark:text-gray-300">-₹{billPreview.paidAmount?.toFixed(2)}</span>
                                        </div>
                                        <div className="border-t border-green-200 dark:border-green-800 pt-2 mt-2"></div>
                                        <div className="flex justify-between font-bold text-lg">
                                            <span className="text-green-800 dark:text-green-200">Amount Due:</span>
                                            <span className="text-green-800 dark:text-green-200">₹{billPreview.dueAmount?.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* PDF Action Buttons */}
                                    <div className="grid grid-cols-3 gap-2 mt-4">
                                        <button
                                            onClick={handlePreviewPDF}
                                            disabled={downloading}
                                            className="flex flex-col items-center justify-center p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded transition-colors"
                                            title="Preview PDF in new tab"
                                        >
                                            <Eye className="w-5 h-5 mb-1" />
                                            <span className="text-xs">Preview</span>
                                        </button>
                                        <button
                                            onClick={handlePrintPDF}
                                            disabled={downloading}
                                            className="flex flex-col items-center justify-center p-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded transition-colors"
                                            title="Print PDF"
                                        >
                                            <Printer className="w-5 h-5 mb-1" />
                                            <span className="text-xs">Print</span>
                                        </button>
                                        <button
                                            onClick={handleDownloadPDF}
                                            disabled={downloading}
                                            className="flex flex-col items-center justify-center p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded transition-colors"
                                            title="Download PDF"
                                        >
                                            <Download className="w-5 h-5 mb-1" />
                                            <span className="text-xs">Download</span>
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => navigate('/rentals/active')}
                                        className="w-full mt-2 bg-gray-800 text-white py-2 rounded hover:bg-gray-700"
                                    >
                                        Back to Rentals
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RentalReturn;
