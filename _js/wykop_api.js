import * as CONST from './const.js';
import * as T from './types.js';
import * as fn from './fn.js';
import { dev } from './index.js';
import { settings } from './settings.js';
export async function getNewestEntriesFromChannelUpToSpecifiedDate(ChannelObject, fetchDate = new Date(new Date().getTime() - 24 * 60 * 60 * 1000), limit = 50, FETCH_DELAY_MILLISECONDS = 200) {
    if (dev)
        console.log(`getNewestEntriesFromChannelUpToSpecifiedDate(channel: '${ChannelObject.name}', fetchDate: ${fetchDate})`);
    return new Promise(async (resolve, reject) => {
        let apiURL = `https://wykop.pl/api/v3/tags/${ChannelObject.name}/stream?limit=${limit}&sort=all&type=entry`;
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
                console.log(`🟢🟢🟢 responseJSON - tags/${ChannelObject.name}/stream`);
            if (dev)
                console.log(responseJSON);
            let entries = responseJSON.data;
            ChannelObject.pagination = responseJSON.pagination;
            const EntriesArray = [];
            entries.forEach((entryObject) => {
                EntriesArray.push(new T.Entry(entryObject, ChannelObject));
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
        let apiURL = `https://wykop.pl/api/v3/tags/${ChannelObject.name}/stream?limit=${limit}&sort=all&type=entry`;
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
            let entries = responseJSON.data;
            ChannelObject.pagination = responseJSON.pagination;
            const EntriesArray = [];
            entries.forEach((entryObject) => {
                EntriesArray.push(new T.Entry(entryObject, ChannelObject));
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
        let apiURL = `https://wykop.pl/api/v3/tags/${ChannelObject.name}/stream?limit=${limit}&sort=all&type=entry&page=${pageHash}`;
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
                console.log(responseJSON.data);
            let entries = responseJSON.data;
            ChannelObject.pagination = responseJSON.pagination;
            const EntriesArray = [];
            entries.forEach((entryObject) => {
                EntriesArray.push(new T.Entry(entryObject, ChannelObject));
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
export async function getAllCommentsFromEntry(entry, FETCH_DELAY_MILLISECONDS = 200) {
    if (entry.comments.count > 0 && entry.comments.count != entry.last_checked_comments_count) {
        return new Promise(async (resolve, reject) => {
            let totalPages = Math.ceil(entry.comments.count / settings.fetch.numbersOfCommentsToLoad);
            const CommentsArray = [];
            for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
                if (dev)
                    console.log(`getAllCommentsFromEntry(${entry.entry_id})  created_at: ${entry.created_at} | page: ${pageNumber} | totalPages: ${totalPages} | entry.comments.count: ${entry.comments.count} | entry.last_checked_comments_count ${entry.last_checked_comments_count}`);
                CommentsArray.push(...await getCommentsFromEntryFromPageNumber(entry, pageNumber, settings.fetch.numbersOfCommentsToLoad));
                await new Promise(resolve => setTimeout(resolve, FETCH_DELAY_MILLISECONDS));
            }
            CommentsArray.sort((a, b) => a.id - b.id);
            if (CommentsArray.length > 0) {
                entry.last_checked_comments_datetime = CommentsArray[CommentsArray.length - 1].created_at;
                entry.last_checked_comments_count = entry.comments.count;
            }
            if (dev)
                console.log(`getAllCommentsFromEntry() CommentsArray `, CommentsArray);
            resolve(CommentsArray);
        });
    }
}
export async function getCommentsFromEntryFromPageNumber(entry, page = 1, limit = 50) {
    if (dev)
        console.log(`getCommentsFromEntryFromPageNumber() entryId: ${entry.entry_id}, limit: ${limit}, page: ${page})`);
    return new Promise(async (resolve, reject) => {
        await fetch(`https://wykop.pl/api/v3/entries/${entry.entry_id}/comments?page=${page}&limit=${limit}`, {
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
        console.log(`postNewMessageToChannel: "${ChannelObject?.name}" | message: `, message);
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
                    if (dev && ChannelObject)
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
export async function fetchAPIrefreshTokens(tokensObject = { token: null, refresh_token: window.localStorage.getItem("userKeep") }) {
    if (!tokensObject.refresh_token) {
        if (dev)
            console.log("fetchAPIrefreshTokens() -> refresh_token NIEDOSTĘPNY ❌");
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
                console.log(`fetchAPIrefreshTokens() for user: ${tokensObject.username ? tokensObject.username : '-unknown-'} - url: ${url}`);
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
                console.log(`fetchAPIrefreshTokens()  response: jsonData ->`, jsonData);
            newTokensObjectFromAPI.token = jsonData.data.token;
            newTokensObjectFromAPI.refresh_token = jsonData.data.refresh_token;
            if (dev)
                console.log(`fetchAPIrefreshTokens() jsonData.data.token ->`, jsonData.data.token);
            if (dev)
                console.log(`fetchAPIrefreshTokens() jsonData.data.refresh_token ->`, jsonData.data.refresh_token);
        }
        catch (error) {
            console.error('There was a problem with the fetch operation: ', error);
        }
        saveToken(newTokensObjectFromAPI);
        return newTokensObjectFromAPI;
    }
    catch (error) {
        console.error(`fetchAPIrefreshTokens() - Error: ${error}`);
    }
}
export function saveTokensToDatabase(tokensObject) {
    if (tokensObject.token)
        window.localStorage.setItem("token", tokensObject.token);
    if (tokensObject.refresh_token)
        window.localStorage.setItem("refresh_token", tokensObject.refresh_token);
    return true;
}
export function saveToken(unknownToken) {
    if (dev)
        console.log(`saveToken() | unknownToken: `, unknownToken);
    let newTokensObject = {};
    if ('tokenValue' in unknownToken) {
        if (unknownToken.tokenValue.length < 64)
            return false;
        if (fn.isAlphanumericDotHyphenUnderscore(unknownToken.tokenValue) && unknownToken.tokenValue.length >= 225 && (unknownToken.tokenType == "userKeep" || unknownToken.tokenType == undefined)) {
            newTokensObject.token = unknownToken.tokenValue;
            window.localStorage.setItem('token', unknownToken.tokenValue);
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
        window.localStorage.setItem('token', unknownToken.token);
        window.localStorage.setItem('userKeep', unknownToken.refresh_token);
        return newTokensObject;
    }
}
export function getTokenFromDatabase(username) {
    const tokensObject = {
        token: localStorage.getItem('token') ?? null,
        refresh_token: localStorage.getItem('userKeep') ?? null
    };
    return tokensObject;
}
//# sourceMappingURL=wykop_api.js.map