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

    // Change Username
    const currentUsernameInput = document.getElementById('current-username');
    const newUsernameInput = document.getElementById('new-username');
    const changeUsernameBtn = document.getElementById('change-username-btn');
    const usernameStatus = document.getElementById('username-status');
    const usernameMsg = document.getElementById('username-msg');
    let usernameCheckTimeout = null;
    let isUsernameAvailable = false;

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
    const resultTitleInput = document.getElementById('result-title-input');
    const saveTitleBtn = document.getElementById('save-title-btn');
    const downloadBtn = document.getElementById('download-btn');
    const copyJsonBtn = document.getElementById('copy-json-btn');
    const historyList = document.getElementById('history-list');
    const refreshHistoryBtn = document.getElementById('refresh-history');

    let selectedFile = null;
    let currentTranscriptionId = null;
    let currentTranscriptionTitle = "";
    let originalTitle = "";
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

    // --- Detectar mudança no título ---
    resultTitleInput.addEventListener('input', () => {
        if (resultTitleInput.value !== originalTitle) {
            saveTitleBtn.style.display = 'inline-flex';
        } else {
            saveTitleBtn.style.display = 'none';
        }
        currentTranscriptionTitle = resultTitleInput.value;
    });

    // --- Salvar título ---
    saveTitleBtn.addEventListener('click', async () => {
        if (!currentTranscriptionId) return;

        saveTitleBtn.textContent = 'Salvando...';
        try {
            const response = await authFetch(`/api/history/${currentTranscriptionId}`, {
                method: 'PATCH',
                body: JSON.stringify({ title: resultTitleInput.value }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                originalTitle = resultTitleInput.value;
                saveTitleBtn.textContent = 'Salvo!';
                setTimeout(() => { saveTitleBtn.style.display = 'none'; saveTitleBtn.textContent = 'Salvar'; }, 1500);
                loadHistory(); // Atualizar lista
            } else {
                saveTitleBtn.textContent = 'Erro';
            }
        } catch (e) {
            saveTitleBtn.textContent = 'Erro';
        }
    });

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
        usernameMsg.textContent = '';
        newUsernameInput.value = '';
        usernameStatus.textContent = '';
        usernameStatus.className = 'input-status';
        changeUsernameBtn.disabled = true;
        isUsernameAvailable = false;

        // Preencher username atual
        const storedUsername = localStorage.getItem('username') || '';
        currentUsernameInput.value = storedUsername;
    });

    closeSettings.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    // --- Verificação de Username em tempo real ---
    newUsernameInput.addEventListener('input', () => {
        const value = newUsernameInput.value.trim();

        // Reset
        usernameStatus.textContent = '';
        usernameStatus.className = 'input-status';
        changeUsernameBtn.disabled = true;
        isUsernameAvailable = false;

        if (value.length < 3) {
            return;
        }

        // Debounce
        clearTimeout(usernameCheckTimeout);
        usernameStatus.textContent = '⏳';
        usernameStatus.className = 'input-status checking';

        usernameCheckTimeout = setTimeout(async () => {
            try {
                const response = await authFetch(`/api/check-username/${encodeURIComponent(value)}`);
                const data = await response.json();

                if (data.available) {
                    usernameStatus.textContent = '✓';
                    usernameStatus.className = 'input-status available';
                    changeUsernameBtn.disabled = false;
                    isUsernameAvailable = true;
                } else {
                    usernameStatus.textContent = '✗';
                    usernameStatus.className = 'input-status unavailable';
                    changeUsernameBtn.disabled = true;
                    isUsernameAvailable = false;
                }
            } catch (e) {
                usernameStatus.textContent = '?';
                usernameStatus.className = 'input-status';
            }
        }, 400);
    });

    // --- Alterar Username ---
    changeUsernameBtn.addEventListener('click', async () => {
        if (!isUsernameAvailable) return;

        usernameMsg.textContent = 'Processando...';
        usernameMsg.className = 'settings-msg';
        changeUsernameBtn.disabled = true;

        try {
            const response = await authFetch('/api/change-username', {
                method: 'POST',
                body: JSON.stringify({ newUsername: newUsernameInput.value.trim() }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();

            if (response.ok) {
                usernameMsg.className = 'settings-msg success';
                usernameMsg.textContent = '✓ Username alterado! Faça login novamente.';
                localStorage.setItem('username', data.username);
                currentUsernameInput.value = data.username;
                newUsernameInput.value = '';
                usernameStatus.textContent = '';
            } else {
                usernameMsg.className = 'settings-msg error';
                usernameMsg.textContent = data.error || 'Erro ao alterar.';
                changeUsernameBtn.disabled = false;
            }
        } catch (e) {
            usernameMsg.className = 'settings-msg error';
            usernameMsg.textContent = 'Erro de rede.';
            changeUsernameBtn.disabled = false;
        }
    });

    changePassBtn.addEventListener('click', async () => {
        passMsg.textContent = 'Processando...';
        passMsg.className = 'settings-msg';
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
                passMsg.className = 'settings-msg success';
                passMsg.textContent = '✓ Senha atualizada!';
                oldPass.value = '';
                newPass.value = '';
            } else {
                passMsg.className = 'settings-msg error';
                passMsg.textContent = data.error || 'Erro ao atualizar.';
            }
        } catch (e) {
            passMsg.className = 'settings-msg error';
            passMsg.textContent = 'Erro de rede.';
        }
    });

    createUserBtn.addEventListener('click', async () => {
        adminMsg.textContent = 'Processando...';
        adminMsg.className = 'settings-msg';
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
                adminMsg.className = 'settings-msg success';
                adminMsg.textContent = '✓ Usuário criado!';
                newUser.value = '';
                newPassUser.value = '';
            } else {
                adminMsg.className = 'settings-msg error';
                adminMsg.textContent = data.error || 'Erro ao criar.';
            }
        } catch (e) {
            adminMsg.className = 'settings-msg error';
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

            currentTranscriptionId = id;
            currentTranscriptionTitle = data.title || data.filename;
            originalTitle = currentTranscriptionTitle;

            resultTitleInput.value = currentTranscriptionTitle;
            saveTitleBtn.style.display = 'none';

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

            // Após nova transcrição, recarregar histórico para pegar o ID
            await loadHistory();

            currentTranscriptionTitle = data.title;
            originalTitle = data.title;
            resultTitleInput.value = data.title;
            saveTitleBtn.style.display = 'none';
            renderSegments(data.segments);

            resultContainer.classList.remove('hidden');
            resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
