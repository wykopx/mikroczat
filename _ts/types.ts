import * as CONST from './const.js';
// import { dev } from './index.js';
declare let dev: boolean;

import { settings } from './settings.js';
import * as notifications from './wykop_notifications.js';


import * as ch from './ch.js';

/* date-fns */
import { setDefaultOptions } from "../../node_modules/date-fns/setDefaultOptions.mjs";
import { pl } from "../../node_modules/date-fns/locale.mjs";
setDefaultOptions({ locale: pl });


import { parse } from "../../node_modules/date-fns/parse.mjs";
import { format } from "../../node_modules/date-fns/format.mjs";
import { subDays } from "../../node_modules/date-fns/subDays.mjs";
import { parseJSON } from "../../node_modules/date-fns/parseJSON.mjs";
import { getUnixTime } from "../../node_modules/date-fns/getUnixTime.mjs";
import { formatDistance } from "../../node_modules/date-fns/formatDistance.mjs";
import { differenceInSeconds } from "../../node_modules/date-fns/differenceInSeconds.mjs";

import * as fn from './fn.js';


export const proxies = new WeakSet(); // do usunięcia



export type TokensObject = {
	token?: string;
	refresh_token?: string;
	username?: string;
};

type TokenType = "token" | "userKeep" | "refresh_token" | "guest";
export interface UnknownToken
{
	tokenValue: string;
	tokenType?: TokenType;
}

interface TagObject
{
	name: string;
	nameUnderscore?: string;

	created_at?: string;
	author?: User;
	personal?: boolean;
	description?: string;
	blacklist?: boolean;
	editable?: boolean;
	followers?: number;
	follow?: boolean;
	notifications?: boolean;
	promoted?: boolean;
	media?: Media;
	actions?: TagActions;
}

// let tag = new Tag("heheszki");
// let tag = new Tag("kanalzero_");
// let tag = new Tag(tagObject)
export class Tag 
{

	name: string;
	nameUnderscore?: string;

	created_at?: string;
	author?: User;
	personal?: boolean;
	description?: string;
	blacklist?: boolean;
	editable?: boolean;
	followers?: number;
	follow?: boolean;
	notifications?: boolean;
	promoted?: boolean;
	media?: Media;
	actions?: TagActions;

	constructor(tag: TagObject | string)
	{
		if (typeof tag === "string")
		{
			if (tag.endsWith("_"))
			{
				this.name = tag.replaceAll(/_+$/g, "");	// usuwa wszystkie ___ z oknca tagu 
				this.nameUnderscore = tag;
			}
			else this.name = tag;
		}
		else
		{
			this.name = tag.name;
			this.nameUnderscore = tag.nameUnderscore || tag.name;

			this.created_at = tag.created_at;
			this.author = new User(tag.author);
			this.personal = tag.personal;
			this.description = tag.description;
			this.blacklist = tag.blacklist;
			this.editable = tag.editable;
			this.followers = tag.followers;
			this.follow = tag.follow;
			this.notifications = tag.notifications;
			this.promoted = tag.promoted;
			this.media = tag.media;
			this.actions = tag.actions;
		}
	}

	async initFromAPI()
	{
		try
		{
			let response = await fetch(`https://wykop.pl/api/v3/tags/${this.name}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + window.localStorage.getItem("token"),
				},
			});
			let data = await response.json();

			if (data.data.name) this.name ??= data.data.name;
			if (data.data.created_at) this.created_at ??= data.data.created_at;
			if (data.data.author) this.author ??= new User(data.data.author);
			if (data.data.personal) this.personal ??= data.data.personal;
			if (data.data.description) this.description ??= data.data.description;
			if (data.data.blacklist) this.blacklist ??= data.data.blacklist;
			if (data.data.editable) this.editable ??= data.data.editable;
			if (data.data.followers) this.followers ??= data.data.followers;
			if (data.data.follow) this.follow ??= data.data.follow;
			if (data.data.notifications) this.notifications ??= data.data.notifications;
			if (data.data.promoted) this.promoted ??= data.data.promoted;
			if (data.data.media) this.media ??= data.data.media;
			if (data.data.actions) this.actions ??= data.data.actions;
			if (dev) console.log("Tag constructor().init() -> data from API for tag", this);

		} catch (error)
		{
			console.error('Error:', error);
		}
	}

}


type LoadingStatus = "before" | "preloaded" | "loaded";

export class Channel
{
	loadingStatus?: LoadingStatus;	// "before"
	discussionViewEntryId?: number; // widok wybranej dyskusji i odpowiadania

	pagination: {
		next: string,
		prev: string
	};

	tag: Tag;
	name: string;					// bez _ jesli kategoria 
	nameUnderscore?: string; 		// including kanalzero_ gdy kategorie

	entries: Map<number, Entry>;	// <1234567, Entry>
	comments: Map<number, Comment>;	// <2345678912, Comment>

	unreadMessagesCount: number;
	unreadMentionsCount: number;

	users: Map<string, User>;

	elements:
		{
			channelFeed: HTMLElement;
			messagesContainer: HTMLElement;
			usersListContainer: HTMLElement;
			newMessageTextarea: HTMLElement;
			newMessageTextareaContainer: HTMLElement;
		}


	constructor(tag: Tag)
	{
		this.loadingStatus = "before";
		this.tag = tag;
		this.name = tag.name;
		this.nameUnderscore = tag.nameUnderscore || tag.name;

		this.entries = new Map<number, Entry>();
		this.comments = new Map<number, Comment>();
		this.unreadMessagesCount = 0;
		this.unreadMentionsCount = 0;

		this.users = new Map<string, User>();
		this.elements =
		{
			channelFeed: null,
			messagesContainer: null,
			usersListContainer: null,
			newMessageTextarea: null,
			newMessageTextareaContainer: null
		}


		this.pagination = {
			next: null,
			prev: null
		}
		this.printChannelDetails();
	}

	printChannelDetails()
	{
		if (dev) console.log(`Channel name: ${this.name}`);
	}

	addEntryOrCommentToChannelObject(ChannelObject: Channel, EntryObject: Entry | Comment)
	{
		if (dev) console.log(`T.Channel.addEntryOrCommentToChannelObject(EntryObject)`, EntryObject);

		function createProxyHandler(ChannelObject: Channel, EntryObject: Entry | Comment)
		{
			return {
				get: function (target, prop)
				{
					// if (dev) console.log(`🌃 GET PROXY handler`);
					// if (dev) console.log(`🌃 GET PROXY handler - target: `, target);
					// if (dev) console.log(`🌃 GET PROXY handler - prop: `, prop);

					if (typeof target[prop] === 'object' && target[prop] !== null)
					{
						return new Proxy(target[prop], this);
					}
					else
					{
						return target[prop];
					}
				},

				set: function (originalProperty: Votes | Comments | Entry, changedPropertyName: string, newValue: any)
				{
					// if(dev) console.log(`🎃🎃 originalProperty[changedPropertyName] ${EntryObject.id} ${changedPropertyName}]`, originalProperty[changedPropertyName])
					// if(dev) console.log(`🎃🎃 EntryObject: ${EntryObject.id} EntryObject["votes"][${changedPropertyName}]`, EntryObject["votes"][changedPropertyName])
					// if(dev) console.log(`🎃🎃 EntryObject: `, EntryObject)

					// if (dev) console.log(`🎃 SET PROXY handler ${EntryObject.id} | ${EntryObject.resource}`);
					// if (dev) console.log(`🎃 originalProperty: `, originalProperty);												// { items: [2 items], count: 8 }
					// if (dev) console.log(`🎃 changedPropertyName: `, changedPropertyName);										// "count" / "up" / "voted"
					// if (dev) console.log(`🎃 changedPropertyName[changedPropertyName]: `, originalProperty[changedPropertyName]);
					// if (dev) console.log(`🎃 newValue`, newValue);																// 9 - wartosc po zmianie
					// if (dev) console.log(`🎃 typeof newValue`, typeof newValue);																// 9 - wartosc po zmianie
					// if (dev) console.log(`🎃 newValue instanceof Date`, newValue instanceof Date);																// 9 - wartosc po zmianie

					if (newValue != null && originalProperty != null) // && newValue != originalProperty[changedPropertyName]
					{
						// if (dev) console.log(`🎃 EntryObject.voted`, EntryObject.voted);
						// if (dev) console.log(`🎃 EntryObject.votes`, EntryObject.votes);
						// if (dev) console.log(`🎃 EntryObject.comments`, EntryObject.comments);

						// ------- ZARÓWNO WE WPISACH JAK I KOMENTARZACH ------
						// ZMIANA LICZBY PLUSÓW W WIADOMOŚCI
						if (changedPropertyName === 'up')
						{
							if (newValue != originalProperty[changedPropertyName])
							{
								if (dev) console.log(`🎃 PROXY - ZMIENIŁA SIĘ LICZBA PLUSÓW WE WPISIE/KOMENTARZU: ${newValue}`);
								originalProperty[changedPropertyName] = newValue;
								ch.updateCSSPropertyOnMessageArticleElement(EntryObject, changedPropertyName, originalProperty);	// aktualizacja var(--votesUp);
							}
						}

						// UŻYTKOWNIK ZAPLUSOWAŁ WIADOMOŚĆ (np. poza czatem)
						if (changedPropertyName === 'voted')
						{
							if (newValue != originalProperty[changedPropertyName])
							{
								if (dev) console.log(`🎃 PROXY - UŻYTKOWNIK DAŁ PLUSA: ${newValue}`);
								originalProperty[changedPropertyName] = newValue;
								ch.updateCSSPropertyOnMessageArticleElement(EntryObject, changedPropertyName, originalProperty);	// aktualizacja data-voted="1"
							}
						}


						// TYLKO DLA WPISÓW
						if (EntryObject.resource === "entry")
						{
							// ZMIANA LICZBY KOMENTARZY WE WPISIE
							if (changedPropertyName === 'count')
							{
								if (dev) console.log(`🎃 PROXY - ZMIENIŁA SIĘ LICZBA komentarzy WE WPISIE: ${newValue}`);
								if (dev) console.log("EntryObject", EntryObject);
								if (dev) console.log("ChannelObject", ChannelObject);

								originalProperty[changedPropertyName] = newValue;
								ch.updateCSSPropertyOnMessageArticleElement(EntryObject, changedPropertyName, originalProperty);	// aktualizacja var(--commentsCount);

								// wczytanie nowych komentarzy pod wpisem
								ch.checkAndInsertNewCommentsInEntry(ChannelObject, EntryObject);
							}

							else if (changedPropertyName === 'last_checked_comments_count') 
							{
								if (dev) console.log(`🎃 PROXY - AKTUALIZUJEMY OSTATNIĄ LICZBĘ KOMENTARZY WE WPISIE last_checked_comments_count: ${newValue}`);
								originalProperty[changedPropertyName] = newValue;
							}

							else if (changedPropertyName === 'last_checked_comments_datetime') 
							{
								if (dev) console.log(`🎃 PROXY - AKTUALIZUJEMY OSTATNI CZAS SPRAWDZENIA WPISU last_checked_comments_datetime: ${newValue}`);
								if (typeof newValue === "string") originalProperty[changedPropertyName] = new Date(newValue);
								else if (newValue instanceof Date) originalProperty[changedPropertyName] = newValue;
							}
						}
						return true;
					}
				}
			};
		}

		EntryObject = new Proxy(EntryObject, createProxyHandler(ChannelObject, EntryObject));

		if (EntryObject.resource === "entry_comment")
		{
			// Proxy obserwujące  liczbę plusów
			// proxies.add(EntryObject.votes);
			this.comments.set(EntryObject.id, EntryObject);
		}

		if (EntryObject.resource === "entry")
		{
			// Proxy obserwujące liczbę komentarzy i liczbę plusów oraz czy użytkownik zaplusował
			// proxies.add(EntryObject.votes);
			// proxies.add(EntryObject.comments);
			this.entries.set(EntryObject.id, EntryObject);
			if (settings.css.main.channelStats != "disabled") fn.innerText(`.${ChannelObject.name}_entriesCount`, String(ChannelObject.entries.size));			// <div>Dyskusji: <var class="channel_entriesCount"></var></div>
		}

		if (settings.css.main.channelStats != "disabled")
		{
			fn.innerText(`.${ChannelObject.name}_messagesCount`, String(ChannelObject.entries.size + ChannelObject.comments.size));		// <div>Wiadomości: <var class="heheszki_messagesCount"></var></div>
			fn.innerText(`.${ChannelObject.name}_plusesCount`, String([...ChannelObject.entries.values(), ...ChannelObject.comments.values()].reduce((sum, obj) => sum + obj.votes.up, 0)));		// <div>Plusów: <var id="channel_plusesCount"></var></div>

			fn.innerText(`.${ChannelObject.name}_timespan`,
				String(
					Array.from(ChannelObject.entries.values())
						.reduce((oldest, entry) => new Date(entry.created_at) < new Date(oldest) ? entry.created_at : oldest, new Date()))); // TODO dodać do T.Entry Date() z created_at

			// `${entryObject.created_at_Format("eeee BBBB")} | ${entryObject.created_at_FormatDistanceSuffix} \n${entryObject.created_at_Format("yyyy-MM-dd 'o godz.' HH:mm ")}`
		}
	}

}




/*
"data":
	{
		"content": "**foobar** __foobar__ [lorem](https://www.wykop.pl) impsum!!! #nsfw #wykop",
		"photo": "e07843ss3fbe9cb4saeed0asdfsdfc64b9a4df6084199b39d2",
		"embed": "1fde707843ss3fbe9cb4eed0asdfsdfc64ab9a4df6084199b39d2",
		"survey": "qErgdjp5K0xz",
		"adult": false
	}
*/

export interface NewMessageBodyData
{
	content?: string,
	photo?: string,
	embed?: string,
	survey?: string,
	adult?: boolean

	resource?: Resource;
	entry_id?: number; 	// przy dodawaniu komentarza pod wpisem, tutaj jest id wpisu
}


export interface MessageTemplate
{
	resource?: Resource;		// "entry", "entry_comment"

	id?: number;
	entry_id?: number;

	parent?: Entry | MessageTemplate;

	channel?: Channel;
	author?: User;			// author: User

	media?: Media;
	photo?: string;			// NewMessageBodyData
	embed?: string;			// NewMessageBodyData
	survey?: string;		// NewMessageBodyData

	votes?: Votes;
	comments?: Comments;	// comments.items: Comments[] (tylko 2 komentarze) , comments.count: number

	actions?: EntryActions;

	adult?: boolean;

	content?: string;
	created_at?: string;
	device?: string;

	archive?: boolean;
	deleted?: boolean;
	deletable?: boolean;
	editable?: boolean;
	blacklist?: boolean;

	favourite?: boolean;

	slug?: string;
	status?: string; 		// "visible"
	tags?: string[];		// ['muzyka', 'toto', 'michaeljackson', '70s', '80s', 'lifelikejukebox']
	voted?: number; 		// 1 / 0

}


export type Resource = "entry" | "entry_comment";


export class Entry
{
	last_checked_comments_datetime?: Date;		// ostatni czas sprawdzenia wpisu / liczb plusow w komentarzach
	last_checked_comments_count?: number;			// liczba wczytanych komentarzy podczas ostatniego sprawdzania

	id?: number;
	entry_id?: number;
	resource: Resource;		// "entry", "entry_comment"

	channel?: Channel;
	author?: User;			// author: User

	media?: Media;

	photo?: string;			// NewMessageBodyData
	embed?: string;			// NewMessageBodyData
	survey?: string;		// NewMessageBodyData

	votes?: Votes;
	comments?: Comments;	// comments.items: Comments[] (tylko 2 komentarze) , comments.count: number

	actions?: EntryActions;

	deleted?: boolean;
	adult?: boolean;
	archive?: boolean;

	content?: string;
	created_at?: string;
	// getter - created_at_Date?: Date;
	editable?: boolean;
	deletable?: boolean;
	blacklist?: boolean;

	device?: string;
	favourite?: boolean;

	slug?: string;
	status?: string; 		// "visible"
	tags?: string[];		// ['muzyka', 'toto', 'michaeljackson', '70s', '80s', 'lifelikejukebox']
	voted?: number; 		// 1 / 0

	constructor(entryObject: Entry | NewMessageBodyData | MessageTemplate, channel?: Channel)
	{
		if ('id' in entryObject)
		{
			this.resource = entryObject.resource;

			this.id = entryObject.id;
			this.entry_id = entryObject.id

			this.channel = channel;
			this.author = new User(entryObject.author);

			// z tymi w API jest problem, nie zapisuje pustych wartosci tylko undefined

			this.media = entryObject.media || { embed: null, photo: null, survey: null };
			this.votes = entryObject.votes || { up: 0, down: 0, users: [] };

			if (dev) console.log(`⛔⛔⛔ constructor ${this.id} Entry: this.votes.up ${this.votes.up}`, this.votes);


			this.deleted = entryObject.deleted || false;
			this.comments = entryObject.comments || { items: [], count: 0 };
			this.status = entryObject.status;	// "visible" tylko dla wpisu i tylko podczas pobierania wpisów ze streamu, a nie szczegolow konkretnego wpisu lub komentarza


			this.adult = entryObject.adult || false;
			this.archive = entryObject.archive || false;

			this.slug = entryObject.slug;
			this.device = entryObject.device;
			this.actions = entryObject.actions;
			this.tags = entryObject.tags || [];
			this.content = entryObject.content || "";
			this.created_at = entryObject.created_at;

			this.deletable = entryObject.deletable;
			this.editable = entryObject.editable;
			this.blacklist = entryObject.blacklist || false;
			this.favourite = entryObject.favourite || false;

			this.voted = entryObject.voted;

			/* tylko dla wpisów */
			this.last_checked_comments_datetime = null;
			this.last_checked_comments_count = 0;	// liczba wczytanych komentarzy podczas ostatniego sprawdzania

			// if (dev) console.log("Entry constructor() EntryObject: ", this)
		}
		else	// NewMessageBodyData
		{
			// tylko WX, nie wysylane w API przy tworzeniu nowego wpisu
			this.resource = entryObject.resource;
			this.content = entryObject.content;
			this.adult = entryObject.adult;
			this.entry_id = entryObject.entry_id; 	// przy dodawaniu komentarza pod wpisem, tutaj jest id wpisu

			/* wysyłane w API POST podczas tworzenia nowej wiadoosci */
			this.photo = entryObject.photo;
			this.embed = entryObject.embed;
			this.survey = entryObject.survey;

		}
	}

	isMentioningUser(username: string): boolean
	{
		const regex = new RegExp(`@${username}`, 'g');
		return regex.test(this.content);
	}

	content_parsed(): string
	{
		if (!this.content) return "";

		let content_parsed = this.content;

		let blacklist = []; // replace with your blacklist words
		blacklist.push('✨️ **Obserwuj** #mirkoanonim'); // mirkoanonim


		content_parsed = fn.removeBlacklistWords(content_parsed, blacklist);



		const splitters = ["---"]; 											// standardowa stopka Wykopu
		splitters.push("─────────────────────");							// mikroanonim
		splitters.push("_______________________________________"); 			// wykop-gpt
		splitters.push("Wpis został dodany za pomocą"); 					// skrypt https://barylkakrwi.org/skrypt
		splitters.push("[Regulamin](https://barylkakrwi.org/regulamin)"); 	// KrwawyBot
		splitters.push("! #januszowybot <- obserwuj/czarnolistuj"); 		// JanuszowyBot
		splitters.push("\n[Więcej info](https://wykop.pl/wpis/71002147)"); 	// Przypomnienie bot



		for (let splitter of splitters)
		{
			const parts = content_parsed?.split(splitter);
			if (parts && parts.length > 1)
			{
				content_parsed = parts[0];
			}
		}

		content_parsed = fn.replaceAngleBrackets(content_parsed, this);	// changes < to &lt;
		content_parsed = fn.markdownBacktickToCODE(content_parsed, this);
		content_parsed = fn.markdownUnderscoreToITALICS(content_parsed, this);
		content_parsed = fn.markdownAsteriskToSTRONG(content_parsed, this);
		content_parsed = fn.markdownToANCHOR(content_parsed, this);
		content_parsed = fn.parseURLToANCHOR(content_parsed, this);
		content_parsed = fn.markdownUsernameToABBR(content_parsed, this);
		content_parsed = fn.markdownGtToBLOCKQUOTE(content_parsed, this);
		content_parsed = fn.markdownExclamationMarkToSPOILER(content_parsed, this);
		content_parsed = fn.markdownNewLineToBR(content_parsed, this); // TODO add settings to parse br
		content_parsed = fn.markdownTagsToANCHOR(content_parsed, this);
		content_parsed = fn.markdownTextToSPAN(content_parsed, this);



		//content_parsed = markdown.renderInline(content_parsed); // https://github.com/markdown-it/markdown-it
		return content_parsed;
	}

	get created_at_Date(): Date						// Date object
	{
		return parse(this.created_at, 'yyyy-MM-dd HH:mm:ss', new Date());
	}

	get created_at_Timestamp(): number				// "132893789"
	{
		return getUnixTime(this.created_at_Date);
	}

	get created_at_FormatDistance(): string			// "5 minut"
	{
		return formatDistance(this.created_at_Date, new Date(), { addSuffix: false })
	}

	get created_at_FormatDistanceSuffix(): string	// "5 minut temu"
	{
		return formatDistance(this.created_at_Date, new Date(), { addSuffix: true })
	}

	get created_at_SecondsAgo(): number		// liczba sekund
	{
		return differenceInSeconds(new Date(), this.created_at_Date);
	}

	// https://github.com/date-fns/date-fns/blob/main/CHANGELOG.md
	// created_at_Format("HH:mm:ss") -> // "23:59:59"
	created_at_Format(formatString: string): string
	{
		return format(this.created_at_Date, formatString);
	}

	get created_at_Time(): string	// "23:59"
	{
		return format(this.created_at_Date, 'HH:mm');
	}
	get created_at_YYYY_MM_DD(): string
	{
		return format(this.created_at_Date, 'yyyy-MM-dd');
	}
	get created_at_e(): string	// 1
	{
		return format(this.created_at_Date, 'e');
	}
	get created_at_ee(): string	// 01
	{
		return format(this.created_at_Date, 'ee');
	}
	get created_at_eee(): string // pon.
	{
		return format(this.created_at_Date, 'eee');
	}
	get created_at_eeee(): string	// poniedziałek
	{
		return format(this.created_at_Date, 'eeee');
	}
}






export class Comment extends Entry
{
	parent?: Entry;
	//parent?: any;

	constructor(commentObject: Comment | MessageTemplate, channel?: Channel)
	{
		super(commentObject, channel);
		this.entry_id = commentObject.parent.id;
		this.parent = new Entry(commentObject.parent, channel);
		//this.parent = commentObject.parent;
	}
}

export type Comments = {
	items: Comment[];
	count: number;
}

export type Votes = {
	up: number;
	down: number;
	users?: User[]; // [User]
}

export type Media = {
	embed?: MediaEmbed;
	photo?: MediaPhoto;
	survey?: MediaSurvey;
}

export type MediaPhoto = {
	key?: string;  			// "6nVPq197R6zlBmJXW3Q5OZwGNm5jekALav04rdpYDxyNEg8b2M"
	label?: string; 		// "wroclaw"
	mime_type?: string; 	// "image/jpeg"
	url?: string; 			// "https://wykop.pl/cdn/7c4cda5db7d1493f05c7-4b44df189463bab1b45cced887282d0b/tag_background_wroclaw_9Sfsl6FLz46Tf4YzVDuB.jpg"
	size?: number; 			// 0
	width?: number; 		// 0
	height?: number; 		// 0
}

export type MediaEmbed = {
	key?: string;  			// "PWXnEbQrvegqJkYZLO8p0KJrNJaaKRm79ABdaVN2Dl3M4x6y5z"
	type?: string;			// "youtube | streamable"
	thumbnail?: string;		// "https://wykop.pl/cdn/c3201142/fd0110fe2eda0d7655fdbe1682b5cb529643082a386d2749a644e6adf6f79e91.jpg",
	url?: string; 			// "https://youtu.be/piStNvzlBNw?t=277"
	age_category?: string;	// "all" / // TODO: ??????,
}

export type MediaSurvey = {
	key?: string;  			// "PWXnEbQrvegqJkYZLO8p0KJrNJaaKRm79ABdaVN2Dl3M4x6y5z"
	TODO?: null;			// TODO
}


interface UserObject
{
	username: string;

	about?: string;
	actions?: UserActions;
	avatar?: string;
	background?: string;
	blacklist?: boolean;
	city?: string;
	color?: UserColor;
	company?: boolean;
	follow?: boolean;
	followers?: number;

	gender?: string;
	member_since?: string;

	name?: string;
	note?: boolean;
	online?: boolean;
	public_email?: string;

	rank?: UserRank;
	social_media?: UserSocialMedia;
	summary?: UserSummary;

	status?: string; // "active", "banned", "suspended"
	verified?: boolean;
	website?: string;


}

export class User
{
	username: string;

	about?: string;
	avatar?: string;
	actions?: UserActions;
	background?: string;
	blacklist?: boolean;
	city?: string;
	color?: UserColor;
	company?: boolean;
	follow?: boolean;
	followers?: number;
	gender?: string;
	member_since?: string;
	name?: string;
	note?: boolean;
	online?: boolean;
	public_email?: string;

	rank?: UserRank;
	summary?: UserSummary;
	social_media?: UserSocialMedia;

	status?: string; // "active", "banned", "suspended"

	verified?: boolean;
	website?: string;

	channel?: Channel;


	constructor(userObject: UserObject | string, channel?: Channel)
	{
		if (typeof userObject === "string")
		{
			if (userObject === "Gosc")
			{
				this.username = userObject;
				this.name = userObject;
				this.gender = null;
			}
			// TODO pobrać dane uzytkownika z API po username
		}
		else if (typeof userObject === "object")
		{
			this.username = userObject.username;

			this.about = userObject.about;
			this.actions = userObject.actions;
			this.avatar = userObject.avatar;
			this.background = userObject.background;
			this.blacklist = userObject.blacklist;
			this.city = userObject.city;
			this.company = userObject.company;
			this.follow = userObject.follow || false;
			this.followers = userObject.followers;

			this.gender = userObject.gender || "null";
			this.member_since = userObject.member_since;

			this.name = userObject.name;
			this.rank = userObject.rank || null;
			this.status = userObject.status;
			this.note = userObject.note || false;
			this.online = userObject.online;
			this.public_email = userObject.public_email;
			this.social_media = userObject.social_media;
			this.summary = userObject.summary;
			this.verified = userObject.verified;
			this.website = userObject.website;

			if (typeof userObject.color == "string") this.color = { name: userObject.color }; // || { name: "orange" }; // UserColor
			else if (isUserColor(userObject.color)) this.color = userObject.color;

			this.channel = channel;
		}
	}


	get numericalOrder(): number	// "5 minut temu"
	{
		let numerical: number = 0;
		let usernameFirst5: string = this.username.substring(0, 5).toLowerCase().padEnd(5, 'a').replaceAll("_", "z").replaceAll("-", "z");
		numerical = usernameFirst5.charCodeAt(0) * 10000 + usernameFirst5.charCodeAt(1) * 1000 + usernameFirst5.charCodeAt(2) * 100 + usernameFirst5.charCodeAt(3) * 10 + usernameFirst5.charCodeAt(4);

		// if (dev) console.log(`loggedUser.numericalOrder()`);
		// if (dev) console.log(`username`, this.username);
		// if (dev) console.log(`usernameFirst5`, usernameFirst5);
		// if (dev) console.log(`numerical`, numerical);

		return numerical;
	}

}
export type UserColor = {
	name: string;
	hex?: string;
	hex_dark?: string;
}

function isUserColor(obj: any): obj is UserColor
{
	return 'name' in obj && typeof obj.name === 'string' &&
		(!obj.hex || typeof obj.hex === 'string') &&
		(!obj.hex_dark || typeof obj.hex_dark === 'string');
}


export type UserSocialMedia = {
	facebook?: string;
	instagram?: string;
	twitter?: string;
}

export type UserRank = {
	position: number;
	trend: number;
}
export type UserSummary = {
	actions: number;
	links: number;
	links_details: {
		added: number;
		commented: number;
		published: number;
		related: number;
		up: number;
		down: number;
	};
	entries: number;
	entries_details: {
		added: number;
		commented: number;
		voted: number;
	};
	followers: number;
	following_users: number;
	following_tags: number;
};


export type EntryActions = {
	update?: boolean;
	delete?: boolean;
	vote_up?: boolean;
	create_favourite?: boolean;
	delete_favourite?: boolean;
	report?: boolean;
}

export type UserActions = {
	update?: boolean;
	update_gender?: boolean;
	update_note?: boolean;
	blacklist?: boolean;
	follow?: boolean;
}
export type TagActions = {
	report?: boolean,
	delete?: boolean;
	create_coauthor: boolean;
	delete_coauthor: boolean;
	update: boolean;
	blacklist: boolean;
}

export class HTTPError extends Error
{
	status: number;
	constructor(message: string, status: number)
	{
		super(message);
		this.status = status;
	}
}


export interface Sounds  
{
	logged_in?: HTMLAudioElement,
	logged_out?: HTMLAudioElement,
	incoming_entry?: HTMLAudioElement,
	incoming_comment?: HTMLAudioElement,
	incoming_mention?: HTMLAudioElement,
	outgoing_entry?: HTMLAudioElement,
	outgoing_comment?: HTMLAudioElement
}


export interface channelSpecial
{
	urlPath: string,
	selector: string,

	name?: string,
	description?: string,
	tabTitle?: string
}