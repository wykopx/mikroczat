'use strict';
import * as api from './wykop_api.js';
import * as CONST from './const.js';
import * as T from './types.js';
import { settings, setSettings } from './settings.js';
import * as fn from './fn.js';
export let dev = false;
if ($folder == "chat")
    dev = true;
const lennyArray = ["ᘳಠ ͟ʖಠᘰ", "¯\\_(ツ)_/¯"];
const openedChannels = new Map();
const activeChannels = [null, null];
let fetchOnHold = 0;
if (dev) {
    settings.css.main.channelStats = "show";
    settings.rightClickOnUsernameCopiesToClipboard = true;
}
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
const youtubeIframe = document.getElementById("youtubeIframe");
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
    closeLoginDialogButton.addEventListener("click", async () => {
        if (processLoginData(loginInput.value)) {
            if (await logIn() != false) {
                loginDialog.close();
            }
        }
    });
if (loginInput) {
    loginInput.addEventListener("paste", (event) => {
        if (dev)
            console.log(event);
        if (dev)
            console.log("event: paste | event.target.value:", event.target.value);
        if (processLoginData(event.target.value))
            logIn();
    });
    loginInput.addEventListener("change", (event) => {
        if (dev)
            console.log(event);
        if (dev)
            console.log("event: paste | event.target.value:", event.target.value);
        if (processLoginData(event.target.value))
            logIn();
    });
    loginInput.addEventListener("input", (event) => {
        if (dev)
            console.log(event);
        if (dev)
            console.log("event: paste | event.target.value:", event.target.value);
        if (processLoginData(event.target.value))
            logIn();
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
        if ('refresh_token' in tokensObject) {
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
    if (dev)
        console.log(`🔑 logIn()`);
    if (tokensObject.refresh_token) {
        let newTokensObject = await api.fetchAPIrefreshTokens();
        if (dev)
            console.log(`🔑 logIn() | newTokensObject: `, newTokensObject);
        if (newTokensObject !== false && newTokensObject.token) {
            if (typeof newTokensObject === 'object' && 'token' in newTokensObject) {
                tokensObject.token = newTokensObject.token;
            }
        }
    }
    if (dev)
        console.log(`🔑 logIn() | tokensObject.token: `, tokensObject.token);
    if (dev)
        console.log(`🔑 logIn() | mikroczatLoggedIn: `, mikroczatLoggedIn);
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
        if (dev)
            console.log("logIn() > response from", response);
        if (!response.ok) {
            mikroczatLoggedIn = false;
            if (dev)
                console.log(`Problem z logowaniem: ${response.status}`);
            await api.fetchAPIrefreshTokens();
            return false;
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
        .then((responseJSON) => {
        if (dev)
            console.log("🟢🟢🟢 responseJSON - api/v3/profile/short");
        if (dev)
            console.log(responseJSON);
        user = responseJSON.data;
        if (dev)
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
    if (dev)
        console.log(`confirmLoggedIn()`);
    if (dev)
        console.log("user:", user);
    mikroczatLoggedIn = true;
    fn.innerHTML(".loggedInUsername", user.username);
    loginDialog.close();
    if (settings.sounds.logged_in && navigator?.userActivation?.hasBeenActive)
        sounds.logged_in.play();
    fn.hide("#showLoginDialog");
    fn.show("#logOutButton");
    document.querySelectorAll("a.loggedInHref").forEach((el) => {
        el.href = 'https://go.wykopx.pl/@${user.username}';
        el.href = 'https://wykop.pl/ludzie/${user.username}';
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
        if (dev)
            console.log("💜openedChannels: ", openedChannels);
        for (let [, ChannelObject] of openedChannels) {
            openNewChannel(ChannelObject);
            await new Promise(resolve => setTimeout(resolve, 1000));
            window.activateChannel(ChannelObject);
            await new Promise(resolve => setTimeout(resolve, 4000));
        }
    }
}
async function addUserToChannel(ChannelObject, ...userObjectUsernameStringOrUsersArray) {
    userObjectUsernameStringOrUsersArray.forEach(async (userObject) => {
        if (typeof userObject === 'string' && !ChannelObject.users.has(userObject)) {
        }
        if (userObject instanceof T.User && !ChannelObject.users.has(userObject.username)) {
            ChannelObject.users.set(userObject.username, userObject);
            if (settings.css.main.channelStats != "disabled") {
                fn.innerText(`.${ChannelObject.name}_usersCount`, String(ChannelObject.users.size));
            }
            if (userObject.online || settings.usersList.showOfflineUsers) {
                ChannelObject.elements.usersListContainer.append(await getUserHTMLElement(userObject, ChannelObject));
                if (settings.css.main.channelStats != "disabled") {
                    fn.innerText(`.${ChannelObject.name}_usersOnlineCount`, String(getNumberOfOnlineUsersOnChannel(ChannelObject)));
                }
            }
        }
    });
}
function getNumberOfOnlineUsersOnChannel(ChannelObject) {
    return Array.from(ChannelObject.users.values()).filter(user => user.online).length;
}
async function openNewChannel(ChannelObject) {
    if (dev)
        console.log(`xopenNewChannel: `, ChannelObject.name);
    await ChannelObject.tag.initFromAPI().then(() => {
        openedChannels.set(ChannelObject.name, ChannelObject);
    });
    const templateChannelFeed = template_channelFeed.content.cloneNode(true);
    const channelFeedDiv = templateChannelFeed.querySelector('.channelFeed');
    const newMessageTextareaContainer = templateChannelFeed.querySelector('.newMessageTextareaContainer');
    const newMessageTextarea = templateChannelFeed.querySelector('.newMessageTextarea');
    const newMessageSendButton = templateChannelFeed.querySelector('.newMessageSendButton');
    const channelStats = templateChannelFeed.querySelector('.channelStats');
    if (channelFeedDiv) {
        channelFeedDiv.dataset.channel = ChannelObject.name;
        newMessageTextareaContainer.dataset.channel = ChannelObject.name;
        channelFeedDiv.style.setProperty('--channel', `"${ChannelObject.name}"`);
        channelFeedDiv.id = `channel_${ChannelObject.name}`;
        if (newMessageSendButton) {
            newMessageSendButton.dataset.channel = ChannelObject.name;
            if (settings.newMessageSendButton == false)
                newMessageSendButton.classList.add("hidden");
        }
        if (channelStats) {
            channelStats.dataset.channel = ChannelObject.name;
            channelStats.querySelector(".channel_usersCount")?.classList.add(`${ChannelObject.name}_usersCount`);
            channelStats.querySelector(".channel_usersOnlineCount")?.classList.add(`${ChannelObject.name}_usersOnlineCount`);
            channelStats.querySelector(".channel_entriesCount")?.classList.add(`${ChannelObject.name}_entriesCount`);
            channelStats.querySelector(".channel_messagesCount")?.classList.add(`${ChannelObject.name}_messagesCount`);
            channelStats.querySelector(".channel_plusesCount")?.classList.add(`${ChannelObject.name}_plusesCount`);
            channelStats.querySelector(".channel_timespan")?.classList.add(`${ChannelObject.name}_timespan`);
        }
        mikrochatFeeds.appendChild(templateChannelFeed);
    }
    ChannelObject.elements.channelFeed = document.getElementById(`channel_${ChannelObject.name}`);
    if (ChannelObject.elements.channelFeed) {
        ChannelObject.elements.channelFeed.querySelector(".newMessageTextarea").addEventListener('blur', function () {
            fetchOnHold = 0;
        });
        ChannelObject.elements.messagesContainer = ChannelObject.elements.channelFeed.querySelector(".messagesContainer");
        ChannelObject.elements.newMessageTextareaContainer = ChannelObject.elements.channelFeed.querySelector(".newMessageTextareaContainer");
        ChannelObject.elements.newMessageTextarea = ChannelObject.elements.channelFeed.querySelector(".newMessageTextarea");
        openedChannels.get(ChannelObject.name).elements.newMessageTextareaContainer = ChannelObject.elements.channelFeed.querySelector(".newMessageTextareaContainer");
        openedChannels.get(ChannelObject.name).elements.newMessageTextarea = ChannelObject.elements.channelFeed.querySelector(".newMessageTextarea");
        openedChannels.get(ChannelObject.name).elements.channelFeed = ChannelObject.elements.channelFeed;
        openedChannels.get(ChannelObject.name).elements.messagesContainer = ChannelObject.elements.channelFeed.querySelector(".messagesContainer");
    }
    const templateUsersList = template_usersList.content.cloneNode(true);
    const usersListDiv = templateUsersList.querySelector('.usersList');
    if (usersListDiv) {
        usersListDiv.dataset.channel = ChannelObject.name;
        usersListDiv.id = `channel_users_${ChannelObject.name}`;
    }
    usersPanel.appendChild(templateUsersList);
    openedChannels.get(ChannelObject.name).elements.usersListContainer = usersPanel.querySelector(".usersListContainer");
    addUserToChannel(ChannelObject, user);
    await checkAndInsertNewEntriesInChannel(ChannelObject, settings.fetch.numberOfEntries1stPreload).then(() => {
        ChannelObject.loadingStatus = "preloaded";
    });
    if (ChannelObject.entries.size > 0)
        await checkAndInsertNewCommentsInChannel(ChannelObject).then(() => {
            ChannelObject.loadingStatus = "preloaded";
        });
    setupScrollListener(openedChannels.get(ChannelObject.name).elements.messagesContainer);
    await fetchOpenedChannelsDataSecondPreload(ChannelObject).then(async () => {
        ChannelObject.loadingStatus = "preloaded";
        await (fetchOpenedChannelsData(ChannelObject));
    });
    return ChannelObject;
}
async function fetchOpenedChannelsDataSecondPreload(ChannelObject) {
    if (ChannelObject.elements.channelFeed.dataset.loading != "false")
        ChannelObject.elements.channelFeed.dataset.loading = "false";
    if (dev)
        console.log(`🌍 fetchOpenedChannelsDataSecondPreload()`);
    if (dev)
        console.log(`💚 DRUGI PRELOAD FETCHING [${ChannelObject.name}]`);
    let newEntriesInsertedArray = [];
    if (ChannelObject.entries.size <= settings.fetch.numberOfEntries1stPreload) {
        if (ChannelObject.elements.channelFeed.dataset.loading != "true")
            ChannelObject.elements.channelFeed.dataset.loading = "true";
        newEntriesInsertedArray = await checkAndInsertNewEntriesInChannel(ChannelObject, settings.fetch.numberOfEntries2ndPreload);
        if (ChannelObject.elements.channelFeed.dataset.loading != "false")
            ChannelObject.elements.channelFeed.dataset.loading = "false";
        ChannelObject.loadingStatus = "preloaded";
        if (newEntriesInsertedArray.length > 0) {
            ChannelObject.elements.channelFeed.dataset.loading = "true";
            newEntriesInsertedArray.sort((a, b) => b.id - a.id);
            if (ChannelObject.elements.channelFeed.dataset.loading != "true")
                ChannelObject.elements.channelFeed.dataset.loading = "true";
            for (let entryObject of newEntriesInsertedArray) {
                if (fetchOnHold > 0) {
                    if (dev)
                        console.log(`⌛ Promise delay: 20 sekund fetchOnHold: ${fetchOnHold}| wczytywanie komentarzy | entryObject.id: ${entryObject.id}`);
                    await new Promise(resolve => setTimeout(resolve, 20000));
                }
                if (entryObject.comments.count > 0) {
                    await checkAndInsertNewCommentsInEntry(ChannelObject, entryObject, 50);
                }
            }
            if (ChannelObject.elements.channelFeed.dataset.loaded != "true")
                ChannelObject.elements.channelFeed.dataset.loaded = "true";
            if (ChannelObject.elements.channelFeed.dataset.loading != "false")
                ChannelObject.elements.channelFeed.dataset.loading = "false";
        }
    }
    if (ChannelObject.elements.channelFeed.dataset.loading != "false")
        ChannelObject.elements.channelFeed.dataset.loading = "false";
    let fetchHoursToLoad = settings.fetch.hoursToLoad;
    if (newEntriesInsertedArray.length > 0 && newEntriesInsertedArray[newEntriesInsertedArray.length - 1].created_at_Date > new Date(new Date().getTime() - fetchHoursToLoad * 60 * 60 * 1000)) {
        if (ChannelObject.entries.size + ChannelObject.comments.size > 700)
            fetchHoursToLoad = 3;
        else if (ChannelObject.entries.size + ChannelObject.comments.size > 200)
            fetchHoursToLoad = 7;
        else if (ChannelObject.entries.size + ChannelObject.comments.size > 100)
            fetchHoursToLoad = 10;
        if (dev)
            console.log(`⌛ ---- Promise delay: za 10s sekund | ROZPOCZYNAM WCZYTYWANIE WPISÓW Z OSTATNICH 24H ----`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        if (ChannelObject.elements.channelFeed.dataset.loading != "true")
            ChannelObject.elements.channelFeed.dataset.loading = "true";
        newEntriesInsertedArray = await checkAndInsertNewEntriesToDate(ChannelObject, settings.fetch.hoursToLoad, 50);
        ChannelObject.loadingStatus = "preloaded";
        if (ChannelObject.elements.channelFeed.dataset.loaded != "true")
            ChannelObject.elements.channelFeed.dataset.loaded = "true";
        if (ChannelObject.elements.channelFeed.dataset.loading != "false")
            ChannelObject.elements.channelFeed.dataset.loading = "false";
        if (newEntriesInsertedArray.length > 0) {
            ChannelObject.elements.channelFeed.dataset.loading = "true";
            newEntriesInsertedArray.sort((a, b) => b.id - a.id);
            if (dev)
                console.log(`⌛ ---- Promise delay: za 15 sekund | ROZPOCZYNAM WCZYTYWANIE KOMENTARZY Z OSTATNICH 24H OD NAJNOWSZEGO ----`);
            await new Promise(resolve => setTimeout(resolve, 15000));
            const groupEntriesNewest = 30;
            const groupEntriesOldest = 10;
            while (newEntriesInsertedArray.length > 0) {
                if (fetchOnHold > 0) {
                    if (dev)
                        console.log(`⌛ Promise delay: 20 sekund fetchOnHold: ${fetchOnHold}| wczytywanie komentarzy`);
                    await new Promise(resolve => setTimeout(resolve, 20000));
                }
                if (ChannelObject.elements.channelFeed.dataset.loading != "true")
                    ChannelObject.elements.channelFeed.dataset.loading = "true";
                for (let k = 0; k < groupEntriesNewest && newEntriesInsertedArray.length > 0; k++) {
                    let entryObject = newEntriesInsertedArray.shift();
                    if (entryObject.comments.count > 0) {
                        if (ChannelObject.elements.channelFeed.dataset.loading != "true")
                            ChannelObject.elements.channelFeed.dataset.loading = "true";
                        if (entryObject.comments.count >= 30) {
                            await checkAndInsertNewCommentsInEntry(ChannelObject, entryObject, 5000);
                            k = groupEntriesNewest;
                        }
                        else {
                            await checkAndInsertNewCommentsInEntry(ChannelObject, entryObject, 10);
                        }
                    }
                }
                if (ChannelObject.elements.channelFeed.dataset.loading != "false")
                    ChannelObject.elements.channelFeed.dataset.loading = "false";
                await new Promise(resolve => setTimeout(resolve, 15000));
                for (let k = 0; k < groupEntriesOldest && newEntriesInsertedArray.length > 0; k++) {
                    let entryObject = newEntriesInsertedArray.pop();
                    if (entryObject.comments.count > 0) {
                        if (ChannelObject.elements.channelFeed.dataset.loading != "true")
                            ChannelObject.elements.channelFeed.dataset.loading = "true";
                        if (entryObject.comments.count >= 30) {
                            await checkAndInsertNewCommentsInEntry(ChannelObject, entryObject, 5000);
                            k = groupEntriesOldest;
                        }
                        else {
                            await checkAndInsertNewCommentsInEntry(ChannelObject, entryObject, 10);
                        }
                    }
                }
                if (ChannelObject.elements.channelFeed.dataset.loading != "false")
                    ChannelObject.elements.channelFeed.dataset.loading = "false";
                await new Promise(resolve => setTimeout(resolve, 9000));
            }
        }
    }
}
async function fetchOpenedChannelsData(ChannelObject) {
    if (dev)
        console.log(`🌍 fetchOpenedChannelsData()`);
    if (dev)
        console.log(`💚 ROZPOCZYNAM AKTUALIZACJĘ WPISÓW NA KANALE [${ChannelObject.name}]`);
    ChannelObject.elements.channelFeed.dataset.loaded = "true";
    ChannelObject.loadingStatus = "loaded";
    const newMessageTextarea = openedChannels.get(ChannelObject.name).elements.newMessageTextarea;
    while (true) {
        if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "false")
            ChannelObject.elements.channelFeed.dataset.loading = "false";
        if (dev)
            console.log("fetchOnHold: ", fetchOnHold);
        if (dev)
            console.log(`⌛ Promise delay: ${settings.refreshIntervals.allEntriesAndComments / 1000} sekund`);
        await new Promise(resolve => setTimeout(resolve, settings.refreshIntervals.allEntriesAndComments));
        if (fetchOnHold <= 0) {
            await refreshAllEntriesCommentsCountAndVotesUpInChannel(ChannelObject);
            if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "false")
                ChannelObject.elements.channelFeed.dataset.loading = "false";
            if (newMessageTextarea.innerText != "")
                fetchOnHold = 2;
        }
        else {
            if (newMessageTextarea) {
                if (newMessageTextarea.innerText == "") {
                    fetchOnHold = 0;
                }
                else {
                    fetchOnHold--;
                }
            }
        }
        if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "false")
            ChannelObject.elements.channelFeed.dataset.loading = "false";
    }
}
async function refreshAllEntriesCommentsCountAndVotesUpInChannel(ChannelObject) {
    if (dev)
        console.log(`refreshAllEntriesCommentsCountAndVotesUpInChannel(Channel: ${ChannelObject.name})`);
    if (dev)
        console.log(`--- aktualizacja liczby plusów i komentarzy we wszystkich otwartych wpisach (${ChannelObject.entries.size} wpisów)`);
    const refreshedEntriesArray = await api.getXNewestEntriesFromChannel(ChannelObject, ChannelObject.entries.size, settings.refreshIntervals.timeoutForEntriesPagesOver50);
    if (refreshedEntriesArray.length > 0) {
        await analyzeMessagesArrayAddNewItemsOrUpdateDataExistingMessages(ChannelObject, refreshedEntriesArray);
    }
    if (ChannelObject.elements.channelFeed)
        ChannelObject.elements.channelFeed.dataset.loading = "false";
    return true;
}
async function analyzeMessagesArrayAddNewItemsOrUpdateDataExistingMessages(ChannelObject, messagesArray) {
    for (const entryObject of messagesArray) {
        if (!ChannelObject.entries.has(entryObject.id)) {
            if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "true")
                ChannelObject.elements.channelFeed.dataset.loading = "true";
            insertNewItem(ChannelObject, entryObject);
        }
        else {
            if (entryObject.comments?.count && entryObject.comments.count != ChannelObject.entries.get(entryObject.id).comments.count) {
                if (dev)
                    console.log(`updateCommentsCountAndVotesUpFromArrayOfRefreshedEntries - for entryObject.comments `, entryObject.comments);
                if (dev)
                    console.log(`💭 We wpisie ${entryObject.id} zmieniła się liczba komentarzy z [${ChannelObject.entries.get(entryObject.id).comments.count}] na [${entryObject.comments.count}]`);
                if (dev)
                    console.log(entryObject);
                if (dev)
                    console.log(entryObject.comments);
                if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "true")
                    ChannelObject.elements.channelFeed.dataset.loading = "true";
                ChannelObject.entries.get(entryObject.id).comments.count = entryObject.comments.count;
            }
            if (entryObject.votes?.up && entryObject.votes.up != ChannelObject.entries.get(entryObject.id).votes.up) {
                if (dev)
                    console.log(`updateCommentsCountAndVotesUpFromArrayOfRefreshedEntries - for entryObject.votes `, entryObject.votes);
                if (dev)
                    console.log(`🔼 We wpisie ${entryObject.id} zmieniła się liczba plusów z [${ChannelObject.entries.get(entryObject.id).votes.up}] na [${entryObject.votes.up}]`);
                ChannelObject.entries.get(entryObject.id).votes.up = entryObject.votes.up;
                if (settings.css.main.channelStats != "disabled") {
                    fn.innerText(`.${ChannelObject.name}_plusesCount`, String([...ChannelObject.entries.values(), ...ChannelObject.comments.values()].reduce((sum, obj) => sum + obj.votes.up, 0)));
                }
            }
            if (entryObject.voted && entryObject.voted != ChannelObject.entries.get(entryObject.id).voted) {
                if (dev)
                    console.log(`updateCommentsCountAndVotesUpFromArrayOfRefreshedEntries - for entryObject.voted `, entryObject.voted);
                if (dev)
                    console.log(`entryObject`, entryObject);
                if (dev)
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
                const plusButton = messageArticle.querySelector("div.buttons > button.plus");
                if (changedObject.voted) {
                    if (!plusButton.classList.contains("voted"))
                        plusButton.classList.add("voted");
                }
                else if (plusButton.classList.contains("voted"))
                    plusButton.classList.remove("voted");
            }
        }
        else if (entryOrCommentObject) {
            messageArticle.style.setProperty('--votesUp', `"${entryOrCommentObject.votes.up}"`);
            messageArticle.dataset.votesUp = entryOrCommentObject.votes.up;
            if (entryOrCommentObject.resource === "entry")
                messageArticle.style.setProperty('--commentsCount', `"${entryOrCommentObject.comments.count}"`);
            messageArticle.dataset.commentsCount = entryOrCommentObject.comments.count;
            messageArticle.dataset.voted = entryOrCommentObject.voted;
            const plusButton = messageArticle.querySelector("div.buttons > button.plus");
            if (changedObject.voted) {
                if (!plusButton.classList.contains("voted"))
                    plusButton.classList.add("voted");
            }
            else if (plusButton.classList.contains("voted"))
                plusButton.classList.remove("voted");
        }
    }
}
async function checkAndInsertNewEntriesInChannel(ChannelObject, limit = settings.fetch.numberOfEntries2ndPreload) {
    if (dev)
        console.log(`checkAndInsertNewEntriesInChannel(Channel: ${ChannelObject.name})`);
    const entriesArray = await api.getXNewestEntriesFromChannel(ChannelObject, limit, settings.refreshIntervals.timeoutForEntriesPagesOver50);
    const filteredEntries = entriesArray.filter(entry => !ChannelObject.entries.has(entry.id));
    if (filteredEntries.length > 0) {
        if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "true")
            ChannelObject.elements.channelFeed.dataset.loading = "true";
        insertNewItemsFromArray(ChannelObject, filteredEntries);
    }
    return filteredEntries;
}
async function checkAndInsertNewEntriesToDate(ChannelObject, fetchToDate, delay, FETCH_DELAY_MILLISECONDS = 200) {
    if (dev)
        console.log(`checkAndInsertNewEntriesToDate(Channel: ${ChannelObject.name}) | fetchToDate: ${fetchToDate}`);
    if (!(fetchToDate instanceof Date)) {
        if (typeof fetchToDate === "number") {
            fetchToDate = new Date(new Date().getTime() - fetchToDate * 60 * 60 * 1000);
        }
        else if (typeof fetchToDate === "string" && fn.isValidDate(fetchToDate)) {
            fetchToDate = new Date(fetchToDate);
        }
    }
    if (!(fetchToDate instanceof Date)) {
        return false;
    }
    if (dev)
        console.log(`fetchToDate: ${fetchToDate}`);
    const entriesArray = await api.getNewestEntriesFromChannelUpToSpecifiedDate(ChannelObject, fetchToDate, 50, FETCH_DELAY_MILLISECONDS);
    const filteredEntries = entriesArray.filter(entry => !ChannelObject.entries.has(entry.id));
    if (filteredEntries.length > 0) {
        if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "true")
            ChannelObject.elements.channelFeed.dataset.loading = "true";
        insertNewItemsFromArray(ChannelObject, filteredEntries);
    }
    return filteredEntries;
}
function insertNewItemsFromArray(ChannelObject, messagesObjectsArray) {
    for (const messageObject of messagesObjectsArray) {
        insertNewItem(ChannelObject, messageObject);
    }
}
function insertNewItem(ChannelObject, messageObject) {
    if (messageObject.id) {
        addUserToChannel(ChannelObject, messageObject.author);
        insertNewMessage(ChannelObject, messageObject);
    }
}
async function checkAndInsertNewCommentsInChannel(ChannelObject) {
    if (dev)
        console.log(`checkAndInsertNewCommentsInChannel(ChannelObject: ${ChannelObject.name})`, ChannelObject);
    for (const [entry_id, entryObject] of ChannelObject.entries) {
        if (entryObject?.comments?.count > 0 && entryObject.comments.count > entryObject.last_checked_comments_count) {
            const commentsArray = await api.getAllCommentsFromEntry(entryObject, settings.refreshIntervals.timeoutForCommentsOver50);
            const filteredComments = commentsArray.filter(comment => !ChannelObject.comments.has(comment.id));
            if (filteredComments.length > 0)
                insertNewItemsFromArray(ChannelObject, filteredComments);
        }
    }
}
export async function checkAndInsertNewCommentsInEntry(ChannelObject, EntryObject, FETCH_DELAY_MILLISECONDS = settings.refreshIntervals.timeoutForCommentsOver50) {
    if (dev)
        console.log(`checkAndInsertNewCommentsInEntry(ChannelObject: ${ChannelObject.name} | EntryObject: ${EntryObject.id})`, EntryObject);
    if (EntryObject.comments.count > 0) {
        const commentsArray = await api.getAllCommentsFromEntry(EntryObject, FETCH_DELAY_MILLISECONDS);
        if (commentsArray && commentsArray.length > 0) {
            const filteredComments = commentsArray.filter(comment => !ChannelObject.comments.has(comment.id));
            if (dev)
                console.log(`commentsArray for entry ${EntryObject.id}, `, commentsArray);
            if (dev)
                console.log(`filteredComments for entry ${EntryObject.id}, `, filteredComments);
            if (filteredComments.length > 0) {
                if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "true")
                    ChannelObject.elements.channelFeed.dataset.loading = "true";
                for (const commentObject of filteredComments) {
                    addUserToChannel(ChannelObject, commentObject.author);
                    insertNewMessage(ChannelObject, commentObject);
                }
            }
        }
    }
}
async function setCheckingForNewMessagesInChannel(ChannelObject, msInterval = 36000) {
}
async function insertNewMessage(ChannelObject, entryObject) {
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
        ChannelObject.unreadMessagesCount++;
        if (entryObject.isMentioningUser(user.username))
            ChannelObject.unreadMentionsCount++;
        if (settings.tabTitle.unreadMessagesBadge.enabled, settings.tabTitle.unreadMentionsBadge.enabled) {
            window.top.document.title = getTabTitle(ChannelObject);
        }
    }
    if (document.visibilityState == "visible") {
    }
}
function getTabTitle(ChannelObject) {
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
    tabTitle += `${ChannelObject.name} ${CONST.tabTitleTemplate}`;
    return tabTitle;
}
document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
        if (activeChannels[0] && activeChannels[0].loadingStatus == "loaded") {
            activeChannels[0].unreadMessagesCount = 0;
            activeChannels[0].unreadMentionsCount = 0;
            window.top.document.title = getTabTitle(activeChannels[0]);
        }
    }
    else if (document.visibilityState === 'hidden') {
    }
});
async function getMessageHTMLElement(entryObject) {
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
    messageArticle.dataset.channel = entryObject.channel.name;
    messageArticle.style.order = `-${entryObject.created_at_Timestamp}`;
    if (entryObject.author?.username === user.username)
        messageArticle?.classList.add("own");
    if (entryObject.author?.username === entryObject.channel?.tag?.author?.username)
        messageArticle?.classList.add("channelOwner");
    if (entryObject.isMentioningUser(user.username))
        messageArticle?.classList.add("isMentioningYou");
    entryDate.title = `${entryObject.created_at_Format("eeee BBBB")} | ${entryObject.created_at_FormatDistanceSuffix} \n${entryObject.created_at_Format("yyyy-MM-dd 'o godz.' HH:mm ")}`;
    entryDateYYYMMDD.textContent = entryObject.created_at_Format("yyyy-MM-dd");
    entryDateHHMM.textContent = entryObject.created_at_Format("HH:mm");
    entryDateHHMMSS.textContent = entryObject.created_at_Format("HH:mm:ss");
    messageArticle.style.setProperty('--votesUp', `"${entryObject.votes.up}"`);
    messageArticle.dataset.votesUp = `${entryObject.votes.up}`;
    messageArticle.dataset.voted = `${entryObject.voted}`;
    if (entryObject.resource === "entry") {
        messageArticle.dataset.resource = "entry";
        messageArticle.classList.add(`entry`);
        permalinkHref.setAttribute("href", `https://go.wykopx.pl/w${entryObject.entry_id}`);
        messageArticle.dataset.commentsCount = `${entryObject.comments.count}`;
        messageArticle.style.setProperty('--commentsCount', `"${entryObject.comments.count}"`);
    }
    else if (entryObject.resource === "entry_comment") {
        messageArticle.dataset.resource = "entry_comment";
        messageArticle.classList.add(`comment`, `reply`);
        permalinkHref.setAttribute("href", `https://go.wykopx.pl/w${entryObject.entry_id}k${entryObject.id}`);
    }
    if (entryObject.author.avatar) {
        const userAvatarImg = templateNode.querySelector('.avatar_img');
        userAvatarImg.setAttribute("src", entryObject.author.avatar);
    }
    usernameAHref.setAttribute("href", `https://go.wykopx.pl/@${entryObject.author.username}`);
    usernameAHref.setAttribute("href", `https://wykop.pl/ludzie/${entryObject.author.username}`);
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
        if (entryObject.media?.embed?.type === "youtube") {
            entryMediaEmbedYouTube.href = entryObject.media.embed.url;
            let embedVideoId = fn.getEmbedVideoIDCodeFromYouTubeURL(entryObject.media.embed.url);
            if (embedVideoId && typeof embedVideoId === "string")
                messageArticle.dataset.youtube = embedVideoId;
        }
        else if (entryObject.media?.embed?.type === "streamable") {
            entryMediaEmbedStreamable.href = entryObject.media.embed.url;
        }
        else if (entryObject.media?.embed?.type === "twitter") {
            entryMediaEmbedTwitter.href = entryObject.media.embed.url;
        }
    }
    if (entryObject.deleted) {
        messageArticle.dataset.deleted = `1`;
        messageContent.innerHTML = "(wiadomość usunięta)";
    }
    else {
        if (entryObject.content.includes("](https://mikroczat.pl/czat/") || entryObject.content.includes(`${CONST.HANGUL_MIKROCZAT}\n---\n`)) {
            messageArticle.dataset.device = "Mikroczat";
        }
        else if (messageArticle.dataset.device != "") {
            messageArticle.dataset.device = entryObject.device;
        }
        messageContent.innerHTML = entryObject.content_parsed();
    }
    return templateNode;
}
async function getUserHTMLElement(userObject, channelObject) {
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
    if (dev)
        console.log("event received", event);
    if (dev)
        console.log("event.origin", event.origin);
    if (dev)
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
    if (dev)
        console.log(`received '${event.data.type}'  from wykop.pl: `, event.data.value);
    if (dev)
        console.log("window.opener", window.opener);
    if (!mikroczatLoggedIn)
        logIn();
}, false);
window.addEventListener("offline", (e) => {
});
window.addEventListener("online", (e) => {
});
window.logout = function () {
    tokensObject = null;
    window.sessionStorage.setItem("mikroczatLoggedOut", "true");
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("userKeep");
    if (settings.sounds.logged_out && navigator?.userActivation?.hasBeenActive)
        sounds.logged_out.play();
    alert("Wylogowano z MikroCzata");
    window.close();
    window.location.reload();
};
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
window.activateChannel = async function (ChannelObject) {
    if (typeof ChannelObject === "string") {
        if (openedChannels.has(ChannelObject))
            ChannelObject = openedChannels.get(ChannelObject);
        else {
            ChannelObject = new T.Channel(new T.Tag(ChannelObject));
        }
    }
    let newActiveChannelElement = mikrochatFeeds.querySelector(`.channelFeed[data-channel="${ChannelObject.name}"]`);
    if (!newActiveChannelElement) {
        ChannelObject = await openNewChannel(ChannelObject);
        newActiveChannelElement = ChannelObject.elements.channelFeed;
    }
    if (newActiveChannelElement) {
        activeChannels[0] = openedChannels.get(ChannelObject.name);
        window.top.document.title = `${ChannelObject.name} ${CONST.tabTitleTemplate}`;
        const previousActiveChannel = mikrochatFeeds.querySelector(`.channelFeed[data-active="true"]`);
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
    history.pushState(null, null, `/${$folder}/${ChannelObject.name}`);
    if (dev)
        console.log("openedChannels", openedChannels);
    if (dev)
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
    console.log("Witaj Mireczku lub Mirabelko, życzę miłego mirkowania na mikro𝗰𝘇𝗮𝗰𝗶𝗲 ❤ ");
    console.log("( ͡° ͜ʖ ͡°) ");
    const mobileInfo = document.querySelector("#mobileInfo");
    if (mobileInfo) {
        if (screen.width < 768) {
            mobileInfo.showModal();
            return true;
        }
        else {
            mobileInfo.remove();
        }
    }
    if (!mikroczatLoggedIn)
        loginDialog.showModal();
    document.querySelector("#showChannelDialogButton").addEventListener("click", function (e) {
        chooseChannelDialog.showModal();
    });
    document.querySelector("#closeChannelDialogButton").addEventListener("click", function (e) {
        chooseChannelDialog.close();
    });
    document.body.addEventListener(`mouseover`, function (e) {
        if (settings.highlightQuick) {
            let target = e.target;
            let messageArticle = target.closest(`.messageArticle[data-entry-id]`);
            if (messageArticle && !messageArticle.classList.contains(`discussionView`) && !messageArticle.classList.contains(`highlightQuick`)) {
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
        if ((settings.rightClickOnUsernameCopiesToClipboard
            || settings.rightClickOnUsernameInsertsToNewMessage
            || settings.rightClickOnUsernameSetsReplyEntry)
            && (e.shiftKey || e.ctrlKey || e.altKey || e.button === 2)) {
            if (settings.rightClickOnUsernameInsertsToNewMessage || settings.rightClickOnUsernameSetsReplyEntry)
                e.preventDefault();
            const target = e.target;
            const usernameAHref = target.closest(`.username`);
            if (usernameAHref && usernameAHref.dataset.username) {
                const username = `@${usernameAHref.dataset.username}`;
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
                fetchOnHold = 2;
                if (settings.rightClickOnUsernameInsertsToNewMessage || settings.rightClickOnUsernameSetsReplyEntry) {
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
                    if (settings.rightClickOnUsernameInsertsToNewMessage) {
                        let pasteText = "";
                        if (newMessageTextarea.innerText != "") {
                            if (newMessageTextarea.innerText.includes(username))
                                return false;
                            pasteText = "<span> </span>";
                        }
                        pasteText += `<span class="entryUser" contenteditable="false"><abbr class="${usernameAHref.getAttribute('class')}" data-channel="nocnazmiana" data-username="${usernameAHref.dataset.username}"><span class="username_span">@${usernameAHref.dataset.username}</span></abbr></span><span> </span>`;
                        pasteText = newMessageTextarea.innerHTML.trimEnd() + pasteText;
                        newMessageTextarea.innerHTML = pasteText;
                    }
                    var range = document.createRange();
                    var sel = window.getSelection();
                    var lastChild = newMessageTextarea.lastChild;
                    var textNode = lastChild.firstChild;
                    range.setStart(textNode, 1);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    if (settings.rightClickOnUsernameSetsReplyEntry && !newMessageTextareaContainer.dataset.entryId) {
                        setReplyEntryID(ChannelObject, MessageObject);
                    }
                }
            }
        }
    });
    document.body.addEventListener("click", async function (e) {
        let target = e.target;
        if (target.tagName === 'BUTTON' && target.classList.contains('loadOlderMessagesButton')) {
            const channelName = target.closest(".channelFeed").dataset.channel;
            const ChannelObject = openedChannels.get(channelName);
            const loadOlderMessagesButton = target.closest("button.loadOlderMessagesButton");
            if (dev)
                console.log(`Przycisk "Wczytaj starsze wiadomości na kanale" obecnie na kanale jest: [${ChannelObject.entries.size}] wpisów i [${ChannelObject.comments.size}] komentarzy `);
            if (loadOlderMessagesButton) {
                let olderEntriesArray = await api.getXNewestEntriesFromChannelFromPageHash(ChannelObject, ChannelObject.pagination.next, settings.fetch.numberOfEntries2ndPreload);
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
                await executePostNewMessageToChannelFromTextarea(ChannelObject);
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
        return false;
    });
    document.body.addEventListener("keydown", async function (e) {
        const target = e.target;
        if (e.ctrlKey && e.key == 's')
            e.preventDefault();
    });
    document.body.addEventListener("keyup", async function (e) {
        const target = e.target;
        const newMessageTextareaContainer = target.closest(".newMessageTextareaContainer");
        const ChannelObject = openedChannels.get(newMessageTextareaContainer.dataset.channel);
        const newMessageTextarea = ChannelObject.elements.newMessageTextarea;
        if (newMessageTextarea) {
            if (newMessageTextarea.innerText === "\n") {
                newMessageTextarea.innerText = "";
            }
            if (!ChannelObject.discussionViewEntryId && (newMessageTextarea.innerText === "" || newMessageTextarea.innerText === " ") && newMessageTextareaContainer.dataset.entryId) {
                removeReplyEntryID(ChannelObject);
            }
            else {
                setReplyEntryID(ChannelObject);
            }
        }
        if (!e.ctrlKey || (e.key != 'Enter' && e.key != 's'))
            return false;
        if (newMessageTextarea && newMessageTextarea.innerText.length > 1) {
            if ((settings.editorSendHotkey.enter && e.key === 'Enter')
                || (settings.editorSendHotkey.ctrl_enter && e.ctrlKey && e.key === 'Enter')
                || (settings.editorSendHotkey.ctrl_s && e.ctrlKey && e.key === 's')) {
                await executePostNewMessageToChannelFromTextarea(ChannelObject);
                return true;
            }
            fetchOnHold = 2;
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
                    discussionViewOFF(ChannelObject, MessageObject);
                }
                else {
                    messageArticle.classList.add("discussionView");
                    discussionViewON(ChannelObject, MessageObject);
                }
            }
        }
    });
});
function discussionViewON(ChannelObject, EntryObject) {
    const channelFeed = ChannelObject.elements.channelFeed;
    ChannelObject.discussionViewEntryId = EntryObject.entry_id;
    channelFeed.dataset.discussionViewEntryId = `${EntryObject.entry_id}`;
    setReplyEntryID(ChannelObject, EntryObject);
    channelFeed.style.setProperty('--_idClr', `${fn.messageIDtoHexColor(EntryObject.entry_id, "light", "rgba", 1)}`);
    let css = `.channelFeed[data-channel="${ChannelObject.name}"] .messageArticle:not([data-entry-id="${EntryObject.entry_id}"]) { display: none!important; }`;
    attachDynamicCSS({ fn: "discussionView", entryId: EntryObject.entry_id, channel: ChannelObject.name }, css);
}
function discussionViewOFF(ChannelObject, EntryObject) {
    removeReplyEntryID(ChannelObject);
    if (ChannelObject.discussionViewEntryId)
        delete ChannelObject.discussionViewEntryId;
    const channelFeed = ChannelObject.elements.channelFeed;
    if (channelFeed.dataset.discussionViewEntryId)
        delete channelFeed.dataset.discussionViewEntryId;
    channelFeed.style.removeProperty('--_idClr');
    detachDynamicCSS({ fn: "discussionView", channel: ChannelObject.name });
}
function attachDynamicCSS(options = {}, css) {
    let dynamicCSS;
    dynamicCSS = head.querySelector(`style[data-fn="${options.fn}"][data-channel="${options.channel}"][data-entry-id="${options.entryId}"]`);
    if (!dynamicCSS) {
        dynamicCSS = document.createElement('style');
        if (options.fn)
            dynamicCSS.dataset.fn = options.fn;
        if (options.entryId)
            dynamicCSS.dataset.entryId = options.entryId;
        if (options.channel)
            dynamicCSS.dataset.channel = options.channel;
        dynamicCSS.appendChild(document.createTextNode(css));
        head.appendChild(dynamicCSS);
    }
    else {
        dynamicCSS.textContent = css;
    }
}
function detachDynamicCSS(options = {}) {
    let selector = "style";
    if (options.fn)
        selector += `[data-fn="${options.fn}"]`;
    if (options.channel)
        selector += `[data-channel="${options.channel}"]`;
    if (options.entryId)
        selector += `[data-fn="${options.entryId}"]`;
    let dynamicCSS = head.querySelector(selector);
    if (dynamicCSS) {
        dynamicCSS.parentNode.removeChild(dynamicCSS);
    }
}
async function setReplyEntryID(ChannelObject, messageObjectOrId) {
    const channelFeed = ChannelObject.elements.channelFeed;
    if (!channelFeed)
        return;
    const newMessageTextareaContainer = ChannelObject.elements.newMessageTextareaContainer;
    const newMessageTextarea = ChannelObject.elements.newMessageTextarea;
    if (!newMessageTextarea || !newMessageTextareaContainer)
        return false;
    if (!newMessageTextareaContainer.dataset.entryId) {
        let replyEntryId;
        if (ChannelObject.discussionViewEntryId) {
            replyEntryId = ChannelObject.discussionViewEntryId;
        }
        if (messageObjectOrId && !replyEntryId) {
            if (typeof messageObjectOrId === "number")
                replyEntryId = messageObjectOrId;
            else if (typeof messageObjectOrId === "object" && messageObjectOrId.entry_id)
                replyEntryId = messageObjectOrId.entry_id;
        }
        if (!replyEntryId) {
        }
        if (replyEntryId) {
            newMessageTextareaContainer.dataset.entryId = `${replyEntryId}`;
            channelFeed.style.setProperty('--_idClr', `${fn.messageIDtoHexColor(replyEntryId, "light", "rgba", 1)}`);
            channelFeed.dataset.replyingEntryId = `${replyEntryId}`;
            let css = `
			.channelFeed:not([data-discussion-view-entry-id])
			{
				.messageArticle[data-entry-id="${replyEntryId}"]::after 	{ content: "⦿"; color: var(--_idClr); position: absolute; bottom: -9px; left: -9px; }
				.messageArticle[data-entry-id="${replyEntryId}"] 			{ border-left-color: var(--_idClr)!important; }
				.messageArticle[data-entry-id="${replyEntryId}"].entry 		{ border-right-color: color-mix(in srgb, var(--_idClr), transparent 10%)!important; }
				.messageArticle[data-entry-id="${replyEntryId}"].comment 	{ border-right-color: color-mix(in srgb, var(--_idClr), transparent 70%)!important; }
			}`;
            attachDynamicCSS({ fn: "replyingToEntry", entryId: replyEntryId, channel: ChannelObject.name }, css);
            let canReplyToEntry = await checkIfYouCanPostCommentInEntry(replyEntryId);
            if (!canReplyToEntry) {
                channelFeed.dataset.replyingBlocked = "true";
            }
        }
    }
    let setResource;
    if (newMessageTextareaContainer.dataset.entryId) {
        let splitFlagsArrayAndMessageContent = fn.getPrefixedFlagsArray(newMessageTextarea.innerText);
        if (splitFlagsArrayAndMessageContent.length == 2) {
            if (dev)
                console.log("splitFlagsArrayAndMessageContent: ", splitFlagsArrayAndMessageContent);
            if (fn.areSomeValuesInArray(splitFlagsArrayAndMessageContent[0], CONST.forceNewEntryFlagsArray)) {
                setResource = "entry";
            }
            else {
                setResource = "entry_comment";
            }
        }
        else {
            setResource = "entry_comment";
        }
    }
    else {
        setResource = "entry";
    }
    newMessageTextareaContainer.dataset.resource = setResource;
}
function removeReplyEntryID(ChannelObject, MessageObject) {
    const newMessageTextareaContainer = ChannelObject.elements.newMessageTextareaContainer;
    const channelFeed = ChannelObject.elements.channelFeed;
    if (newMessageTextareaContainer.dataset.entryId)
        delete newMessageTextareaContainer.dataset.entryId;
    if (newMessageTextareaContainer.dataset.resource)
        delete newMessageTextareaContainer.dataset.resource;
    if (channelFeed.dataset.replyingBlocked)
        delete channelFeed.dataset.replyingBlocked;
    if (channelFeed.dataset.replyingEntryId)
        delete channelFeed.dataset.replyingEntryId;
    if (channelFeed.dataset.discussionViewEntryId)
        delete channelFeed.dataset.discussionViewEntryId;
    channelFeed.style.removeProperty('--_idClr');
    detachDynamicCSS({ fn: "replyingToEntry", channel: ChannelObject.name });
}
async function executePostNewMessageToChannelFromTextarea(ChannelObject) {
    const channelFeed = ChannelObject.elements.channelFeed;
    const newMessageTextarea = ChannelObject.elements.newMessageTextarea;
    const newMessageTextareaContainer = ChannelObject.elements.newMessageTextareaContainer;
    let newMessageBody = prepareNewMessageBody(ChannelObject, { content: newMessageTextarea.innerText });
    let newMessage = await api.postNewMessageToChannel(ChannelObject, newMessageBody);
    if (dev)
        console.log("newMessage response before insertNewItem ", newMessage);
    if (newMessage) {
        insertNewItem(ChannelObject, newMessage);
        newMessageTextarea.innerText = "";
        if (!ChannelObject.discussionViewEntryId) {
            delete newMessageTextareaContainer.dataset.entryId;
            if (channelFeed.dataset.replyingBlocked)
                delete channelFeed.dataset.replyingBlocked;
            if (channelFeed.dataset.discussionViewEntryId)
                delete channelFeed.dataset.discussionViewEntryId;
        }
        fetchOnHold = 0;
        if (dev)
            console.log("💌 newMessage", newMessage);
        return newMessage;
    }
    else {
        return false;
    }
}
async function checkIfYouCanPostCommentInEntry(entry_id) {
    let newMessageBody = {
        resource: "entry_comment",
        entry_id: entry_id,
        content: ""
    };
    try {
        await api.postNewMessageToChannel(null, newMessageBody);
    }
    catch (error) {
        let httpError = error;
        switch (httpError.status) {
            case 400:
                return false;
                break;
            case 409:
                return true;
                break;
            case 429:
                break;
            default:
        }
    }
}
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
    if (dev)
        console.log(`prepareNewMessageBody() channel: ${ChannelObject.name} | messageOptions: `, messageOptions);
    let splitFlagsArrayAndMessageContent = fn.getPrefixedFlagsArray(messageOptions.content);
    if (splitFlagsArrayAndMessageContent.length == 2) {
        if (dev)
            console.log("prefixes", splitFlagsArrayAndMessageContent);
        if (fn.areSomeValuesInArray(splitFlagsArrayAndMessageContent[0], CONST.forceNewEntryFlagsArray)) {
            messageOptions.resource = "entry";
            messageOptions.content = splitFlagsArrayAndMessageContent[1];
        }
    }
    if (!messageOptions.resource || messageOptions.resource == "entry_comment") {
        if (ChannelObject.elements.newMessageTextareaContainer.dataset.entryId && ChannelObject.elements.newMessageTextareaContainer.dataset.resource) {
            messageOptions.resource = ChannelObject.elements.newMessageTextareaContainer.dataset.resource;
            messageOptions.entry_id = parseInt(ChannelObject.elements.newMessageTextareaContainer.dataset.entryId);
        }
        else if (ChannelObject.discussionViewEntryId) {
            messageOptions.resource = "entry_comment";
            messageOptions.entry_id = ChannelObject.discussionViewEntryId;
        }
        else {
            const usersArrayInContent = getUsernamesArrayFromText(messageOptions.content, true);
            if (usersArrayInContent.length > 0) {
                if (dev)
                    console.log("usersArrayInContent", usersArrayInContent);
                const messageObjectReplyingTo = getNewestMessageOfUser(ChannelObject, usersArrayInContent[0]);
                if (messageObjectReplyingTo) {
                    if (dev)
                        console.log("messageObjectReplyingTo", messageObjectReplyingTo);
                    messageOptions.resource = "entry_comment";
                    messageOptions.entry_id = messageObjectReplyingTo.entry_id;
                }
                else {
                    messageOptions.resource = "entry";
                }
            }
        }
    }
    if (!messageOptions.resource)
        messageOptions.resource = "entry";
    if (dev)
        console.log("messageOptions", messageOptions);
    if (messageOptions.resource == "entry" && !messageOptions.content.includes(`#${ChannelObject.name}`))
        messageOptions.content += ` #${ChannelObject.name}`;
    if (user.username === "WykopX") {
        settings.promoFooter.roomInfo = false;
        settings.promoFooter.mikroczatLinks = false;
    }
    messageOptions.content += `\n`;
    if (messageOptions.resource === "entry" && messageOptions.content.length < 47) {
        messageOptions.content = messageOptions.content.padEnd(60, CONST.HANGUL_CHOSEONG_FILLER);
    }
    messageOptions.content += `${CONST.HANGUL_MIKROCZAT}\n---\n`;
    if (settings.promoFooter.roomInfo) {
        let numberOfOnlineUsersOnChannel = getNumberOfOnlineUsersOnChannel(ChannelObject);
        const i = numberOfOnlineUsersOnChannel % 10;
        if (i === 2 || i % 10 === 3 || i % 10 === 4)
            numberOfOnlineUsersOnChannel += 3;
        messageOptions.content += ` 🟢 ${numberOfOnlineUsersOnChannel} osób online na kanale [**#${ChannelObject.name}**](https://mikroczat.pl/czat/${ChannelObject.name}) \n`;
    }
    if (settings.promoFooter.emoji || settings.promoFooter.label) {
        if (settings.promoFooter.emoji && !settings.promoFooter.label)
            messageOptions.content += `[💭](https://mikroczat.pl/czat/${ChannelObject.name})`;
        if (!settings.promoFooter.emoji && settings.promoFooter.label)
            messageOptions.content += `[Mikroczat](https://mikroczat.pl/czat/${ChannelObject.name})`;
        if (settings.promoFooter.emoji && settings.promoFooter.label)
            messageOptions.content += `💭 [Mikroczat](https://mikroczat.pl/czat/${ChannelObject.name})`;
    }
    if (settings.promoFooter.mikroczatLinks) {
        messageOptions.content += ` | [📘 Instrukcja](https://github.com/wykopx/WykopX/wiki/MikroCzat) `;
    }
    if (dev)
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