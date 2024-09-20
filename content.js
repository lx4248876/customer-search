console.log("Content script started loading");

function extractInfo(regex, content) {
    return [...new Set(content.match(regex) || [])];
}

function extractEmails(content) {
    return extractInfo(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g, content);
}

function extractCompanies(content) {
    const companyRegex = /(?:\b|^)(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\s+)?(?:Inc\.|LLC|Ltd\.|Corporation|Corp\.|Company|Co\.|Limited|Group|GmbH|AG|SA|SAS|BV|NV|PLC)\b/g;
    return extractInfo(companyRegex, content);
}

function extractTitles(content) {
    const titleRegex = /\b(?:CEO|CTO|CFO|COO|CIO|President|Vice President|Director|Manager|Supervisor|Executive|Officer|Founder|Co-founder)\b(?:\s+(?:of|at|for)\s+(?:[A-Z][a-z]+\s*){1,3})?/gi;
    return extractInfo(titleRegex, content);
}

function extractPhones(content) {
    const phoneRegexes = [
        // 北美格式
        /(?:\+1|1)?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
        // 国际格式（包括带括号的国家/地区代码）
        /\+\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
        // 英国格式
        /\+44\s?\(0\)\s?\d{2,5}\s?\d{5,8}/g,
        // 爱尔兰格式
        /\+353\s?\(0\)\s?\d{2,3}\s?\d{5,7}/g,
        // 澳大利亚格式
        /\+61\s?\d{1,2}\s?\d{4}\s?\d{4}/g,
        // 中国格式
        /\+86\s?1[3-9]\d{9}/g,
        // 日本格式
        /\+81\s?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{4}/g,
        // 德国格式
        /\+49\s?\d{2,5}[-.\s]?\d{5,10}/g,
        // 法国格式
        /\+33\s?\d{1,3}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}/g,
        // 印度格式
        /\+91\s?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,
        // 巴西格式
        /\+55\s?\d{2}[-.\s]?\d{4,5}[-.\s]?\d{4}/g,
        // 俄罗斯格式
        /\+7\s?\d{3}[-.\s]?\d{3}[-.\s]?\d{2}[-.\s]?\d{2}/g,
        // 西班牙格式
        /\+34\s?\d{2}[-.\s]?\d{3}[-.\s]?\d{3}/g,
        // 意大利格式
        /\+39\s?\d{2,4}[-.\s]?\d{4,8}/g,
        // 通用格式（可能会有一些误报，但可以捕获大多数其他格式）
        /(?:\+|00)[1-9]\d{0,3}[-.\s]?\d{1,14}(?:[-.\s]?\d{1,4})?/g
    ];

    let phones = [];
    for (const regex of phoneRegexes) {
        phones = phones.concat(extractInfo(regex, content));
    }
    return [...new Set(phones)]; // 去重
}

function extractSocialMedia(content) {
    const socialRegexes = {
        LinkedIn: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|company)\/[a-zA-Z0-9_-]+/g,
        Twitter: /(?:https?:\/\/)?(?:www\.)?twitter\.com\/[a-zA-Z0-9_]+/g,
        Facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:profile\.php\?id=\d+|[a-zA-Z0-9.]+)/g,
        Instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/[a-zA-Z0-9_\.]+/g,
        YouTube: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:channel\/|user\/)?[a-zA-Z0-9_-]+/g,
        TikTok: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+/g
    };

    let socialMedia = [];
    for (const [platform, regex] of Object.entries(socialRegexes)) {
        const matches = extractInfo(regex, content);
        socialMedia = socialMedia.concat(matches.map(match => `${platform}: ${match}`));
    }
    return socialMedia;
}

function extractUrls(content) {
    return extractInfo(/https?:\/\/[^\s]+/g, content);
}

function extractAddresses(content) {
    const addressRegexes = [
        // US Address
        /\d+\s+(?:[A-Z][a-z]+\s+){1,3}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Place|Pl|Court|Ct),\s+(?:[A-Z][a-z]+\s*)+,\s+[A-Z]{2}\s+\d{5}(?:-\d{4})?/g,
        // UK Address
        /\d+\s+(?:[A-Z][a-z]+\s+){1,3}(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr),\s+(?:[A-Z][a-z]+\s*)+,\s+[A-Z]{1,2}\d{1,2}\s+\d[A-Z]{2}/g,
        // General format (might catch other countries)
        /\d+\s+(?:[A-Z][a-z]+\s+){1,3}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Place|Pl|Court|Ct),\s+(?:[A-Z][a-z]+\s*)+,\s+[A-Z0-9\s]{3,10}/g
    ];

    let addresses = [];
    for (const regex of addressRegexes) {
        addresses = addresses.concat(extractInfo(regex, content));
    }
    return [...new Set(addresses)];
}

function extractWebsites(content) {
    const websiteRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?/g;
    return extractInfo(websiteRegex, content);
}

function associateInfo(infoArray) {
    let associated = [];
    const allInfo = infoArray.flat();

    allInfo.forEach((item, index) => {
        const nearbyItems = allInfo.slice(Math.max(0, index - 5), index).concat(allInfo.slice(index + 1, index + 6));
        const associatedItems = nearbyItems.filter(nearItem => nearItem !== item);
        associated.push({
            value: item,
            type: getInfoType(item, infoArray),
            associated: associatedItems
        });
    });

    return associated;
}

function getInfoType(item, infoArray) {
    const [emails, companies, titles, phones, socialMedia, urls, addresses, websites] = infoArray;
    if (emails.includes(item)) return 'email';
    if (companies.includes(item)) return 'company';
    if (titles.includes(item)) return 'title';
    if (phones.includes(item)) return 'phone';
    if (socialMedia.includes(item)) return 'social';
    if (urls.includes(item)) return 'url';
    if (addresses.includes(item)) return 'address';
    if (websites.includes(item)) return 'website';
    // 移除 names 的检查
    return 'unknown';
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractInfo") {
        const pageContent = document.body.innerText;
        const emails = extractEmails(pageContent);
        const companies = extractCompanies(pageContent);
        const titles = extractTitles(pageContent);
        const phones = extractPhones(pageContent);
        const socialMedia = extractSocialMedia(pageContent);
        const urls = extractUrls(pageContent);
        const addresses = extractAddresses(pageContent);
        const websites = extractWebsites(pageContent);
        // 移除 names
        const associated = associateInfo([emails, companies, titles, phones, socialMedia, urls, addresses, websites]);
        sendResponse({
            associated: associated,
            emails: emails,
            companies: companies,
            titles: titles,
            phones: phones,
            socialMedia: socialMedia,
            urls: urls,
            addresses: addresses,
            websites: websites
            // 移除 names
        });
    }
    return true;
});

console.log("Content script setup complete");
