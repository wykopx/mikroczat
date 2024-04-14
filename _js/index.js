'use strict';
import * as api from './wykop_api.js';
import * as CONST from './const.js';
import * as T from './types.js';
import * as fn from './fn.js';
const openedChannels = new Map();
const activeChannels = [null, null];
export let settings = {
    highlightQuick: false,
    highlightLock: true,
    newMessageSendButton: true,
    rightClickOnUsernameCopiesToClipboard: true,
    rightClickOnUsernameInsertsToNewMessage: true,
    rightClickOnUsernameShowContextMenu: false,
    promoFooter: {
        emoji: true,
        label: true,
        roomInfo: false,
        mikroczatLinks: false
    },
    editorSendHotkey: {
        "enter": false,
        "ctrl_enter": true,
        "ctrl_s": true
    },
    channelStatistics: false,
    fetch: {
        numbersOfEntriesToLoadOnChannelOpen: 4,
        numbersOfEntriesToLoadInChannel: 50,
        numbersOfCommentsToLoad: 50
    },
    usersList: {
        showOfflineUsers: true,
        sortAlphabetically: true,
    },
    sounds: {
        incoming_entry: {
            enabled: false,
            file: "gg-message-received.mp3",
        },
        incoming_comment: {
            enabled: false,
            file: "iphone-message-received.mp3"
        },
        incoming_mention: {
            enabled: false,
            file: "gg-message-received.mp3"
        },
        outgoing_entry: {
            enabled: true,
            file: "iphone-message-sent.mp3"
        },
        outgoing_comment: {
            enabled: true,
            file: "iphone-message-sent.mp3"
        },
        logged_in: {
            enabled: true,
            file: "tiktok.mp3"
        },
        logged_out: {
            enabled: true,
            file: "mirkoczat.mp3"
        }
    },
    css: {
        chatArea: {
            plusButtonShow: true,
        }
    }
};
const sounds = {
    logged_in: new Audio(`/_sounds/${settings.sounds.logged_in.file}`),
    logged_out: new Audio(`/_sounds/${settings.sounds.logged_out.file}`),
    outgoing_entry: new Audio(`/_sounds/${settings.sounds.outgoing_entry.file}`),
    outgoing_comment: new Audio(`/_sounds/${settings.sounds.outgoing_comment.file}`),
    incoming_entry: new Audio(`/_sounds/${settings.sounds.incoming_entry.file}`),
    incoming_comment: new Audio(`/_sounds/${settings.sounds.incoming_comment.file}`),
    incoming_mention: new Audio(`/_sounds/${settings.sounds.incoming_mention.file}`),
};
let nightMode = localStorage.getItem('nightMode');
let mikroczatLoggedIn = false;
let wykopDomain = "https://wykop.pl";
let wxDomain = "https://wykopx.pl";
let mikroczatDomain = "https://mikroczat.pl";
const root = document.documentElement;
const head = document.head;
const body = document.body;
const main = document.getElementById("main");
const centerHeader = document.getElementById("centerHeader");
const template_channelFeed = document.getElementById("template_channelFeed");
const template_usersList = document.getElementById("template_usersList");
const template_messageArticle = document.getElementById("template_messageArticle");
const template_userListItem = document.getElementById("template_userListItem");
const chatArea = document.getElementById("chatArea");
const mikrochatFeeds = document.getElementById("mikrochatFeeds");
const usersPanel = document.getElementById("usersPanel");
export let user = new T.User("Anonim");
export let tokensObject = api.getTokenFromDatabase();
if ((tokensObject.token || tokensObject.refresh_token) && !mikroczatLoggedIn)
    logIn();
const chooseChannelDialog = document.querySelector("#chooseChannelDialog");
const loginDialog = document.querySelector("#loginDialog");
const loginInput = document.querySelector("#loginInput");
const loginAlertTokenSuccess = document.querySelector("#loginDialog #loggedInToken");
const loginAlertRefreshTokenSuccess = document.querySelector("#loginDialog #loggedInRefreshToken");
const loginAlertError = document.querySelector("#loginDialog .alert-error");
const showLoginDialogButton = document.querySelector("#showLoginDialog");
const closeLoginDialogButton = document.querySelector("#closeLoginDialogButton");
if (showLoginDialogButton)
    showLoginDialogButton.addEventListener("click", () => {
        loginDialog.showModal();
    });
if (closeLoginDialogButton)
    closeLoginDialogButton.addEventListener("click", () => {
        if (processLoginData(loginInput.value))
            logIn();
        loginDialog.close();
    });
if (loginInput) {
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
}
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
    if (!mikroczatLoggedIn)
        await api.fetchAPIrefreshTokens();
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
        window.localStorage.setItem("username", user.username);
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
    console.log("user:", user);
    mikroczatLoggedIn = true;
    fn.innerHTML(".loggedInUsername", user.username);
    loginDialog.close();
    sounds.logged_in.play();
    document.getElementById("showLoginDialog").classList.add("hidden");
    document.getElementById("logOutButton").classList.remove("hidden");
    document.querySelectorAll("a.loggedInHref").forEach((el) => {
        el.href = 'https://go.wykopx.pl/@${user.username}';
        el.classList.add(`${user.status}`, `${user.color}-profile`, `${user.gender}-gender`);
    });
    if (window.opener)
        window.opener.postMessage('mikroczatLoggedInIn', wykopDomain);
    if (openChannelsFromURLArray.length > 0) {
        for (const channelName of openChannelsFromURLArray) {
            const newTag = new T.Tag(channelName);
            const newChannel = new T.Channel(newTag);
            openedChannels.set(channelName, newChannel);
        }
    }
    if (openedChannels.size > 0) {
        console.log("💜openedChannels: ", openedChannels);
        for (let [, ChannelObject] of openedChannels) {
            await openNewChannel(ChannelObject).then(() => {
                window.activateChannel(ChannelObject);
            });
            console.log('⌛ Promise delay: 4 sekundy');
            await new Promise(resolve => setTimeout(resolve, 4000));
        }
    }
}
async function addUserToChannel(ChannelObject, ...userObjectUsernameStringOrUsersArray) {
    console.log(`addUserToChannel | Channel: ${ChannelObject.name} | user: ${user.username}`, user);
    userObjectUsernameStringOrUsersArray.forEach(async (userObject) => {
        if (typeof userObject === 'string' && !ChannelObject.users.has(userObject)) {
            console.log(`👤  Adding user ${userObject} to channel ${ChannelObject.name}`);
        }
        if (userObject instanceof T.User && !ChannelObject.users.has(userObject.username)) {
            ChannelObject.users.set(userObject.username, userObject);
            if (settings.channelStatistics) {
                document.getElementById(`${ChannelObject.name}_usersCount`).innerText = String(ChannelObject.users.size);
            }
            if (userObject.online || settings.usersList.showOfflineUsers) {
                console.log(`👤 Adding user ${userObject.username} to channel ${ChannelObject.name}`);
                ChannelObject.elements.usersListContainer.append(await getUserHTMLElement(userObject, ChannelObject));
                if (settings.channelStatistics) {
                    document.getElementById(`${ChannelObject.name}_usersOnlineCount`).innerText = String(getNumberOfOnlineUsersOnChannel(ChannelObject));
                }
            }
        }
    });
}
function getNumberOfOnlineUsersOnChannel(ChannelObject) {
    return Array.from(ChannelObject.users.values()).filter(user => user.online).length;
}
async function openNewChannel(ChannelObject) {
    await ChannelObject.tag.initFromAPI().then(() => {
        openedChannels.set(ChannelObject.name, ChannelObject);
    });
    console.log(`openNewChannel: `, ChannelObject.name);
    const templateChannelFeed = template_channelFeed.content.cloneNode(true);
    const channelFeedDiv = templateChannelFeed.querySelector('.channelFeed');
    const newMessageTextarea = templateChannelFeed.querySelector('.newMessageTextarea');
    const newMessageSendButton = templateChannelFeed.querySelector('.newMessageSendButton');
    const channelStatistics = templateChannelFeed.querySelector('.channelStatistics');
    if (channelFeedDiv) {
        channelFeedDiv.dataset.channel = ChannelObject.name;
        channelFeedDiv.id = `channel_${ChannelObject.name}`;
        newMessageTextarea.dataset.channel = ChannelObject.name;
        newMessageSendButton.dataset.channel = ChannelObject.name;
        if (settings.newMessageSendButton == false)
            newMessageSendButton.classList.add("hidden");
        if (channelStatistics) {
            channelStatistics.dataset.channel = ChannelObject.name;
            channelStatistics.querySelector("#channel_usersCount").id = `${ChannelObject.name}_usersCount`;
            channelStatistics.querySelector("#channel_usersOnlineCount").id = `${ChannelObject.name}_usersOnlineCount`;
            channelStatistics.querySelector("#channel_entriesCount").id = `${ChannelObject.name}_entriesCount`;
            channelStatistics.querySelector("#channel_messagesCount").id = `${ChannelObject.name}_messagesCount`;
            channelStatistics.querySelector("#channel_plusesCount").id = `${ChannelObject.name}_plusesCount`;
            channelStatistics.querySelector("#channel_timespan").id = `${ChannelObject.name}_timespan`;
            if (settings.channelStatistics == false)
                channelStatistics.classList.add("hidden");
        }
        mikrochatFeeds.appendChild(templateChannelFeed);
    }
    const templateUsersList = template_usersList.content.cloneNode(true);
    const usersListDiv = templateUsersList.querySelector('.usersList');
    if (usersListDiv) {
        usersListDiv.dataset.channel = ChannelObject.name;
        usersListDiv.id = `channel_users_${ChannelObject.name}`;
    }
    openedChannels.get(ChannelObject.name).elements.channelFeed = document.getElementById(`channel_${ChannelObject.name}`);
    if (openedChannels.get(ChannelObject.name).elements.channelFeed) {
        openedChannels.get(ChannelObject.name).elements.messagesContainer = openedChannels.get(ChannelObject.name).elements.channelFeed.querySelector(".messagesContainer");
        openedChannels.get(ChannelObject.name).elements.newMessageTextarea = openedChannels.get(ChannelObject.name).elements.channelFeed.querySelector(".newMessageTextarea");
    }
    usersPanel.appendChild(templateUsersList);
    openedChannels.get(ChannelObject.name).elements.usersListContainer = usersPanel.querySelector(".usersListContainer");
    addUserToChannel(ChannelObject, user);
    await checkAndInsertNewEntriesInChannel(ChannelObject, settings.fetch.numbersOfEntriesToLoadOnChannelOpen).then(() => {
        ChannelObject.elements.channelFeed.dataset.active = "true";
        ChannelObject.loadingStatus = "preloaded";
    });
    console.log("ChannelObject.entries.size", ChannelObject.entries.size);
    if (ChannelObject.entries.size > 0)
        await checkAndInsertNewCommentsInChannel(ChannelObject).then(() => {
            ChannelObject.elements.channelFeed.dataset.active = "true";
            ChannelObject.loadingStatus = "preloaded";
        });
    mikrochatFeeds.querySelector(".loadingInfo").classList.add("hidden");
    setupScrollListener(openedChannels.get(ChannelObject.name).elements.messagesContainer);
    await fetchOpenedChannelsDataFirstPreload(ChannelObject).then(async () => {
        ChannelObject.elements.channelFeed.dataset.active = "true";
        ChannelObject.loadingStatus = "preloaded";
        await (fetchOpenedChannelsData(ChannelObject));
    });
    return ChannelObject;
}
const FETCH_DELAY_MILLISECONDS = 300;
async function fetchOpenedChannelsDataFirstPreload(ChannelObject) {
    ChannelObject.elements.channelFeed.dataset.active = "true";
    console.log(`🌍 1️⃣ fetchOpenedChannelsDataFirstPreload()`);
    console.log(`💚 ROZPOCZYNAM PIERWSZE WCZYTYWANIE WPISÓW NA KANALE [${ChannelObject.name}]`);
    let newEntriesInsertedArray = [];
    if (ChannelObject.entries.size <= settings.fetch.numbersOfEntriesToLoadOnChannelOpen) {
        newEntriesInsertedArray = await checkAndInsertNewEntriesInChannel(ChannelObject, settings.fetch.numbersOfEntriesToLoadInChannel);
    }
    if (newEntriesInsertedArray.length > 0) {
        for (let entryObject of newEntriesInsertedArray) {
            if (entryObject.comments.count > 0) {
                await checkAndInsertNewCommentsInEntry(ChannelObject, entryObject);
            }
        }
    }
}
async function fetchOpenedChannelsData(ChannelObject) {
    console.log(`🌍 fetchOpenedChannelsData()`);
    console.log(`💚 ROZPOCZYNAM AKTUALIZACJĘ WPISÓW NA KANALE [${ChannelObject.name}]`);
    ChannelObject.elements.channelFeed.dataset.loaded = "true";
    ChannelObject.loadingStatus = "loaded";
    while (true) {
        console.log('⌛ Promise delay: 10 sekund');
        await new Promise(resolve => setTimeout(resolve, 99000));
        await refreshAllEntriesCommentsCountAndVotesUpInChannel(ChannelObject);
    }
}
async function refreshAllEntriesCommentsCountAndVotesUpInChannel(ChannelObject) {
    console.log(`refreshAllEntriesCommentsCountAndVotesUpInChannel(Channel: ${ChannelObject.name})`);
    console.log(`--- aktualizacja liczby plusów i komentarzy we wszystkich otwartych wpisach (${ChannelObject.entries.size} wpisów)`);
    const refreshedEntriesArray = await api.getXNewestEntriesFromChannel(ChannelObject, ChannelObject.entries.size);
    if (refreshedEntriesArray.length > 0)
        analyzeMessagesArrayAddNewItemsOrUpdateDataExistingMessages(ChannelObject, refreshedEntriesArray);
    return true;
}
function analyzeMessagesArrayAddNewItemsOrUpdateDataExistingMessages(ChannelObject, messagesArray) {
    for (const entryObject of messagesArray) {
        console.log(`entryObject`, entryObject);
        console.log(`entryObject.id`, entryObject.id);
        console.log(`ChannelObject.entries.get(entryObject.id)`, ChannelObject.entries.get(entryObject.id));
        console.log(`ChannelObject.entries`, ChannelObject.entries);
        if (!ChannelObject.entries.has(entryObject.id)) {
            insertNewItem(ChannelObject, entryObject);
        }
        else {
            if (entryObject.comments?.count && entryObject.comments.count != ChannelObject.entries.get(entryObject.id).comments.count) {
                console.log(`updateCommentsCountAndVotesUpFromArrayOfRefreshedEntries - for entryObject.comments `, entryObject.comments);
                console.log(`💭 We wpisie ${entryObject.id} zmieniła się liczba komentarzy z [${ChannelObject.entries.get(entryObject.id).comments.count}] na [${entryObject.comments.count}]`);
                console.log(entryObject);
                console.log(entryObject.comments);
                ChannelObject.entries.get(entryObject.id).comments.count = entryObject.comments.count;
            }
            if (entryObject.votes?.up && entryObject.votes.up != ChannelObject.entries.get(entryObject.id).votes.up) {
                console.log(`updateCommentsCountAndVotesUpFromArrayOfRefreshedEntries - for entryObject.votes `, entryObject.votes);
                console.log(`🔼 We wpisie ${entryObject.id} zmieniła się liczba plusów z [${ChannelObject.entries.get(entryObject.id).votes.up}] na [${entryObject.votes.up}]`);
                ChannelObject.entries.get(entryObject.id).votes.up = entryObject.votes.up;
                if (settings.channelStatistics) {
                    document.getElementById(`${ChannelObject.name}_plusesCount`).innerText = String([...ChannelObject.entries.values(), ...ChannelObject.comments.values()].reduce((sum, obj) => sum + obj.votes.up, 0));
                }
            }
            if (entryObject.voted && entryObject.voted != ChannelObject.entries.get(entryObject.id).voted) {
                console.log(`updateCommentsCountAndVotesUpFromArrayOfRefreshedEntries - for entryObject.voted `, entryObject.voted);
                console.log(`entryObject`, entryObject);
                console.log(`➕ Użytkownik zaplusował wpis/komentarz ${entryObject.id} zmiana .voted z: [${ChannelObject.entries.get(entryObject.id).voted}] na [${entryObject.voted}]`);
                ChannelObject.entries.get(entryObject.id).voted = entryObject.voted;
            }
        }
    }
}
export function updateCSSPropertyOnMessageArticleElement(entryOrCommentObject, changedPropertyName, changedObject) {
    let messageArticle = null;
    if (entryOrCommentObject.resource === "entry")
        messageArticle = mikrochatFeeds.querySelector(`.messageArticle[data-id="${entryOrCommentObject.id}"]`);
    else if (entryOrCommentObject.resource === "entry_comment")
        messageArticle = mikrochatFeeds.querySelector(`.messageArticle[data-id="${entryOrCommentObject.id}"]`);
    if (messageArticle) {
        if (changedObject) {
            if (changedPropertyName === "up") {
                messageArticle.style.setProperty('--votesUp', `"${changedObject.up}"`);
                messageArticle.dataset.votesUp = changedObject.up;
            }
            if (entryOrCommentObject.resource === "entry" && changedPropertyName === "count") {
                messageArticle.style.setProperty('--commentsCount', `"${changedObject.count}"`);
                messageArticle.dataset.commentsCount = changedObject.count;
            }
            if (changedPropertyName === "voted") {
                messageArticle.dataset.voted = changedObject.voted;
            }
        }
        else if (entryOrCommentObject) {
            messageArticle.style.setProperty('--votesUp', `"${entryOrCommentObject.votes.up}"`);
            messageArticle.dataset.votesUp = entryOrCommentObject.votes.up;
            if (entryOrCommentObject.resource === "entry")
                messageArticle.style.setProperty('--commentsCount', `"${entryOrCommentObject.comments.count}"`);
            messageArticle.dataset.commentsCount = entryOrCommentObject.comments.count;
            messageArticle.dataset.voted = entryOrCommentObject.voted;
        }
    }
}
async function checkAndInsertNewEntriesInChannel(ChannelObject, limit = settings.fetch.numbersOfEntriesToLoadInChannel) {
    console.log(`checkAndInsertNewEntriesInChannel(Channel: ${ChannelObject.name})`);
    const entriesArray = await api.getXNewestEntriesFromChannel(ChannelObject, limit);
    const filteredEntries = entriesArray.filter(entry => !ChannelObject.entries.has(entry.id));
    if (filteredEntries.length > 0)
        insertNewItemsFromArray(ChannelObject, filteredEntries);
    return filteredEntries;
}
function insertNewItemsFromArray(ChannelObject, messagesObjectsArray) {
    for (const messageObject of messagesObjectsArray) {
        insertNewItem(ChannelObject, messageObject);
    }
}
function insertNewItem(ChannelObject, messageObject) {
    if (messageObject.id) {
        console.log(`insertNewItem() Channel: ${ChannelObject.name}, entry: ${messageObject.id}`, messageObject);
        addUserToChannel(ChannelObject, messageObject.author);
        insertNewMessage(ChannelObject, messageObject);
    }
}
async function checkAndInsertNewCommentsInChannel(ChannelObject) {
    console.log(`checkAndInsertNewCommentsInChannel(ChannelObject: ${ChannelObject.name})`, ChannelObject);
    for (const [entry_id, entryObject] of ChannelObject.entries) {
        if (entryObject?.comments?.count > 0 && entryObject.comments.count > entryObject.last_checked_comments_count) {
            const commentsArray = await api.getAllCommentsFromEntry(entryObject, 400);
            const filteredComments = commentsArray.filter(comment => !ChannelObject.comments.has(comment.id));
            if (filteredComments.length > 0)
                insertNewItemsFromArray(ChannelObject, filteredComments);
        }
    }
}
export async function checkAndInsertNewCommentsInEntry(ChannelObject, EntryObject) {
    console.log(`checkAndInsertNewCommentsInEntry(ChannelObject: ${ChannelObject.name} | EntryObject: ${EntryObject.id})`, EntryObject);
    if (EntryObject.comments.count > 0) {
        const commentsArray = await api.getAllCommentsFromEntry(EntryObject, 400);
        const filteredComments = commentsArray.filter(comment => !ChannelObject.comments.has(comment.id));
        console.log(`commentsArray for entry ${EntryObject.id}, `, commentsArray);
        console.log(`filteredComments for entry ${EntryObject.id}, `, filteredComments);
        if (filteredComments.length > 0) {
            for (const commentObject of filteredComments) {
                addUserToChannel(ChannelObject, commentObject.author);
                insertNewMessage(ChannelObject, commentObject);
            }
        }
    }
}
async function setCheckingForNewMessagesInChannel(ChannelObject, msInterval = 36000) {
}
async function insertNewMessage(ChannelObject, entryObject) {
    console.log(`🧡insertNewMessage(ChannelObject: ${ChannelObject.name}, entryObject: ${entryObject.id})`);
    console.log(`🧡entryObject:`, entryObject);
    const currentChannel = openedChannels.get(ChannelObject.name);
    if (entryObject.resource === "entry" && currentChannel.entries.has(entryObject.id))
        return false;
    if (entryObject.resource === "entry_comment" && currentChannel.comments.has(entryObject.id))
        return false;
    currentChannel.elements.messagesContainer.append(await getMessageHTMLElement(entryObject));
    currentChannel.addEntryOrCommentToChannelObject(ChannelObject, entryObject);
    if (currentChannel.elements.messagesContainer.dataset.scrollToNew == "1")
        currentChannel.elements.messagesContainer.scrollTop = currentChannel.elements.messagesContainer.scrollHeight;
    if (navigator?.userActivation?.hasBeenActive && entryObject.created_at_SecondsAgo < 120) {
        if (entryObject.author.username == user.username) {
            if (entryObject.resource === "entry" && settings.sounds.outgoing_entry.enabled) {
                sounds.outgoing_entry.play();
            }
            else if (entryObject.resource === "entry_comment" && settings.sounds.outgoing_comment.enabled) {
                sounds.outgoing_comment.play();
            }
        }
        else {
            if (entryObject.resource === "entry" && settings.sounds.incoming_entry.enabled) {
                sounds.incoming_entry.play();
            }
            if (entryObject.resource === "entry_comment" && settings.sounds.incoming_comment.enabled) {
                sounds.incoming_comment.play();
            }
        }
    }
    if (document.visibilityState != "visible" && ChannelObject.loadingStatus == "loaded") {
        window.top.document.title = `*${ChannelObject.name} ${CONST.tabTitleTemplate}`;
    }
}
document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
        if (activeChannels[0] && activeChannels[0].loadingStatus == "loaded") {
            window.top.document.title = `${activeChannels[0].name} ${CONST.tabTitleTemplate}`;
        }
    }
    else if (document.visibilityState === 'hidden') {
    }
});
async function getMessageHTMLElement(entryObject) {
    console.log(`getMessageHTMLElement(entryObject), `, entryObject);
    const templateNode = template_messageArticle.content.cloneNode(true);
    const messageArticle = templateNode.querySelector('.messageArticle');
    const permalinkHref = templateNode.querySelector('.permalinkHref');
    const usernameAHref = templateNode.querySelector('a.username');
    const usernameSpan = templateNode.querySelector('.username_span');
    const messageContent = templateNode.querySelector('.messageContent');
    const entryImage = templateNode.querySelector('.entryImage');
    const entryImageHref = templateNode.querySelector('.entryImageHref');
    const entryMediaEmbedYouTube = templateNode.querySelector('.entryMediaEmbedYouTube');
    const entryMediaEmbedStreamable = templateNode.querySelector('.entryMediaEmbedStreamable');
    const entryMediaEmbedTwitter = templateNode.querySelector('.entryMediaEmbedTwitter');
    const entryDate = templateNode.querySelector('.entryDate');
    const entryDateYYYMMDD = templateNode.querySelector('.entryDateYYYMMDD');
    const entryDateHHMM = templateNode.querySelector('.entryDateHHMM');
    const entryDateHHMMSS = templateNode.querySelector('.entryDateHHMMSS');
    messageArticle.id = `${entryObject.resource}-${String(entryObject.id)}`;
    messageArticle.dataset.id = String(entryObject.id);
    messageArticle.dataset.entryId = String(entryObject.entry_id);
    messageArticle.dataset.authorUsername = entryObject.author?.username;
    messageArticle.style.order = `-${entryObject.created_at_Timestamp}`;
    if (entryObject.author?.username === user.username)
        messageArticle.classList.add("own");
    if (entryObject.author?.username === entryObject.channel?.tag?.author?.username)
        messageArticle.classList.add("channelOwner");
    entryDate.title = `${entryObject.created_at_Format("eeee BBBB")} | ${entryObject.created_at_FormatDistanceSuffix} \n${entryObject.created_at_Format("yyyy-MM-dd 'o godz.' HH:mm ")}`;
    entryDateYYYMMDD.textContent = entryObject.created_at_Format("yyyy-MM-dd");
    entryDateHHMM.textContent = entryObject.created_at_Format("HH:mm");
    entryDateHHMMSS.textContent = entryObject.created_at_Format("HH:mm:ss");
    messageArticle.style.setProperty('--votesUp', `"${entryObject.votes.up}"`);
    messageArticle.dataset.votesUp = `${entryObject.votes.up}`;
    messageArticle.dataset.voted = `${entryObject.voted}`;
    if (entryObject.resource === "entry") {
        messageArticle.classList.add(`entry`);
        permalinkHref.setAttribute("href", `https://go.wykopx.pl/w${entryObject.entry_id}`);
        messageArticle.dataset.commentsCount = `${entryObject.comments.count}`;
        messageArticle.style.setProperty('--commentsCount', `"${entryObject.comments.count}"`);
    }
    else if (entryObject.resource === "entry_comment") {
        messageArticle.classList.add(`comment`, `reply`);
        permalinkHref.setAttribute("href", `https://go.wykopx.pl/w${entryObject.entry_id}k${entryObject.id}`);
    }
    if (entryObject.author.avatar) {
        const userAvatarImg = templateNode.querySelector('.avatar_img');
        userAvatarImg.setAttribute("src", entryObject.author.avatar);
    }
    usernameAHref.setAttribute("href", `https://go.wykopx.pl/@${entryObject.author.username}`);
    usernameAHref.dataset.username = entryObject.author.username;
    usernameAHref.dataset.channel = entryObject.channel.name;
    messageArticle.classList.add(entryObject.author?.status);
    usernameAHref.classList.add(entryObject.author?.status);
    usernameSpan.textContent = entryObject.author.username;
    if (entryObject.author?.color?.name) {
        messageArticle.classList.add(`${entryObject.author?.color?.name}-profile`);
        usernameAHref.classList.add(`${entryObject.author?.color?.name}-profile`);
    }
    if (entryObject.author?.gender == "m") {
        messageArticle.classList.add('male', "m-gender");
        usernameAHref.classList.add('male', "m-gender");
    }
    else if (entryObject.author?.gender == "f") {
        messageArticle.classList.add('female', "f-gender");
        usernameAHref.classList.add('female', "f-gender");
    }
    else {
        messageArticle.classList.add("null-gender");
        usernameAHref.classList.add("null-gender");
    }
    if (entryObject.media?.photo?.url) {
        entryImage.src = entryObject.media.photo.url;
        entryImageHref.href = entryObject.media.photo.url;
    }
    if (entryObject.media?.embed?.url && entryObject.media?.embed?.type) {
        if (entryObject.media?.embed?.type === "youtube")
            entryMediaEmbedYouTube.href = entryObject.media.embed.url;
        else if (entryObject.media?.embed?.type === "streamable")
            entryMediaEmbedStreamable.href = entryObject.media.embed.url;
        else if (entryObject.media?.embed?.type === "twitter")
            entryMediaEmbedTwitter.href = entryObject.media.embed.url;
    }
    if (entryObject.deleted) {
        messageArticle.dataset.deleted = `1`;
        messageContent.innerHTML = "(wiadomość usunięta)";
    }
    else {
        messageContent.innerHTML = entryObject.content_parsed();
    }
    return templateNode;
}
async function getUserHTMLElement(userObject, channelObject) {
    console.log(`getUserHTMLElement(userObject), `, userObject);
    const templateNode = template_userListItem.content.cloneNode(true);
    const userListItem = templateNode.querySelector('.userListItem');
    const userAvatarImg = templateNode.querySelector('.avatar_img');
    const usernameAHref = templateNode.querySelector('a.username');
    const usernameSpan = templateNode.querySelector('.username_span');
    if (userObject.avatar) {
        userAvatarImg.setAttribute("src", userObject.avatar);
    }
    usernameAHref.setAttribute("href", `https://go.wykopx.pl/@${userObject.username}`);
    usernameAHref.dataset.username = userObject.username;
    usernameAHref.dataset.channel = channelObject.name;
    usernameSpan.textContent = userObject.username;
    let userOrderNumber = 0;
    if (settings.usersList.sortAlphabetically)
        userOrderNumber = userObject.numericalOrder;
    if (userObject.color?.name) {
        userListItem.classList.add(`${userObject.color?.name}-profile`);
        usernameAHref.classList.add(`${userObject.color?.name}-profile`);
    }
    if (userObject.gender == "m") {
        userListItem.classList.add('male', "m-gender");
        usernameAHref.classList.add('male', "m-gender");
    }
    else if (userObject.gender == "f") {
        userListItem.classList.add('female', "f-gender");
        usernameAHref.classList.add('female', "f-gender");
    }
    else {
        userListItem.classList.add("null-gender");
        usernameAHref.classList.add("null-gender");
    }
    if (userObject.company)
        userListItem.classList.add("company");
    if (userObject.verified)
        userListItem.classList.add("verified");
    if (userObject.blacklist)
        userListItem.classList.add("blacklist");
    if (userObject.follow)
        userListItem.classList.add("follow");
    if (userObject.note)
        userListItem.classList.add("note");
    if (userObject.online) {
        userListItem.classList.add("online");
        userOrderNumber -= 2000000;
    }
    if (userObject.followers)
        userListItem.dataset.followers = String(userObject.followers);
    if (userObject.member_since)
        userListItem.dataset.memberSince = String(userObject.member_since);
    if (userObject.name)
        userListItem.dataset.name = userObject.name;
    if (userObject.rank?.position) {
        userListItem.dataset.rankPosition = String(userObject.rank.position);
        userListItem.dataset.rankTrend = String(userObject.rank.trend);
    }
    userListItem.classList.add(userObject.status);
    userListItem.dataset.status = userObject.status;
    usernameAHref.classList.add(userObject.status);
    if (userObject.status === "removed")
        userOrderNumber = 5000000;
    else if (userObject.status === "banned")
        userOrderNumber = 4000000;
    else if (userObject.status === "suspended")
        userOrderNumber = 3000000;
    if ((userObject.channel && userObject.username === userObject.channel?.tag?.author?.username) || channelObject && userObject.username === channelObject?.tag?.author?.username) {
        userListItem.classList.add("channelOwner");
        userOrderNumber -= 3000000;
    }
    if (userObject.username === user.username) {
        userListItem.classList.add("own");
        userOrderNumber = -4000000;
    }
    userListItem.style.order = String(userOrderNumber);
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
            if (event.data.token) {
                api.saveToken({ tokenValue: event.data.token, tokenType: "token" });
            }
            break;
        case "userKeep":
            if (event.data.userKeep) {
                api.saveToken({ tokenValue: event.data.userKeep, tokenType: "userKeep" });
            }
            break;
        case "TokensObject":
            if (event.data.token) {
                api.saveToken({ tokenValue: event.data.token, tokenType: "token" });
            }
            if (event.data.userKeep) {
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
    sounds.logged_out.play();
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
    alert("activateChannel");
    if (typeof ChannelObject === "string") {
        if (openedChannels.has(ChannelObject))
            ChannelObject = openedChannels.get(ChannelObject);
        else {
            ChannelObject = new T.Channel(new T.Tag(ChannelObject));
        }
    }
    let newActiveChannelElement = body.querySelector(`.channelFeed[data-channel="channel_${ChannelObject.name}"]`);
    if (!newActiveChannelElement) {
        ChannelObject = await openNewChannel(ChannelObject);
        newActiveChannelElement = ChannelObject.elements.channelFeed;
    }
    if (newActiveChannelElement) {
        activeChannels[0] = ChannelObject;
        alert(activeChannels[0].name);
        window.top.document.title = `#${ChannelObject.name} ${CONST.tabTitleTemplate}`;
        const previousActiveChannel = body.querySelector(`.channelFeed[data-active="true"]`);
        if (previousActiveChannel && previousActiveChannel.dataset.channel === ChannelObject.name)
            return;
        if (previousActiveChannel)
            previousActiveChannel.dataset.active = "false";
        newActiveChannelElement.dataset.active = "true";
        activeChannels[0].elements.messagesContainer.scrollTop = activeChannels[0].elements.messagesContainer.scrollHeight;
        if (ChannelObject.tag?.media?.photo?.url) {
            centerHeader.style.backgroundImage = `url(${ChannelObject.tag?.media?.photo?.url})`;
        }
        else {
            centerHeader.style.backgroundImage = `unset`;
        }
    }
    history.pushState(null, null, `/chat/${ChannelObject.name}`);
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
    localStorage.setItem(`nightMode`, nightMode);
}
document.addEventListener('DOMContentLoaded', (DOMContentLoadedEvent) => {
    if (chooseChannelDialog)
        chooseChannelDialog.showModal();
    document.body.addEventListener(`mouseover`, function (e) {
        if (settings.highlightQuick) {
            let target = e.target;
            let messageArticle = target.closest(`.messageArticle[data-entry-id]`);
            if (messageArticle && !messageArticle.classList.contains(`highlightLock`) && !messageArticle.classList.contains(`highlightQuick`)) {
                if (messageArticle.classList.contains(`comment`)) {
                    messageArticle.classList.add(`highlightQuick`);
                    highlight(`.messageArticle.entry[data-id="${messageArticle.dataset.entryId}"]`, `highlightQuick`);
                    mouseOutAddEventListenerRemoveHighlightQuick(messageArticle);
                }
                else if (messageArticle.classList.contains("entry") && messageArticle.dataset.commentsCount != "0") {
                    messageArticle.classList.add(`highlightQuick`);
                    highlight(`.messageArticle.comment[data-entry-id="${messageArticle.dataset.entryId}"]`, `highlightQuick`);
                    mouseOutAddEventListenerRemoveHighlightQuick(messageArticle);
                }
            }
        }
    });
    document.body.addEventListener("mousedown", function (e) {
        if ((settings.rightClickOnUsernameCopiesToClipboard || settings.rightClickOnUsernameInsertsToNewMessage) && (e.shiftKey || e.ctrlKey || e.altKey || e.button === 2)) {
            e.preventDefault();
            let target = e.target;
            let usernameAHref = target.closest(`a.username`);
            e.preventDefault();
            if (usernameAHref && usernameAHref.dataset.username) {
                e.preventDefault();
                const username = `@${usernameAHref.dataset.username}`;
                if (settings.rightClickOnUsernameCopiesToClipboard) {
                    navigator.clipboard.writeText(username)
                        .then(() => {
                    })
                        .catch(err => {
                        console.error('Failed to copy username: ', err);
                    });
                }
                if (settings.rightClickOnUsernameInsertsToNewMessage) {
                    const newMessageTextarea = openedChannels.get(usernameAHref.dataset.channel).elements.newMessageTextarea;
                    if (newMessageTextarea) {
                        newMessageTextarea.innerText = newMessageTextarea.innerText.trimEnd() + " " + username + " ";
                    }
                }
            }
        }
    });
    document.body.addEventListener('dblclick', function (e) {
        if (settings.highlightLock) {
            let target = e.target;
            let messageArticle = target.closest(".messageArticle[data-entry-id]");
            if (messageArticle) {
                if (messageArticle.classList.contains("highlightLock")) {
                    fn.removeClass(`.messageArticle.highlightedItem`, "highlightedItem");
                    unhighlight(`.messageArticle[data-entry-id="${messageArticle.dataset.entryId}"]`, "highlightLock");
                }
                else {
                    messageArticle.classList.add("highlightedItem");
                    highlight(`.messageArticle[data-entry-id="${messageArticle.dataset.entryId}"]`, "highlightLock");
                }
            }
        }
    });
    document.body.addEventListener("click", async function (e) {
        const target = e.target;
        if (target.tagName === 'BUTTON' && target.classList.contains('loadOlderMessagesButton')) {
            const channelName = target.closest(".channelFeed").dataset.channel;
            const ChannelObject = openedChannels.get(channelName);
            const loadOlderMessagesButton = target.closest("button.loadOlderMessagesButton");
            console.log(`Przycisk "Wczytaj starsze wiadomości na kanale" obecnie na kanale jest: [${ChannelObject.entries.size}] wpisów i [${ChannelObject.comments.size}] komentarzy `);
            if (loadOlderMessagesButton) {
                let olderEntriesArray = await api.getXNewestEntriesFromChannelFromPageHash(ChannelObject, ChannelObject.pagination.next, settings.fetch.numbersOfEntriesToLoadInChannel);
                if (olderEntriesArray.length > 0) {
                    analyzeMessagesArrayAddNewItemsOrUpdateDataExistingMessages(ChannelObject, olderEntriesArray);
                    for (let entryObject of olderEntriesArray) {
                        if (entryObject.comments.count > 0) {
                            await checkAndInsertNewCommentsInEntry(ChannelObject, entryObject);
                        }
                    }
                }
                return true;
            }
            console.log(`Przycisk "Wczytaj starsze wiadomości na kanale" po załadowaniu: [${ChannelObject.entries.size}] wpisów i [${ChannelObject.comments.size}] komentarzy `);
        }
        else if (settings.newMessageSendButton && target.tagName === 'BUTTON' && target.classList.contains('newMessageSendButton')) {
            const channelName = target.dataset.channel;
            const ChannelObject = openedChannels.get(channelName);
            const newMessageTextarea = target.previousElementSibling;
            if (channelName && newMessageTextarea) {
                e.preventDefault();
                let newMessage = await api.postNewMessageToChannel(ChannelObject, prepareNewMessageBody(ChannelObject, { content: newMessageTextarea.innerText }));
                if (newMessage) {
                    console.log("newMessage response before insertNewItem ", newMessage);
                    insertNewItem(ChannelObject, newMessage);
                    newMessageTextarea.innerText = "";
                    console.log("💌 newMessage", newMessage);
                }
            }
        }
    });
    document.body.addEventListener("keydown", async function (e) {
        const target = e.target;
        if ((settings.editorSendHotkey.enter && e.key === 'Enter')
            || (settings.editorSendHotkey.ctrl_enter && e.ctrlKey && e.key === 'Enter')
            || (settings.editorSendHotkey.ctrl_s && e.ctrlKey && e.key === 's')) {
            const newMessageTextarea = target.closest(".newMessageTextarea");
            if (newMessageTextarea) {
                const channelName = newMessageTextarea.dataset.channel;
                const ChannelObject = openedChannels.get(channelName);
                e.preventDefault();
                let newMessage = await api.postNewMessageToChannel(ChannelObject, prepareNewMessageBody(ChannelObject, { content: newMessageTextarea.innerText }));
                insertNewItem(ChannelObject, newMessage);
                newMessageTextarea.innerText = "";
                console.log("💌 newMessage", newMessage);
            }
        }
    });
});
function mouseOutAddEventListenerRemoveHighlightQuick(el) {
    el.addEventListener(`mouseout`, function (e) {
        el.classList.remove(`highlightQuick`);
        unhighlight(`.messageArticle.highlightQuick`, `highlightQuick`);
    });
}
function getMergedSortedFromOldestArrayOfMessages(ChannelObject) {
    return [...Array.from(ChannelObject.entries.values()), ...Array.from(ChannelObject.comments.values())].sort((a, b) => a.created_at_Timestamp - b.created_at_Timestamp);
}
function getMergedSortedFromOldestArrayOfMessagesByUsername(ChannelObject, username) {
    let sortedMessages = [...Array.from(ChannelObject.entries.values()), ...Array.from(ChannelObject.comments.values())].sort((a, b) => a.created_at_Timestamp - b.created_at_Timestamp);
    return sortedMessages.filter((message) => message.author.username === username);
}
function getNewestMessageOfUser(ChannelObject, username) {
    return getMergedSortedFromOldestArrayOfMessagesByUsername(ChannelObject, username).pop();
}
function getUsernamesArrayFromText(text, withoutAtPrefix = true) {
    const regex = /(\B)@([\w-_]+):?/g;
    const usernamesArray = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
        if (withoutAtPrefix && match[0].startsWith("@"))
            usernamesArray.push(match[0].slice(1));
        else
            usernamesArray.push(match[0]);
    }
    return usernamesArray;
}
function prepareNewMessageBody(ChannelObject, messageOptions) {
    console.log(`prepareNewMessageBody() channel: ${ChannelObject.name} | messageOptions: `, messageOptions);
    if (!messageOptions.resource || messageOptions.resource == "entry_comment") {
        const usersArrayInContent = getUsernamesArrayFromText(messageOptions.content, true);
        if (usersArrayInContent.length > 0) {
            console.log("usersArrayInContent", usersArrayInContent);
            const messageObjectReplyingTo = getNewestMessageOfUser(ChannelObject, usersArrayInContent[0]);
            if (messageObjectReplyingTo) {
                console.log("messageObjectReplyingTo", messageObjectReplyingTo);
                messageOptions.resource = "entry_comment";
                messageOptions.entry_id = messageObjectReplyingTo.entry_id;
            }
            else {
                messageOptions.resource = "entry";
            }
        }
    }
    if (!messageOptions.resource)
        messageOptions.resource = "entry";
    console.log("messageOptions", messageOptions);
    if (messageOptions.resource == "entry" && !messageOptions.content.includes(`#${ChannelObject.name}`))
        messageOptions.content += ` #${ChannelObject.name}`;
    if (user.username === "WykopX") {
        settings.promoFooter.roomInfo = true;
        settings.promoFooter.mikroczatLinks = true;
    }
    messageOptions.content += `\n\n---\n`;
    if (settings.promoFooter.roomInfo)
        messageOptions.content += ` 🟢 ${getNumberOfOnlineUsersOnChannel(ChannelObject)} osób online na kanale [**#${ChannelObject.name}**](https://mikroczat.pl/chat/${ChannelObject.name}) \n`;
    if (settings.promoFooter.emoji || settings.promoFooter.label) {
        messageOptions.content += ` [`;
        if (settings.promoFooter.emoji)
            messageOptions.content += `💭`;
        if (settings.promoFooter.emoji && settings.promoFooter.label)
            messageOptions.content += ` `;
        if (settings.promoFooter.label)
            messageOptions.content += `Mikro**czat**`;
        messageOptions.content += `](https://mikroczat.pl/czat/${ChannelObject.name})`;
    }
    if (settings.promoFooter.mikroczatLinks) {
        messageOptions.content += ` | [📘 Instrukcja](https://github.com/wykopx/WykopX/wiki/MikroCzat) `;
        messageOptions.content += ` | [🧷 Skrypt Mikroczat](https://greasyfork.org/en/scripts/489949-wykop-xs-mikroczat) `;
    }
    console.log("prepareNewMessageBody() -- przygotowana tresc nowej wiadomosci: messageOptions", messageOptions);
    return new T.Entry(messageOptions, ChannelObject);
}
function highlight(highlightElementSelector, highlightClass) {
    fn.addClass(highlightElementSelector, highlightClass);
}
function unhighlight(highlightElementSelector, highlightClass) {
    fn.removeClass(highlightElementSelector, highlightClass);
}
function setupScrollListener(messagesContainer) {
    if (messagesContainer) {
        messagesContainer.addEventListener('scroll', function () {
            if (Math.abs(messagesContainer.scrollTop) < messagesContainer.clientHeight) {
                if (messagesContainer.dataset.scrollToNew === "0")
                    messagesContainer.dataset.scrollToNew = "1";
            }
            else {
                if (messagesContainer.dataset.scrollToNew === "1")
                    messagesContainer.dataset.scrollToNew = "0";
            }
        }, false);
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