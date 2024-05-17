import * as api from './wykop_api.js';
import * as CONST from './const.js';
import * as T from './types.js';
import * as fn from './fn.js';
import * as login from './login.js';
import * as ch_fn from './ch_fn.js';
import * as index from './index.js';


declare var openChannelsFromURLArray: string[];
declare let dev: boolean;
declare var $folder: string;

import { sounds, openedChannels, activeChannels, wykopDomain } from './index.js';
import { settings, setSettings } from './settings.js';

import { getNumberOfOnlineUsersOnChannel } from './ch_fn.js';
import * as qr from '../_js-lib/qrcodegen.js';




export const template_userListItem = document.getElementById("template_userListItem") as HTMLTemplateElement;
export const template_channelFeed = document.getElementById("template_channelFeed") as HTMLTemplateElement;
const template_usersList = document.getElementById("template_usersList") as HTMLTemplateElement;
const template_messageArticle = document.getElementById("template_messageArticle") as HTMLTemplateElement;

export const mikrochatFeeds = document.getElementById("mikrochatFeeds") as HTMLElement;
export const chatArea = document.getElementById("chatArea") as HTMLElement;
export const usersPanel = document.getElementById("usersPanel") as HTMLElement;

export let fetch: any = {
	fetchOnHold: 0
}


// 	<div data-channel="wojna" class="channelFeed column" data-loaded="true" data-active="false"></div>
export async function openNewChannel(ChannelObject: T.Channel): Promise<T.Channel> 
{
	if (dev) console.log(`ch.openNewChannel:`, ChannelObject.name);
	if (dev) console.log("ch.openNewChannel: openChannelsFromURLArray", openChannelsFromURLArray)
	if (dev) console.log("ch.openNewChannel: openedChannels", openedChannels)
	if (dev) console.log("ch.openNewChannel: activeChannels", activeChannels)
	if (dev) console.log("ch.openNewChannel: activeChannels[0]", activeChannels[0])

	if (!CONST.ChannelsSpecialMap.has(ChannelObject.name)) // oprocz kanalow "x", "-", "mikroblog+"
	{
		await ChannelObject.tag.initFromAPI().then(() =>
		{
			openedChannels.set(ChannelObject.name, ChannelObject)
		});
	}

	// console.log("⭐ openedChannels: ", openedChannels)

	const templateChannelFeed = template_channelFeed.content.cloneNode(true) as Element;

	const channelFeedDiv = templateChannelFeed.querySelector('.channelFeed') as HTMLElement;
	const newMessageTextareaContainer = templateChannelFeed.querySelector('.newMessageTextareaContainer') as HTMLElement;
	const newMessageTextarea = templateChannelFeed.querySelector('.newMessageTextarea') as HTMLElement;
	const newMessageSendButton = templateChannelFeed.querySelector('.newMessageSendButton') as HTMLButtonElement;
	const channelStats = templateChannelFeed.querySelector('.channelStats') as HTMLButtonElement;

	if (channelFeedDiv)
	{
		channelFeedDiv.dataset.channel = ChannelObject.name;		// data-channel="heheszki"


		if (CONST.ChannelBucketsMap.has(ChannelObject.name))
		{
			channelFeedDiv.dataset.bucket = "true";					// data-bucket="true"
		}

		newMessageTextareaContainer.dataset.channel = ChannelObject.name;		// data-channel="heheszki"

		channelFeedDiv.style.setProperty('--channel', `"${ChannelObject.name}"`);					// var(--channel) = "heheszki"

		channelFeedDiv.id = `channel_${ChannelObject.name}`;		// id="channel_heheszki"

		// if (newMessageTextareaContainer) newMessageTextareaContainer.dataset.channel = ChannelObject.name;

		if (newMessageSendButton)
		{
			newMessageSendButton.dataset.channel = ChannelObject.name;
			if (settings.newMessageSendButton == false) newMessageSendButton.classList.add("hidden");
		}

		if (channelStats) 
		{
			channelStats.dataset.channel = ChannelObject.name;	// <aside class="channelStats" data-channel="heheszki">
			channelStats.querySelector(".channel_usersCount")?.classList.add(`${ChannelObject.name}_usersCount`);
			channelStats.querySelector(".channel_usersOnlineCount")?.classList.add(`${ChannelObject.name}_usersOnlineCount`);
			channelStats.querySelector(".channel_entriesCount")?.classList.add(`${ChannelObject.name}_entriesCount`);	// <div>Dyskusji:<var class="channel_entriesCount"></var></div>
			channelStats.querySelector(".channel_messagesCount")?.classList.add(`${ChannelObject.name}_messagesCount`);
			channelStats.querySelector(".channel_plusesCount")?.classList.add(`${ChannelObject.name}_plusesCount`);
			channelStats.querySelector(".channel_timespan")?.classList.add(`${ChannelObject.name}_timespan`);
		}

		mikrochatFeeds.appendChild(templateChannelFeed); 			// tworzymy okno nowego kanału
	}

	ChannelObject.elements.channelFeed = document.getElementById(`channel_${ChannelObject.name}`);
	if (ChannelObject.elements.channelFeed)
	{
		// TEXTAREA FOCUS OUT
		ChannelObject.elements.channelFeed.querySelector(".newMessageTextarea").addEventListener('blur', function ()
		{
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



	const templateUsersList = template_usersList.content.cloneNode(true) as Element;
	const usersListDiv = templateUsersList.querySelector('.usersList') as HTMLElement;

	if (usersListDiv)
	{
		usersListDiv.dataset.channel = ChannelObject.name;	// data-channel="heheszki"
		usersListDiv.id = `channel_users_${ChannelObject.name}`;
	}

	usersPanel.appendChild(templateUsersList); 					// tworzymy listę użytkowników kanału
	openedChannels.get(ChannelObject.name).elements.usersListContainer = usersPanel.querySelector(".usersListContainer");

	addUsersToChannel(ChannelObject, login.loggedUser); // dodanie aktualnego użytkownika na listę osób na kanale




	// PIERWSZY PRELOAD KILKU NAJNOWSZYCH WPISÓW
	await checkAndInsertNewEntriesInChannel(ChannelObject, settings.fetch.numberOfEntries1stPreload).then(() =>
	{
		//ChannelObject.elements.channelFeed.dataset.active = "true";
		ChannelObject.loadingStatus = "preloaded";
	});

	// PIERWSZY PRELOAD - KOMENTARZE
	// if (dev) console.log("ChannelObject.entries.size", ChannelObject.entries.size);
	if (ChannelObject.entries.size > 0)
	{
		await checkAndInsertNewCommentsInChannel(ChannelObject).then(() =>
		{
			//ChannelObject.elements.channelFeed.dataset.active = "true";
			ChannelObject.loadingStatus = "preloaded";
		});
	}

	// TODO zapisac liste otwartych kanalow w localstorage za pomocą localforage

	setupScrollListener(openedChannels.get(ChannelObject.name));

	await fetchOpenedChannelsDataSecondPreload(ChannelObject).then(async () =>
	{
		//ChannelObject.elements.channelFeed.dataset.active = "true";
		ChannelObject.loadingStatus = "preloaded";
		await (fetchOpenedChannelsData(ChannelObject));
	});

	return ChannelObject;
}


export async function activateChannel(ChannelObject: string | T.Channel)
{

	if (typeof ChannelObject === "string")
	{
		let ChannelObjectName = ChannelObject.replaceAll(/_+$/g, "");	// usuwa wszystkie ___ z konca tagu 

		if (openedChannels.has(ChannelObjectName))
		{
			ChannelObject = openedChannels.get(ChannelObjectName);
		}
		else
		{
			ChannelObject = new T.Channel(new T.Tag(ChannelObject));
		}
	}

	if (dev) console.log(`ch.activateChannel: ${ChannelObject.name} / ${ChannelObject.nameUnderscore} `, ChannelObject)

	// let newActiveChannelElement = body.querySelector(`.channelFeed[data-channel="channel_${ChannelObject.name}"]`) as HTMLElement;
	let newActiveChannelElement = mikrochatFeeds.querySelector(`.channelFeed[data-channel="${ChannelObject.name}"]`) as HTMLElement;

	if (!newActiveChannelElement) // otwieranie nieistniejącego jeszcze kanalu
	{
		ChannelObject = await openNewChannel(ChannelObject);
		newActiveChannelElement = ChannelObject.elements.channelFeed as HTMLElement;
	}

	if (newActiveChannelElement)
	{
		activeChannels[0] = openedChannels.get(ChannelObject.name);

		// window.top.document.title = `${ChannelObject.name} ${CONST.tabTitleTemplate}`; // <title>
		window.top.document.title = index.generateTabTitle(ChannelObject);


		const previousActiveChannel = mikrochatFeeds.querySelector(`.channelFeed[data-active="true"]`) as HTMLElement;
		//if (previousActiveChannel && previousActiveChannel.dataset.channel === ChannelObject.name) return; // aktywujemy już aktywny kanał

		if (previousActiveChannel) previousActiveChannel.dataset.active = "false";

		newActiveChannelElement.dataset.active = "true";

		activeChannels[0].elements.messagesContainer.scrollTop = activeChannels[0].elements.messagesContainer.scrollHeight;


		if (ChannelObject.tag?.media?.photo?.url)
		{
			index.centerHeader.style.backgroundImage = `url(${ChannelObject.tag?.media?.photo?.url})`;
		}
		else 
		{
			index.centerHeader.style.backgroundImage = `unset`;
		}

	}


	if (CONST.ChannelsSpecialMap.has(ChannelObject.name))
	{
		let newHistoryURL = `/${$folder}/${CONST.ChannelsSpecialMap.get(ChannelObject.name).urlPath}`;
		if (window.location.pathname !== newHistoryURL)
		{
			if (dev) console.log(`history.pushState 1: /${$folder}/${CONST.ChannelsSpecialMap.get(ChannelObject.name).urlPath}`)
			// history.pushState(null, null, `/${$folder}/${CONST.ChannelsSpecialMap.get(ChannelObject.name).selector}`);
			history.pushState(null, null, newHistoryURL);
		}
	}
	else if (ChannelObject.nameUnderscore.endsWith("_"))
	{
		let newHistoryURL = `/${$folder}/${ChannelObject.nameUnderscore.replaceAll(/_+$/g, "-")}`;

		if (window.location.pathname !== newHistoryURL)
		{
			if (dev) console.log(`history.pushState 2: /${$folder}/${ChannelObject.nameUnderscore.replaceAll(/_+$/g, "-")}`)

			history.pushState(null, null, newHistoryURL);
		}
	}
	else
	{
		let newHistoryURL = `/${$folder}/${ChannelObject.name}`;

		if (window.location.pathname !== newHistoryURL)
		{
			if (dev) console.log(`history.pushState 3: /${$folder}/${ChannelObject.name}`)
			history.pushState(null, null, newHistoryURL);
		}


	}






	if (dev) console.log("openedChannels", openedChannels)
	if (dev) console.log("activeChannels", activeChannels)
}







// SECOND PRELOAD FETCHING
async function fetchOpenedChannelsDataSecondPreload(ChannelObject: T.Channel)
{
	if (ChannelObject.elements.channelFeed.dataset.loading != "false") ChannelObject.elements.channelFeed.dataset.loading = "false";

	//ChannelObject.elements.channelFeed.dataset.active = "true";
	if (dev) console.log(`🌍 fetchOpenedChannelsDataSecondPreload()`);
	if (dev) console.log(`💚 DRUGI PRELOAD FETCHING [${ChannelObject.name}]`)

	let newEntriesInsertedArray: T.Entry[] = [];

	/* jesli po otwarciu kanalu sa zaladowane tylko x wpisy z pierwszego preload wczytujemy resztę do najnowszych 50 */
	if (ChannelObject.entries.size <= settings.fetch.numberOfEntries1stPreload)
	{
		/* POBIERANIE X NAJNOWSZYCH WPISÓW - > settings.fetch.numberOfEntries2ndPreload*/
		if (ChannelObject.elements.channelFeed.dataset.loading != "true") ChannelObject.elements.channelFeed.dataset.loading = "true";
		newEntriesInsertedArray = await checkAndInsertNewEntriesInChannel(ChannelObject, settings.fetch.numberOfEntries2ndPreload);

		if (ChannelObject.elements.channelFeed.dataset.loading != "false") ChannelObject.elements.channelFeed.dataset.loading = "false";
		ChannelObject.loadingStatus = "preloaded";

		if (newEntriesInsertedArray.length > 0)
		{
			ChannelObject.elements.channelFeed.dataset.loading = "true";
			newEntriesInsertedArray.sort((a, b) => b.id - a.id);	// sortowanie malejąco wg id od najnowszych do najstarszych wpisów

			if (ChannelObject.elements.channelFeed.dataset.loading != "true") ChannelObject.elements.channelFeed.dataset.loading = "true";

			// PĘTLA WCZYTYWANIA KOMENTARZY DLA WPISÓW
			for (let entryObject of newEntriesInsertedArray)
			{
				// fetchOnHold
				if (fetch.fetchOnHold > 0)
				{
					if (dev) console.log(`⌛ Promise delay: 20 sekund fetchOnHold: ${fetch.fetchOnHold}| wczytywanie komentarzy | entryObject.id: ${entryObject.id}`);
					await new Promise(resolve => setTimeout(resolve, 20000));
				}
				if (entryObject.comments.count > 0)
				{
					await checkAndInsertNewCommentsInEntry(ChannelObject, entryObject, 50);
				}
			}
			if (ChannelObject.elements.channelFeed.dataset.loaded != "true") ChannelObject.elements.channelFeed.dataset.loaded = "true";
			if (ChannelObject.elements.channelFeed.dataset.loading != "false") ChannelObject.elements.channelFeed.dataset.loading = "false";
		}
	}
	if (ChannelObject.elements.channelFeed.dataset.loading != "false") ChannelObject.elements.channelFeed.dataset.loading = "false";





	let fetchHoursToLoad = settings.fetch.hoursToLoad; // 4h
	// jeśli wczytane wpisy są nadal młodsze niż zakres 24h to wczytujemy do okreslonego zakresu godzinowego
	// jeśli wczytane do tej pory są starsze, nie wczytuj więcej

	// if (newEntriesInsertedArray.length > 0 && newEntriesInsertedArray[newEntriesInsertedArray.length - 1].created_at_Date > new Date(new Date().getTime() - fetchHoursToLoad * 60 * 60 * 1000))
	// {
	// 	if (ChannelObject.entries.size + ChannelObject.comments.size > 400) fetchHoursToLoad = 1
	// 	else if (ChannelObject.entries.size + ChannelObject.comments.size > 200) fetchHoursToLoad = 6
	// 	else if (ChannelObject.entries.size + ChannelObject.comments.size > 50) fetchHoursToLoad = 10
	// 	else fetchHoursToLoad = 48


	// 	if (dev) console.log(`⌛ ---- Promise delay: za 10s sekund | ROZPOCZYNAM WCZYTYWANIE WPISÓW Z OSTATNICH 24H ----`);
	// 	await new Promise(resolve => setTimeout(resolve, 10000)); // WAIT 10s


	// 	/* POBIERANIE WPISÓW Z OSTATNICH 24 GODZIN */
	// 	if (ChannelObject.elements.channelFeed.dataset.loading != "true") ChannelObject.elements.channelFeed.dataset.loading = "true";
	// 	newEntriesInsertedArray = await checkAndInsertNewEntriesToDate(ChannelObject, fetchHoursToLoad, 50) as T.Entry[]; // new Date(2024-03-01 23:00:00) / "2024-03-01 23:00:00" | 24 (w godzinach)
	// 	ChannelObject.loadingStatus = "preloaded";

	// 	if (ChannelObject.elements.channelFeed.dataset.loaded != "true") ChannelObject.elements.channelFeed.dataset.loaded = "true";
	// 	if (ChannelObject.elements.channelFeed.dataset.loading != "false") ChannelObject.elements.channelFeed.dataset.loading = "false";

	// 	// WCZYTYWANIA KOMENTARZY DO WPISÓW Z OSTATNICH 24 GODZIN
	// 	if (newEntriesInsertedArray.length > 0)
	// 	{
	// 		ChannelObject.elements.channelFeed.dataset.loading = "true";
	// 		newEntriesInsertedArray.sort((a, b) => b.id - a.id);	// sortowanie malejąco wg id od najnowszych do najstarszych wpisów

	// 		if (dev) console.log(`⌛ ---- Promise delay: za 15 sekund | ROZPOCZYNAM WCZYTYWANIE KOMENTARZY Z OSTATNICH 24H OD NAJNOWSZEGO ----`);
	// 		await new Promise(resolve => setTimeout(resolve, 15000)); // WAIT 10s

	// 		const groupEntriesNewest: number = 30;
	// 		const groupEntriesOldest: number = 10;

	// 		// PĘTLA WCZYTYWANIA KOMENTARZY DLA WPISÓW PO 10 OD NAJNOWSZYCH I PO 5 OD NAJSTARSZYCH
	// 		while (newEntriesInsertedArray.length > 0)
	// 		{
	// 			if (fetch.fetchOnHold > 0)
	// 			{
	// 				if (dev) console.log(`⌛ Promise delay: 20 sekund fetchOnHold: ${fetch.fetchOnHold}| wczytywanie komentarzy`);
	// 				await new Promise(resolve => setTimeout(resolve, 20000));
	// 			}

	// 			if (ChannelObject.elements.channelFeed.dataset.loading != "true") ChannelObject.elements.channelFeed.dataset.loading = "true";
	// 			for (let k = 0; k < groupEntriesNewest && newEntriesInsertedArray.length > 0; k++)
	// 			{
	// 				let entryObject = newEntriesInsertedArray.shift(); // get first element

	// 				if (entryObject.comments.count > 0)
	// 				{
	// 					if (ChannelObject.elements.channelFeed.dataset.loading != "true") ChannelObject.elements.channelFeed.dataset.loading = "true";
	// 					// jesli jest ponad 50 komentarzy spowalniamy i nie wczytujemy nastepnego wpisu z tej serii
	// 					if (entryObject.comments.count >= 30)
	// 					{
	// 						await checkAndInsertNewCommentsInEntry(ChannelObject, entryObject, 5000);
	// 						k = groupEntriesNewest;
	// 					}
	// 					else
	// 					{
	// 						await checkAndInsertNewCommentsInEntry(ChannelObject, entryObject, 10);
	// 					}
	// 				}
	// 			}

	// 			if (ChannelObject.elements.channelFeed.dataset.loading != "false") ChannelObject.elements.channelFeed.dataset.loading = "false";
	// 			await new Promise(resolve => setTimeout(resolve, 15000)); // Wait for 15 seconds

	// 			for (let k = 0; k < groupEntriesOldest && newEntriesInsertedArray.length > 0; k++)
	// 			{
	// 				let entryObject = newEntriesInsertedArray.pop(); // Get the last element

	// 				if (entryObject.comments.count > 0)
	// 				{
	// 					if (ChannelObject.elements.channelFeed.dataset.loading != "true") ChannelObject.elements.channelFeed.dataset.loading = "true";
	// 					// jesli jest ponad 50 komentarzy spowalniamy i nie wczytujemy nastepnego wpisu z tej serii
	// 					if (entryObject.comments.count >= 30)
	// 					{
	// 						await checkAndInsertNewCommentsInEntry(ChannelObject, entryObject, 5000);
	// 						k = groupEntriesOldest;
	// 					}
	// 					else
	// 					{
	// 						await checkAndInsertNewCommentsInEntry(ChannelObject, entryObject, 10);
	// 					}
	// 				}

	// 			}
	// 			if (ChannelObject.elements.channelFeed.dataset.loading != "false") ChannelObject.elements.channelFeed.dataset.loading = "false";

	// 			await new Promise(resolve => setTimeout(resolve, 9000)); // Wait for 9 seconds
	// 		}



	// 	}
	// }

}


// CONTINUS FETCHING
async function fetchOpenedChannelsData(ChannelObject: T.Channel)
{
	if (dev) console.log(`🌍 fetchOpenedChannelsData()`);
	if (dev) console.log(`💚 ROZPOCZYNAM AKTUALIZACJĘ WPISÓW NA KANALE [${ChannelObject.name}]`)

	ChannelObject.elements.channelFeed.dataset.loaded = "true";
	ChannelObject.loadingStatus = "loaded";
	const newMessageTextarea = openedChannels.get(ChannelObject.name).elements.newMessageTextarea;

	while (true)
	{
		if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "false") ChannelObject.elements.channelFeed.dataset.loading = "false";

		if (dev) console.log("fetchOnHold: ", fetch.fetchOnHold)
		if (dev) console.log(`⌛ Promise delay: ${settings.refreshIntervals.allEntriesAndComments / 1000} sekund`);

		await new Promise(resolve => setTimeout(resolve, settings.refreshIntervals.allEntriesAndComments));

		if (fetch.fetchOnHold <= 0)
		{
			await refreshCommentsCountAndVotesUpForAllEntriesInChannel(ChannelObject);

			if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "false") ChannelObject.elements.channelFeed.dataset.loading = "false";

			if (newMessageTextarea.innerText != "") fetch.fetchOnHold = 2;
		}
		else
		{
			if (newMessageTextarea)
			{
				if (newMessageTextarea.innerText == "")
				{
					fetch.fetchOnHold = 0;
				}
				else
				{
					// user is writing new message, temporarily dont fetch
					fetch.fetchOnHold--;
				}
			}
		}

		if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "false") ChannelObject.elements.channelFeed.dataset.loading = "false";
	}
}




// AKTUALIZACJA ISTNIEJĄCYCH WPISÓW (LICZBA KOMENTARZY I LICZBA PLUSÓW)
export async function refreshCommentsCountAndVotesUpForAllEntriesInChannel(ChannelObject: T.Channel): Promise<boolean>
{

	if (dev) console.log(`refreshCommentsCountAndVotesUpForAllEntriesInChannel(Channel: ${ChannelObject.name})`)
	if (dev) console.log(`--- aktualizacja liczby plusów i komentarzy we wszystkich otwartych wpisach (${ChannelObject.entries.size} wpisów)`);

	const refreshedEntriesArray: T.Entry[] = await api.getXNewestEntriesFromChannel(ChannelObject, ChannelObject.entries.size, settings.refreshIntervals.timeoutForEntriesPagesOver50); // wszystkie otwarte wpisy

	if (refreshedEntriesArray.length > 0)
	{
		await analyzeMessagesArrayAddNewItemsOrUpdateDataExistingMessages(ChannelObject, refreshedEntriesArray);
	}
	if (ChannelObject.elements.channelFeed) ChannelObject.elements.channelFeed.dataset.loading = "false";

	return true;
}

// AKTUALIZACJA LICZB PLUSÓW DLA KOMENTARZY POD KONKRETNYM WPISEM 
export async function refreshVotesUpForAllCommentsInEntryAndAddNewComments(ChannelObject: T.Channel, EntryObject: T.Entry): Promise<boolean>
{
	if (dev) console.log(`refreshVotesUpForAllCommentsInEntry(Channel: ${ChannelObject.name}, Entry: ${EntryObject.id})`)
	if (dev) console.log(`--- aktualizacja liczby plusów dla wpisu: ${EntryObject.slug}`);

	const commentsArray: T.Comment[] = await api.getAllCommentsFromEntry(EntryObject, true); 	// pobiera WSZYSTKIE komentarze pod wpisem

	if (dev) console.log("commentsArray", commentsArray);

	if (commentsArray.length > 0)
	{
		if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "true") ChannelObject.elements.channelFeed.dataset.loading = "true";
		await analyzeMessagesArrayAddNewItemsOrUpdateDataExistingMessages(ChannelObject, commentsArray);
	}

	return true;
}


// AKTUALIZACJA DANYCH, KTÓRE ZOSTAŁY ZMIENIONE
// votes.up | comments.count | voted
export async function analyzeMessagesArrayAddNewItemsOrUpdateDataExistingMessages(ChannelObject: T.Channel, messagesArray: T.Entry[] | T.Comment[])
{
	// if(dev) console.log(`updateCommentsCountAndVotesUpFromArrayOfRefreshedEntries(ChannelObject: ${ChannelObject.name}, entriesArray:)`, entriesArray)

	for (const entryObject of messagesArray)
	{
		// if (dev) console.log(`entryObject`, entryObject);
		// if (dev) console.log(`entryObject.id`, entryObject.id);
		// if (dev) console.log(`ChannelObject.entries.get(entryObject.id)`, ChannelObject.entries.get(entryObject.id));
		// if (dev) console.log(`ChannelObject.entries`, ChannelObject.entries);

		// nowy wpis/komentarz, którego jeszcze nie dodawaliśmy
		if ((entryObject.resource == "entry" && !ChannelObject.entries.has(entryObject.id))
			|| (entryObject.resource === "entry_comment" && !ChannelObject.comments.has(entryObject.id)))
		{
			if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "true") ChannelObject.elements.channelFeed.dataset.loading = "true";
			insertNewItem(ChannelObject, entryObject);
		}


		// aktualizujemy dane wpisu/komentarza
		else
		{
			if (entryObject.resource == "entry" && entryObject.comments?.count)
			{
				if (entryObject.comments.count != ChannelObject.entries.get(entryObject.id)?.comments?.count)
				{
					if (dev) console.log(`updateCommentsCountAndVotesUpFromArrayOfRefreshedEntries - for entryObject.comments `, entryObject.comments)
					// 🎃 DLA PROXY - ZMIENIŁA SIĘ LICZBA KOMENTARZY (TYLKO WPIS))
					if (dev) console.log(`💭 We wpisie ${entryObject.id} zmieniła się liczba komentarzy z [${ChannelObject.entries.get(entryObject.id).comments.count}] na [${entryObject.comments.count}]`);
					if (dev) console.log(entryObject);
					if (dev) console.log(entryObject.comments);

					if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "true") ChannelObject.elements.channelFeed.dataset.loading = "true";
					ChannelObject.entries.get(entryObject.id).comments.count = entryObject.comments.count;
				}

			}

			// 🎃 DLA PROXY - ZMIENIŁA SIĘ LICZBA PLUSÓW (WPIS LUB KOMENTARZ)
			if (entryObject.votes?.up)
			{
				if (entryObject.votes.up != ChannelObject.entries.get(entryObject.id)?.votes?.up)
				{
					if (dev) console.log(`updateCommentsCountAndVotesUpFromArrayOfRefreshedEntries - for entryObject.votes `, entryObject.votes)

					// if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "true") ChannelObject.elements.channelFeed.dataset.loading = "true";

					if (entryObject.resource == "entry")
					{
						if (dev) console.log(`🔼 We wpisie ${entryObject.id} zmieniła się liczba plusów z [${ChannelObject.entries.get(entryObject.id)?.votes?.up}] na [${entryObject.votes.up}]`);
						ChannelObject.entries.get(entryObject.id).votes.up = entryObject.votes.up;
					}
					else if (entryObject.resource === "entry_comment")
					{
						if (dev) console.log(`🔼 W komentarzu ${entryObject.id} zmieniła się liczba plusów z [${ChannelObject.comments.get(entryObject.id)?.votes?.up}] na [${entryObject.votes.up}]`);
						ChannelObject.comments.get(entryObject.id).votes.up = entryObject.votes.up;
					}

					if (settings.css.main.channelStats != "disabled")
					{
						fn.innerText(`.${ChannelObject.name}_plusesCount`, String([...ChannelObject.entries.values(), ...ChannelObject.comments.values()].reduce((sum, obj) => sum + obj.votes.up, 0)));	// <div>Plusów: <var class="heheszki_plusesCount"></var></div>
					}
				}
			}


			// 🎃 DLA PROXY - UŻYTKOWNIK ZAGŁOSOWAŁ NA WPIS
			if (entryObject.resource == "entry" && entryObject.voted && entryObject.voted != ChannelObject.entries.get(entryObject.id)?.voted)
			{
				if (dev) console.log(`updateCommentsCountAndVotesUpFromArrayOfRefreshedEntries - for entryObject.voted `, entryObject.voted)
				if (dev) console.log(`entryObject`, entryObject)
				if (dev) console.log(`➕ Użytkownik zaplusował wpis ${entryObject.id} zmiana .voted z: [${ChannelObject.entries.get(entryObject.id).voted}] na [${entryObject.voted}]`);

				// if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "true") ChannelObject.elements.channelFeed.dataset.loading = "true";
				ChannelObject.entries.get(entryObject.id).voted = entryObject.voted;
			}
			else if (entryObject.resource == "entry_comment" && entryObject.voted && entryObject.voted != ChannelObject.comments.get(entryObject.id).voted)
			{
				if (dev) console.log(`➕ Użytkownik zaplusował komentarz ${entryObject.id} zmiana .voted z: [${ChannelObject.comments.get(entryObject.id).voted}] na [${entryObject.voted}]`);
				ChannelObject.comments.get(entryObject.id).voted = entryObject.voted;
			}
		}

	}
}



export function updateCSSPropertyOnMessageArticleElement(entryOrCommentObject: T.Entry | T.Comment, changedPropertyName: string, changedObject?: T.Entry | T.Votes | T.Comments)
{

	let messageArticle = null;
	if (entryOrCommentObject.resource === "entry") messageArticle = mikrochatFeeds.querySelector(`.messageArticle[data-id="${entryOrCommentObject.id}"]`) as HTMLElement;
	else if (entryOrCommentObject.resource === "entry_comment") messageArticle = mikrochatFeeds.querySelector(`.messageArticle[data-id="${entryOrCommentObject.id}"]`) as HTMLElement;

	// if(dev) console.log(`🎃 updateCSSPropertyOnMessageArticleElement | entryOrComment:`, entryOrCommentObject);
	// if(dev) console.log(`🎃 updateCSSPropertyOnMessageArticleElement | changedProperty: `, changedObject);
	// if(dev) console.log(`🎃 updateCSSPropertyOnMessageArticleElement | changedPropertyName: [${changedPropertyName}]`);
	// if(dev) console.log(`🎃 messageArticle: `, messageArticle);

	if (messageArticle)
	{
		if (changedObject)
		{
			if (changedPropertyName === "up")
			{
				messageArticle.style.setProperty('--votesUp', `"${(changedObject as T.Votes).up}"`);					// var(--votesUp) = "12"
				messageArticle.dataset.votesUp = (changedObject as T.Votes).up;
			}
			if (entryOrCommentObject.resource === "entry" && changedPropertyName === "count")
			{
				messageArticle.style.setProperty('--commentsCount', `"${(changedObject as T.Comments).count}"`);		// var(--commentsCount) = "12"
				messageArticle.dataset.commentsCount = (changedObject as T.Comments).count;
			}
			if (changedPropertyName === "voted")
			{
				messageArticle.dataset.voted = (changedObject as T.Entry).voted;

				const plusButton = messageArticle.querySelector("div.buttons > button.plus");
				if ((changedObject as T.Entry).voted)
				{
					if (!plusButton.classList.contains("voted")) plusButton.classList.add("voted"); // wykop compatible
				}
				else if (plusButton.classList.contains("voted")) plusButton.classList.remove("voted");  // wykop compatible
			}
		}
		else if (entryOrCommentObject)
		{
			messageArticle.style.setProperty('--votesUp', `"${entryOrCommentObject.votes.up}"`);							// var(--votesUp) = "12"
			messageArticle.dataset.votesUp = entryOrCommentObject.votes.up;

			if (entryOrCommentObject.resource === "entry") messageArticle.style.setProperty('--commentsCount', `"${entryOrCommentObject.comments.count}"`);			// var(--commentsCount) = "12"
			messageArticle.dataset.commentsCount = entryOrCommentObject.comments.count;

			messageArticle.dataset.voted = entryOrCommentObject.voted;

			const plusButton = messageArticle.querySelector("div.buttons > button.plus");
			if ((changedObject as T.Entry).voted)
			{
				if (!plusButton.classList.contains("voted")) plusButton.classList.add("voted"); // wykop compatible
			}
			else if (plusButton.classList.contains("voted")) plusButton.classList.remove("voted");  // wykop compatible
		}

	}

}


// SPRAWDZANIE NOWYCH WIADOMOŚCI NA KANALE
export async function checkAndInsertNewEntriesInChannel(ChannelObject: T.Channel, limit: number = settings.fetch.numberOfEntries2ndPreload): Promise<T.Entry[]>
{
	if (dev) console.log(`checkAndInsertNewEntriesInChannel(Channel: ${ChannelObject.name})`);

	const entriesArray: T.Entry[] = await api.getXNewestEntriesFromChannel(ChannelObject, limit, settings.refreshIntervals.timeoutForEntriesPagesOver50);
	const filteredEntries: T.Entry[] = entriesArray.filter(entry => !ChannelObject.entries.has(entry.id));

	if (dev) console.log("ChannelObject.entries", ChannelObject.entries);
	if (dev) console.log("entriesArray", entriesArray);
	if (dev) console.log("filteredEntries", filteredEntries);

	if (filteredEntries.length > 0)
	{
		if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "true") ChannelObject.elements.channelFeed.dataset.loading = "true";
		insertNewMessagesFromArray(ChannelObject, filteredEntries);
	}

	return filteredEntries;
}


// SPRAWDZANIE NOWYCH WIADOMOŚCI NA KANALE
export async function checkAndInsertNewEntriesToDate(ChannelObject: T.Channel, fetchToDate: Date | string | number, delay: number, FETCH_DELAY_MILLISECONDS: number = 200): Promise<T.Entry[] | boolean>
{
	if (dev) console.log(`checkAndInsertNewEntriesToDate(Channel: ${ChannelObject.name}) | fetchToDate: ${fetchToDate}`)

	if (!(fetchToDate instanceof Date))
	{
		if (typeof fetchToDate === "number") // liczba godzin
		{
			fetchToDate = new Date(new Date().getTime() - fetchToDate * 60 * 60 * 1000);
		}
		else if (typeof fetchToDate === "string" && fn.isValidDate(fetchToDate))
		{
			fetchToDate = new Date(fetchToDate);
		}
	}
	if (!(fetchToDate instanceof Date)) { return false; }

	if (dev) console.log(`fetchToDate: ${fetchToDate}`);


	const entriesArray: T.Entry[] = await api.getNewestEntriesFromChannelUpToSpecifiedDate(ChannelObject, fetchToDate, 50, FETCH_DELAY_MILLISECONDS);
	const filteredEntries: T.Entry[] = entriesArray.filter(entry => !ChannelObject.entries.has(entry.id));

	// if(dev) console.log("ChannelObject.entries", ChannelObject.entries);
	// if(dev) console.log("filteredEntries", filteredEntries);
	if (filteredEntries.length > 0)
	{
		if (ChannelObject.elements.channelFeed && ChannelObject.elements.channelFeed.dataset.loading != "true") ChannelObject.elements.channelFeed.dataset.loading = "true";
		insertNewMessagesFromArray(ChannelObject, filteredEntries);
	}

	return filteredEntries;
}


// POBIERA TABLICĘ WPISÓW LUB KOMENTARZY I DODAJE ICH HTML DO OKNA KANAŁU ORAZ DODAJE AUTORA DO LISTY UŻYTKOWNIKÓW
export function insertNewMessagesFromArray(ChannelObject: T.Channel, messagesObjectsArray: T.Entry[] | T.Comment[])
{
	for (const messageObject of messagesObjectsArray)
	{
		insertNewItem(ChannelObject, messageObject);
	}
}

export function insertNewItem(ChannelObject: T.Channel, messageObject: T.Entry | T.Comment)
{
	if (messageObject.id)
	{
		// if (dev) console.log(`insertNewItem() Channel: ${ChannelObject.name}, entry: ${messageObject.id}`, messageObject);
		addUsersToChannel(ChannelObject, messageObject.author);
		insertNewMessage(ChannelObject, messageObject);
	}
}



// DODAWANIE NOWYCH KOMENTARZY POD WPISAMI, KTÓRE MAJĄ JAKIEŚ KOMENTARZE
// sprawdzamy czy aktualna liczba comments.count jest większa niż poprzednio zapisana
export async function checkAndInsertNewCommentsInChannel(ChannelObject: T.Channel) 
{
	if (dev) console.log(`checkAndInsertNewCommentsInChannel(ChannelObject: ${ChannelObject.name})`, ChannelObject);

	//  Liczba komentarzy zapisana jest w ChannelObject.entries.entry.comments.count
	for (const [entry_id, EntryObject] of ChannelObject.entries)
	{
		// pobiera WSZYSTKIE komentarze pod wpisem, aktualizacja pola EntryObject.last_checked_comments_count
		await checkAndInsertNewCommentsInEntry(ChannelObject, EntryObject, settings.refreshIntervals.timeoutForCommentsOver50)
	}
}


// SPRAWDZANIE NOWYCH KOMENTARZY POD WPISAMI NA KANALE
export async function checkAndInsertNewCommentsInEntry(ChannelObject: T.Channel, EntryObject: T.Entry, FETCH_DELAY_MILLISECONDS: number = settings.refreshIntervals.timeoutForCommentsOver50) 
{
	if (dev) console.log(`checkAndInsertNewCommentsInEntry(ChannelObject: ${ChannelObject.name} | EntryObject: ${EntryObject.id})`, EntryObject);

	await refreshVotesUpForAllCommentsInEntryAndAddNewComments(ChannelObject, EntryObject);

	// ładujemy do jednego wpisu komentarze. Liczba komentarzy zapisana jest w EntryObject.comments.count
	// if (EntryObject?.comments?.count > 0 && EntryObject.comments.count > EntryObject.last_checked_comments_count)
	// {
	// 	refreshVotesUpForAllCommentsInEntryAndAddNewComments(ChannelObject, EntryObject);
	// }
}


// URUCHOMIENIE SPRAWDZANIA NOWYCH WIADOMOSCI NA KANALE CO X SEKUND
export async function setCheckingForNewMessagesInChannel(ChannelObject: T.Channel, msInterval = 36000)
{
	// if(dev) console.log(`setCheckingForNewMessagesInChannel() every msInterval, `, ChannelObject)
	// if(dev) console.log(ChannelObject.name)

	// checkAndInsertNewEntriesInChannel(ChannelObject);
	// checkAndInsertNewCommentsInChannel(ChannelObject);

	// let i = 1;
	// let timeoutId = null
	// timeoutId = setTimeout(function startCheckingForNewMessages()
	// {
	// 	if(dev) console.log(`startCheckingForNewMessages()`);
	// 	setTimeout(setCheckingForNewMessagesInChannel, msInterval + Math.floor(Math.random() * (3000 - 500 + 1)) + 500, ChannelObject);
	// }, msInterval);
}







// ZAMYKANIE KANAŁU
// TODO
// function closeChannel(ChannelObject: T.Channel)
// {
// 	openedChannels.delete(ChannelObject.name)
// 	// TODO usunac z listy otwartych kanalow w localstorage
// }
// ZAMYKANIE AKTYWNEGO KANAŁU
// function closeActiveChannel()
// {
// 	//closeChannel(activechannelobject) // TODO
// }

// function getYouTubeFromChannel(ChannelObject: T.Channel): T.Entry
// {
// 	if(dev) console.log(`getYouTubeFromChannel`, ChannelObject.name)
// 	const currentChannel = openedChannels.get(ChannelObject.name);

// 	let EntryWithYouTubeAndMaxVotes: T.Entry = null;
// 	let maxVotes: number = -Infinity;

// 	currentChannel.entries.forEach((entry) =>
// 	{
// 		// if(dev) console.log("entry: ", entry);

// 		if (entry.media?.embed && entry.votes.up > maxVotes)
// 		{
// 			maxVotes = entry.votes.up;
// 			EntryWithYouTubeAndMaxVotes = entry;
// 		}
// 	});

// 	if(dev) console.log("▶ Most plused YouTube: maxVotesEntry: ", EntryWithYouTubeAndMaxVotes)

// 	return EntryWithYouTubeAndMaxVotes;
// }




export async function insertNewMessage(ChannelObject: T.Channel, MessageObject: T.Entry | T.Comment)
{
	if (dev) console.log(`🧡insertNewMessage(ChannelObject: ${ChannelObject.name}, entryObject: ${MessageObject.id})`);
	if (dev) console.log(`🧡entryObject:`, MessageObject);
	if (dev) console.log(`🧡ChannelObject:`, ChannelObject);


	const currentChannel = openedChannels.get(ChannelObject.name);
	if (MessageObject.resource === "entry" && currentChannel.entries.has(MessageObject.id)) return false; 										// ten wpis jest juz w Map Channel.entries
	if (MessageObject.resource === "entry_comment" && currentChannel.comments.has(MessageObject.id)) return false; 								// ten komentarz jest juz w Map Channel.comments


	//if (chatArea.querySelector(`[data-id="${entryObject.id}"]`)) return false;					// sprawdzic czy html jest juz dodany ale tylko w oknie tego kanalu bo moze byc tezna innym
	currentChannel.elements.messagesContainer.append(await getMessageHTMLElement(MessageObject));		// dodajemy HTML wpisu/komentarza do okna kanału
	currentChannel.addEntryOrCommentToChannelObject(ChannelObject, MessageObject);					// dodajemy wpis do Mapy Channel.entries / Channel.comments oraz ustawiamy proxy na zmianę liczby komentarzy/plusów


	// jeśli uzytkownik nie przesunął okna kanału, scrollujemy na sam dół okna do nowododanej wiadomosci
	if (currentChannel.elements.messagesContainer.dataset.scrollToNew == "1") currentChannel.elements.messagesContainer.scrollTop = currentChannel.elements.messagesContainer.scrollHeight;


	if (navigator?.userActivation?.hasBeenActive && MessageObject.created_at_SecondsAgo < 120) // https://developer.mozilla.org/en-US/docs/Web/API/UserActivation
	{
		// TODO: @Mention sound
		if (MessageObject.author.username == login.loggedUser.username)
		{
			// SOUND OF NEW SENT MESSAGE
			if (MessageObject.resource === "entry" && settings.sounds.outgoing_entry.enabled)
			{
				sounds.outgoing_entry.play();
			}
			else if (MessageObject.resource === "entry_comment" && settings.sounds.outgoing_comment.enabled)
			{
				sounds.outgoing_comment.play();
			}
		}
		else
		{
			// SOUND OF NEW INCOMMING MESSAGE
			if (MessageObject.resource === "entry" && settings.sounds.incoming_entry.enabled)
			{
				sounds.incoming_entry.play();
			}
			if (MessageObject.resource === "entry_comment" && settings.sounds.incoming_comment.enabled)
			{
				sounds.incoming_comment.play();
			}
		}
	}

	if (document.visibilityState != "visible" && ChannelObject.loadingStatus == "loaded")
	{
		ChannelObject.unreadMessagesCount++;
		if (MessageObject.isMentioningUser(login.loggedUser.username)) ChannelObject.unreadMentionsCount++;

		if (settings.tabTitle.unreadMessagesBadge.enabled, settings.tabTitle.unreadMentionsBadge.enabled)
		{
			window.top.document.title = index.generateTabTitle(ChannelObject); // <title> *heheszki (są nowe, nieprzeczytane wiadomosci)
		}
	}
	if (document.visibilityState == "visible")
	{
		//ChannelObject.unread = 0;
	}

	/* wibracja na smarfonach
		navigator.vibrate(200); // vibrate for 200ms
		navigator.vibrate([
			100, 30, 100, 30, 100, 30, 200, 30, 200, 30, 200, 30, 100, 30, 100, 30, 100,
		]); // Vibrate 'SOS' in Morse.
	*/
}


// Dodawanie użytkownika do listy oraz do kodu HTML
export async function addUsersToChannel(ChannelObject: T.Channel, ...userObjectUsernameStringOrUsersArray: (T.User | string)[])
{
	if (dev) console.log(`addUsersToChannel | Channel: ${ChannelObject.name} | user: ${userObjectUsernameStringOrUsersArray}`, userObjectUsernameStringOrUsersArray);
	if (dev) console.log(`typeof `, typeof userObjectUsernameStringOrUsersArray);

	userObjectUsernameStringOrUsersArray.forEach(async (userObject) =>
	{
		if (typeof userObject === 'string' && !ChannelObject.users.has(userObject))
		{
			if (dev) console.log(`👤 🔶TODO: Adding user ${userObject} by string to channel ${ChannelObject.name}`);
			// TODO user = T.User()
		}

		if (typeof userObject === "object" && !ChannelObject.users.has(userObject.username)) // removed: && userObject instanceof T.User 
		{

			ChannelObject.users.set(userObject.username, userObject);			// dodajemy uzytkownika na listę osob na kanale

			if (settings.css.main.channelStats != "disabled")
			{
				// <var class="heheszki_usersCount"></var>
				fn.innerText(`.${ChannelObject.name}_usersCount`, String(ChannelObject.users.size));
			}

			if (userObject.online || settings.usersList.showOfflineUsers)	// dodawanie użytkowników online + offline
			{
				if (dev) console.log(`👤 Adding user ${userObject.username} to channel ${ChannelObject.name}`);
				ChannelObject.elements.usersListContainer.append(await getUserHTMLElement(userObject, ChannelObject));				// dodajemy HTML wpisu/komentarza do okna kanału

				if (settings.css.main.channelStats != "disabled")
				{
					// <var class="heheszki_usersOnlineCount"></var>
					fn.innerText(`.${ChannelObject.name}_usersOnlineCount`, String(getNumberOfOnlineUsersOnChannel(ChannelObject)));
				}
			}
		}
	});
}




export async function getMessageHTMLElement(entryObject: T.Entry): Promise<Element>
{
	if (dev) console.log(`getMessageHTMLElement(entryObject), `, entryObject);

	// TEMPLATE
	const templateNode = template_messageArticle.content.cloneNode(true) as Element;

	const messageArticle = templateNode.querySelector('.messageArticle') as HTMLElement;
	const permalinkHref = templateNode.querySelector('.permalinkHref') as HTMLElement;
	const usernameAHref = templateNode.querySelector('a.username') as HTMLElement;
	const usernameSpan = templateNode.querySelector('.username_span') as HTMLElement;
	const messageContent = templateNode.querySelector('.messageContent') as HTMLElement;
	const entryImage = templateNode.querySelector('.entryImage') as HTMLImageElement;
	const entryImageHref = templateNode.querySelector('.entryImageHref') as HTMLAnchorElement;

	const entryMediaEmbedYouTube = templateNode.querySelector('.entryMediaEmbedYouTube') as HTMLAnchorElement;
	const entryMediaEmbedStreamable = templateNode.querySelector('.entryMediaEmbedStreamable') as HTMLAnchorElement;
	const entryMediaEmbedTwitter = templateNode.querySelector('.entryMediaEmbedTwitter') as HTMLAnchorElement;


	const entryDate = templateNode.querySelector('.entryDate') as HTMLElement;
	const entryDateYYYMMDD = templateNode.querySelector('.entryDateYYYMMDD') as HTMLElement;
	const entryDateHHMM = templateNode.querySelector('.entryDateHHMM') as HTMLElement;
	const entryDateHHMMSS = templateNode.querySelector('.entryDateHHMMSS') as HTMLElement;

	// BASIC DATA
	messageArticle.id = `${entryObject.resource}-${String(entryObject.id)}`;											// id="entry-1234567" or id="entry_comment-123456789"
	messageArticle.dataset.id = String(entryObject.id);																	// data-id="123456"
	messageArticle.dataset.entryId = String(entryObject.entry_id);														// data-entry-id="123456"
	messageArticle.dataset.authorUsername = entryObject.author?.username;												// data-author-username="NadiaFrance"
	messageArticle.dataset.channel = entryObject.channel.name;															// data-channel="heheszki"
	messageArticle.style.order = `-${entryObject.created_at_Timestamp}`; 												// FLEXBOX flex-direction: column-reverse UNIX TIMESTAMP SECONDS // column (z "-" flex-direction: column-reverse)
	// messageArticle.style.order = `${entryObject.created_at_Timestamp}`; 												// GRID UNIX TIMESTAMP SECONDS // column (z "-" flex-direction: column-reverse)


	/* .own WIADOMOSC WYSLANA PRZEZ ZALOGOWANEGO UZYTKOWNIKA */
	if (entryObject.author?.username === login.loggedUser.username) messageArticle?.classList.add("own"); 												// class="own"

	/* .channelOwner WIADOMOŚĆ WYSŁANA PRZEZ AUTORA KANAŁU */
	if (entryObject.author?.username === entryObject.channel?.tag?.author?.username) messageArticle?.classList.add("channelOwner"); 			// class="channelOwner"

	if (entryObject.isMentioningUser(login.loggedUser.username)) messageArticle?.classList.add("isMentioningYou"); 										// class="isMentioningYou"



	/* DATA I CZAS WIADOMOŚCI */
	entryDate.title = `${entryObject.created_at_Format("eeee BBBB")} | ${entryObject.created_at_FormatDistanceSuffix} \n${entryObject.created_at_Format("yyyy-MM-dd 'o godz.' HH:mm ")}`;
	entryDateYYYMMDD.textContent = entryObject.created_at_Format("yyyy-MM-dd");
	entryDateHHMM.textContent = entryObject.created_at_Format("HH:mm");
	entryDateHHMMSS.textContent = entryObject.created_at_Format("HH:mm:ss");


	/* var(--votesUp) LICZBA PLUSÓW */
	messageArticle.style.setProperty('--votesUp', `"${entryObject.votes.up}"`);						// var(--votesUp) = "12"
	messageArticle.dataset.votesUp = `${entryObject.votes.up}`;										// data-votes-up="12"

	messageArticle.dataset.voted = `${entryObject.voted}`;											// data-voted="0"	/ data-voted="1"


	if (entryObject.resource === "entry")
	{
		messageArticle.dataset.resource = "entry";

		messageArticle.classList.add(`entry`);														// class="messageArticle entry"
		permalinkHref.setAttribute("href", `https://go.wykopx.pl/w${entryObject.entry_id}`);
		/* LICZBA KOMENTARZY */
		messageArticle.dataset.commentsCount = `${entryObject.comments.count}`;						// data-comments-count="12"
		messageArticle.style.setProperty('--commentsCount', `"${entryObject.comments.count}"`);		// var(--commentsCount) = "12"
	}
	else if (entryObject.resource === "entry_comment")
	{
		messageArticle.dataset.resource = "entry_comment";

		messageArticle.classList.add(`comment`, `reply`);											// class="messageArticle comment reply"
		permalinkHref.setAttribute("href", `https://go.wykopx.pl/w${entryObject.entry_id}k${entryObject.id}`);
	}

	/* AVATAR AUTORA */
	if (entryObject.author.avatar)
	{
		const userAvatarImgArray = Array.from(templateNode.querySelectorAll('img.avatar_img')) as HTMLImageElement[];
		userAvatarImgArray.forEach((el: HTMLImageElement) =>
		{
			el.setAttribute("src", entryObject.author.avatar)
		});
	}


	/* NAZWA AUTORA */
	usernameAHref.setAttribute("href", `https://go.wykopx.pl/@${entryObject.author.username}`);
	usernameAHref.dataset.username = entryObject.author.username;															// <a class="username" data-username="NadiaFrance">
	usernameAHref.dataset.channel = entryObject.channel.name;																// <a class="username" data-channel="heheszki">


	messageArticle.classList.add(entryObject.author?.status);															// <article class="messageArticle banned"> // suspended // active
	usernameAHref.classList.add(entryObject.author?.status);																	// <a class="username banned"> 	// suspended // active
	usernameSpan.textContent = entryObject.author.username;

	/* KOLOR PROFILU AUTORA GREEN, ORANGE, BURGUNDY */
	if (entryObject.author?.color?.name)
	{
		// TODO color hex
		messageArticle.classList.add(`${entryObject.author?.color?.name}-profile`);										// <article class="messageArticle orange-profile" 
		usernameAHref.classList.add(`${entryObject.author?.color?.name}-profile`);											// <a class="username  orange-profile" 
	}
	// MALE / FEMALE
	if (entryObject.author?.gender == "m")
	{
		messageArticle.classList.add('male', "m-gender");					// class="messageArticle male m-gender"
		usernameAHref.classList.add('male', "m-gender");
	}
	else if (entryObject.author?.gender == "f")
	{
		messageArticle.classList.add('female', "f-gender");					// class="messageArticle female f-gender"
		usernameAHref.classList.add('female', "f-gender");						// <a class="username  orange-profile" 
	}
	else
	{
		messageArticle.classList.add("null-gender");						// class="messageArticle null-gender"
		usernameAHref.classList.add("null-gender");								// <a class="username  orange-profile" 
	}

	/*
	"media": {
		"photo": {
			"key": "PWXnEbQrvegqJkYZLO8p0KJV61ZkKRm79ABdaVN2Dl3M4x6y5z",
			"label": "P7bfWyt",
			"mime_type": "image/gif",
			"url": "https://wykop.pl/cdn/c3201142/05ce90b751be02497ab64f2fa8dd6b715a1d0df9114ad93e878ed3449c4505b8.gif",
			"size": 1941274,
			"width": 957,
			"height": 1210
		},
		https://wykop.pl/cdn/c3201142/05ce90b751be02497ab64f2fa8dd6b715a1d0df9114ad93e878ed3449c4505b8.gif
		https://wykop.pl/cdn/c3201142/05ce90b751be02497ab64f2fa8dd6b715a1d0df9114ad93e878ed3449c4505b8,w300.gif
		https://wykop.pl/cdn/c3201142/05ce90b751be02497ab64f2fa8dd6b715a1d0df9114ad93e878ed3449c4505b8,w400.gif
		https://wykop.pl/cdn/c3201142/05ce90b751be02497ab64f2fa8dd6b715a1d0df9114ad93e878ed3449c4505b8,w800.gif
	*/
	if (entryObject.media?.photo?.url)
	{
		const entryImageRecord: Record<string, string> = fn.generateImageVariantsObject(entryObject.media.photo.url);

		entryImage.src = entryImageRecord[300];
		entryImage.dataset.full = entryImageRecord["src"];
		if (entryObject.media?.photo?.width) entryImage.dataset.width = String(entryObject.media?.photo?.width);
		if (entryObject.media?.photo?.height) entryImage.dataset.height = String(entryObject.media?.photo?.height);
		if (entryObject.media?.photo?.label) entryImage.dataset.label = String(entryObject.media?.photo?.label);
		if (entryObject.media?.photo?.size) entryImage.dataset.size = String(entryObject.media?.photo?.size);

		entryImageHref.href = entryObject.media.photo.url;
	}


	/* YOUTUBE | STREAMABLE | TWITTER */
	if (entryObject.media?.embed?.url && entryObject.media?.embed?.type)
	{
		if (entryObject.media?.embed?.type === "youtube")
		{
			entryMediaEmbedYouTube.href = entryObject.media.embed.url;
			let embedVideoId = fn.getEmbedVideoIDCodeFromYouTubeURL(entryObject.media.embed.url);
			if (embedVideoId && typeof embedVideoId === "string") messageArticle.dataset.youtube = embedVideoId;
			// "thumbnail": "https://wykop.pl/cdn/c3201142/66bef4e5a7997858f030f4c39ae3ad590b7ae59b62d3121c95ba944c0c6a9d82.jpg",
			//  "age_category": "all",
			// "video_metadata": null
		}
		else if (entryObject.media?.embed?.type === "streamable")
		{
			entryMediaEmbedStreamable.href = entryObject.media.embed.url;
		}
		else if (entryObject.media?.embed?.type === "twitter")
		{
			entryMediaEmbedTwitter.href = entryObject.media.embed.url;
		}
	}

	/* WIADOMOŚĆ USUNIĘTA */
	if (entryObject.deleted)
	{
		messageArticle.dataset.deleted = `1`;									// data-deleted="1"
		messageContent.innerHTML = "(wiadomość usunięta)"
	}
	else
	{
		// DETECT MIKROCZAT MESSAGE
		if (entryObject.content && (entryObject.content.endsWith(CONST.HANGUL_MIKROCZAT) || entryObject.content.includes("](https://mikroczat.pl/czat/") || entryObject.content.includes(`${CONST.HANGUL_MIKROCZAT}\n---\n`)))
		{
			messageArticle.dataset.device = "Mikroczat";
		}
		else if (messageArticle.dataset.device != "")
		{
			messageArticle.dataset.device = entryObject.device;
		}
		messageContent.innerHTML = entryObject.content_parsed();
	}

	return templateNode;
}




export async function getUserHTMLElement(userObject: T.User, channelObject?: T.Channel): Promise<Element>
{
	// if (dev) console.log(`getUserHTMLElement(userObject), `, userObject);

	// TEMPLATE
	const templateNode = template_userListItem.content.cloneNode(true) as Element;

	const userListItem = templateNode.querySelector('.userListItem') as HTMLElement;
	const userAvatarImg = templateNode.querySelector('.avatar_img') as HTMLElement;
	const usernameAHref = templateNode.querySelector('a.username') as HTMLElement;
	const usernameSpan = templateNode.querySelector('.username_span') as HTMLElement;


	/* AVATAR AUTORA */
	if (userObject.avatar)
	{
		const userAvatarImgArray = Array.from(templateNode.querySelectorAll('img.avatar_img')) as HTMLImageElement[];
		userAvatarImgArray.forEach((el: HTMLImageElement) =>
		{
			el.setAttribute("src", userObject.avatar)
		});
	}



	/* NAZWA AUTORA */
	usernameAHref.setAttribute("href", `https://go.wykopx.pl/@${userObject.username}`);
	usernameAHref.dataset.username = userObject.username;													// <a class="username" data-username="NadiaFrance">
	usernameAHref.dataset.channel = channelObject.name;														// <a class="username" data-channel="heheszki">

	usernameSpan.textContent = userObject.username;															// <span class="username_span">NadiaFrance</span>

	let userOrderNumber: number = 0;

	if (settings.usersList.sortAlphabetically) userOrderNumber = userObject.numericalOrder;

	/* KOLOR PROFILU AUTORA GREEN, ORANGE, BURGUNDY */
	if (userObject.color?.name)
	{
		// TODO color hex
		userListItem.classList.add(`${userObject.color?.name}-profile`);									// <section class="userListItem orange-profile" 
		usernameAHref.classList.add(`${userObject.color?.name}-profile`);									// <a class="username orange-profile" 
	}
	// MALE / FEMALE
	if (userObject.gender == "m")
	{
		userListItem.classList.add('male', "m-gender");														// <section class="userListItem male m-gender"
		usernameAHref.classList.add('male', "m-gender");													// <a class="username male m-gender" 
	}
	else if (userObject.gender == "f")
	{
		userListItem.classList.add('female', "f-gender");													// <section class="userListItem female f-gender"
		usernameAHref.classList.add('female', "f-gender");													// <a class="username female f-gender" 
	}
	else
	{
		userListItem.classList.add("null-gender");															// <section class="userListItem null-gender"
		usernameAHref.classList.add("null-gender");															// <a class="username null-gender" 
	}



	if (userObject.company) userListItem.classList.add("company");
	if (userObject.verified) userListItem.classList.add("verified");
	if (userObject.blacklist) userListItem.classList.add("blacklist");
	if (userObject.follow) userListItem.classList.add("follow");
	if (userObject.note) userListItem.classList.add("note");

	if (userObject.online)
	{
		userListItem.classList.add("online");
		userOrderNumber -= 2000000;
	}

	// datasets
	if (userObject.followers) userListItem.dataset.followers = String(userObject.followers);
	if (userObject.member_since) userListItem.dataset.memberSince = String(userObject.member_since);		// ssection data-member-since="2023-07-11 14:50:19"
	if (userObject.name) userListItem.dataset.name = userObject.name;
	if (userObject.rank?.position)
	{
		userListItem.dataset.rankPosition = String(userObject.rank.position);
		userListItem.dataset.rankTrend = String(userObject.rank.trend);
	}

	userListItem.classList.add(userObject.status);															// <section class="userListItem banned" 	// suspended // active
	userListItem.dataset.status = userObject.status;														// <section data-status="banned"
	usernameAHref.classList.add(userObject.status);															// <a class="username banned"> 				// suspended // active
	if (userObject.status === "removed") userOrderNumber = 5000000;
	else if (userObject.status === "banned") userOrderNumber = 4000000;
	else if (userObject.status === "suspended") userOrderNumber = 3000000;


	/* .channelOwner AUTOR KANAŁU */
	if ((userObject.channel && userObject.username === userObject.channel?.tag?.author?.username) || channelObject && userObject.username === channelObject?.tag?.author?.username)
	{
		userListItem.classList.add("channelOwner"); 			// class="channelOwner"
		userOrderNumber -= 3000000;
	}



	/* .own WIADOMOSC WYSLANA PRZEZ ZALOGOWANEGO UZYTKOWNIKA */
	if (userObject.username === login.loggedUser.username)
	{
		userListItem.classList.add("own"); 		// class="own"
		userOrderNumber = -4000000;
	}


	userListItem.style.order = String(userOrderNumber);

	return templateNode;
}




export async function discussionViewON(ChannelObject: T.Channel, EntryObject: T.Entry)
{
	console.log(`discussionViewON: entry: `, EntryObject);
	console.log(`discussionViewON: ChannelObject.entries.get(EntryObject.id): `, ChannelObject.entries.get(EntryObject.id));

	const channelFeed = ChannelObject.elements.channelFeed;
	ChannelObject.discussionViewEntryId = EntryObject.entry_id;
	channelFeed.dataset.discussionViewEntryId = `${EntryObject.entry_id}`; 												// <div class="channelFeed " data-discussion-view-entry-id="12345"

	setReplyEntryID(ChannelObject, EntryObject);
	channelFeed.style.setProperty('--_idClr', `${fn.messageIDtoHexColor(EntryObject.entry_id, "light", "rgba", 1)}`);	// var(--channel) = "heheszki"
	let css = `.channelFeed[data-channel="${ChannelObject.name}"] .messageArticle:not([data-entry-id="${EntryObject.entry_id}"]) { display: none!important; }`;
	attachDynamicCSS({ fn: "discussionView", entryId: EntryObject.entry_id, channel: ChannelObject.name }, css);

	await checkAndInsertNewCommentsInEntry(ChannelObject, EntryObject);

}



export function discussionViewOFF(ChannelObject: T.Channel, EntryObject: T.Entry)
{
	removeReplyEntryID(ChannelObject);

	if (ChannelObject.discussionViewEntryId) delete ChannelObject.discussionViewEntryId;

	const channelFeed = ChannelObject.elements.channelFeed;
	if (channelFeed.dataset.discussionViewEntryId) delete channelFeed.dataset.discussionViewEntryId;

	channelFeed.style.removeProperty('--_idClr');
	detachDynamicCSS({ fn: "discussionView", channel: ChannelObject.name });
}



export function attachDynamicCSS(options: any = {}, css: string)
{
	let dynamicCSS: HTMLStyleElement;
	dynamicCSS = index.head.querySelector(`style[data-fn="${options.fn}"][data-channel="${options.channel}"][data-entry-id="${options.entryId}"]`);

	if (!dynamicCSS)
	{
		dynamicCSS = document.createElement('style') as HTMLStyleElement;
		if (options.fn) dynamicCSS.dataset.fn = options.fn; // <style data-fn="discussionView"
		if (options.entryId) dynamicCSS.dataset.entryId = options.entryId; // <style data-entry-id="12345"
		if (options.channel) dynamicCSS.dataset.channel = options.channel; // <style data-channel="heheszki"
		dynamicCSS.appendChild(document.createTextNode(css));
		index.head.appendChild(dynamicCSS);
	}
	else
	{
		dynamicCSS.textContent = css;
	}
}

export function detachDynamicCSS(options: any = {})
{
	let selector = "style";
	if (options.fn) selector += `[data-fn="${options.fn}"]`;
	if (options.channel) selector += `[data-channel="${options.channel}"]`;
	if (options.entryId) selector += `[data-fn="${options.entryId}"]`;

	let dynamicCSS = index.head.querySelector(selector);

	if (dynamicCSS)
	{
		dynamicCSS.parentNode.removeChild(dynamicCSS);
	}
}




// setReplyEntryID(Channel);
// setReplyEntryID(Channel, EntryObject);
// setReplyEntryID(Channel, 123456);
// ustawia reply id odaz data-resource w textarea
export async function setReplyEntryID(ChannelObject: T.Channel, messageObjectOrId?: T.Entry | number): Promise<boolean>
{
	if (dev) console.log(`setReplyEntryID() Channel ${ChannelObject.name}, messageObjectOrId:`, messageObjectOrId);

	const channelFeed = ChannelObject.elements.channelFeed as HTMLElement;
	if (!channelFeed) return;

	const newMessageTextareaContainer = ChannelObject.elements.newMessageTextareaContainer as HTMLElement;
	const newMessageTextarea = ChannelObject.elements.newMessageTextarea as HTMLElement;
	if (!newMessageTextarea || !newMessageTextareaContainer) return false;

	// NIE USTAWIONA WIADOMOSC NA KTORA ODPOWIADAMY
	if (!newMessageTextareaContainer.dataset.entryId)
	{
		let replyEntryId: number;

		// jestesmy w trybie dyskusji więc ustawiamy id dyskusji
		if (ChannelObject.discussionViewEntryId)
		{
			replyEntryId = ChannelObject.discussionViewEntryId;
		}

		// podano konkretną wiadomosc obiekt albo entry_id
		if (messageObjectOrId && !replyEntryId)
		{
			if (typeof messageObjectOrId === "number") replyEntryId = messageObjectOrId;
			else if (typeof messageObjectOrId === "object" && messageObjectOrId.entry_id) replyEntryId = messageObjectOrId.entry_id;
		}

		if (!replyEntryId)
		{
			// TODO sprawdzic tresc wiadomosci z textarea
			// TODO sprawdzic pierwszego znalezionego uzytkownika
			// TODO znalezc najnowszą wiadomosc jaką napisal na kanale
			// TODO ustawic replyid
		}

		// USTAWIAMY ID WPISU NA KTORY ODPOWIADAMY
		if (replyEntryId)
		{
			newMessageTextareaContainer.dataset.entryId = `${replyEntryId}`; 					// data-entry-id="123123" 	dodajemy tylko przy pierwszym użytkowniku

			channelFeed.style.setProperty('--_idClr', `${fn.messageIDtoHexColor(replyEntryId, "light", "rgba", 1)}`);
			channelFeed.dataset.replyingEntryId = `${replyEntryId}`; 							// <div class="channelFeed" data-replying-entry-id="12345"

			let css = `
			.channelFeed:not([data-discussion-view-entry-id])
			{
				.messageArticle[data-entry-id="${replyEntryId}"]::after 	{ content: "⦿"; color: var(--_idClr); position: absolute; bottom: -9px; left: -9px; }
				.messageArticle[data-entry-id="${replyEntryId}"] 			{ border-left-color: var(--_idClr)!important; }
				.messageArticle[data-entry-id="${replyEntryId}"].entry 		{ border-right-color: color-mix(in srgb, var(--_idClr), transparent 10%)!important; }
				.messageArticle[data-entry-id="${replyEntryId}"].comment 	{ border-right-color: color-mix(in srgb, var(--_idClr), transparent 70%)!important; }
			}`;

			attachDynamicCSS({ fn: "replyingToEntry", entryId: replyEntryId, channel: ChannelObject.name }, css);

			// SPRAWDZAMY CZY W TYM WPISIE MOŻNA ODPOWIEDZIEĆ (CZY AUTOR NIE ZBANOWAL, CZY WPIS NIE ZOSTAL USUNIETY)
			let canReplyToEntry = await checkIfYouCanPostCommentInEntry(replyEntryId);

			if (!canReplyToEntry)
			{
				// WYKRYTO AUTORA, KTÓRY MA CIĘ NA CZARNEJ LIŚCIE
				// TODO dodać blokującego uzytkownika do listy blokujących
				channelFeed.dataset.replyingBlocked = "true";							// <div class="channelFeed " data-replying-blocked="true"
			}
		}
	}


	// USTALENIE data-resource="" DLA TWORZONEJ WIADOMOSCI
	let setResource: string;
	if (newMessageTextareaContainer.dataset.entryId)
	{
		let splitFlagsArrayAndMessageContent: [string[], string] = fn.getPrefixedFlagsArray(newMessageTextarea.innerText);
		if (splitFlagsArrayAndMessageContent.length == 2)
		{
			if (dev) console.log("splitFlagsArrayAndMessageContent: ", splitFlagsArrayAndMessageContent);
			// PRZEŁĄCZNIKI NOWEJ WIADOMOŚCI -N /n
			// NOWY WPIS Z PRZEŁĄCZNIKA --n
			// ==w albo /n -> nowy wpis zamiast komentarza z @wołaniem
			if (fn.areSomeValuesInArray(splitFlagsArrayAndMessageContent[0], CONST.forceNewEntryFlagsArray))
			{
				setResource = "entry";
			}
			else
			{
				setResource = "entry_comment";
			}
		}
		else
		{
			setResource = "entry_comment";
		}
	}
	else 
	{
		setResource = "entry";
	}

	newMessageTextareaContainer.dataset.resource = setResource;
}

export function removeReplyEntryID(ChannelObject: T.Channel, MessageObject?: T.Entry)
{
	const newMessageTextareaContainer: HTMLElement = ChannelObject.elements.newMessageTextareaContainer;
	const channelFeed: HTMLElement = ChannelObject.elements.channelFeed;

	if (newMessageTextareaContainer.dataset.entryId) delete newMessageTextareaContainer.dataset.entryId;
	if (newMessageTextareaContainer.dataset.resource) delete newMessageTextareaContainer.dataset.resource;

	if (channelFeed.dataset.replyingBlocked) delete channelFeed.dataset.replyingBlocked;
	if (channelFeed.dataset.replyingEntryId) delete channelFeed.dataset.replyingEntryId;
	if (channelFeed.dataset.discussionViewEntryId) delete channelFeed.dataset.discussionViewEntryId;

	channelFeed.style.removeProperty('--_idClr');

	detachDynamicCSS({ fn: "replyingToEntry", channel: ChannelObject.name });

}



export async function executePostNewMessageToChannelFromTextarea(ChannelObject: T.Channel)
{
	const channelFeed = ChannelObject.elements.channelFeed;
	const newMessageTextarea = ChannelObject.elements.newMessageTextarea;
	const newMessageTextareaContainer = ChannelObject.elements.newMessageTextareaContainer;

	let newMessageBody = prepareNewMessageBody(ChannelObject, { content: newMessageTextarea.innerText }); // TODO adult, media, survey, embed
	let newMessage = await api.postNewMessageToChannel(ChannelObject, newMessageBody);

	if (dev) console.log("newMessage response before insertNewItem ", newMessage)

	// wysłano z sukcesem
	if (newMessage)
	{
		// DODANO NOWĄ WIADOMOŚĆ NA WYKOPIE
		insertNewItem(ChannelObject, newMessage as T.Entry);
		newMessageTextarea.innerText = "";

		// JESLI JESTESMY W WIDOKU DYSKUSJI, NIE USUWAMY TRYBU ODPOWIADANIA
		if (!ChannelObject.discussionViewEntryId)
		{
			delete newMessageTextareaContainer.dataset.entryId;
			if (channelFeed.dataset.replyingBlocked) delete channelFeed.dataset.replyingBlocked; // zbędne
			if (channelFeed.dataset.discussionViewEntryId) delete channelFeed.dataset.discussionViewEntryId;
		}

		fetch.fetchOnHold = 0;

		if (dev) console.log("💌 newMessage", newMessage)
		return newMessage;
	}
	// TODO
	// nie dodano wiadomosci:
	// - komentarz do usunietego wpisu
	// - autor Cię blokuje
	// - inny błąd
	else
	{
		return false;
	}
}



export async function checkIfYouCanPostCommentInEntry(entry_id: number): Promise<boolean>
{
	if (dev) console.log(`checkIfYouCanPostCommentInEntry() entry_id: ${entry_id}`);

	let newMessageBody: T.NewMessageBodyData = {
		resource: "entry_comment",
		entry_id: entry_id,
		content: ""
	}

	if (dev) console.log(`checkIfYouCanPostCommentInEntry() newMessageBody:`, newMessageBody);

	try
	{
		if (dev) console.log(`try > postNewMessageToChannel`);
		await api.postNewMessageToChannel(null, newMessageBody);
	}
	catch (error: unknown)
	{
		let httpError = error as T.HTTPError;
		switch (httpError.status)
		{
			case 400:
				// UZYTKOWNIK CIĘ BLOKUJE
				return false;
				break;
			case 409:
				// MOZED ODPISYWAĆ - WSZYSTKO OK (po prostu za krotka wiadomosc)
				return true;
				break;
			case 429:
				// INNY BLAD - ZA DUZO REQUESTOW
				break;
			default:
			// Other status codes
		}
	}
}



export function mouseOutAddEventListenerRemoveHighlightQuick(el: HTMLElement)
{
	el.addEventListener(`mouseout`, function (e: MouseEvent)
	{
		el.classList.remove(`highlightQuick`);
		unhighlight(`.messageArticle.highlightQuick`, `highlightQuick`);
	});
}

// zwraca tablicę array wszystkich wiadomości (wpisów i komentarzy) posortowanych od najstarszego do najnowszego
export function getMergedSortedFromOldestArrayOfMessages(ChannelObject: T.Channel): T.Entry[]
{
	return [...Array.from(ChannelObject.entries.values()), ...Array.from(ChannelObject.comments.values())].sort((a: T.Entry, b: T.Entry) => a.created_at_Timestamp - b.created_at_Timestamp);
}

// zwraca tablicę array wszystkich wiadomości konkretnego użytkownika posortowanych od najstarszego do najnowszego
export function getMergedSortedFromOldestArrayOfMessagesByUsername(ChannelObject: T.Channel, username: string): T.Entry[]
{
	let sortedMessages = [...Array.from(ChannelObject.entries.values()), ...Array.from(ChannelObject.comments.values())].sort((a: T.Entry, b: T.Entry) => a.created_at_Timestamp - b.created_at_Timestamp);

	return sortedMessages.filter((message: T.Entry) => message.author.username === username);
}

// zwraca najnowszą wiadomość (wpis lub komentarz) dla konkretnego użytkownika
export function getNewestMessageOfUser(ChannelObject: T.Channel, username: string): T.Entry | null
{
	return getMergedSortedFromOldestArrayOfMessagesByUsername(ChannelObject, username).pop();
}

// zwraca tablicę wszystkich @użytkowników w podanym tekście
export function getUsernamesArrayFromText(text: string, withoutAtPrefix: boolean = true): string[]
{
	const regex = /(\B)@([\w-_]+):?/g;
	const usernamesArray = [];
	let match: RegExpExecArray;

	while ((match = regex.exec(text)) !== null)
	{
		if (withoutAtPrefix && match[0].startsWith("@")) usernamesArray.push(match[0].slice(1));
		else usernamesArray.push(match[0]);
	}
	return usernamesArray;
}

// prepareNewMessageBody(ChannelObject: T.Channel, { content: "tresc wpisu/komentarza", resource: "entry|entry_comment", adult: true} )
export function prepareNewMessageBody(ChannelObject: T.Channel, messageOptions: T.NewMessageBodyData)
{
	/*
		{ 
			"content": "**foobar** __foobar__ [lorem](https://www.wykop.pl) impsum!!! #nsfw #wykop",
			"photo": "e07843ss3fbe9cb4saeed0asdfsdfc64b9a4df6084199b39d2",
			"embed": "1fde707843ss3fbe9cb4eed0asdfsdfc64ab9a4df6084199b39d2",
			"survey": "qErgdjp5K0xz",
			"adult": false

			// dodatkowe opcje które nie mogą być wysłane w API fetch POST
			resource: "entry|entry_comment"
			entry_id: id number
		}
	*/

	if (dev) console.log(`prepareNewMessageBody() channel: ${ChannelObject.name} | messageOptions: `, messageOptions);


	// PRZEŁĄCZNIKI NOWEJ WIADOMOŚCI
	// array of prefixed flags eg. "-N -w -x content" -> ["w", "n";
	let splitFlagsArrayAndMessageContent: [string[], string] = fn.getPrefixedFlagsArray(messageOptions.content);

	if (splitFlagsArrayAndMessageContent.length == 2)
	{
		if (dev) console.log("prefixes", splitFlagsArrayAndMessageContent);

		// FLAGA --N - NOWY WPIS
		// ==w albo /n -> nowy wpis zamiast komentarza z @wołaniem
		if (fn.areSomeValuesInArray(splitFlagsArrayAndMessageContent[0], CONST.forceNewEntryFlagsArray))
		{
			messageOptions.resource = "entry";
			messageOptions.content = splitFlagsArrayAndMessageContent[1];
		}
	}

	/* WPIS CZY KOMENTARZ? */
	if (!messageOptions.resource || messageOptions.resource == "entry_comment")
	{
		// USTAWIONE REPLY ENTRY ID NA TEXTAREA 
		if (ChannelObject.elements.newMessageTextareaContainer.dataset.entryId && ChannelObject.elements.newMessageTextareaContainer.dataset.resource)
		{
			messageOptions.resource = ChannelObject.elements.newMessageTextareaContainer.dataset.resource as T.Resource;  // "entry_comment";
			messageOptions.entry_id = parseInt(ChannelObject.elements.newMessageTextareaContainer.dataset.entryId);
		}
		// DISCUSSION VIEW REPLYING
		else if (ChannelObject.discussionViewEntryId)
		{
			messageOptions.resource = "entry_comment";
			messageOptions.entry_id = ChannelObject.discussionViewEntryId;
		}
		else
		{
			const usersArrayInContent = getUsernamesArrayFromText(messageOptions.content, true);

			if (usersArrayInContent.length > 0)
			{
				if (dev) console.log("usersArrayInContent", usersArrayInContent)

				// NAJNOWSZA WIADOMOŚĆ OD PIERWSZEGO WOŁANEGO @UŻYTKOWNIKA
				const messageObjectReplyingTo = getNewestMessageOfUser(ChannelObject, usersArrayInContent[0]);

				if (messageObjectReplyingTo)
				{
					if (dev) console.log("messageObjectReplyingTo", messageObjectReplyingTo)

					// jeśli w treści był @użytkownik, pobieramy jego wiadomość i ustawiamy id wpisu na który odpowiadamy (niezaleznie czy @uzytkownik napisal wpis lub komentarz, odpowiadamy pod wpisem)
					messageOptions.resource = "entry_comment";
					messageOptions.entry_id = messageObjectReplyingTo.entry_id;
				}
				else
				{
					messageOptions.resource = "entry";
				}
			}


		}
	}

	if (!messageOptions.resource) messageOptions.resource = "entry";


	if (dev) console.log("messageOptions", messageOptions)

	/* TREŚĆ WPISU / KOMENTARZA */


	// dodajemy automatycznie #tag otwartego kanału na końcu wpisu jeśli nie był podany w treści i o ile nie jest to kanał specjalny
	if (messageOptions.resource == "entry" && !messageOptions.content.includes(`#${ChannelObject.name}`) && !CONST.ChannelsSpecialMap.has(ChannelObject.name))
	{
		messageOptions.content += ` #${ChannelObject.name}`;
	}






	// DETECT MIKROCZAT MESSAGE
	if (settings.promoFooter.enable == false)
	{
		messageOptions.content += ` [${CONST.HANGUL_MIKROCZAT}](https://mikroczat.pl/czat/${ChannelObject.name})`;
	}

	else if (settings.promoFooter.emoji || settings.promoFooter.label || settings.promoFooter.mikroczatLinks || settings.promoFooter.roomInfo)
	{
		messageOptions.content += `\n`;
		messageOptions.content += `${CONST.HANGUL_MIKROCZAT}\n---\n`; // `${CONST.HANGUL_MIKROCZAT}\n---\n`; 			NIE POKAZUJE SIE ANI LINIA, ANI ---
		// `${CONST.HANGUL_MIKROCZAT}\N\n---\n`; 		POKAZUJE SIE LINIA
		// `\n---${CONST.HANGUL_MIKROCZAT}\n`; 			NIE POKAZUJE SIE LINIA TYLKO ---

		if (settings.promoFooter.roomInfo)
		{
			let numberOfOnlineUsersOnChannel = ch_fn.getNumberOfOnlineUsersOnChannel(ChannelObject);
			const i = numberOfOnlineUsersOnChannel % 10;
			if (i === 2 || i % 10 === 3 || i % 10 === 4) numberOfOnlineUsersOnChannel += 3;

			messageOptions.content += ` 🟢 ${numberOfOnlineUsersOnChannel} osób online na kanale [**#${ChannelObject.name}**](https://mikroczat.pl/czat/${ChannelObject.name}) \n`; // TODO: odmiana słowa "osoby"
		}

		if (settings.promoFooter.emoji || settings.promoFooter.label)
		{
			// DETECT MIKROCZAT MESSAGE
			if (settings.promoFooter.emoji && !settings.promoFooter.label) messageOptions.content += `[💭](https://mikroczat.pl/czat/${ChannelObject.name})`;
			if (!settings.promoFooter.emoji && settings.promoFooter.label) messageOptions.content += `[Mikroczat](https://mikroczat.pl/czat/${ChannelObject.name})`;
			if (settings.promoFooter.emoji && settings.promoFooter.label) messageOptions.content += `💭 [Mikroczat](https://mikroczat.pl/czat/${ChannelObject.name})`;
		}

		if (settings.promoFooter.mikroczatLinks) 
		{
			messageOptions.content += ` | [📘 Instrukcja](https://github.com/wykopx/WykopX/wiki/MikroCzat) `;
			// messageOptions.content += ` | [🧷 Skrypt logowania na Mikroczat](https://greasyfork.org/pl/scripts/489949-wykop-xs-mikroczat) `;
		}
	}



	// jesli dodajemy wpis a tresc  nadal za krotka uzupelniamy ją pustym fillerem HANGUL
	if (messageOptions.resource === "entry" && messageOptions.content.length < CONST.newEntryMinimumContentLength)
	{
		messageOptions.content = messageOptions.content.padEnd(CONST.newEntryMinimumContentLength - messageOptions.content.length, CONST.HANGUL_CHOSEONG_FILLER);
	}


	// DETECT MIKROCZAT MESSAGE - dodajemy na koniec wiadomosci
	messageOptions.content += CONST.HANGUL_DETECT_MIKROCZAT_ENDING;



	if (dev) console.log("prepareNewMessageBody() -- przygotowana tresc nowej wiadomosci: messageOptions", messageOptions)
	return new T.Entry(messageOptions, ChannelObject);
}




export function highlight(highlightElementSelector: string, highlightClass: string)
{
	fn.addClass(highlightElementSelector, highlightClass);
}
export function unhighlight(highlightElementSelector: string, highlightClass: string)
{
	fn.removeClass(highlightElementSelector, highlightClass);
}

// Dodaje event listenera: jesli przesunieto okno z wiadomosciami wyzej, nie scrolluje w dol przy nowej wiadomosci
export function setupScrollListener(ChannelObject: T.Channel)
{
	if (ChannelObject.elements.messagesContainer)
	{
		// if(dev) console.log(`setupScrollListener(messageContainer)`, messagesContainer);

		ChannelObject.elements.messagesContainer.addEventListener('scroll', function ()
		{
			// jeśli przeglądamy dyskusję, nie sprawdzamy scrollowania
			if (ChannelObject.discussionViewEntryId)
			{
				ChannelObject.elements.messagesContainer.dataset.scrollToNew = "0";
				return;
			}
			// if(dev) console.log(`🔖 SCROLL EVENT: scrollTop: [${messagesContainer.scrollTop}] clientHeight: [${messagesContainer.clientHeight}] | data-scroll-to-new="${messagesContainer.dataset.scrollToNew}"`);
			// if(dev) console.log(`🔖 Math.abs(messagesContainer.scrollTop): `, Math.abs(messagesContainer.scrollTop));
			// if(dev) console.log(`🔖 Math.abs(messagesContainer.scrollTop) < messagesContainer.clientHeight: `, Math.abs(messagesContainer.scrollTop) < messagesContainer.clientHeight);

			// messagesContainer.scrollTop = od -1500 do 0 (bottom). scroll-snap-type: both mandatory; makes it goes to ca. -6px
			if (Math.abs(ChannelObject.elements.messagesContainer.scrollTop) < ChannelObject.elements.messagesContainer.clientHeight)				// jesli dol kanalu jest widoczny, scrollujemy przy nowej wiadomosci
			{
				if (ChannelObject.elements.messagesContainer.dataset.scrollToNew === "0") ChannelObject.elements.messagesContainer.dataset.scrollToNew = "1";
			}
			else 	// przesunieto okno wiadomosci wyzej i nie widac najnowszych wiadomosci - wyłączamy automatyczne scrollowanie przy nowej wiadomosci
			{
				if (ChannelObject.elements.messagesContainer.dataset.scrollToNew === "1") ChannelObject.elements.messagesContainer.dataset.scrollToNew = "0";
			}
		}, false);
	}
}
