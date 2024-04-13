import * as CONST from './const.js';
import * as T from './types.js';

import * as fn from './fn.js';

/* 

Z pliku db.js

returns: { "token": "...", "refresh_token": "...", "username": "NadiaFrance"}
usage:
fetchAPIrefreshTokens().then((responseData) => { console.log(responseData); });
let test = await fetchAPIrefreshTokens();
*/





// TODO page next, pobieranie wiecej niz 50
/*
	"pagination": {
	"next": "996Gq6BhwBWkESP",
	"prev": null
*/



export async function getXNewestEntriesFromChannel(ChannelObject: T.Channel, limit: number = 50, FETCH_DELAY_MILLISECONDS = 200): Promise<T.Entry[]>
{
	console.log(`getXNewestEntriesFromChannel(channel: '${ChannelObject.name}', limit: ${limit})`);

	return new Promise(async (resolve, reject) =>
	{
		// POBIERANIE PIERWSZEJ STRONY NAJNOWSZYCH
		await fetch(`https://wykop.pl/api/v3/tags/${ChannelObject.name}/stream?limit=${limit}&sort=all&type=entry`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer " + window.localStorage.getItem("token"),
			},
		})
			.then((response) =>
			{
				//console.log("response", response)
				if (!response.ok)
				{
					console.log("HTTP error! status: ${response.status}");
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.json();
			})
			.then(async (responseJSON) =>
			{
				// console.log(`🟢🟢🟢 responseJSON - tags/${ChannelObject.name}/stream`)
				console.log(responseJSON)
				let entries = responseJSON.data;
				/* "pagination": { "next": "996Gq6BhwBWkESP", "prev": null }  */
				ChannelObject.pagination = responseJSON.pagination;

				const EntriesArray: T.Entry[] = [];

				entries.forEach((entryObject: object) =>
				{
					EntriesArray.push(new T.Entry(entryObject, ChannelObject))
				})

				let totalPages = Math.ceil(limit / 50);	// ile stron trzeba pobrać np. 3 strony dla 110 wpisów
				for (let pageNumber = 2; pageNumber <= totalPages; pageNumber++) // zaczynamy od 2. strony bo 1. już pobraliśmy
				{
					console.log(`Pobieramy kolejną stronę wpisów | page: ${pageNumber} | totalPages: ${totalPages}`);
					EntriesArray.push(...await getXNewestEntriesFromChannelFromPageHash(ChannelObject, ChannelObject.pagination.next, limit));
					await new Promise(resolve => setTimeout(resolve, FETCH_DELAY_MILLISECONDS));
				}

				// EntriesArray.sort((a, b) => a.id - b.id);	// sortowanie rosnąco wg id od najstarszych do najnowszych
				EntriesArray.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // sortowanie wg daty
				resolve(EntriesArray);

			}).catch((error) =>
			{
				if (error instanceof TypeError)
				{
					console.error('xxx Network error:', error); // AWARIA SERWERA
				} else
				{
					console.error('Other error:', error);
				}
				reject(error);
			});
	});
}


export async function getXNewestEntriesFromChannelFromPageHash(ChannelObject: T.Channel, pageHash: string, limit: number = 50): Promise<T.Entry[]>
{
	console.log(`getXNewestEntriesFromChannelFromPageNumber(channel: '${ChannelObject.name}', limit: ${limit}, pageHash: ${pageHash})`);

	return new Promise(async (resolve, reject) =>
	{
		// &page=${pagination.next} -> 85WE5yKsMyypnSa
		await fetch(`https://wykop.pl/api/v3/tags/${ChannelObject.name}/stream?limit=${limit}&sort=all&type=entry&page=${pageHash}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + window.localStorage.getItem("token"),
				},
			})
			.then((response) =>
			{
				//console.log("response", response)
				if (!response.ok)
				{
					console.log("HTTP error! status: ${response.status}");
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.json();
			})
			.then((responseJSON) =>
			{
				// console.log(`🟢🟢🟢 responseJSON - tags/${ChannelObject.name}/stream`)
				console.log(responseJSON.data)
				let entries = responseJSON.data;
				/* "pagination": { "next": "996Gq6BhwBWkESP", "prev": null }  */
				ChannelObject.pagination = responseJSON.pagination;

				const EntriesArray: T.Entry[] = [];
				entries.forEach((entryObject: object) =>
				{
					EntriesArray.push(new T.Entry(entryObject, ChannelObject))
				})

				// EntriesArray.sort((a, b) => a.id - b.id);	// sortowanie rosnąco wg id od najstarszych do najnowszych
				//EntriesArray.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // sortowanie wg daty
				resolve(EntriesArray);

			}).catch((error) =>
			{
				if (error instanceof TypeError)
				{
					console.error('xxx Network error:', error); // AWARIA SERWERA
				} else
				{
					console.error('Other error:', error);
				}
				reject(error);
			});
	});
}





export async function getAllCommentsFromEntry(entry: T.Entry, FETCH_DELAY_MILLISECONDS = 1000): Promise<T.Comment[]>
{
	console.log(`getAllCommentsFromEntry(entry: ${entry.id}, delay: ${FETCH_DELAY_MILLISECONDS})`);
	console.log(`entry`, entry);
	console.log(`entry.comments.count`, entry.comments.count);
	console.log(`entry.last_checked_comments_count`, entry.last_checked_comments_count);

	if (entry.comments.count > 0 && entry.comments.count != entry.last_checked_comments_count)
	{
		return new Promise(async (resolve, reject) =>
		{

			let totalPages = Math.ceil(entry.comments.count / 50);	// na ilu stronach są komentarze

			const CommentsArray: T.Comment[] = [];
			for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++)
			{
				console.log(`getAllCommentsFromEntry(${entry.entry_id})  | page: ${pageNumber} | totalPages: ${totalPages} | entry.comments.count: ${entry.comments.count} | entry.last_checked_comments_count ${entry.last_checked_comments_count}`);
				CommentsArray.push(...await getCommentsFromEntryFromPageNumber(entry, pageNumber, 50));
				await new Promise(resolve => setTimeout(resolve, FETCH_DELAY_MILLISECONDS));
			}

			CommentsArray.sort((a, b) => a.id - b.id);	// sortowanie rosnąco wg id od najstarszych do najnowszych
			//CommentsArray.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // sortowanie wg daty

			// zapisujemy datę najnowszego pobranego komentarza
			if (CommentsArray.length > 0) // zastanowic sie czy zapisywac tylko przy nowych, czy zawsze bez tego if-a
			{
				entry.last_checked_comments_datetime = CommentsArray[CommentsArray.length - 1].created_at;
				entry.last_checked_comments_count = entry.comments.count;	// aktualizujemy liczbę komentarzy we wpisie 
			}

			console.log(`getAllCommentsFromEntry() CommentsArray `, CommentsArray);

			resolve(CommentsArray);
		});
	}

}

export async function getCommentsFromEntryFromPageNumber(entry: T.Entry, page: number = 1, limit: number = 50): Promise<T.Comment[]>
{
	console.log(`getCommentsFromEntryFromPageNumber() entryId: ${entry.entry_id}, limit: ${limit}, page: ${page})`);

	return new Promise(async (resolve, reject) =>
	{
		await fetch(`https://wykop.pl/api/v3/entries/${entry.entry_id}/comments?page=${page}&limit=${limit}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + window.localStorage.getItem("token"),
				},
			})
			.then((response) =>
			{
				// console.log("response", response)
				if (!response.ok)
				{
					console.log("HTTP error! status: ${response.status}");
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.json();
			})
			.then((responseJSON) =>
			{
				// console.log(responseJSON.data)
				let comments = [...responseJSON.data];

				const CommentsArray: T.Comment[] = [];

				comments.forEach((entryObject: object) =>
				{
					CommentsArray.push(new T.Comment(entryObject, entry.channel))
				})

				CommentsArray.sort((a, b) => a.id - b.id);	// sortowanie rosnąco wg id od najstarszych do najnowszych
				//CommentsArray.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // sortowanie wg daty

				resolve(CommentsArray);

			}).catch((error) =>
			{
				if (error instanceof TypeError)
				{
					console.error('xxx Network error:', error); // AWARIA SERWERA
				} else
				{
					console.error('Other error:', error);
				}
				reject(error);
			});
	});

}





/* DATABASE TOKENS */

export async function fetchAPIrefreshTokens(tokensObject: T.TokensObject = { token: null, refresh_token: window.localStorage.getItem("userKeep") }): Promise<T.TokensObject | boolean>
{
	// console.log("fetchAPIrefreshTokens() -> tokensObject", tokensObject)
	if (!tokensObject.refresh_token)
	{
		console.log("fetchAPIrefreshTokens() -> refresh_token NIEDOSTĘPNY ❌")
		return false;
	}

	let url = `${CONST.apiPrefixURL}/refresh-token`;
	let data = {
		"data": {
			"refresh_token": `${tokensObject.refresh_token}`
		}
	};

	try  
	{
		const newTokensObjectFromAPI: T.TokensObject = {};

		try
		{
			console.log(`fetchAPIrefreshTokens() for user: ${tokensObject.username ? tokensObject.username : '-unknown-'} - url: ${url}`)

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});

			if (!response.ok)
			{
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const jsonData = await response.json();
			console.log(`fetchAPIrefreshTokens()  response: jsonData ->`, jsonData)
			newTokensObjectFromAPI.token = jsonData.data.token;
			newTokensObjectFromAPI.refresh_token = jsonData.data.refresh_token;

			console.log(`fetchAPIrefreshTokens() jsonData.data.token ->`, jsonData.data.token)
			console.log(`fetchAPIrefreshTokens() jsonData.data.refresh_token ->`, jsonData.data.refresh_token)


		} catch (error)
		{
			console.error('There was a problem with the fetch operation: ', error);
		}

		// saveTokensToDatabase(newTokensObjectFromAPI);
		saveToken(newTokensObjectFromAPI);

		return newTokensObjectFromAPI;

	} catch (error)
	{
		console.error(`fetchAPIrefreshTokens() - Error: ${error}`);
	}
}
// saveTokensToDatabase({ token, refresh_token, username: "NadiaFrance" })
export function saveTokensToDatabase(tokensObject: T.TokensObject): boolean
{
	// console.log(`saveTokensToDatabase(): tokensObject`, tokensObject);

	if (tokensObject.token) window.localStorage.setItem("token", tokensObject.token);
	if (tokensObject.refresh_token) window.localStorage.setItem("refresh_token", tokensObject.refresh_token);

	return true;
}
export function saveToken(unknownToken: T.TokensObject | T.UnknownToken)
{
	let newTokensObject: T.TokensObject = {};

	if ('tokenValue' in unknownToken)	// { tokenValue: string, tokenType?: "token" | "userKeep" | "refresh_token" | undefined}
	{
		if (unknownToken.tokenValue.length < 64) return false;

		if (fn.isAlphanumericDotHyphenUnderscore(unknownToken.tokenValue) && unknownToken.tokenValue.length >= 225 && (unknownToken.tokenType == "userKeep" || unknownToken.tokenType == undefined))
		{
			newTokensObject.token = unknownToken.tokenValue;
			window.localStorage.setItem('token', unknownToken.tokenValue);
		}

		if (fn.isAlphanumeric(unknownToken.tokenValue) && unknownToken.tokenValue.length == 64 && (unknownToken.tokenType == "userKeep" || unknownToken.tokenType == "refresh_token" || unknownToken.tokenType == undefined))
		{
			newTokensObject.refresh_token = unknownToken.tokenValue;
			window.localStorage.setItem('userKeep', unknownToken.tokenValue);
		}

		if (newTokensObject.token != null || newTokensObject.refresh_token != null) return newTokensObject;
		else return false
	}
	else	// T.TokensObject
	{
		newTokensObject = { ...unknownToken };
		window.localStorage.setItem('token', unknownToken.token);
		window.localStorage.setItem('userKeep', unknownToken.refresh_token);

		return newTokensObject;
	}
}
// getTokenFromDatabase() lub getTokenFromDatabase("NadiaFrance")
export function getTokenFromDatabase(username?: string): T.TokensObject
{
	const tokensObject: T.TokensObject = {
		token: localStorage.getItem('token') ?? null,
		refresh_token: localStorage.getItem('userKeep') ?? null
	};

	// console.log(`getTokenFromDatabase() -> tokensObject: `, tokensObject)

	return tokensObject;
}
