document.addEventListener('DOMContentLoaded', () => {
    // Auth & UI
    const loginOverlay = document.getElementById('login-overlay');
    const appWrapper = document.getElementById('app-wrapper');
    const usernameInput = document.getElementById('username-input');
    const passwordInput = document.getElementById('password-input');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    // Settings
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    const adminSection = document.getElementById('admin-section');

    // Change Password
    const oldPass = document.getElementById('old-pass');
    const newPass = document.getElementById('new-pass');
    const changePassBtn = document.getElementById('change-pass-btn');
    const passMsg = document.getElementById('pass-msg');

    // Admin Create User
    const newUser = document.getElementById('new-user-name');
    const newPassUser = document.getElementById('new-user-pass');
    const newRole = document.getElementById('new-user-role');
    const createUserBtn = document.getElementById('create-user-btn');
    const adminMsg = document.getElementById('admin-msg');

    // Main App
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const titleInput = document.getElementById('title-input');
    const promptInput = document.getElementById('prompt-input');
    const transcribeBtn = document.getElementById('transcribe-btn');
    const resultContainer = document.getElementById('result-container');
    const segmentsContainer = document.getElementById('segments-container');
    const resultTitle = document.getElementById('result-title');
    const downloadBtn = document.getElementById('download-btn');
    const copyJsonBtn = document.getElementById('copy-json-btn');
    const historyList = document.getElementById('history-list');
    const refreshHistoryBtn = document.getElementById('refresh-history');

    let selectedFile = null;
    let currentTranscriptionTitle = "";
    let currentSegments = [];
    let authToken = localStorage.getItem('authToken');
    let userRole = localStorage.getItem('userRole');

    // --- Helper: Formatar segundos para HH:MM:SS ---
    function formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // --- Renderizar Segmentos ---
    function renderSegments(segments) {
        currentSegments = segments || [];
        segmentsContainer.innerHTML = '';

        if (!segments || segments.length === 0) {
            segmentsContainer.innerHTML = '<p style="padding:1rem; color: #666;">Nenhum segmento disponível.</p>';
            return;
        }

        segments.forEach(seg => {
            const div = document.createElement('div');
            div.className = 'segment-item';
            div.innerHTML = `
                <span class="segment-time">${formatTime(seg.start)}</span>
                <span class="segment-text">${seg.text}</span>
            `;
            segmentsContainer.appendChild(div);
        });
    }

    // --- Autenticação ---
    checkAuthStatus();

    async function checkAuthStatus() {
        try {
            const res = await fetch('/api/config');
            const config = await res.json();

            if (config.authDisabled) {
                authToken = 'guest-token';
                localStorage.setItem('authDisabled', 'true');
                showApp(true);
            } else {
                localStorage.removeItem('authDisabled');
                if (authToken) {
                    showApp();
                } else {
                    showLogin();
                }
            }
        } catch (e) {
            console.error('Erro ao verificar config:', e);
            if (authToken) showApp(); else showLogin();
        }
    }

    function showApp(isPublic = false) {
        loginOverlay.style.display = 'none';
        appWrapper.style.display = 'flex';

        if (isPublic || localStorage.getItem('authDisabled') === 'true') {
            settingsBtn.style.display = 'none';
            logoutBtn.style.display = 'none';
            adminSection.style.display = 'none';
        } else {
            settingsBtn.style.display = 'block';
            logoutBtn.style.display = 'block';
            if (userRole === 'ADMIN') {
                adminSection.style.display = 'block';
            } else {
                adminSection.style.display = 'none';
            }
        }
        loadHistory();
    }

    function showLogin() {
        loginOverlay.style.display = 'flex';
        appWrapper.style.display = 'none';
        settingsModal.style.display = 'none';
        usernameInput.value = '';
        passwordInput.value = '';
        loginError.textContent = '';
    }

    async function login(username, password) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                authToken = data.token;
                userRole = data.role;
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('userRole', userRole);
                localStorage.setItem('username', data.username);
                showApp();
            } else {
                loginError.textContent = data.error || 'Credenciais inválidas.';
            }
        } catch (error) {
            loginError.textContent = 'Erro ao conectar com servidor.';
        }
    }

    loginBtn.addEventListener('click', () => {
        login(usernameInput.value, passwordInput.value);
    });

    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login(usernameInput.value, passwordInput.value);
    });

    logoutBtn.addEventListener('click', () => {
        authToken = null;
        userRole = null;
        localStorage.clear();
        showLogin();
    });

    // --- Settings Modal ---
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
        passMsg.textContent = '';
        adminMsg.textContent = '';
    });

    closeSettings.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    changePassBtn.addEventListener('click', async () => {
        passMsg.textContent = 'Processando...';
        passMsg.style.color = '#e2e8f0';
        try {
            const response = await authFetch('/api/change-password', {
                method: 'POST',
                body: JSON.stringify({
                    oldPassword: oldPass.value,
                    newPassword: newPass.value
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (response.ok) {
                passMsg.style.color = '#4ade80';
                passMsg.textContent = 'Sucesso!';
                oldPass.value = '';
                newPass.value = '';
            } else {
                passMsg.style.color = '#ef4444';
                passMsg.textContent = data.error || 'Erro.';
            }
        } catch (e) {
            passMsg.style.color = '#ef4444';
            passMsg.textContent = 'Erro de rede.';
        }
    });

    createUserBtn.addEventListener('click', async () => {
        adminMsg.textContent = 'Processando...';
        adminMsg.style.color = '#e2e8f0';
        try {
            const response = await authFetch('/api/users', {
                method: 'POST',
                body: JSON.stringify({
                    username: newUser.value,
                    password: newPassUser.value,
                    role: newRole.value
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (response.ok) {
                adminMsg.style.color = '#4ade80';
                adminMsg.textContent = 'Usuário criado!';
                newUser.value = '';
                newPassUser.value = '';
            } else {
                adminMsg.style.color = '#ef4444';
                adminMsg.textContent = data.error || 'Erro.';
            }
        } catch (e) {
            adminMsg.style.color = '#ef4444';
            adminMsg.textContent = 'Erro de rede.';
        }
    });

    // --- Helper Fetch Autenticado ---
    async function authFetch(url, options = {}) {
        if (!options.headers) options.headers = {};
        options.headers['Authorization'] = `Bearer ${authToken}`;

        const response = await fetch(url, options);

        if (response.status === 401 || response.status === 403) {
            const clone = response.clone();
            try {
                const err = await clone.json();
                if (err.error === 'Senha atual incorreta.') return response;
            } catch (e) { }

            if (response.status === 403 || (response.status === 401 && url !== '/api/change-password')) {
                logoutBtn.click();
                throw new Error('Sessão expirada.');
            }
        }

        return response;
    }

    // --- Histórico ---
    async function loadHistory() {
        if (!authToken) return;
        try {
            const response = await authFetch('/api/history');
            const history = await response.json();

            historyList.innerHTML = '';
            if (history.length === 0) {
                historyList.innerHTML = '<li style="padding:1rem; color: #666; font-size: 0.9rem;">Nenhuma transcrição encontrada.</li>';
                return;
            }

            history.forEach(item => {
                const li = document.createElement('li');
                li.className = 'history-item';

                li.innerHTML = `
                    <div class="history-title">${item.title || item.filename}</div>
                    <div class="history-date">${new Date(item.created_at).toLocaleString()}</div>
                `;
                li.addEventListener('click', () => loadTranscription(item.id));
                historyList.appendChild(li);
            });
        } catch (error) {
            console.error("Erro ao carregar histórico:", error);
        }
    }

    async function loadTranscription(id) {
        try {
            const response = await authFetch(`/api/history/${id}`);
            if (!response.ok) throw new Error('Não foi possível carregar.');

            const data = await response.json();

            resultTitle.textContent = data.title || data.filename;
            currentTranscriptionTitle = data.title || data.filename;
            renderSegments(data.segments);

            resultContainer.classList.remove('hidden');
            resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error("Erro ao carregar transcrição:", error);
        }
    }

    refreshHistoryBtn.addEventListener('click', loadHistory);

    // --- Upload e Transcrição ---
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');

        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFile(fileInput.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('audio/')) {
            alert('Por favor, selecione um arquivo de áudio válido.');
            return;
        }

        selectedFile = file;
        fileInfo.textContent = `Arquivo selecionado: ${file.name}`;
        fileInfo.classList.add('visible');

        if (!titleInput.value) {
            titleInput.value = file.name.split('.').slice(0, -1).join('.');
        }

        transcribeBtn.disabled = false;
        resultContainer.classList.add('hidden');
    }

    transcribeBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        transcribeBtn.classList.add('loading');
        transcribeBtn.disabled = true;

        const formData = new FormData();
        formData.append('audio', selectedFile);

        const prompt = promptInput.value;
        if (prompt) formData.append('prompt', prompt);

        const title = titleInput.value;
        if (title) formData.append('title', title);

        try {
            const response = await fetch('/api/transcribe', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    logoutBtn.click();
                    throw new Error('Sessão expirada.');
                }
                throw new Error(data.error || 'Erro na transcrição');
            }

            resultTitle.textContent = data.title;
            currentTranscriptionTitle = data.title;
            renderSegments(data.segments);

            resultContainer.classList.remove('hidden');
            resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            loadHistory();

        } catch (error) {
            console.error(error);
            alert(`Ocorreu um erro: ${error.message}`);
        } finally {
            transcribeBtn.classList.remove('loading');
            transcribeBtn.disabled = false;
        }
    });

    // --- Download MD com Timestamps ---
    downloadBtn.addEventListener('click', () => {
        let mdContent = `# ${currentTranscriptionTitle}\n\n`;

        currentSegments.forEach(seg => {
            mdContent += `[${formatTime(seg.start)}] ${seg.text}\n\n`;
        });

        const safeTitle = currentTranscriptionTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${safeTitle || 'transcricao'}.md`;

        const blob = new Blob([mdContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // --- Copiar JSON ---
    copyJsonBtn.addEventListener('click', () => {
        const json = JSON.stringify(currentSegments, null, 2);
        navigator.clipboard.writeText(json).then(() => {
            copyJsonBtn.textContent = 'Copiado!';
            setTimeout(() => { copyJsonBtn.textContent = 'Copiar JSON'; }, 2000);
        });
    });
});
