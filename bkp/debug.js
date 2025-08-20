// debug.js - Ferramentas de debug para a extensão

/**
 * Função para testar se a extensão está funcionando corretamente
 */
async function debugExtension() {
    console.log('🔧 Iniciando debug da extensão...');
    
    try {
        // 1. Verificar se estamos em uma aba do Salesforce
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log('📋 Aba atual:', tab.url);
        
        if (!tab.url) {
            console.error('❌ Não foi possível obter a URL da aba atual');
            return;
        }
        
        const url = new URL(tab.url);
        console.log('🌐 Domínio:', url.hostname);
        console.log('🔗 Protocolo:', url.protocol);
        
        // 2. Verificar se é um domínio do Salesforce
        const isSalesforce = url.hostname.includes('salesforce.com') || 
                            url.hostname.includes('force.com') || 
                            url.hostname.includes('cloudforce.com');
        
        console.log('🏢 É domínio Salesforce?', isSalesforce);
        
        if (!isSalesforce) {
            console.error('❌ Não é um domínio do Salesforce');
            return;
        }
        
        // 3. Testar a função getSfHost
        console.log('🔍 Testando getSfHost...');
        const sfHost = await new Promise((resolve) => {
            chrome.runtime.sendMessage({
                message: "getSfHost",
                url: tab.url
            }, resolve);
        });
        
        console.log('🏢 Host do Salesforce:', sfHost);
        
        if (!sfHost) {
            console.error('❌ getSfHost retornou null');
            return;
        }
        
        // 4. Testar a função getSession
        console.log('🔑 Testando getSession...');
        const session = await new Promise((resolve) => {
            chrome.runtime.sendMessage({
                message: "getSession",
                sfHost: sfHost
            }, resolve);
        });
        
        console.log('🔑 Sessão:', session);
        
        if (!session) {
            console.error('❌ getSession retornou null');
            return;
        }
        
        // 5. Testar a construção da URL anônima
        console.log('🔗 Testando construção da URL anônima...');
        const testLoginAsUrl = `https://${sfHost}/servlet/servlet.su?oid=00DXXXXXXXXXXXXXXX&suorgadminid=005XXXXXXXXXXXXXXX&retURL=%2F`;
        const incognitoUrl = buildIncognitoLoginUrl(testLoginAsUrl, session.key, `https://${session.hostname}`);
        
        console.log('🔗 URL anônima construída:', incognitoUrl);
        
        // 6. Resumo do debug
        console.log('✅ Debug concluído com sucesso!');
        console.log('📊 Resumo:');
        console.log('  - Domínio Salesforce: ✅');
        console.log('  - Host detectado: ✅');
        console.log('  - Sessão obtida: ✅');
        console.log('  - URL anônima: ✅');
        
    } catch (error) {
        console.error('❌ Erro durante o debug:', error);
    }
}

/**
 * Função para verificar cookies do Salesforce
 */
async function debugCookies() {
    console.log('🍪 Debug de cookies...');
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Lista todos os cookies do domínio atual
        const cookies = await chrome.cookies.getAll({
            url: tab.url
        });
        
        console.log('🍪 Cookies encontrados:', cookies.length);
        
        cookies.forEach(cookie => {
            console.log(`  - ${cookie.name}: ${cookie.value.substring(0, 20)}...`);
        });
        
        // Procura especificamente pelo cookie 'sid'
        const sidCookie = await chrome.cookies.get({
            url: tab.url,
            name: 'sid'
        });
        
        if (sidCookie) {
            console.log('✅ Cookie sid encontrado:', sidCookie.value.substring(0, 20) + '...');
            console.log('🏢 Domínio do cookie:', sidCookie.domain);
            console.log('🔒 Seguro:', sidCookie.secure);
        } else {
            console.log('❌ Cookie sid não encontrado');
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar cookies:', error);
    }
}

/**
 * Função para testar a abertura de janela anônima
 */
async function testIncognitoWindow() {
    console.log('🪟 Testando abertura de janela anônima...');
    
    try {
        const testUrl = 'https://www.google.com';
        
        chrome.windows.create({
            url: testUrl,
            incognito: true
        });
        
        console.log('✅ Janela anônima aberta com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao abrir janela anônima:', error);
    }
}

/**
 * Função para verificar permissões da extensão
 */
async function checkPermissions() {
    console.log('🔐 Verificando permissões...');
    
    try {
        const permissions = await chrome.permissions.getAll();
        console.log('📋 Permissões ativas:', permissions);
        
        // Verifica permissões específicas
        const hasTabs = await chrome.permissions.contains({ permissions: ['tabs'] });
        const hasCookies = await chrome.permissions.contains({ permissions: ['cookies'] });
        const hasScripting = await chrome.permissions.contains({ permissions: ['scripting'] });
        
        console.log('📋 Permissões específicas:');
        console.log('  - tabs:', hasTabs);
        console.log('  - cookies:', hasCookies);
        console.log('  - scripting:', hasScripting);
        
    } catch (error) {
        console.error('❌ Erro ao verificar permissões:', error);
    }
}

/**
 * Função principal de debug
 */
async function runAllDebugTests() {
    console.log('🚀 Iniciando todos os testes de debug...');
    console.log('=====================================');
    
    await checkPermissions();
    console.log('-------------------------------------');
    
    await debugCookies();
    console.log('-------------------------------------');
    
    await debugExtension();
    console.log('-------------------------------------');
    
    await testIncognitoWindow();
    console.log('=====================================');
    console.log('🎉 Todos os testes concluídos!');
}

// Adiciona as funções ao objeto global para acesso via console
window.debugExtension = debugExtension;
window.debugCookies = debugCookies;
window.testIncognitoWindow = testIncognitoWindow;
window.checkPermissions = checkPermissions;
window.runAllDebugTests = runAllDebugTests;

// Função auxiliar para construir URL anônima (copiada do popup.js)
function buildIncognitoLoginUrl(loginAsUrl, sessionId, domain) {
    if (!sessionId) {
        console.error('❌ Session ID é obrigatório');
        return null;
    }
    
    const finalRetUrl = encodeURIComponent(loginAsUrl);
    return `${domain}/secur/frontdoor.jsp?sid=${sessionId}&retURL=${finalRetUrl}`;
}

console.log('🔧 Debug tools carregadas! Use:');
console.log('  - runAllDebugTests() para executar todos os testes');
console.log('  - debugExtension() para testar a extensão');
console.log('  - debugCookies() para verificar cookies');
console.log('  - testIncognitoWindow() para testar janela anônima');
console.log('  - checkPermissions() para verificar permissões');
