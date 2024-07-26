import * as CONST from './const.js';
import * as chs from './chs.js';
import * as T from './types.js';
import * as login from './login.js';

import * as fn from './fn.js';
// import { dev } from './index.js';
declare let dev: boolean;

let test = "test";


import { settings } from './settings.js';

import { sub } from "../../node_modules/date-fns/sub.mjs";
import { openedChannels } from './index.js';
import { tokensObject } from './login.js';

/* 

Z pliku db.js

returns: { "token": "...", "refresh_token": "...", "username": "NadiaFrance"}
usage:
refreshTokenFromAPI().then((responseData) => { if (dev) console.log(responseData); });
let test = await refreshTokenFromAPI();
*/







// TODO page next, pobieranie wiecej niz 50
/*
	"pagination": {
	"next": "996Gq6BhwBWkESP",
	"prev": null
*/




export async function getNewestEntriesFromChannelUpToSpecifiedDate(ChannelObject: T.ChannelTag, fetchDate: Date = new Date(new Date().getTime() - 24 * 60 * 60 * 1000), limit: number = 50, FETCH_DELAY_MILLISECONDS: number = 200): Promise<T.Entry[]>
{
	// if (dev) console.log(`getNewestEntriesFromChannelUpToSpecifiedDate(channel: '${ChannelObject.name}', fetchDate: ${fetchDate})`);

	return new Promise(async (resolve, reject) =>
	{

		// POBIERANIE PIERWSZEJ STRONY NAJNOWSZYCH x wpisów spod tagu
		let fetchType = "tag";
		let apiURL: string = `https://wykop.pl/api/v3/tags/${ChannelObject.name}/stream?limit=${limit}&sort=all&type=entry`;


		// POBIERANIE WSZYSTKICH WPISÓW Z MIKROBLOGA Z TAGAMI I BEZ TAGÓW + NOCNAZMIANA
		const currentHour = new Date().getHours();

		// KANAŁY SPECJALNE
		if (chs.ChannelsSpecialMap.has(ChannelObject.name) || (ChannelObject.name == "nocnazmiana" && currentHour < 6))
		{
			fetchType = "microblog";
			apiURL = `https://wykop.pl/api/v3/entries?limit=${limit}&sort=newest`
		}

		// POBIERANIE Z WIELU TAGÓW NA RAZ (KATEGORIE)
		else if (chs.ChannelBucketsMap.has(ChannelObject.name) && !ChannelObject.nameUnderscore.endsWith("_"))
		{
			fetchType = "bucket";
			// zwraca wpisy i znaleziska jako responseJSON.data.items: apiURL = `https://wykop.pl/api/v3/buckets/stream/${chs.ChannelBucketsMap.get(ChannelObject.name)}`; // pobranie hasha kategorii
			// mikroblog podanej kategorii
			// błąd w API wykopu - bez ?sort=newest zwracane są tylko 3 elementy i  nie działa paginacja // apiURL = `https://wykop.pl/api/v3/entries?limit=${limit}&bucket=${chs.ChannelBucketsMap.get(ChannelObject.name)}`;
			apiURL = `https://wykop.pl/api/v3/entries?sort=newest&limit=${limit}&bucket=${chs.ChannelBucketsMap.get(ChannelObject.name)}`;
		}

		// if (dev) console.log(apiURL);

		await fetch(apiURL, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer " + window.localStorage.getItem("token"),
			},
		})
			.then((response) =>
			{
				//if (dev) console.log("response", response)
				if (!response.ok)
				{
					// if (dev) console.log("HTTP error! status: ${response.status}");
					// throw new Error(`HTTP error! status: ${response.status}`);
					throw new T.HTTPError(`HTTP error! status: ${response.status}`, response.status);
				}
				return response.json();
			})
			.then(async (responseJSON) =>
			{
				// if (dev) console.log(responseJSON);


				let newlyFetchedEntries: object[];
				/* 	// z /bucket/stream przychodzą w data.items[]
				if (fetchType == "bucket")
				{
					, a oprocz resource == "entry" także "link" i "article" // newlyFetchedEntries = responseJSON.data.items.filter((item: T.Entry) => item.resource === "entry");
				}
				else */
				newlyFetchedEntries = responseJSON.data;



				/* "pagination": { "next": "996Gq6BhwBWkESP", "prev": null }  */
				ChannelObject.pagination = responseJSON.pagination;

				const EntriesArray: T.Entry[] = [];

				// if (dev) console.log("1. newlyFetchedEntries", newlyFetchedEntries);

				newlyFetchedEntries.forEach((entryObject: T.Entry) =>
				{
					if (Array.isArray(entryObject.tags))
					{
						// if (dev) console.log("entryObject", entryObject)

						// normalne pokoje np. /heheszki
						if (!chs.ChannelsSpecialMap.has(ChannelObject.name) && ChannelObject.name != "nocnazmiana") 
						{
							EntriesArray.push(new T.Entry(entryObject, ChannelObject));
						}
						// WSZYSTKIE Z MINIMUM 1 TAGIEM x_minus /- 
						else if (ChannelObject.name === chs.ChannelsSpecialMap.get("x_minus").selector && entryObject.tags.length >= 1) 
						{
							EntriesArray.push(new T.Entry(entryObject, ChannelObject));
						}
						// WSZYSTKIE wiadomości, cały mikroblog x_plus /+ mikroblog+
						else if (ChannelObject.name === chs.ChannelsSpecialMap.get("x_plus").selector) 
						{
							EntriesArray.push(new T.Entry(entryObject, ChannelObject));
						}
						//  WIADOMOSCI BEZ TAGOW W NOCY Z TAGIEM NOCNA ZMIANA /x 
						else if (ChannelObject.name === "nocnazmiana" || ChannelObject.name === chs.ChannelsSpecialMap.get("x").selector)
						{
							// mikroblog - dodajemy tylko wpisy bez tagów
							// NOCNA ZMIANA między 0:00 a 6:00 - MIKROBLOG (wpisy bez tagów) oraz wpisy z tagiem #nocnazmiana razem
							if (currentHour < 6)
							{
								if (entryObject.tags.length === 0 || entryObject.tags.includes("nocnazmiana"))
								{
									EntriesArray.push(new T.Entry(entryObject, ChannelObject))
								}
							}
							// W CIĄGU DNIA MIĘDZY 6:00 A 23:59
							else
							{
								if (ChannelObject.name === chs.ChannelsSpecialMap.get("x").selector && entryObject.tags.length === 0) 
								{
									EntriesArray.push(new T.Entry(entryObject, ChannelObject))
								}
								else if (ChannelObject.name == "nocnazmiana" && entryObject.tags.includes("nocnazmiana"))
								{
									EntriesArray.push(new T.Entry(entryObject, ChannelObject))
								}
							}
						}
					}
				})



				while (new Date(EntriesArray[EntriesArray.length - 1].created_at) > fetchDate) // sprawdzamy czy ostatni pobrany wpis jest młodszy niż limit
				{
					// if (dev) console.log(`Zaraz pobierzemy kolejną stronę wpisów do limitu czasowego fetchDate: ${fetchDate} | najstarszy dotychcz. wpis: ${new Date(EntriesArray[EntriesArray.length - 1].created_at)}`);
					EntriesArray.push(...await getXNewestEntriesFromChannelFromPageHash(ChannelObject, ChannelObject.pagination.next, limit));
					await new Promise(resolve => setTimeout(resolve, FETCH_DELAY_MILLISECONDS));
				}

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





// TODO
export async function getXEntriesFromUserFromPageNumber(UserObject: T.User, fetchLimit: number = settings.fetch.preloadUserEntriesCount, entriesFilters: T.EntriesFilters = {}, page: number = 1): Promise<T.Entry[]>
{
	// if (dev) console.log(`getXEntriesFromUser() | username: ${UserObject.username} | fetchLimit: ${fetchLimit} | entriesFilters: `, entriesFilters);

	let remainedItemsToFetch: number = fetchLimit - (50 * (page - 1));

	let limit: number = remainedItemsToFetch >= 50 ? 50 : remainedItemsToFetch;

	return;
}



export async function getXEntriesFromChannel(ChannelObject: T.ChannelTag, entriesFetchType: T.EntriesFetchType = { type: "newest" }, fetchLimit: number = settings.fetch.numberOfEntries2ndPreload, FETCH_DELAY_MILLISECONDS = 200): Promise<T.Entry[]>
{
	// if (dev) console.log(`getXEntriesFromChannel(channel: '${ChannelObject.name}', entriesFetchType: ${entriesFetchType}, xItemsToFetch: ${fetchLimit})`);


	if (ChannelObject.name == "observed_users" || ChannelObject.name == "observed_tags" || ChannelObject.name == "observed")
	{
		// obserwowane zwracają zawsze 50 na każdej stronie
		if (fetchLimit < 50) fetchLimit = 50;
	}

	let limit: number = fetchLimit >= 50 ? 50 : fetchLimit; // limit od 1 do 50
	let remainedItemsToFetch: number = fetchLimit;

	return new Promise(async (resolve, reject) =>
	{
		// POBIERANIE PIERWSZEJ STRONY NAJNOWSZYCH 50 wpisów
		let fetchType = "tag";
		let responseAlsoWithLinksAndArticles = false;

		//	https://doc.wykop.pl/#/Tagi/get_tags__tagName__stream
		let apiURL: string = `https://wykop.pl/api/v3/tags/${ChannelObject.name}/stream?type=entry&limit=${limit}`;

		// NEWEST / ACTIVE/ HOT
		if (entriesFetchType.type == "newest") apiURL += `&sort=all`;
		if (entriesFetchType.type == "active" || entriesFetchType.type == "hot") apiURL += `&sort=best`;



		// POBIERANIE WSZYSTKICH WPISÓW Z MIKROBLOGA Z TAGAMI I BEZ TAGÓW
		const currentHour = new Date().getHours();

		// KANAŁY SPECJALNE
		if (chs.ChannelsSpecialMap.has(ChannelObject.name) || (ChannelObject.name == "nocnazmiana" && currentHour < 6))
		{
			// MIKROBLOG +/-/X | NOCNAZMIANA
			if (ChannelObject.name == "nocnazmiana" && currentHour < 6 || ChannelObject.name == "x" || ChannelObject.name == "x_plus" || ChannelObject.name == "x_minus")
			{
				fetchType = "microblog";
				responseAlsoWithLinksAndArticles = false;

				// NEWEST / ACTIVE/ HOT
				apiURL = `https://wykop.pl/api/v3/entries?sort=${entriesFetchType.type}&limit=${limit}`;
				if (entriesFetchType.type == "hot")
				{
					if (!entriesFetchType.hotTimespan) entriesFetchType.hotTimespan = "24";
					apiURL += `&last_update=${entriesFetchType.hotTimespan}`;
				}
			}

			/* OBSERWOWANE / MÓJ WYKOP */
			else if (ChannelObject.name == "observed_users")
			{
				// ?limit= nie działa, zawsze wraca 50
				// zwraca pagination: { next: "hash" }
				// zwraca WPISY I ZNALEZISKA obserwowanych @użytkowników
				fetchType = "observed";
				responseAlsoWithLinksAndArticles = true;
				apiURL = `https://wykop.pl/api/v3/observed/users`;
				// brak NEWEST / ACTIVE/ HOT
			}
			else if (ChannelObject.name == "observed_tags")
			{
				// ?limit= nie działa, zawsze wraca 50
				// zwraca pagination: { next: "hash" }
				// zwraca WPISY I ZNALEZISKA Z obserwowanych #tagów

				fetchType = "observed";
				responseAlsoWithLinksAndArticles = true;
				apiURL = `https://wykop.pl/api/v3/observed/tags/stream`;
				// brak NEWEST / ACTIVE/ HOT
			}
			else if (ChannelObject.name == "observed")
			{
				// ?limit= nie działa, zawsze wraca 50
				// zwraca pagination: { next: "hash" }
				// zwraca WPISY I ZNALEZISKA obserwowanych @użytkowników i #tagów
				fetchType = "observed";
				responseAlsoWithLinksAndArticles = true;
				apiURL = `https://wykop.pl/api/v3/observed/all`;
				// brak NEWEST / ACTIVE/ HOT
			}
		}


		// BUCKET CHANNELS, POBIERANIE Z WIELU TAGÓW NA RAZ (KATEGORIE)
		else if (chs.ChannelBucketsMap.has(ChannelObject.name) && !ChannelObject.nameUnderscore.endsWith("_"))
		{
			// zwracanie wpisów i znalezisk w responseJSON.data.items w tym apiURL = `https://wykop.pl/api/v3/buckets/stream/${chs.ChannelBucketsMap.get(ChannelObject.name)}`;
			// responseAlsoWithLinksAndArticles = true;

			// inna opcja, pobieranie entries stream z konkretnej bucket
			// mikroblog podanej kategorii
			// błąd w API wykopu - bez ?sort=newest zwracane są tylko 3 elementy i  nie działa paginacja 
			// apiURL = `https://wykop.pl/api/v3/entries?limit=${limit}&bucket=${chs.ChannelBucketsMap.get(ChannelObject.name)}`;
			fetchType = "bucket";
			responseAlsoWithLinksAndArticles = false;

			// NEWEST / ACTIVE/ HOT
			apiURL = `https://wykop.pl/api/v3/entries?sort=${entriesFetchType.type}&limit=${limit}&bucket=${chs.ChannelBucketsMap.get(ChannelObject.name)}`;
			if (entriesFetchType.type == "hot")
			{
				if (!entriesFetchType.hotTimespan) entriesFetchType.hotTimespan = "24";
				apiURL += `&last_update=${entriesFetchType.hotTimespan}`;
			}
		}


		// if (dev) console.log(apiURL);

		await fetch(apiURL, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer " + window.localStorage.getItem("token"),
			},
		})
			.then((response) =>
			{
				// if (dev) console.log("getXEntriesFromChannel() - apiURL", apiURL)
				// if (dev) console.log("getXEntriesFromChannel() - response", response)

				if (!response.ok)
				{
					// if (dev) console.log("HTTP error! status: ${response.status}");
					// throw new Error(`HTTP error! status: ${response.status}`);
					throw new T.HTTPError(`HTTP error! status: ${response.status}`, response.status);
				}
				return response.json();
			})
			.then(async (responseJSON) =>
			{
				// if (dev) console.log("getXEntriesFromChannel() - responseJSON", responseJSON)


				let newlyFetchedEntries: object[];
				/* z API /bucket/stream przychodzą w data.items[]
				if (fetchType == "bucket") { a oprocz resource == "entry" także "link" i "article" // newlyFetchedEntries = responseJSON.data.items.filter((item: T.Entry) => item.resource === "entry"); } else */
				newlyFetchedEntries = responseJSON.data;

				/* "pagination": { "next": "996Gq6BhwBWkESP", "prev": null }  */
				ChannelObject.pagination = responseJSON.pagination;

				const EntriesArray: T.Entry[] = [];

				// if (dev) console.log("2. newlyFetchedEntries", newlyFetchedEntries);

				// usuwamy "links" oraz "articles" z najnowszych
				newlyFetchedEntries = newlyFetchedEntries.filter(item => (item as T.Entry).resource === "entry");

				newlyFetchedEntries.forEach((entryObject: T.Entry) =>
				{
					if (Array.isArray(entryObject.tags)) // zawsze jest tablicam gdy brak tagów, jest pusta []
					{
						// if (dev) console.log("2. entryObject", entryObject)
						// if (dev) console.log("2. ChannelObject.name", ChannelObject.name)
						// if (dev) console.log(`2. newlyFetchedEntries - przed wywołaniem konstruktora T.Entry - dodawanie sprawdzonych nowych / aktualizowanych wiadomosci`)


						// x_minus | mikroblog- (Z MINIMUM 1 #TAGIEM) x_minus /-
						if (ChannelObject.name === chs.ChannelsSpecialMap.get("x_minus").selector && entryObject.tags.length >= 1) 
						{
							EntriesArray.push(new T.Entry(entryObject, ChannelObject));
						}
						// x_plus | mikroblog+ (WSZYSTKIE wiadomości z tagami i bez) - cały mikroblog x_plus /+ mikroblog+
						else if (ChannelObject.name === chs.ChannelsSpecialMap.get("x_plus").selector) 
						{
							EntriesArray.push(new T.Entry(entryObject, ChannelObject));
						}
						else if (ChannelObject.name === chs.ChannelsSpecialMap.get("observed").selector) 
						{
							EntriesArray.push(new T.Entry(entryObject, ChannelObject));
						}
						else if (ChannelObject.name === chs.ChannelsSpecialMap.get("observed_users").selector) 
						{
							EntriesArray.push(new T.Entry(entryObject, ChannelObject));
						}
						else if (ChannelObject.name === chs.ChannelsSpecialMap.get("observed_tags").selector) 
						{
							EntriesArray.push(new T.Entry(entryObject, ChannelObject));
						}
						// x | mikroblogX (bez tagów) + #nocnazmiana - dodajemy tylko wpisy bez tagów -  WIADOMOSCI BEZ TAGOW W NOCY lub Z TAGIEM NOCNA ZMIANA /x
						else if (ChannelObject.name === "nocnazmiana" || ChannelObject.name === chs.ChannelsSpecialMap.get("x").selector)
						{
							// NOCNA ZMIANA między 0:00 a 6:00 - MIKROBLOG (wpisy bez tagów) oraz wpisy z tagiem #nocnazmiana razem
							if (currentHour < 6)
							{
								if (entryObject.tags.length === 0 || entryObject.tags.includes("nocnazmiana"))
								{
									EntriesArray.push(new T.Entry(entryObject, ChannelObject))
								}
							}
							// W CIĄGU DNIA MIĘDZY 6:00 A 23:59
							else
							{
								if (ChannelObject.name === chs.ChannelsSpecialMap.get("x").selector && entryObject.tags.length === 0) 
								{
									EntriesArray.push(new T.Entry(entryObject, ChannelObject))
								}
								else if (ChannelObject.name == "nocnazmiana" && entryObject.tags.includes("nocnazmiana"))
								{
									EntriesArray.push(new T.Entry(entryObject, ChannelObject))
								}
							}
						}
						// normalne pokoje np. /heheszki
						else
						{
							EntriesArray.push(new T.Entry(entryObject, ChannelObject));
						}
					}
				});


				remainedItemsToFetch -= limit; // ile pozostało do pobrania np. gdy bylo 57, teraz 7

				if (remainedItemsToFetch > 0)
				{
					const totalPagesToFetch = Math.ceil(fetchLimit / limit);	// ile stron trzeba pobrać np. 3 strony dla 110 wpisów
					// const totalPagesToFetch = Math.ceil(xItemsToFetch / settings.fetch.numberOfEntries2ndPreload);	// ile stron trzeba pobrać np. 3 strony dla 110 wpisów

					// for (let pageNumber = 2; pageNumber <= totalPagesToFetch; pageNumber++) // zaczynamy od 2. strony bo 1. już pobraliśmy
					for (let pageNumber = 2; remainedItemsToFetch > 0;) // zaczynamy od 2. strony bo 1. już pobraliśmy
					{
						let pageLimit: number = remainedItemsToFetch > 50 ? 50 : remainedItemsToFetch; // limit od 1 do 50
						// if (dev) console.log(`Zaraz pobierzemy kolejną stronę wpisów -> getXNewestEntriesFromChannelFromPageHash | remainedItemsToFetch: ${remainedItemsToFetch} | limit: ${limit} | page: ${pageNumber} | totalPages: ${totalPagesToFetch} | xItemsToFetch: ${xItemsToFetch}`);
						EntriesArray.push(...await getXNewestEntriesFromChannelFromPageHash(ChannelObject, ChannelObject.pagination.next, pageLimit));
						pageNumber++
						remainedItemsToFetch -= pageLimit; // ile pozostało do pobrania np. gdy bylo 57, teraz 7
						await new Promise(resolve => setTimeout(resolve, FETCH_DELAY_MILLISECONDS));
					}
				}

				// EntriesArray.sort((a, b) => a.id - b.id);	// sortowanie rosnąco wg id od najstarszych do najnowszych
				EntriesArray.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // sortowanie wg daty
				resolve(EntriesArray);

			}).catch((error) =>
			{
				if (error instanceof TypeError)
				{
					console.error('xxx Network error:', error); // AWARIA SERWERA
				}
				else
				{
					console.error('Other error:', error);
				}
				reject(error);
			});
	});
}






export async function getXNewestEntriesFromChannelFromPageHash(ChannelObject: T.ChannelTag, pageHash: string, limit: number = settings.fetch.numberOfEntries2ndPreload): Promise<T.Entry[]>
{
	// if (dev) console.log(`getXNewestEntriesFromChannelFromPageHash(channel: '${ChannelObject.name}' | pageHash: ${pageHash} | limit: ${limit})`);

	return new Promise(async (resolve, reject) =>
	{
		// &page=${pagination.next} -> 85WE5yKsMyypnSa
		let fetchType = "tag";
		let responseAlsoWithLinksAndArticles = false;
		let apiURL: string = `https://wykop.pl/api/v3/tags/${ChannelObject.name}/stream?limit=${limit}&sort=all&type=entry&page=${pageHash}`;


		// POBIERANIE WSZYSTKICH WPISÓW Z MIKROBLOGA Z TAGAMI I BEZ TAGÓW
		const currentHour = new Date().getHours();


		// KANAŁY SPECJALNE
		if (chs.ChannelsSpecialMap.has(ChannelObject.name) || (ChannelObject.name == "nocnazmiana" && currentHour < 6))
		{
			// MIKROBLOG +/-/X | NOCNAZMIANA
			if (ChannelObject.name == "nocnazmiana" && currentHour < 6 || ChannelObject.name == "x" || ChannelObject.name == "x_plus" || ChannelObject.name == "x_minus")
			{
				fetchType = "microblog";
				responseAlsoWithLinksAndArticles = false;
				apiURL = `https://wykop.pl/api/v3/entries?limit=${limit}&sort=newest&page=${pageHash}`;
			}

			/* OBSERWOWANE / MÓJ WYKOP */
			else if (ChannelObject.name == "observed_users")
			{
				// ?limit= nie działa, zawsze wraca 50
				// zwraca pagination: { next: "hash" }
				// zwraca WPISY I ZNALEZISKA obserwowanych @użytkowników
				fetchType = "observed";
				responseAlsoWithLinksAndArticles = true;
				apiURL = `https://wykop.pl/api/v3/observed/users?page=${pageHash}`;
			}
			else if (ChannelObject.name == "observed_tags")
			{
				// ?limit= nie działa, zawsze wraca 50
				// zwraca pagination: { next: "hash" }
				// zwraca WPISY I ZNALEZISKA Z obserwowanych #tagów

				fetchType = "observed";
				responseAlsoWithLinksAndArticles = true;
				apiURL = `https://wykop.pl/api/v3/observed/tags/stream?page=${pageHash}`;
			}
			else if (ChannelObject.name == "observed")
			{
				// ?limit= nie działa, zawsze wraca 50
				// zwraca pagination: { next: "hash" }
				// zwraca WPISY I ZNALEZISKA obserwowanych @użytkowników i #tagów
				fetchType = "observed";
				responseAlsoWithLinksAndArticles = true;
				apiURL = `https://wykop.pl/api/v3/observed/all?page=${pageHash}`;
			}
		}


		// BUCKET CHANNELS, POBIERANIE Z WIELU TAGÓW NA RAZ (KATEGORIE)
		else if (chs.ChannelBucketsMap.has(ChannelObject.name) && !ChannelObject.nameUnderscore.endsWith("_"))
		{
			// zwracanie wpisów i znalezisk w responseJSON.data.items w tym apiURL = `https://wykop.pl/api/v3/buckets/stream/${chs.ChannelBucketsMap.get(ChannelObject.name)}`;
			// responseAlsoWithLinksAndArticles = true;

			// inna opcja, pobieranie entries stream z konkretnej bucket
			// mikroblog podanej kategorii
			// błąd w API wykopu - bez ?sort=newest zwracane są tylko 3 elementy i  nie działa paginacja 
			// apiURL = `https://wykop.pl/api/v3/entries?limit=${limit}&bucket=${chs.ChannelBucketsMap.get(ChannelObject.name)}`;
			fetchType = "bucket";
			responseAlsoWithLinksAndArticles = false;
			apiURL = `https://wykop.pl/api/v3/entries?sort=newest&limit=${limit}&bucket=${chs.ChannelBucketsMap.get(ChannelObject.name)}&page=${pageHash}`;
		}


		// if (dev) console.log(apiURL);

		await fetch(apiURL,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + window.localStorage.getItem("token"),
				},
			})
			.then((response) =>
			{
				//if (dev) console.log("response", response)
				if (!response.ok)
				{
					// if (dev) console.log("HTTP error! status: ${response.status}");
					throw new T.HTTPError(`HTTP error! status: ${response.status}`, response.status);
				}
				return response.json();
			})
			.then((responseJSON) =>
			{
				// if (dev) console.log(`🟢🟢🟢 responseJSON - tags/${ChannelObject.name}/stream`)
				// if (dev) console.log(responseJSON);


				let newlyFetchedEntries: object[];
				/* z API /bucket/stream przychodzą w data.items[]
				if (fetchType == "bucket") { a oprocz resource == "entry" także "link" i "article" // newlyFetchedEntries = responseJSON.data.items.filter((item: T.Entry) => item.resource === "entry"); } else */
				newlyFetchedEntries = responseJSON.data;

				/* "pagination": { "next": "996Gq6BhwBWkESP", "prev": null }  */
				ChannelObject.pagination = responseJSON.pagination;

				const EntriesArray: T.Entry[] = [];

				// if (dev) console.log(`3. newlyFetchedEntries (pageHash: ${pageHash})`, newlyFetchedEntries);

				newlyFetchedEntries.forEach((entryObject: T.Entry) =>
				{
					if (Array.isArray(entryObject.tags)) // zawsze jest tablicam gdy brak tagów, jest pusta []
					{
						// if (dev) console.log("2. entryObject", entryObject)
						// if (dev) console.log("2. ChannelObject.name", ChannelObject.name)
						// if (dev) console.log(`2. newlyFetchedEntries - przed wywołaniem konstruktora T.Entry - dodawanie sprawdzonych nowych / aktualizowanych wiadomosci`)


						// x_minus | mikroblog- (Z MINIMUM 1 #TAGIEM) x_minus /-
						if (ChannelObject.name === chs.ChannelsSpecialMap.get("x_minus").selector && entryObject.tags.length >= 1) 
						{
							EntriesArray.push(new T.Entry(entryObject, ChannelObject));
						}
						// x_plus | mikroblog+ (WSZYSTKIE wiadomości z tagami i bez) - cały mikroblog x_plus /+ mikroblog+
						else if (ChannelObject.name === chs.ChannelsSpecialMap.get("x_plus").selector) 
						{
							EntriesArray.push(new T.Entry(entryObject, ChannelObject));
						}
						else if (ChannelObject.name === chs.ChannelsSpecialMap.get("observed").selector) 
						{
							EntriesArray.push(new T.Entry(entryObject, ChannelObject));
						}
						else if (ChannelObject.name === chs.ChannelsSpecialMap.get("observed_users").selector) 
						{
							EntriesArray.push(new T.Entry(entryObject, ChannelObject));
						}
						else if (ChannelObject.name === chs.ChannelsSpecialMap.get("observed_tags").selector) 
						{
							EntriesArray.push(new T.Entry(entryObject, ChannelObject));
						}
						// x | mikroblogX (bez tagów) + #nocnazmiana - dodajemy tylko wpisy bez tagów -  WIADOMOSCI BEZ TAGOW W NOCY lub Z TAGIEM NOCNA ZMIANA /x
						else if (ChannelObject.name === "nocnazmiana" || ChannelObject.name === chs.ChannelsSpecialMap.get("x").selector)
						{
							// NOCNA ZMIANA między 0:00 a 6:00 - MIKROBLOG (wpisy bez tagów) oraz wpisy z tagiem #nocnazmiana razem
							if (currentHour < 6)
							{
								if (entryObject.tags.length === 0 || entryObject.tags.includes("nocnazmiana"))
								{
									EntriesArray.push(new T.Entry(entryObject, ChannelObject))
								}
							}
							// W CIĄGU DNIA MIĘDZY 6:00 A 23:59
							else
							{
								if (ChannelObject.name === chs.ChannelsSpecialMap.get("x").selector && entryObject.tags.length === 0) 
								{
									EntriesArray.push(new T.Entry(entryObject, ChannelObject))
								}
								else if (ChannelObject.name == "nocnazmiana" && entryObject.tags.includes("nocnazmiana"))
								{
									EntriesArray.push(new T.Entry(entryObject, ChannelObject))
								}
							}
						}
						// normalne pokoje np. /heheszki
						else
						{
							EntriesArray.push(new T.Entry(entryObject, ChannelObject));
						}
					}
				});


				// EntriesArray.sort((a, b) => a.id - b.id);	// sortowanie rosnąco wg id od najstarszych do najnowszych
				// EntriesArray.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // sortowanie wg daty
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





export async function getOneEntryByEntryId(ChannelObject: T.ChannelTag, entryId: number): Promise<T.Entry>
{
	if (!ChannelObject || !entryId) return;

	return new Promise(async (resolve, reject) =>
	{
		let apiURL = `https://wykop.pl/api/v3/entries/${entryId}`;
		// if (dev) console.log(apiURL);
		await fetch(apiURL,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + window.localStorage.getItem("token"),
				},
			})
			.then((response) =>
			{
				// if (dev) console.log("response", response)
				if (!response.ok)
				{
					// if (dev) console.log("HTTP error! status: ${response.status}");
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.json();
			})
			.then((responseJSON) =>
			{
				// if (dev) console.log("j4k responseJSON.data", responseJSON.data)
				let EntryJSON = responseJSON.data;
				let EntryObject = new T.Entry(EntryJSON, ChannelObject);
				resolve(EntryObject);
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

export async function getAllCommentsFromEntry(entry: T.Entry, forceFetchWhenNoNewComments = false, FETCH_DELAY_MILLISECONDS = 200): Promise<T.Comment[]>
{
	if (!entry) return;
	// if (dev) console.log(`getAllCommentsFromEntry(entry: ${entry.id}, delay: ${FETCH_DELAY_MILLISECONDS})`);
	// if (dev) console.log(`entry`, entry);
	// if (dev) console.log(`entry.comments.count`, entry?.comments?.count);
	// if (dev) console.log(`entry.last_checked_comments_datetime`, entry.last_checked_comments_datetime);
	// if (dev) console.log(`entry.last_checked_comments_count`, entry.last_checked_comments_count);

	const CommentsArray: T.Comment[] = [];

	entry.last_checked_comments_datetime = new Date();

	if (entry?.comments?.count > 0 && (forceFetchWhenNoNewComments || entry?.comments?.count != entry?.last_checked_comments_count))
	{
		return new Promise(async (resolve, reject) =>
		{
			let totalPages = Math.ceil(entry.comments.count / settings.fetch.numbersOfCommentsToLoad);	// na ilu stronach są komentarze

			for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++)
			{
				// if (dev) console.log(`getAllCommentsFromEntry(${entry.entry_id}) forceFetchWhenNoNewComments: ${forceFetchWhenNoNewComments} | created_at: ${entry.created_at} | page: ${pageNumber} | totalPages: ${totalPages} | entry.comments.count: ${entry.comments.count} | entry.last_checked_comments_count ${entry.last_checked_comments_count}`);
				CommentsArray.push(...await getCommentsFromEntryFromPageNumber(entry, pageNumber, settings.fetch.numbersOfCommentsToLoad));

				await new Promise(resolve => setTimeout(resolve, FETCH_DELAY_MILLISECONDS));
			}

			// if (CommentsArray.length > 0) 									// TODO zastanowic sie czy zapisywac tylko przy nowych, czy zawsze bez tego if-a
			if (entry.last_checked_comments_count != entry.comments.count)
			{
				// if (dev) console.log(`❌ CommentsArray: `, CommentsArray)
				// if (dev) console.log(`❌ CommentsArray[CommentsArray.length - 1]: `, CommentsArray[CommentsArray.length - 1]);
				// if (dev) console.log(`❌ CommentsArray[CommentsArray.length - 1].created_at `, CommentsArray[CommentsArray.length - 1].created_at);
				// if (dev) console.log(`❌ entry.comments.count `, entry.comments.count);
				// if (dev) console.log(`❌ entry.channel `, entry.channel);
				// if (dev) console.log(`❌ entry.channel.name `, entry.channel.name);
				entry.last_checked_comments_count = entry.comments.count;	// aktualizujemy liczbę komentarzy we wpisie
				// if (dev) console.log(`❌ AKTUALIZUJEMY LICZBĘ KOMENTARZY: eentry.last_checked_comments_count `, entry.last_checked_comments_count);
			}

			// if (dev) console.log(`❌ AKTUALIZUJEMY DATĘ SPRAWDZENIA PLUSÓW W KOMENTARZACH: entry.last_checked_comments_datetime `, entry.last_checked_comments_datetime);

			if (CommentsArray && CommentsArray.length > 0)
			{
				CommentsArray.sort((a, b) => a.id - b.id);						// sortowanie rosnąco wg id od najstarszych do najnowszych
				//CommentsArray.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // sortowanie wg daty
				// if (dev) console.log(`getAllCommentsFromEntry() CommentsArray `, CommentsArray);
				resolve(CommentsArray);
			}
			else
			{
				return [];
			}
		});
	}
	else
	{
		return [];
	}
}

export async function getCommentsFromEntryFromPageNumber(entry: T.Entry, page: number = 1, limit: number = 50): Promise<T.Comment[]>
{
	// if (dev) console.log(`getCommentsFromEntryFromPageNumber() entryId: ${entry.entry_id}, limit: ${limit}, page: ${page})`);

	return new Promise(async (resolve, reject) =>
	{
		let apiURL: string = `https://wykop.pl/api/v3/entries/${entry.entry_id}/comments?page=${page}&limit=${limit}`;
		// if (dev) console.log(apiURL);
		await fetch(apiURL,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + window.localStorage.getItem("token"),
				},
			})
			.then((response) =>
			{
				// if (dev) console.log("response", response)
				if (!response.ok)
				{
					// if (dev) console.log("HTTP error! status: ${response.status}");
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.json();
			})
			.then((responseJSON) =>
			{
				// if (dev) console.log("j4k responseJSON.data", responseJSON.data)
				let comments = [...responseJSON.data];

				const CommentsArray: T.Comment[] = [];

				comments.forEach((commentObject: T.Comment) =>
				{
					CommentsArray.push(new T.Comment(commentObject, entry.channel))
				})

				CommentsArray.sort((a, b) => a.id - b.id);	// sortowanie rosnąco wg id od najstarszych do najnowszych
				//CommentsArray.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // sortowanie wg daty

				// if (dev) console.log(`getCommentsFromEntryFromPageNumber() -> CommentsArray: `, CommentsArray);

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











/* KONWERSACJE I PM */

export async function getPMsInConversationFromAllUsers(ChannelObject: T.ChannelPM, xItemsToFetch: number = settings.fetch.preloadPMsCountr, FETCH_DELAY_MILLISECONDS = 200): Promise<T.PM[]>
{
	if (dev) console.log(`getPMsInConversationFromAllUsers(ChannelObject.name: '${ChannelObject.name}', fetchXitems: ${xItemsToFetch})`);

	let pmsArray: T.PM[] = [];

	if (dev) console.log(`--- getPMsInConversationFromAllUsers() ChannelObject.users: size: ${ChannelObject.users.size}`, ChannelObject.users);

	if (ChannelObject && ChannelObject.users instanceof Map && ChannelObject.users.size > 0)
	{
		for (const [username, userObject] of ChannelObject.users)
		{

			if (userObject.username === login.loggedUser.username) continue; // ignoruje zalogowanego użytkownika

			try
			{
				const pmsFetched = await getPMsInConversationWithOneUser(userObject, ChannelObject, xItemsToFetch, FETCH_DELAY_MILLISECONDS);

				pmsFetched.forEach((pm) => 
				{
					if (dev) console.log("pm fetched: ", pm);
				});

				if (Array.isArray(pmsFetched) && pmsFetched.length > 0)
				{
					// konwersacja kilku osób
					if (ChannelObject.isThisMultiplePersonRoom)
					{

						// Filter out PMs that don't have the same roomID as ChannelObject.roomID
						let pmsFetchedFiltered = pmsFetched.filter(pm => pm.roomID === ChannelObject.roomID);

						pmsArray.push(...pmsFetchedFiltered);
						if (dev) console.log("pmsFetchedFiltered: ", pmsFetchedFiltered);
						if (dev) console.log("pmsArray: ", pmsArray);
					}
					// priv 2 osoby
					else
					{
						// If it's not a multiple person room, push all normal PM's
						const pmsFetchedFiltered = pmsFetched.filter(PM => PM.roomID === null || PM.roomID === undefined);
						pmsArray.push(...pmsFetchedFiltered);
					}
				}
			}
			catch (error)
			{
				console.error('Error fetching PMs:', error);
			}
		}
	} else
	{
		console.error('ChannelObject.users is not iterable or is null');
	}
	// Filter out duplicate messages sent by user to different partners in room by checking uniqueness of x_id value
	let seen = new Set();
	pmsArray = pmsArray.filter(pm =>
	{
		if (seen.has(pm.x_id))
		{
			return false;
		} else
		{
			seen.add(pm.x_id);
			return true;
		}
	});


	return pmsArray;
}

// POBIERANIE DYSKUSJI Z JEDNYM UŻYTKOWNIKIEM
export async function getPMsInConversationWithOneUser(partnerObject: T.User | string, ChannelObject: T.ChannelPM, xItemsToFetch: number = settings.fetch.preloadPMsCountr, FETCH_DELAY_MILLISECONDS = 200): Promise<T.PM[]>
{
	// default 20 wiadomosci
	// if (dev) console.log(`getPMsInConversationWithOneUser(channel: '${ChannelObject.name}', fetchXitems: ${xItemsToFetch}), user: `, partnerObject);
	if (typeof partnerObject === "string") partnerObject = new T.User(partnerObject);

	if (partnerObject == null || partnerObject.username == null || partnerObject.username == login.loggedUser.username) return []; // zwraca pustą tablicę

	//let limit: number = xItemsToFetch >= 20 ? 20 : xItemsToFetch; // limit od 1 do 50
	//let remainedItemsToFetch: number = xItemsToFetch;

	return new Promise(async (resolve, reject) =>
	{
		// POBIERANIE PIERWSZEJ STRONY 20 wiadomosci z 1 uzytkownikiem
		let fetchType = "pm";
		let apiURL: string = `https://wykop.pl/api/v3/pm/conversations/${partnerObject.username}`;

		await fetch(apiURL, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer " + window.localStorage.getItem("token"),
			},
		})
			.then((response) =>
			{
				// if (dev) console.log("apiURL: ", apiURL);
				// if (dev) console.log("response", response);

				if (!response.ok)
				{
					// if (dev) console.log("HTTP error! status: ${response.status}");
					// throw new Error(`HTTP error! status: ${response.status}`);
					throw new T.HTTPError(`HTTP error! status: ${response.status}`, response.status);
				}
				return response.json();
			})
			.then(async (responseJSON) =>
			{
				// if (dev) console.log(responseJSON);

				let fetchedPMs: object[];
				fetchedPMs = responseJSON.data.messages;	// messages: [ ... ], actions: {}, user: {}

				const pmsArray: T.PM[] = [];

				fetchedPMs.forEach((pmObject: T.PM) =>
				{
					pmObject.resource = "pm";

					if (pmObject.type === 1) 
					{
						// wiadomość od partnera
						pmsArray.push(new T.PM(pmObject, partnerObject, partnerObject, ChannelObject));
					}
					else if (pmObject.type === 0)
					{
						// wiadomość wysłana przez zalogowanego użytkownika wcześniej
						pmsArray.push(new T.PM(pmObject, login.loggedUser, partnerObject, ChannelObject));
					}
				});

				// if (dev) console.log("fetchedPMs", fetchedPMs);
				// if (dev) console.log("pmsArray", pmsArray);


				pmsArray.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // sortowanie wg daty // TODO zamienić na .created_at_Date().getTime();

				resolve(pmsArray);

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





















export async function voteMessage(EntryObject: T.Entry, upORdown: string = "up"): Promise<T.Entry | boolean>
{
	// if (dev) console.log(`voteMessage() upORdown: ${upORdown} | EntryObject`, EntryObject)

	let apiURL: string;

	if (EntryObject.resource && EntryObject.resource == "entry_comment" && EntryObject.entry_id && EntryObject.id)
	{
		apiURL = `https://wykop.pl/api/v3/entries/${EntryObject.entry_id}/comments/${EntryObject.id}/votes`;
	}
	else if (EntryObject.entry_id)
	{
		apiURL = `https://wykop.pl/api/v3/entries/${EntryObject.entry_id}/votes`;
	}
	// if (dev) console.log(`voteMessage() apiURL: `, apiURL)

	return new Promise(async (resolve, reject) =>
	{
		try
		{
			await fetch(apiURL,
				{
					method: upORdown.toLowerCase() == "down" ? "DELETE" : "POST",	// plusujemy czy usuwamy plusa
					headers:
					{
						"Content-Type": "application/json",
						Authorization: "Bearer " + window.localStorage.getItem("token"),
					}

				})
				.then((response) =>
				{
					/*
					if (response) // w przypadku poprawnego glosowania POST / DELETE nie zwraca tresci
					{
						// if (dev) console.log("response", response)
						if (!response.ok)
						{
							// zwraca error.status = 400 (jestes blokowany) albo error.status = 409 (pusta tresc)
							// if (dev) console.log(`HTTP error! status: ${response.status}`);
							throw new T.HTTPError(`HTTP error! status: ${response.status}`, response.status);
						}

						return response.json();
					}*/

				})
				.then(async (responseJSON) =>
				{
					// if (dev) console.log("responseJSON")
					// if (dev) console.log(responseJSON)

					// if (ChannelObject)
					// {
					// 	if (dev && ChannelObject) console.log("ChannelObject", ChannelObject);

					// 	let newEntry: T.Entry | T.Comment;
					// 	if (responseJSON.data.resource == "entry_comment") newEntry = new T.Comment(responseJSON.data, ChannelObject);
					// 	else newEntry = new T.Entry(responseJSON.data, ChannelObject);

					// 	if (dev) console.log("const newEntry inside fetch (before resolve): ", newEntry)
					// 	resolve(newEntry);
					// }

					resolve(true);

				}).catch((error) =>
				{
					if (error instanceof TypeError)
					{
						//console.error('xxx Network error:', error); // AWARIA SERWERA
					} else
					{
						//console.error('Other error:', error);
					}
					reject(error);
				});
		}
		catch (error)
		{
			//console.error('Other catched error:', error);
			reject(error);
		}
	});
}



/* POST */
// zwraca numer błędu np. 409 lub wysłaną wiadomość dodaną na serwer
export async function postNewMessage(ChannelObject: T.Channel, newMessageBodyPackage: T.NewMessageBodyPackage): Promise<number | T.Message<T.Channel, T.MessageActions>>
{
	if (dev) console.log(`postNewMessage() | ChannelObject: ${ChannelObject?.name} | newMessageBodyPackage:`, newMessageBodyPackage);

	if (newMessageBodyPackage == null) return;
	// BLOCK DETECTOR przy sprawdzaniu blokowania ChannelObject == null


	// if (dev) console.log(`postNewMessage: newMessageBodyPackage: `, newMessageBodyPackage);
	/*
		{
			"data":
			{
				"adult": false
				"content": "**foobar** __foobar__ [lorem](https://www.wykop.pl) impsum!!! #nsfw #wykop",
				"photo": "e07843ss3fbe9cb4saeed0asdfsdfc64b9a4df6084199b39d2",
				"embed": "1fde707843ss3fbe9cb4eed0asdfsdfc64ab9a4df6084199b39d2",
				
				"survey": "qErgdjp5K0xz", 	// tylko dla wpisów

			}
		}
	*/

	/*
		entry_id: 1234 				// tylko dla komentarzy
		username: "NadiaFrance"		// tylko dla PM
	*/

	// WYSYŁANIE NOWEGO WPISU (domyślnie)
	let apiURL = "https://wykop.pl/api/v3/entries";

	// BLOCK DETECTOR
	if (newMessageBodyPackage.options.blockDetector == true)
	{
		// BLOCK DETECTOR SPRAWDZANIE UZYTKOWNIKA
		if (newMessageBodyPackage.options.blockDetectorUsername != null)
		{
			apiURL = `https://wykop.pl/api/v3/pm/conversations/${newMessageBodyPackage.options.blockDetectorUsername}`;
		}
		else if (newMessageBodyPackage.options.blockDetectorEntryId != null)
		{
			apiURL = `https://wykop.pl/api/v3/entries/${newMessageBodyPackage.options.blockDetectorEntryId}/comments`;
		}
	}


	// WYSYŁANIE NOWE WIADOMOŚCI PM
	else if (ChannelObject != null
		&& newMessageBodyPackage.options.Partner?.username != null
		&& (ChannelObject?.type == "pm" || (newMessageBodyPackage.options.resource && newMessageBodyPackage.options.resource == "pm")))
	{
		apiURL = `https://wykop.pl/api/v3/pm/conversations/${newMessageBodyPackage.options.Partner.username}`;
	}

	// WYSYŁANIE KOMENTARZA POD WPISEM
	else if (ChannelObject != null
		&& ChannelObject?.type == "tag"
		&& newMessageBodyPackage.options.resource
		&& newMessageBodyPackage.options.resource == "entry_comment"
		&& newMessageBodyPackage.options.entry_id)
	{
		apiURL = `https://wykop.pl/api/v3/entries/${newMessageBodyPackage.options.entry_id}/comments`;
	}



	// TWORZENIE WŁAŚCIWEJ TRERŚCI WIADOMOŚCI
	// let bodyData: T.NewMessageBodyData = {};

	// newMessageBodyPackage.NewMessageBodyData.content ? bodyData.content = newMessageBodyPackage.NewMessageBodyData.content : "";
	// newMessageBodyPackage.NewMessageBodyData.photo ? bodyData.photo = newMessageBodyPackage.NewMessageBodyData.photo : "";
	// newMessageBodyPackage.NewMessageBodyData.embed ? bodyData.embed = newMessageBodyPackage.NewMessageBodyData.embed : "";
	// newMessageBodyPackage.NewMessageBodyData.survey ? bodyData.survey = newMessageBodyPackage.NewMessageBodyData.survey : "";
	// newMessageBodyPackage.NewMessageBodyData.adult ? bodyData.adult = newMessageBodyPackage.NewMessageBodyData.adult : "";

	if (dev) console.log("postNewMessageToChannel() - bodyData to send: NewMessageBodyData", newMessageBodyPackage.bodyData);
	if (dev) console.log("postNewMessageToChannel() - apiURL: ", apiURL);

	return new Promise(async (resolve, reject) =>
	{
		try
		{
			await fetch(apiURL,
				{
					method: "POST",
					headers:
					{
						"Content-Type": "application/json",
						Authorization: "Bearer " + window.localStorage.getItem("token"),
					},
					body: JSON.stringify(
						{
							"data": newMessageBodyPackage.bodyData
							//{
							// 	"content": message.content,
							// 	"adult": false
							//	"photo": "e07843ss3fbe9cb4saeed0asdfsdfc64b9a4df6084199b39d2",
							//	"embed": "1fde707843ss3fbe9cb4eed0asdfsdfc64ab9a4df6084199b39d2",
							//	"survey": "qErgdjp5K0xz",
							//}
						})
				})
				.then((response) =>
				{
					if (dev) console.log("response", response)

					if (!response.ok)
					{
						// error.status = 400 (jestes blokowany) 
						// error.status = 409 (pusta tresc)
						// error.status = 429 (wykorzystano limit)

						if (dev) console.log(`HTTP error! status: ${response.status}`);
						resolve(response.status)
						// return response.status;
						// throw new T.HTTPError(`HTTP error! status: ${response.status}`, response.status);
					}

					return response.json();
				})
				.then(async (responseJSON) =>
				{
					if (dev) console.log("responseJSON", responseJSON)

					if (ChannelObject)
					{
						// if (dev) console.log("ChannelObject", ChannelObject);

						let returnedMessage: T.Message<T.Channel, T.MessageActions>;

						if (ChannelObject.type == "tag" && ChannelObject instanceof T.ChannelTag)
						{
							if (responseJSON.data.resource == "entry_comment")
							{
								returnedMessage = new T.Comment(responseJSON.data, ChannelObject);
							}
							else if (responseJSON.data.resource == "entry")
							{
								returnedMessage = new T.Entry(responseJSON.data, ChannelObject);
							}
						}
						else if (ChannelObject.type.startsWith("pm") && ChannelObject instanceof T.ChannelPM)
						{
							if (responseJSON.data.created_at != null && (typeof responseJSON.data.type == "number")) // ODEBRANA WIADOMOŚĆ PM
							{
								// (data z jsona, zalogowany użytkownik wysyłający wiadomość, partner do którego jest wysyłana, kanał)
								returnedMessage = new T.PM(responseJSON.data, login.loggedUser, new T.User(newMessageBodyPackage.options.Partner), ChannelObject);
							}
						}

						// if (dev) console.log("const returnedMessage inside fetch (before resolve): ", returnedMessage);

						resolve(returnedMessage);
					}
				})
				.catch((error) =>
				{
					if (error instanceof TypeError)
					{
						console.error('Network error:', error); // AWARIA SERWERA
					} else
					{
						console.error('Other error:', error);
					}
					reject(error);
				});
		}
		catch (error)
		{
			//console.error('Other catched error:', error);
			reject(error);
		}
	});
}



/* DATABASE TOKENS */
export async function refreshTokenFromAPI(tokensObject: T.TokensObject = { token: null, refresh_token: window.localStorage.getItem("userKeep") }): Promise<T.TokensObject | boolean>
{
	// if (dev) console.log("refreshTokenFromAPI() -> tokensObject", tokensObject)
	if (!tokensObject.refresh_token)
	{
		// if (dev) console.log("refreshTokenFromAPI() -> refresh_token NIEDOSTĘPNY ❌")
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
			// if (dev) console.log(`refreshTokenFromAPI() for user: ${tokensObject.username ? tokensObject.username : '[unknown]'} - url: ${url}`)

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});

			// console.log("response", response)
			if (!response.ok)
			{
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const jsonData = await response.json();
			// if (dev) console.log(`refreshTokenFromAPI()  response: jsonData ->`, jsonData)

			newTokensObjectFromAPI.token = jsonData.data.token;
			newTokensObjectFromAPI.refresh_token = jsonData.data.refresh_token;

			// if (dev) console.log(`refreshTokenFromAPI() jsonData.data.token ->`, jsonData.data.token)
			// if (dev) console.log(`refreshTokenFromAPI() jsonData.data.refresh_token ->`, jsonData.data.refresh_token)


		} catch (error)
		{
			console.error('There was a problem with the fetch operation: ', error);
		}

		// saveTokenInLocalStoragesToDatabase(newTokensObjectFromAPI);
		saveTokenInLocalStorage(newTokensObjectFromAPI);

		return newTokensObjectFromAPI;

	} catch (error)
	{
		console.error(`refreshTokenFromAPI() - Error: ${error}`);
	}
}
// saveTokenInLocalStoragesToDatabase({ token, refresh_token, username: "NadiaFrance" })
export function saveTokenInLocalStoragesToDatabase(tokensObject: T.TokensObject): boolean
{
	// if (dev) console.log(`saveTokenInLocalStoragesToDatabase(): tokensObject`, tokensObject);

	if (tokensObject.token) window.localStorage.setItem("token", tokensObject.token);
	if (tokensObject.refresh_token) window.localStorage.setItem("refresh_token", tokensObject.refresh_token);

	return true;
}



export function saveTokenInLocalStorage(unknownToken: T.TokensObject | T.UnknownToken)
{
	// if (dev) console.log(`saveTokenInLocalStorage() | unknownToken: `, unknownToken);

	let newTokensObject: T.TokensObject = {};

	if ('tokenValue' in unknownToken)	// { tokenValue: string, tokenType?: "token" | "userKeep" | "refresh_token" | undefined}
	{
		if (unknownToken.tokenValue.length < 64) return false;

		if (fn.isAlphanumericDotHyphenUnderscore(unknownToken.tokenValue) && unknownToken.tokenValue.length >= 225)
		{
			newTokensObject.token = unknownToken.tokenValue;

			if (unknownToken.tokenType == "guest")
			{
				window.localStorage.setItem('token', unknownToken.tokenValue);
				window.localStorage.setItem('guestMode', "1");
			}
			if ((unknownToken.tokenType == "token" || unknownToken.tokenType == undefined))
			{
				window.localStorage.setItem('token', unknownToken.tokenValue);
			}
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
		if (unknownToken.token) window.localStorage.setItem('token', unknownToken.token);
		if (unknownToken.refresh_token) window.localStorage.setItem('userKeep', unknownToken.refresh_token);

		return newTokensObject;
	}
}



export async function getGuestToken(): Promise<T.TokensObject>
{
	return new Promise(async (resolve, reject) =>
	{
		try
		{
			const response = await fetch('/_semantic_data/');
			const data = await response.json();
			const semanticData = data.semantic_data;
			window.localStorage.setItem('token', semanticData);
			window.localStorage.setItem('guestMode', "1");
			resolve({ token: semanticData, username: "Gość" });
		} catch (error)
		{
			console.error('Error fetching semantic data:', error);
			reject(error);
		}
	});
}
