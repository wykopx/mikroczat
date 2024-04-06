import * as CONST from './const.js';
import * as T from './types.js';
import * as fn from './fn.js';
export async function fetchAPIrefreshTokens(tokensObject = { token: null, refresh_token: window.localStorage.getItem("userKeep") }) {
    console.log("fetchAPIrefreshTokens() -> tokensObject", tokensObject);
    if (!tokensObject.refresh_token) {
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
            console.log(`fetchAPIrefreshTokens()  response: jsonData ->`, jsonData);
            newTokensObjectFromAPI.token = jsonData.data.token;
            newTokensObjectFromAPI.refresh_token = jsonData.data.refresh_token;
            console.log(`fetchAPIrefreshTokens() jsonData.data.token ->`, jsonData.data.token);
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
    console.log(`saveTokensToDatabase(): tokensObject`, tokensObject);
    if (tokensObject.token)
        window.localStorage.setItem("token", tokensObject.token);
    if (tokensObject.refresh_token)
        window.localStorage.setItem("refresh_token", tokensObject.refresh_token);
    return true;
}
export function saveToken(unknownToken) {
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
    console.log(`getTokenFromDatabase() -> tokensObject: `, tokensObject);
    return tokensObject;
}
export async function getEntriesFromChannel(ChannelObject, limit = 50) {
    console.log(`getEntriesFromChannel(channel: '${ChannelObject.name}', limit: ${limit})`);
    return new Promise(async (resolve, reject) => {
        await fetch(`https://wykop.pl/api/v3/tags/${ChannelObject.name}/stream?limit=${limit}&sort=all&type=entry`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + window.localStorage.getItem("token"),
            },
        })
            .then((response) => {
            if (!response.ok) {
                console.log("HTTP error! status: ${response.status}");
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
            .then((responseJSON) => {
            let entries = responseJSON.data;
            const EntriesArray = [];
            entries.forEach(entryObject => {
                EntriesArray.push(new T.Entry(entryObject, ChannelObject));
            });
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
export async function getCommentsFromEntry(entryId, limit = 50, page = 1) {
    console.log(`getCommentsFromEntry(entryId: ${entryId}, limit: ${limit}, page: ${page})`);
    return new Promise(async (resolve, reject) => {
        await fetch(`https://wykop.pl/api/v3/entries/${entryId}/comments?page=${page}&limit=${limit}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + window.localStorage.getItem("token"),
            },
        })
            .then((response) => {
            console.log("response", response);
            if (!response.ok) {
                console.log("HTTP error! status: ${response.status}");
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
            .then((responseJSON) => {
            console.log(responseJSON.data);
            let comments = responseJSON.data;
            const CommentsArray = [];
            comments.forEach((entryObject) => {
                CommentsArray.push(new T.Comment(entryObject));
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
//# sourceMappingURL=wykop_api.js.map