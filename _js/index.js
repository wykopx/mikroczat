'use strict';
import * as api from './wykop_api.js';
import * as CONST from './const.js';
import * as T from './types.js';
import * as fn from './fn.js';
const openedChannels = new Map();
const activeChannels = [null, null];
let mikroczatLoggedIn = false;
let wykopDomain = "https://wykop.pl";
let wxDomain = "https://wykopx.pl";
let mikroczatDomain = "https://wykopx.pl";
const root = document.documentElement;
const head = document.head;
const body = document.body;
const main = document.getElementById("main");
const chatArea = document.getElementById("chatArea");
const newMessageSound = new Audio('/_sounds/switch-7.wav');
let user = { username: "Anonim (Ty)" };
export let tokensObject = api.getTokenFromDatabase();
let nightMode = localStorage.getItem('nightMode');
if ((tokensObject.token || tokensObject.refresh_token) && !mikroczatLoggedIn)
    logIn();
const template_channelFeed = document.getElementById("template_channelFeed");
const template_messageArticle = document.getElementById("template_messageArticle");
const mikrochatFeeds = document.getElementById("mikrochatFeeds");
const numbersOfEntriesToLoadOnChannelOpen = 30;
const numbersOfEntriesToCheck = 2;
const numbersOfCommentsToLoad = 20;
var intervalID = setInterval(function () {
}, 10000);
const loginDialog = document.querySelector("#loginDialog");
const loginInput = document.querySelector("#loginInput");
const loginAlertTokenSuccess = document.querySelector("#loginDialog #loggedInToken");
const loginAlertRefreshTokenSuccess = document.querySelector("#loginDialog #loggedInRefreshToken");
const loginAlertError = document.querySelector("#loginDialog .alert-error");
const showLoginDialogButton = document.querySelector("#showLoginDialog");
const closeLoginDialogButton = document.querySelector("#closeLoginDialogButton");
showLoginDialogButton.addEventListener("click", () => {
    loginDialog.showModal();
});
closeLoginDialogButton.addEventListener("click", () => {
    if (processLoginData(loginInput.value))
        logIn();
    loginDialog.close();
});
loginInput.addEventListener("paste", (event) => {
    console.log(event);
    processLoginData(event.target.value);
});
loginInput.addEventListener("change", (event) => {
    console.log(event);
    processLoginData(event.target.value);
});
loginInput.addEventListener("input", (event) => {
    console.log(event);
    processLoginData(event.target.value);
});
function processLoginData(pastedData) {
    if (pastedData == "" || pastedData == null || pastedData == undefined) {
        return false;
    }
    if (pastedData.length < 64) {
        fn.hide(loginAlertRefreshTokenSuccess);
        fn.hide(loginAlertTokenSuccess);
        fn.show(loginAlertError);
        return false;
    }
    let tokensObject = api.saveToken({ tokenValue: pastedData });
    if (tokensObject !== false) {
        fn.hide(loginAlertError);
        if ('refreshToken' in tokensObject) {
            fn.show(loginAlertRefreshTokenSuccess);
            return true;
        }
        else if ('token' in tokensObject) {
            fn.show(loginAlertTokenSuccess);
            return true;
        }
    }
    else {
        fn.hide(loginAlertRefreshTokenSuccess);
        fn.hide(loginAlertTokenSuccess);
        fn.show(loginAlertError);
        return false;
    }
}
async function logIn() {
    console.log(`logIn()`);
    if (tokensObject.refresh_token) {
        let newTokensObject = await api.fetchAPIrefreshTokens();
        if (newTokensObject !== false) {
            if (typeof newTokensObject === 'object' && 'token' in newTokensObject) {
                tokensObject.token = newTokensObject.token;
            }
        }
    }
    if (!tokensObject.token)
        tokensObject = api.getTokenFromDatabase();
    await fetch(`${CONST.apiPrefixURL}/profile/short`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + window.localStorage.getItem("token"),
        },
    })
        .then(async (response) => {
        console.log("logIn() > response from", response);
        if (!response.ok) {
            mikroczatLoggedIn = false;
            console.log(`Problem z logowaniem: ${response.status}`);
            await api.fetchAPIrefreshTokens();
            return false;
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
        .then((responseJSON) => {
        console.log("🟢🟢🟢 responseJSON - api/v3/profile/short");
        console.log(responseJSON);
        user = responseJSON.data;
        console.log(`user: ${user.username}`, user);
        confirmLoggedIn();
        return true;
    })
        .catch((error) => {
        mikroczatLoggedIn = false;
        loginDialog.showModal();
        if (error instanceof TypeError) {
            console.error('Network error:', error);
        }
        else {
            console.error('Other error:', error);
        }
    });
}
async function confirmLoggedIn() {
    console.log(`confirmLoggedIn()`);
    mikroczatLoggedIn = true;
    fn.innerHTML(".loggedInUsername", user.username);
    if (window.opener)
        window.opener.postMessage('mikroczatLoggedInIn', wykopDomain);
    console.log("openChannelsFromURLArray", openChannelsFromURLArray);
    if (openChannelsFromURLArray.length > 0) {
        for (const channelName of openChannelsFromURLArray) {
            const newTag = new T.Tag(channelName);
            const newChannel = new T.Channel(newTag);
            openedChannels.set(channelName, newChannel);
        }
    }
    if (openedChannels.size > 0) {
        for (let [, ChannelObject] of openedChannels) {
            await ChannelObject.tag.initFromAPI();
            openNewChannel(ChannelObject);
            ChannelObject.users.set(user.username, user);
            window.activateChannel(ChannelObject.name);
            await new Promise(resolve => setTimeout(resolve, 7000));
        }
    }
}
async function openNewChannel(ChannelObject) {
    await ChannelObject.tag.initFromAPI().then(() => {
        openedChannels.set(ChannelObject.name, ChannelObject);
    });
    console.log(`openNewChannel: `, ChannelObject.name);
    const templateNode = template_channelFeed.content.cloneNode(true);
    const channelFeedDiv = templateNode.querySelector('.channelFeed');
    channelFeedDiv.dataset.channel = `channel_${ChannelObject.name}`;
    channelFeedDiv.id = `channel_${ChannelObject.name}`;
    mikrochatFeeds.appendChild(templateNode);
    openedChannels.get(ChannelObject.name).element = document.getElementById(`channel_${ChannelObject.name}`);
    console.log(openedChannels.get(ChannelObject.name).element);
    const channelEntries = await api.getEntriesFromChannel(ChannelObject, numbersOfEntriesToLoadOnChannelOpen);
    console.log(`openNewChannel()`, ChannelObject);
    console.log(`channelEntries: [T.Entry] `, channelEntries);
    for (const entryObject of channelEntries) {
        ChannelObject.users.set(entryObject.author.username, entryObject.author);
        insertNewMessage(entryObject, ChannelObject);
    }
    setCheckingForNewMessagesInChannel(ChannelObject);
    console.log(`openNewChannel() ChannelObject: `, ChannelObject);
    return ChannelObject;
}
async function setCheckingForNewMessagesInChannel(ChannelObject, msInterval = 6000) {
    console.log(`setCheckingForNewMessagesInChannel() every msInterval, `, ChannelObject);
    console.log(ChannelObject.name);
    checkForNewMessagesInChannel(ChannelObject);
    checkForNewCommentsInChannel(ChannelObject);
    let i = 1;
    let timeoutId = null;
    timeoutId = setTimeout(function startCheckingForNewMessages() {
        console.log(`startCheckingForNewMessages()`);
        setTimeout(setCheckingForNewMessagesInChannel, msInterval + Math.floor(Math.random() * (3000 - 500 + 1)) + 500, ChannelObject);
    }, msInterval);
}
async function checkForNewMessagesInChannel(ChannelObject) {
    console.log(`checkForNewMessagesInChannel(ChannelObject: T.Channel) `, ChannelObject.name);
    const entries = await api.getEntriesFromChannel(ChannelObject, numbersOfEntriesToCheck);
    const filteredEntries = entries.filter(entry => !ChannelObject.entries.has(entry.id));
    console.log("ChannelObject.entries", ChannelObject.entries);
    console.log("filteredEntries", filteredEntries);
    for (const entryObject of filteredEntries) {
        ChannelObject.users.set(entryObject.author.username, entryObject.author);
        insertNewMessage(entryObject, ChannelObject);
    }
}
async function checkForNewCommentsInChannel(ChannelObject) {
    console.log(`checkForNewCommentsInChannel(ChannelObject: T.Channel) `, ChannelObject.name);
    for (const [entry_id, entry] of ChannelObject.entries) {
        const commentsArray = await api.getCommentsFromEntry(entry_id, numbersOfCommentsToLoad);
        for (const commentObject of commentsArray) {
            ChannelObject.users.set(commentObject.author.username, commentObject.author);
            insertNewMessage(commentObject, ChannelObject);
        }
    }
}
function closeChannel(ChannelObject) {
    openedChannels.delete(ChannelObject.name);
}
function closeActiveChannel() {
}
function getYouTubeFromChannel(ChannelObject) {
    console.log(`getYouTubeFromChannel`, ChannelObject.name);
    const currentChannel = openedChannels.get(ChannelObject.name);
    let EntryWithYouTubeAndMaxVotes = null;
    let maxVotes = -Infinity;
    currentChannel.entries.forEach((entry) => {
        if (entry.media?.embed && entry.votes.up > maxVotes) {
            maxVotes = entry.votes.up;
            EntryWithYouTubeAndMaxVotes = entry;
        }
    });
    console.log("▶ Most plused YouTube: maxVotesEntry: ", EntryWithYouTubeAndMaxVotes);
    return EntryWithYouTubeAndMaxVotes;
}
async function insertNewMessage(entryObject, ChannelObject) {
    const currentChannel = openedChannels.get(ChannelObject.name);
    if (currentChannel.entries.has(entryObject.id))
        return false;
    if (navigator?.userActivation?.hasBeenActive) {
        newMessageSound.play();
    }
    currentChannel.element.append(getMessageHTMLElement(entryObject));
    currentChannel.addEntry(entryObject.id, entryObject);
}
function getMessageHTMLElement(entryObject) {
    const templateNode = template_messageArticle.content.cloneNode(true);
    const messageArticle = templateNode.querySelector('.messageArticle');
    messageArticle.id = `${entryObject.resource}-${String(entryObject.id)}`;
    messageArticle.dataset.id = String(entryObject.id);
    messageArticle.dataset.entryId = String(entryObject.entry_id);
    messageArticle.dataset.authorUsername = entryObject.author?.username;
    messageArticle.style.order = `-${entryObject.created_at_Timestamp}`;
    if (entryObject.author?.username === entryObject.channel?.tag?.author?.username)
        messageArticle.classList.add("channelOwner");
    const entryDate = templateNode.querySelector('.entryDate');
    entryDate.title = `${entryObject.created_at_Format("eeee BBBB")} | ${entryObject.created_at_FormatDistanceSuffix} \n${entryObject.created_at_Format("yyyy-MM-dd 'o godz.' HH:mm ")}`;
    const permalinkHref = templateNode.querySelector('.permalinkHref');
    if (entryObject.resource === "entry") {
        messageArticle.classList.add(`entry`);
        permalinkHref.setAttribute("href", `https://go.wykopx.pl/w${entryObject.entry_id}`);
    }
    else if (entryObject.resource === "entry_comment") {
        messageArticle.classList.add(`comment`, `reply`);
        messageArticle.classList.add(`comment`);
        permalinkHref.setAttribute("href", `https://go.wykopx.pl/w${entryObject.entry_id}k${entryObject.id}`);
    }
    const entryDateYYYMMDD = templateNode.querySelector('.entryDateYYYMMDD');
    entryDateYYYMMDD.textContent = entryObject.created_at_Format("yyyy-MM-dd");
    const entryDateHHMM = templateNode.querySelector('.entryDateHHMM');
    entryDateHHMM.textContent = entryObject.created_at_Format("HH:mm");
    const entryDateHHMMSS = templateNode.querySelector('.entryDateHHMMSS');
    entryDateHHMMSS.textContent = entryObject.created_at_Format("HH:mm:ss");
    if (entryObject.author.avatar) {
        const avatar_img = templateNode.querySelector('.avatar_img');
        avatar_img.setAttribute("src", entryObject.author.avatar);
    }
    const username = templateNode.querySelector('a.username');
    username.setAttribute("href", `https://go.wykopx.pl/@${entryObject.author.username}`);
    messageArticle.classList.add(entryObject.author?.status);
    username.classList.add(entryObject.author?.status);
    if (entryObject.author?.color?.name) {
        messageArticle.classList.add(`${entryObject.author?.color?.name}-profile`);
        username.classList.add(`${entryObject.author?.color?.name}-profile`);
    }
    if (entryObject.author?.gender == "m") {
        messageArticle.classList.add('male', "m-gender");
        username.classList.add('male', "m-gender");
    }
    else if (entryObject.author?.gender == "f") {
        messageArticle.classList.add('female', "f-gender");
        username.classList.add('female', "f-gender");
    }
    else {
        messageArticle.classList.add("null-gender");
        username.classList.add("null-gender");
    }
    const username_span = templateNode.querySelector('.username_span');
    username_span.textContent = entryObject.author.username;
    const messageContent = templateNode.querySelector('.messageContent');
    messageContent.innerHTML = entryObject.content_parsed();
    return templateNode;
}
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
if (window.opener) {
    window.opener.postMessage('MikroCzatOpened', 'https://wykop.pl');
}
window.addEventListener('message', function (event) {
    console.log("event received", event);
    console.log("event.origin", event.origin);
    console.log("event.data", event.data);
    if (event.origin !== wykopDomain || !event?.data?.type)
        return;
    switch (event.data.type) {
        case "token":
            if (event.data.token && !window.sessionStorage.getItem("mikroczatLoggedOut")) {
                api.saveToken({ tokenValue: event.data.token, tokenType: "token" });
            }
            break;
        case "userKeep":
            if (event.data.userKeep && !window.sessionStorage.getItem("mikroczatLoggedOut")) {
                api.saveToken({ tokenValue: event.data.userKeep, tokenType: "userKeep" });
            }
            break;
        case "TokensObject":
            if (event.data.token && !window.sessionStorage.getItem("mikroczatLoggedOut")) {
                api.saveToken({ tokenValue: event.data.token, tokenType: "token" });
            }
            if (event.data.userKeep && !window.sessionStorage.getItem("mikroczatLoggedOut")) {
                api.saveToken({ tokenValue: event.data.userKeep, tokenType: "userKeep" });
            }
            break;
        case "nightMode":
            toggleNightMode(event.data.value);
            break;
        default:
            return false;
    }
    console.log(`received '${event.data.type}'  from wykop.pl: `, event.data.value);
    console.log("window.opener", window.opener);
    if (!mikroczatLoggedIn)
        logIn();
}, false);
window.logout = function () {
    tokensObject = null;
    window.sessionStorage.setItem("mikroczatLoggedOut", "true");
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("userKeep");
    alert("Wylogowano z MikroCzata");
    window.location.reload();
};
window.youtubeswitch = function () {
    if (main.dataset.youtubePlayer == "tr")
        main.dataset.youtubePlayer = "cl";
    else if (main.dataset.youtubePlayer == "hidden")
        main.dataset.youtubePlayer = "tr";
    else
        main.dataset.youtubePlayer = "hidden";
};
window.spotifyswitch = function () {
    if (main.dataset.spotifyPlayer == "tc" && main.dataset.youtubePlayer != "tr")
        main.dataset.spotifyPlayer = "tr";
    else if (main.dataset.spotifyPlayer == "hidden")
        main.dataset.spotifyPlayer = "tc";
    else
        main.dataset.spotifyPlayer = "hidden";
};
window.activateChannel = async function (ChannelObject) {
    if (typeof ChannelObject === "string")
        ChannelObject = new T.Channel(new T.Tag(ChannelObject));
    let newActiveChannelElement = body.querySelector(`.channelFeed[data-channel="channel_${ChannelObject.name}"]`);
    if (!newActiveChannelElement) {
        ChannelObject = await openNewChannel(ChannelObject);
        newActiveChannelElement = ChannelObject.element;
    }
    if (newActiveChannelElement) {
        const previousActiveChannel = body.querySelector(`.channelFeed[data-active="true"]`);
        if (previousActiveChannel && previousActiveChannel.dataset.channel === `channel_${ChannelObject.name}`)
            return;
        if (previousActiveChannel)
            previousActiveChannel.dataset.active = "false";
        newActiveChannelElement.dataset.active = "true";
        activeChannels[0] = ChannelObject;
    }
    history.pushState(null, null, `/czat/${ChannelObject.name}`);
    console.log("openedChannels", openedChannels);
    console.log("activeChannels", activeChannels);
};
window.onload = function () {
    toggleNightMode(nightMode);
};
function toggleNightMode(nightModeOn = true) {
    if (nightModeOn == "1" || nightModeOn == 1)
        nightModeOn = true;
    else if (nightModeOn == "0" || nightModeOn == 0)
        nightModeOn = false;
    if (nightModeOn == false || body.dataset.nightMode == "1") {
        body.dataset.nightMode = "0";
        nightMode = "0";
    }
    else {
        body.dataset.nightMode = "1";
        nightMode = "1";
    }
    localStorage.setItem('nightMode', nightMode);
}
let timer;
document.addEventListener('DOMContentLoaded', (event) => {
    document.body.addEventListener('click', function (e) {
        let target = e.target;
        let cls = target.closest(".messageArticle[data-entry-id]");
        if (cls) {
            if (cls.classList.contains("highlightLock")) {
                highlightUnlock(cls.dataset.entryId);
            }
            else {
                highlightLock(cls.dataset.entryId);
            }
        }
    });
    function highlightLock(entryId) {
        let divs = document.querySelectorAll(`article[data-entry-id="${entryId}"]`);
        divs.forEach((div) => {
            div.classList.add('highlightLock');
        });
    }
    function highlightUnlock(entryId) {
        let divs = document.querySelectorAll(`article[data-entry-id="${entryId}"]`);
        divs.forEach((div) => {
            div.classList.remove('highlightLock');
        });
    }
});
//# sourceMappingURL=index.js.map