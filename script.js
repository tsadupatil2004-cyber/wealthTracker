const balance = document.getElementById('balance');
const money_plus = document.getElementById('money_plus');
const money_minus = document.getElementById('money_minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const incomeText = document.getElementById('incomeText');
const expenseText = document.getElementById('expenseText');
const dateText = document.getElementById('dateText');
const categoryText = document.getElementById('categoryText');
const monthFilter = document.getElementById('monthFilter');
const exportBtn = document.getElementById('exportBtn');

let expenseChart;
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// --- AUTO-CLEAR LOGIC ---
incomeText.addEventListener('input', () => { if(incomeText.value) expenseText.value = ''; });
expenseText.addEventListener('input', () => { if(expenseText.value) incomeText.value = ''; });

// --- ADD TRANSACTION ---
function addTransaction(e) {
    e.preventDefault();

    if (!text.value || !dateText.value || (!incomeText.value && !expenseText.value)) {
        alert('Please fill description, date, and an amount.');
        return;
    }

    const common = {
        id: Date.now(),
        text: text.value,
        date: dateText.value,
        category: categoryText.value
    };

    // Logical Switch: Add as Income or Expense
    if (incomeText.value) {
        transactions.push({ ...common, amount: +incomeText.value });
    } else if (expenseText.value) {
        transactions.push({ ...common, amount: -Math.abs(expenseText.value) });
    }

    updateLocalStorage();
    displayTransactions(monthFilter.value);
    form.reset();
}

// --- DISPLAY LIST ---
function displayTransactions(month) {
    list.innerHTML = '';
    const filtered = transactions.filter(t => month === 'all' || t.date.slice(5, 7) === month);

    filtered.forEach(t => {
        const item = document.createElement('li');
        item.classList.add(t.amount < 0 ? 'minus' : 'plus');
        item.innerHTML = `
            <div><strong>${t.text}</strong><br><small>${t.date} | ${t.category}</small></div>
            <span>${t.amount < 0 ? '-' : '+'}$${Math.abs(t.amount).toFixed(2)}
            <button class="delete-btn" onclick="removeTransaction(${t.id})">x</button></span>
        `;
        list.appendChild(item);
    });

    updateValues(filtered);
    updateCategorySummary(filtered);
}

// --- CALC TOTALS ---
function updateValues(filtered) {
    const amounts = filtered.map(t => t.amount);
    const inc = amounts.filter(a => a > 0).reduce((acc, i) => acc + i, 0);
    const exp = Math.abs(amounts.filter(a => a < 0).reduce((acc, i) => acc + i, 0));
    const total = inc - exp;

    balance.innerText = `$${total.toFixed(2)}`;
    money_plus.innerText = `+$${inc.toFixed(2)}`;
    money_minus.innerText = `-$${exp.toFixed(2)}`;
    updateChart(inc, exp);
}

// --- CHART LOGIC ---
function updateChart(inc, exp) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (expenseChart) expenseChart.destroy();
    
    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Income', 'Expense'],
            datasets: [{
                data: [inc, exp],
                backgroundColor: ['#22c55e', '#ef4444'],
                borderWidth: 0,
                spacing: 5
            }]
        },
        options: { cutout: '75%', plugins: { legend: { position: 'bottom' } } }
    });
}

// --- CATEGORY SUMMARY ---
function updateCategorySummary(filtered) {
    const tbody = document.querySelector('#categorySummary tbody');
    tbody.innerHTML = '';
    const summary = {};
    filtered.forEach(t => summary[t.category] = (summary[t.category] || 0) + t.amount);

    for (const cat in summary) {
        const row = `<tr><td>${cat}</td><td>$${Math.abs(summary[cat]).toFixed(2)}</td></tr>`;
        tbody.innerHTML += row;
    }
}

// --- CSV EXPORT ---
function exportToCSV() {
    if (transactions.length === 0) return alert('No data to export');
    const headers = ['Description', 'Amount', 'Date', 'Category'];
    const rows = transactions.map(t => [`"${t.text}"`, t.amount, t.date, t.category]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `wealth_tracker_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function removeTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    updateLocalStorage();
    displayTransactions(monthFilter.value);
}

function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// --- EVENTS ---
form.addEventListener('submit', addTransaction);
monthFilter.addEventListener('change', (e) => displayTransactions(e.target.value));
exportBtn.addEventListener('click', exportToCSV);

displayTransactions('all');