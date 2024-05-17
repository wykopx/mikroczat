'use strict';
// export const version: string = "3.0.17";
import * as api from './wykop_api.js';
import * as CONST from './const.js';
import { settings, setSettings } from './settings.js';
import * as T from './types.js';
import * as ch from './ch.js';
import * as ch_fn from './ch_fn.js';
import * as login from './login.js';
import * as notifications from './wykop_notifications.js';

import { pl } from "../../node_modules/date-fns/locale.mjs";
import { parse } from "../../node_modules/date-fns/parse.mjs";
import { format } from "../../node_modules/date-fns/format.mjs";
import { sub } from "../../node_modules/date-fns/sub.mjs";
import { subDays } from "../../node_modules/date-fns/subDays.mjs";
import { parseJSON } from "../../node_modules/date-fns/parseJSON.mjs";
import { getUnixTime } from "../../node_modules/date-fns/getUnixTime.mjs";
import { formatDistance } from "../../node_modules/date-fns/formatDistance.mjs";
import * as fn from './fn.js';

import * as qr from '../_js-lib/qrcodegen.js';

let nightMode: string | null = localStorage.getItem('nightMode');

export let wykopDomain = "https://wykop.pl";
let wxDomain = "https://wykopx.pl";
let mikroczatDomain = "https://mikroczat.pl";

export const root = document.documentElement;
export const head = document.head;
export const body = document.body;
export const main = document.getElementById("main");

export const centerHeader = document.getElementById("centerHeader");
export const youtubeIframe = document.getElementById("youtubeIframe") as HTMLIFrameElement;
export const chooseChannelDialog = document.querySelector("#chooseChannelDialog") as HTMLDialogElement;


declare var openChannelsFromURLArray: string[];
declare var $folder: string;
declare let $dev: boolean;
declare let dev: boolean;
declare var hotChannels: string[];

// export let dev = false;
// if ($folder == "chat") dev = true;

if (dev)
{
	// dev settings
	// settings.css.main.channelStats = "show";
	// settings.rightClickOnUsernameCopiesToClipboard = true;

	settings.highlightQuick = true;

	settings.promoFooter.enable = true;
	settings.promoFooter.emoji = true;
	settings.promoFooter.label = true;
	settings.promoFooter.roomInfo = true;
	// settings.promoFooter.mikroczatLinks = false;
	// settings.sounds.incoming_entry.enabled = true;
	// settings.sounds.incoming_comment.enabled = true;
	settings.tabTitle.unreadMentionsBadge.enabled = true;
	settings.tabTitle.unreadMentionsBadge.showIcon = true;
	settings.tabTitle.unreadMentionsBadge.showCount = true;
	settings.tabTitle.unreadMessagesBadge.enabled = true;
	settings.tabTitle.unreadMessagesBadge.showIcon = true;
	settings.tabTitle.unreadMessagesBadge.showCount = true;
	// settings.css.chatArea.msgFilterMikroczat = true;
}
// if (dev) console.log("login.loggedUser: ", login.loggedUser);




if (!settings.promoFooter.enable && (settings.promoFooter.emoji || settings.promoFooter.label || settings.promoFooter.roomInfo || settings.promoFooter.mikroczatLinks)) settings.promoFooter.enable = true;
const lennyArray = ["ᘳಠ ͟ʖಠᘰ", "¯\\\_(ツ)\_/¯"];
export const openedChannels: Map<string, T.Channel> = new Map();
export const activeChannels: [T.Channel | null, T.Channel | null] = [null, null];


// ! TESTING
if (dev)
{
	test();

	var intervalID = setInterval(test, 1000);

	function test()
	{
		// console.log("🔄 TESTOWANIE openChannelsFromURLArray", openChannelsFromURLArray)
		// console.log("🔄 TESTOWANIE openedChannels", openedChannels)
		// console.log("🔄 TESTOWANIE activeChannels", activeChannels)
		// console.log("🔄 TESTOWANIE activeChannels[0]", activeChannels[0])
		// if (activeChannels[0]) console.log("🔄 TESTOWANIE ChannelObject - loadingStatus: ", activeChannels[0].loadingStatus)
	}
}







export const sounds: T.Sounds =
{
	logged_in: new Audio(`/_sounds/${settings.sounds.logged_in.file}`),
	logged_out: new Audio(`/_sounds/${settings.sounds.logged_out.file}`),

	outgoing_entry: new Audio(`/_sounds/${settings.sounds.outgoing_entry.file}`),
	outgoing_comment: new Audio(`/_sounds/${settings.sounds.outgoing_comment.file}`),

	incoming_entry: new Audio(`/_sounds/${settings.sounds.incoming_entry.file}`),
	incoming_comment: new Audio(`/_sounds/${settings.sounds.incoming_comment.file}`),
	incoming_mention: new Audio(`/_sounds/${settings.sounds.incoming_mention.file}`),
}


declare var Split: any;
declare global 
{
	interface Window
	{
		logout: () => void,
		youtubeswitch: () => void,
		spotifyswitch: () => void
	}
}




// alert(navigator.userAgent)

if (/Mobi|Android/i.test(navigator.userAgent))
{
	// alert("mobile")
	// user is on mobile device
	root.dataset.device = "mobile";
} else
{
	// alert("desktop")
	// user is on desktop
	root.dataset.device = "desktop";
}



export function generateTabTitle(ChannelObject: T.Channel): string
{
	// if(dev) console.log("getTabTitle() -> ChannelObject: ", ChannelObject);
	// if(dev) console.log("getTabTitle() -> activeChannels: ", activeChannels);

	let tabTitle: string = "";

	if (settings.tabTitle.unreadMentionsBadge.enabled && ChannelObject.unreadMentionsCount > 0)
	{
		if (settings.tabTitle.unreadMentionsBadge.showIcon)
		{
			tabTitle += `${settings.tabTitle.unreadMentionsBadge.icon} `;	// 🔔
		}

		if (settings.tabTitle.unreadMentionsBadge.showCount)
		{
			tabTitle += `(`;
			tabTitle += ChannelObject.unreadMentionsCount;					// 🔔 (1)

			if (settings.tabTitle.unreadMessagesBadge.enabled && settings.tabTitle.unreadMessagesBadge.showCount)
			{
				tabTitle += `/${ChannelObject.unreadMessagesCount}`;		// 🔔 (1/14) - liczba nowych wiadomosci z mentions i ogolem
			}
			tabTitle += `) `;
		}
		else if (settings.tabTitle.unreadMessagesBadge.showCount)
		{
			tabTitle += `(${ChannelObject.unreadMessagesCount}) `;			// 🔔 (14) 
		}
	}
	else if (settings.tabTitle.unreadMessagesBadge.enabled && ChannelObject.unreadMessagesCount > 0)
	{
		if (settings.tabTitle.unreadMessagesBadge.showIcon)
		{
			tabTitle += `${settings.tabTitle.unreadMessagesBadge.icon} `; 	// 🕭
		}
		if (settings.tabTitle.unreadMessagesBadge.showCount)
		{
			tabTitle += `(${ChannelObject.unreadMessagesCount}) `;			// 🕭 (14)
		}
	}


	tabTitle += CONST.ChannelsSpecialMap.has(ChannelObject.name) ? CONST.ChannelsSpecialMap.get(ChannelObject.name).tabTitle : ChannelObject.name;


	tabTitle += ` | ${CONST.tabTitleTemplate}`;

	return tabTitle;
}


document.addEventListener('visibilitychange', function ()
{
	if (document.visibilityState === 'visible')
	{
		if (activeChannels[0] && activeChannels[0].loadingStatus == "loaded")
		{
			activeChannels[0].unreadMessagesCount = 0;
			activeChannels[0].unreadMentionsCount = 0;

			window.top.document.title = generateTabTitle(activeChannels[0]);
		}
	}
	else if (document.visibilityState === 'hidden')
	{

	}
});



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





/* status online/offline events */
window.addEventListener("offline", (e) =>
{
	// console.log("offline");
});

window.addEventListener("online", (e) =>
{
	// console.log("online");
});




window.youtubeswitch = function ()
{
	const array = ["tr", "trsmall", "cl", "cc", "horizontalcenter", "horizontalbottom", "hidden"]; // topright, centerleft, bottom, hidden
	const currentIndex = array.indexOf(main.dataset.youtubePlayer);
	const nextIndex = (currentIndex + 1) % array.length;
	main.dataset.youtubePlayer = array[nextIndex];
}


window.spotifyswitch = function ()
{
	if (main.dataset.spotifyPlayer == "tc" && main.dataset.youtubePlayer != "tr") main.dataset.spotifyPlayer = "tr";
	else if (main.dataset.spotifyPlayer == "hidden") main.dataset.spotifyPlayer = "tc";
	else main.dataset.spotifyPlayer = "hidden";
}






// NIGHT MODE


window.onload = function ()
{
	fn.toggleNightMode(nightMode);
};



(function hotChannelsFn(): void
{
	if (hotChannels && hotChannels.length > 0 && chooseChannelDialog)
	{
		hotChannels.forEach(hotChanelName =>
		{
			(chooseChannelDialog.querySelector(`#${hotChanelName}`) as HTMLElement)?.classList.add("hotChannel");
		});
	}
})();






/* EVENT LISTENERS */

document.addEventListener('DOMContentLoaded', (DOMContentLoadedEvent) =>
{
	if (!dev) console.clear();





	// OKNO DIALOGOWE WYBORU KANAŁÓW
	(document.querySelector("#showChannelDialogButton") as HTMLButtonElement).addEventListener("click", function (e: MouseEvent)
	{
		chooseChannelDialog.showModal();
	});
	(document.querySelector("#closeChannelDialogButton") as HTMLButtonElement).addEventListener("click", function (e: MouseEvent)
	{
		chooseChannelDialog.close();
	});


	function supportsPopover(): boolean
	{
		return HTMLElement.prototype.hasOwnProperty("popover");
	}
	const popoverSupported = supportsPopover();


	// mouseover - QUICK HIGHLIGHT - po najechaniu na komentarz podswietla wpis, po najechaniu wpisu podswietla wszystkie komentarze
	document.body.addEventListener(`mouseover`, function (e: MouseEvent)
	{
		let target = e.target as HTMLElement;

		// if (popoverSupported && target.matches("img.avatar_img"))
		// {
		//  const popover = target.closest("div.avatar_popover") as HTMLElement;
		// 	const popover = target.nextElementSibling as HTMLElement;
		// 	popover.showPopover();
		// }

		if (settings.highlightQuick && target.closest("article.messageArticle[data-entry-id]"))
		{
			const messageArticle = target.closest(`.messageArticle[data-entry-id]`) as HTMLElement;
			const channelFeed = target.closest(`.channelFeed`) as HTMLElement;

			// TODO dodać tylko dla aktualnego kanału
			if (messageArticle && !messageArticle.classList.contains(`discussionView`) && !messageArticle.classList.contains(`highlightQuick`) && !channelFeed.dataset.discussionViewEntryId)
			{
				if (messageArticle.classList.contains(`comment`))
				{
					messageArticle.classList.add(`highlightQuick`);
					ch.highlight(`.messageArticle.entry[data-id="${messageArticle.dataset.entryId}"]`, `highlightQuick`);
					ch.mouseOutAddEventListenerRemoveHighlightQuick(messageArticle);
				}
				else if (messageArticle.classList.contains("entry") && messageArticle.dataset.commentsCount != "0")
				{
					messageArticle.classList.add(`highlightQuick`);
					ch.highlight(`.messageArticle.comment[data-entry-id="${messageArticle.dataset.entryId}"]`, `highlightQuick`);
					ch.mouseOutAddEventListenerRemoveHighlightQuick(messageArticle);
				}
			}
		}
	});


	// contextmenu - PREVENT CONTEXT MENU ON RIGHT CLICK ON USERNAME
	document.body.addEventListener('contextmenu', function (e: MouseEvent)
	{
		if (!settings.rightClickOnUsernameShowContextMenu)
		{
			let target = e.target as HTMLElement;
			let usernameAHref = target.closest(`.username`) as HTMLElement;
			if (usernameAHref && usernameAHref.dataset.username)
			{
				e.preventDefault();
			}
		}
	});




	// mousedown -
	// - RIGHT CLICK - na nickname użytkownika
	// - skopiowanie do schowka
	// - LEFT CLICK - na nickname użytkownika
	// - tryb odpowiedzi komentarzem do użytkownika
	document.body.addEventListener("mousedown", async (e: MouseEvent) => 
	{
		const target = e.target as HTMLElement;
		const usernameAHref = target.closest(`.username`) as HTMLElement;
		if (usernameAHref && usernameAHref.dataset.username)
		{
			e.preventDefault();
			// a.username albo abbr.username
			ch.fetch.fetchOnHold = 2;
			const username = `@${usernameAHref.dataset.username}`;

			// LEFT CLICK
			if (e.button === 0)
			{

				if (settings.leftClickOnUsernameInsertsToNewMessage || settings.leftClickOnUsernameSetsReplyEntry)
				{
					const ChannelObject = openedChannels.get(usernameAHref.dataset.channel) as T.Channel;
					if (!ChannelObject) return;
					const channelFeed = ChannelObject.elements.channelFeed as HTMLElement;
					if (!channelFeed) return;
					const newMessageTextareaContainer = ChannelObject.elements.newMessageTextareaContainer as HTMLElement;
					const newMessageTextarea = ChannelObject.elements.newMessageTextarea as HTMLElement;
					if (!newMessageTextarea || !newMessageTextareaContainer) return false;
					const messageArticle = usernameAHref.closest(".messageArticle") as HTMLElement;
					if (!messageArticle) return false;
					const MessageObject = messageArticle.dataset.resource === "entry" ? ChannelObject.entries.get(parseInt(messageArticle.dataset.id)) : ChannelObject.comments.get(parseInt(messageArticle.dataset.id));
					const messageEntryId = MessageObject.entry_id;



					if (settings.leftClickOnUsernameSetsReplyEntry)
					{
						// NIE USTAWIONO JESZCZE TRYBU ODPOWIEDZI - USTAWIAMY WPIS DO ODPOWIEDZI
						if (!newMessageTextareaContainer.dataset.entryId)
						{
							// USTAWIENIE ODPOWIADANEJ WIADOMOSCI
							ch.setReplyEntryID(ChannelObject, MessageObject);
						}
					}

					// DODAWANIE UŻYTKOWNIKA DO NOWEJ WIADOMOŚCI // 	WKLEJANIE NAZW UŻYTKOWNIKA DO POLA NOWEJ WIADOMOŚCI
					if (settings.leftClickOnUsernameInsertsToNewMessage)
					{
						let pasteText: string = "";

						if (newMessageTextarea.innerText != "")
						{
							if (newMessageTextarea.innerText.includes(username)) return false; // w tresci była już wklejona nazwa TEGO użytkownika, pomijamy
							pasteText = "<span> </span>";
						}

						pasteText += `<span class="entryUser" contenteditable="true"><abbr class="${usernameAHref.getAttribute('class')}" data-channel="nocnazmiana" data-username="${usernameAHref.dataset.username}"><span class="username_span">@${usernameAHref.dataset.username}</span></abbr></span><span contenteditable="true"> </span>`;

						pasteText = newMessageTextarea.innerHTML.trimEnd() + pasteText;
						newMessageTextarea.innerHTML = pasteText;


						// ustawienie kursora na końcu textarea
						var range = document.createRange();
						var sel = window.getSelection();
						var lastChild = newMessageTextarea.lastChild;
						var textNode = lastChild.firstChild as Text;
						range.setStart(textNode, 1);
						range.collapse(true);
						sel.removeAllRanges();
						sel.addRange(range);
						// textarea.focus();
					}
				}

			}


			// RIGHT CLICK
			else if (e.button === 2)
			{
				// KOPIOWANIE NAZWY UŻYTKOWNIKA DO SCHOWKA
				if (settings.rightClickOnUsernameCopiesToClipboard)
				{
					navigator.permissions.query({ name: 'clipboard-read' as any }).then(permissionStatus =>
					{
						if (permissionStatus.state == 'granted' || permissionStatus.state == 'prompt')
						{
							navigator.clipboard.readText().then((clipboardText) =>
							{
								let newClipboardText = username;
								if (clipboardText.startsWith('@'))
								{
									// DODAWANIA NAZWY UŻYTKOWNIKA TYLKO JEŚLI JESZCZE NIE ZOSTAŁ DODANY
									if (!clipboardText.includes(username)) newClipboardText = clipboardText + ', ' + username;
								}
								navigator.permissions.query({ name: 'clipboard-write' as any }).then(permissionStatus =>
								{
									if (permissionStatus.state == 'granted' || permissionStatus.state == 'prompt')
									{
										navigator.clipboard.writeText(newClipboardText)
											.then(() =>
											{
												//alert(`Nazwa użytkownika: "${usernameAHref.dataset.username}" skopiowana do schowka`);
											})
											.catch(err =>
											{
												console.error('Failed to copy username: ', err);
											});
									} else
									{
										console.error('Clipboard write permission denied');
									}
								});
							}).catch(() =>
							{
								console.error('Clipboard read permission denied');
							});
						} else
						{
							console.error('Clipboard read permission denied');
						}
					});
				}
			}

			// MIDDLE CLICK
			else if (e.button === 1)
			{

			}
		}
	});


	document.body.addEventListener("mouseup", async (e: MouseEvent) => 
	{
		const target = e.target as HTMLElement;
		const usernameAHref = target.closest(`.username`) as HTMLElement;

		if (usernameAHref && usernameAHref.dataset.username)
		{
			e.preventDefault();
		}
		console.log("mouseup, event: ", e)
		console.log("mouseup, target: ", target)
	});


	function openImageURLInNewWindow(args: any)
	{
		if (!args.src) return;

		let windowFeatures = "popup";	// https://developer.mozilla.org/en-US/docs/Web/API/Window/open#popup

		const imageHeight: number = parseInt(args.height) || 600;
		const screenHeight: number = window.screen.height;

		const screenWidth: number = window.screen.width;
		const imageWidth: number = parseInt(args.width) || 800;

		const windowHeight: number = imageHeight < screenHeight ? imageHeight : screenHeight;
		const windowWidth: number = imageHeight < screenHeight ? imageWidth : imageWidth + 20;


		const topPosition: number = imageHeight < screenHeight ? (screenHeight - windowHeight) / 2 : 0;
		const leftPosition: number = (screenWidth - windowWidth) / 2;

		windowFeatures += `,width=${windowWidth},height=${windowHeight},left=${leftPosition},top=${topPosition}`;

		//windowFeatures += 'resizable=yes,scrollbars=yes,menubar=no';

		const imageWindow = window.open(args.src, 'image', windowFeatures);

		if (!imageWindow)
		{
			// The window wasn't allowed to open
			// This is likely caused by built-in popup blockers.
			return null;
		}

		// crossorigin policy return imageWindow;
	}



	/* click - KLIKNIĘCIE  NA STRONIE */
	document.body.addEventListener("click", async function (e: MouseEvent): Promise<boolean>
	{
		let target = e.target as HTMLElement;

		// OBRAZEK WE WPISIE/KOMENTARZU
		if (target.tagName === 'IMG' && target.classList.contains('entryImage'))
		{
			const entryImage = target;
			e.preventDefault();
			openImageURLInNewWindow({ src: entryImage.dataset.full, width: entryImage.dataset.width, height: entryImage.dataset.height });
			return true;
		}



		// PRZYCISK "ZAŁADUJ WIĘCEJ STARSZYCH WIADOMOŚCI"
		if (target.tagName === 'BUTTON' && target.classList.contains('loadOlderMessagesButton'))
		{
			e.preventDefault();

			const channelName = (target.closest(".channelFeed") as HTMLElement).dataset.channel; // nazwa kanalu z data-channel="heheszki"
			const ChannelObject = openedChannels.get(channelName);
			const loadOlderMessagesButton = target.closest("button.loadOlderMessagesButton") as HTMLButtonElement;

			if (dev) console.log(`Przycisk "Wczytaj starsze wiadomości na kanale" obecnie na kanale jest: [${ChannelObject.entries.size}] wpisów i [${ChannelObject.comments.size}] komentarzy `);

			// WCZYTANIE KOLEJNYCH 50 STARSZYCH WIADOMOŚCI
			if (loadOlderMessagesButton)
			{
				// wczytanie 50 starszych wpisów
				let olderEntriesArray = await api.getXNewestEntriesFromChannelFromPageHash(ChannelObject, ChannelObject.pagination.next, settings.fetch.numberOfEntries2ndPreload);
				if (olderEntriesArray.length > 0)
				{
					// dodanie starszych wpisów na listę
					ch.analyzeMessagesArrayAddNewItemsOrUpdateDataExistingMessages(ChannelObject, olderEntriesArray);

					// dla wczytanych starszych wpisów, wczytujemy komentarze
					for (let entryObject of olderEntriesArray)
					{
						if (entryObject.comments.count > 0)
						{
							await ch.checkAndInsertNewCommentsInEntry(ChannelObject, entryObject);
						}
					}
				}
				return true;
			}
			if (dev) console.log(`Przycisk "Wczytaj starsze wiadomości na kanale" po załadowaniu: [${ChannelObject.entries.size}] wpisów i [${ChannelObject.comments.size}] komentarzy `);
		}


		/* PRZYCISK YOUTUBE */
		if (settings.leftClickOnYouTubeLoadsToIframe && target.tagName === "A" && target.classList.contains("entryMediaEmbedYouTube"))
		{
			e.preventDefault();
			let embedVideoId = fn.getEmbedVideoIDCodeFromYouTubeURL((target as HTMLAnchorElement).href)
			if (embedVideoId && typeof embedVideoId === "string")
			{
				youtubeIframe.src = `https://www.youtube.com/embed/${embedVideoId}?autoplay=1&mute=0&start=0`;
			}
			return true;
		}


		// PRZYCISK "WYŚLIJ" - WYSYŁANIE WIADOMOŚCI
		if (settings.newMessageSendButton && target.tagName === 'BUTTON' && target.classList.contains('newMessageSendButton'))
		{
			const channelName = target.dataset.channel; 			// nazwa kanalu z data-channel="heheszki"
			const ChannelObject = openedChannels.get(channelName);
			const newMessageTextarea = target.previousElementSibling as HTMLElement;

			if (ChannelObject && newMessageTextarea)
			{
				e.preventDefault();
				await ch.executePostNewMessageToChannelFromTextarea(ChannelObject);
				return true;
			}
		}


		// PRZYCISK [+] DODAWANIE/ODEJMOWANIE PLUSA
		if (target.tagName === 'BUTTON' && target.classList.contains("plus"))
		{
			const channelName: string = (target.closest(".channelFeed") as HTMLElement).dataset.channel; // nazwa kanalu z data-channel="heheszki"
			const ChannelObject: T.Channel = openedChannels.get(channelName);
			const messageArticle: HTMLElement = target.closest(".messageArticle") as HTMLElement;
			const ratingBoxSection: HTMLElement = target.closest("section.rating-box") as HTMLElement;

			const messageTemplateForVoting: T.MessageTemplate = {
				resource: messageArticle.dataset.resource as T.Resource,
				id: parseInt(messageArticle.dataset.id),
				entry_id: parseInt(messageArticle.dataset.entryId)
			};

			let objectForVoting: T.Entry | T.Comment;
			if (messageTemplateForVoting.resource === "entry") objectForVoting = new T.Entry(messageTemplateForVoting);

			else if (messageTemplateForVoting.resource === "entry_comment")
			{
				messageTemplateForVoting.parent = { id: messageTemplateForVoting.entry_id };
				objectForVoting = new T.Comment(messageTemplateForVoting);
			}

			let upODdown: string = messageArticle.dataset.voted == "1" ? "down" : "up";

			// TODO dodać sprawdzenie aktualnej liczby plusow podczas glosowania
			const votedobj = await api.voteMessage(objectForVoting, upODdown);
			// console.log("await return: ", votedobj);

			let newVotesUpCount: number;
			if (upODdown == "up")
			{
				newVotesUpCount = parseInt(messageArticle.dataset.votesUp) + 1;
				target.classList.add("voted");
			}
			else
			{
				newVotesUpCount = parseInt(messageArticle.dataset.votesUp) - 1
				target.classList.remove("voted");
			}

			messageArticle.dataset.voted = fn.toggle01(messageArticle.dataset.voted) as string;
			messageArticle.dataset.votesUp = String(newVotesUpCount);
			messageArticle.style.setProperty('--votesUp', `"${newVotesUpCount}"`);	// var(--votesUp) = "12"

			if (messageTemplateForVoting.resource === "entry")
			{
				ChannelObject.entries.get(messageTemplateForVoting.id).votes.up = newVotesUpCount;
			}
			else
			{
				ChannelObject.comments.get(messageTemplateForVoting.id).votes.up = newVotesUpCount;
			}
			fn.innerText(`.${ChannelObject.name}_plusesCount`, String([...ChannelObject.entries.values(), ...ChannelObject.comments.values()].reduce((sum, obj) => sum + obj.votes.up, 0)));	// <div>Plusów: <var class="heheszki_plusesCount"></var></div>

			return true;
		}

		// PRZYCISK x ZAMYKANIA STATYSTYK KANAŁU (zmiana settings.css.main.channelStats)
		if (target.tagName === 'BUTTON' && target.classList.contains("channelStatsHideButton"))
		{
			setSettings("settings.css.main.channelStats", "hide");
			return;

		}
		// PRZYCISK x ZAMYKANIA STATYSTYK KANAŁU (zmiana settings.css.main.channelStats)
		if (target.tagName === 'BUTTON' && target.classList.contains("channelStatsShowButton"))
		{
			setSettings("settings.css.main.channelStats", "show");
			return;
		}

		// A.HREF.USERNAME > SPAN
		if (target.tagName === 'SPAN')
		{
			const target = e.target as HTMLElement;
			const usernameAHref = target.closest(`.username`) as HTMLElement;
			if (usernameAHref && usernameAHref.dataset.username)
			{
				e.preventDefault();
				return false;
			}
		}

		return false;
		// END "click" listener
	})




	/* --- KLAWIATURA --- */

	// CTRL+S -> keydown - prevent SAVE window on CTRL+S
	document.body.addEventListener("keydown", async function (e: KeyboardEvent)
	{
		// TYLKO CTRL+S  - prevent SAVE window
		const target = e.target as HTMLElement;
		if (e.ctrlKey && e.key == 's') e.preventDefault();
	});



	function ifCursorIsAfterUsernameRemoveUsernameElement()
	{
		const selection = window.getSelection();
		console.log("Selection: ", selection);
		if (!selection.rangeCount) return false;

		const range = selection.getRangeAt(0);
		if (range.commonAncestorContainer.parentElement.tagName === "SECTION") return false;
		if (range.commonAncestorContainer.nodeName === "#text" && range.commonAncestorContainer instanceof Text && String(range.commonAncestorContainer.data).startsWith("@") && range.commonAncestorContainer.parentElement.classList.contains("username_span"))
		{
			range.commonAncestorContainer.parentElement.remove();
			// if (dev)
			// {
			// 	console.log("range.commonAncestorContainer.parentElement.classList", range.commonAncestorContainer.parentElement.classList)
			// 	console.log("range.commonAncestorContainer.parentElement.classList.contains(username_span)", range.commonAncestorContainer.parentElement.classList.contains("username_span"))

			// 	console.log("range: ", range);
			// 	console.log("range.commonAncestorContainer: ", range.commonAncestorContainer);
			// 	console.log("range.commonAncestorContainer.nodeName: ", range.commonAncestorContainer.nodeName);
			// 	console.log("range.commonAncestorContainer.data: ", range.commonAncestorContainer.data);
			// }
		}
	}
	document.body.addEventListener('input', function (e: InputEvent)
	{
		if ((e.target as HTMLElement).classList.contains("newMessageTextarea") && e.inputType == "deleteContentBackward")
		{
			ifCursorIsAfterUsernameRemoveUsernameElement();
			// e.inputType // deleteContentBackward https://developer.mozilla.org/en-US/docs/Web/API/InputEvent/inputType
		}
	});

	document.body.addEventListener('compositionstart', function (e: CompositionEvent)
	{
		if ((e.target as HTMLElement).classList.contains("newMessageTextarea"))
		{
			// alert(`compositionstart | length: ${(e.target as HTMLElement).textContent.length} | e.inputType: ${e.data}`);
		}
	});
	document.body.addEventListener('compositionupdate', function (e: CompositionEvent)
	{
		if ((e.target as HTMLElement).classList.contains("newMessageTextarea"))
		{
			// alert(`compositionupdate | length: ${(e.target as HTMLElement).textContent.length} | e.inputType: ${e.data}`);
		}
	});
	document.body.addEventListener('keydown', function (e: InputEvent)
	{
		{
			// alert(`keydown | code: ${e.code} | isComposing: ${e.isComposing} | e.key: ${e.key} `);
		}
	});
	document.body.addEventListener('keyup', function (e: KeyboardEvent)
	{
		if ((e.target as HTMLElement).classList.contains("newMessageTextarea"))
		{
			// alert(`keyup | code: ${e.code} | isComposing: ${e.isComposing} | e.key: ${e.key} `);
		}
	});


	// https://developer.mozilla.org/en-US/docs/Web/API/VirtualKeyboard_API#control_the_virtual_keyboard_on_contenteditable_elements
	// https://developer.chrome.com/docs/web-platform/virtual-keyboard/

	/* keyup - PRZYCISKI NA KLAWIATURZE */
	/* WYSYLANIE NOWEJ WIADOMOSCI W TEXTAREA SKRÓTEM ENTER / CTRL+ENTER */
	document.body.addEventListener("keyup", async function (e: KeyboardEvent)
	{
		// alert(`keyup, e.key, [${e.key}]`);

		const target = e.target as HTMLElement;
		const newMessageTextareaContainer = target.closest(".newMessageTextareaContainer") as HTMLButtonElement;

		if (newMessageTextareaContainer && newMessageTextareaContainer.dataset)
		{
			const ChannelObject = openedChannels.get(newMessageTextareaContainer.dataset.channel);
			const newMessageTextarea = ChannelObject.elements.newMessageTextarea as HTMLButtonElement;

			if (newMessageTextarea)
			{
				if (newMessageTextarea.innerText === "\n")
				{
					newMessageTextarea.innerText = "";
				}

				// USUNIĘTO TREŚĆ A NIE JESTEŚMY W WIDOKU DYSKUSJI, USUWAMY TRYB ODPOWIADANIA 
				if (!ChannelObject.discussionViewEntryId && (newMessageTextarea.innerText === "" || newMessageTextarea.innerText === " ") && newMessageTextareaContainer.dataset.entryId)
				{
					ch.removeReplyEntryID(ChannelObject);
				}
				// NIE USUNIĘTO TREŚCI, SPRAWDZAMY FLAGI
				else
				{
					ch.setReplyEntryID(ChannelObject);
				}
			}

			// TYLKO CTRL+S ALBO CTRL+ENTER
			if (!e.ctrlKey || (e.key != 'Enter' && e.key != 's')) return false;
			// if (e.ctrlKey && e.key == 's') e.preventDefault();
			if (newMessageTextarea && newMessageTextarea.innerText.length > 1) // TODO sprawdzic czy dodany obrazek i dodać jako OR
			{
				if (
					(settings.editorSendHotkey.enter && e.key === 'Enter')
					|| (settings.editorSendHotkey.ctrl_enter && e.ctrlKey && e.key === 'Enter')
					|| (settings.editorSendHotkey.ctrl_s && e.ctrlKey && e.key === 's'))
				{
					// e.preventDefault();
					await ch.executePostNewMessageToChannelFromTextarea(ChannelObject);
					return true;
				}

				ch.fetch.fetchOnHold = 2;
			}
		}
	});




	// dbclick - DOUBLE CLICK - HIGHLIGHT - pokazuje wybraną DYSKUSJĘ po kliknięciu na wpis lub komentarz
	document.body.addEventListener('dblclick', function (e: MouseEvent)
	{
		if (settings.discussionView)
		{
			let target = e.target as HTMLElement;
			let messageArticle = target.closest(".messageArticle[data-entry-id]") as HTMLElement;
			if (messageArticle)
			{
				const ChannelObject = openedChannels.get(messageArticle.dataset.channel);
				const channelFeed = ChannelObject.elements.channelFeed;
				const MessageObject = messageArticle.dataset.resource === "entry" ? ChannelObject.entries.get(parseInt(messageArticle.dataset.id)) : ChannelObject.comments.get(parseInt(messageArticle.dataset.id));

				// USUWAMY DISCUSSION VIEW
				if (head.querySelector(`style[data-fn="discussionView"][data-channel="${ChannelObject.name}"]`))
				{
					fn.removeClass(`.channelFeed[data-channel="${ChannelObject.name}"] .messageArticle[data-entry-id="${MessageObject.entry_id}"].discussionView`, "discussionView");
					ch.discussionViewOFF(ChannelObject, MessageObject);
				}
				// DODAJEMY DISCUSSION VIEW
				else
				{
					messageArticle.classList.add("discussionView");
					ch.discussionViewON(ChannelObject, MessageObject);
				}
			}
		}
	});

});




// 		QR CODE
const showLoginQRCodeButton = document.getElementById("showLoginQRCode") as HTMLButtonElement;
const qrCodeContainer = document.getElementById("qrCodeContainer") as HTMLCanvasElement;
const qrCodeCanvas = document.getElementById("qrCodeCanvas") as HTMLCanvasElement;

qrCodeContainer.addEventListener("click", async function (e: MouseEvent)
{
	delete showLoginQRCodeButton.dataset.qrShown;
	qrCodeContainer.classList.remove("scaleInAnimation");
	qrCodeContainer.classList.add("scaleOutAnimation");
});

showLoginQRCodeButton.addEventListener("click", async function (e: MouseEvent)
{
	// e.stopPropagation();

	if (dev) console.log(e);

	if (showLoginQRCodeButton.dataset.qrShown == "true")
	{
		qrCodeContainer.classList.add("scaleOutAnimation");
		qrCodeContainer.classList.remove("scaleInAnimation");
		delete showLoginQRCodeButton.dataset.qrShown;

		if (dev) console.log(` ` + showLoginQRCodeButton.dataset.qrShown);
	}
	else
	{
		showLoginQRCodeButton.dataset.qrShown = "true";

		if (dev) console.log(showLoginQRCodeButton.dataset.qrShown);
		qrCodeContainer.classList.add("scaleInAnimation");
		qrCodeContainer.classList.remove("scaleOutAnimation");

		const QRC = qr.qrcodegen.QrCode;
		let qrText = `https://mikroczat.pl/login/`;

		if (login.tokensObject.refresh_token) qrText += `${login.tokensObject.refresh_token}/`;
		else if (login.tokensObject.token) qrText += `${login.tokensObject.token}/`;
		else return;

		if (activeChannels[0]) qrText += activeChannels[0].name;
		else if (activeChannels[1]) qrText += activeChannels[1].name;
		else qrText += "x_plus";

		const qr0 = QRC.encodeText(qrText, QRC.Ecc.MEDIUM);
		if (dev) console.log("qr0", qr0);
		drawQR(qr0, 10, 4, "rgb(255 255 255 / 0.5)", "rgb(0 0 0 / 1)", qrCodeCanvas);
	}
})




function drawQR(qrObject: any, scale: number, padding: number, lightColor: string, darkColor: string, canvas: HTMLCanvasElement)
{
	if (scale <= 0 || padding < 0)
		throw new RangeError("Value out of range");
	const width = (qrObject.size + padding * 2) * scale;
	canvas.width = width;
	canvas.height = width;
	let ctx = canvas.getContext("2d");
	for (let y = -padding; y < qrObject.size + padding; y++)
	{
		for (let x = -padding; x < qrObject.size + padding; x++)
		{
			ctx.fillStyle = qrObject.getModule(x, y) ? darkColor : lightColor;
			ctx.fillRect((x + padding) * scale, (y + padding) * scale, scale, scale);
		}
	}
}


(function applySettingsCSS()
{
	if (settings.css)
	{

		for (const id in settings.css)
		{
			const element = document.getElementById(id);

			if (element)
			{
				for (const prop in settings.css[id])
				{
					element.dataset[prop] = settings.css[id][prop];	// settings.css.chatArea.plusButtonShow = true -> <div id="chatArea" data-plus-button-show="true">
				}
			}
		}
	}
})();


