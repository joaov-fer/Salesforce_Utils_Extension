// exemplo-simples.js
// Exemplo simplificado da técnica de login anônimo do Salesforce Inspector

/**
 * EXEMPLO SIMPLIFICADO - Técnica de Login Anônimo
 * 
 * Este arquivo demonstra os conceitos básicos da técnica usada pelo Salesforce Inspector
 * para abrir janelas anônimas já logadas.
 */

// ============================================================================
// 1. CAPTURA DO COOKIE DE SESSÃO
// ============================================================================

/**
 * Obtém o cookie de sessão (sid) do Salesforce
 */
async function getSessionCookie(domain) {
    try {
        const cookie = await chrome.cookies.get({
            url: domain,
            name: 'sid'
        });
        
        if (cookie) {
            console.log('✅ Cookie de sessão encontrado:', cookie.value.substring(0, 20) + '...');
            return cookie.value;
        } else {
            console.error('❌ Cookie de sessão não encontrado');
            return null;
        }
    } catch (error) {
        console.error('❌ Erro ao obter cookie:', error);
        return null;
    }
}

// ============================================================================
// 2. CONSTRUÇÃO DA URL FRONTDOOR
// ============================================================================

/**
 * Constrói a URL de login anônimo usando frontdoor.jsp
 * Esta é a técnica principal do Salesforce Inspector
 */
function buildIncognitoLoginUrl(loginAsUrl, sessionId, domain) {
    if (!sessionId) {
        console.error('❌ Session ID é obrigatório');
        return null;
    }
    
    // O retURL para o frontdoor será a própria URL de "Login As"
    const finalRetUrl = encodeURIComponent(loginAsUrl);
    const frontdoorUrl = `${domain}/secur/frontdoor.jsp?sid=${sessionId}&retURL=${finalRetUrl}`;
    
    console.log('🔗 URL Frontdoor construída:', frontdoorUrl);
    return frontdoorUrl;
}

// ============================================================================
// 3. ABERTURA DA JANELA ANÔNIMA
// ============================================================================

/**
 * Abre uma janela anônima com login automático
 */
function openIncognitoWindow(url) {
    chrome.windows.create({
        url: url,
        incognito: true
    });
    console.log('🪟 Janela anônima aberta');
}

// ============================================================================
// 4. EXEMPLO DE USO COMPLETO
// ============================================================================

/**
 * Exemplo completo de como usar a técnica
 */
async function exemploCompleto() {
    // Configurações
    const domain = 'https://meuorg.my.salesforce.com';
    const targetUserId = '005XXXXXXXXXXXXXXX';
    
    // 1. Obtém o cookie de sessão
    const sessionId = await getSessionCookie(domain);
    if (!sessionId) {
        console.error('❌ Não foi possível obter a sessão');
        return;
    }
    
    // 2. Constrói a URL de "Login As"
    const loginAsUrl = `${domain}/servlet/servlet.su?oid=00DXXXXXXXXXXXXXXX&suorgadminid=${targetUserId}&retURL=%2F`;
    
    // 3. Constrói a URL frontdoor para login anônimo
    const incognitoUrl = buildIncognitoLoginUrl(loginAsUrl, sessionId, domain);
    if (!incognitoUrl) {
        console.error('❌ Não foi possível construir a URL anônima');
        return;
    }
    
    // 4. Abre a janela anônima
    openIncognitoWindow(incognitoUrl);
}

// ============================================================================
// 5. LISTENER PARA MENSAGENS DO POPUP
// ============================================================================

/**
 * Listener para receber mensagens do popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openIncognitoLogin") {
        console.log('📨 Mensagem recebida: abrir login anônimo');
        openIncognitoWindow(request.url);
        return true;
    }
});

// ============================================================================
// 6. FUNÇÃO PARA TESTAR A TÉCNICA
// ============================================================================

/**
 * Função para testar a técnica (chamada pelo popup)
 */
async function testarTecnica() {
    console.log('🧪 Iniciando teste da técnica de login anônimo...');
    
    // Simula uma URL de "Login As"
    const loginAsUrl = 'https://meuorg.my.salesforce.com/servlet/servlet.su?oid=00DXXXXXXXXXXXXXXX&suorgadminid=005XXXXXXXXXXXXXXX&retURL=%2F';
    
    // Obtém o domínio atual
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const domain = `https://${new URL(tab.url).hostname}`;
    
    // Obtém a sessão
    const sessionId = await getSessionCookie(domain);
    if (!sessionId) {
        alert('❌ Não foi possível obter a sessão. Certifique-se de estar logado no Salesforce.');
        return;
    }
    
    // Constrói a URL anônima
    const incognitoUrl = buildIncognitoLoginUrl(loginAsUrl, sessionId, domain);
    if (!incognitoUrl) {
        alert('❌ Não foi possível construir a URL anônima.');
        return;
    }
    
    // Abre a janela anônima
    openIncognitoWindow(incognitoUrl);
    console.log('✅ Teste concluído com sucesso!');
}

// ============================================================================
// 7. EXPLICAÇÃO DA TÉCNICA
// ============================================================================

/*
🎯 COMO A TÉCNICA FUNCIONA:

1. CAPTURA DO COOKIE:
   - A extensão lê o cookie 'sid' da sessão atual
   - Este cookie contém a autenticação do usuário

2. URL FRONTDOOR:
   - O Salesforce tem um endpoint especial: /secur/frontdoor.jsp
   - Este endpoint aceita um Session ID como parâmetro
   - Permite autenticar sem fazer login novamente

3. CONSTRUÇÃO DA URL:
   - Combina o frontdoor.jsp com o Session ID atual
   - Adiciona a URL de "Login As" como retURL
   - Resultado: URL que autentica e redireciona automaticamente

4. JANELA ANÔNIMA:
   - Abre uma nova janela anônima com a URL frontdoor
   - O Salesforce autentica automaticamente
   - Redireciona para o "Login As"
   - Usuário está logado como o usuário alvo

🔑 PONTOS IMPORTANTES:

- A técnica funciona porque o frontdoor.jsp aceita Session IDs válidos
- A janela anônima não compartilha cookies com a janela normal
- O Session ID é passado via URL, não via cookie
- O Salesforce redireciona automaticamente após autenticação

⚠️ LIMITAÇÕES:

- Funciona apenas com Session IDs válidos
- Requer permissão de cookies na extensão
- Funciona apenas em domínios autorizados
- Session ID pode expirar

✅ VANTAGENS:

- Não requer nova autenticação
- Mantém a sessão original intacta
- Funciona em janelas anônimas
- Compatível com diferentes domínios Salesforce
*/

// Exporta as funções para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getSessionCookie,
        buildIncognitoLoginUrl,
        openIncognitoWindow,
        exemploCompleto,
        testarTecnica
    };
}
