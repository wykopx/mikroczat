import * as CONST from './const.js';
import * as T from './types.js';
import * as fn from './fn.js';
import { settings } from './settings.js';
export async function getNewestEntriesFromChannelUpToSpecifiedDate(ChannelObject, fetchDate = new Date(new Date().getTime() - 24 * 60 * 60 * 1000), limit = 50, FETCH_DELAY_MILLISECONDS = 200) {
    if (dev)
        console.log(`getNewestEntriesFromChannelUpToSpecifiedDate(channel: '${ChannelObject.name}', fetchDate: ${fetchDate})`);
    return new Promise(async (resolve, reject) => {
        let fetchType = "tag";
        let apiURL = `https://wykop.pl/api/v3/tags/${ChannelObject.name}/stream?limit=${limit}&sort=all&type=entry`;
        const currentHour = new Date().getHours();
        if (CONST.ChannelsSpecialMap.has(ChannelObject.name) || (ChannelObject.name == "nocnazmiana" && currentHour < 6)) {
            fetchType = "microblog";
            apiURL = `https://wykop.pl/api/v3/entries?limit=${limit}&sort=newest`;
        }
        else if (CONST.ChannelBucketsMap.has(ChannelObject.name) && !ChannelObject.nameUnderscore.endsWith("_")) {
            fetchType = "bucket";
            apiURL = `https://wykop.pl/api/v3/entries?sort=newest&limit=${limit}&bucket=${CONST.ChannelBucketsMap.get(ChannelObject.name)}`;
        }
        if (dev)
            console.log(apiURL);
        await fetch(apiURL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + window.localStorage.getItem("token"),
            },
        })
            .then((response) => {
            if (!response.ok) {
                if (dev)
                    console.log("HTTP error! status: ${response.status}");
                throw new T.HTTPError(`HTTP error! status: ${response.status}`, response.status);
            }
            return response.json();
        })
            .then(async (responseJSON) => {
            if (dev)
                console.log(responseJSON);
            let newlyFetchedEntries;
            newlyFetchedEntries = responseJSON.data;
            ChannelObject.pagination = responseJSON.pagination;
            const EntriesArray = [];
            if (dev)
                console.log("1. newlyFetchedEntries", newlyFetchedEntries);
            newlyFetchedEntries.forEach((entryObject) => {
                if (Array.isArray(entryObject.tags)) {
                    if (dev)
                        console.log("entryObject", entryObject);
                    if (!CONST.ChannelsSpecialMap.has(ChannelObject.name) && ChannelObject.name != "nocnazmiana") {
                        EntriesArray.push(new T.Entry(entryObject, ChannelObject));
                    }
                    else if (ChannelObject.name === CONST.ChannelsSpecialMap.get("x_minus").selector && entryObject.tags.length >= 1) {
                        EntriesArray.push(new T.Entry(entryObject, ChannelObject));
                    }
                    else if (ChannelObject.name === CONST.ChannelsSpecialMap.get("x_plus").selector) {
                        EntriesArray.push(new T.Entry(entryObject, ChannelObject));
                    }
                    else if (ChannelObject.name === "nocnazmiana" || ChannelObject.name === CONST.ChannelsSpecialMap.get("x").selector) {
                        if (currentHour < 6) {
                            if (entryObject.tags.length === 0 || entryObject.tags.includes("nocnazmiana")) {
                                EntriesArray.push(new T.Entry(entryObject, ChannelObject));
                            }
                        }
                        else {
                            if (ChannelObject.name === CONST.ChannelsSpecialMap.get("x").selector && entryObject.tags.length === 0) {
                                EntriesArray.push(new T.Entry(entryObject, ChannelObject));
                            }
                            else if (ChannelObject.name == "nocnazmiana" && entryObject.tags.includes("nocnazmiana")) {
                                EntriesArray.push(new T.Entry(entryObject, ChannelObject));
                            }
                        }
                    }
                }
            });
            while (new Date(EntriesArray[EntriesArray.length - 1].created_at) > fetchDate) {
                if (dev)
                    console.log(`Zaraz pobierzemy kolejną stronę wpisów do limitu czasowego fetchDate: ${fetchDate} | najstarszy dotychcz. wpis: ${new Date(EntriesArray[EntriesArray.length - 1].created_at)}`);
                EntriesArray.push(...await getXNewestEntriesFromChannelFromPageHash(ChannelObject, ChannelObject.pagination.next, limit));
                await new Promise(resolve => setTimeout(resolve, FETCH_DELAY_MILLISECONDS));
            }
            EntriesArray.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            resolve(EntriesArray);
        }).catch((error) => {
            if (error instanceof TypeError) {
                console.error('xxx Network error:', error);
            }
            else {
                console.error('Other error:', error);
            }
            reject(error);
        });
    });
}
export async function getXNewestEntriesFromChannel(ChannelObject, xItemsToFetch = settings.fetch.numberOfEntries2ndPreload, FETCH_DELAY_MILLISECONDS = 200) {
    if (dev)
        console.log(`getXNewestEntriesFromChannel(channel: '${ChannelObject.name}', fetchXitems: ${xItemsToFetch})`);
    let limit = xItemsToFetch > 50 ? 50 : xItemsToFetch;
    let remainedItemsToFetch = xItemsToFetch;
    return new Promise(async (resolve, reject) => {
        let fetchType = "tag";
        let apiURL = `https://wykop.pl/api/v3/tags/${ChannelObject.name}/stream?limit=${limit}&sort=all&type=entry`;
        const currentHour = new Date().getHours();
        if (CONST.ChannelsSpecialMap.has(ChannelObject.name) || (ChannelObject.name == "nocnazmiana" && currentHour < 6)) {
            fetchType = "microblog";
            apiURL = `https://wykop.pl/api/v3/entries?limit=${limit}&sort=newest`;
        }
        else if (CONST.ChannelBucketsMap.has(ChannelObject.name) && !ChannelObject.nameUnderscore.endsWith("_")) {
            fetchType = "bucket";
            apiURL = `https://wykop.pl/api/v3/entries?sort=newest&limit=${limit}&bucket=${CONST.ChannelBucketsMap.get(ChannelObject.name)}`;
        }
        if (dev)
            console.log(apiURL);
        await fetch(apiURL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + window.localStorage.getItem("token"),
            },
        })
            .then((response) => {
            if (!response.ok) {
                if (dev)
                    console.log("HTTP error! status: ${response.status}");
                throw new T.HTTPError(`HTTP error! status: ${response.status}`, response.status);
            }
            return response.json();
        })
            .then(async (responseJSON) => {
            if (dev)
                console.log(responseJSON);
            let newlyFetchedEntries;
            newlyFetchedEntries = responseJSON.data;
            ChannelObject.pagination = responseJSON.pagination;
            const EntriesArray = [];
            if (dev)
                console.log("2. newlyFetchedEntries", newlyFetchedEntries);
            newlyFetchedEntries.forEach((entryObject) => {
                if (Array.isArray(entryObject.tags)) {
                    if (dev)
                        console.log("entryObject", entryObject);
                    if (dev)
                        console.log(`3. newlyFetchedEntries - przed wywołaniem konstruktora T.Entry - dodawanie sprawdzonych nowych / aktualizowanych wiadomosci`);
                    if (!CONST.ChannelsSpecialMap.has(ChannelObject.name) && ChannelObject.name != "nocnazmiana") {
                        EntriesArray.push(new T.Entry(entryObject, ChannelObject));
                    }
                    else if (ChannelObject.name === CONST.ChannelsSpecialMap.get("x_minus").selector && entryObject.tags.length >= 1) {
                        EntriesArray.push(new T.Entry(entryObject, ChannelObject));
                    }
                    else if (ChannelObject.name === CONST.ChannelsSpecialMap.get("x_plus").selector) {
                        EntriesArray.push(new T.Entry(entryObject, ChannelObject));
                    }
                    else if (ChannelObject.name === "nocnazmiana" || ChannelObject.name === CONST.ChannelsSpecialMap.get("x").selector) {
                        if (currentHour < 6) {
                            if (entryObject.tags.length === 0 || entryObject.tags.includes("nocnazmiana")) {
                                EntriesArray.push(new T.Entry(entryObject, ChannelObject));
                            }
                        }
                        else {
                            if (ChannelObject.name === CONST.ChannelsSpecialMap.get("x").selector && entryObject.tags.length === 0) {
                                EntriesArray.push(new T.Entry(entryObject, ChannelObject));
                            }
                            else if (ChannelObject.name == "nocnazmiana" && entryObject.tags.includes("nocnazmiana")) {
                                EntriesArray.push(new T.Entry(entryObject, ChannelObject));
                            }
                        }
                    }
                }
            });
            remainedItemsToFetch -= limit;
            if (remainedItemsToFetch > 0) {
                const totalPagesToFetch = Math.ceil(xItemsToFetch / limit);
                for (let pageNumber = 2; remainedItemsToFetch > 0;) {
                    let pageLimit = remainedItemsToFetch > 50 ? 50 : remainedItemsToFetch;
                    if (dev)
                        console.log(`Zaraz pobierzemy kolejną stronę wpisów -> getXNewestEntriesFromChannelFromPageHash | remainedItemsToFetch: ${remainedItemsToFetch} | limit: ${limit} | page: ${pageNumber} | totalPages: ${totalPagesToFetch} | xItemsToFetch: ${xItemsToFetch}`);
                    EntriesArray.push(...await getXNewestEntriesFromChannelFromPageHash(ChannelObject, ChannelObject.pagination.next, pageLimit));
                    pageNumber++;
                    remainedItemsToFetch -= pageLimit;
                    await new Promise(resolve => setTimeout(resolve, FETCH_DELAY_MILLISECONDS));
                }
            }
            EntriesArray.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            resolve(EntriesArray);
        }).catch((error) => {
            if (error instanceof TypeError) {
                console.error('xxx Network error:', error);
            }
            else {
                console.error('Other error:', error);
            }
            reject(error);
        });
    });
}
export async function getXNewestEntriesFromChannelFromPageHash(ChannelObject, pageHash, limit = settings.fetch.numberOfEntries2ndPreload) {
    if (dev)
        console.log(`getXNewestEntriesFromChannelFromPageHash(channel: '${ChannelObject.name}' | pageHash: ${pageHash} | limit: ${limit})`);
    return new Promise(async (resolve, reject) => {
        let fetchType = "tag";
        let apiURL = `https://wykop.pl/api/v3/tags/${ChannelObject.name}/stream?limit=${limit}&sort=all&type=entry&page=${pageHash}`;
        const currentHour = new Date().getHours();
        if (CONST.ChannelsSpecialMap.has(ChannelObject.name) || (ChannelObject.name == "nocnazmiana" && currentHour < 6)) {
            fetchType = "microblog";
            apiURL = `https://wykop.pl/api/v3/entries?limit=${limit}&sort=newest&page=${pageHash}`;
        }
        else if (CONST.ChannelBucketsMap.has(ChannelObject.name) && !ChannelObject.nameUnderscore.endsWith("_")) {
            fetchType = "bucket";
            apiURL = `https://wykop.pl/api/v3/entries?sort=newest&limit=${limit}&bucket=${CONST.ChannelBucketsMap.get(ChannelObject.name)}&page=${pageHash}`;
        }
        if (dev)
            console.log(apiURL);
        await fetch(apiURL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + window.localStorage.getItem("token"),
            },
        })
            .then((response) => {
            if (!response.ok) {
                if (dev)
                    console.log("HTTP error! status: ${response.status}");
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
            .then((responseJSON) => {
            if (dev)
                console.log(responseJSON);
            let newlyFetchedEntries;
            newlyFetchedEntries = responseJSON.data;
            ChannelObject.pagination = responseJSON.pagination;
            const EntriesArray = [];
            if (dev)
                console.log("3. newlyFetchedEntries", newlyFetchedEntries);
            newlyFetchedEntries.forEach((entryObject) => {
                if (Array.isArray(entryObject.tags)) {
                    if (dev)
                        console.log("entryObject", entryObject);
                    if (!CONST.ChannelsSpecialMap.has(ChannelObject.name) && ChannelObject.name != "nocnazmiana") {
                        EntriesArray.push(new T.Entry(entryObject, ChannelObject));
                    }
                    else if (ChannelObject.name === CONST.ChannelsSpecialMap.get("x_minus").selector && entryObject.tags.length >= 1) {
                        EntriesArray.push(new T.Entry(entryObject, ChannelObject));
                    }
                    else if (ChannelObject.name === CONST.ChannelsSpecialMap.get("x_plus").selector) {
                        EntriesArray.push(new T.Entry(entryObject, ChannelObject));
                    }
                    else if (ChannelObject.name === "nocnazmiana" || ChannelObject.name === CONST.ChannelsSpecialMap.get("x").selector) {
                        if (currentHour < 6) {
                            if (entryObject.tags.length === 0 || entryObject.tags.includes("nocnazmiana")) {
                                EntriesArray.push(new T.Entry(entryObject, ChannelObject));
                            }
                        }
                        else {
                            if (ChannelObject.name === CONST.ChannelsSpecialMap.get("x").selector && entryObject.tags.length === 0) {
                                EntriesArray.push(new T.Entry(entryObject, ChannelObject));
                            }
                            else if (ChannelObject.name == "nocnazmiana" && entryObject.tags.includes("nocnazmiana")) {
                                EntriesArray.push(new T.Entry(entryObject, ChannelObject));
                            }
                        }
                    }
                }
            });
            resolve(EntriesArray);
        }).catch((error) => {
            if (error instanceof TypeError) {
                console.error('xxx Network error:', error);
            }
            else {
                console.error('Other error:', error);
            }
            reject(error);
        });
    });
}
export async function getAllCommentsFromEntry(entry, forceFetchWhenNoNewComments = false, FETCH_DELAY_MILLISECONDS = 200) {
    if (!entry)
        return;
    if (dev)
        console.log(`getAllCommentsFromEntry(entry: ${entry.id}, delay: ${FETCH_DELAY_MILLISECONDS})`);
    if (dev)
        console.log(`entry`, entry);
    if (dev)
        console.log(`entry.comments.count`, entry?.comments?.count);
    const CommentsArray = [];
    entry.last_checked_comments_datetime = new Date();
    if (entry?.comments?.count > 0 && (forceFetchWhenNoNewComments || entry?.comments?.count != entry?.last_checked_comments_count)) {
        return new Promise(async (resolve, reject) => {
            let totalPages = Math.ceil(entry.comments.count / settings.fetch.numbersOfCommentsToLoad);
            for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
                if (dev)
                    console.log(`getAllCommentsFromEntry(${entry.entry_id}) forceFetchWhenNoNewComments: ${forceFetchWhenNoNewComments} | created_at: ${entry.created_at} | page: ${pageNumber} | totalPages: ${totalPages} | entry.comments.count: ${entry.comments.count} | entry.last_checked_comments_count ${entry.last_checked_comments_count}`);
                CommentsArray.push(...await getCommentsFromEntryFromPageNumber(entry, pageNumber, settings.fetch.numbersOfCommentsToLoad));
                await new Promise(resolve => setTimeout(resolve, FETCH_DELAY_MILLISECONDS));
            }
            if (entry.last_checked_comments_count != entry.comments.count) {
                if (dev)
                    console.log(`❌ CommentsArray: `, CommentsArray);
                if (dev)
                    console.log(`❌ CommentsArray[CommentsArray.length - 1]: `, CommentsArray[CommentsArray.length - 1]);
                if (dev)
                    console.log(`❌ CommentsArray[CommentsArray.length - 1].created_at `, CommentsArray[CommentsArray.length - 1].created_at);
                if (dev)
                    console.log(`❌ entry.comments.count `, entry.comments.count);
                if (dev)
                    console.log(`❌ entry.channel `, entry.channel);
                if (dev)
                    console.log(`❌ entry.channel.name `, entry.channel.name);
                entry.last_checked_comments_count = entry.comments.count;
                if (dev)
                    console.log(`❌ AKTUALIZUJEMY LICZBĘ KOMENTARZY: eentry.last_checked_comments_count `, entry.last_checked_comments_count);
            }
            if (dev)
                console.log(`❌ AKTUALIZUJEMY DATĘ SPRAWDZENIA PLUSÓW W KOMENTARZACH: entry.last_checked_comments_datetime `, entry.last_checked_comments_datetime);
            if (CommentsArray && CommentsArray.length > 0) {
                CommentsArray.sort((a, b) => a.id - b.id);
                if (dev)
                    console.log(`getAllCommentsFromEntry() CommentsArray `, CommentsArray);
                resolve(CommentsArray);
            }
            else {
                return [];
            }
        });
    }
    else {
        return [];
    }
}
export async function getCommentsFromEntryFromPageNumber(entry, page = 1, limit = 50) {
    if (dev)
        console.log(`getCommentsFromEntryFromPageNumber() entryId: ${entry.entry_id}, limit: ${limit}, page: ${page})`);
    return new Promise(async (resolve, reject) => {
        let apiURL = `https://wykop.pl/api/v3/entries/${entry.entry_id}/comments?page=${page}&limit=${limit}`;
        if (dev)
            console.log(apiURL);
        await fetch(apiURL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + window.localStorage.getItem("token"),
            },
        })
            .then((response) => {
            if (!response.ok) {
                if (dev)
                    console.log("HTTP error! status: ${response.status}");
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
            .then((responseJSON) => {
            if (dev)
                console.log("responseJSON.data");
            if (dev)
                console.log(responseJSON.data);
            let comments = [...responseJSON.data];
            const CommentsArray = [];
            comments.forEach((commentObject) => {
                CommentsArray.push(new T.Comment(commentObject, entry.channel));
            });
            CommentsArray.sort((a, b) => a.id - b.id);
            resolve(CommentsArray);
        }).catch((error) => {
            if (error instanceof TypeError) {
                console.error('xxx Network error:', error);
            }
            else {
                console.error('Other error:', error);
            }
            reject(error);
        });
    });
}
export async function voteMessage(EntryObject, upORdown = "up") {
    if (dev)
        console.log(`voteMessage() upORdown: ${upORdown} | EntryObject`, EntryObject);
    let apiURL;
    if (EntryObject.resource && EntryObject.resource == "entry_comment" && EntryObject.entry_id && EntryObject.id) {
        apiURL = `https://wykop.pl/api/v3/entries/${EntryObject.entry_id}/comments/${EntryObject.id}/votes`;
    }
    else if (EntryObject.entry_id) {
        apiURL = `https://wykop.pl/api/v3/entries/${EntryObject.entry_id}/votes`;
    }
    if (dev)
        console.log(`voteMessage() apiURL: `, apiURL);
    return new Promise(async (resolve, reject) => {
        try {
            await fetch(apiURL, {
                method: upORdown.toLowerCase() == "down" ? "DELETE" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + window.localStorage.getItem("token"),
                }
            })
                .then((response) => {
            })
                .then(async (responseJSON) => {
                resolve(true);
            }).catch((error) => {
                if (error instanceof TypeError) {
                }
                else {
                }
                reject(error);
            });
        }
        catch (error) {
            reject(error);
        }
    });
}
export async function postNewMessageToChannel(ChannelObject, message) {
    if (dev)
        console.log(`postNewMessageToChannel: message: `, message);
    let apiURL = "https://wykop.pl/api/v3/entries";
    if (message.resource && message.resource == "entry_comment" && message.entry_id) {
        apiURL = `https://wykop.pl/api/v3/entries/${message.entry_id}/comments`;
    }
    let bodyData = {};
    message.content ? bodyData.content = message.content : "";
    message.photo ? bodyData.photo = message.photo : "";
    message.embed ? bodyData.embed = message.embed : "";
    message.survey ? bodyData.survey = message.survey : "";
    message.adult ? bodyData.adult = message.adult : "";
    if (dev)
        console.log("bodyData to send: ", bodyData);
    if (dev)
        console.log("apiURL: ", apiURL);
    return new Promise(async (resolve, reject) => {
        try {
            await fetch(apiURL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + window.localStorage.getItem("token"),
                },
                body: JSON.stringify({
                    "data": bodyData
                })
            })
                .then((response) => {
                if (dev)
                    console.log("response", response);
                if (!response.ok) {
                    if (dev)
                        console.log(`HTTP error! status: ${response.status}`);
                    throw new T.HTTPError(`HTTP error! status: ${response.status}`, response.status);
                }
                return response.json();
            })
                .then(async (responseJSON) => {
                if (dev)
                    console.log("responseJSON");
                if (dev)
                    console.log(responseJSON);
                if (ChannelObject) {
                    if (dev)
                        console.log("ChannelObject", ChannelObject);
                    let newEntry;
                    if (responseJSON.data.resource == "entry_comment")
                        newEntry = new T.Comment(responseJSON.data, ChannelObject);
                    else
                        newEntry = new T.Entry(responseJSON.data, ChannelObject);
                    if (dev)
                        console.log("const newEntry inside fetch (before resolve): ", newEntry);
                    resolve(newEntry);
                }
            }).catch((error) => {
                if (error instanceof TypeError) {
                }
                else {
                }
                reject(error);
            });
        }
        catch (error) {
            reject(error);
        }
    });
}
export async function refreshTokenFromAPI(tokensObject = { token: null, refresh_token: window.localStorage.getItem("userKeep") }) {
    if (!tokensObject.refresh_token) {
        if (dev)
            console.log("refreshTokenFromAPI() -> refresh_token NIEDOSTĘPNY ❌");
        return false;
    }
    let url = `${CONST.apiPrefixURL}/refresh-token`;
    let data = {
        "data": {
            "refresh_token": `${tokensObject.refresh_token}`
        }
    };
    try {
        const newTokensObjectFromAPI = {};
        try {
            if (dev)
                console.log(`refreshTokenFromAPI() for user: ${tokensObject.username ? tokensObject.username : '[unknown]'} - url: ${url}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const jsonData = await response.json();
            if (dev)
                console.log(`refreshTokenFromAPI()  response: jsonData ->`, jsonData);
            newTokensObjectFromAPI.token = jsonData.data.token;
            newTokensObjectFromAPI.refresh_token = jsonData.data.refresh_token;
            if (dev)
                console.log(`refreshTokenFromAPI() jsonData.data.token ->`, jsonData.data.token);
            if (dev)
                console.log(`refreshTokenFromAPI() jsonData.data.refresh_token ->`, jsonData.data.refresh_token);
        }
        catch (error) {
            console.error('There was a problem with the fetch operation: ', error);
        }
        saveTokenInLocalStorage(newTokensObjectFromAPI);
        return newTokensObjectFromAPI;
    }
    catch (error) {
        console.error(`refreshTokenFromAPI() - Error: ${error}`);
    }
}
export function saveTokenInLocalStoragesToDatabase(tokensObject) {
    if (tokensObject.token)
        window.localStorage.setItem("token", tokensObject.token);
    if (tokensObject.refresh_token)
        window.localStorage.setItem("refresh_token", tokensObject.refresh_token);
    return true;
}
export function saveTokenInLocalStorage(unknownToken) {
    if (dev)
        console.log(`saveTokenInLocalStorage() | unknownToken: `, unknownToken);
    let newTokensObject = {};
    if ('tokenValue' in unknownToken) {
        if (unknownToken.tokenValue.length < 64)
            return false;
        if (fn.isAlphanumericDotHyphenUnderscore(unknownToken.tokenValue) && unknownToken.tokenValue.length >= 225) {
            newTokensObject.token = unknownToken.tokenValue;
            if (unknownToken.tokenType == "guest") {
                window.localStorage.setItem('token', unknownToken.tokenValue);
                window.localStorage.setItem('guestMode', "1");
            }
            if ((unknownToken.tokenType == "token" || unknownToken.tokenType == undefined)) {
                window.localStorage.setItem('token', unknownToken.tokenValue);
            }
        }
        if (fn.isAlphanumeric(unknownToken.tokenValue) && unknownToken.tokenValue.length == 64 && (unknownToken.tokenType == "userKeep" || unknownToken.tokenType == "refresh_token" || unknownToken.tokenType == undefined)) {
            newTokensObject.refresh_token = unknownToken.tokenValue;
            window.localStorage.setItem('userKeep', unknownToken.tokenValue);
        }
        if (newTokensObject.token != null || newTokensObject.refresh_token != null)
            return newTokensObject;
        else
            return false;
    }
    else {
        newTokensObject = { ...unknownToken };
        if (unknownToken.token)
            window.localStorage.setItem('token', unknownToken.token);
        if (unknownToken.refresh_token)
            window.localStorage.setItem('userKeep', unknownToken.refresh_token);
        return newTokensObject;
    }
}
export async function getGuestToken() {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch('/_semantic_data/');
            const data = await response.json();
            const semanticData = data.semantic_data;
            window.localStorage.setItem('token', semanticData);
            window.localStorage.setItem('guestMode', "1");
            resolve({ token: semanticData, username: "Gość" });
        }
        catch (error) {
            console.error('Error fetching semantic data:', error);
            reject(error);
        }
    });
}
//# sourceMappingURL=wykop_api.js.map