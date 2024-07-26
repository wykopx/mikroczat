// import { dev } from './index.js';
declare let dev: boolean;
import * as index from './index.js';
import * as T from './types.js';
import { settings, setSettings } from './settings.js';

import { loggedUser } from './login.js';


export function markdownNewLineToBR(text: string, EntryObject: T.Entry): string
{
	return text.replace(/\n/g, '<br/>'); // Replace newline characters with <br>
}
export function replaceAngleBrackets(text: string, EntryObject: T.Entry): string
{
	return text.replace(/</g, '&lt;');
	// return text.replace(/</g, '&lt;').replace(/>/g, '&gt;'); 
}

export function markdownTextToSPAN(text: string, EntryObject: T.Entry): string
{
	/*
		- zamienia każdy fragment tekstu, który nie jest jeszcze w żadnym elemencie na <span>text</span>
	*/
	// return text.replace(/(^|>)([^<]+)(<|$)/g, '$1<span>$2</span>$3');	// zamienia każdy fragment, także <abbr>text</abbr> na <abbr><span>text</span></abbr>

	let parser: DOMParser = new DOMParser();
	let doc: Document = parser.parseFromString(text, 'text/html');
	let nodes: NodeListOf<ChildNode> = doc.body.childNodes;
	for (let i = 0; i < nodes.length; i++)
	{
		let node: ChildNode = nodes[i];

		// If the node is a text node and not only whitespace
		if (node.nodeType === Node.TEXT_NODE && /\S/.test(node.nodeValue || ''))
		{
			// Replace the text node with a new span element containing the text node
			let span: HTMLSpanElement = doc.createElement('span');
			span.appendChild(node.cloneNode());
			node.parentNode?.replaceChild(span, node);
		}
	}

	text = doc.body.innerHTML;
	return text;
}

export function markdownAsteriskToSTRONG(text: string, EntryObject: T.Entry): string
{
	/* 
		- zamienia tekst **przyklad** na <strong>przyklad</strong>
				- zaczyna się od whitespace \s lub nowej lini ^ lub elementu np. <i>
		- otwierany przez dwa ** lub jeden * (ktory nie poprzedza spacji lub liczby np. 2 * 2 = 4
		- dowolny ciag znakow bez *
		- zamykany przez jeden * lub dwa ** po ktorych jest spacja, nowa linia lub .,;<
	*/
	return text.replace(/(^|\s|>|_)(\*\*|\*(?=[^\s\d]))([^*]+)(\*|\*\*)(<|_|,|;|\.|\s|$)/g, '$1<strong>$3</strong>$5');
}



export function markdownUnderscoreToITALICS(text: string, EntryObject: T.Entry): string
{
	// if(dev) console.log(`markdownUnderscoreToITALICS,  text:`)
	// if(dev) console.log(text)

	/*
		- zamienia tekst __przyklad__ na <i>przyklad</i>
		- zaczyna się od whitespace \s lub nowej lini ^
		- otwierany przez dwa __ lub jeden _
		- dowolny ciag znakow bez _
		- zamykany przez jeden _ lub dwa __ po ktorych jest spacja, nowa linia lub .,;
		- nie zamienia podkreslen wewnatrz slow np.: file_.jpg ani _file.jpg
	*/
	return text.replace(/(^|\s|>|\*)(_|__)([^_]+)(_|__)(<|\*|,|;|\.|\s|$)/g, '$1<i>$3</i>$5');
}

export function markdownBacktickToCODE(text: string, EntryObject: T.Entry): string 
{
	/*
		- zamienia tekst ```przyklad``` na <code>przyklad</code>
		- zaczyna się od dowolnego znaku, ktory nie jest `
		- otwierany przez jeden ` dwa `` lub trzy ```
		- dowolny ciag znakow bez `
		- zamykany przez przez jeden ` dwa `` lub trzy ``` po ktorych jest dowolny znak oprócz `
	*/
	//return text.replace(/(\s|^|\n|\r)(```|``|`)([^`]+)(```|``|`)(.)/g, '$1<code>$3</code>$5');
	return text.replace(/([^`])(`|``|```|````)([^`]+)(`|``|```|````)([^`]|$)/g, '$1<code>$3</code>$5');
}


export function markdownUsernameToABBR(text: string, EntryObject: T.Entry): string
{
	/*
	- wykrywa tekst @NadiaFrance rozpoczynający się od @ na początku
	- przed @ nie moze byc zadnego tekstu (\B) tylko znaki lub whitespaces
	- username moze skladac sie z - i _
	- jesli na koncu jest : usuwa go calkowicie
	*/
	return text.replace(/(\B)@([\w-_]+):?/g, function (wholeMatch, textInFront, username)
	{
		if (username === loggedUser.username)
		{
			return `${textInFront}<abbr class="at">@</abbr><abbr data-username="${username}" data-channel="${EntryObject.channel.name}" class="username mentions-you">${username}</abbr>`;	 // wolaja Ciebie
		}
		else
		{
			return `${textInFront}<abbr class="at">@</abbr><abbr data-username="${username}" data-channel="${EntryObject.channel.name}" class="username">${username}</abbr>`;	// wołany jest inny użytkownik
		}
	});
}


export function markdownExclamationMarkToSPOILER(text: string, EntryObject: T.Entry): string
{
	/*
	- wykrywa tekst spoilera rozpoczynający się od ! na początku
	- \s* oznacza ewentualne spacje przed !
	- /gm oznacza multiline, wtedy ^ oznacza poczatek linijki, a $ koniec linijki a nie calego stringa
	*/
	return text.replace(/^\s*!(.*)$/gm, '<span class="content-spoiler">$1</span>');
}

export function markdownGtToBLOCKQUOTE(text: string, EntryObject: T.Entry): string
{
	/*
	- wykrywa tekst cytatu rozpoczynający się od > lub wielokrotnosci np.:  >>> cytat
	*/
	return text.replace(/^\s*(>+)(.*)?$/gm, '<blockquote>$2</blockquote>');
	// return text.replace(/^\s*(>+)(.*)$/gm, '<blockquote>$2</blockquote>');
}





export function markdownTagsToANCHOR(text: string, EntryObject: T.Entry): string
{
	/*
		- wykrywa tekst #heheszki i zamienia go w link do nowego kanału czata
	*/
	// return text.replace(/(\B)#([a-zA-Z0-9]+)/g, `<a class="href_channel" href="/chat/$2" target="_blank">#$2</a>`);

	return text.replace(/(\B)#([a-zA-Z0-9]+)/g, function (wholeMatch, textInFront, tag)
	{
		if (tag === EntryObject.channel.name)
		{
			return `${textInFront}<a class="href_channel currentChannel" href="/chat/${tag}" tabindex="-1">#${tag}</a>`;	 // wolaja Ciebie
		}
		else
		{
			return `${textInFront}<a class="href_channel" href="/chat/${tag}" target="_blank" tabindex="-1" title='Otwórz kanał "#${tag}" w nowym oknie MikroCzata'>#${tag}</a>`;	// wołany jest inny użytkownik
		}
	});
}


export function return_HTTPS_URL_Array(content: string)
{
	/*
		- wykrywa każdy string z http lub https
		- zwraca URL aż do wp.pl" wp.pl) wp.pl] lub whitespace
	*/
	const regex = /(http\S+)(?=(["|'|\)|\]|\s|\$]|$|\b))/g;
	const matches = content.matchAll(regex);
	return Array.from(matches, url => url[1]);
}

export function return_only_youtube_URLS_Array(urlsArray: string[])
{
	const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
	return urlsArray.filter(url => regExp.test(url));
}

export function return_only_youtube_EMBEDS_Array(urlsArray: string[]): (string)[]
{
	return urlsArray.map(url => getEmbedVideoIDCodeFromYouTubeURL(url)).filter(Boolean) as string[];
}

export function getEmbedVideoIDCodeFromYouTubeURL(url: string): string
{
	const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=|shorts\/)([^#\&\?]*).*/;
	const match = url.match(regExp);

	if (match && match[2].length === 11)
	{
		const videoID = match[2];
		return videoID;
	}
	else
	{
		return null;
	}
}

export function parse_HTTP_URLS_to_ANCHOR(content: string, EntryObject: T.Entry): string
{
	let modifiedContent = content;
	/*
		- wykrywa każdy string z http lub https
		- musi być poprzedzony spacją lub poczatkiem wiersza
		- musi kończyć się spacją lub końcem wiersza
		- zamienia go w klikalny link <a href=""
		- nie przetwarza juz istniejących adresów <a href="" w treści
		- nie przetwarza urli markdown [test](http://test.pl)
	*/
	modifiedContent = modifiedContent.replace(/(?:\s|^)(https?\S+)(?=\s|$)/g, (word) =>
	{
		return `<a class="href_external" href="${word}" target="mikroczat_opened">${word}</a>`;
	});

	return modifiedContent;
}

export function adds_HTTPS_to_all_non_HTTPS_URLS(content: string): string
{
	/*
		- zamienia w treści wszystkie URL bez http i https na posiadające https://
		- [\w] zaczyna się od litery lub cyfry w domenie
		- [\w\.-] posiada litery, cyfry lub - i . w subdomenach
		- \.[a-zA-Z][a-zA-Z0-9]{1,23}) - domena np. .pl zaczyna sie od litery, minimum 2 znaki maks, 24 znaki
		- (\/[^\s]*)? --> URL path do pierwszej spacji
	*/
	return content.replace(/\S+(?!\b\1\b)/g, (word) =>
	{
		if (/^([\w][\w\.-]*\.[a-zA-Z][a-zA-Z0-9]{1,23})(\/[^\s]*)?$/.test(word))
		{
			return "https://" + word;
		}
		return word;
	});
}





export function xxx__old__parseURLToANCHOR(text: string, EntryObject: T.Entry): string
{
	/*
		- wykrywa każdy url także bez http albo www np.: google.com
		- zamienia go w klikalny link <a href=""
		- nie przetwarza juz istniejących adresów <a href="" w treści
	*/
	// regex wykrywający każdy URL w treści: text.replace(/((http(s*):\/\/)*[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))/g, '<a href="$1" target="mikroczat_opened">$1</a>');

	// Split the text by <a> tags
	let parts = text.split(/(<a[^>]*>.*?<\/a>)/g);

	// Apply the URL replacement only to parts outside the <a> tags
	for (let i = 0; i < parts.length; i++)
	{
		if (!parts[i].startsWith('<a'))
		{
			parts[i] = parts[i].replace(/((http(s*):\/\/)*[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#,?&//=]*))/g, '<a class="href_external" href="$1" target="mikroczat_opened">$1</a>');
		}
	}

	// Join the parts back together
	return parts.join('');
}



export function markdownToANCHOR(text: string, EntryObject: T.Entry): string
{
	/*
		- zamienia [Opis odnośnika][http://wp.pl] na odnośnik a href
		- dziala takze dla niepelnych linkow np [wp](www.wp.pl) dodając https://
		- usuwa niepotrzebne spacje np. [wp](   wp.pl   ) 
		- jesli w () nie podano prawidlowego linka zwraca tekst ktory byl na wejsciu
	*/
	// return text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="mikroczat_opened">$1</a>');

	return text.replace(/\[(.*?)\]\((.*?)\)/g, function (_, text, url)
	{
		url = url.replace(/\s/g, '');	// usuwanie spacji z url

		if (!/^https?:\/\//i.test(url))
		{
			url = 'https://' + url;
		}

		try
		{
			let newUrl = new URL(url);
			return '<a class="href_external" href="' + url + '" target="mikroczat_opened">' + text + '</a>';
		} catch (e)
		{
			// If the URL is invalid, return the original text
			return _;
		}
	});
}


export function show(element: Element | Element[] | string)
{
	if (dev) console.log(`show() | el: `, element);

	returnElementsArray(element).forEach((el: Element) =>
	{
		el.classList.add("show");
		el.classList.remove("hidden");
	});
}
export function hide(element: Element | Element[] | string)
{
	if (dev) console.log(`hide() | el: `, element);

	returnElementsArray(element).forEach((el: Element) =>
	{
		el.classList.remove("show");
		el.classList.add("hidden");
	});
}

export function isAlphanumeric(text: string): boolean
{
	const regex = /^[a-z0-9]*$/i;
	return regex.test(text);
}
export function isAlphanumericDotHyphenUnderscore(text: string): boolean
{
	const regex = /^[a-z0-9._-]*$/i;
	return regex.test(text);
}

export function innerHTML(el: Element | Element[] | string, html: string)
{
	returnElementsArray(el).forEach((el) =>
	{
		el.innerHTML = html;
	});
}
export function innerText(el: Element | Element[] | string, text: string)
{
	returnElementsArray(el).forEach((el) =>
	{
		el.innerText = text;
	});
}

export function addClass(el: Element | Element[] | string, classArray: string | string[])
{
	returnElementsArray(el).forEach((el) =>
	{
		if (Array.isArray(classArray))
		{
			el.classList.add(...classArray);
		}
		else
		{
			el.classList.add(classArray);
		}
	});
}

export function removeClass(el: Element | Element[] | string, classArray: string | string[])
{
	returnElementsArray(el).forEach((el) =>
	{
		if (Array.isArray(classArray))
		{
			el.classList.remove(...classArray);
		}
		else
		{
			el.classList.remove(classArray);
		}
	});
}

function returnElementsArray(elementOrSelector: Element | Element[] | string)
{
	if (typeof elementOrSelector === "string")
	{
		return document.querySelectorAll(elementOrSelector);
	}
	else if (Array.isArray(elementOrSelector) && elementOrSelector.every(item => item instanceof Element))
	{
		return elementOrSelector;
	}
	else if (!Array.isArray(elementOrSelector) && elementOrSelector.nodeType === Node.ELEMENT_NODE)
	{
		return [elementOrSelector];
	}
}



// -- HELPER FUNCTIONS

// DEV RUN WITH DELAY
function runWithDelay(time, f)
{
	setTimeout(function ()
	{
		f();
	}, time);
}


// PRZEŁĄCZNIKI NOWEJ WIADOMOŚCI
// from example: -a -b --id=123123 --word --f +g +h /i example -x text -y
// returns array and string in array: [["a", "b", "id=123123", "word", "f", "g", "h", "i"], "example -x text -y"]
// CONST.forceNewEntryFlagsArray = ["w", "n", "W", "N"];
export function getPrefixedFlagsArray(messageContent: string): [string[], string]
{
	// This regex matches words after -, --, +, or / at the beginning of the string
	const regex = /^([\-+\/]\S*\s*)+/;
	const match = messageContent.match(regex);

	if (!match) return [[], messageContent];

	// Split the matched flags and remove any empty strings
	const flagsArray = match[0].split(/\s+/).filter(str => str !== "").map(part => part.replace(/^[-+\/]+/, ''));

	// Get the remaining part of the messageContent after removing the matched flags
	const remainingMessage = messageContent.slice(match[0].length).trim();

	return [flagsArray, remainingMessage];
}



// zwraca true, jeśli w tablicy jest chociaż jeden z elementów
// checkArrayForValues(["a", "b", "w", "s"], ["w", "g"]) => true
export function areSomeValuesInArray(array: string[], values: string[]): boolean
{
	return values.some(value => array.includes(value));
}




// zwraca unikalny kolor na podstawie id 
export function messageIDtoHexColor(id: number, lightOrDark: string = "dark", HEXorRGBorRGBA = "hex", alpha: number = 1): string
{
	id = id * 2654435761 % Math.pow(2, 32);	// hash by prime
	let color: string;

	let rgbRed: number = id & 255;
	let rgbGreen: number = (id >> 8) & 255;
	let rgbBlue: number = (id >> 16) & 255;
	const luminance: number = 0.299 * rgbRed + 0.587 * rgbGreen + 0.114 * rgbBlue;
	if (luminance < 128 && lightOrDark === "light")
	{
		rgbRed = 255 - rgbRed;
		rgbGreen = 255 - rgbGreen;
		rgbBlue = 255 - rgbBlue;
	}
	else if (luminance > 128 && lightOrDark === "dark")
	{
		rgbRed = Math.floor(rgbRed / 2);
		rgbGreen = Math.floor(rgbGreen / 2);
		rgbBlue = Math.floor(rgbBlue / 2);
	}
	if (HEXorRGBorRGBA.toLowerCase() == "hex")
	{
		const hexRed: string = rgbRed.toString(16).padStart(2, '0');
		const hexGreen: string = rgbGreen.toString(16).padStart(2, '0');
		const hexBlue: string = rgbBlue.toString(16).padStart(2, '0');
		color = '#' + hexRed + hexGreen + hexBlue;
	}
	else if (HEXorRGBorRGBA.toLowerCase().startsWith("rgb"))
	{
		color = HEXorRGBorRGBA == "rgba" ? `rgba(${rgbRed} ${rgbGreen} ${rgbBlue} / ${alpha})` : `rgb(${rgbRed} ${rgbGreen} ${rgbBlue})`
	}

	return color;
}



// przełącza wartość object property from 0 to 1 and from "0" to "1" and vice versa
export function toggle01(property: string | number | undefined): string | number
{
	if (property === undefined)
	{
		return 1;
	}
	else if (typeof property === 'string')
	{
		return property === "1" ? "0" : "1";
	}
	else if (typeof property === 'number')
	{
		return property === 1 ? 0 : 1;
	}
}

// isValidDate("2023-01-01 23:44:44") -> true
// isValidDate("abc") -> false
export function isValidDate(dateString: string)
{
	return !isNaN(Date.parse(dateString));
}



// generateImageVariants("https://wykop.pl/cdn/c3201142/05ce90b751be02497ab64f2fa8dd6b715a1d0df9114ad93e878ed3449c4505b8.gif");
/*
returns:
variants = {
	src: "https://wykop.pl/cdn/c3201142/05ce90b751be02497ab64f2fa8dd6b715a1d0df9114ad93e878ed3449c4505b8.gif",
	300: "https://wykop.pl/cdn/c3201142/05ce90b751be02497ab64f2fa8dd6b715a1d0df9114ad93e878ed3449c4505b8,w300.gif",
	400: "https://wykop.pl/cdn/c3201142/05ce90b751be02497ab64f2fa8dd6b715a1d0df9114ad93e878ed3449c4505b8,w400.gif",
	800: "https://wykop.pl/cdn/c3201142/05ce90b751be02497ab64f2fa8dd6b715a1d0df9114ad93e878ed3449c4505b8,w800.gif"
}


*/
export function generateImageVariantsObject(url: string): Record<string, string>
{
	url = url.split('?')[0];
	const fileExtension = url.split('.').pop(); // file extension (e.g., .gif, .png, .jpg, .webp)
	const baseUrl = url.replace(`.${fileExtension}`, '');
	const variants: Record<string, string> =
	{
		"src": url,
		300: `${baseUrl},w300.${fileExtension}`,
		400: `${baseUrl},w400.${fileExtension}`,
		800: `${baseUrl},w800.${fileExtension}`,
	};

	return variants;
}



export function removeBlacklistWords(text: string, blacklist: string[]): string
{
	if (text)
	{
		if (blacklist && blacklist.length > 0)
		{
			blacklist.forEach((word) =>
			{
				text = text.split(word).join('');
			});
		}
		return text;
	}

}



// fn.toggleNightMode()
// fn.toggleNightMode(1)
// fn.toggleNightMode("1")
// fn.toggleNightMode(true)
// fn.toggleNightMode(0)
// fn.toggleNightMode("0")
// fn.toggleNightMode(false)
export function toggleNightMode(nightModeOn: number | string | boolean = true)
{
	if (nightModeOn == "1" || nightModeOn == 1) nightModeOn = true;
	else if (nightModeOn == "0" || nightModeOn == 0) nightModeOn = false;

	if (nightModeOn == false || index.body.dataset.nightMode == "1")
	{
		index.body.dataset.nightMode = "0";
		settings.nightMode = "0";
	}
	else
	{
		index.body.dataset.nightMode = "1";
		settings.nightMode = "1";
	}
	localStorage.setItem(`nightMode`, settings.nightMode);
}idDate("2023-01-01 23:44:44") -> true
// isValidDate("abc") -> false
export function isValidDate(dateString: string)
{
	return !isNaN(Date.parse(dateString));
}



// generateImageVariants("https://wykop.pl/cdn/c3201142/05ce90b751be02497ab64f2fa8dd6b715a1d0df9114ad93e878ed3449c4505b8.gif");
/*
returns:
variants = {
	src: "https://wykop.pl/cdn/c3201142/05ce90b751be02497ab64f2fa8dd6b715a1d0df9114ad93e878ed3449c4505b8.gif",
	300: "https://wykop.pl/cdn/c3201142/05ce90b751be02497ab64f2fa8dd6b715a1d0df9114ad93e878ed3449c4505b8,w300.gif",
	400: "https://wykop.pl/cdn/c3201142/05ce90b751be02497ab64f2fa8dd6b715a1d0df9114ad93e878ed3449c4505b8,w400.gif",
	800: "https://wykop.pl/cdn/c3201142/05ce90b751be02497ab64f2fa8dd6b715a1d0df9114ad93e878ed3449c4505b8,w800.gif"
}


*/
export function generateImageVariantsObject(url: string): Record<string, string>
{
	url = url.split('?')[0];
	const fileExtension = url.split('.').pop(); // file extension (e.g., .gif, .png, .jpg, .webp)
	const baseUrl = url.replace(`.${fileExtension}`, '');
	const variants: Record<string, string> =
	{
		"src": url,
		300: `${baseUrl},w300.${fileExtension}`,
		400: `${baseUrl},w400.${fileExtension}`,
		800: `${baseUrl},w800.${fileExtension}`,
	};

	return variants;
}



// usuwa początkową ikonkę z linkiem do pokoju mikroczatu w wiadomosciach prywatnych
// zwraca true gdy wykryto tekst, zwraca false jesli nie było tekstu
export function parseRoomInfoFromPMbeginning(textContent: string): T.RoomInfoFromPM
{
	const regexPattern = `\\[${CONST.mikroczatEmoji}\\]\\(https:\\/\\/mikroczat\\.pl\\/(room|pm)\\/(.*?)\\)`;
	const regex = new RegExp(regexPattern);
	const match = textContent.match(regex);

	const pmIsFromMikroczat = match !== null;
	const contentWithRemovedRoomInfo = pmIsFromMikroczat ? textContent.replace(regex, '') : textContent;

	const urlRoomInfo: T.RoomInfoFromPM =
	{
		parsedContent: contentWithRemovedRoomInfo,
		pmIsFromMikroczat: pmIsFromMikroczat,
		roomID: null,
		userId: null,
		usernamesArray: [],
	};

	if (pmIsFromMikroczat)
	{
		// https://mikroczat.pl/room/23jkrhk23jhrk-base64ID
		if (match[1] === 'room')
		{
			urlRoomInfo.roomID = match[2];
			urlRoomInfo.usernamesArray = decodeUsernamesFromBase64roomID(urlRoomInfo.roomID);
		}
		// https://mikroczat.pl/pm/@NadiaFrance
		else if (match[1] === 'pm')
		{
			urlRoomInfo.userId = match[2].replace("@", "");
			urlRoomInfo.usernamesArray = [urlRoomInfo.userId];
		}
	}
	return urlRoomInfo;
}

/*
	let roomID = encodeUsernamesToBase64roomID(Channel);
	let roomID = encodeUsernamesToBase64roomID(Channel.usernamesArray);
	let roomID = encodeUsernamesToBase64roomID(Channel.users); // Map
	let roomID = encodeUsernamesToBase64roomID(["username1", "username2", "username3"]);
	let roomID = encodeUsernamesToBase64roomID(Set(["username1", "username2", "username3"]));
	
	returns: "ahihihqihdaw9ur281ql2ejlqk2jrlqi93";
*/
export function encodeUsernamesToBase64roomID(usernames: T.Channel | string[] | Set<string>): string
{
	let usernamesArray: string[];

	if (Array.isArray(usernames))
	{
		usernamesArray = usernames;
	}
	else if (usernames instanceof Set)
	{
		usernamesArray = Array.from(usernames.values());
	}
	else if (usernames instanceof Map)
	{
		usernamesArray = Array.from(usernames.keys());
	}
	else if (typeof usernames === "object" && usernames.hasOwnProperty("users") && usernames instanceof T.Channel)
	{
		usernamesArray = usernames.usernamesArray;
	}

	return "==" + btoa(usernamesArray.sort().join('/')); // zwraca base64 z == na początku
}

// returns sorted usernames array ["username1", "username2", "username3"];
export function decodeUsernamesFromBase64roomID(uncodedUsernames: string): string[]
{
	if (uncodedUsernames.startsWith('=='))
	{
		uncodedUsernames = uncodedUsernames.replace(/^==/, ''); // usuwa == na początku 
	}

	return atob(uncodedUsernames).split('/');
}

/* PHP 
Returns sorted usernames array ["username1", "username2", "username3"]

function decodeUsernamesFromBase64roomID($uncodedUsernames) {
	return explode('/', base64_decode($uncodedUsernames));
}	
*/





export function removeBlacklistWords(text: string, blacklist: string[]): string
{
	if (text)
	{
		if (blacklist && blacklist.length > 0)
		{
			blacklist.forEach((word) =>
			{
				text = text.split(word).join('');
			});
		}
		return text;
	}

}



// fn.toggleNightMode()
// fn.toggleNightMode(1)
// fn.toggleNightMode("1")
// fn.toggleNightMode(true)
// fn.toggleNightMode(0)
// fn.toggleNightMode("0")
// fn.toggleNightMode(false)
export function toggleNightMode(nightModeOn: number | string | boolean = true)
{
	if (nightModeOn == "1" || nightModeOn == 1) nightModeOn = true;
	else if (nightModeOn == "0" || nightModeOn == 0) nightModeOn = false;

	if (nightModeOn == false || index.body.dataset.nightMode == "1")
	{
		index.body.dataset.nightMode = "0";
		settings.nightMode = "0";
	}
	else
	{
		index.body.dataset.nightMode = "1";
		settings.nightMode = "1";
	}
	localStorage.setItem(`nightMode`, settings.nightMode);
}




export function openPMWindowWithUser(userObject: T.User): void
{
	console.log("userObject", userObject);


	if (!userObject) return;


	if (userObject.username == loggedUser.username) return; // nie otwieramy  wiadomości dla samego siebie

	if (userObject.status == "removed")
	{
		getRandomInt(1, 2) == 1 ? alert(`\n𝕄𝕚𝕜𝕣𝕠𝕔𝕫𝕒𝕥 \n\nTen użytkownik zrobił #𝙪𝙨𝙪𝙣𝙠𝙤𝙣𝙩𝙤 (⌐ ͡■ ͜ʖ ͡■)`) : alert(`\n𝕄𝕚𝕜𝕣𝕠𝕔𝕫𝕒𝕥 \n\nTen Mirek już z nami nie mirkuje (╯︵╰,)`);
		return;
	}
	if (userObject.status == "suspended")
	{
		alert(`\n𝕄𝕚𝕜𝕣𝕠𝕔𝕫𝕒𝕥 \n\nTen użytkownik robi właśnie #𝙪𝙨𝙪𝙣𝙠𝙤𝙣𝙩𝙤,\nwięc możliwe, że nie odczyta wiadomości, które do niego wyślesz\n(╯︵╰,)`);
	}


	if (userObject.status == "banned")
	{
		alert(`\n𝕄𝕚𝕜𝕣𝕠𝕔𝕫𝕒𝕥 \n\nTen użytkownik ma bana.\nMożesz wysyłać do niego wiadomości, ale nie będzie mógł na nie odpisać.`);
	}

	openURLInNewWindow({ src: `https://mikroczat.pl/pm/@${userObject.username}`, target: `pm_${userObject.username}`, width: 550, height: 1000 });
}


export function openURLInNewWindow(args: any)
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

	const targetWindowName = args.target || "image";

	//windowFeatures += 'resizable=yes,scrollbars=yes,menubar=no';

	const imageWindow = window.open(args.src, targetWindowName, windowFeatures);

	if (!imageWindow)
	{
		// The window wasn't allowed to open
		// This is likely caused by built-in popup blockers.
		return null;
	}

	// crossorigin policy return imageWindow;
}



export function highlight(highlightElementSelector: string, highlightClass: string)
{
	addClass(highlightElementSelector, highlightClass);
}
export function unhighlight(highlightElementSelector: string, highlightClass: string)
{
	removeClass(highlightElementSelector, highlightClass);
}



// Dodaje event listenera: jesli przesunieto okno z wiadomosciami wyzej, nie scrolluje w dol przy nowej wiadomosci
export function setupScrollListener(ChannelObject: T.Channel)
{
	if (ChannelObject.elements.messagesContainer)
	{
		// if (dev) console.log(`setupScrollListener(messageContainer)`, messagesContainer);

		ChannelObject.elements.messagesContainer.addEventListener('scroll', function ()
		{
			// jeśli przeglądamy dyskusję, nie sprawdzamy scrollowania
			if (ChannelObject.type == "tag" && (ChannelObject as T.ChannelTag).discussionViewEntryId)
			{
				ChannelObject.elements.messagesContainer.dataset.scrollToNew = "0";
				return;
			}
			// if (dev) console.log(`🔖 SCROLL EVENT: scrollTop: [${messagesContainer.scrollTop}] clientHeight: [${messagesContainer.clientHeight}] | data-scroll-to-new="${messagesContainer.dataset.scrollToNew}"`);
			// if (dev) console.log(`🔖 Math.abs(messagesContainer.scrollTop): `, Math.abs(messagesContainer.scrollTop));
			// if (dev) console.log(`🔖 Math.abs(messagesContainer.scrollTop) < messagesContainer.clientHeight: `, Math.abs(messagesContainer.scrollTop) < messagesContainer.clientHeight);

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
