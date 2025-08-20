// popup.js - Implementação baseada no Salesforce Inspector

const state = {
    tabURL: "",
    domain: "",
    sessionId: null,
    lsr: 0,
    pageSize: 1000,
};

const UI = {
    menu: document.getElementById('menu'),
    loading: document.getElementById('loading'),
    usersContainer: document.getElementById('users'),
    viewDropdownContainer: document.getElementById('view-dropdown-container'),
    toggleColumnsBtn: document.getElementById('toggleAllColumns'),
    toggleLoginFilter: document.getElementById('toggleLoginAsFilter'),
    filterInput: document.getElementById('txtFilter'),
    filterStatus: document.getElementById('spFilterStatus'),
    navButtons: document.getElementById('navigationButtons'),
};

/**
 * Obtém o host do Salesforce baseado na URL atual
 */
async function getSfHost(url) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({
            message: "getSfHost",
            url: url
        }, (response) => {
            resolve(response);
        });
    });
}

/**
 * Obtém a sessão atual do Salesforce
 */
async function getSession(sfHost) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({
            message: "getSession",
            sfHost: sfHost
        }, (response) => {
            resolve(response);
        });
    });
}

/**
 * Constrói a URL de login anônimo usando frontdoor.jsp
 * Esta é a técnica principal do Salesforce Inspector
 */
function buildIncognitoLoginUrl(loginAsUrl, sessionId, domain) {
    if (!sessionId) {
        showError("Session ID is missing. Cannot create incognito login URL.");
        return null;
    }
    
    // O retURL para o frontdoor será a própria URL de "Login As"
    const finalRetUrl = encodeURIComponent(loginAsUrl);
    return `${domain}/secur/frontdoor.jsp?sid=${sessionId}&retURL=${finalRetUrl}`;
}

/**
 * Inicialização da extensão
 */
async function init() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
            state.tabURL = tab.url;
            const url = new URL(tab.url);
            state.domain = `https://${url.hostname}`;
            
            // Obtém o host do Salesforce
            const sfHost = await getSfHost(tab.url);
            
            if (sfHost) {
                // Obtém a sessão atual
                const session = await getSession(sfHost);
                console.log('🔑 Sessão obtida:', session ? 'Sim' : 'Não');
                
                if (session) {
                    state.sessionId = session.key;
                    state.domain = `https://${session.hostname}`;
                    console.log('✅ Iniciando busca de usuários...');
                    await requestUsers();
                    
                } else {
                    showError("Nenhuma sessão ativa encontrada. Certifique-se de estar logado no Salesforce.");
                }
            } else {
                showError("Não foi possível determinar o host do Salesforce. Verifique se está em uma página do Salesforce.");
            }
        } else {
            showError("Não foi possível obter informações da aba atual.");
        }
    } catch (error) {
        showError("Ocorreu um erro durante a inicialização.");
        console.error('❌ Erro na inicialização:', error);
    }
}

/**
 * Processa a tabela de usuários e modifica os links de login
 */
function processTable(table) {
    // Processa links de login
    table.querySelectorAll("td.actionColumn a").forEach(link => {
        if (link.textContent.includes('Login')) {
            const loginCell = link.parentElement;
            loginCell.classList.add("loginRow");
            loginCell.innerHTML = '';
            loginCell.appendChild(link);

            // Modifica a URL de login para incluir parâmetros necessários
            let sLogin = link.getAttribute("href");
            sLogin = sLogin.replace(/(&|\?)retURL=([^&]*)/, "").replace(/(&|\?)targetURL=([^&]*)/, "");
            sLogin += sLogin.includes('?') ? '&' : '?';
            sLogin += `isUserEntityOverride=1&retURL=${encodeURIComponent(state.tabURL)}&targetURL=${encodeURIComponent(state.tabURL)}`;
            
            const loginAsUrl = `${state.domain}${sLogin}`;
            
            // Constrói a URL de login anônimo usando frontdoor.jsp
            const incognitoUrl = buildIncognitoLoginUrl(loginAsUrl, state.sessionId, state.domain);

            // Atualiza o link para usar a URL anônima
            link.href = incognitoUrl;

            // Adiciona listener para abrir em janela anônima
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (incognitoUrl) {
                    chrome.runtime.sendMessage({ 
                        action: "openIncognitoLogin", 
                        url: incognitoUrl 
                    });
                    window.close();
                }
            });
        }

        // 1. Remove any images and the "Check All" checkbox
        const elementsToRemove = table.querySelectorAll('img, #allBox');
        elementsToRemove.forEach(el => el.remove());

        // 2. Remove inline event attributes and add hover effect
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            // Removing these attributes prevents some errors and conflicts
            row.removeAttribute('onblur');
            row.removeAttribute('onmouseout');
            row.removeAttribute('onfocus');
            row.removeAttribute('onmouseover');

            row.addEventListener('mouseenter', () => {
                row.classList.add('highlight');
            });
            row.addEventListener('mouseleave', () => {
                row.classList.remove('highlight');
            });
        });

    });

    // Processa outros links para abrir em nova aba
    table.querySelectorAll("a:not(.loginLink)").forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('https://') && href.startsWith('/')) {
            link.setAttribute("href", state.domain + href);
        }
        link.setAttribute("target", "_blank");
    });
}

/**
 * Busca a lista de usuários do Salesforce
 */
async function requestUsers(viewId = "", startNum = 0) {
    state.lsr = startNum;
    const filter = viewId ? `fcf=${viewId}&` : "";
    const usersPageUrl = `${state.domain}/005?isUserEntityOverride=1&${filter}rowsperpage=${state.pageSize}&lsr=${state.lsr}`;
    setLoading(true);
    try {
        const response = await fetch(usersPageUrl);
        const data = await response.text();
        const html = new DOMParser().parseFromString(data, "text/html");
        displayUsers(html);
    } catch (error) {
        showError("Failed to fetch user data. Are you logged into Salesforce?");
        console.error("Fetch Error:", error);
    } finally {
        setLoading(false);
    }

}

function displayUsers(doc) {
    UI.usersContainer.innerHTML = '';
    const table = doc.querySelector("div.setupBlock table.list");
    if (!table) {
        showError("Could not find the user table on the page.");
        return;
    }
    
    UI.usersContainer.appendChild(table);
    hideColumns(table);
  
    processTable(table);
    processViewDropdown(doc);
    processNavButtons(doc);
    
    UI.filterInput.value = '';
    UI.toggleLoginFilter.checked = true;
    UI.toggleColumnsBtn.textContent = "All Columns";
    
    const loginRows = table.querySelectorAll('.loginRow').length;
    const allRows = table.querySelectorAll('.dataRow').length;
    document.querySelector('.loginUsersOnlyRow').style.display = (loginRows < allRows) ? 'flex' : 'none';
    
    UI.menu.style.display = 'block';
    UI.filterInput.focus();

    changeLoginUserOnly(true);
}

/**
 * Processa o dropdown de visualização
 */
function processViewDropdown(doc) {
    const viewDropdown = doc.querySelector("select#fcf");
    if (viewDropdown) {
        viewDropdown.removeAttribute("onchange");
        UI.viewDropdownContainer.innerHTML = '';
        UI.viewDropdownContainer.appendChild(viewDropdown);
        viewDropdown.addEventListener('change', (e) => {
            requestUsers(e.target.value);
        });
    }
}

/**
 * Processa os botões de navegação
 */
function processNavButtons(doc) {
    UI.navButtons.innerHTML = '';
    const navLinks = doc.querySelectorAll(".listElementBottomNav div.next a");
    navLinks.forEach((link, index) => {
        if (index > 0) {
            UI.navButtons.append(" | ");
        }
        const newLink = link.cloneNode(true);
        newLink.href = "#";
        newLink.addEventListener('click', (e) => {
            e.preventDefault();
            const nextPage = e.target.textContent.toLowerCase().includes("next");
            requestUsers(
                document.querySelector("select#fcf").value,
                state.lsr + (nextPage ? state.pageSize : -state.pageSize)
            );
        });
        UI.navButtons.appendChild(newLink);
    });
}

/**
 * Oculta colunas da tabela
 */
function hideColumns(table) {
    table.querySelectorAll('tr').forEach(row => {
        Array.from(row.children).forEach((cell, index) => {
            if (index > 3) {
                cell.classList.add('hideColumn');
            } else {
                cell.classList.remove('hideColumn');
            }
        });
    });
}

/**
 * Configura os event listeners da interface
 */

function setupEventListeners() {
    // Toggle de colunas
    UI.toggleColumnsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const table = UI.usersContainer.querySelector('table.list');
        const hiddenCols = table.querySelectorAll('.hideColumn');
        if (hiddenCols.length > 0) {
            hiddenCols.forEach(col => col.classList.remove('hideColumn'));
            e.target.textContent = "Some Columns";
        } else {
            hideColumns(table);
            e.target.textContent = "All Columns";
        }
    });

    // Filtro de usuários com login
    UI.toggleLoginFilter.addEventListener('change', (e) => {
        const checked = e.target.checked;
        changeLoginUserOnly(checked);
        // UI.usersContainer.querySelectorAll('tr.dataRow').forEach(row => {
        //     const hasLogin = row.querySelector('td.loginRow');
        //     if (checked && !hasLogin) {
        //         row.style.display = 'none';
        //     } else {
        //         row.style.display = '';
        //     }
        // });
    });

    // Filtro de texto
    let typingTimer;
    UI.filterInput.addEventListener('keyup', () => {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(applyTextFilter, 250);
    });
}

function changeLoginUserOnly(checked) {
    UI.usersContainer.querySelectorAll('tr.dataRow').forEach(row => {
        const hasLogin = row.querySelector('td.loginRow');
        if (checked && !hasLogin) {
            row.style.display = 'none';
        } else {
            row.style.display = '';
        }
    });
}

/**
 * Aplica filtro de texto na tabela
 */
function applyTextFilter() {
    const filterText = UI.filterInput.value.toLowerCase();
    UI.filterStatus.textContent = "Filtering...";
    
    UI.usersContainer.querySelectorAll("tr.dataRow").forEach(row => {
        const textContent = row.textContent.toLowerCase();
        if (textContent.includes(filterText)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
    
    UI.filterStatus.textContent = "";

    if(filterText?.length === 0) {

        changeLoginUserOnly(UI.toggleLoginFilter.checked);
    }
}

/**
 * Controla o estado de carregamento
 */
function setLoading(isLoading) {
    UI.loading.style.display = isLoading ? 'block' : 'none';
    if (isLoading) {
        UI.menu.style.display = 'none';
        UI.usersContainer.innerHTML = '';
    }
}

/**
 * Exibe mensagens de erro
 */
function showError(message) {
    UI.loading.textContent = message;
    UI.loading.style.color = 'red';
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    init();
    setupEventListeners();
});