document.addEventListener('DOMContentLoaded', function () {
    const { jsPDF } = window.jspdf;

    // --- DATA ---
    const countryData = {
        'US': { rate: 0.17, currency: '$', taxRate: 0.08, tips: [
            { title: 'Utilize Off-Peak Hours', impact: 'High', description: 'Many US utility companies offer lower rates during off-peak hours (typically overnight). Run dishwashers and laundry machines then.'}
        ]},
        'IN': { rate: 8.00, currency: '₹', taxRate: 0.0, tips: [
            { title: 'Switch to 5-Star Rated Appliances', impact: 'High', description: 'In India, the Bureau of Energy Efficiency (BEE) rates appliances. Choosing 5-star rated products ensures lower energy consumption.'}
        ]},
        'DE': { rate: 0.45, currency: '€', taxRate: 0.19, tips: [
            { title: 'Master the "Stoßlüften" Technique', impact: 'Medium', description: 'Instead of tilting windows for hours, open them wide for a few minutes to quickly exchange air. This prevents walls from cooling down, saving heating energy.'}
        ]},
        'GB': { rate: 0.34, currency: '£', taxRate: 0.20, tips: [
            { title: 'Draught-Proof Your Home', impact: 'High', description: 'Block gaps around windows, doors, and floorboards to prevent heat from escaping. This is one of the most cost-effective ways to save on heating bills.'}
        ]}
    };

    const applianceAdjustmentFactors = {
        'default': { 'standard': 1.0, 'efficient': 0.85, 'high_efficiency': 0.7 },
        'fridge': { 'standard': 0.33, 'efficient': 0.25, 'high_efficiency': 0.2 },
        'refrigerator': { 'standard': 0.33, 'efficient': 0.25, 'high_efficiency': 0.2 },
        'ac': { 'standard': 1.0, 'efficient': 0.8, 'high_efficiency': 0.65 },
        'air conditioner': { 'standard': 1.0, 'efficient': 0.8, 'high_efficiency': 0.65 },
        'heater': { 'standard': 1.0, 'efficient': 0.9, 'high_efficiency': 0.8 },
        'geyser': { 'standard': 0.4, 'efficient': 0.3, 'high_efficiency': 0.25 },
        'water heater': { 'standard': 0.4, 'efficient': 0.3, 'high_efficiency': 0.25 },
        'tv': { 'standard': 1.0, 'efficient': 0.75, 'high_efficiency': 0.6 },
        'television': { 'standard': 1.0, 'efficient': 0.75, 'high_efficiency': 0.6 },
        'washing machine': { 'standard': 0.15, 'efficient': 0.12, 'high_efficiency': 0.1 },
        'dryer': { 'standard': 0.7, 'efficient': 0.6, 'high_efficiency': 0.5 },
        'fan': { 'standard': 1.0, 'efficient': 0.8, 'high_efficiency': 0.7 },
    };
    
    const personalizedTipsDb = {
        'fridge': { title: 'Optimize Your Refrigerator', impact: 'Medium', description: 'Set your fridge to 3-4°C (37-40°F). Keep it full but not crowded to maintain temperature efficiently, and check door seals for leaks.' },
        'refrigerator': { title: 'Optimize Your Refrigerator', impact: 'Medium', description: 'Set your fridge to 3-4°C (37-40°F). Keep it full but not crowded to maintain temperature efficiently, and check door seals for leaks.' },
        'ac': { title: 'Use Your Air Conditioner Wisely', impact: 'High', description: 'Set the thermostat as high as is comfortable. Each degree cooler can increase energy use by 6-8%. Clean the filter monthly for optimal performance.' },
        'air conditioner': { title: 'Use Your Air Conditioner Wisely', impact: 'High', description: 'Set the thermostat as high as is comfortable. Each degree cooler can increase energy use by 6-8%. Clean the filter monthly for optimal performance.' },
        'light': { title: 'Switch to LED Lighting', impact: 'High', description: 'LED bulbs use up to 80% less energy and last much longer than traditional bulbs. Always turn off lights when leaving a room.' },
        'tv': { title: 'Adjust Television Settings', impact: 'Low', description: 'Modern TVs have eco-friendly or power-saving modes. Also, reduce brightness to a comfortable level to save energy.' },
        'heater': { title: 'Manage Heating Efficiently', impact: 'High', description: 'Use a programmable thermostat to lower heat when you are away or asleep. Only heat the rooms you are using.' },
        'fan': { title: 'Optimize Fan Usage', impact: 'Medium', description: 'Use fans to circulate air, which can make a room feel cooler, reducing the need for AC. Ensure fans are switched off when leaving a room.'}
    };

    // --- UI ELEMENTS ---
    const mainPage = document.getElementById('main-page');
    const resultsPage = document.getElementById('results-page');
    const suggestionsPage = document.getElementById('suggestions-page');
    const countrySelect = document.getElementById('country');
    const electricityRateInput = document.getElementById('electricity-rate');
    const currencySymbolRate = document.getElementById('currency-symbol-rate');
    const applianceList = document.getElementById('appliance-list');
    const errorMessage = document.getElementById('error-message');
    const progressContainer = document.getElementById('progress-container');
    const resultsDisplay = document.getElementById('results-display');
    const billBreakdownBody = document.getElementById('bill-breakdown-body');
    const subtotalEl = document.getElementById('subtotal-bill');
    const taxRow = document.getElementById('tax-row');
    const taxRateDisplayEl = document.getElementById('tax-rate-display');
    const taxAmountEl = document.getElementById('tax-amount');
    const estimatedBillEl = document.getElementById('estimated-bill');
    
    // --- EVENT LISTENERS ---
    countrySelect.addEventListener('change', () => {
        const selectedCountry = countryData[countrySelect.value];
        electricityRateInput.value = selectedCountry.rate;
        currencySymbolRate.textContent = selectedCountry.currency;
    });

    document.getElementById('add-appliance-btn').addEventListener('click', createApplianceRow);
    applianceList.addEventListener('click', handleApplianceListClick);
    document.getElementById('calculate-btn').addEventListener('click', handleCalculation);
    document.getElementById('view-suggestions-btn').addEventListener('click', () => showPage(suggestionsPage));
    document.getElementById('download-pdf-btn').addEventListener('click', downloadPDF);
    document.getElementById('back-to-results-btn').addEventListener('click', () => showPage(resultsPage));
    document.getElementById('start-over-btn-results').addEventListener('click', () => showPage(mainPage));

    // --- FUNCTIONS ---
    function showPage(pageToShow) {
        window.scrollTo(0, 0);
        [mainPage, resultsPage, suggestionsPage].forEach(page => {
            page.classList.toggle('visible-page', page === pageToShow);
            page.classList.toggle('hidden-page', page !== pageToShow);
        });
    }

    function updateRemoveButtons() {
        const items = applianceList.querySelectorAll('.appliance-item');
        items.forEach(item => {
            const removeBtn = item.querySelector('.remove-appliance');
            removeBtn.classList.toggle('hidden', items.length === 1);
        });
    }

    function createApplianceRow() {
        const div = document.createElement('div');
        div.className = 'appliance-item grid grid-cols-1 md:grid-cols-10 gap-3 items-center';
        div.innerHTML = `
            <input type="text" placeholder="Appliance Name" class="appliance-name md:col-span-3 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
            <input type="number" placeholder="Wattage (W)" class="appliance-wattage md:col-span-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
            <select class="appliance-rating md:col-span-3 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                <option value="standard">Standard Efficiency</option>
                <option value="efficient">Energy Efficient</option>
                <option value="high_efficiency">High Efficiency (e.g. 5-Star)</option>
            </select>
            <input type="number" placeholder="Hrs/Day" class="appliance-hours md:col-span-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" min="0" max="24" step="0.1">
            <button class="remove-appliance md:col-span-1 bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 font-bold">X</button>
        `;
        applianceList.appendChild(div);
        updateRemoveButtons();
    }

    function handleApplianceListClick(e) {
        if (e.target && e.target.classList.contains('remove-appliance')) {
            e.target.closest('.appliance-item').remove();
            updateRemoveButtons();
        }
    }
    
    function getAdjustedWattage(name, wattage, rating) {
        const lowerCaseName = name.toLowerCase();
        let applicableProfile = applianceAdjustmentFactors.default;

        for (const keyword in applianceAdjustmentFactors) {
            if (keyword !== 'default' && lowerCaseName.includes(keyword)) {
                applicableProfile = applianceAdjustmentFactors[keyword];
                break; 
            }
        }
        const factor = applicableProfile[rating] || 1.0;
        return wattage * factor;
    }

    function handleCalculation() {
        errorMessage.classList.add('hidden');
        let isValid = true;
        const appliances = [];

        applianceList.querySelectorAll('.appliance-item').forEach(item => {
            const name = item.querySelector('.appliance-name').value.trim();
            const wattage = parseFloat(item.querySelector('.appliance-wattage').value);
            const rating = item.querySelector('.appliance-rating').value;
            const hours = parseFloat(item.querySelector('.appliance-hours').value);

            if (name && wattage > 0 && hours >= 0 && hours <= 24) {
                appliances.push({ name, wattage, rating, hours });
            } else if (name || !isNaN(wattage) || !isNaN(hours)) {
                isValid = false;
            }
        });

        if (!isValid || appliances.length === 0) {
            errorMessage.textContent = 'Please fill all fields correctly for at least one appliance.';
            errorMessage.classList.remove('hidden');
            return;
        }

        showPage(resultsPage);
        progressContainer.style.display = 'block';
        resultsDisplay.classList.add('hidden');
        
        const progressBar = document.getElementById('progress-bar');
        progressBar.style.width = '0%';
        progressBar.textContent = '0%';

        setTimeout(() => {
            progressBar.style.transition = 'width 2s ease-out';
            progressBar.style.width = '100%';
            let percent = 0;
            const interval = setInterval(() => {
                percent = Math.min(100, percent + 5);
                progressBar.textContent = `${percent}%`;
                if (percent === 100) clearInterval(interval);
            }, 90);
        }, 100);

        setTimeout(() => {
            const countryCode = countrySelect.value;
            const { currency, taxRate } = countryData[countryCode];
            const electricityRate = parseFloat(electricityRateInput.value);
            let subtotal = 0;

            billBreakdownBody.innerHTML = '';

            appliances.forEach(app => {
                const adjustedWattage = getAdjustedWattage(app.name, app.wattage, app.rating);
                const monthlyKwh = (adjustedWattage * app.hours * 30) / 1000;
                const cost = monthlyKwh * electricityRate;
                subtotal += cost;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap font-medium">${app.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${app.hours}</td>
                    <td class="px-6 py-4 whitespace-nowrap font-semibold">${currency}${cost.toFixed(2)}</td>
                `;
                billBreakdownBody.appendChild(row);
            });
            
            const tax = subtotal * taxRate;
            let totalBill = subtotal + tax;
            
            totalBill = Math.max(0, totalBill);

            subtotalEl.textContent = `${currency}${subtotal.toFixed(2)}`;
            
            if(taxRate > 0) {
                taxRow.style.display = 'flex';
                taxRateDisplayEl.textContent = (taxRate * 100).toFixed(0);
                taxAmountEl.textContent = `${currency}${tax.toFixed(2)}`;
            } else {
                taxRow.style.display = 'none';
            }

            estimatedBillEl.textContent = `${currency}${totalBill.toFixed(2)}`;
            
            generateSuggestions(appliances, countryCode);

            progressContainer.style.display = 'none';
            resultsDisplay.classList.remove('hidden');
        }, 2200);
    }

    function generateSuggestions(appliances, countryCode) {
        const suggestionsList = document.getElementById('suggestions-list');
        suggestionsList.innerHTML = '';
        const tips = new Map();

        countryData[countryCode].tips.forEach(tip => tips.set(tip.title, tip));

        appliances.forEach(app => {
            const lowerCaseName = app.name.toLowerCase();
            for (const keyword in personalizedTipsDb) {
                if (lowerCaseName.includes(keyword)) {
                    const tip = personalizedTipsDb[keyword];
                    tips.set(tip.title, tip);
                }
            }
        });

        if (tips.size === 0) {
             suggestionsList.innerHTML = '<p class="text-center text-gray-600">Your energy usage is quite efficient! Keep up the great work.</p>';
             return;
        }

        tips.forEach(tip => {
            const impactColor = tip.impact === 'High' ? 'bg-red-100 text-red-800' : (tip.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800');
            const tipEl = document.createElement('div');
            tipEl.className = 'bg-gray-50 p-4 rounded-lg border';
            tipEl.innerHTML = `
                <div class="flex justify-between items-center">
                    <h4 class="text-lg font-semibold text-gray-900">${tip.title}</h4>
                    <span class="text-sm font-medium px-2.5 py-0.5 rounded-full ${impactColor}">${tip.impact} Impact</span>
                </div>
                <p class="mt-2 text-gray-600">${tip.description}</p>
            `;
            suggestionsList.appendChild(tipEl);
        });
    }

    function downloadPDF() {
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const content = document.getElementById('results-content');
        const title = "WattWise Energy Estimate";
        
        html2canvas(content, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * (pdfWidth - 20)) / imgProps.width;
            let heightLeft = imgHeight;
            let position = 25;

            pdf.setFontSize(22);
            pdf.text(title, pdfWidth / 2, 15, { align: 'center' });
            
            pdf.addImage(imgData, 'PNG', 10, position, pdfWidth - 20, imgHeight);
            heightLeft -= (pdf.internal.pageSize.getHeight() - position);

            while (heightLeft > 0) {
                position = -heightLeft;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, pdfWidth - 20, imgHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }
            pdf.save('WattWise-Estimate.pdf');
        });
    }
    
    // --- INITIALIZATION ---
    updateRemoveButtons();
    countrySelect.dispatchEvent(new Event('change'));
});