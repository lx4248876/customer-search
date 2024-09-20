chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "contentScriptLoaded") {
        console.log("内容脚本已在标签页加载:", sender.tab.id);
        sendResponse({status: "acknowledged"});
    } else if (request.action === "foundEmails") {
        console.log("背景脚本接收到邮箱:", request.emails);
        chrome.storage.local.set({[`emails_${sender.tab.id}`]: request.emails}, () => {
            console.log("邮箱已保存到本地存储");
            sendResponse({status: "success"});
        });
    }
    return true;
});

function injectContentScript(tabId) {
    chrome.tabs.executeScript(tabId, {file: 'content.js'}, () => {
        if (chrome.runtime.lastError) {
            console.error('执行脚本时出错:', chrome.runtime.lastError.message);
        } else {
            console.log('内容脚本已注入到标签页:', tabId);
        }
    });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
        injectContentScript(tabId);
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab.url && tab.url.startsWith('http')) {
            injectContentScript(activeInfo.tabId);
        }
    });
});
