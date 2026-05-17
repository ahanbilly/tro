// ============================================================
// auth.js — Autentikasi (Username/Password + Google OAuth)
// ============================================================

// ====== KONFIGURASI AKUN ======
// Tambah atau ubah akun di sini
const ACCOUNTS = [
  { username: 'admin',  password: 'tro2024',   name: 'Administrator',  role: 'admin' },
  { username: 'user1',  password: 'riset123',  name: 'Pengguna Satu',   role: 'user'  },
  { username: 'dosen',  password: 'dosen2024', name: 'Dosen TRO',       role: 'admin' },
  { username: 'ahan',   password: 'ahan123',   name: 'Ahan',            role: 'user'  },
];
// ==============================

// Cek apakah sudah login, jika iya redirect ke dashboard
(function checkSession() {
  const page = window.location.pathname;
  const isLoginPage = page.endsWith('index.html') || page === '/' || page.endsWith('/');
  const session = getSession();

  if (session && isLoginPage) {
    window.location.href = 'dashboard.html';
  } else if (!session && !isLoginPage) {
    window.location.href = 'index.html';
  }
})();

// ============================================================
// Login Manual (Username + Password)
// ============================================================
function doLogin() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    showAlert('Username dan password wajib diisi.');
    return;
  }

  const account = ACCOUNTS.find(
    a => a.username === username && a.password === password
  );

  if (!account) {
    showAlert('Username atau password salah. Coba lagi.');
    return;
  }

  saveSession({
    name: account.name,
    username: account.username,
    role: account.role,
    avatar: null,
    loginMethod: 'manual',
  });

  window.location.href = 'dashboard.html';
}

// Trigger Enter key untuk login
document.addEventListener('DOMContentLoaded', () => {
  const pwd = document.getElementById('password');
  if (pwd) {
    pwd.addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });
  }
  const usr = document.getElementById('username');
  if (usr) {
    usr.addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });
  }
});

// ============================================================
// Google OAuth Callback
// ============================================================
function handleGoogleLogin(response) {
  // Decode JWT credential dari Google
  const payload = parseJwt(response.credential);

  if (!payload || !payload.email) {
    showAlert('Login Google gagal. Coba lagi.');
    return;
  }

  saveSession({
    name: payload.name || payload.email,
    username: payload.email,
    role: 'user',
    avatar: payload.picture || null,
    loginMethod: 'google',
    email: payload.email,
  });

  window.location.href = 'dashboard.html';
}

// Trigger Google Sign-In popup secara manual
function triggerGoogleLogin() {
  // Cek apakah Google GSI sudah di-load
  if (typeof google === 'undefined' || !google.accounts) {
    showAlert('Google Sign-In belum siap. Pastikan Client ID sudah diisi di index.html dan koneksi internet aktif.');
    return;
  }
  google.accounts.id.prompt();
}

// ============================================================
// Session Management
// ============================================================
function saveSession(data) {
  sessionStorage.setItem('tro_session', JSON.stringify(data));
}

function getSession() {
  const raw = sessionStorage.getItem('tro_session');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function logout() {
  sessionStorage.removeItem('tro_session');

  // Sign out dari Google juga jika login via Google
  if (typeof google !== 'undefined' && google.accounts) {
    try { google.accounts.id.disableAutoSelect(); } catch(e) {}
  }

  window.location.href = 'index.html';
}

// ============================================================
// Helpers
// ============================================================
function showAlert(msg) {
  const el = document.getElementById('alertMsg');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4000);
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
    return JSON.parse(json);
  } catch { return null; }
}

// Isi info user di halaman (dipanggil di dashboard & halaman lain)
function renderUserInfo() {
  const session = getSession();
  if (!session) return;

  const nameEl = document.getElementById('userName');
  const roleEl = document.getElementById('userRole');
  const avatarEl = document.getElementById('userAvatar');

  if (nameEl) nameEl.textContent = session.name;
  if (roleEl) roleEl.textContent = session.role === 'admin' ? 'Administrator' : 'Pengguna';
  if (avatarEl) {
    if (session.avatar) {
      avatarEl.src = session.avatar;
      avatarEl.style.display = 'block';
    }
  }
}