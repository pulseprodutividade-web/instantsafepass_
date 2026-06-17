document.addEventListener('DOMContentLoaded', () => {
    // --- STATE & CONSTANTS ---
    let passwordHistory = JSON.parse(sessionStorage.getItem('instantsafepass_history')) || [];

    const CHAR_SETS = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?/~'
    };

    const AMBIGUOUS_CHARS = /[l1Io0O]/g;

    // --- DOM ELEMENTS ---
    // Navigation
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');
    const linkToGenerator = document.getElementById('link-to-generator');
    const linkToChecker = document.getElementById('link-to-checker');
    const linkToTips = document.getElementById('link-to-tips');

    // Generator Elements
    const generatedPwdInput = document.getElementById('generated-password');
    const btnCopy = document.getElementById('btn-copy');
    const btnRefresh = document.getElementById('btn-refresh');
    const strengthBadge = document.getElementById('strength-badge');
    const strengthBar = document.getElementById('strength-bar');
    const entropyInfo = document.getElementById('entropy-info');
    
    // Generator Configs
    const lengthSlider = document.getElementById('password-length');
    const lengthVal = document.getElementById('length-val');
    const chkUppercase = document.getElementById('chk-uppercase');
    const chkLowercase = document.getElementById('chk-lowercase');
    const chkNumbers = document.getElementById('chk-numbers');
    const chkSymbols = document.getElementById('chk-symbols');
    const chkExcludeAmbiguous = document.getElementById('chk-exclude-ambiguous');

    // History Elements
    const historyList = document.getElementById('history-list');
    const btnClearHistory = document.getElementById('btn-clear-history');

    // Checker Elements
    const checkPasswordInput = document.getElementById('check-password-input');
    const btnToggleVisibility = document.getElementById('btn-toggle-visibility');
    const btnVerifyLeak = document.getElementById('btn-verify-leak');
    const checkerSpinner = document.getElementById('checker-spinner');
    const liveStrengthBox = document.getElementById('live-strength-box');
    const liveStrengthBadge = document.getElementById('live-strength-badge');
    const liveStrengthBar = document.getElementById('live-strength-bar');
    const checkerResults = document.getElementById('checker-results');
    const bruteForceBox = document.getElementById('brute-force-box');
    const bruteForceTime = document.getElementById('brute-force-time');

    // Passphrase Elements
    const passphraseDisplay = document.getElementById('passphrase-display');
    const btnCopyPassphrase = document.getElementById('btn-copy-passphrase');
    const btnRefreshPassphrase = document.getElementById('btn-refresh-passphrase');

    // Cookie Banner Elements
    const cookieBanner = document.getElementById('cookie-consent-banner');
    const btnAcceptCookies = document.getElementById('btn-accept-cookies');

    // Icons inside buttons
    const iconCopy = btnCopy.querySelector('.icon-copy');
    const iconCheck = btnCopy.querySelector('.icon-check');
    const iconEye = btnToggleVisibility.querySelector('.icon-eye');
    const iconEyeOff = btnToggleVisibility.querySelector('.icon-eye-off');
    const iconCopyPass = btnCopyPassphrase.querySelector('.icon-copy-pass');
    const iconCheckPass = btnCopyPassphrase.querySelector('.icon-check-pass');

    // Portuguese Wordlist for Passphrase
    const PORTUGUESE_WORDS = [
        'tempo', 'sol', 'chuva', 'vento', 'terra', 'vida', 'amor', 'paz', 'luz', 'azul',
        'verde', 'mar', 'rio', 'floresta', 'pedra', 'areia', 'nuvem', 'fogo', 'calor', 'frio',
        'noite', 'dia', 'astro', 'estrela', 'lua', 'planta', 'flor', 'arvore', 'folha', 'fruta',
        'bicho', 'gato', 'cao', 'passaro', 'peixe', 'leao', 'livro', 'papel', 'caneta', 'mesa',
        'cadeira', 'porta', 'janela', 'casa', 'predio', 'cidade', 'estrada', 'ponte', 'carro', 'aviao',
        'trem', 'navio', 'porto', 'viagem', 'passo', 'caminho', 'sonho', 'mente', 'ideia', 'forca',
        'coragem', 'trabalho', 'estudo', 'jogo', 'festa', 'musica', 'danca', 'canto', 'riso',
        'olhar', 'ouvir', 'sentir', 'pensar', 'saber', 'criar', 'fazer', 'querer', 'poder', 'agir'
    ];

    // --- TAB SYSTEM NAVIGATION ---
    function switchTab(targetId) {
        tabs.forEach(tab => {
            const isActive = tab.id === targetId;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        const panelId = targetId.replace('tab-', 'panel-');
        panels.forEach(panel => {
            panel.classList.toggle('active', panel.id === panelId);
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.id);
        });
    });

    // Handle footer link jumps
    [linkToGenerator, linkToChecker, linkToTips].forEach(link => {
        if(link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = link.id.replace('link-to-', 'tab-');
                switchTab(tabId);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    });


    // --- CRYPTO PASSWORD GENERATOR LOGIC ---
    function generateSecurePassword() {
        let pool = '';
        let typesCount = 0;

        if (chkUppercase.checked) { pool += CHAR_SETS.uppercase; typesCount++; }
        if (chkLowercase.checked) { pool += CHAR_SETS.lowercase; typesCount++; }
        if (chkNumbers.checked) { pool += CHAR_SETS.numbers; typesCount++; }
        if (chkSymbols.checked) { pool += CHAR_SETS.symbols; typesCount++; }

        if (pool === '') {
            generatedPwdInput.value = 'Selecione pelo menos uma opção!';
            updateStrengthMeter('', 0);
            return;
        }

        if (chkExcludeAmbiguous.checked) {
            pool = pool.replace(AMBIGUOUS_CHARS, '');
        }

        const length = parseInt(lengthSlider.value, 10);
        let password = '';
        
        // Criptograficamente seguro
        const randomValues = new Uint32Array(length);
        window.crypto.getRandomValues(randomValues);

        for (let i = 0; i < length; i++) {
            password += pool[randomValues[i] % pool.length];
        }

        generatedPwdInput.value = password;

        // Calcular Entropia: E = log2(R^L) = L * log2(R)
        const poolSize = pool.length;
        const entropy = Math.round(length * Math.log2(poolSize));
        updateStrengthMeter(password, entropy);

        // Add to history
        addPasswordToHistory(password);
    }

    // --- STRENGTH METER LOGIC ---
    function updateStrengthMeter(password, entropy, isLive = false) {
        const badge = isLive ? liveStrengthBadge : strengthBadge;
        const bar = isLive ? liveStrengthBar : strengthBar;
        const infoText = isLive ? null : entropyInfo;

        if (!password) {
            badge.textContent = 'Aguardando...';
            badge.className = 'strength-badge empty';
            bar.className = 'strength-bar';
            if (infoText) infoText.textContent = '';
            return;
        }

        // Determine Strength Class based on Entropy
        let strengthClass = 'very-weak';
        let label = 'Muito Fraca';

        if (entropy >= 85) {
            strengthClass = 'secure';
            label = 'Impenetrável';
        } else if (entropy >= 70) {
            strengthClass = 'strong';
            label = 'Forte';
        } else if (entropy >= 55) {
            strengthClass = 'medium';
            label = 'Média';
        } else if (entropy >= 40) {
            strengthClass = 'weak';
            label = 'Fraca';
        }

        badge.textContent = label;
        badge.className = `strength-badge ${strengthClass}`;
        bar.className = `strength-bar ${strengthClass}`;
        
        if (infoText) {
            infoText.textContent = `Entropia: ${entropy} bits. Uma senha com essa força levaria bilhões de anos para ser quebrada por computadores normais.`;
        }
    }

    function calculateLiveEntropy(password) {
        if (!password) return 0;
        let poolSize = 0;
        if (/[a-z]/.test(password)) poolSize += CHAR_SETS.lowercase.length;
        if (/[A-Z]/.test(password)) poolSize += CHAR_SETS.uppercase.length;
        if (/[0-9]/.test(password)) poolSize += CHAR_SETS.numbers.length;
        if (/[^a-zA-Z0-9]/.test(password)) poolSize += CHAR_SETS.symbols.length;

        if (poolSize === 0) poolSize = 10; // default lower bound fallback
        return Math.round(password.length * Math.log2(poolSize));
    }

    // --- BRUTE FORCE SIMULATOR ---
    function getBruteForceTime(password) {
        if (!password) return '';
        
        let poolSize = 0;
        if (/[a-z]/.test(password)) poolSize += CHAR_SETS.lowercase.length;
        if (/[A-Z]/.test(password)) poolSize += CHAR_SETS.uppercase.length;
        if (/[0-9]/.test(password)) poolSize += CHAR_SETS.numbers.length;
        if (/[^a-zA-Z0-9]/.test(password)) poolSize += CHAR_SETS.symbols.length;
        
        if (poolSize === 0) poolSize = 10;
        
        const combinations = Math.pow(poolSize, password.length);
        
        // Assumindo 10 bilhões (10^10) de tentativas por segundo
        const attemptsPerSecond = 1e10;
        const seconds = combinations / attemptsPerSecond;
        
        return formatSecondsToReadable(seconds);
    }

    function formatSecondsToReadable(seconds) {
        if (seconds < 1) return 'Instantaneamente';
        if (seconds < 60) return `${Math.round(seconds)} segundos`;
        
        const minutes = seconds / 60;
        if (minutes < 60) return `${Math.round(minutes)} minutos`;
        
        const hours = minutes / 60;
        if (hours < 24) return `${Math.round(hours)} horas`;
        
        const days = hours / 24;
        if (days < 365) return `${Math.round(days)} dias`;
        
        const years = days / 365;
        if (years < 1000) return `${Math.round(years)} anos`;
        
        const centuries = years / 100;
        if (centuries < 10) return `${Math.round(centuries)} séculos`;
        
        return 'Milênios / Praticamente infinito';
    }

    // --- PASSPHRASE GENERATOR LOGIC ---
    function generatePassphrase() {
        const wordsCount = 4;
        const selectedWords = [];
        const randomValues = new Uint32Array(wordsCount);
        window.crypto.getRandomValues(randomValues);

        for (let i = 0; i < wordsCount; i++) {
            const index = randomValues[i] % PORTUGUESE_WORDS.length;
            selectedWords.push(PORTUGUESE_WORDS[index]);
        }

        const passphrase = selectedWords.join('-');
        passphraseDisplay.textContent = passphrase;
    }


    // --- HISTORY MANAGER ---
    function renderHistory() {
        if (passwordHistory.length === 0) {
            historyList.innerHTML = '<li class="empty-history">Nenhuma senha no histórico recente.</li>';
            return;
        }

        historyList.innerHTML = '';
        passwordHistory.forEach((pwd, idx) => {
            const li = document.createElement('li');
            li.className = 'history-item';
            
            // Masked password representation for safety
            const masked = pwd.substring(0, 3) + '••••••••' + pwd.substring(pwd.length - 3);

            li.innerHTML = `
                <span class="history-item-pwd" title="Clique para copiar a senha completa">${masked}</span>
                <div class="history-item-actions">
                    <button class="history-copy-btn" data-index="${idx}" title="Copiar Senha Completa">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                </div>
            `;
            historyList.appendChild(li);
        });

        // Add copy listeners to history elements
        document.querySelectorAll('.history-copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = btn.getAttribute('data-index');
                copyTextToClipboard(passwordHistory[idx]);
                
                // Visual feedback inside history item
                btn.style.color = 'var(--strength-strong)';
                setTimeout(() => {
                    btn.style.color = '';
                }, 1000);
            });
        });
    }

    function addPasswordToHistory(pwd) {
        // Prevent duplicate consecutive entries
        if (passwordHistory[0] === pwd) return;
        
        passwordHistory.unshift(pwd);
        if (passwordHistory.length > 5) {
            passwordHistory.pop();
        }
        sessionStorage.setItem('instantsafepass_history', JSON.stringify(passwordHistory));
        renderHistory();
    }

    // --- COPIER UTIL ---
    function copyTextToClipboard(text) {
        if (!navigator.clipboard) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
            } catch (err) {}
            document.body.removeChild(textArea);
            return;
        }

        navigator.clipboard.writeText(text);
    }

    // --- PASSWORDS CHECKER LOGIC (k-Anonymity & HIBP API) ---
    // Helper to calculate SHA-1 hash via Web Crypto API
    async function sha1(string) {
        const utf8 = new TextEncoder().encode(string);
        const hashBuffer = await crypto.subtle.digest('SHA-1', utf8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(bytes => bytes.toString(16).padStart(2, '0')).join('');
        return hashHex.toUpperCase();
    }

    async function checkLeakage(password) {
        if (!password) {
            showResult('warning', 'Por favor, digite uma senha para realizar a verificação.');
            return;
        }

        // Setup loading state
        btnVerifyLeak.disabled = true;
        checkerSpinner.classList.remove('hidden');
        checkerResults.classList.add('hidden');

        try {
            const hash = await sha1(password);
            const prefix = hash.slice(0, 5);
            const suffix = hash.slice(5);

            // Fetch range of hash suffixes
            const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
            if (!response.ok) {
                throw new Error('Falha ao consultar base de vazamentos.');
            }

            const dataText = await response.text();
            
            // Parse responses lines
            const lines = dataText.split('\n');
            let leakCount = 0;

            for (let line of lines) {
                const parts = line.split(':');
                if (parts[0].trim() === suffix) {
                    leakCount = parseInt(parts[1].trim(), 10);
                    break;
                }
            }

            if (leakCount > 0) {
                showResult('danger', `⚠️ <strong>Vulnerável!</strong> Esta senha já apareceu em <strong>${leakCount.toLocaleString()}</strong> vazamentos de dados conhecidos na internet. Recomendamos fortissimamente que <strong>NÃO USE</strong> esta senha.`);
            } else {
                // Verificar força local para dar a mensagem contextualizada correta
                const entropy = calculateLiveEntropy(password);
                if (entropy < 55) { // Muito Fraca ou Fraca
                    showResult('warning', `⚠️ <strong>Não vazada, mas insegura!</strong> Nenhuma ocorrência foi detectada em vazamentos conhecidos, porém esta senha é <strong>muito fraca/previsível</strong> e pode ser quebrada em segundos. Recomendamos gerar uma senha mais longa e complexa.`);
                } else {
                    showResult('success', `✨ <strong>Segura!</strong> Esta senha não consta em vazamentos conhecidos e possui uma excelente estrutura de segurança. Ótima escolha!`);
                }
            }

        } catch (error) {
            console.error(error);
            showResult('warning', 'Ocorreu um erro ao consultar a base de vazamentos de senhas. Verifique sua conexão com a internet e tente novamente.');
        } finally {
            btnVerifyLeak.disabled = false;
            checkerSpinner.classList.add('hidden');
        }
    }

    function showResult(type, message) {
        checkerResults.className = `results-box ${type}`;
        checkerResults.innerHTML = `
            <div class="results-title">${type === 'success' ? 'Verificação Limpa' : (type === 'danger' ? 'Alerta de Segurança' : 'Aviso')}</div>
            <div class="results-body">
                <p>${message}</p>
            </div>
        `;
        checkerResults.classList.remove('hidden');
    }


    // --- EVENTS LISTENERS ---
    // Slider Change
    lengthSlider.addEventListener('input', (e) => {
        lengthVal.textContent = e.target.value;
        generateSecurePassword();
    });

    // Refresh button click
    btnRefresh.addEventListener('click', () => {
        generateSecurePassword();
    });

    // Checkbox state updates trigger recalculation
    [chkUppercase, chkLowercase, chkNumbers, chkSymbols, chkExcludeAmbiguous].forEach(el => {
        el.addEventListener('change', () => generateSecurePassword());
    });

    // Copy to clipboard click
    btnCopy.addEventListener('click', () => {
        const pwd = generatedPwdInput.value;
        if (pwd && pwd !== 'Selecione pelo menos uma opção!') {
            copyTextToClipboard(pwd);
            
            // Animation/feedback switcher
            iconCopy.classList.add('hidden');
            iconCheck.classList.remove('hidden');
            btnCopy.style.borderColor = 'var(--strength-strong)';
            btnCopy.style.color = 'var(--strength-strong)';

            setTimeout(() => {
                iconCopy.classList.remove('hidden');
                iconCheck.classList.add('hidden');
                btnCopy.style.borderColor = '';
                btnCopy.style.color = '';
            }, 2000);
        }
    });

    // Clear history click
    btnClearHistory.addEventListener('click', () => {
        passwordHistory = [];
        sessionStorage.removeItem('shieldpass_history');
        renderHistory();
    });

    // Check password interactive feedback
    checkPasswordInput.addEventListener('input', (e) => {
        const pwd = e.target.value;
        if (pwd) {
            liveStrengthBox.classList.remove('hidden');
            bruteForceBox.classList.remove('hidden');
            const entropy = calculateLiveEntropy(pwd);
            updateStrengthMeter(pwd, entropy, true);
            bruteForceTime.textContent = getBruteForceTime(pwd);
        } else {
            liveStrengthBox.classList.add('hidden');
            bruteForceBox.classList.add('hidden');
        }
    });

    // Passphrase events
    btnRefreshPassphrase.addEventListener('click', () => {
        generatePassphrase();
    });

    btnCopyPassphrase.addEventListener('click', () => {
        const passphrase = passphraseDisplay.textContent;
        if (passphrase && passphrase !== 'Carregando frase...') {
            copyTextToClipboard(passphrase);
            
            iconCopyPass.classList.add('hidden');
            iconCheckPass.classList.remove('hidden');
            btnCopyPassphrase.style.borderColor = 'var(--strength-strong)';
            btnCopyPassphrase.style.color = 'var(--strength-strong)';

            setTimeout(() => {
                iconCopyPass.classList.remove('hidden');
                iconCheckPass.classList.add('hidden');
                btnCopyPassphrase.style.borderColor = '';
                btnCopyPassphrase.style.color = '';
            }, 2000);
        }
    });

    // Eye button to reveal typed password
    btnToggleVisibility.addEventListener('click', () => {
        if (checkPasswordInput.type === 'password') {
            checkPasswordInput.type = 'text';
            iconEye.classList.add('hidden');
            iconEyeOff.classList.remove('hidden');
        } else {
            checkPasswordInput.type = 'password';
            iconEye.classList.remove('hidden');
            iconEyeOff.classList.add('hidden');
        }
    });

    // Verify Leak Click
    btnVerifyLeak.addEventListener('click', () => {
        checkLeakage(checkPasswordInput.value);
    });

    // Enter press on password input triggers verification
    checkPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkLeakage(checkPasswordInput.value);
        }
    });


    // Cookie Banner events
    if (btnAcceptCookies && cookieBanner) {
        btnAcceptCookies.addEventListener('click', () => {
            localStorage.setItem('instantsafepass_cookies_accepted', 'true');
            // Animação de descida
            cookieBanner.style.animation = 'slideDown 0.4s ease-in forwards';
            setTimeout(() => {
                cookieBanner.classList.add('hidden');
            }, 400);
        });
    }

    // --- INITIALIZATION ---
    generateSecurePassword();
    generatePassphrase();
    renderHistory();
    
    // Check if user accepted cookies previously
    if (cookieBanner && !localStorage.getItem('instantsafepass_cookies_accepted')) {
        cookieBanner.classList.remove('hidden');
    }
});
