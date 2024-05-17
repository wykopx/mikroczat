import * as api from './wykop_api.js';
import * as CONST from './const.js';
import * as T from './types.js';
import * as fn from './fn.js';
import * as login from './login.js';
import * as ch_fn from './ch_fn.js';
import * as index from './index.js';
import { sounds, openedChannels, activeChannels } from './index.js';
import { settings } from './settings.js';
import { getNumberOfOnlineUsersOnChannel } from './ch_fn.js';
export const template_userListItem = document.getElementById("template_userListItem");
export const template_channelFeed = document.getElementById("template_channelFeed");
const template_usersList = document.getElementById("template_usersList");
const template_messageArticle = document.getElementById("template_messageArticle");
export const mikrochatFeeds = document.getElementById("mikrochatFeeds");
export const chatArea = document.getElementById("chatArea");
export const usersPanel = document.getElementById("usersPanel");
export let fetch = {
    fetchOnHold: 0
};
export async function openNewChannel(ChannelObject) {
    if (dev)
        console.log(`ch.openNewChannel:`, ChannelObject.name);
    if (dev)
        console.log("ch.openNewChannel: openChannelsFromURLArray", openChannelsFromURLArray);
    if (dev)
        console.log("ch.openNewChannel: openedChannels", openedChannels);
    if (dev)
        console.log("ch.openNewChannel: activeChannels", activeChannels);
    if (dev)
        console.log("ch.openNewChannel: activeChannels[0]", activeChannels[0]);
    if (!CONST.ChannelsSpecialMap.has(ChannelObject.name)) {
        await ChannelObject.tag.initFromAPI().then(() => {
            openedChannels.set(ChannelObject.name, ChannelObject);
        });
    }
    const templateChannelFeed = template_channelFeed.content.cloneNode(true);
    const channelFeedDiv = templateChannelFeed.querySelector('.channelFeed');
    const newMessageTextareaContainer = templateChannelFeed.querySelector('.newMessageTextareaContainer');
    const newMessageTextarea = templateChannelFeed.querySelector('.newMessageTextarea');
    const newMessageSendButton = templateChannelFeed.querySelector('.newMessageSendButton');
    const channelStats = templateChannelFeed.querySelector('.channelStats');
    if (channelFeedDiv) {
        channelFeedDiv.dataset.channel = ChannelObject.name;
        if (CONST.ChannelBucketsMap.has(ChannelObject.name)) {
            channelFeedDiv.dataset.bucket = "true";
        }
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
            fetch.fetchOnHold = 0;
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
    addUsersToChannel(ChannelObject, login.loggedUser);
    await checkAndInsertNewEntriesInChannel(ChannelObject, settings.fetch.numberOfEntries1stPreload).then(() => {
        ChannelObject.loadingStatus = "preloaded";
    });
    if (ChannelObject.entries.size > 0) {
        await checkAndInsertNewCommentsInChannel(ChannelObject).then(() => {
            ChannelObject.loadingStatus = "preloaded";
        });
    }
    setupScrollListener(openedChannels.get(ChannelObject.name));
    await fetchOpenedChannelsDataSecondPreload(ChannelObject).then(async () => {
        ChannelObject.loadingStatus = "preloaded";
        await (fetchOpenedChannelsData(ChannelObject));
    });
    return ChannelObject;
}
export async function activateChannel(ChannelObject) {
    if (typeof ChannelObject === "string") {
        let ChannelObjectName = ChannelObject.replaceAll(/_+$/g, "");
        if (openedChannels.has(ChannelObjectName)) {
            ChannelObject = openedChannels.get(ChannelObjectName);
        }
        else {
            ChannelObject = new T.Channel(new T.Tag(ChannelObject));
        }
    }
    if (dev)
        console.log(`ch.activateChannel: ${ChannelObject.name} / ${ChannelObject.nameUnderscore} `, ChannelObject);
    let newActiveChannelElement = mikrochatFeeds.querySelector(`.channelFeed[data-channel="${ChannelObject.name}"]`);
    if (!newActiveChannelElement) {
        ChannelObject = await openNewChannel(ChannelObject);
        newActiveChannelElement = ChannelObject.elements.channelFeed;
    }
    if (newActiveChannelElement) {
        activeChannels[0] = openedChannels.get(ChannelObject.name);
        window.top.document.title = index.generateTabTitle(ChannelObject);
        const previousActiveChannel = mikrochatFeeds.querySelector(`.channelFeed[data-active="true"]`);
        if (previousActiveChannel)
            previousActiveChannel.dataset.active = "false";
        newActiveChannelElement.dataset.active = "true";
        activeChannels[0].elements.messagesContainer.scrollTop = activeChannels[0].elements.messagesContainer.scrollHeight;
        if (ChannelObject.tag?.media?.photo?.url) {
            index.centerHeader.style.backgroundImage = `url(${ChannelObject.tag?.media?.photo?.url})`;
        }
        else {
            index.centerHeader.style.backgroundImage = `unset`;
        }
    }
    if (CONST.ChannelsSpecialMap.has(ChannelObject.name)) {
        let newHistoryURL = `/${$folder}/${CONST.ChannelsSpecialMap.get(ChannelObject.name).urlPath}`;
        if (window.location.pathname !== newHistoryURL) {
            if (dev)
                console.log(`history.pushState 1: /${$folder}/${CONST.ChannelsSpecialMap.get(ChannelObject.name).urlPath}`);
            history.pushState(null, null, newHistoryURL);
        }
    }
    else if (ChannelObject.nameUnderscore.endsWith("_")) {
        let newHistoryURL = `/${$folder}/${ChannelObject.nameUnderscore.replaceAll(/_+$/g, "-")}`;
        if (window.location.pathname !== newHistoryURL) {
            if (dev)
                console.log(`history.pushState 2: /${$folder}/${ChannelObject.nameUnderscore.replaceAll(/_+$/g, "-")}`);
            history.pushState(null, null, newHistoryURL);
        }
    }
    else {
        let newHistoryURL = `/${$folder}/${ChannelObject.name}`;
        if (window.location.pathname !== newHistoryURL) {
            if (dev)
                console.log(`history.pushState 3: /${$folder}/${ChannelObject.name}`);
            history.pushState(null, null, newHistoryURL);
        }
    }
    if (dev)
        console.log("openedChannels", openedChannels);
    if (dev)
        console.log("activeChannels", activeChannels);
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
                if (fetch.fetchOnHold > 0) {
                    if (dev)
                        console.log(`⌛ Promise delay: 20 sekund fetchOnHold: ${fetch.fetchOnHold}| wczytywanie komentarzy | entryObject.id: ${entryObject.id}`);
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
            console.log("fetchOnHold: ", fetch.fetchOnHold);
        if (dev)
            console.log(`⌛ Promise delay: ${settings.refreshIntervals.allEntriesAndComments / 1000} sekund`);
        await new Promise(resolve => setTimeout(resolve, settings.refreshIntervals.allEntriesAndComments));
        if (fetch.fetchOnHold <= 0) {
            await refreshCommentsCountAndVotesUpForAllEntriesInChannel(ChannelObject);
            if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "false")
                ChannelObject.elements.channelFeed.dataset.loading = "false";
            if (newMessageTextarea.innerText != "")
                fetch.fetchOnHold = 2;
        }
        else {
            if (newMessageTextarea) {
                if (newMessageTextarea.innerText == "") {
                    fetch.fetchOnHold = 0;
                }
                else {
                    fetch.fetchOnHold--;
                }
            }
        }
        if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "false")
            ChannelObject.elements.channelFeed.dataset.loading = "false";
    }
}
export async function refreshCommentsCountAndVotesUpForAllEntriesInChannel(ChannelObject) {
    if (dev)
        console.log(`refreshCommentsCountAndVotesUpForAllEntriesInChannel(Channel: ${ChannelObject.name})`);
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
export async function refreshVotesUpForAllCommentsInEntryAndAddNewComments(ChannelObject, EntryObject) {
    if (dev)
        console.log(`refreshVotesUpForAllCommentsInEntry(Channel: ${ChannelObject.name}, Entry: ${EntryObject.id})`);
    if (dev)
        console.log(`--- aktualizacja liczby plusów dla wpisu: ${EntryObject.slug}`);
    const commentsArray = await api.getAllCommentsFromEntry(EntryObject, true);
    if (dev)
        console.log("commentsArray", commentsArray);
    if (commentsArray.length > 0) {
        if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "true")
            ChannelObject.elements.channelFeed.dataset.loading = "true";
        await analyzeMessagesArrayAddNewItemsOrUpdateDataExistingMessages(ChannelObject, commentsArray);
    }
    return true;
}
export async function analyzeMessagesArrayAddNewItemsOrUpdateDataExistingMessages(ChannelObject, messagesArray) {
    for (const entryObject of messagesArray) {
        if ((entryObject.resource == "entry" && !ChannelObject.entries.has(entryObject.id))
            || (entryObject.resource === "entry_comment" && !ChannelObject.comments.has(entryObject.id))) {
            if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "true")
                ChannelObject.elements.channelFeed.dataset.loading = "true";
            insertNewItem(ChannelObject, entryObject);
        }
        else {
            if (entryObject.resource == "entry" && entryObject.comments?.count) {
                if (entryObject.comments.count != ChannelObject.entries.get(entryObject.id)?.comments?.count) {
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
            }
            if (entryObject.votes?.up) {
                if (entryObject.votes.up != ChannelObject.entries.get(entryObject.id)?.votes?.up) {
                    if (dev)
                        console.log(`updateCommentsCountAndVotesUpFromArrayOfRefreshedEntries - for entryObject.votes `, entryObject.votes);
                    if (entryObject.resource == "entry") {
                        if (dev)
                            console.log(`🔼 We wpisie ${entryObject.id} zmieniła się liczba plusów z [${ChannelObject.entries.get(entryObject.id)?.votes?.up}] na [${entryObject.votes.up}]`);
                        ChannelObject.entries.get(entryObject.id).votes.up = entryObject.votes.up;
                    }
                    else if (entryObject.resource === "entry_comment") {
                        if (dev)
                            console.log(`🔼 W komentarzu ${entryObject.id} zmieniła się liczba plusów z [${ChannelObject.comments.get(entryObject.id)?.votes?.up}] na [${entryObject.votes.up}]`);
                        ChannelObject.comments.get(entryObject.id).votes.up = entryObject.votes.up;
                    }
                    if (settings.css.main.channelStats != "disabled") {
                        fn.innerText(`.${ChannelObject.name}_plusesCount`, String([...ChannelObject.entries.values(), ...ChannelObject.comments.values()].reduce((sum, obj) => sum + obj.votes.up, 0)));
                    }
                }
            }
            if (entryObject.resource == "entry" && entryObject.voted && entryObject.voted != ChannelObject.entries.get(entryObject.id)?.voted) {
                if (dev)
                    console.log(`updateCommentsCountAndVotesUpFromArrayOfRefreshedEntries - for entryObject.voted `, entryObject.voted);
                if (dev)
                    console.log(`entryObject`, entryObject);
                if (dev)
                    console.log(`➕ Użytkownik zaplusował wpis ${entryObject.id} zmiana .voted z: [${ChannelObject.entries.get(entryObject.id).voted}] na [${entryObject.voted}]`);
                ChannelObject.entries.get(entryObject.id).voted = entryObject.voted;
            }
            else if (entryObject.resource == "entry_comment" && entryObject.voted && entryObject.voted != ChannelObject.comments.get(entryObject.id).voted) {
                if (dev)
                    console.log(`➕ Użytkownik zaplusował komentarz ${entryObject.id} zmiana .voted z: [${ChannelObject.comments.get(entryObject.id).voted}] na [${entryObject.voted}]`);
                ChannelObject.comments.get(entryObject.id).voted = entryObject.voted;
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
export async function checkAndInsertNewEntriesInChannel(ChannelObject, limit = settings.fetch.numberOfEntries2ndPreload) {
    if (dev)
        console.log(`checkAndInsertNewEntriesInChannel(Channel: ${ChannelObject.name})`);
    const entriesArray = await api.getXNewestEntriesFromChannel(ChannelObject, limit, settings.refreshIntervals.timeoutForEntriesPagesOver50);
    const filteredEntries = entriesArray.filter(entry => !ChannelObject.entries.has(entry.id));
    if (dev)
        console.log("ChannelObject.entries", ChannelObject.entries);
    if (dev)
        console.log("entriesArray", entriesArray);
    if (dev)
        console.log("filteredEntries", filteredEntries);
    if (filteredEntries.length > 0) {
        if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "true")
            ChannelObject.elements.channelFeed.dataset.loading = "true";
        insertNewMessagesFromArray(ChannelObject, filteredEntries);
    }
    return filteredEntries;
}
export async function checkAndInsertNewEntriesToDate(ChannelObject, fetchToDate, delay, FETCH_DELAY_MILLISECONDS = 200) {
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
        insertNewMessagesFromArray(ChannelObject, filteredEntries);
    }
    return filteredEntries;
}
export function insertNewMessagesFromArray(ChannelObject, messagesObjectsArray) {
    for (const messageObject of messagesObjectsArray) {
        insertNewItem(ChannelObject, messageObject);
    }
}
export function insertNewItem(ChannelObject, messageObject) {
    if (messageObject.id) {
        addUsersToChannel(ChannelObject, messageObject.author);
        insertNewMessage(ChannelObject, messageObject);
    }
}
export async function checkAndInsertNewCommentsInChannel(ChannelObject) {
    if (dev)
        console.log(`checkAndInsertNewCommentsInChannel(ChannelObject: ${ChannelObject.name})`, ChannelObject);
    for (const [entry_id, EntryObject] of ChannelObject.entries) {
        await checkAndInsertNewCommentsInEntry(ChannelObject, EntryObject, settings.refreshIntervals.timeoutForCommentsOver50);
    }
}
export async function checkAndInsertNewCommentsInEntry(ChannelObject, EntryObject, FETCH_DELAY_MILLISECONDS = settings.refreshIntervals.timeoutForCommentsOver50) {
    if (dev)
        console.log(`checkAndInsertNewCommentsInEntry(ChannelObject: ${ChannelObject.name} | EntryObject: ${EntryObject.id})`, EntryObject);
    await refreshVotesUpForAllCommentsInEntryAndAddNewComments(ChannelObject, EntryObject);
}
export async function setCheckingForNewMessagesInChannel(ChannelObject, msInterval = 36000) {
}
export async function insertNewMessage(ChannelObject, MessageObject) {
    if (dev)
        console.log(`🧡insertNewMessage(ChannelObject: ${ChannelObject.name}, entryObject: ${MessageObject.id})`);
    if (dev)
        console.log(`🧡entryObject:`, MessageObject);
    if (dev)
        console.log(`🧡ChannelObject:`, ChannelObject);
    const currentChannel = openedChannels.get(ChannelObject.name);
    if (MessageObject.resource === "entry" && currentChannel.entries.has(MessageObject.id))
        return false;
    if (MessageObject.resource === "entry_comment" && currentChannel.comments.has(MessageObject.id))
        return false;
    currentChannel.elements.messagesContainer.append(await getMessageHTMLElement(MessageObject));
    currentChannel.addEntryOrCommentToChannelObject(ChannelObject, MessageObject);
    if (currentChannel.elements.messagesContainer.dataset.scrollToNew == "1")
        currentChannel.elements.messagesContainer.scrollTop = currentChannel.elements.messagesContainer.scrollHeight;
    if (navigator?.userActivation?.hasBeenActive && MessageObject.created_at_SecondsAgo < 120) {
        if (MessageObject.author.username == login.loggedUser.username) {
            if (MessageObject.resource === "entry" && settings.sounds.outgoing_entry.enabled) {
                sounds.outgoing_entry.play();
            }
            else if (MessageObject.resource === "entry_comment" && settings.sounds.outgoing_comment.enabled) {
                sounds.outgoing_comment.play();
            }
        }
        else {
            if (MessageObject.resource === "entry" && settings.sounds.incoming_entry.enabled) {
                sounds.incoming_entry.play();
            }
            if (MessageObject.resource === "entry_comment" && settings.sounds.incoming_comment.enabled) {
                sounds.incoming_comment.play();
            }
        }
    }
    if (document.visibilityState != "visible" && ChannelObject.loadingStatus == "loaded") {
        ChannelObject.unreadMessagesCount++;
        if (MessageObject.isMentioningUser(login.loggedUser.username))
            ChannelObject.unreadMentionsCount++;
        if (settings.tabTitle.unreadMessagesBadge.enabled, settings.tabTitle.unreadMentionsBadge.enabled) {
            window.top.document.title = index.generateTabTitle(ChannelObject);
        }
    }
    if (document.visibilityState == "visible") {
    }
}
export async function addUsersToChannel(ChannelObject, ...userObjectUsernameStringOrUsersArray) {
    if (dev)
        console.log(`addUsersToChannel | Channel: ${ChannelObject.name} | user: ${userObjectUsernameStringOrUsersArray}`, userObjectUsernameStringOrUsersArray);
    if (dev)
        console.log(`typeof `, typeof userObjectUsernameStringOrUsersArray);
    userObjectUsernameStringOrUsersArray.forEach(async (userObject) => {
        if (typeof userObject === 'string' && !ChannelObject.users.has(userObject)) {
            if (dev)
                console.log(`👤 🔶TODO: Adding user ${userObject} by string to channel ${ChannelObject.name}`);
        }
        if (typeof userObject === "object" && !ChannelObject.users.has(userObject.username)) {
            ChannelObject.users.set(userObject.username, userObject);
            if (settings.css.main.channelStats != "disabled") {
                fn.innerText(`.${ChannelObject.name}_usersCount`, String(ChannelObject.users.size));
            }
            if (userObject.online || settings.usersList.showOfflineUsers) {
                if (dev)
                    console.log(`👤 Adding user ${userObject.username} to channel ${ChannelObject.name}`);
                ChannelObject.elements.usersListContainer.append(await getUserHTMLElement(userObject, ChannelObject));
                if (settings.css.main.channelStats != "disabled") {
                    fn.innerText(`.${ChannelObject.name}_usersOnlineCount`, String(getNumberOfOnlineUsersOnChannel(ChannelObject)));
                }
            }
        }
    });
}
export async function getMessageHTMLElement(entryObject) {
    if (dev)
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
    messageArticle.dataset.channel = entryObject.channel.name;
    messageArticle.style.order = `-${entryObject.created_at_Timestamp}`;
    if (entryObject.author?.username === login.loggedUser.username)
        messageArticle?.classList.add("own");
    if (entryObject.author?.username === entryObject.channel?.tag?.author?.username)
        messageArticle?.classList.add("channelOwner");
    if (entryObject.isMentioningUser(login.loggedUser.username))
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
        const userAvatarImgArray = Array.from(templateNode.querySelectorAll('img.avatar_img'));
        userAvatarImgArray.forEach((el) => {
            el.setAttribute("src", entryObject.author.avatar);
        });
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
        const entryImageRecord = fn.generateImageVariantsObject(entryObject.media.photo.url);
        entryImage.src = entryImageRecord[300];
        entryImage.dataset.full = entryImageRecord["src"];
        if (entryObject.media?.photo?.width)
            entryImage.dataset.width = String(entryObject.media?.photo?.width);
        if (entryObject.media?.photo?.height)
            entryImage.dataset.height = String(entryObject.media?.photo?.height);
        if (entryObject.media?.photo?.label)
            entryImage.dataset.label = String(entryObject.media?.photo?.label);
        if (entryObject.media?.photo?.size)
            entryImage.dataset.size = String(entryObject.media?.photo?.size);
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
        if (entryObject.content && (entryObject.content.endsWith(CONST.HANGUL_MIKROCZAT) || entryObject.content.includes("](https://mikroczat.pl/czat/") || entryObject.content.includes(`${CONST.HANGUL_MIKROCZAT}\n---\n`))) {
            messageArticle.dataset.device = "Mikroczat";
        }
        else if (messageArticle.dataset.device != "") {
            messageArticle.dataset.device = entryObject.device;
        }
        messageContent.innerHTML = entryObject.content_parsed();
    }
    return templateNode;
}
export async function getUserHTMLElement(userObject, channelObject) {
    const templateNode = template_userListItem.content.cloneNode(true);
    const userListItem = templateNode.querySelector('.userListItem');
    const userAvatarImg = templateNode.querySelector('.avatar_img');
    const usernameAHref = templateNode.querySelector('a.username');
    const usernameSpan = templateNode.querySelector('.username_span');
    if (userObject.avatar) {
        const userAvatarImgArray = Array.from(templateNode.querySelectorAll('img.avatar_img'));
        userAvatarImgArray.forEach((el) => {
            el.setAttribute("src", userObject.avatar);
        });
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
    if (userObject.username === login.loggedUser.username) {
        userListItem.classList.add("own");
        userOrderNumber = -4000000;
    }
    userListItem.style.order = String(userOrderNumber);
    return templateNode;
}
export async function discussionViewON(ChannelObject, EntryObject) {
    console.log(`discussionViewON: entry: `, EntryObject);
    console.log(`discussionViewON: ChannelObject.entries.get(EntryObject.id): `, ChannelObject.entries.get(EntryObject.id));
    const channelFeed = ChannelObject.elements.channelFeed;
    ChannelObject.discussionViewEntryId = EntryObject.entry_id;
    channelFeed.dataset.discussionViewEntryId = `${EntryObject.entry_id}`;
    setReplyEntryID(ChannelObject, EntryObject);
    channelFeed.style.setProperty('--_idClr', `${fn.messageIDtoHexColor(EntryObject.entry_id, "light", "rgba", 1)}`);
    let css = `.channelFeed[data-channel="${ChannelObject.name}"] .messageArticle:not([data-entry-id="${EntryObject.entry_id}"]) { display: none!important; }`;
    attachDynamicCSS({ fn: "discussionView", entryId: EntryObject.entry_id, channel: ChannelObject.name }, css);
    await checkAndInsertNewCommentsInEntry(ChannelObject, EntryObject);
}
export function discussionViewOFF(ChannelObject, EntryObject) {
    removeReplyEntryID(ChannelObject);
    if (ChannelObject.discussionViewEntryId)
        delete ChannelObject.discussionViewEntryId;
    const channelFeed = ChannelObject.elements.channelFeed;
    if (channelFeed.dataset.discussionViewEntryId)
        delete channelFeed.dataset.discussionViewEntryId;
    channelFeed.style.removeProperty('--_idClr');
    detachDynamicCSS({ fn: "discussionView", channel: ChannelObject.name });
}
export function attachDynamicCSS(options = {}, css) {
    let dynamicCSS;
    dynamicCSS = index.head.querySelector(`style[data-fn="${options.fn}"][data-channel="${options.channel}"][data-entry-id="${options.entryId}"]`);
    if (!dynamicCSS) {
        dynamicCSS = document.createElement('style');
        if (options.fn)
            dynamicCSS.dataset.fn = options.fn;
        if (options.entryId)
            dynamicCSS.dataset.entryId = options.entryId;
        if (options.channel)
            dynamicCSS.dataset.channel = options.channel;
        dynamicCSS.appendChild(document.createTextNode(css));
        index.head.appendChild(dynamicCSS);
    }
    else {
        dynamicCSS.textContent = css;
    }
}
export function detachDynamicCSS(options = {}) {
    let selector = "style";
    if (options.fn)
        selector += `[data-fn="${options.fn}"]`;
    if (options.channel)
        selector += `[data-channel="${options.channel}"]`;
    if (options.entryId)
        selector += `[data-fn="${options.entryId}"]`;
    let dynamicCSS = index.head.querySelector(selector);
    if (dynamicCSS) {
        dynamicCSS.parentNode.removeChild(dynamicCSS);
    }
}
export async function setReplyEntryID(ChannelObject, messageObjectOrId) {
    if (dev)
        console.log(`setReplyEntryID() Channel ${ChannelObject.name}, messageObjectOrId:`, messageObjectOrId);
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
export function removeReplyEntryID(ChannelObject, MessageObject) {
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
export async function executePostNewMessageToChannelFromTextarea(ChannelObject) {
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
        fetch.fetchOnHold = 0;
        if (dev)
            console.log("💌 newMessage", newMessage);
        return newMessage;
    }
    else {
        return false;
    }
}
export async function checkIfYouCanPostCommentInEntry(entry_id) {
    if (dev)
        console.log(`checkIfYouCanPostCommentInEntry() entry_id: ${entry_id}`);
    let newMessageBody = {
        resource: "entry_comment",
        entry_id: entry_id,
        content: ""
    };
    if (dev)
        console.log(`checkIfYouCanPostCommentInEntry() newMessageBody:`, newMessageBody);
    try {
        if (dev)
            console.log(`try > postNewMessageToChannel`);
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
export function mouseOutAddEventListenerRemoveHighlightQuick(el) {
    el.addEventListener(`mouseout`, function (e) {
        el.classList.remove(`highlightQuick`);
        unhighlight(`.messageArticle.highlightQuick`, `highlightQuick`);
    });
}
export function getMergedSortedFromOldestArrayOfMessages(ChannelObject) {
    return [...Array.from(ChannelObject.entries.values()), ...Array.from(ChannelObject.comments.values())].sort((a, b) => a.created_at_Timestamp - b.created_at_Timestamp);
}
export function getMergedSortedFromOldestArrayOfMessagesByUsername(ChannelObject, username) {
    let sortedMessages = [...Array.from(ChannelObject.entries.values()), ...Array.from(ChannelObject.comments.values())].sort((a, b) => a.created_at_Timestamp - b.created_at_Timestamp);
    return sortedMessages.filter((message) => message.author.username === username);
}
export function getNewestMessageOfUser(ChannelObject, username) {
    return getMergedSortedFromOldestArrayOfMessagesByUsername(ChannelObject, username).pop();
}
export function getUsernamesArrayFromText(text, withoutAtPrefix = true) {
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
export function prepareNewMessageBody(ChannelObject, messageOptions) {
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
    if (messageOptions.resource == "entry" && !messageOptions.content.includes(`#${ChannelObject.name}`) && !CONST.ChannelsSpecialMap.has(ChannelObject.name)) {
        messageOptions.content += ` #${ChannelObject.name}`;
    }
    if (settings.promoFooter.enable == false) {
        messageOptions.content += ` [${CONST.HANGUL_MIKROCZAT}](https://mikroczat.pl/czat/${ChannelObject.name})`;
    }
    else if (settings.promoFooter.emoji || settings.promoFooter.label || settings.promoFooter.mikroczatLinks || settings.promoFooter.roomInfo) {
        messageOptions.content += `\n`;
        messageOptions.content += `${CONST.HANGUL_MIKROCZAT}\n---\n`;
        if (settings.promoFooter.roomInfo) {
            let numberOfOnlineUsersOnChannel = ch_fn.getNumberOfOnlineUsersOnChannel(ChannelObject);
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
    }
    if (messageOptions.resource === "entry" && messageOptions.content.length < CONST.newEntryMinimumContentLength) {
        messageOptions.content = messageOptions.content.padEnd(CONST.newEntryMinimumContentLength - messageOptions.content.length, CONST.HANGUL_CHOSEONG_FILLER);
    }
    messageOptions.content += CONST.HANGUL_DETECT_MIKROCZAT_ENDING;
    if (dev)
        console.log("prepareNewMessageBody() -- przygotowana tresc nowej wiadomosci: messageOptions", messageOptions);
    return new T.Entry(messageOptions, ChannelObject);
}
export function highlight(highlightElementSelector, highlightClass) {
    fn.addClass(highlightElementSelector, highlightClass);
}
export function unhighlight(highlightElementSelector, highlightClass) {
    fn.removeClass(highlightElementSelector, highlightClass);
}
export function setupScrollListener(ChannelObject) {
    if (ChannelObject.elements.messagesContainer) {
        ChannelObject.elements.messagesContainer.addEventListener('scroll', function () {
            if (ChannelObject.discussionViewEntryId) {
                ChannelObject.elements.messagesContainer.dataset.scrollToNew = "0";
                return;
            }
            if (Math.abs(ChannelObject.elements.messagesContainer.scrollTop) < ChannelObject.elements.messagesContainer.clientHeight) {
                if (ChannelObject.elements.messagesContainer.dataset.scrollToNew === "0")
                    ChannelObject.elements.messagesContainer.dataset.scrollToNew = "1";
            }
            else {
                if (ChannelObject.elements.messagesContainer.dataset.scrollToNew === "1")
                    ChannelObject.elements.messagesContainer.dataset.scrollToNew = "0";
            }
        }, false);
    }
}
//# sourceMappingURL=ch.js.map