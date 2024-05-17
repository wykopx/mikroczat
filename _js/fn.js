import { dev, user } from './index.js';
export function markdownNewLineToBR(text, EntryObject) {
    return text.replace(/\n/g, '<br/>');
}
export function replaceAngleBrackets(text, EntryObject) {
    return text.replace(/</g, '&lt;');
}
export function markdownTextToSPAN(text, EntryObject) {
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
export function markdownAsteriskToSTRONG(text, EntryObject) {
    return text.replace(/(^|\s|>|_)(\*\*|\*(?=[^\s\d]))([^*]+)(\*|\*\*)(<|_|,|;|\.|\s|$)/g, '$1<strong>$3</strong>$5');
}
export function markdownUnderscoreToITALICS(text, EntryObject) {
    return text.replace(/(^|\s|>|\*)(_|__)([^_]+)(_|__)(<|\*|,|;|\.|\s|$)/g, '$1<i>$3</i>$5');
}
export function markdownBacktickToCODE(text, EntryObject) {
    return text.replace(/([^`])(`|``|```|````)([^`]+)(`|``|```|````)([^`]|$)/g, '$1<code>$3</code>$5');
}
export function markdownUsernameToABBR(text, EntryObject) {
    return text.replace(/(\B)@([\w-_]+):?/g, function (wholeMatch, textInFront, username) {
        if (username === user.username) {
            return `${textInFront}<abbr class="at">@</abbr><abbr data-username="${username}" data-channel="${EntryObject.channel.name}" class="username mentions-you">${username}</abbr>`;
        }
        else {
            return `${textInFront}<abbr class="at">@</abbr><abbr data-username="${username}" data-channel="${EntryObject.channel.name}" class="username">${username}</abbr>`;
        }
    });
}
export function markdownExclamationMarkToSPOILER(text, EntryObject) {
    return text.replace(/^\s*!(.*)$/gm, '<span class="content-spoiler">$1</span>');
}
export function markdownGtToBLOCKQUOTE(text, EntryObject) {
    return text.replace(/^\s*(>+)(.*)?$/gm, '<blockquote>$2</blockquote>');
}
export function markdownTagsToANCHOR(text, EntryObject) {
    return text.replace(/(\B)#([a-zA-Z0-9]+)/g, function (wholeMatch, textInFront, tag) {
        if (tag === EntryObject.channel.name) {
            return `${textInFront}<a class="href_channel currentChannel" href="/chat/${tag}" tabindex="-1">#${tag}</a>`;
        }
        else {
            return `${textInFront}<a class="href_channel" href="/chat/${tag}" target="_blank" tabindex="-1" title='Otwórz kanał "#${tag}" w nowym oknie MikroCzata'>#${tag}</a>`;
        }
    });
}
export function parseURLToANCHOR(text, EntryObject) {
    let parts = text.split(/(<a[^>]*>.*?<\/a>)/g);
    for (let i = 0; i < parts.length; i++) {
        if (!parts[i].startsWith('<a')) {
            parts[i] = parts[i].replace(/((http(s*):\/\/)*[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#,?&//=]*))/g, '<a class="href_external" href="$1" target="mikroczat_opened">$1</a>');
        }
    }
    return parts.join('');
}
export function markdownToANCHOR(text, EntryObject) {
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
export function show(element) {
    if (dev)
        console.log(`show() | el: `, element);
    returnElementsArray(element).forEach((el) => {
        el.classList.add("show");
        el.classList.remove("hidden");
    });
}
export function hide(element) {
    if (dev)
        console.log(`hide() | el: `, element);
    returnElementsArray(element).forEach((el) => {
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
export function innerText(el, text) {
    returnElementsArray(el).forEach((el) => {
        el.innerText = text;
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
export function getPrefixedFlagsArray(messageContent) {
    const regex = /^([\-+\/]\S*\s*)+/;
    const match = messageContent.match(regex);
    if (!match)
        return [[], messageContent];
    const flagsArray = match[0].split(/\s+/).filter(str => str !== "").map(part => part.replace(/^[-+\/]+/, ''));
    const remainingMessage = messageContent.slice(match[0].length).trim();
    return [flagsArray, remainingMessage];
}
export function areSomeValuesInArray(array, values) {
    return values.some(value => array.includes(value));
}
export function getEmbedVideoIDCodeFromYouTubeURL(url) {
    const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        const videoID = match[2];
        return videoID;
    }
    else {
        return false;
    }
}
export function messageIDtoHexColor(id, lightOrDark = "dark", HEXorRGBorRGBA = "hex", alpha = 1) {
    id = id * 2654435761 % Math.pow(2, 32);
    let color;
    let rgbRed = id & 255;
    let rgbGreen = (id >> 8) & 255;
    let rgbBlue = (id >> 16) & 255;
    const luminance = 0.299 * rgbRed + 0.587 * rgbGreen + 0.114 * rgbBlue;
    if (luminance < 128 && lightOrDark === "light") {
        rgbRed = 255 - rgbRed;
        rgbGreen = 255 - rgbGreen;
        rgbBlue = 255 - rgbBlue;
    }
    else if (luminance > 128 && lightOrDark === "dark") {
        rgbRed = Math.floor(rgbRed / 2);
        rgbGreen = Math.floor(rgbGreen / 2);
        rgbBlue = Math.floor(rgbBlue / 2);
    }
    if (HEXorRGBorRGBA.toLowerCase() == "hex") {
        const hexRed = rgbRed.toString(16).padStart(2, '0');
        const hexGreen = rgbGreen.toString(16).padStart(2, '0');
        const hexBlue = rgbBlue.toString(16).padStart(2, '0');
        color = '#' + hexRed + hexGreen + hexBlue;
    }
    else if (HEXorRGBorRGBA.toLowerCase().startsWith("rgb")) {
        color = HEXorRGBorRGBA == "rgba" ? `rgba(${rgbRed} ${rgbGreen} ${rgbBlue} / ${alpha})` : `rgb(${rgbRed} ${rgbGreen} ${rgbBlue})`;
    }
    return color;
}
export function toggle01(property) {
    if (property === undefined) {
        return 1;
    }
    else if (typeof property === 'string') {
        return property === "1" ? "0" : "1";
    }
    else if (typeof property === 'number') {
        return property === 1 ? 0 : 1;
    }
}
export function isValidDate(dateString) {
    return !isNaN(Date.parse(dateString));
}
//# sourceMappingURL=fn.js.map