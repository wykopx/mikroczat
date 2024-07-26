

// export const version: string = "3.0.17"; 
declare let dev: boolean;
import * as T from './types.js';
import { sounds, openedChannels, wykopDomain } from './index.js';
import * as api from './wykop_api.js';
import * as ch from './ch.js';
import * as CONST from './const.js';

import { settings, setSettings } from './settings.js';
import { notificationsStatus } from './wykop_notifications.js';

import { pl } from "../../node_modules/date-fns/locale.mjs";
import { parse } from "../../node_modules/date-fns/parse.mjs";
import { format } from "../../node_modules/date-fns/format.mjs";
import { sub } from "../../node_modules/date-fns/sub.mjs";
import { subDays } from "../../node_modules/date-fns/subDays.mjs";
import { parseJSON } from "../../node_modules/date-fns/parseJSON.mjs";
import { getUnixTime } from "../../node_modules/date-fns/getUnixTime.mjs";
import { formatDistance } from "../../node_modules/date-fns/formatDistance.mjs";
import * as index from './index.js';
import * as fn from './fn.js';
import { UAParser } from '../../node_modules/ua-parser-js/src/main/ua-parser.mjs';

declare var openChannelsFromURLArray: string[];


export const loginDialog = document.querySelector("#loginDialog") as HTMLDialogElement;
const loginInput = document.querySelector("#loginInput") as HTMLInputElement;
const loginAlertTokenSuccess = document.querySelector("#loginDialog #loggedInToken") as HTMLElement;
const loginAlertRefreshTokenSuccess = document.querySelector("#loginDialog #loggedInRefreshToken") as HTMLElement;
const loginAlertError = document.querySelector("#loginDialog .alert-error") as HTMLElement;

const showLoginDialogButton = document.querySelector("#showLoginDialogButton") as HTMLButtonElement;
const closeLoginDialogButton = document.querySelector("#closeLoginDialogButton") as HTMLButtonElement;
const loginAsGuestButton = document.querySelector("#loginAsGuestButton") as HTMLButtonElement;


let guestToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6Inc1Mzk0NzI0MDc0OCIsInVzZXItaXAiOiIxNTAzMDc2MjQxIiwicm9sZXMiOlsiUk9MRV9BUFAiXSwiYXBwLWtleSI6Inc1Mzk0NzI0MDc0OCIsImV4cCI6MTcxNDM3NzcyMH0.U09P9boLoorgaDze1izN0sLesBIvIWNCVWHA6z5qwsY";
let ua = UAParser(navigator.userAgent);
// if (dev) console.log(ua)


export let mikroczatLoggedIn = false;
export let mikroczatLoggedByWykopCzatButton = false;
export let loggedUser: T.User;
// loggedUser = new T.User("Gosc");


export let tokensObject: T.TokensObject = getTokenObjectFromLocalStorage(); // authObject w db.js node
if (dev) console.log("1. tokensObject: ", tokensObject);
if ((tokensObject.token || tokensObject.refresh_token))
{
	logIn();
}





// getTokenObjectFromLocalStorage() lub getTokenObjectFromLocalStorage("NadiaFrance")
export function getTokenObjectFromLocalStorage(username?: string): T.TokensObject
{
	const tokensObject: T.TokensObject = {
		token: localStorage.getItem('token') ?? null,
		refresh_token: localStorage.getItem('userKeep') ?? null
	};

	// if (tokensObject.token == null && tokensObject.refresh_token == null)
	// {
	// 	tokensObject.g_token = localStorage.getItem('g_token');
	// }

	if (dev) console.log(`getTokenObjectFromLocalStorage() -> tokensObject: `, tokensObject)

	return tokensObject;
}

export function processLoginData(pastedData: string)
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

	let tokensObject = api.saveTokenInLocalStorage({ tokenValue: pastedData });
	if (tokensObject !== false)
	{
		fn.hide(loginAlertError);

		if ('refresh_token' in tokensObject)
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

export async function logIn(): Promise<boolean | any>
{
	if (dev) console.log(`🔑 logIn()`);

	if (tokensObject.refresh_token)
	{
		let newTokensObject: T.TokensObject | boolean = await api.refreshTokenFromAPI();
		if (dev) console.log(`🔑 logIn() | newTokensObject: `, newTokensObject);
		if (newTokensObject !== false && (newTokensObject as T.TokensObject).token)
		{
			if (typeof newTokensObject === 'object' && 'token' in newTokensObject) 
			{
				tokensObject.token = newTokensObject.token;
			}
		}
	}

	if (dev) console.log(`🔑 logIn() | tokensObject.token: `, tokensObject.token);
	if (dev) console.log(`🔑 logIn() | mikroczatLoggedIn: `, mikroczatLoggedIn);


	if (!tokensObject.token) tokensObject = getTokenObjectFromLocalStorage();
	if (!mikroczatLoggedIn) await api.refreshTokenFromAPI();

	await fetch(`${CONST.apiPrefixURL}/profile/short`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			Authorization: "Bearer " + window.localStorage.getItem("token"),
		},
	})
		.then(async (response) =>
		{
			if (dev) console.log("logIn() > response from", response);

			// nieaktualny token
			if (!response.ok)
			{
				/*
					
				Error:
				{
					"code": 403,
					"hash": "",
					"error":
					{
						"message": "Access Denied.",
						"key": 0
					}
				}
				*/


				mikroczatLoggedIn = false;
				if (dev) console.log(`Problem z logowaniem: ${response.status}`);
				await api.refreshTokenFromAPI();

				return new Promise(async (resolve, reject) =>
				{

					await fetch("https://wykop.pl/api/v3/profile/users/WykopX/short",
						{
							method: "GET",
							headers: {
								"Content-Type": "application/json",
								Authorization: "Bearer " + guestToken,
							},
						})
						.then((response) =>
						{
							if (dev) console.log("response", response)
							if (!response.ok)
							{
								if (dev) console.log("HTTP error! status: ${response.status}");
								throw new Error(`HTTP error! status: ${response.status}`);
							}
							return response.json();
						})
						.then((responseJSON) =>
						{
							// if(dev) console.log(`🟢🟢🟢 responseJSON - tags/${ChannelObject.name}/stream`)
							if (dev) console.log(responseJSON.data)
							resolve({ username: "Gość" });
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
			return response.json();
		})
		.then((responseJSON) =>
		{
			if (dev) console.log("🟢🟢🟢 responseJSON - api/v3/profile/short")
			if (dev) console.log(responseJSON)
			let user = responseJSON.data;
			loggedUser = user;

			if (dev) console.log(`user: ${user.username}`, user);
			if (dev) console.log(`loggedUser: ${loggedUser.username}`, loggedUser);

			window.localStorage.setItem("username", loggedUser.username);
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
			}
			else
			{
				console.error('Other error:', error);
			}
		});
}



export async function loginAsGuest(): Promise<boolean>
{
	tokensObject = await api.getGuestToken();

	confirmLoggedIn();
	return true;
}

export async function confirmLoggedIn()
{
	if (dev) console.log(`confirmLoggedIn()`)
	if (dev) console.log("loggedUser:", loggedUser)

	mikroczatLoggedIn = true;

	loginDialog.close();

	if (settings.sounds.logged_in && navigator?.userActivation?.hasBeenActive) sounds.logged_in.play();

	fn.hide("#loginAsGuestButton");
	fn.hide("#showLoginDialogButton");

	if (loggedUser?.username != "Gość")
	{
		fn.show("#logOutButton");
		fn.show("#showLoginQRCode");
		window.localStorage.removeItem("guestMode");
		fn.innerHTML("loggedUser.username", loggedUser.username)

		document.querySelectorAll("a.loggedInHref").forEach((el: HTMLAnchorElement) =>
		{
			el.href = 'https://go.wykopx.pl/@${user.username}';
			el.classList.add(`${loggedUser.status}`, `${loggedUser.color}-profile`, `${loggedUser.gender}-gender`); // "active/banned/suspended, "orange-profile", "m-gender/f-gender/null-gender";
		});
	}








	// MESSAGE WYKOP.PL ABOUT OPENED CHANNEL
	if (window.opener)
	{
		if (dev) console.log("Sending message to main wykop.pl tab")
		window.opener.postMessage('MikroCzatLoggedIn', wykopDomain);
	}


	// if(dev) console.log("openChannelsFromURLArray", openChannelsFromURLArray);
	if (openChannelsFromURLArray.length > 0)
	{
		for (const channelName of openChannelsFromURLArray)
		{
			const newTag = new T.Tag(channelName);
			const newChannel = new T.Channel(newTag);

			openedChannels.set(channelName.replaceAll(/_+$/g, ""), newChannel); // usuwamy w nazwie __ 
		}
	}

	if (openedChannels.size > 0)
	{
		if (dev) console.log("💜 openedChannels: ", openedChannels);

		for (let [, ChannelObject] of openedChannels)
		{
			if (ChannelObject && ChannelObject.nameUnderscore && ChannelObject.nameUnderscore.length > 0)
			{
				ch.openNewChannel(ChannelObject);
				await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1s pomiedzy otwieraniem kilku kanalow na raz\

				ch.activateChannel(ChannelObject);

				// if(dev) console.log('⌛ Promise delay: 4 sekundy');
				await new Promise(resolve => setTimeout(resolve, 4000)); // wait 1s pomiedzy otwieraniem kilku kanalow na raz
			}
		}
	}


	while (true)
	{
		await new Promise(resolve => setTimeout(resolve, settings.refreshIntervals.notificationsCheck));
		notificationsStatus.refreshAPI();
	}


}





// communication with opener window
if (window.opener)
{
	window.opener.postMessage('MikroCzatOpened', 'https://wykop.pl');
}

// MESSAGES FROM WYKOP.PL
window.addEventListener('message', function (event)
{
	// if (dev) console.log("event received", event);
	// if (dev) console.log("event.origin", event.origin);
	// if (dev) console.log("event.data", event.data);

	if (event.origin !== wykopDomain || !event?.data?.type) return;

	switch (event.data.type)
	{
		case "TokensObject":
			if (event.data.userKeep) 
			{
				api.saveTokenInLocalStorage({ tokenValue: event.data.userKeep, tokenType: "userKeep" } as T.TokensObject);

				// if (event.data.token) 
				// {
				// 	api.saveTokenInLocalStorage({ tokenValue: event.data.token, tokenType: "g_token" } as T.TokensObject);
				// }
			}
			else if (event.data.token)
			{
				api.saveTokenInLocalStorage({ tokenValue: event.data.token, tokenType: "token" } as T.TokensObject);
			}
			break;
		case "token":
			if (event.data.token) 
			{
				api.saveTokenInLocalStorage({ tokenValue: event.data.token, tokenType: "token" } as T.TokensObject);
			}
			break;
		case "userKeep":
			if (event.data.userKeep) 
			{
				api.saveTokenInLocalStorage({ tokenValue: event.data.userKeep, tokenType: "userKeep" } as T.TokensObject);
			}
			break;
		case "nightMode":
			fn.toggleNightMode(event.data.value);
			break;
		default:
			return false;
	}

	if (dev) console.log(`received '${event.data.type}'  from wykop.pl: `, event.data.value);
	if (dev) console.log("window.opener", window.opener)

	if (!mikroczatLoggedIn) logIn();

}, false);




// BUTTONS
window.logout = function ()
{
	tokensObject = null;
	fn.show("#showLoginDialogButton");
	fn.show("#loginAsGuestButton");
	fn.hide("#logOutButton");
	window.sessionStorage.setItem("mikroczatLoggedOut", "true");
	window.localStorage.removeItem("token")
	window.localStorage.removeItem("userKeep");

	if (settings.sounds.logged_out && navigator?.userActivation?.hasBeenActive) sounds.logged_out.play();

	alert("Wylogowano z MikroCzatu");

	if (mikroczatLoggedByWykopCzatButton) window.close();
	else window.location.reload();
}



// okno logowania 2s po otwarciu strony
document.addEventListener('DOMContentLoaded', (DOMContentLoadedEvent) =>
{
	setTimeout(function ()
	{
		if (!mikroczatLoggedIn || openChannelsFromURLArray.length == 0)
		{
			index.chooseChannelDialog.showModal();
		}
	}, 1000);

	setTimeout(function ()
	{
		if (!dev) console.clear();

		if (mikroczatLoggedIn && loggedUser && loggedUser.username) console.log(`Witaj ${loggedUser.username}, życzę miłego mirkowania na mikro𝗰𝘇𝗮𝗰𝗶𝗲 ( ͡° ͜ʖ ͡°)  `);
		else console.log(`Witaj Mireczku lub Mirabelko, życzę miłego mirkowania na mikro𝗰𝘇𝗮𝗰𝗶𝗲 ( ͡° ͜ʖ ͡°)  `);
		console.log(" ");

		if (!mikroczatLoggedIn)
		{

			if (!mikroczatLoggedIn)
			{
				loginDialog.showModal();
				console.log("Jeśli chcesz się zalogować wykonaj następujące kroki:");
				console.log(" ");

				console.log("LOGOWANIE - SPOSÓB 1");
				console.log("1. Zainstaluj rozszerzenie Tampermonkey:");

				if (ua.browser.is("firefox")) console.log(`https://addons.mozilla.org/pl/firefox/addon/tampermonkey/`);
				else if (ua.browser.is("safari")) console.log(`https://apps.apple.com/pl/app/tampermonkey/id1482490089`);
				else if (ua.browser.is("opera")) console.log(`https://addons.opera.com/pl/extensions/details/tampermonkey-beta/`);
				else if (ua.browser.is("edge")) console.log(`https://microsoftedge.microsoft.com/addons/detail/iikmkjmpaadaobahmlepeloendndfphd`);
				else console.log(`https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo`);


				console.log(`2. Zainstaluj skrypt Mikroczat, który doda przycisk "Czat" na górnej belce Wykopu`);
				console.log(`https://greasyfork.org/pl/scripts/489949-mikroczat`);
				console.log(`3. Otwórz stronę https://wykop.pl`);
				console.log(`4. Kliknij w nowy przycisk "Czat" - lewym lub prawym przyciskiem myszy`);
				console.log(`5. Otworzy się Mikroczat automatycznie zalogowany na Twoje konto`);
				console.log(" ");

				console.log("LOGOWANIE - SPOSÓB 2");
				console.log("1. Otwórz stronę https://wykop.pl i zaloguj się na swoje konto");

				if (ua.browser.is("opera")) console.log("2. Otwórz narzędzia deweloperskie tak jak zrobiłeś/aś to tutaj. Możesz użyć skrótu klawiszy [CTRL] + [SHIFT] + [J]");
				else console.log("2. Otwórz narzędzia deweloperskie tak jak zrobiłeś/aś to tutaj. Możesz użyć klawisza [F12] albo [CTRL] + [SHIFT] + [J]");

				if (ua.browser.is("firefox"))
				{
					if (navigator.language.startsWith("pl"))
					{
						console.log(`3. Przejdź na kartę "Dane"`);
						console.log(`4. Wybierz "Lokalna pamięć"`);
						console.log(`5. Znajdź na liście https://wykop.pl`)
						console.log(`6. W okienku "Filtruj elementy" wpisz: userKeep`)
					}
					else
					{
						console.log(`3. Przejdź na kartę "Storage"`);
						console.log(`4. Wybierz "Local Storage"`);
						console.log(`5. Znajdź na liście https://wykop.pl`)
						console.log(`6. W okienku "Filter Items" wpisz: userKeep`)
					}
				}

				else if (ua.browser.is("edge"))
				{
					console.log(`3. Przejdź na kartę "Application"`);
					console.log(`4. W sekcji "Storage" wybierz "Local storage"`);
					console.log(`5. Znajdź na liście https://wykop.pl`)
					console.log(`6. W okienku "Filter" wpisz userKeep`)
				}

				else if (navigator.language.startsWith("pl"))
				{
					console.log(`3. Przejdź na kartę "Aplikacja"`);
					console.log(`4. W sekcji "Pamięć" wybierz "Pamięć lokalna"`);
					console.log(`5. Znajdź na liście https://wykop.pl`)
					console.log(`6. W okienku "Filtr" wpisz userKeep`)
				}
				else
				{
					console.log(`3. Przejdź na kartę "Application"`);
					console.log(`4. W sekcji "Storage" wybierz "Local storage"`);
					console.log(`5. Znajdź na liście https://wykop.pl`)
					console.log(`6. W okienku "Filter" wpisz userKeep`)
				}

				console.log(`7. Skopiuj tekst składający się z ciągu 64 liter i cyfr`)
				console.log(`8. Wróć na mikroczat.pl i wklej skopiowany tekst do okienka logowania. Mikroczat natychmiast zaloguje Cię na Twoje konto`)
				console.log(" ");
				console.log(`W każdej chwili możesz usunąć zapisany token klikając na przycisk "Wyloguj"`);

			}

		}
	}, 2000);

	// przycisk zaloguj
	showLoginDialogButton?.addEventListener("click", () =>
	{
		loginDialog.showModal();
	});

	loginAsGuestButton?.addEventListener("click", () =>
	{
		loginAsGuest();
	});
	// przycisk zamknij okno logowania
	closeLoginDialogButton?.addEventListener("click", async () =>
	{
		if (processLoginData((loginInput as HTMLInputElement).value))
		{
			if (await logIn() != false)
			{
				loginDialog.close();
			}
		}
		else
		{
			loginDialog.close();
		}

		// window.location.reload();
	});


	// wklejanie tokenów w oknie logowania
	if (loginInput)
	{
		loginInput.addEventListener("paste", (event: ClipboardEvent) =>
		{
			if (dev) console.log(event);
			if (dev) console.log("event: paste | event.target.value:", (event.target as HTMLInputElement).value);
			if (processLoginData((event.target as HTMLInputElement).value)) logIn();

		})
		loginInput.addEventListener("change", (event) =>
		{
			if (dev) console.log(event);
			if (dev) console.log("event: paste | event.target.value:", (event.target as HTMLInputElement).value);
			if (processLoginData((event.target as HTMLInputElement).value)) logIn();
		})
		loginInput.addEventListener("input", (event) =>
		{
			if (dev) console.log(event);
			if (dev) console.log("event: paste | event.target.value:", (event.target as HTMLInputElement).value);
			if (processLoginData((event.target as HTMLInputElement).value)) logIn();
		})
	}
});


