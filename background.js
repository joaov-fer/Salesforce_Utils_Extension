// background.js - Implementação baseada no Salesforce Inspector

// Padrões de URLs do Salesforce
const sfPatterns = [
  ".salesforce.com/",
  ".visual.force.com/",
  ".lightning.force.com/"
];

// Função para verificar a URL e habilitar/desabilitar a ação da extensão
function updateActionStatus(tabId, url) {
  if (url && sfPatterns.some(pattern => url.includes(pattern))) {
    
    // Se for uma página do Salesforce: Habilita o ícone e DEFINE o popup
    chrome.action.enable(tabId);
    chrome.action.setPopup({ tabId: tabId, popup: "popup.html" });
    chrome.action.setTitle({ tabId: tabId, title: "Quick Login As" });
  } else {

    
    // Se NÃO for uma página do Salesforce: Desabilita o ícone e REMOVE o popup
    chrome.action.disable(tabId);
    chrome.action.setPopup({ tabId: tabId, popup: "" }); // Popup vazio para desativar
    chrome.action.setTitle({ tabId: tabId, title: "Extensão inativa nesta página" });
  }
}

// Listener para quando uma aba é atualizada
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // A verificação 'changeInfo.status' evita execuções múltiplas durante o carregamento da página
  if (changeInfo.status === 'complete' && tab.url) {
      updateActionStatus(tabId, tab.url);
  }
});

// Listener para quando a aba ativa muda
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    // Verifica se a aba ainda existe antes de tentar acessar sua URL
    if (!chrome.runtime.lastError && tab.url) {
        updateActionStatus(activeInfo.tabId, tab.url);
    }
  });
});


function getSfHost(urlEntry) {
  const currentDomain = new URL(urlEntry).hostname;

  if (currentDomain.endsWith(".mcas.ms")) {
    sendResponse(currentDomain);
    return true;
  }

  // Verifica se é um domínio do Salesforce
  const isSalesforceDomain = currentDomain.includes('salesforce.com') || 
                            currentDomain.includes('force.com') || 
                            currentDomain.includes('cloudforce.com');
  
  if (!isSalesforceDomain) {
    sendResponse(null);
    return true;
  }

  // Tenta obter o cookie de sessão da URL atual
  const storeId = sender?.tab?.cookieStoreId;
  chrome.cookies.get({
    url: request.url, 
    name: "sid", 
    storeId: storeId
  }, cookie => {
    
    if (cookie) {
      // Se encontrou o cookie, extrai o Org ID e procura o domínio correto
      const [orgId] = cookie.value.split("!");
      
      // Lista de domínios para tentar (em ordem de prioridade)
      const orderedDomains = [
        "salesforce.com", 
        "cloudforce.com", 
        "salesforce.mil", 
        "cloudforce.mil", 
        "sfcrmproducts.cn", 
        "force.com"
      ];

      let domainsChecked = 0;
      let foundDomain = false;
      
      // Procura por cookies de sessão válidos
      orderedDomains.forEach(domain => {
        chrome.cookies.getAll({
          name: "sid", 
          domain: domain, 
          secure: true, 
          storeId: storeId
        }, cookies => {
          domainsChecked++;
          
          if (!foundDomain) {
            const sessionCookie = cookies.find(c => 
              c.value.startsWith(orgId + "!") && 
              c.domain !== "help.salesforce.com"
            );
            
            if (sessionCookie) {
              foundDomain = true;
              sendResponse(sessionCookie.domain);
            } else if (domainsChecked === orderedDomains.length) {
              // Se não encontrou em nenhum domínio, usa o domínio atual
              sendResponse(currentDomain);
            }
          }
        });
      });
    } else {
      // Se não encontrou cookie, usa o domínio atual
      sendResponse(currentDomain);
    }
  });
  return true;
}

// Listener principal para mensagens (continua igual)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  // Função para abrir janela anônima com login
  if (request.action === "openIncognitoLogin") {
    chrome.windows.create({
      url: request.url,
      incognito: true
    });
    return true;
  }

  // Função para obter o host do Salesforce
  if (request.message === "getSfHost") {
    const currentDomain = new URL(request.url).hostname;
    
    // Verifica se estamos em um domínio do Microsoft Defender
    if (currentDomain.endsWith(".mcas.ms")) {
      sendResponse(currentDomain);
      return true;
    }

    // Verifica se é um domínio do Salesforce
    const isSalesforceDomain = currentDomain.includes('salesforce.com') || 
                              currentDomain.includes('force.com') || 
                              currentDomain.includes('cloudforce.com');
    
    if (!isSalesforceDomain) {

      sendResponse(null);
      return true;
    }

    // Tenta obter o cookie de sessão da URL atual
    const storeId = sender?.tab?.cookieStoreId;
    chrome.cookies.get({
      url: request.url, 
      name: "sid", 
      storeId: storeId
    }, cookie => {
      
      if (cookie) {
        // Se encontrou o cookie, extrai o Org ID e procura o domínio correto
        const [orgId] = cookie.value.split("!");
        
        // Lista de domínios para tentar (em ordem de prioridade)
        const orderedDomains = [
          "salesforce.com", 
          "cloudforce.com", 
          "salesforce.mil", 
          "cloudforce.mil", 
          "sfcrmproducts.cn", 
          "force.com"
        ];

        let domainsChecked = 0;
        let foundDomain = false;
        
        // Procura por cookies de sessão válidos
        orderedDomains.forEach(domain => {
          chrome.cookies.getAll({
            name: "sid", 
            domain: domain, 
            secure: true, 
            storeId: storeId
          }, cookies => {
            domainsChecked++;
            
            if (!foundDomain) {
              const sessionCookie = cookies.find(c => 
                c.value.startsWith(orgId + "!") && 
                c.domain !== "help.salesforce.com"
              );
              
              if (sessionCookie) {
                foundDomain = true;
                sendResponse(sessionCookie.domain);
              } else if (domainsChecked === orderedDomains.length) {
                // Se não encontrou em nenhum domínio, usa o domínio atual
                sendResponse(currentDomain);
              }
            }
          });
        });
      } else {
        // Se não encontrou cookie, usa o domínio atual
        console.log('⚠️ Nenhum cookie encontrado, usando domínio atual:', currentDomain);
        sendResponse(currentDomain);
      }
    });
    return true;
  }

  // Função para obter a sessão atual
  if (request.message === "getSession") {
    const sfHost = request.sfHost;
    
    // Tenta obter o cookie de sessão do host especificado
    const storeId = sender?.tab?.cookieStoreId;
    chrome.cookies.get({
      url: "https://" + request.sfHost, 
      name: "sid", 
      storeId: storeId
    }, sessionCookie => {
      if (sessionCookie) {
        const session = {
          key: sessionCookie.value, 
          hostname: sessionCookie.domain
        };
        sendResponse(session);
      } else {
        // Se não encontrou no host especificado, tenta no domínio atual
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs[0] && tabs[0].url) {
            chrome.cookies.get({
              url: tabs[0].url, 
              name: "sid", 
              storeId: storeId
            }, fallbackCookie => {
              if (fallbackCookie) {
                const session = {
                  key: fallbackCookie.value, 
                  hostname: new URL(tabs[0].url).hostname
                };
                sendResponse(session);
              } else {
                sendResponse(null);
              }
            });
          } else {
            sendResponse(null);
          }
        });
      }
    });
    return true; // Indica que sendResponse será chamado assincronamente
  }

  // Função para criar janela (compatibilidade com Firefox)
  if (request.message === "createWindow") {
    const browser = typeof browser === "undefined" ? chrome : browser;
    browser.windows.create({
      url: request.url,
      incognito: request.incognito ?? false
    });
  }

  // Função para recarregar página
  if (request.message === "reloadPage") {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.reload(tabs[0].id);
    });
  }


  return false;
});


// inspect

// Adicione este código ao seu background.js

// Padrão de URL para páginas de registro no Lightning
const salesforceRecordPagePattern = "*://*.lightning.force.com/lightning/r/*/*/view*";

// Função para criar o menu de contexto
function createContextMenus() {
  chrome.contextMenus.create({
    id: "inspectRecord",
    title: "Inspect Record (API)",
    contexts: ["page"],
    documentUrlPatterns: [salesforceRecordPagePattern]
  });
}

// Criar o menu quando a extensão for instalada/atualizada
chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

// Listener para o clique no item do menu de contexto
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "inspectRecord") {
    
    // 1. Injeta um script para obter o ID e o SObject da URL
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getRecordDetailsFromUrl,
    });

    if (chrome.runtime.lastError || !injectionResults || injectionResults.length === 0) {
      console.error("Erro ao injetar o script:", chrome.runtime.lastError);
      return;
    }

    const recordDetails = injectionResults[0].result;
    if (recordDetails && recordDetails.recordId && recordDetails.sobjectName) {
      
      const sfHost = await new Promise(resolve => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          resolve(tabs[0].url);
        });
      });

      if (!sfHost) {
        console.error("Não foi possível determinar o sfHost.");
        return;
      }
      // 3. Monta a URL para a nossa página de inspeção com TODOS os parâmetros
      const inspectorUrl = chrome.runtime.getURL('inspector/inspector.html') +
        `?id=${recordDetails.recordId}` +
        `&sobject=${recordDetails.sobjectName}` +
        `&sfHost=${sfHost}`; // <-- Parâmetro sfHost adicionado!
      
      chrome.tabs.create({ url: inspectorUrl });

    } else {
      console.log('Não foi possível extrair o ID do registro da URL:', tab.url);
    }
  }
});

// Esta função será executada DENTRO da página do Salesforce
// para ler a URL e extrair as informações necessárias.
function getRecordDetailsFromUrl() {
  // Exemplo de URL: https://[...].lightning.force.com/lightning/r/Account/0018b00002ABCDEFAA/view
  const url = window.location.href;
  const match = url.match(/\/lightning\/r\/([a-zA-Z0-9_]+)\/([a-zA-Z0-9]{15,18})\/view/);
  
  if (match && match.length === 3) {
    return {
      sobjectName: match[1],
      recordId: match[2]
    };
  }
  return null;
}


// ===============================================
// O RESTO DO SEU CÓDIGO DO background.js CONTINUA AQUI...
// (as funções updateActionStatus, onUpdated, onActivated, onMessage, etc.)
// ===============================================

// background.js - Implementação baseada no Salesforce Inspector
// ... (seu código original) ...