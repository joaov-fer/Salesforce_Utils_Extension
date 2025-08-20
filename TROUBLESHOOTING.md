# Guia de Troubleshooting - Salesforce Quick Login As

Este guia ajuda a resolver problemas comuns da extensão.

## 🚨 Erro: "Could not determine Salesforce host"

### Possíveis Causas:

1. **Não está em uma página do Salesforce**
   - Certifique-se de estar em uma página do Salesforce (salesforce.com, force.com, etc.)
   - A extensão só funciona em domínios autorizados

2. **Sessão não está ativa**
   - Faça login no Salesforce antes de usar a extensão
   - Verifique se não foi deslogado automaticamente

3. **Permissões da extensão**
   - Verifique se a extensão tem permissão para acessar cookies
   - Recarregue a extensão se necessário

### Como Debugar:

1. **Abra o Console do Desenvolvedor**
   - Pressione F12 ou Ctrl+Shift+I
   - Vá para a aba "Console"

2. **Execute os testes de debug**
   ```javascript
   runAllDebugTests()
   ```

3. **Verifique os logs**
   - Procure por mensagens de erro
   - Verifique se os cookies estão sendo encontrados

### Soluções:

#### Solução 1: Verificar Domínio
```javascript
// No console, execute:
const url = window.location.href;
console.log('URL atual:', url);
console.log('É Salesforce?', url.includes('salesforce.com') || url.includes('force.com'));
```

#### Solução 2: Verificar Cookies
```javascript
// No console, execute:
debugCookies()
```

#### Solução 3: Recarregar Extensão
1. Vá para `chrome://extensions/`
2. Encontre a extensão "Salesforce Quick Login As"
3. Clique em "Recarregar"
4. Tente novamente

## 🔧 Outros Problemas Comuns

### Erro: "No active session found"

**Causa**: Não há sessão ativa do Salesforce

**Solução**:
1. Faça login no Salesforce
2. Aguarde a página carregar completamente
3. Tente usar a extensão novamente

### Erro: "Failed to fetch user data"

**Causa**: Problema de rede ou permissões

**Solução**:
1. Verifique sua conexão com a internet
2. Recarregue a página do Salesforce
3. Verifique se tem permissão para acessar a lista de usuários

### Erro: "Could not get current tab information"

**Causa**: Problema com a API de abas do Chrome

**Solução**:
1. Feche e abra novamente a extensão
2. Verifique se a extensão tem permissão para acessar abas
3. Recarregue a extensão

## 🛠️ Ferramentas de Debug

### Funções Disponíveis no Console:

```javascript
// Executa todos os testes de debug
runAllDebugTests()

// Testa especificamente a extensão
debugExtension()

// Verifica cookies do Salesforce
debugCookies()

// Testa abertura de janela anônima
testIncognitoWindow()

// Verifica permissões da extensão
checkPermissions()
```

### Logs Importantes:

Procure por estas mensagens no console:

- ✅ **Sucesso**: "Host do Salesforce:", "Sessão obtida:", "URL anônima construída:"
- ⚠️ **Aviso**: "Usando domínio atual como fallback", "Nenhum cookie encontrado"
- ❌ **Erro**: "Não é um domínio do Salesforce", "Cookie sid não encontrado"

## 📋 Checklist de Verificação

Antes de reportar um problema, verifique:

- [ ] Está em uma página do Salesforce
- [ ] Está logado no Salesforce
- [ ] A extensão está habilitada
- [ ] Tem permissões necessárias
- [ ] Console não mostra erros
- [ ] Cookies estão sendo encontrados

## 🔍 Informações para Debug

Quando reportar um problema, inclua:

1. **URL da página**: Onde estava quando o erro ocorreu
2. **Mensagem de erro**: Exata mensagem mostrada
3. **Logs do console**: Saída do `runAllDebugTests()`
4. **Versão do Chrome**: Versão do navegador
5. **Versão da extensão**: Versão atual da extensão

## 🚀 Como Testar

1. **Teste Básico**:
   - Vá para uma página do Salesforce
   - Clique no ícone da extensão
   - Verifique se a lista de usuários carrega

2. **Teste de Login Anônimo**:
   - Clique em "Login" em um usuário
   - Verifique se uma janela anônima abre
   - Verifique se está logado como o usuário alvo

3. **Teste de Debug**:
   - Abra o console (F12)
   - Execute `runAllDebugTests()`
   - Verifique se todos os testes passam

## 📞 Suporte

Se o problema persistir:

1. Execute `runAllDebugTests()` e copie a saída
2. Verifique se está seguindo o checklist
3. Reporte o problema com todas as informações necessárias
