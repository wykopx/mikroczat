export function markdownNewLineToBr(text) {
    return text.replace(/\n/g, '<br/>');
}
export function markdownAsteriskToStrong(text) {
    return text.replace(/(\s|^)(\*\*|\*(?=[^\s\d]))([^*]+)(\*|\*\*)(,|;|\.|\s|$)/g, '$1<strong>$3</strong>$5');
}
export function markdownUnderscoreToItalics(text) {
    return text.replace(/(\s|^)(_|__)([^_]+)(_|__)(,|;|\s|\.|$)/g, '$1<i>$3</i>$5');
}
export function markdownBacktickToCode(text) {
    return text.replace(/([^`])(`|``|```|````)([^`]+)(`|``|```|````)([^`])/g, '$1<code>$3</code>$5');
}
export function markdownExclamationMarkToSpoiler(text) {
    return text.replace(/^\s*!(.*)$/gm, '<span class="content-spoiler">$1</span>');
}
export function markdownGtToBlackquote(text) {
    return text.replace(/^\s*(>+)(.*)$/gm, '<blockqoute>$2</blockqoute>');
}
export function parseURLToLink(text) {
    return text.replace(/^(https:\/\/|http:\/\/|https:\/\/www.|http:\/\/www.)(\S{3,})/g, '<a href="https://$1$2"> -- $1 -- $2 -- </a>');
}
export function markdownToLink(text) {
    return text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="mikroczat_opened">$1</a>');
}
export function show(el) {
    returnElementsArray(el).forEach((el) => {
        el.classList.add("show");
        el.classList.remove("hidden");
    });
}
export function hide(el) {
    returnElementsArray(el).forEach((el) => {
        el.classList.remove("show");
        el.classList.add("hidden");
    });
}
export function isAlphanumeric(text) {
    const regex = /^[a-z0-9]*$/i;
    return regex.test(text);
}
export function isAlphanumericDotHyphenUnderscore(text) {
    const regex = /^[a-z0-9._-]*$/i;
    return regex.test(text);
}
export function innerHTML(el, html) {
    returnElementsArray(el).forEach((el) => {
        el.innerHTML = html;
    });
}
function returnElementsArray(elementOrSelector) {
    if (typeof elementOrSelector === "string") {
        return document.querySelectorAll(elementOrSelector);
    }
    else if (Array.isArray(elementOrSelector) && elementOrSelector.every(item => item instanceof Element)) {
        return elementOrSelector;
    }
    else if (!Array.isArray(elementOrSelector) && elementOrSelector.nodeType === Node.ELEMENT_NODE) {
        return [elementOrSelector];
    }
}
function runWithDelay(time, f) {
    setTimeout(function () {
        f();
    }, time);
}
//# sourceMappingURL=fn.js.map