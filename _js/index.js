'use strict';
import * as api from './wykop_api.js';
import * as CONST from './const.js';
import { settings, setSettings } from './settings.js';
import * as T from './types.js';
import * as ch from './ch.js';
import * as login from './login.js';
import * as fn from './fn.js';
import * as qr from '../_js-lib/qrcodegen.js';
let nightMode = localStorage.getItem('nightMode');
export let wykopDomain = "https://wykop.pl";
let wxDomain = "https://wykopx.pl";
let mikroczatDomain = "https://mikroczat.pl";
export const root = document.documentElement;
export const head = document.head;
export const body = document.body;
export const main = document.getElementById("main");
export const centerHeader = document.getElementById("centerHeader");
export const youtubeIframe = document.getElementById("youtubeIframe");
export const chooseChannelDialog = document.querySelector("#chooseChannelDialog");
if (dev) {
    settings.highlightQuick = true;
    settings.promoFooter.enable = true;
    settings.promoFooter.emoji = true;
    settings.promoFooter.label = true;
    settings.promoFooter.roomInfo = true;
    settings.tabTitle.unreadMentionsBadge.enabled = true;
    settings.tabTitle.unreadMentionsBadge.showIcon = true;
    settings.tabTitle.unreadMentionsBadge.showCount = true;
    settings.tabTitle.unreadMessagesBadge.enabled = true;
    settings.tabTitle.unreadMessagesBadge.showIcon = true;
    settings.tabTitle.unreadMessagesBadge.showCount = true;
}
if (!settings.promoFooter.enable && (settings.promoFooter.emoji || settings.promoFooter.label || settings.promoFooter.roomInfo || settings.promoFooter.mikroczatLinks))
    settings.promoFooter.enable = true;
const lennyArray = ["ᘳಠ ͟ʖಠᘰ", "¯\\\_(ツ)\_/¯"];
export const openedChannels = new Map();
export const activeChannels = [null, null];
if (dev) {
    test();
    var intervalID = setInterval(test, 1000);
    function test() {
    }
}
export const sounds = {
    logged_in: new Audio(`/_sounds/${settings.sounds.logged_in.file}`),
    logged_out: new Audio(`/_sounds/${settings.sounds.logged_out.file}`),
    outgoing_entry: new Audio(`/_sounds/${settings.sounds.outgoing_entry.file}`),
    outgoing_comment: new Audio(`/_sounds/${settings.sounds.outgoing_comment.file}`),
    incoming_entry: new Audio(`/_sounds/${settings.sounds.incoming_entry.file}`),
    incoming_comment: new Audio(`/_sounds/${settings.sounds.incoming_comment.file}`),
    incoming_mention: new Audio(`/_sounds/${settings.sounds.incoming_mention.file}`),
};
if (/Mobi|Android/i.test(navigator.userAgent)) {
    root.dataset.device = "mobile";
}
else {
    root.dataset.device = "desktop";
}
export function generateTabTitle(ChannelObject) {
    let tabTitle = "";
    if (settings.tabTitle.unreadMentionsBadge.enabled && ChannelObject.unreadMentionsCount > 0) {
        if (settings.tabTitle.unreadMentionsBadge.showIcon) {
            tabTitle += `${settings.tabTitle.unreadMentionsBadge.icon} `;
        }
        if (settings.tabTitle.unreadMentionsBadge.showCount) {
            tabTitle += `(`;
            tabTitle += ChannelObject.unreadMentionsCount;
            if (settings.tabTitle.unreadMessagesBadge.enabled && settings.tabTitle.unreadMessagesBadge.showCount) {
                tabTitle += `/${ChannelObject.unreadMessagesCount}`;
            }
            tabTitle += `) `;
        }
        else if (settings.tabTitle.unreadMessagesBadge.showCount) {
            tabTitle += `(${ChannelObject.unreadMessagesCount}) `;
        }
    }
    else if (settings.tabTitle.unreadMessagesBadge.enabled && ChannelObject.unreadMessagesCount > 0) {
        if (settings.tabTitle.unreadMessagesBadge.showIcon) {
            tabTitle += `${settings.tabTitle.unreadMessagesBadge.icon} `;
        }
        if (settings.tabTitle.unreadMessagesBadge.showCount) {
            tabTitle += `(${ChannelObject.unreadMessagesCount}) `;
        }
    }
    tabTitle += CONST.ChannelsSpecialMap.has(ChannelObject.name) ? CONST.ChannelsSpecialMap.get(ChannelObject.name).tabTitle : ChannelObject.name;
    tabTitle += ` | ${CONST.tabTitleTemplate}`;
    return tabTitle;
}
document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
        if (activeChannels[0] && activeChannels[0].loadingStatus == "loaded") {
            activeChannels[0].unreadMessagesCount = 0;
            activeChannels[0].unreadMentionsCount = 0;
            window.top.document.title = generateTabTitle(activeChannels[0]);
        }
    }
    else if (document.visibilityState === 'hidden') {
    }
});
Split({
    columnGutters: [{
            track: 1,
            element: document.querySelector('.gutter-column-1'),
        }, {
            track: 3,
            element: document.querySelector('.gutter-column-3'),
        }],
    rowGutters: [{
            track: 1,
            element: document.querySelector('.gutter-row-1'),
        }, {
            track: 3,
            element: document.querySelector('.gutter-row-3'),
        }]
});
window.addEventListener("offline", (e) => {
});
window.addEventListener("online", (e) => {
});
window.youtubeswitch = function () {
    const array = ["tr", "trsmall", "cl", "cc", "horizontalcenter", "horizontalbottom", "hidden"];
    const currentIndex = array.indexOf(main.dataset.youtubePlayer);
    const nextIndex = (currentIndex + 1) % array.length;
    main.dataset.youtubePlayer = array[nextIndex];
};
window.spotifyswitch = function () {
    if (main.dataset.spotifyPlayer == "tc" && main.dataset.youtubePlayer != "tr")
        main.dataset.spotifyPlayer = "tr";
    else if (main.dataset.spotifyPlayer == "hidden")
        main.dataset.spotifyPlayer = "tc";
    else
        main.dataset.spotifyPlayer = "hidden";
};
window.onload = function () {
    fn.toggleNightMode(nightMode);
};
(function hotChannelsFn() {
    if (hotChannels && hotChannels.length > 0 && chooseChannelDialog) {
        hotChannels.forEach(hotChanelName => {
            chooseChannelDialog.querySelector(`#${hotChanelName}`)?.classList.add("hotChannel");
        });
    }
})();
document.addEventListener('DOMContentLoaded', (DOMContentLoadedEvent) => {
    if (!dev)
        console.clear();
    document.querySelector("#showChannelDialogButton").addEventListener("click", function (e) {
        chooseChannelDialog.showModal();
    });
    document.querySelector("#closeChannelDialogButton").addEventListener("click", function (e) {
        chooseChannelDialog.close();
    });
    function supportsPopover() {
        return HTMLElement.prototype.hasOwnProperty("popover");
    }
    const popoverSupported = supportsPopover();
    document.body.addEventListener(`mouseover`, function (e) {
        let target = e.target;
        if (settings.highlightQuick && target.closest("article.messageArticle[data-entry-id]")) {
            const messageArticle = target.closest(`.messageArticle[data-entry-id]`);
            const channelFeed = target.closest(`.channelFeed`);
            if (messageArticle && !messageArticle.classList.contains(`discussionView`) && !messageArticle.classList.contains(`highlightQuick`) && !channelFeed.dataset.discussionViewEntryId) {
                if (messageArticle.classList.contains(`comment`)) {
                    messageArticle.classList.add(`highlightQuick`);
                    ch.highlight(`.messageArticle.entry[data-id="${messageArticle.dataset.entryId}"]`, `highlightQuick`);
                    ch.mouseOutAddEventListenerRemoveHighlightQuick(messageArticle);
                }
                else if (messageArticle.classList.contains("entry") && messageArticle.dataset.commentsCount != "0") {
                    messageArticle.classList.add(`highlightQuick`);
                    ch.highlight(`.messageArticle.comment[data-entry-id="${messageArticle.dataset.entryId}"]`, `highlightQuick`);
                    ch.mouseOutAddEventListenerRemoveHighlightQuick(messageArticle);
                }
            }
        }
    });
    document.body.addEventListener('contextmenu', function (e) {
        if (!settings.rightClickOnUsernameShowContextMenu) {
            let target = e.target;
            let usernameAHref = target.closest(`.username`);
            if (usernameAHref && usernameAHref.dataset.username) {
                e.preventDefault();
            }
        }
    });
    document.body.addEventListener("mousedown", async (e) => {
        const target = e.target;
        const usernameAHref = target.closest(`.username`);
        if (usernameAHref && usernameAHref.dataset.username) {
            e.preventDefault();
            ch.fetch.fetchOnHold = 2;
            const username = `@${usernameAHref.dataset.username}`;
            if (e.button === 0) {
                if (settings.leftClickOnUsernameInsertsToNewMessage || settings.leftClickOnUsernameSetsReplyEntry) {
                    const ChannelObject = openedChannels.get(usernameAHref.dataset.channel);
                    if (!ChannelObject)
                        return;
                    const channelFeed = ChannelObject.elements.channelFeed;
                    if (!channelFeed)
                        return;
                    const newMessageTextareaContainer = ChannelObject.elements.newMessageTextareaContainer;
                    const newMessageTextarea = ChannelObject.elements.newMessageTextarea;
                    if (!newMessageTextarea || !newMessageTextareaContainer)
                        return false;
                    const messageArticle = usernameAHref.closest(".messageArticle");
                    if (!messageArticle)
                        return false;
                    const MessageObject = messageArticle.dataset.resource === "entry" ? ChannelObject.entries.get(parseInt(messageArticle.dataset.id)) : ChannelObject.comments.get(parseInt(messageArticle.dataset.id));
                    const messageEntryId = MessageObject.entry_id;
                    if (settings.leftClickOnUsernameSetsReplyEntry) {
                        if (!newMessageTextareaContainer.dataset.entryId) {
                            ch.setReplyEntryID(ChannelObject, MessageObject);
                        }
                    }
                    if (settings.leftClickOnUsernameInsertsToNewMessage) {
                        let pasteText = "";
                        if (newMessageTextarea.innerText != "") {
                            if (newMessageTextarea.innerText.includes(username))
                                return false;
                            pasteText = "<span> </span>";
                        }
                        pasteText += `<span class="entryUser" contenteditable="true"><abbr class="${usernameAHref.getAttribute('class')}" data-channel="nocnazmiana" data-username="${usernameAHref.dataset.username}"><span class="username_span">@${usernameAHref.dataset.username}</span></abbr></span><span contenteditable="true"> </span>`;
                        pasteText = newMessageTextarea.innerHTML.trimEnd() + pasteText;
                        newMessageTextarea.innerHTML = pasteText;
                        var range = document.createRange();
                        var sel = window.getSelection();
                        var lastChild = newMessageTextarea.lastChild;
                        var textNode = lastChild.firstChild;
                        range.setStart(textNode, 1);
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                }
            }
            else if (e.button === 2) {
                if (settings.rightClickOnUsernameCopiesToClipboard) {
                    navigator.permissions.query({ name: 'clipboard-read' }).then(permissionStatus => {
                        if (permissionStatus.state == 'granted' || permissionStatus.state == 'prompt') {
                            navigator.clipboard.readText().then((clipboardText) => {
                                let newClipboardText = username;
                                if (clipboardText.startsWith('@')) {
                                    if (!clipboardText.includes(username))
                                        newClipboardText = clipboardText + ', ' + username;
                                }
                                navigator.permissions.query({ name: 'clipboard-write' }).then(permissionStatus => {
                                    if (permissionStatus.state == 'granted' || permissionStatus.state == 'prompt') {
                                        navigator.clipboard.writeText(newClipboardText)
                                            .then(() => {
                                        })
                                            .catch(err => {
                                            console.error('Failed to copy username: ', err);
                                        });
                                    }
                                    else {
                                        console.error('Clipboard write permission denied');
                                    }
                                });
                            }).catch(() => {
                                console.error('Clipboard read permission denied');
                            });
                        }
                        else {
                            console.error('Clipboard read permission denied');
                        }
                    });
                }
            }
            else if (e.button === 1) {
            }
        }
    });
    document.body.addEventListener("mouseup", async (e) => {
        const target = e.target;
        const usernameAHref = target.closest(`.username`);
        if (usernameAHref && usernameAHref.dataset.username) {
            e.preventDefault();
        }
        console.log("mouseup, event: ", e);
        console.log("mouseup, target: ", target);
    });
    function openImageURLInNewWindow(args) {
        if (!args.src)
            return;
        let windowFeatures = "popup";
        const imageHeight = parseInt(args.height) || 600;
        const screenHeight = window.screen.height;
        const screenWidth = window.screen.width;
        const imageWidth = parseInt(args.width) || 800;
        const windowHeight = imageHeight < screenHeight ? imageHeight : screenHeight;
        const windowWidth = imageHeight < screenHeight ? imageWidth : imageWidth + 20;
        const topPosition = imageHeight < screenHeight ? (screenHeight - windowHeight) / 2 : 0;
        const leftPosition = (screenWidth - windowWidth) / 2;
        windowFeatures += `,width=${windowWidth},height=${windowHeight},left=${leftPosition},top=${topPosition}`;
        const imageWindow = window.open(args.src, 'image', windowFeatures);
        if (!imageWindow) {
            return null;
        }
    }
    document.body.addEventListener("click", async function (e) {
        let target = e.target;
        if (target.tagName === 'IMG' && target.classList.contains('entryImage')) {
            const entryImage = target;
            e.preventDefault();
            openImageURLInNewWindow({ src: entryImage.dataset.full, width: entryImage.dataset.width, height: entryImage.dataset.height });
            return true;
        }
        if (target.tagName === 'BUTTON' && target.classList.contains('loadOlderMessagesButton')) {
            e.preventDefault();
            const channelName = target.closest(".channelFeed").dataset.channel;
            const ChannelObject = openedChannels.get(channelName);
            const loadOlderMessagesButton = target.closest("button.loadOlderMessagesButton");
            if (dev)
                console.log(`Przycisk "Wczytaj starsze wiadomości na kanale" obecnie na kanale jest: [${ChannelObject.entries.size}] wpisów i [${ChannelObject.comments.size}] komentarzy `);
            if (loadOlderMessagesButton) {
                let olderEntriesArray = await api.getXNewestEntriesFromChannelFromPageHash(ChannelObject, ChannelObject.pagination.next, settings.fetch.numberOfEntries2ndPreload);
                if (olderEntriesArray.length > 0) {
                    ch.analyzeMessagesArrayAddNewItemsOrUpdateDataExistingMessages(ChannelObject, olderEntriesArray);
                    for (let entryObject of olderEntriesArray) {
                        if (entryObject.comments.count > 0) {
                            await ch.checkAndInsertNewCommentsInEntry(ChannelObject, entryObject);
                        }
                    }
                }
                return true;
            }
            if (dev)
                console.log(`Przycisk "Wczytaj starsze wiadomości na kanale" po załadowaniu: [${ChannelObject.entries.size}] wpisów i [${ChannelObject.comments.size}] komentarzy `);
        }
        if (settings.leftClickOnYouTubeLoadsToIframe && target.tagName === "A" && target.classList.contains("entryMediaEmbedYouTube")) {
            e.preventDefault();
            let embedVideoId = fn.getEmbedVideoIDCodeFromYouTubeURL(target.href);
            if (embedVideoId && typeof embedVideoId === "string") {
                youtubeIframe.src = `https://www.youtube.com/embed/${embedVideoId}?autoplay=1&mute=0&start=0`;
            }
            return true;
        }
        if (settings.newMessageSendButton && target.tagName === 'BUTTON' && target.classList.contains('newMessageSendButton')) {
            const channelName = target.dataset.channel;
            const ChannelObject = openedChannels.get(channelName);
            const newMessageTextarea = target.previousElementSibling;
            if (ChannelObject && newMessageTextarea) {
                e.preventDefault();
                await ch.executePostNewMessageToChannelFromTextarea(ChannelObject);
                return true;
            }
        }
        if (target.tagName === 'BUTTON' && target.classList.contains("plus")) {
            const channelName = target.closest(".channelFeed").dataset.channel;
            const ChannelObject = openedChannels.get(channelName);
            const messageArticle = target.closest(".messageArticle");
            const ratingBoxSection = target.closest("section.rating-box");
            const messageTemplateForVoting = {
                resource: messageArticle.dataset.resource,
                id: parseInt(messageArticle.dataset.id),
                entry_id: parseInt(messageArticle.dataset.entryId)
            };
            let objectForVoting;
            if (messageTemplateForVoting.resource === "entry")
                objectForVoting = new T.Entry(messageTemplateForVoting);
            else if (messageTemplateForVoting.resource === "entry_comment") {
                messageTemplateForVoting.parent = { id: messageTemplateForVoting.entry_id };
                objectForVoting = new T.Comment(messageTemplateForVoting);
            }
            let upODdown = messageArticle.dataset.voted == "1" ? "down" : "up";
            const votedobj = await api.voteMessage(objectForVoting, upODdown);
            let newVotesUpCount;
            if (upODdown == "up") {
                newVotesUpCount = parseInt(messageArticle.dataset.votesUp) + 1;
                target.classList.add("voted");
            }
            else {
                newVotesUpCount = parseInt(messageArticle.dataset.votesUp) - 1;
                target.classList.remove("voted");
            }
            messageArticle.dataset.voted = fn.toggle01(messageArticle.dataset.voted);
            messageArticle.dataset.votesUp = String(newVotesUpCount);
            messageArticle.style.setProperty('--votesUp', `"${newVotesUpCount}"`);
            if (messageTemplateForVoting.resource === "entry") {
                ChannelObject.entries.get(messageTemplateForVoting.id).votes.up = newVotesUpCount;
            }
            else {
                ChannelObject.comments.get(messageTemplateForVoting.id).votes.up = newVotesUpCount;
            }
            fn.innerText(`.${ChannelObject.name}_plusesCount`, String([...ChannelObject.entries.values(), ...ChannelObject.comments.values()].reduce((sum, obj) => sum + obj.votes.up, 0)));
            return true;
        }
        if (target.tagName === 'BUTTON' && target.classList.contains("channelStatsHideButton")) {
            setSettings("settings.css.main.channelStats", "hide");
            return;
        }
        if (target.tagName === 'BUTTON' && target.classList.contains("channelStatsShowButton")) {
            setSettings("settings.css.main.channelStats", "show");
            return;
        }
        if (target.tagName === 'SPAN') {
            const target = e.target;
            const usernameAHref = target.closest(`.username`);
            if (usernameAHref && usernameAHref.dataset.username) {
                e.preventDefault();
                return false;
            }
        }
        return false;
    });
    document.body.addEventListener("keydown", async function (e) {
        const target = e.target;
        if (e.ctrlKey && e.key == 's')
            e.preventDefault();
    });
    function ifCursorIsAfterUsernameRemoveUsernameElement() {
        const selection = window.getSelection();
        console.log("Selection: ", selection);
        if (!selection.rangeCount)
            return false;
        const range = selection.getRangeAt(0);
        if (range.commonAncestorContainer.parentElement.tagName === "SECTION")
            return false;
        if (range.commonAncestorContainer.nodeName === "#text" && range.commonAncestorContainer instanceof Text && String(range.commonAncestorContainer.data).startsWith("@") && range.commonAncestorContainer.parentElement.classList.contains("username_span")) {
            range.commonAncestorContainer.parentElement.remove();
        }
    }
    document.body.addEventListener('input', function (e) {
        if (e.target.classList.contains("newMessageTextarea") && e.inputType == "deleteContentBackward") {
            ifCursorIsAfterUsernameRemoveUsernameElement();
        }
    });
    document.body.addEventListener('compositionstart', function (e) {
        if (e.target.classList.contains("newMessageTextarea")) {
        }
    });
    document.body.addEventListener('compositionupdate', function (e) {
        if (e.target.classList.contains("newMessageTextarea")) {
        }
    });
    document.body.addEventListener('keydown', function (e) {
        {
        }
    });
    document.body.addEventListener('keyup', function (e) {
        if (e.target.classList.contains("newMessageTextarea")) {
        }
    });
    document.body.addEventListener("keyup", async function (e) {
        const target = e.target;
        const newMessageTextareaContainer = target.closest(".newMessageTextareaContainer");
        if (newMessageTextareaContainer && newMessageTextareaContainer.dataset) {
            const ChannelObject = openedChannels.get(newMessageTextareaContainer.dataset.channel);
            const newMessageTextarea = ChannelObject.elements.newMessageTextarea;
            if (newMessageTextarea) {
                if (newMessageTextarea.innerText === "\n") {
                    newMessageTextarea.innerText = "";
                }
                if (!ChannelObject.discussionViewEntryId && (newMessageTextarea.innerText === "" || newMessageTextarea.innerText === " ") && newMessageTextareaContainer.dataset.entryId) {
                    ch.removeReplyEntryID(ChannelObject);
                }
                else {
                    ch.setReplyEntryID(ChannelObject);
                }
            }
            if (!e.ctrlKey || (e.key != 'Enter' && e.key != 's'))
                return false;
            if (newMessageTextarea && newMessageTextarea.innerText.length > 1) {
                if ((settings.editorSendHotkey.enter && e.key === 'Enter')
                    || (settings.editorSendHotkey.ctrl_enter && e.ctrlKey && e.key === 'Enter')
                    || (settings.editorSendHotkey.ctrl_s && e.ctrlKey && e.key === 's')) {
                    await ch.executePostNewMessageToChannelFromTextarea(ChannelObject);
                    return true;
                }
                ch.fetch.fetchOnHold = 2;
            }
        }
    });
    document.body.addEventListener('dblclick', function (e) {
        if (settings.discussionView) {
            let target = e.target;
            let messageArticle = target.closest(".messageArticle[data-entry-id]");
            if (messageArticle) {
                const ChannelObject = openedChannels.get(messageArticle.dataset.channel);
                const channelFeed = ChannelObject.elements.channelFeed;
                const MessageObject = messageArticle.dataset.resource === "entry" ? ChannelObject.entries.get(parseInt(messageArticle.dataset.id)) : ChannelObject.comments.get(parseInt(messageArticle.dataset.id));
                if (head.querySelector(`style[data-fn="discussionView"][data-channel="${ChannelObject.name}"]`)) {
                    fn.removeClass(`.channelFeed[data-channel="${ChannelObject.name}"] .messageArticle[data-entry-id="${MessageObject.entry_id}"].discussionView`, "discussionView");
                    ch.discussionViewOFF(ChannelObject, MessageObject);
                }
                else {
                    messageArticle.classList.add("discussionView");
                    ch.discussionViewON(ChannelObject, MessageObject);
                }
            }
        }
    });
});
const showLoginQRCodeButton = document.getElementById("showLoginQRCode");
const qrCodeContainer = document.getElementById("qrCodeContainer");
const qrCodeCanvas = document.getElementById("qrCodeCanvas");
qrCodeContainer.addEventListener("click", async function (e) {
    delete showLoginQRCodeButton.dataset.qrShown;
    qrCodeContainer.classList.remove("scaleInAnimation");
    qrCodeContainer.classList.add("scaleOutAnimation");
});
showLoginQRCodeButton.addEventListener("click", async function (e) {
    if (dev)
        console.log(e);
    if (showLoginQRCodeButton.dataset.qrShown == "true") {
        qrCodeContainer.classList.add("scaleOutAnimation");
        qrCodeContainer.classList.remove("scaleInAnimation");
        delete showLoginQRCodeButton.dataset.qrShown;
        if (dev)
            console.log(` ` + showLoginQRCodeButton.dataset.qrShown);
    }
    else {
        showLoginQRCodeButton.dataset.qrShown = "true";
        if (dev)
            console.log(showLoginQRCodeButton.dataset.qrShown);
        qrCodeContainer.classList.add("scaleInAnimation");
        qrCodeContainer.classList.remove("scaleOutAnimation");
        const QRC = qr.qrcodegen.QrCode;
        let qrText = `https://mikroczat.pl/login/`;
        if (login.tokensObject.refresh_token)
            qrText += `${login.tokensObject.refresh_token}/`;
        else if (login.tokensObject.token)
            qrText += `${login.tokensObject.token}/`;
        else
            return;
        if (activeChannels[0])
            qrText += activeChannels[0].name;
        else if (activeChannels[1])
            qrText += activeChannels[1].name;
        else
            qrText += "x_plus";
        const qr0 = QRC.encodeText(qrText, QRC.Ecc.MEDIUM);
        if (dev)
            console.log("qr0", qr0);
        drawQR(qr0, 10, 4, "rgb(255 255 255 / 0.5)", "rgb(0 0 0 / 1)", qrCodeCanvas);
    }
});
function drawQR(qrObject, scale, padding, lightColor, darkColor, canvas) {
    if (scale <= 0 || padding < 0)
        throw new RangeError("Value out of range");
    const width = (qrObject.size + padding * 2) * scale;
    canvas.width = width;
    canvas.height = width;
    let ctx = canvas.getContext("2d");
    for (let y = -padding; y < qrObject.size + padding; y++) {
        for (let x = -padding; x < qrObject.size + padding; x++) {
            ctx.fillStyle = qrObject.getModule(x, y) ? darkColor : lightColor;
            ctx.fillRect((x + padding) * scale, (y + padding) * scale, scale, scale);
        }
    }
}
(function applySettingsCSS() {
    if (settings.css) {
        for (const id in settings.css) {
            const element = document.getElementById(id);
            if (element) {
                for (const prop in settings.css[id]) {
                    element.dataset[prop] = settings.css[id][prop];
                }
            }
        }
    }
})();
//# sourceMappingURL=index.js.map