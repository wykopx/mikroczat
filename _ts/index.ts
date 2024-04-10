'use strict';
import * as api from './wykop_api.js';
import * as CONST from './const.js';
import * as T from './types.js';
import { pl } from "../node_modules/date-fns/locale.mjs";
import { parse } from "../node_modules/date-fns/parse.mjs";
import { format } from "../node_modules/date-fns/format.mjs";
import { subDays } from "../node_modules/date-fns/subDays.mjs";
import { parseJSON } from "../node_modules/date-fns/parseJSON.mjs";
import { getUnixTime } from "../node_modules/date-fns/getUnixTime.mjs";
import { formatDistance } from "../node_modules/date-fns/formatDistance.mjs";
import * as fn from './fn.js';
declare var openChannelsFromURLArray: string[];

const openedChannels: Map<string, T.Channel> = new Map();
const activeChannels: [T.Channel, T.Channel] = [null, null];

declare var Split: any;
declare global 
{
	interface Window
	{
		logout: () => void,
		youtubeswitch: () => void,
		spotifyswitch: () => void,
		activateChannel: (channel: string | T.Channel) => void
	}
}


const numbersOfEntriesToLoadOnChannelOpen = 1; // max 50
const numbersOfEntriesToLoadInChannel = 49; // max 50
const numbersOfEntriesToCheck = 2;	// max 50
const numbersOfCommentsToLoad = 50; // max 50
let nightMode: string = localStorage.getItem('nightMode');

let mikroczatLoggedIn = false;
let wykopDomain = "https://wykop.pl";
let wxDomain = "https://wykopx.pl";
let mikroczatDomain = "https://mikroczat.pl";

const root = document.documentElement;
const head = document.head;
const body = document.body;
const main = document.getElementById("main");
const centerHeader = document.getElementById("centerHeader");
const template_channelFeed = document.getElementById("template_channelFeed") as HTMLTemplateElement;
const template_messageArticle = document.getElementById("template_messageArticle") as HTMLTemplateElement;
const chatArea = document.getElementById("chatArea");
const mikrochatFeeds = document.getElementById("mikrochatFeeds");

// const newMessageSound = new Audio('/_sounds/switch-7.wav');
// const newMessageSound = new Audio('/_sounds/31899.mp3');
const newMessageSound = new Audio('/_sounds/80177.mp3');

export let user: T.User = { username: "Anonim (Ty)" };
export let tokensObject: T.TokensObject = api.getTokenFromDatabase(); // authObject w db.js node
if ((tokensObject.token || tokensObject.refresh_token) && !mikroczatLoggedIn) logIn();



// ? TESTING
var intervalID = setInterval(function ()
{
	// console.log("openedChannels", openedChannels)
}, 10000);




const loginDialog = document.querySelector("#loginDialog") as HTMLDialogElement;
const loginInput = document.querySelector("#loginInput");
const loginAlertTokenSuccess = document.querySelector("#loginDialog #loggedInToken");
const loginAlertRefreshTokenSuccess = document.querySelector("#loginDialog #loggedInRefreshToken");
const loginAlertError = document.querySelector("#loginDialog .alert-error");


const showLoginDialogButton = document.querySelector("#showLoginDialog");
const closeLoginDialogButton = document.querySelector("#closeLoginDialogButton");

// "Show the dialog" button opens the dialog modally
showLoginDialogButton.addEventListener("click", () =>
{
	loginDialog.showModal();
});
// "Close" button closes the dialog
closeLoginDialogButton.addEventListener("click", () =>
{
	if (processLoginData((loginInput as HTMLInputElement).value)) logIn();
	loginDialog.close();
});
loginInput.addEventListener("paste", (event: ClipboardEvent) =>
{
	console.log(event);
	processLoginData((event.target as HTMLInputElement).value);
})
loginInput.addEventListener("change", (event) =>
{
	console.log(event);
	processLoginData((event.target as HTMLInputElement).value);
})
loginInput.addEventListener("input", (event) =>
{
	console.log(event);
	processLoginData((event.target as HTMLInputElement).value);
})
function processLoginData(pastedData: string)
{
	if (pastedData == "" || pastedData == null || pastedData == undefined)
	{
		return false;
	}
	if (pastedData.length < 64)
	{
		fn.hide(loginAlertRefreshTokenSuccess);
		fn.hide(loginAlertTokenSuccess);
		fn.show(loginAlertError);
		return false;
	}

	let tokensObject = api.saveToken({ tokenValue: pastedData });
	if (tokensObject !== false)
	{
		fn.hide(loginAlertError);
		if ('refreshToken' in tokensObject)
		{
			fn.show(loginAlertRefreshTokenSuccess);
			return true;
		}
		else if ('token' in tokensObject)
		{
			fn.show(loginAlertTokenSuccess);
			return true;
		}
	}
	else
	{
		fn.hide(loginAlertRefreshTokenSuccess);
		fn.hide(loginAlertTokenSuccess);
		fn.show(loginAlertError);
		return false;
	}
}
async function logIn()
{
	console.log(`logIn()`);

	if (tokensObject.refresh_token)
	{
		let newTokensObject: T.TokensObject | boolean = await api.fetchAPIrefreshTokens();
		if (newTokensObject !== false)
		{
			if (typeof newTokensObject === 'object' && 'token' in newTokensObject) 
			{
				tokensObject.token = newTokensObject.token;
			}
		}
	}

	if (!tokensObject.token) tokensObject = api.getTokenFromDatabase();


	await fetch(`${CONST.apiPrefixURL}/profile/short`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			Authorization: "Bearer " + window.localStorage.getItem("token"),
		},
	})
		.then(async (response) =>
		{
			console.log("logIn() > response from", response);

			// nieaktualny token
			if (!response.ok)
			{
				mikroczatLoggedIn = false;
				console.log(`Problem z logowaniem: ${response.status}`);
				await api.fetchAPIrefreshTokens();
				return false;
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		})
		.then((responseJSON) =>
		{
			console.log("🟢🟢🟢 responseJSON - api/v3/profile/short")
			console.log(responseJSON)
			user = responseJSON.data;
			console.log(`user: ${user.username}`, user);
			window.localStorage.setItem("username", user.username);
			confirmLoggedIn();
			return true;

		})
		.catch((error) =>
		{
			mikroczatLoggedIn = false;

			loginDialog.showModal();

			if (error instanceof TypeError)
			{
				console.error('Network error:', error); // AWARIA SERWERA
			} else
			{
				console.error('Other error:', error);
			}
		});
}
async function confirmLoggedIn()
{

	console.log(`confirmLoggedIn()`)
	console.log("user:", user)
	mikroczatLoggedIn = true;

	fn.innerHTML(".loggedInUsername", user.username)


	document.querySelectorAll("a.loggedInHref").forEach((el: HTMLAnchorElement) =>
	{
		el.href = 'https://go.wykopx.pl/@${user.username}';
		el.classList.add(`${user.status}`, `${user.color}-profile`, `${user.gender}-gender`); // "active/banned/suspended, "orange-profile", "m-gender/f-gender/null-gender";
	});




	// MESSAGE WYKOP.PL
	if (window.opener) window.opener.postMessage('mikroczatLoggedInIn', wykopDomain);

	// console.log("openChannelsFromURLArray", openChannelsFromURLArray);
	if (openChannelsFromURLArray.length > 0)
	{
		for (const channelName of openChannelsFromURLArray)
		{
			const newTag = new T.Tag(channelName);
			const newChannel = new T.Channel(newTag);
			openedChannels.set(channelName, newChannel)
		}
	}

	if (openedChannels.size > 0)
	{
		console.log("💜openedChannels: ", openedChannels);

		for (let [, ChannelObject] of openedChannels)
		{
			openNewChannel(ChannelObject);

			ChannelObject.users.set(user.username, user);			// dodajemy uzytkownika na listę osob na kanale
			window.activateChannel(ChannelObject);

			console.log('⌛ Promise delay: 4 sekundy');
			await new Promise(resolve => setTimeout(resolve, 4000)); // wait 1s pomiedzy otwieraniem kilku kanalow na raz
		}
	}
}




// 	<div data-channel="wojna" class="channelFeed column" data-loaded="true" data-active="false"></div>
async function openNewChannel(ChannelObject: T.Channel): Promise<T.Channel> 
{
	await ChannelObject.tag.initFromAPI().then(() =>
	{
		openedChannels.set(ChannelObject.name, ChannelObject)
	});

	//if (!openedChannels.has(ChannelObject.name)) {	} else	{	}

	console.log(`openNewChannel: `, ChannelObject.name)
	const templateNode = template_channelFeed.content.cloneNode(true) as Element;
	const channelFeedDiv = templateNode.querySelector('.channelFeed') as HTMLElement;
	channelFeedDiv.dataset.channel = `channel_${ChannelObject.name}`;
	channelFeedDiv.id = `channel_${ChannelObject.name}`;
	mikrochatFeeds.appendChild(templateNode); // tworzymy okno nowego kanału

	openedChannels.get(ChannelObject.name).element = document.getElementById(`channel_${ChannelObject.name}`);
	openedChannels.get(ChannelObject.name).messagesContainer = openedChannels.get(ChannelObject.name).element.querySelector(".messagesContainer");


	console.log(openedChannels.get(ChannelObject.name).element)

	// pobieramy najnowszych X wpisów z kanału podczas otwierania
	await checkAndInsertNewEntriesInChannel(ChannelObject, numbersOfEntriesToLoadOnChannelOpen);

	// ładujemy do każdego wpisu komentarze. Liczba komentarzy zapisana jest w ChannelObject.entries.[entry].comments.count
	console.log("ChannelObject.entries.size", ChannelObject.entries.size)
	if (ChannelObject.entries.size > 0) await checkAndInsertNewCommentsInChannel(ChannelObject);

	//setCheckingForNewMessagesInChannel(ChannelObject);
	// console.log(`openNewChannel() ChannelObject: `, ChannelObject)
	// console.log(`openNewChannel() ChannelObject.entries: `, ChannelObject.entries)
	// console.log(`openNewChannel() ChannelObject.comments: `, ChannelObject.comments)
	// TODO zapisac liste otwartych kanalow w localstorage za pomocą localforage

	mikrochatFeeds.querySelector(".loadingInfo").classList.add("hidden");
	setupScrollListener(openedChannels.get(ChannelObject.name).messagesContainer);

	fetchOpenedChannelsData(ChannelObject);

	return ChannelObject;
}




const FETCH_DELAY_MILLISECONDS = 300;

// async function fetchOpenedChannelsData()
// {
// 	console.log(`🌍 fetchOpenedChannelsData()`);
// 	// sprawdzamy po kolei wszystkie kanaly
// 	for (let channelObject of openedChannels.values())
// 	{
// 		console.log(`💚 ROZPOCZYNAM AKTUALIZACJĘ WPISÓW NA KANALE [${channelObject.name}]`)

// 		let newEntriesInsertedArray: T.Entry[] = [];
// 		// jesli po otwarci kanalu sa zaladowane tylko 3 wpisy wczytujemy resztę do najnowszych 50
// 		if (channelObject.entries.size <= numbersOfEntriesToLoadOnChannelOpen)
// 		{
// 			newEntriesInsertedArray = await checkAndInsertNewEntriesInChannel(channelObject, numbersOfEntriesToLoadInChannel);
// 		}

// 		console.log('⌛ Promise delay: 20 sekund');
// 		await new Promise(resolve => setTimeout(resolve, 20000));
// 		await refreshAllEntriesCommentsCountAndVotesUpInChannel(channelObject);

// 		// JESLI WCZYTALISMY NOWE WPISY WCZYTUJEMY DO KAZDEGO NOWEGO WPISU WSZYSTKIE KOMENTARZE
// 		// if (newEntriesInsertedArray.length > 0)
// 		// {
// 		// 	for (let entryObject of newEntriesInsertedArray)
// 		// 	{
// 		// 		if (entryObject.comments.count > 0)
// 		// 		{
// 		// 			await checkAndInsertNewCommentsInEntry(channelObject, entryObject);
// 		// 		}
// 		// 	}
// 		// }
// 	}
// }

async function fetchOpenedChannelsData(channelObject: T.Channel)
{
	console.log(`🌍 fetchOpenedChannelsData()`);
	console.log(`💚 ROZPOCZYNAM AKTUALIZACJĘ WPISÓW NA KANALE [${channelObject.name}]`)

	let newEntriesInsertedArray: T.Entry[] = [];
	/* jesli po otwarci kanalu sa zaladowane tylko 3 wpisy wczytujemy resztę do najnowszych 50 */
	if (channelObject.entries.size <= numbersOfEntriesToLoadOnChannelOpen)
	{
		newEntriesInsertedArray = await checkAndInsertNewEntriesInChannel(channelObject, numbersOfEntriesToLoadInChannel);
	}

	/* JESLI WCZYTALISMY NOWE WPISY WCZYTUJEMY DO KAZDEGO NOWEGO WPISU WSZYSTKIE KOMENTARZE */
	if (newEntriesInsertedArray.length > 0)
	{
		for (let entryObject of newEntriesInsertedArray)
		{
			if (entryObject.comments.count > 0)
			{
				await checkAndInsertNewCommentsInEntry(channelObject, entryObject);
			}
		}
	}

	while (true)
	{
		console.log('⌛ Promise delay: 10 sekund');
		await new Promise(resolve => setTimeout(resolve, 10000));
		await refreshAllEntriesCommentsCountAndVotesUpInChannel(channelObject);

	}
}

// var intervalID = setInterval(async function ()
// {
// 	// TODO dodać debounce + zmniejszyć czas
// 	await fetchOpenedChannelsData();
// 	console.log('⌛ setInterval delay: 10 sekund');

// }, 5000);



// AKTUALIZACJA ISTNIEJĄCYCH WPISÓW (LICZBA KOMENTARZY I LICZBA PLUSÓW)
async function refreshAllEntriesCommentsCountAndVotesUpInChannel(ChannelObject: T.Channel): Promise<boolean>
{
	console.log(`refreshAllEntriesCommentsCountAndVotesUpInChannel(Channel: ${ChannelObject.name})`)
	console.log(`--- aktualizacja liczby plusów i komentarzy we wszystkich otwartych wpisach (${ChannelObject.entries.size} wpisów)`);

	const refreshedEntriesArray: T.Entry[] = await api.getXNewestEntriesFromChannel(ChannelObject, ChannelObject.entries.size); // wszystkie otwarte wpisy
	if (refreshedEntriesArray.length > 0) updateCommentsCountAndVotesUpFromArrayOfRefreshedEntries(ChannelObject, refreshedEntriesArray);

	return true;
}

function updateCommentsCountAndVotesUpFromArrayOfRefreshedEntries(ChannelObject: T.Channel, entriesArray: T.Entry[])
{
	// console.log(`updateCommentsCountAndVotesUpFromArrayOfRefreshedEntries(ChannelObject: ${ChannelObject.name}, entriesArray:)`, entriesArray)

	for (const entryObject of entriesArray)
	{
		// console.log(`updateCommentsCountAndVotesUpFromArrayOfRefreshedEntries - for entryObject:`, entryObject)

		if (entryObject.comments?.count)
		{
			console.log(`updateCommentsCountAndVotesUpFromArrayOfRefreshedEntries - for entryObject.comments `, entryObject.comments)

			// jeśli zmieniła się liczba komentarzy, zaktualizuj ją
			if (entryObject.comments.count != ChannelObject.entries.get(entryObject.id).comments.count)
			{
				console.log(`💭 We wpisie ${entryObject.id} zmieniła się liczba komentarzy z [${ChannelObject.entries.get(entryObject.id).comments.count}] na [${entryObject.comments.count}]`);
				console.log(entryObject);
				console.log(entryObject.comments);

				ChannelObject.entries.get(entryObject.id).comments.count = entryObject.comments.count;
			}
			if (entryObject.votes.up != ChannelObject.entries.get(entryObject.id).votes.up)
			{
				console.log(`🔼 We wpisie ${entryObject.id} zmieniła się liczba plusów z [${ChannelObject.entries.get(entryObject.id).votes.up}] na [${entryObject.votes.up}]`);

				ChannelObject.entries.get(entryObject.id).votes.up = entryObject.votes.up;
			}
		}
	}
}



export function updateCSSPropertyOnMessageArticleElement(entryOrCommentObject: T.Entry | T.Comment, commentOrVotesObject: T.Votes | T.Comments | number)
{
	console.log(`🎃 updateCSSPropertyOnMessageArticleElement(entryOrComment)`, entryOrCommentObject);

	let messageArticle = null;
	if (entryOrCommentObject.resource === "entry") messageArticle = mikrochatFeeds.querySelector(`.messageArticle.entry[data-id="${entryOrCommentObject.id}"]`) as HTMLElement;
	else if (entryOrCommentObject.resource === "entry_comment") messageArticle = mikrochatFeeds.querySelector(`.messageArticle.entry[data-id="${entryOrCommentObject.id}"]`) as HTMLElement;

	if (messageArticle)
	{
		if (commentOrVotesObject)
		{
			if ((commentOrVotesObject as T.Votes).up)
			{
				messageArticle.style.setProperty('--votesUp', `"${(commentOrVotesObject as T.Votes).up}"`);					// var(--votesUp) = "12"
				messageArticle.dataset.votesUp = (commentOrVotesObject as T.Votes).up;
			}
			if (entryOrCommentObject.resource === "entry" && (commentOrVotesObject as T.Comments).count)
			{
				messageArticle.style.setProperty('--commentsCount', `"${(commentOrVotesObject as T.Comments).count}"`);		// var(--commentsCount) = "12"
				messageArticle.dataset.commentsCount = (commentOrVotesObject as T.Comments).count;
			}
		}
		else
		{
			messageArticle.style.setProperty('--votesUp', `"${entryOrCommentObject.votes.up}"`);							// var(--votesUp) = "12"
			messageArticle.dataset.votesUp = entryOrCommentObject.votes.up;

			if (entryOrCommentObject.resource === "entry") messageArticle.style.setProperty('--commentsCount', `"${entryOrCommentObject.comments.count}"`);			// var(--commentsCount) = "12"
			messageArticle.dataset.commentsCount = entryOrCommentObject.comments.count;

			messageArticle.dataset.voted = entryOrCommentObject.voted;

		}
	}

}


// SPRAWDZANIE NOWYCH WIADOMOŚCI NA KANALE
async function checkAndInsertNewEntriesInChannel(ChannelObject: T.Channel, limit: number = 50): Promise<T.Entry[]>
{
	console.log(`checkAndInsertNewEntriesInChannel(Channel: ${ChannelObject.name})`)
	const entriesArray: T.Entry[] = await api.getXNewestEntriesFromChannel(ChannelObject, limit);
	const filteredEntries: T.Entry[] = entriesArray.filter(entry => !ChannelObject.entries.has(entry.id));

	// console.log("ChannelObject.entries", ChannelObject.entries);
	// console.log("filteredEntries", filteredEntries);
	if (filteredEntries.length > 0) insertNewItemsFromArray(ChannelObject, filteredEntries);

	return filteredEntries;
}





// POBIERA TABLICĘ WPISÓW LUB KOMENTARZY I DODAJE ICH HTML DO OKNA KANAŁU ORAZ DODAJE AUTORA DO LISTY UŻYTKOWNIKÓW
function insertNewItemsFromArray(ChannelObject: T.Channel, entriesArray: T.Entry[] | T.Comment[])
{
	for (const entryObject of entriesArray)
	{
		console.log("filteredEntry: - przed insertMessage", entryObject);
		ChannelObject.users.set(entryObject.author.username, entryObject.author);	// dodajemy autorów wpisów na liste osob na kanale
		insertNewMessage(entryObject, ChannelObject);
	}
}




// DODAWANIE NOWYCH KOMENTARZY POD WPISAMI, KTÓRE MAJĄ JAKIEŚ KOMENTARZE
// sprawdzamy czy aktualna liczba comments.count jest większa niż poprzednio zapisana
async function checkAndInsertNewCommentsInChannel(ChannelObject: T.Channel) 
{
	console.log(`checkAndInsertNewCommentsInChannel(ChannelObject: T.Channel) `, ChannelObject.name);

	//  Liczba komentarzy zapisana jest w ChannelObject.entries.entry.comments.count
	for (const [entry_id, entryObject] of ChannelObject.entries)
	{
		if (entryObject.comments.count > 0 && entryObject.comments.count > entryObject.last_checked_comments_count)
		{
			const commentsArray: T.Comment[] = await api.getAllCommentsFromEntry(entryObject, 400); 	// pobiera WSZYSTKIE komentarze pod wpisem, aktualizacja pola entryObject.last_checked_comments_count
			const filteredComments: T.Comment[] = commentsArray.filter(comment => !ChannelObject.comments.has(comment.id));

			if (filteredComments.length > 0) insertNewItemsFromArray(ChannelObject, filteredComments);
		}
	}
}


// SPRAWDZANIE NOWYCH KOMENTARZY POD WPISAMI NA KANALE
export async function checkAndInsertNewCommentsInEntry(ChannelObject: T.Channel, EntryObject: T.Entry) 
{
	console.log(`checkAndInsertNewCommentsInEntry(ChannelObject: ${ChannelObject.name} | EntryObject: ${EntryObject.id})`, EntryObject);

	// ładujemy do jednego wpisu komentarze. Liczba komentarzy zapisana jest w EntryObject.comments.count
	if (EntryObject.comments.count > 0)
	{
		const commentsArray: T.Comment[] = await api.getAllCommentsFromEntry(EntryObject, 400); 	// pobiera WSZYSTKIE komentarze pod wpisem
		const filteredComments: T.Comment[] = commentsArray.filter(comment => !ChannelObject.comments.has(comment.id));
		// const filteredComments: T.Comment[] = commentsArray.filter(comment => !openedChannels.get(EntryObject.channel.name).comments.has(comment.id));

		console.log(`commentsArray for entry ${EntryObject.id}, `, commentsArray)
		console.log(`filteredComments for entry ${EntryObject.id}, `, filteredComments)
		if (filteredComments.length > 0)
		{
			for (const commentObject of filteredComments)
			{
				ChannelObject.users.set(commentObject.author.username, commentObject.author);	// dodajemy autorów komentarzy na liste osob na kanale // TODO mozna dodać licznik ile dodany wpisow/komentarzy
				// openedChannels.get(EntryObject.channel.name).users.set(commentObject.author.username, commentObject.author);	// dodajemy autorów komentarzy na liste osob na kanale // TODO mozna dodać licznik ile dodany wpisow/komentarzy
				insertNewMessage(commentObject, ChannelObject);
				// insertNewMessage(commentObject, openedChannels.get(EntryObject.channel.name));
			}
		}
	}
}


// URUCHOMIENIE SPRAWDZANIA NOWYCH WIADOMOSCI NA KANALE CO X SEKUND
async function setCheckingForNewMessagesInChannel(ChannelObject: T.Channel, msInterval = 36000)
{
	// console.log(`setCheckingForNewMessagesInChannel() every msInterval, `, ChannelObject)
	// console.log(ChannelObject.name)

	// checkAndInsertNewEntriesInChannel(ChannelObject);
	// checkAndInsertNewCommentsInChannel(ChannelObject);

	// let i = 1;
	// let timeoutId = null
	// timeoutId = setTimeout(function startCheckingForNewMessages()
	// {
	// 	console.log(`startCheckingForNewMessages()`);
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
// 	console.log(`getYouTubeFromChannel`, ChannelObject.name)
// 	const currentChannel = openedChannels.get(ChannelObject.name);

// 	let EntryWithYouTubeAndMaxVotes: T.Entry = null;
// 	let maxVotes: number = -Infinity;

// 	currentChannel.entries.forEach((entry) =>
// 	{
// 		// console.log("entry: ", entry);

// 		if (entry.media?.embed && entry.votes.up > maxVotes)
// 		{
// 			maxVotes = entry.votes.up;
// 			EntryWithYouTubeAndMaxVotes = entry;
// 		}
// 	});

// 	console.log("▶ Most plused YouTube: maxVotesEntry: ", EntryWithYouTubeAndMaxVotes)

// 	return EntryWithYouTubeAndMaxVotes;
// }


async function insertNewMessage(entryObject: T.Entry, ChannelObject: T.Channel)
{
	console.log(`🧡insertNewMessage(entryObject: ${entryObject.id}, ChannelObject: ${ChannelObject.name})`);
	console.log(`🧡entryObject:`, entryObject);
	// console.log(`🧡ChannelObject:`, ChannelObject);


	const currentChannel = openedChannels.get(ChannelObject.name);
	if (entryObject.resource === "entry" && currentChannel.entries.has(entryObject.id)) return false; 										// ten wpis jest juz w Map Channel.entries
	if (entryObject.resource === "entry_comment" && currentChannel.comments.has(entryObject.id)) return false; 								// ten komentarz jest juz w Map Channel.comments


	//if (chatArea.querySelector(`[data-id="${entryObject.id}"]`)) return false;	// sprawdzic czy html jest juz dodany ale tylko w oknie tego kanalu bo moze byc tezna innym
	currentChannel.messagesContainer.append(await getMessageHTMLElement(entryObject));	// dodajemy HTML wpisu/komentarza do okna kanału
	currentChannel.addEntryOrCommentToChannelObject(ChannelObject, entryObject);					// dodajemy wpis do Mapy Channel.entries oraz ustawiamy proxy na zmianę liczby komentarzy/plusów

	// jeśli uzytkownik nie przesunął okna kanału, scrollujemy na sam dół okna do nowododanej wiadomosci
	if (currentChannel.messagesContainer.dataset.scrollToNew == "1") currentChannel.messagesContainer.scrollTop = currentChannel.messagesContainer.scrollHeight;

	// SOUND OF NEW INCOMMING MESSAGE
	if (navigator?.userActivation?.hasBeenActive) // https://developer.mozilla.org/en-US/docs/Web/API/UserActivation
	{
		//newMessageSound.play(); // TODO settings
	}

}





async function getMessageHTMLElement(entryObject: T.Entry): Promise<Element>
{
	console.log(`getMessageHTMLElement(entryObject), `, entryObject);

	// TEMPLATE
	const templateNode = template_messageArticle.content.cloneNode(true) as Element;

	const messageArticle = templateNode.querySelector('.messageArticle') as HTMLElement;
	const permalinkHref = templateNode.querySelector('.permalinkHref') as HTMLElement;
	const username = templateNode.querySelector('a.username') as HTMLElement;
	const username_span = templateNode.querySelector('.username_span') as HTMLElement;
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
	messageArticle.style.order = `-${entryObject.created_at_Timestamp}`; 				// FLEXBOX flex-direction: column-reverse UNIX TIMESTAMP SECONDS // column (z "-" flex-direction: column-reverse)
	// messageArticle.style.order = `${entryObject.created_at_Timestamp}`; 					// GRID UNIX TIMESTAMP SECONDS // column (z "-" flex-direction: column-reverse)


	/* .own WIADOMOSC WYSLANA PRZEZ ZALOGOWANEGO UZYTKOWNIKA */
	if (entryObject.author?.username === user.username) messageArticle.classList.add("own"); 												// class="own"

	/* .channelOwner WIADOMOŚĆ WYSŁANA PRZEZ AUTORA KANAŁU */
	if (entryObject.author?.username === entryObject.channel?.tag?.author?.username) messageArticle.classList.add("channelOwner"); 			// class="channelOwner"


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
		messageArticle.classList.add(`entry`);														// class="messageArticle entry"
		permalinkHref.setAttribute("href", `https://go.wykopx.pl/w${entryObject.entry_id}`);
		/* LICZBA KOMENTARZY */
		messageArticle.dataset.commentsCount = `${entryObject.comments.count}`;						// data-comments-count="12"
		messageArticle.style.setProperty('--commentsCount', `"${entryObject.comments.count}"`);		// var(--commentsCount) = "12"
	}
	else if (entryObject.resource === "entry_comment")
	{
		messageArticle.classList.add(`comment`, `reply`);											// class="messageArticle comment reply"
		permalinkHref.setAttribute("href", `https://go.wykopx.pl/w${entryObject.entry_id}k${entryObject.id}`);
	}

	/* AVATAR AUTORA */
	if (entryObject.author.avatar)
	{
		const avatar_img = templateNode.querySelector('.avatar_img') as HTMLElement;
		avatar_img.setAttribute("src", entryObject.author.avatar)
	}


	/* NAZWA AUTORA */
	username.setAttribute("href", `https://go.wykopx.pl/@${entryObject.author.username}`);
	messageArticle.classList.add(entryObject.author?.status);															// <article class="messageArticle banned"> // suspended // active
	username.classList.add(entryObject.author?.status);																	// <a class="username banned"> 	// suspended // active
	username_span.textContent = entryObject.author.username;

	/* KOLOR PROFILU AUTORA GREEN, ORANGE, BURGUNDY */
	if (entryObject.author?.color?.name)
	{
		// TODO color hex
		messageArticle.classList.add(`${entryObject.author?.color?.name}-profile`);										// <article class="messageArticle orange-profile" 
		username.classList.add(`${entryObject.author?.color?.name}-profile`);											// <a class="username  orange-profile" 
	}
	// MALE / FEMALE
	if (entryObject.author?.gender == "m")
	{
		messageArticle.classList.add('male', "m-gender");					// class="messageArticle male m-gender"
		username.classList.add('male', "m-gender");
	}
	else if (entryObject.author?.gender == "f")
	{
		messageArticle.classList.add('female', "f-gender");					// class="messageArticle female f-gender"
		username.classList.add('female', "f-gender");						// <a class="username  orange-profile" 
	}
	else
	{
		messageArticle.classList.add("null-gender");						// class="messageArticle null-gender"
		username.classList.add("null-gender");								// <a class="username  orange-profile" 
	}

	if (entryObject.media?.photo?.url)
	{
		entryImage.src = entryObject.media.photo.url;
		entryImageHref.href = entryObject.media.photo.url;
	}
	/* YOUTUBE | STREAMABLE | TWITTER */
	if (entryObject.media?.embed?.url && entryObject.media?.embed?.type)
	{
		if (entryObject.media?.embed?.type === "youtube") entryMediaEmbedYouTube.href = entryObject.media.embed.url;
		else if (entryObject.media?.embed?.type === "streamable") entryMediaEmbedStreamable.href = entryObject.media.embed.url;
		else if (entryObject.media?.embed?.type === "twitter") entryMediaEmbedTwitter.href = entryObject.media.embed.url;
	}

	/* WIADOMOŚĆ USUNIĘTA */
	if (entryObject.deleted)
	{
		messageArticle.dataset.deleted = `1`;									// data-deleted="1"
		messageContent.innerHTML = "(wiadomość usunięta)"
	}
	else
	{
		messageContent.innerHTML = entryObject.content_parsed();
	}



	return templateNode;
}











// split gutters
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
// rowMinSize: 80,
// rowMaxSize: 80,
// columnMinSize: 303,
// columnMaxSize: 303,

// columnMinSizes: [{
// 	[1]: 300,
// }],
// columnMaxSizes: [{
// 	[1]: 400,
// }],
// rowMinSizes: [{
// 	[1]: 300,
// }],
// rowMaxSizes: [{
// 	[1]: 400,
// }],




// communication with opener window
if (window.opener)
{
	window.opener.postMessage('MikroCzatOpened', 'https://wykop.pl');
}

// MESSAGES FROM WYKOP.PL
window.addEventListener('message', function (event)
{
	console.log("event received", event);
	console.log("event.origin", event.origin);
	console.log("event.data", event.data);

	if (event.origin !== wykopDomain || !event?.data?.type) return;

	switch (event.data.type)
	{
		case "token":
			if (event.data.token && !window.sessionStorage.getItem("mikroczatLoggedOut"))
			{
				api.saveToken({ tokenValue: event.data.token, tokenType: "token" });
			}
			break;
		case "userKeep":
			if (event.data.userKeep && !window.sessionStorage.getItem("mikroczatLoggedOut"))
			{
				api.saveToken({ tokenValue: event.data.userKeep, tokenType: "userKeep" });
			}
			break;
		case "TokensObject":
			if (event.data.token && !window.sessionStorage.getItem("mikroczatLoggedOut"))
			{
				api.saveToken({ tokenValue: event.data.token, tokenType: "token" });
			}
			if (event.data.userKeep && !window.sessionStorage.getItem("mikroczatLoggedOut"))
			{
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
	console.log("window.opener", window.opener)

	if (!mikroczatLoggedIn) logIn();

}, false);


// BUTTONS
window.logout = function ()
{
	tokensObject = null;
	window.sessionStorage.setItem("mikroczatLoggedOut", "true");
	window.localStorage.removeItem("token")
	window.localStorage.removeItem("userKeep");
	alert("Wylogowano z MikroCzata")
	window.location.reload();
}


window.youtubeswitch = function ()
{
	if (main.dataset.youtubePlayer == "tr") main.dataset.youtubePlayer = "cl";
	else if (main.dataset.youtubePlayer == "hidden") main.dataset.youtubePlayer = "tr";
	else main.dataset.youtubePlayer = "hidden";
}
window.spotifyswitch = function ()
{
	if (main.dataset.spotifyPlayer == "tc" && main.dataset.youtubePlayer != "tr") main.dataset.spotifyPlayer = "tr";
	else if (main.dataset.spotifyPlayer == "hidden") main.dataset.spotifyPlayer = "tc";
	else main.dataset.spotifyPlayer = "hidden";
}
window.activateChannel = async function (ChannelObject: string | T.Channel)
{
	if (typeof ChannelObject === "string")
	{
		if (openedChannels.has(ChannelObject)) ChannelObject = openedChannels.get(ChannelObject);
		else
		{
			ChannelObject = new T.Channel(new T.Tag(ChannelObject));
		}
	}

	let newActiveChannelElement = body.querySelector(`.channelFeed[data-channel="channel_${ChannelObject.name}"]`) as HTMLElement;

	if (!newActiveChannelElement) // otwieranie nieistniejącego jeszcze kanalu
	{
		ChannelObject = await openNewChannel(ChannelObject);
		newActiveChannelElement = ChannelObject.element as HTMLElement;
	}

	if (newActiveChannelElement)
	{
		const previousActiveChannel = body.querySelector(`.channelFeed[data-active="true"]`) as HTMLElement;
		if (previousActiveChannel && previousActiveChannel.dataset.channel === `channel_${ChannelObject.name}`) return;
		if (previousActiveChannel) previousActiveChannel.dataset.active = "false";
		newActiveChannelElement.dataset.active = "true";
		activeChannels[0] = ChannelObject;
		activeChannels[0].messagesContainer.scrollTop = activeChannels[0].messagesContainer.scrollHeight;

		if (ChannelObject.tag?.media?.photo?.url)
		{
			centerHeader.style.backgroundImage = `url(${ChannelObject.tag?.media?.photo?.url})`;
		}
		else
		{
			centerHeader.style.backgroundImage = `unset`;
		}

	}

	history.pushState(null, null, `/chat/${ChannelObject.name}`);
	console.log("openedChannels", openedChannels)
	console.log("activeChannels", activeChannels)
}




// NIGHT MODE


window.onload = function ()
{
	toggleNightMode(nightMode);
};
// toggleNightMode()
// toggleNightMode(1)
// toggleNightMode("1")
// toggleNightMode(true)
// toggleNightMode(0)
// toggleNightMode("0")
// toggleNightMode(false)
function toggleNightMode(nightModeOn: number | string | boolean = true)
{
	if (nightModeOn == "1" || nightModeOn == 1) nightModeOn = true;
	else if (nightModeOn == "0" || nightModeOn == 0) nightModeOn = false;

	if (nightModeOn == false || body.dataset.nightMode == "1")
	{
		body.dataset.nightMode = "0";
		nightMode = "0";
	}
	else
	{
		body.dataset.nightMode = "1";
		nightMode = "1";
	}
	localStorage.setItem(`nightMode`, nightMode);
}



document.addEventListener('DOMContentLoaded', (event) =>
{
	// po najechaniu na komentarz podswietla wpis, po najechaniu wpisu podswietla wszystkie komentarze
	document.body.addEventListener(`mouseover`, function (e: MouseEvent)
	{
		let target = e.target as HTMLElement;
		let messageArticle = target.closest(`.messageArticle[data-entry-id]`) as HTMLElement;

		if (messageArticle && !messageArticle.classList.contains(`highlightLock`) && !messageArticle.classList.contains(`quickHighlight`))
		{
			if (messageArticle.classList.contains(`comment`))
			{
				messageArticle.classList.add(`quickHighlight`);
				highlight(`.messageArticle.entry[data-id="${messageArticle.dataset.entryId}"]`, `quickHighlight`);
				mouseOutAddEventListenerRemoveQuickHighlight(messageArticle);
			}
			else if (messageArticle.classList.contains("entry") && messageArticle.dataset.commentsCount != "0")
			{
				messageArticle.classList.add(`quickHighlight`);
				highlight(`.messageArticle.comment[data-entry-id="${messageArticle.dataset.entryId}"]`, `quickHighlight`);
				mouseOutAddEventListenerRemoveQuickHighlight(messageArticle);
			}
		}
	});

	function mouseOutAddEventListenerRemoveQuickHighlight(el)
	{
		el.addEventListener(`mouseout`, function (e: MouseEvent)
		{
			el.classList.remove(`quickHighlight`);
			unhighlight(`.messageArticle.quickHighlight`, `quickHighlight`);
		});
	}

	// double click - pokazuje wybraną konwersację po kliknięciu na wpis lub komentarz
	document.body.addEventListener('dblclick', function (e: MouseEvent)
	{
		let target = e.target as HTMLElement;
		let messageArticle = target.closest(".messageArticle[data-entry-id]") as HTMLElement;
		if (messageArticle)
		{
			if (messageArticle.classList.contains("highlightLock"))
			{
				fn.removeClass(`.messageArticle.highlightedItem`, "highlightedItem");
				unhighlight(`.messageArticle[data-entry-id="${messageArticle.dataset.entryId}"]`, "highlightLock");
			}
			else
			{
				messageArticle.classList.add("highlightedItem");
				highlight(`.messageArticle[data-entry-id="${messageArticle.dataset.entryId}"]`, "highlightLock");
			}
		}
	});

	function highlight(highlightElementSelector: string, highlightClass: string)
	{
		fn.addClass(highlightElementSelector, highlightClass);
	}
	function unhighlight(highlightElementSelector: string, highlightClass: string)
	{
		fn.removeClass(highlightElementSelector, highlightClass);
	}
});


// Dodaje event listenera: jesli przesunieto okno z wiadomosciami wyzej, nie scrolluje w dol przy nowej wiadomosci
function setupScrollListener(messagesContainer: HTMLElement)
{
	if (messagesContainer)
	{
		// console.log(`setupScrollListener(messageContainer)`, messagesContainer);

		messagesContainer.addEventListener('scroll', function ()
		{
			// console.log(`🔖 SCROLL EVENT: scrollTop: [${messagesContainer.scrollTop}] clientHeight: [${messagesContainer.clientHeight}] | data-scroll-to-new="${messagesContainer.dataset.scrollToNew}"`);
			// console.log(`🔖 Math.abs(messagesContainer.scrollTop): `, Math.abs(messagesContainer.scrollTop));
			// console.log(`🔖 Math.abs(messagesContainer.scrollTop) < messagesContainer.clientHeight: `, Math.abs(messagesContainer.scrollTop) < messagesContainer.clientHeight);


			// messagesContainer.scrollTop = od -1500 do 0 (bottom). scroll-snap-type: both mandatory; makes it goes to ca. -6px
			if (Math.abs(messagesContainer.scrollTop) < messagesContainer.clientHeight)				// jesli dol kanalu jest widoczny, scrollujemy przy nowej wiadomosci
			{
				if (messagesContainer.dataset.scrollToNew === "0") messagesContainer.dataset.scrollToNew = "1";
			}
			else 	// przesunieto okno wiadomosci wyzej i nie widac najnowszych wiadomosci - wyłączamy automatyczne scrollowanie przy nowej wiadomosci
			{
				if (messagesContainer.dataset.scrollToNew === "1") messagesContainer.dataset.scrollToNew = "0";
			}
		}, false);
	}
}

