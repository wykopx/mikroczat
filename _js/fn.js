import { user } from './index.js';
export function markdownNewLineToBr(text) {
    return text.replace(/\n/g, '<br/>');
}
export function replaceAngleBrackets(text) {
    return text.replace(/</g, '&lt;');
}
export function markdownTextToSpan(text) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(text, 'text/html');
    let nodes = doc.body.childNodes;
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        if (node.nodeType === Node.TEXT_NODE && /\S/.test(node.nodeValue || '')) {
            let span = doc.createElement('span');
            span.appendChild(node.cloneNode());
            node.parentNode?.replaceChild(span, node);
        }
    }
    text = doc.body.innerHTML;
    return text;
}
export function markdownAsteriskToStrong(text) {
    return text.replace(/(^|\s|>|_)(\*\*|\*(?=[^\s\d]))([^*]+)(\*|\*\*)(<|_|,|;|\.|\s|$)/g, '$1<strong>$3</strong>$5');
}
export function markdownUnderscoreToItalics(text) {
    return text.replace(/(^|\s|>|\*)(_|__)([^_]+)(_|__)(<|\*|,|;|\.|\s|$)/g, '$1<i>$3</i>$5');
}
export function markdownBacktickToCode(text) {
    return text.replace(/([^`])(`|``|```|````)([^`]+)(`|``|```|````)([^`]|$)/g, '$1<code>$3</code>$5');
}
export function markdownUsernameToAbbr(text) {
    return text.replace(/(\B)@([\w-_]+):?/g, function (wholeMatch, textInFront, username) {
        if (username === user.username) {
            return `${textInFront}<abbr data-mention-user="${username}" class="mentions-you">@${username}</abbr>`;
        }
        else {
            return `${textInFront}<abbr data-mention-user="${username}">@${username}</abbr>`;
        }
    });
}
export function markdownExclamationMarkToSpoiler(text) {
    return text.replace(/^\s*!(.*)$/gm, '<span class="content-spoiler">$1</span>');
}
export function markdownGtToBlockquote(text) {
    return text.replace(/^\s*(>+)(.*)?$/gm, '<blockquote>$2</blockquote>');
}
export function markdownTagsToLink(text, currentChannelName) {
    return text.replace(/(\B)#([a-zA-Z0-9]+)/g, function (wholeMatch, textInFront, tag) {
        if (tag === currentChannelName) {
            return `${textInFront}<a class="href_channel currentChannel" href="/chat/${tag}">#${tag}</a>`;
        }
        else {
            return `${textInFront}<a class="href_channel" href="/chat/${tag}" target="_blank">#${tag}</a>`;
        }
    });
}
export function parseURLToLink(text) {
    let parts = text.split(/(<a[^>]*>.*?<\/a>)/g);
    for (let i = 0; i < parts.length; i++) {
        if (!parts[i].startsWith('<a')) {
            parts[i] = parts[i].replace(/((http(s*):\/\/)*[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))/g, '<a class="href_external" href="$1" target="mikroczat_opened">$1</a>');
        }
    }
    return parts.join('');
}
export function markdownToLink(text) {
    return text.replace(/\[(.*?)\]\((.*?)\)/g, function (_, text, url) {
        url = url.replace(/\s/g, '');
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }
        try {
            let newUrl = new URL(url);
            return '<a class="href_external" href="' + url + '" target="mikroczat_opened">' + text + '</a>';
        }
        catch (e) {
            return _;
        }
    });
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
export function addClass(el, classArray) {
    returnElementsArray(el).forEach((el) => {
        if (Array.isArray(classArray)) {
            el.classList.add(...classArray);
        }
        else {
            el.classList.add(classArray);
        }
    });
}
export function removeClass(el, classArray) {
    returnElementsArray(el).forEach((el) => {
        if (Array.isArray(classArray)) {
            el.classList.remove(...classArray);
        }
        else {
            el.classList.remove(classArray);
        }
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