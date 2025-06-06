import React, { useState, useMemo, useRef, useCallback } from 'react';

// Main App component for the Cash Up application
const App = () => {
    // Till float is now a fixed value of £200, as per user's request.
    const TILL_FLOAT_VALUE = 200;

    // State for cash totals per denomination entered by the user
    // Initialized to 0 for number type inputs.
    const [cashTakenTotalsByDenomination, setCashTakenTotalsByDenomination] = useState({
        '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
        '0.5': 0, '0.2': 0, '0.1': 0, '0.05': 0,
    });

    // State for the three card machine readings and their respective gratuities
    // Initialized to 0 for number type inputs.
    const [cardReadings, setCardReadings] = useState({
        card1: 0,
        gratuity1: 0,
        card2: 0,
        gratuity2: 0,
        card3: 0,
        gratuity3: 0,
    });

    // State for petty cash incurred (formerly expenses)
    // Initialized to 0 for number type input.
    const [pettyCash, setPettyCash] = useState(0);

    // State for the Z Report value
    // Initialized to 0 for number type input.
    const [zReport, setZReport] = useState(0);

    // State for cash gratuity input
    const [cashGratuity, setCashGratuity] = useState(0);

    // State for discounts input
    const [discounts, setDiscounts] = useState(0);

    // State for copy feedback message
    const [copyFeedback, setCopyFeedback] = useState('');

    // Ref for the summary section to enable copying its content
    const summaryRef = useRef(null);

    // Function to handle changes in any number input field
    // Converts input value to float, defaults to 0 if invalid.
    const handleNumberChange = (setter) => (e) => {
        const value = parseFloat(e.target.value);
        setter(isNaN(value) ? 0 : value);
    };

    // Function to handle changes in specific denomination total inputs
    // Converts input value to float, defaults to 0 if invalid.
    const handleDenominationTotalChange = (denomination) => (e) => {
        const value = parseFloat(e.target.value);
        setCashTakenTotalsByDenomination(prev => ({
            ...prev,
            [denomination]: isNaN(value) ? 0 : value,
        }));
    };

    // Function to handle changes for card machine readings and gratuities
    // Converts input value to float, defaults to 0 if invalid.
    const handleCardReadingChange = (field) => (e) => {
        const value = parseFloat(e.target.value);
        setCardReadings(prev => ({
            ...prev,
            [field]: isNaN(value) ? 0 : value,
        }));
    };

    // Memoized calculation for the total cash taken during the day
    const cashTakenTotal = useMemo(() => {
        return Object.values(cashTakenTotalsByDenomination).reduce((acc, val) => acc + val, 0);
    }, [cashTakenTotalsByDenomination]);

    // Memoized calculation for the actual cash takings after deducting the float
    // This value will be used in the overall difference and summary.
    const cashTakingsAfterFloat = useMemo(() => {
        return cashTakenTotal - TILL_FLOAT_VALUE;
    }, [cashTakenTotal, TILL_FLOAT_VALUE]);


    // Memoized calculation for total card payments (sum of all three card machine totals)
    const totalCardPayments = useMemo(() => {
        return cardReadings.card1 + cardReadings.card2 + cardReadings.card3;
    }, [cardReadings]);

    // Memoized calculation for total gratuity from all three card machines
    const totalCardGratuity = useMemo(() => {
        return cardReadings.gratuity1 + cardReadings.gratuity2 + cardReadings.gratuity3;
    }, [cardReadings]);

    // Memoized calculation for combined gratuity (Card + Cash) - for display purposes
    const totalCombinedGratuity = useMemo(() => {
        return totalCardGratuity + cashGratuity;
    }, [totalCardGratuity, cashGratuity]);

    // Memoized calculation for the overall difference based on the new provided formula:
    // (Z Report - Card Takings - Petty Cash + Card Gratuity) - Cash Takings
    const overallDifference = useMemo(() => {
        const plannedCash = zReport - totalCardPayments - pettyCash + totalCardGratuity;
        return plannedCash - cashTakingsAfterFloat;
    }, [zReport, totalCardPayments, pettyCash, totalCardGratuity, cashTakingsAfterFloat]);

    // Function to reset all fields to their initial state
    const resetAll = () => {
        setCashTakenTotalsByDenomination({
            '50': 0, '20': 0, '10': 0, '5': 0, '1': 0,
            '0.5': 0, '0.2': 0, '0.1': 0, '0.05': 0,
        });
        setCardReadings({
            card1: 0,
            gratuity1: 0,
            card2: 0,
            gratuity2: 0,
            card3: 0,
            gratuity3: 0,
        });
        setPettyCash(0);
        setZReport(0);
        setCashGratuity(0);
        setDiscounts(0); // Reset discounts as well
        setCopyFeedback(''); // Clear copy feedback
    };

    // List of specific denominations to be rendered for cash input
    const denominationsList = [
        '50', '20', '10', '5', '1',
        '0.5', '0.2', '0.1', '0.05',
    ];

    // Helper function to format denomination labels (e.g., 0.5 to 50p, 50 to £50)
    const formatDenominationLabel = (denom) => {
        if (parseFloat(denom) < 1) {
            return `${(parseFloat(denom) * 100).toFixed(0)}p`;
        }
        return `£${denom}`;
    };

    // Helper function to format money values with + or - sign,
    // inverting the sign for display to match user's interpretation.
    const formatSignedCurrency = (value) => {
        if (value === 0) {
            return '£0.00';
        }
        // Invert the value for display based on user's request
        const displayValue = Math.abs(value);
        let sign = '';
        if (value < 0) { // If calculated difference is negative, it's 'over' (display positive)
            sign = '+';
        } else if (value > 0) { // If calculated difference is positive, it's 'under' (display negative)
            sign = '-';
        }
        return `${sign}£${displayValue.toFixed(2)}`;
    };

    // Function to get the display day of the week and date
    const getDisplayDayAndDate = useCallback(() => {
        const now = new Date();
        const hour = now.getHours(); // 0-23

        let displayDate = now;

        // If it's early morning (e.g., between 00:00 and 03:00), display yesterday's date
        if (hour >= 0 && hour < 3) { // Up to (but not including) 3 AM
            displayDate = new Date(now.setDate(now.getDate() - 1));
        }

        const dayOptions = { weekday: 'long' };
        const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };

        const dayOfWeek = new Intl.DateTimeFormat('en-US', dayOptions).format(displayDate);
        const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(displayDate);

        return `${dayOfWeek}, ${formattedDate}`;
    }, []);

    // Function to copy the summary content to clipboard
    const handleCopySummary = useCallback(() => {
        if (summaryRef.current) {
            const currentDisplayInfo = getDisplayDayAndDate(); // Get the current display day and date
            // Get the text content of the summary section, formatted as requested
            const summaryText = `${currentDisplayInfo}\n` + // Only day and date included here
                               `Z - £${zReport.toFixed(2)}\n` +
                               `Card - £${totalCardPayments.toFixed(2)}\n` +
                               `Cash - £${cashTakingsAfterFloat.toFixed(2)}\n` +
                               `Petty Cash - £${pettyCash.toFixed(2)}\n\n` +
                               `Gratuity\n` +
                               `Card - £${totalCardGratuity.toFixed(2)}\n` +
                               `Cash - £${cashGratuity.toFixed(2)}\n` +
                               `Total - £${totalCombinedGratuity.toFixed(2)}\n\n` +
                               `Discounts - £${discounts.toFixed(2)}\n\n` +
                               `Difference - ${formatSignedCurrency(overallDifference)}`; // Use formatSignedCurrency here

            // Use Clipboard API for modern browsers, fallback for older ones
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(summaryText)
                    .then(() => {
                        setCopyFeedback('Copied!');
                        setTimeout(() => setCopyFeedback(''), 2000);
                    })
                    .catch(err => {
                        console.error('Failed to copy text using Clipboard API: ', err);
                        // Fallback to execCommand if Clipboard API fails
                        const textarea = document.createElement('textarea');
                        textarea.value = summaryText;
                        textarea.style.position = 'fixed'; // Prevent scrolling to bottom
                        textarea.style.opacity = '0'; // Hide
                        document.body.appendChild(textarea);
                        textarea.select();
                        try {
                            const successful = document.execCommand('copy');
                            if (successful) {
                                setCopyFeedback('Copied!');
                            } else {
                                setCopyFeedback('Failed to copy!');
                            }
                        } catch (execErr) {
                            console.error('Failed to copy text using execCommand: ', execErr);
                            setCopyFeedback('Failed to copy!');
                        } finally {
                            document.body.removeChild(textarea);
                        }
                        setTimeout(() => setCopyFeedback(''), 2000);
                    });
            } else {
                // Fallback for browsers that don't support Clipboard API
                const textarea = document.createElement('textarea');
                textarea.value = summaryText;
                textarea.style.position = 'fixed'; // Prevent scrolling to bottom
                textarea.style.opacity = '0'; // Hide
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    const successful = document.execCommand('copy');
                    if (successful) {
                        setCopyFeedback('Copied!');
                    } else {
                        setCopyFeedback('Failed to copy!');
                    }
                } catch (err) {
                    console.error('Failed to copy text using execCommand: ', err);
                    setCopyFeedback('Failed to copy!');
                } finally {
                    document.body.removeChild(textarea);
                }
                setTimeout(() => setCopyFeedback(''), 2000);
            }
        }
    }, [getDisplayDayAndDate, zReport, totalCardPayments, pettyCash, totalCardGratuity, cashGratuity, totalCombinedGratuity, discounts, overallDifference, cashTakingsAfterFloat]);

    // Function to send summary via email
    const handleSendEmail = useCallback(() => {
        const currentDisplayInfo = getDisplayDayAndDate();
        const emailSubject = encodeURIComponent(`Cash Up Summary for ${currentDisplayInfo}`);
        const emailBody = encodeURIComponent(
            `Date: ${currentDisplayInfo}\n\n` +
            `--- Summary ---\n` +
            `Z Report: £${zReport.toFixed(2)}\n` +
            `Card Payments: £${totalCardPayments.toFixed(2)}\n` +
            `Cash Takings (after float): £${cashTakingsAfterFloat.toFixed(2)}\n` +
            `Petty Cash: £${pettyCash.toFixed(2)}\n\n` +
            `--- Gratuity ---\n` +
            `Card Gratuity: £${totalCardGratuity.toFixed(2)}\n` +
            `Cash Gratuity: £${cashGratuity.toFixed(2)}\n` +
            `Total Gratuity: £${totalCombinedGratuity.toFixed(2)}\n\n` +
            `Discounts: £${discounts.toFixed(2)}\n\n` +
            `Difference: ${formatSignedCurrency(overallDifference)}\n\n` +
            `--- End of Summary ---`
        );
        const mailtoLink = `mailto:rossandrewjordan@icloud.com?subject=${emailSubject}&body=${emailBody}`;
        window.location.href = mailtoLink;
    }, [getDisplayDayAndDate, zReport, totalCardPayments, cashTakingsAfterFloat, pettyCash, totalCardGratuity, cashGratuity, totalCombinedGratuity, discounts, overallDifference]);


    return (
        <div className="min-h-screen bg-gray-50 p-4 font-sans flex items-center justify-center">
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                }
                /* Hide number input arrows (spinners) for Chrome, Safari, Edge, Opera */
                input[type="number"]::-webkit-outer-spin-button,
                input[type="number"]::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                /* Hide number input arrows (spinners) for Firefox */
                input[type="number"] {
                    -moz-appearance: textfield;
                }
                `}
            </style>
            <div className="bg-white p-6 rounded-xl w-full max-w-2xl md:max-w-3xl lg:max-w-4xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">End of Night Cash Up</h1>

                {/* Till Float Section - Fixed value */}
                <div className="mb-6 p-4 bg-blue-50/20 rounded-lg"> {/* Muted background */}
                    <h2 className="text-xl font-semibold text-blue-800 mb-3">Till Float</h2>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">Fixed Till Float</span>
                        <span className="text-lg font-bold text-blue-800">£{TILL_FLOAT_VALUE.toFixed(2)}</span>
                    </div>
                </div>

                {/* Till Count Section */}
                <div className="mb-6 p-4 bg-green-50/20 rounded-lg"> {/* Muted background */}
                    <h2 className="text-xl font-semibold text-green-800 mb-3">Till Count</h2>
                    <div className="mb-4">
                        {denominationsList.map(denom => (
                            <div key={`taken-${denom}`} className="flex items-center justify-between py-1 border-b border-gray-200 last:border-b-0">
                                <label htmlFor={`cash-taken-${denom}`} className="w-1/2 text-gray-700 text-sm md:text-base font-medium">
                                    {formatDenominationLabel(denom)}
                                </label>
                                <input
                                    id={`cash-taken-${denom}`}
                                    type="number"
                                    step="0.01"
                                    value={cashTakenTotalsByDenomination[denom] === 0 ? '' : cashTakenTotalsByDenomination[denom]}
                                    onChange={handleDenominationTotalChange(denom)}
                                    className="w-1/2 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-right"
                                    placeholder="0.00"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t-2 border-green-300">
                        <span className="text-lg font-bold text-green-800">CASH TOTAL</span>
                        <span className="text-lg font-bold text-green-800">£{cashTakenTotal.toFixed(2)}</span>
                    </div>
                    {/* New Cash Takings display */}
                    <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-green-300">
                        <span className="text-lg font-bold text-green-800">CASH TAKINGS (£{TILL_FLOAT_VALUE.toFixed(2)} off)</span>
                        <span className="text-lg font-bold text-green-800">£{cashTakingsAfterFloat.toFixed(2)}</span>
                    </div>
                </div>

                {/* Card Taken Section - Split into three machines with gratuity */}
                <div className="mb-6 p-4 bg-purple-50/20 rounded-lg"> {/* Muted background */}
                    <h2 className="text-xl font-semibold text-purple-800 mb-3">Card Machine Readings</h2>

                    {[1, 2, 3].map(i => (
                        <div key={`card-machine-${i}`} className="mb-4 p-3 bg-purple-100/20 rounded-lg"> {/* Muted background */}
                            <h3 className="text-lg font-medium text-purple-700 mb-2">Card Machine {i}</h3>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor={`card-total-${i}`} className="text-gray-700 font-medium">Card</label>
                                <input
                                    id={`card-total-${i}`}
                                    type="number"
                                    step="0.01"
                                    value={cardReadings[`card${i}`] === 0 ? '' : cardReadings[`card${i}`]}
                                    onChange={handleCardReadingChange(`card${i}`)}
                                    className="w-32 p-2 border border-purple-300 rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-right"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label htmlFor={`gratuity-${i}`} className="text-gray-700 font-medium">Gratuity</label>
                                <input
                                    id={`gratuity-${i}`}
                                    type="number"
                                    step="0.01"
                                    value={cardReadings[`gratuity${i}`] === 0 ? '' : cardReadings[`gratuity${i}`]}
                                    onChange={handleCardReadingChange(`gratuity${i}`)}
                                    className="w-32 p-2 border border-purple-300 rounded-md focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-right"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-between items-center pt-2 mt-4 border-t-2 border-purple-300">
                        <span className="text-lg font-bold text-purple-800">TOTAL CARD READINGS</span>
                        <span className="text-lg font-bold text-purple-800">£{totalCardPayments.toFixed(2)}</span>
                    </div>
                </div>

                {/* Petty Cash Section */}
                <div className="mb-6 p-4 bg-red-50/20 rounded-lg"> {/* Muted background */}
                    <h2 className="text-xl font-semibold text-red-800 mb-3">Petty Cash</h2>
                    <div className="flex items-center justify-between">
                        <label htmlFor="petty-cash" className="text-gray-700 font-medium">Petty Cash</label>
                        <input
                            id="petty-cash"
                            type="number"
                            step="0.01"
                            value={pettyCash === 0 ? '' : pettyCash}
                            onChange={handleNumberChange(setPettyCash)}
                            className="w-32 p-2 border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500 sm:text-sm text-right"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Z Report Section */}
                <div className="mb-6 p-4 bg-yellow-50/20 rounded-lg"> {/* Muted background */}
                    <h2 className="text-xl font-semibold text-yellow-800 mb-3">Z Report</h2>
                    <div className="flex items-center justify-between">
                        <label htmlFor="z-report" className="text-gray-700 font-medium">Z Report Value</label>
                        <input
                            id="z-report"
                            type="number"
                            step="0.01"
                            value={zReport === 0 ? '' : zReport}
                            onChange={handleNumberChange(setZReport)}
                            className="w-32 p-2 border border-yellow-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm text-right"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Gratuity Breakdown Section */}
                <div className="mb-6 p-4 bg-indigo-50/20 rounded-lg"> {/* Muted background */}
                    <h2 className="text-xl font-semibold text-indigo-800 mb-3">Gratuity Breakdown</h2>
                    <div className="grid grid-cols-1 gap-2 mb-4">
                        <div className="flex justify-between">
                            <span className="text-gray-700">Card Gratuity Total:</span>
                            <span className="font-semibold text-indigo-700">£{totalCardGratuity.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="cash-gratuity" className="text-gray-700 font-medium">Cash Gratuity:</label>
                            <input
                                id="cash-gratuity"
                                type="number"
                                step="0.01"
                                value={cashGratuity === 0 ? '' : cashGratuity}
                                onChange={handleNumberChange(setCashGratuity)}
                                className="w-32 p-2 border border-indigo-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-right"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t-2 border-indigo-300">
                        <span className="text-lg font-bold text-indigo-800">TOTAL COMBINED GRATUITY</span>
                        <span className="text-lg font-bold text-indigo-800">£{totalCombinedGratuity.toFixed(2)}</span>
                    </div>
                </div>

                {/* Discounts Section */}
                <div className="mb-6 p-4 bg-gray-100 rounded-lg"> {/* Muted background */}
                    <h2 className="text-xl font-semibold text-gray-700 mb-3">Discounts</h2>
                    <div className="flex items-center justify-between">
                        <label htmlFor="discounts" className="text-gray-700 font-medium">Total Discounts</label>
                        <input
                            id="discounts"
                            type="number"
                            step="0.01"
                            value={discounts === 0 ? '' : discounts}
                            onChange={handleNumberChange(setDiscounts)}
                            className="w-32 p-2 border border-gray-400 rounded-md focus:ring-gray-500 focus:border-gray-500 sm:text-sm text-right"
                            placeholder="0.00"
                        />
                    </div>
                </div>


                {/* Summary Section */}
                <div ref={summaryRef} className="mb-6 p-4 bg-gray-200 rounded-lg relative"> {/* Muted background */}
                    <h2 className="text-xl font-semibold text-gray-800 mb-1">Summary</h2>
                    <p className="text-lg font-medium text-gray-700 mb-3">{getDisplayDayAndDate()}</p>
                    <div className="grid grid-cols-1 gap-1 text-base">
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">Z -</span>
                            <span className="font-bold text-gray-900">£{zReport.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">Card -</span>
                            <span className="font-bold text-gray-900">£{totalCardPayments.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">Cash -</span>
                            <span className="font-bold text-gray-900">£{cashTakingsAfterFloat.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">Petty Cash -</span>
                            <span className="font-bold text-gray-900">£{pettyCash.toFixed(2)}</span>
                        </div>

                        <div className="mt-3">
                            <span className="font-semibold text-gray-700">Gratuity</span>
                        </div>
                        <div className="flex justify-between ml-4">
                            <span className="text-gray-700">Card -</span>
                            <span className="font-bold text-gray-900">£{totalCardGratuity.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between ml-4">
                            <span className="text-gray-700">Cash -</span>
                            <span className="font-bold text-gray-900">£{cashGratuity.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between ml-4">
                            <span className="font-semibold text-gray-700">Total -</span>
                            <span className="font-bold text-gray-900">£{totalCombinedGratuity.toFixed(2)}</span>
                        </div>

                        <div className="mt-3 flex justify-between">
                            <span className="font-semibold text-gray-700">Discounts -</span>
                            <span className="font-bold text-gray-900">£{discounts.toFixed(2)}</span>
                        </div>

                        <div className="mt-3 flex justify-between pt-2 border-t border-gray-300">
                            <span className="font-semibold text-gray-700">Difference -</span>
                            <span className="font-bold text-gray-900">{formatSignedCurrency(overallDifference)}</span>
                        </div>
                    </div>
                    {/* Feedback message for copy */}
                    {copyFeedback && (
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white text-xs px-2 py-1 rounded animate-fade-in-out">
                            {copyFeedback}
                        </div>
                    )}
                </div>

                {/* Overall Difference / Reconciliation Section */}
                <div className="mb-6 p-4 rounded-lg"
                    style={{ backgroundColor: overallDifference === 0 ? '#e6ffe6' : (overallDifference > 0 ? '#ffe6e6' : '#e6ffe6') }}> {/* Muted colors: Green for balanced/over, Red for under */}
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">Overall Difference</h2>
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-800">Difference</span>
                        <span className={`text-2xl font-extrabold ${
                            overallDifference === 0 ? 'text-green-700' : (overallDifference > 0 ? 'text-red-700' : 'text-green-700') // Green for over, Red for under
                        }`}>
                            {formatSignedCurrency(overallDifference)}
                        </span>
                    </div>
                    <p className={`text-sm mt-2 text-center ${
                        overallDifference === 0 ? 'text-green-600' : (overallDifference > 0 ? 'text-red-600' : 'text-green-600') // Green for over, Red for under
                    }`}>
                        {overallDifference === 0 ? 'Balanced!' : (overallDifference > 0 ? 'Under' : 'Over')} {/* Text adjusted */}
                    </p>
                </div>


                {/* Reset and Copy Buttons */}
                <div className="flex justify-center mt-6 space-x-4">
                    <button
                        onClick={resetAll}
                        className="px-6 py-3 bg-gray-400 text-gray-800 font-semibold rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition duration-200 ease-in-out"
                    >
                        Reset All Fields
                    </button>
                    <button
                        onClick={handleCopySummary}
                        className="px-6 py-3 bg-blue-400 text-blue-800 font-semibold rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 transition duration-200 ease-in-out"
                    >
                        Copy Summary
                    </button>
                    <button
                        onClick={handleSendEmail}
                        className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 transition duration-200 ease-in-out"
                    >
                        Send Summary to Email
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;
