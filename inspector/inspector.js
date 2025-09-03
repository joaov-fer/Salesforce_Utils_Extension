document.addEventListener('DOMContentLoaded', async () => {
    const apiVersion = 'v62.0';
    // --- Referências ao DOM ---
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');
    const table = document.getElementById('record-data-table');
    const tableBody = document.getElementById('record-data-body');
    const recordInfo = document.getElementById('record-info');
    const searchInput = document.getElementById('search-input');
    const actionsToolbar = document.getElementById('actions-toolbar');
    const btnMassEdit = document.getElementById('btn-mass-edit');
    const btnMassSave = document.getElementById('btn-mass-save');
    const btnMassCancel = document.getElementById('btn-mass-cancel');

    // --- Parâmetros e Cache ---
    const params = new URLSearchParams(window.location.search);
    const recordId = params.get('id');
    const sobjectName = params.get('sobject');
    const sfHost = params.get('sfHost');
    let sessionCache = null;
    let metadataMapCache = null;
    // --- MODIFICAÇÃO: Variável para armazenar o ID do metadado do objeto ---
    let sobjectDurableId = null; 
    let fieldIdMap = new Map();

    // --- Carregamento Inicial ---
    if (!recordId || !sobjectName || !sfHost) {
        showError("Record ID, SObject or sfHost not found in URL.");
        return;
    }
    recordInfo.textContent = `${sobjectName}: ${recordId}`;
    try {
        await loadData();
    } catch (err) {
        showError(err.message);
    } finally {
        loadingDiv.style.display = 'none';
    }

    // --- Listeners de Evento ---
    searchInput.addEventListener('keyup', handleSearch);
    btnMassEdit.addEventListener('click', () => toggleMassEditMode(true));
    btnMassCancel.addEventListener('click', () => toggleMassEditMode(false));
    btnMassSave.addEventListener('click', handleMassSave);

    // --- Funções Principais ---

    async function loadData() {
        sessionCache = await getSessionFromBackground();
        if (!sessionCache) throw new Error("Unable to get Salesforce session. Please check if you are logged in.");
        
        const headers = { 'Authorization': `Bearer ${sessionCache.key}` };

        // --- MODIFICAÇÃO INÍCIO: Buscar o DurableId do SObject ---
        const entityApiUrl = `https://${sessionCache.hostname}/services/data/${apiVersion}/query/?q=SELECT+DurableId+FROM+EntityDefinition+WHERE+QualifiedApiName='${sobjectName}'`;
        try {
            const entityResponse = await fetch(entityApiUrl, { headers });
            if (entityResponse.ok) {
                const entityData = await entityResponse.json();
                if (entityData.records.length > 0) {
                    sobjectDurableId = entityData.records[0].DurableId;
                }
            } else {
                console.warn(`Could not fetch SObject DurableId. Status: ${entityResponse.status}`);
            }
        } catch (e) {
            console.error('Error fetching SObject DurableId:', e);
        }

        if (sobjectDurableId) {
            const fieldDefinitionApiUrl = `https://${sessionCache.hostname}/services/data/${apiVersion}/tooling/query/?q=SELECT+DurableId,QualifiedApiName+FROM+FieldDefinition+WHERE+EntityDefinitionId='${sobjectDurableId}'`;
            try {
                const fieldDefResponse = await fetch(fieldDefinitionApiUrl, { headers });
                if (fieldDefResponse.ok) {
                    const fieldDefData = await fieldDefResponse.json();
                    for (const field of fieldDefData.records) {
                        // O QualifiedApiName é o mesmo que o API Name do campo
                        fieldIdMap.set(field.QualifiedApiName, field.DurableId);
                    }
                } else {
                    console.warn(`Could not fetch Field Definition IDs. Status: ${fieldDefResponse.status}`);
                }
            } catch (e) {
                console.error('Error fetching Field Definition IDs:', e);
            }
        }

        // --- MODIFICAÇÃO FIM ---

        const recordApiUrl = `https://${sessionCache.hostname}/services/data/${apiVersion}/sobjects/${sobjectName}/${recordId}`;
        const describeApiUrl = `https://${sessionCache.hostname}/services/data/${apiVersion}/sobjects/${sobjectName}/describe`;

        const [recordResponse, describeResponse] = await Promise.all([ fetch(recordApiUrl, { headers }), fetch(describeApiUrl, { headers }) ]);
        if (!recordResponse.ok || !describeResponse.ok) throw new Error(`Falha na API. Status do Registro: ${recordResponse.status}. Status do Describe: ${describeResponse.status}`);

        const [recordData, describeData] = await Promise.all([ recordResponse.json(), describeResponse.json() ]);

        metadataMapCache = describeData.fields.reduce((map, field) => {
            map.set(field.name, field); 
            return map;
        }, new Map());
        
        displayRecordData(recordData, metadataMapCache);
    }

    function displayRecordData(data, metadataMap) {
        tableBody.innerHTML = '';
        const sortedFields = Object.keys(data).sort();
    
        for (const fieldApiName of sortedFields) {
            if (fieldApiName === 'attributes') continue;
    
            const metadata = metadataMap.get(fieldApiName) || { name: fieldApiName, label: fieldApiName, type: 'N/A', updateable: false, custom: false };
            const value = data[fieldApiName];
            
            const row = tableBody.insertRow();
            row.dataset.apiName = fieldApiName;
            row.dataset.originalValue = JSON.stringify(value);
            if (!metadata.updateable) {
                row.classList.add('not-updateable');
            }
    
            row.insertCell().textContent = metadata.label;
            
            const apiNameCell = row.insertCell();
            const fieldDurableId = fieldIdMap.get(fieldApiName);
    
            if (sobjectName && fieldDurableId) {
               
                let finalFieldId = fieldDurableId;
                if (fieldDurableId.includes('.')) {
                    finalFieldId = fieldDurableId.split('.')[1];
                }

                const baseHost = sfHost.startsWith('http') ? sfHost : `https://${sfHost}`;
                const path = `/lightning/setup/ObjectManager/${sobjectName}/FieldsAndRelationships/${finalFieldId}/view`;
                const fieldSetupUrl = new URL(path, baseHost).href;
    
                apiNameCell.innerHTML = `<a href="${fieldSetupUrl}" target="_blank" title="Go to field setup page">${fieldApiName}</a>`;
            } else {
                apiNameCell.textContent = fieldApiName;
            }
            
            row.insertCell().textContent = metadata.type;
            row.insertCell().innerHTML = formatValueForDisplay(value, metadata);
        }
        actionsToolbar.style.display = 'flex';
        table.style.display = 'table';
        searchInput.style.display = 'block';
    }

    function toggleMassEditMode(isEditing) {
        btnMassEdit.style.display = isEditing ? 'none' : 'block';
        btnMassSave.style.display = isEditing ? 'block' : 'none';
        btnMassCancel.style.display = isEditing ? 'block' : 'none';
        searchInput.disabled = isEditing;

        for (const row of tableBody.rows) {
            const fieldApiName = row.dataset.apiName;
            const metadata = metadataMapCache.get(fieldApiName);
            if (!metadata || !metadata.updateable) continue;

            const valueCell = row.cells[3];
            const originalValue = JSON.parse(row.dataset.originalValue);

            if (isEditing) {
                const inputElement = createInputElement(metadata.type, originalValue);
                valueCell.innerHTML = '';
                valueCell.appendChild(inputElement);
            } else {
                valueCell.innerHTML = formatValueForDisplay(originalValue, metadata);
            }
        }
    }
    
    // ... (O resto do seu código, como handleMassSave, createInputElement, etc., continua igual)
    
    async function handleMassSave() {
        btnMassSave.disabled = true;
        btnMassSave.textContent = 'Saving...';

        const payload = {};
        for (const row of tableBody.rows) {
            const fieldApiName = row.dataset.apiName;
            const originalValueStr = row.dataset.originalValue;
            
            const input = row.cells[3].querySelector('input, textarea');
            if (!input) continue;

            let currentValue = input.type === 'checkbox' ? input.checked : input.value;
            if (currentValue === '') currentValue = null;

            if (JSON.stringify(currentValue) !== originalValueStr) {
                payload[fieldApiName] = currentValue;
            }
        }
        
        if (Object.keys(payload).length === 0) {
            showToast('No fields were changed.', 'info');
            toggleMassEditMode(false);
            btnMassSave.disabled = false;
            btnMassSave.textContent = 'Save Changes';
            return;
        }

        try {
            const session = await getSessionFromBackground();
            const recordApiUrl = `https://${session.hostname}/services/data/${apiVersion}/sobjects/${sobjectName}/${recordId}`;

            const response = await fetch(recordApiUrl, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${session.key}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData[0]?.message || 'Unknown error saving.');
            }
            
            showToast('Record updated successfully!', 'success');
            
            for (const row of tableBody.rows) {
                const input = row.cells[3].querySelector('input, textarea');
                if (input) {
                    let newValue = input.type === 'checkbox' ? input.checked : input.value;
                    if (newValue === '') newValue = null;
                    row.dataset.originalValue = JSON.stringify(newValue);
                }
            }
            toggleMassEditMode(false);
            loadData();

        } catch (err) {
            showToast(`Error saving: ${err.message}`, 'error');
        } finally {
            btnMassSave.disabled = false;
            btnMassSave.textContent = 'Save Changes';
        }
    }
    
    function createInputElement(type, value) {
        let inputElement;
        if (type === 'boolean') {
            inputElement = document.createElement('input');
            inputElement.type = 'checkbox';
            inputElement.checked = value;
        } else if (type === 'textarea') {
            inputElement = document.createElement('textarea');
            inputElement.rows = 3;
            inputElement.textContent = value ?? '';
        } else {
            inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.value = value ?? '';
        }
        return inputElement;
    }

    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        for (const row of tableBody.rows) {
            const rowText = row.textContent.toLowerCase();
            row.style.display = rowText.includes(searchTerm) ? '' : 'none';
        }
    }
    
    async function getSessionFromBackground() {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ message: "getSfHost", url: sfHost }, (sfHostParsed) => {
            chrome.runtime.sendMessage({ message: "getSession", sfHost: sfHostParsed }, (session) => {
                resolve(session);
            });
        });
      });
    }

    function formatValueForDisplay(value, metadata) {
        if (value === null) return '<i>null</i>';
        
        if (metadata.type === 'reference' && metadata.referenceTo && metadata.referenceTo.length > 0 && value) {
            const relatedSObjectName = metadata.referenceTo[0];
            const url = `inspector.html?id=${value}&sobject=${relatedSObjectName}&sfHost=${sfHost}`;
            return `<a href="${url}" title="Click to inspect ${relatedSObjectName} record">${value}</a>`;
        }
        
        let displayValue = '';
        if (typeof value === 'object') {
            displayValue = `<pre>${JSON.stringify(value, null, 2)}</pre>`;
        } else {
            const tempDiv = document.createElement('div');
            tempDiv.textContent = value;
            displayValue = tempDiv.innerHTML;
        }
        
        if (metadata.calculated && metadata.calculatedFormula) {
            return `
                <div class="value-formula-container">
                    <div class="value-part">${displayValue}</div>
                    <div class="formula-part">
                        <pre class="formula-code">${metadata.calculatedFormula}</pre>
                    </div>
                </div>
            `;
        }
        
        return displayValue;
    }

    function showError(message) {
      loadingDiv.style.display = 'none';
      errorDiv.style.display = 'block';
      errorDiv.textContent = `Erro: ${message}`;
    }

    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 4000);
    }
});