let currentInfo = {
    associated: [],
    emails: [],
    companies: [],
    titles: [],
    phones: [],
    socialMedia: [],
    urls: [],
    addresses: [],
    websites: []
};

function createInfoItem(info) {
    const div = document.createElement('div');
    div.className = 'info-item';

    const typeSpan = document.createElement('span');
    typeSpan.className = 'info-type';
    typeSpan.textContent = `${info.type}:`;
    div.appendChild(typeSpan);

    const valueSpan = document.createElement('span');
    valueSpan.className = 'info-value';
    valueSpan.textContent = info.value;
    div.appendChild(valueSpan);

    const button = document.createElement('button');
    button.textContent = 'Copy';
    button.className = 'copy-btn';
    button.onclick = () => {
        navigator.clipboard.writeText(info.value).then(() => {
            button.textContent = 'Copied';
            setTimeout(() => {
                button.textContent = 'Copy';
            }, 2000);
        });
    };
    div.appendChild(button);

    return div;
}

function updateInfoList(info, filter = 'all', sortOrder = 'asc') {
    currentInfo = {...currentInfo, ...info};
    const infoList = document.getElementById('infoList');
    infoList.innerHTML = '<h2>Extracted Information:</h2>';

    const infoTypes = ['emails', 'companies', 'titles', 'phones', 'socialMedia', 'urls', 'addresses', 'websites'];
    const typeNames = {
        'emails': 'Emails', 'companies': 'Companies', 'titles': 'Titles',
        'phones': 'Phones', 'socialMedia': 'Social Media', 'urls': 'URLs',
        'addresses': 'Addresses', 'websites': 'Websites'
    };

    infoTypes.forEach(type => {
        if (filter === 'all' || filter === type) {
            if (info[type].length > 0) {
                const typeDiv = document.createElement('div');
                typeDiv.innerHTML = `<h3>${typeNames[type]}:</h3>`;
                let sortedItems = [...info[type]].sort();
                if (sortOrder === 'desc') {
                    sortedItems.reverse();
                }
                sortedItems.forEach(item => {
                    const associatedItem = info.associated.find(a => a.value === item);
                    typeDiv.appendChild(createInfoItem(associatedItem || {type: typeNames[type], value: item}));
                });
                infoList.appendChild(typeDiv);
            }
        }
    });
}

function extractInfo() {
    setStatus('Extracting information...');
    document.getElementById('loadingIndicator').style.display = 'block';
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "extractInfo"}, function (response) {
            document.getElementById('loadingIndicator').style.display = 'none';
            if (chrome.runtime.lastError) {
                console.error("Error sending message to content script:", chrome.runtime.lastError);
                setStatus('Failed to extract information. Please refresh the page and try again.');
            } else if (response) {
                updateInfoList(response);
                setStatus('Information extraction complete');
            }
        });
    });
}

function copyAllInfo() {
    let allInfo = '';
    Object.entries(currentInfo).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
            allInfo += `${key}:\n${value.join('\n')}\n\n`;
        }
    });
    navigator.clipboard.writeText(allInfo).then(() => {
        setStatus('All information copied to clipboard');
    });
}

function exportToCsv() {
    let csvContent = "data:text/csv;charset=utf-8,";
    Object.entries(currentInfo).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
            csvContent += `${key}\n${value.join('\n')}\n\n`;
        }
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "customer_info.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function setStatus(message) {
    document.getElementById('status').textContent = message;
}

function exportInfo() {
    const data = JSON.stringify(currentInfo);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_info.json';
    a.click();
    URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', () => {
    extractInfo();

    document.getElementById('refreshBtn').addEventListener('click', () => {
        chrome.tabs.reload();
        setTimeout(extractInfo, 1000);
    });

    document.getElementById('exportBtn').addEventListener('click', exportToCsv);
    document.getElementById('copyAllBtn').addEventListener('click', copyAllInfo);

    document.getElementById('filterType').addEventListener('change', (e) => {
        updateInfoList(currentInfo, e.target.value, document.getElementById('sortOrder').value);
    });

    document.getElementById('sortOrder').addEventListener('change', (e) => {
        updateInfoList(currentInfo, document.getElementById('filterType').value, e.target.value);
    });
});
