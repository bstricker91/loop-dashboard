/* =============================================================
   Loop Customer Portal — Persona Module
   =============================================================
   Usage: include BEFORE the page's own <script> tag
     <script src="_persona.js"></script>

   Then at the bottom of each page's <script>:
     const persona = getPersona();
     preservePersonaLinks();
     // use persona.userName, persona.bxRef, etc.
   ============================================================= */

const PERSONAS = {
  A: {
    type: 'A',
    typeLabel: 'Official Distributor',
    typeTag: 'Seed / JV Partner',
    // User
    userName: 'Thabo Nkosi',
    userInitials: 'TN',
    userRole: 'Admin',
    orgName: 'Standard Bank Treasury',
    // Portal identifiers
    bxRef: 'BX-0042',
    // Balances
    totalBalance: 48247380.00,
    availableBalance: 8247380.00,
    lockedBalance: 40000000.00,
    hasLockedBalance: true,
    // Wallets
    wallets: [
      { label: 'FX Hot Desk', address: '7xKp4rNnLm8QpBw3mNwYsT9zR2kXvL6m', addressShort: '7xKp...3mNw', status: 'active' },
      { label: 'Cold Wallet',  address: '9mLqR2pXnK7wBv4tYsZrQxP8nM3kLqRw', addressShort: '9mLq...RqRw', status: 'active' },
    ],
    primaryWallet: { label: 'FX Hot Desk', address: '7xKp4rNnLm8QpBw3mNwYsT9zR2kXvL6m', addressShort: '7xKp...3mNw' },
    // Bank account
    bankName: 'Standard Bank',
    bankAccountMasked: '••••7412',
    // Distributor
    isDistributor: true,
    distributorTier: 'Official',          // 'Official' | 'Category2' | null
    distributorCode: 'DIST-001',
    distributorYieldRate: '6.00%',
    distributorYieldAccruedMonth: 24123.60,
    distributorYieldNextPaymentDate: '1 May 2026',
    distributorYieldLifetime: 142800.00,
    distributorClients: 3,               // number of sub-clients under this distributor
    // Luno wallet
    lunoWallet: {
      linked: true,
      label: 'Standard Bank — Luno Custody Wallet',
      address: '3xLm9pQrNkBv5wTy2nZsRxP7rK4mLqBz',
      addressShort: '3xLm...LqBz',
      lunoAccountId: 'LUNO-SBT-0042',
      balance: 12400000.00,
      lastSynced: '2 minutes ago',
      network: 'Solana',
    },
  },

  B1: {
    type: 'B1',
    typeLabel: 'Institutional Client',
    typeTag: 'Standard — no yield',
    userName: 'Aisha Mokoena',
    userInitials: 'AM',
    userRole: 'Admin',
    orgName: 'Cedar Money',
    bxRef: 'BX-0117',
    totalBalance: 12500000.00,
    availableBalance: 12500000.00,
    lockedBalance: 0,
    hasLockedBalance: false,
    wallets: [
      { label: 'Primary', address: '4pKnRmLqBx7wTv2nYsZxP9rM8kNqLpRt', addressShort: '4pKn...LpRt', status: 'active' },
    ],
    primaryWallet: { label: 'Primary', address: '4pKnRmLqBx7wTv2nYsZxP9rM8kNqLpRt', addressShort: '4pKn...LpRt' },
    bankName: 'Nedbank',
    bankAccountMasked: '••••3301',
    // Distributor
    isDistributor: false,
    distributorTier: null,
    distributorCode: null,
    distributorYieldRate: null,
    distributorYieldAccruedMonth: null,
    distributorYieldNextPaymentDate: null,
    distributorYieldLifetime: null,
    distributorClients: null,
    // Luno wallet
    lunoWallet: {
      linked: false,
      label: null,
      address: null,
      addressShort: null,
      lunoAccountId: null,
      balance: null,
      lastSynced: null,
      network: null,
    },
  },

  B2: {
    type: 'B2',
    typeLabel: 'Institutional Client',
    typeTag: 'Category 2 Distributor — with yield',
    userName: 'Kofi Vanderpuye',
    userInitials: 'KV',
    userRole: 'Admin',
    orgName: 'MoneyBadger',
    bxRef: 'BX-0083',
    totalBalance: 6200000.00,
    availableBalance: 6200000.00,
    lockedBalance: 0,
    hasLockedBalance: false,
    wallets: [
      { label: 'Hot Wallet', address: '8mRpNkLxBq7wTv3nYsZrP6rN9kMqLpZb', addressShort: '8mRp...LpZb', status: 'active' },
    ],
    primaryWallet: { label: 'Hot Wallet', address: '8mRpNkLxBq7wTv3nYsZrP6rN9kMqLpZb', addressShort: '8mRp...LpZb' },
    bankName: 'FNB',
    bankAccountMasked: '••••8844',
    // Distributor
    isDistributor: true,
    distributorTier: 'Category2',
    distributorCode: 'DIST-047',
    distributorYieldRate: '6.00%',
    distributorYieldAccruedMonth: 3100.00,
    distributorYieldNextPaymentDate: '1 May 2026',
    distributorYieldLifetime: 8400.00,
    distributorClients: 1,
    // Luno wallet
    lunoWallet: {
      linked: true,
      label: 'MoneyBadger — Luno Hot Wallet',
      address: '6rNmPkLxBq4wTv8nYsZrQ5rN2kMpLqZt',
      addressShort: '6rNm...LqZt',
      lunoAccountId: 'LUNO-MB-0083',
      balance: 3100000.00,
      lastSynced: '5 minutes ago',
      network: 'Solana',
    },
  },
};


/* ── getPersona ───────────────────────────────────────────────
   Reads ?type= from the current URL.
   Returns the matching PERSONAS entry, defaulting to A.
   ──────────────────────────────────────────────────────────── */
function getPersona() {
  var params = new URLSearchParams(window.location.search);
  var type = params.get('type') || 'A';
  return PERSONAS[type] || PERSONAS.A;
}


/* ── formatZAR ────────────────────────────────────────────────
   Formats a number as a ZAR currency string.
   e.g. 48247380 → "R 48,247,380.00"
   ──────────────────────────────────────────────────────────── */
function formatZAR(amount) {
  return 'R ' + amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


/* ── preservePersonaLinks ─────────────────────────────────────
   Appends ?type=X to all internal .html links so the persona
   carries forward across page navigation during a demo.
   ──────────────────────────────────────────────────────────── */
function preservePersonaLinks() {
  var params = new URLSearchParams(window.location.search);
  var type = params.get('type');
  if (!type) return;
  document.querySelectorAll('a[href]').forEach(function(a) {
    var href = a.getAttribute('href');
    if (href && href.endsWith('.html') && !href.includes('?') && !a.classList.contains('switch-profile-link')) {
      a.setAttribute('href', href + '?type=' + type);
    }
  });
}
