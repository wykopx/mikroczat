import { user } from './index.js';

export function markdownNewLineToBr(text: string): string
{
	return text.replace(/\n/g, '<br/>'); // Replace newline characters with <br>
}
export function replaceAngleBrackets(text: string): string
{
	return text.replace(/</g, '&lt;');
	// return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function markdownTextToSpan(text: string): string
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

export function markdownAsteriskToStrong(text: string): string
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



export function markdownUnderscoreToItalics(text: string): string
{
	// console.log(`markdownUnderscoreToItalics,  text:`)
	// console.log(text)

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

export function markdownBacktickToCode(text: string): string 
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


export function markdownUsernameToAbbr(text: string): string
{
	/*
	- wykrywa tekst @NadiaFrance rozpoczynający się od @ na początku
	- przed @ nie moze byc zadnego tekstu (\B) tylko znaki lub whitespaces
	- username moze skladac sie z - i _
	- jesli na koncu jest : usuwa go calkowicie
	*/
	return text.replace(/(\B)@([\w-_]+):?/g, function (wholeMatch, textInFront, username)
	{
		if (username === user.username)
		{
			return `${textInFront}<abbr data-mention-user="${username}" class="mentions-you">@${username}</abbr>`;	 // wolaja Ciebie
		}
		else
		{
			return `${textInFront}<abbr data-mention-user="${username}">@${username}</abbr>`;	// wołany jest inny użytkownik
		}
	});
}


export function markdownExclamationMarkToSpoiler(text: string): string
{
	/*
	- wykrywa tekst spoilera rozpoczynający się od ! na początku
	- \s* oznacza ewentualne spacje przed !
	- /gm oznacza multiline, wtedy ^ oznacza poczatek linijki, a $ koniec linijki a nie calego stringa
	*/
	return text.replace(/^\s*!(.*)$/gm, '<span class="content-spoiler">$1</span>');
}

export function markdownGtToBlockquote(text: string): string
{
	/*
	- wykrywa tekst cytatu rozpoczynający się od > lub wielokrotnosci np.:  >>> cytat
	*/
	return text.replace(/^\s*(>+)(.*)?$/gm, '<blockquote>$2</blockquote>');
	// return text.replace(/^\s*(>+)(.*)$/gm, '<blockquote>$2</blockquote>');
}





export function markdownTagsToLink(text: string, currentChannelName: string): string
{
	/*
		- wykrywa tekst #heheszki i zamienia go w link do nowego kanału czata
	*/
	// return text.replace(/(\B)#([a-zA-Z0-9]+)/g, `<a class="href_channel" href="/chat/$2" target="_blank">#$2</a>`);

	return text.replace(/(\B)#([a-zA-Z0-9]+)/g, function (wholeMatch, textInFront, tag)
	{
		if (tag === currentChannelName)
		{
			return `${textInFront}<a class="href_channel currentChannel" href="/chat/${tag}">#${tag}</a>`;	 // wolaja Ciebie
		}
		else
		{
			return `${textInFront}<a class="href_channel" href="/chat/${tag}" target="_blank" title='Otwórz kanał "#${tag}" w nowym oknie MikroCzata'>#${tag}</a>`;	// wołany jest inny użytkownik
		}
	});
}

export function parseURLToLink(text: string): string
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
			parts[i] = parts[i].replace(/((http(s*):\/\/)*[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))/g, '<a class="href_external" href="$1" target="mikroczat_opened">$1</a>');
		}
	}

	// Join the parts back together
	return parts.join('');
}



export function markdownToLink(text: string): string
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


export function show(el: Element | Element[] | string)
{
	returnElementsArray(el).forEach((el) =>
	{
		el.classList.add("show");
		el.classList.remove("hidden");
	});
}
export function hide(el: Element | Element[] | string)
{
	returnElementsArray(el).forEach((el) =>
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
