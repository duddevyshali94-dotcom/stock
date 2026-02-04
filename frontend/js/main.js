const { SUPABASE_URL, SUPABASE_ANON_KEY, API_BASE_URL } = window.APP_CONFIG;
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const state = {
  session: null,
  profile: null,
  stocks: [],
  quotes: new Map()
};

const elements = {
  systemStatus: document.getElementById('system-status'),
  priceStatus: document.getElementById('price-status'),
  loginForm: document.getElementById('login-form'),
  signupForm: document.getElementById('signup-form'),
  logoutBtn: document.getElementById('logout-btn'),
  rolePill: document.getElementById('role-pill'),
  walletBalance: document.getElementById('wallet-balance'),
  guidanceSummary: document.getElementById('guidance-summary'),
  stocksTable: document.getElementById('stocks-table'),
  holdingsTable: document.getElementById('holdings-table'),
  portfolioValue: document.getElementById('portfolio-value'),
  portfolioGain: document.getElementById('portfolio-gain'),
  addStockForm: document.getElementById('add-stock-form'),
  adminStocksTable: document.getElementById('admin-stocks-table'),
  activityTable: document.getElementById('activity-table'),
  refreshStocks: document.getElementById('refresh-stocks'),
  refreshPortfolio: document.getElementById('refresh-portfolio'),
  refreshAdminStocks: document.getElementById('refresh-admin-stocks')
};

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
}

function formatChange(change, percent) {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
}

function setStatus(el, text, good) {
  el.textContent = text;
  el.className = good ? 'status-good' : 'status-bad';
}

async function apiFetch(path, options = {}) {
  const headers = options.headers || {};
  if (state.session?.access_token) {
    headers.Authorization = `Bearer ${state.session.access_token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

async function checkSystemHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    if (data.success) {
      setStatus(elements.systemStatus, 'Online', true);
    } else {
      setStatus(elements.systemStatus, 'Unavailable', false);
    }
  } catch (error) {
    setStatus(elements.systemStatus, 'Offline', false);
  }
}

function showPanel(id) {
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.toggle('hidden', panel.id !== id);
  });
}

function setupNavigation() {
  document.querySelectorAll('[data-nav]').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-nav')?.replace('#', '');
      if (target) {
        showPanel(target);
      }
    });
  });

  document.querySelectorAll('nav a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const target = link.getAttribute('href').replace('#', '');
      showPanel(target);
    });
  });
}

async function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const email = formData.get('email');
  const password = formData.get('password');

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    alert(error.message);
    return;
  }

  state.session = data.session;
  await loadProfile();
  await refreshDashboard();
}

async function handleSignup(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const email = formData.get('email');
  const password = formData.get('password');

  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    alert(error.message);
    return;
  }

  alert('Signup successful. Check your email to confirm if required.');
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  state.session = null;
  state.profile = null;
  elements.logoutBtn.classList.add('hidden');
  showPanel('home');
}

async function loadProfile() {
  const { data } = await apiFetch('/portfolio/me');
  state.profile = data;
  elements.rolePill.textContent = `Role: ${data.role}`;
  elements.walletBalance.textContent = formatCurrency(data.virtual_balance);
  elements.logoutBtn.classList.remove('hidden');
  document.getElementById('admin').classList.toggle('hidden', data.role !== 'admin');
  document.getElementById('dashboard').classList.remove('hidden');
}

async function loadStocks() {
  const { data } = await apiFetch('/stocks');
  state.stocks = data;
}

async function loadQuotes() {
  if (!state.stocks.length) {
    return;
  }
  try {
    const symbols = state.stocks.map(stock => stock.symbol);
    const { data } = await apiFetch(`/stocks/quotes?symbols=${symbols.join(',')}`);
    state.quotes = new Map(data.map(quote => [quote.symbol, quote]));
    setStatus(elements.priceStatus, 'Live', true);
  } catch (error) {
    setStatus(elements.priceStatus, 'Unavailable', false);
  }
}

function renderStocks() {
  elements.stocksTable.innerHTML = '';
  state.stocks.forEach(stock => {
    const quote = state.quotes.get(stock.symbol) || {};
    const row = document.createElement('tr');
    const change = quote.regularMarketChange || 0;
    const percent = quote.regularMarketChangePercent || 0;
    const tradeCell = state.profile?.role === 'admin'
      ? '<span class="helper-text">Admin view only</span>'
      : `
        <div class="trade-actions">
          <input type="number" min="1" placeholder="Qty" data-symbol="${stock.symbol}">
          <button class="secondary-btn" data-action="buy" data-symbol="${stock.symbol}">Buy</button>
          <button class="ghost-btn" data-action="sell" data-symbol="${stock.symbol}">Sell</button>
        </div>
      `;

    row.innerHTML = `
      <td>${stock.symbol}</td>
      <td>${stock.name}</td>
      <td>${formatCurrency(quote.regularMarketPrice || 0)}</td>
      <td class="${change >= 0 ? 'status-good' : 'status-bad'}">${formatChange(change, percent)}</td>
      <td>${tradeCell}</td>
    `;
    elements.stocksTable.appendChild(row);
  });
}

async function handleTrade(event) {
  const action = event.target.getAttribute('data-action');
  if (!action) return;
  if (state.profile?.role !== 'user') {
    alert('Only users can trade.');
    return;
  }

  const symbol = event.target.getAttribute('data-symbol');
  const input = document.querySelector(`input[data-symbol="${symbol}"]`);
  const quantity = Number(input?.value || 0);

  if (!quantity || quantity <= 0) {
    alert('Enter a valid quantity.');
    return;
  }

  const endpoint = action === 'buy' ? '/portfolio/buy' : '/portfolio/sell';
  await apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({ symbol, quantity })
  });

  input.value = '';
  await refreshDashboard();
}

async function loadPortfolio() {
  const { data } = await apiFetch('/portfolio');
  elements.portfolioValue.textContent = formatCurrency(data.total_value);
  elements.portfolioGain.textContent = formatCurrency(data.total_gain_loss);

  elements.holdingsTable.innerHTML = '';
  data.holdings.forEach(holding => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${holding.symbol}</td>
      <td>${holding.quantity}</td>
      <td>${formatCurrency(holding.avg_price)}</td>
      <td>${formatCurrency(holding.current_price)}</td>
      <td class="${holding.gain_loss >= 0 ? 'status-good' : 'status-bad'}">${formatCurrency(holding.gain_loss)}</td>
    `;
    elements.holdingsTable.appendChild(row);
  });
}

async function loadGuidance() {
  try {
    const { data } = await apiFetch('/guidance/portfolio');
    elements.guidanceSummary.innerHTML = `
      <p><strong>Portfolio Insight:</strong> ${data.insights?.[0] || 'Stay diversified and monitor trends.'}</p>
      <p><strong>Risk Level:</strong> ${data.risk_assessment?.riskLevel || 'Moderate'}</p>
    `;
  } catch (error) {
    elements.guidanceSummary.innerHTML = `<p>Guidance unavailable: ${error.message}</p>`;
  }
}

async function loadAdminStocks() {
  const { data } = await apiFetch('/admin/stocks');
  elements.adminStocksTable.innerHTML = '';
  data.forEach(stock => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${stock.symbol}</td>
      <td>${stock.name}</td>
      <td>${stock.is_active ? 'Yes' : 'No'}</td>
      <td>
        <button class="ghost-btn" data-admin="toggle" data-id="${stock.id}" data-active="${stock.is_active}">
          ${stock.is_active ? 'Disable' : 'Enable'}
        </button>
      </td>
    `;
    elements.adminStocksTable.appendChild(row);
  });
}

async function loadActivity() {
  const { data } = await apiFetch('/admin/activity');
  elements.activityTable.innerHTML = '';
  data.forEach(entry => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${entry.user_id.slice(0, 8)}...</td>
      <td>${entry.symbol}</td>
      <td>${entry.side}</td>
      <td>${entry.quantity}</td>
      <td>${formatCurrency(entry.price)}</td>
    `;
    elements.activityTable.appendChild(row);
  });
}

async function handleAddStock(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const symbol = formData.get('symbol');
  const name = formData.get('name');

  await apiFetch('/admin/stocks', {
    method: 'POST',
    body: JSON.stringify({ symbol, name })
  });

  event.target.reset();
  await loadAdminStocks();
}

async function handleAdminStockToggle(event) {
  const button = event.target.closest('[data-admin="toggle"]');
  if (!button) return;

  const id = button.getAttribute('data-id');
  const isActive = button.getAttribute('data-active') === 'true';

  await apiFetch(`/admin/stocks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: !isActive })
  });

  await loadAdminStocks();
}

async function refreshDashboard() {
  if (!state.session) return;
  await loadStocks();
  await loadQuotes();
  renderStocks();
  await loadPortfolio();
  await loadGuidance();

  if (state.profile?.role === 'admin') {
    await loadAdminStocks();
    await loadActivity();
  }
}

async function init() {
  setupNavigation();
  checkSystemHealth();

  elements.loginForm.addEventListener('submit', handleLogin);
  elements.signupForm.addEventListener('submit', handleSignup);
  elements.logoutBtn.addEventListener('click', handleLogout);
  elements.stocksTable.addEventListener('click', handleTrade);
  elements.addStockForm.addEventListener('submit', handleAddStock);
  elements.adminStocksTable.addEventListener('click', handleAdminStockToggle);
  elements.refreshStocks.addEventListener('click', refreshDashboard);
  elements.refreshPortfolio.addEventListener('click', loadPortfolio);
  elements.refreshAdminStocks.addEventListener('click', loadAdminStocks);

  const { data } = await supabaseClient.auth.getSession();
  state.session = data.session;
  if (state.session) {
    await loadProfile();
    await refreshDashboard();
  }

  setInterval(async () => {
    if (state.session) {
      await loadQuotes();
      renderStocks();
      await loadPortfolio();
    }
  }, 20000);
}

init();
