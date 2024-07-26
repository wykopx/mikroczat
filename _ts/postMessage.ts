declare let dev: boolean;

import * as db from './db.js';
import * as login from './login.js';
import * as api from './wykop_api.js';
import * as T from './types.js';
import * as fn from './fn.js';


export let wykopDomain = "https://wykop.pl";
export let wxDomain = "https://wykopx.pl";
export let mikroczatDomain = "https://mikroczat.pl";


export function transfer(data: any)
{
	// MESSAGE WYKOP.PL ABOUT OPENED CHANNEL
	if (!window.opener) return false;
	if (!data) return false;

	if (data.event)
	{
		switch (data.event) 
		{
			case "MikroCzatOpened":
				window.opener.postMessage('MikroCzatOpened', wykopDomain);
				break;
			case "MikroCzatLoggedIn":
				window.opener.postMessage('MikroCzatLoggedIn', wykopDomain);
				break;

			default:
				return false;
		}
		return true;
	}
}


// window.addEventListener('message', function (event)
// {
// 	if (event.origin !== '<other-domain>') return;
// 	var data = event.data;
// 	updateDatabase(data);
// }, false);


// window.opener.postMessage(db, '<other-domain>');


// function updateDatabase(data)
// {
// 	db.table('yourTable').put(data).then(function ()
// 	{
// 	}).catch(function (error)
// 	{
// 		console.error("Error: " + error);
// 	});
// }




// MESSAGES FROM WYKOP.PL
window.addEventListener('message', async function (event)
{
	if (dev && event.origin != "https://www.youtube.com")
	{
		console.log("event received", event);
		console.log("event.origin", event.origin);
		console.log("event.data", event.data);
	}

	if (event.origin !== wykopDomain || !event?.data?.type) return;

	await new Promise(resolve => setTimeout(resolve, 2000)); 	// fix double login async issue in await logIn();


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
	if (dev) console.log("mikroczatLoggedIn", login.mikroczatLoggedIn)

	if (!login.mikroczatLoggedIn) login.logIn();

}, false);


