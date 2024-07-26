import * as CONST from './const.js';
// import { dev } from './index.js';
declare let dev: boolean;

import { settings } from './settings.js';
import * as notifications from './wykop_notifications.js';


import { loggedUser } from './login.js';

let test = "test";

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
import { differenceInMinutes } from "../../node_modules/date-fns/differenceInMinutes.mjs";

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

	name: string;			 // nie zawiera underscore
	nameUnderscore?: string; // kanały z nazwą heheszki_ zamienia potem w URL na heheszki-

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
				this.name = tag.replaceAll(/_+$/g, "");	// usuwa wszystkie ___ z końca tagu 
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
			// if (dev) console.log("Tag constructor().init() -> data from API for tag", this);

		}
		catch (error)
		{
			console.error('Error:', error);
		}
	}

}


export type LoadingStatus = "before" | "preloaded" | "loaded";

export type EntriesFetchType = {
	type: EntriesFetchTypeTypes,
	hotTimespan?: EntriesFetchTypeHotTimespan,
}
export type EntriesFetchTypeTypes = "newest" | "active" | "hot";
export type EntriesFetchTypeHotTimespan = "1" | "2" | "3" | "6" | "12" | "24";

export type EntriesFilters =
	{
		maxCount?: number,
		timespanHours?: number,
		tagsArray?: string[],
		tagsNamesArray?: string[],
		ChannelObject?: Channel,
	}




/* CHANNELS */

export type ChannelType = "tag" | "pm" | "pm_room";

export class Channel 
{
	type?: ChannelType; // "tag" | "pm" | "pm_room"

	/* DB */
	sendCount?: number;
	isFavorite?: number;
	lastVisited?: Date;
	visitedCount?: number;

	loadingStatus?: LoadingStatus;	// "before"
	name: string;					// bez _ jesli kategoria
	nameBase64?: string				// base64 encoded for PM
	nameUnderscore?: string; 		// including kanalzero_ gdy kategorie

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

	constructor(tagOrUser: Tag | User | string | Channel)
	{
		this.loadingStatus = "before";

		this.users = new Map<string, User>();
		this.unreadMessagesCount = 0;
		this.unreadMentionsCount = 0;

		if (typeof tagOrUser == "object")
		{
			this.name = (tagOrUser as Channel).name;
			this.sendCount = (tagOrUser as Channel).sendCount;
			this.isFavorite = (tagOrUser as Channel).isFavorite;
			this.lastVisited = (tagOrUser as Channel).lastVisited;
			this.visitedCount = (tagOrUser as Channel).visitedCount;
		}

		this.elements =
		{
			channelFeed: null,
			messagesContainer: null,
			usersListContainer: null,
			newMessageTextarea: null,
			newMessageTextareaContainer: null
		}

	}

	addEntryOrCommentToChannelObject(ChannelObject: Channel, MessageObject: Message<Channel, MessageActions>)
	{

	}


	// returns ["aaaa", "bbbb", "cccc"]
	get usernamesArray()
	{
		return Array.from(this.users.keys()).sort();
	}

}
export class ChannelTag extends Channel
{
	discussionViewEntryId?: number; // widok wybranej dyskusji i odpowiadania

	pagination: {
		next: string,
		prev: string
	};

	tag: Tag;

	entries: Map<number, Entry>;	// <1234567, Entry>
	comments: Map<number, Comment>;	// <2345678912, Comment>


	constructor(tag: Tag)
	{
		super(tag);
		this.type = "tag";

		this.name = tag.name;
		this.nameUnderscore = tag.nameUnderscore || tag.name; // nameUnderscore zawiera "_" na koncu, a w name zamieniony na "-"
		this.nameBase64 = this.tagID;

		this.tag = tag;
		this.entries = new Map<number, Entry>();
		this.comments = new Map<number, Comment>();

		this.pagination = {
			next: null,
			prev: null
		}

		this.printChannelDetails();
	}

	get tagID(): string
	{
		return fn.encodeUsernamesToBase64roomID([this.name]);
	}

	printChannelDetails()
	{
		// if (dev) console.log(`Channel name: ${this.name}`);
	}

	addEntryOrCommentToChannelObject(ChannelObject: ChannelTag, EntryObject: Entry | Comment)
	{
		// if (dev) console.log(`T.Channel - TAG.addEntryOrCommentToChannelObject(EntryObject)`, EntryObject);

		function createProxyHandler(ChannelObject: ChannelTag, EntryObject: Entry | Comment)
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
					// if (dev) console.log(`🎃🎃 originalProperty[changedPropertyName] ${EntryObject.id} ${changedPropertyName}]`, originalProperty[changedPropertyName])
					// if (dev) console.log(`🎃🎃 EntryObject: ${EntryObject.id} EntryObject["votes"][${changedPropertyName}]`, EntryObject["votes"][changedPropertyName])
					// if (dev) console.log(`🎃🎃 EntryObject: `, EntryObject)

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
								// if (dev) console.log(`🎃 PROXY - ZMIENIŁA SIĘ LICZBA PLUSÓW WE WPISIE/KOMENTARZU: ${newValue}`);
								originalProperty[changedPropertyName] = newValue;
								ch.updateCSSPropertyOnMessageArticleElement(EntryObject, changedPropertyName, originalProperty);	// aktualizacja var(--votesUp);
							}
						}

						// UŻYTKOWNIK ZAPLUSOWAŁ WIADOMOŚĆ (np. poza czatem)
						if (changedPropertyName === 'voted')
						{
							if (newValue != originalProperty[changedPropertyName])
							{
								// if (dev) console.log(`🎃 PROXY - UŻYTKOWNIK DAŁ PLUSA: ${newValue}`);
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
								// if (dev) console.log(`🎃 PROXY - ZMIENIŁA SIĘ LICZBA komentarzy WE WPISIE: ${newValue}`);
								// if (dev) console.log("EntryObject", EntryObject);
								// if (dev) console.log("ChannelObject", ChannelObject);

								originalProperty[changedPropertyName] = newValue;
								ch.updateCSSPropertyOnMessageArticleElement(EntryObject, changedPropertyName, originalProperty);	// aktualizacja var(--commentsCount);

								// wczytanie nowych komentarzy pod wpisem
								ch.checkAndInsertNewCommentsInEntry(ChannelObject, EntryObject);
							}

							else if (changedPropertyName === 'last_checked_comments_count') 
							{
								// if (dev) console.log(`🎃 PROXY - AKTUALIZUJEMY OSTATNIĄ LICZBĘ KOMENTARZY WE WPISIE last_checked_comments_count: ${newValue}`);
								originalProperty[changedPropertyName] = newValue;
							}

							else if (changedPropertyName === 'last_checked_comments_datetime') 
							{
								// if (dev) console.log(`🎃 PROXY - AKTUALIZUJEMY OSTATNI CZAS SPRAWDZENIA WPISU last_checked_comments_datetime: ${newValue}`);
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
			const messagesCount = ChannelObject.entries.size + ChannelObject.comments.size;
			fn.innerText(`.${ChannelObject.name}_messagesCount`, String(messagesCount));		// <div>Wiadomości: <var class="heheszki_messagesCount"></var></div>
			fn.innerText(`.${ChannelObject.name}_plusesCount`, String([...ChannelObject.entries.values(), ...ChannelObject.comments.values()].reduce((sum, obj) => sum + obj.votes.up, 0)));		// <div>Plusów: <var id="channel_plusesCount"></var></div>


			const oldestEntry = Array
				.from(ChannelObject.entries.values())
				.reduce((oldest, entry) =>
					new Date(entry.created_at) < new Date(oldest.created_at) ? entry : oldest
				);


			fn.innerText(`.${ChannelObject.name}_timespan`, oldestEntry.created_at); // TODO dodać do T.Entry Date() z created_at

			const average = Math.ceil(messagesCount / (oldestEntry.created_at_MinutesAgo / 60));
			fn.innerText(`.${ChannelObject.name}_average`, String(average))

			// `${entryObject.created_at_Format("eeee BBBB")} | ${entryObject.created_at_FormatDistanceSuffix} \n${entryObject.created_at_Format("yyyy-MM-dd 'o godz.' HH:mm ")}`
		}
	}

}

export class ChannelPM extends Channel
{
	pms: Map<number, PM>;				// 		<x_id, PM>
	partner?: User;

	constructor(ChannelObject: string | Channel)
	{
		super(ChannelObject);
		this.type = "pm";
		this.pms = new Map<number, PM>();	// 		<x_id, PM>

		if (typeof ChannelObject == "string")
		{
			// TODO: multiple user names starting with @, room ID with multiple usersArrayInContent base64 ie. /@@diuhi3du2h  or /room:12iueo1i2ueoijd
			// TODO for PM use ID name base64 combined user partners
			this.name = ChannelObject;
			this.nameUnderscore = this.name;
			this.nameBase64 = this.roomID;
		}
		else if (typeof ChannelObject == "object")
		{
			this.name = (ChannelObject as Channel).name;
			this.nameUnderscore = (ChannelObject as Channel).name;
			if ((ChannelObject as ChannelPM).partner) this.partner = new User(this.partner);

			if ((ChannelObject as ChannelPM).roomID) this.nameBase64 = (ChannelObject as ChannelPM).roomID;
			else this.nameBase64 = this.roomID;
		}

		console.log("PM ROOM CREATED", this);

	}

	renameChannelBasedOnCurrentUsers()
	{
		this.name = this.usernamesArray.join("-");
		this.nameUnderscore = this.name;
		this.nameBase64 = this.roomID;
	}

	// returns base64 encoded roomID based on usernamesArray
	get roomID(): string
	{
		return fn.encodeUsernamesToBase64roomID(this.usernamesArray);
	}

	get isThisMultiplePersonRoom(): boolean
	{
		return this.users.size > 2;
	}

	addNewUserToChannelObjectUsersMap(user: User)  // dont do this, doesnt add to users list html
	{
		if (!this.users.has(user.username))
		{
			this.users.set(user.username, user); // adding users to list of users in conversation
		}
	}
	setPartnerInSinglePersonRoom()
	{
		for (let username of this.users.keys())
		{
			if (username !== loggedUser.username)
			{
				this.partner = this.users.get(username);
				return this.partner;
			}
		}
	}

	addEntryOrCommentToChannelObject(ChannelObject: ChannelPM, pmObject: PM)
	{
		this.pms.set(pmObject.x_id, pmObject);

		// if (dev) console.log(`T.Channel - PM.addEntryOrCommentToChannelObject - this.pms.set(pmObject) `, ChannelObject, pmObject);
	}

	sendSystemMessage(message: SystemMessageTypes)
	{
		// wysylanie wiadomosci do userów w pokoju
	}

	sendTransparentMessage(message: string)
	{
		alert("Komunikat z Mikroczatu: \n" + message);
	}

}
export class ChannelRoom extends ChannelPM
{
	partners?: User[];

	constructor(channelName: string)
	{
		super(channelName);
		this.type = "pm_room";
	}
}




/* MESSAGES */



export type SystemMessageTypes = "joined" | "quit";


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






export interface MessageBase
{
	content?: string;
	photo?: string | MediaPhoto;
	embed?: string | MediaEmbed;
	survey?: string | MediaSurvey;
	adult?: boolean | undefined | null;
}



export class NewMessageBodyData implements MessageBase
{
	content?: string;
	photo?: string;
	embed?: string;
	adult?: boolean | undefined | null;
	survey?: string;

	resource?: Resource;
	entry_id?: number;
	partner?: User;		// przy dodawaniu wiadomosci PM



	constructor(data: NewMessageBodyData)
	{
		if (data.content) this.content = data.content;
		if (data.photo) this.photo = data.photo;
		if (data.embed) this.embed = data.embed;
		if (data.adult) this.adult = data.adult;
		if (data.survey) this.survey = data.survey;

		// nie wysyłane do API podczas tworzenia nowej wiadomości
		if (data.resource) this.resource = data.resource;
		if (data.entry_id) this.entry_id = data.entry_id;
		if (data.partner?.username) this.partner = data.partner;
	}
}
type FlagType = "forceNewEntryFlagsArray" | "forceNewPMFlagsArray";
export type NewMessageBodyOptions =
	{
		channel?: Channel;
		resource?: Resource;
		Partner?: User;				// dla "pm"
		User?: User;				// dla "entry" i "comment"

		flag?: FlagType;

		entry_id?: number; 						// tylko dla komentarzy, gdy odpowiadamy na wpis
		entryReplyingTo?: Entry;				// wpis
		messageReplyingTo?: Entry; 				// wpis albo komentarz

		usernamesArrayInContent?: string[];		// usersArrayInContent: ["@uzytkownik1", "@uzytkownik2"]


		blockDetector?: boolean;							// do włączania BlockDetectora
		blockDetectorEntryId?: number;						// do sprawdzania BlockDetector
		blockDetectorUsername?: string;						// username: "NadiaFrance" // do sprawdzania BlockDetector
	}


export type NewMessageBodyPackage =
	{
		bodyData: NewMessageBodyData;
		options: NewMessageBodyOptions;
	}



export class Message<ChannelType, MessageActions> implements MessageBase
{

	created_at?: string;

	content?: string;
	photo?: string;
	embed?: string;
	adult?: boolean | undefined | null;
	survey?: string;

	content_parsed?: string;
	content_urls?: string[];						// array with all urls in entry
	youtube_embeds?: (string)[];					// array with all youtube embeds "j2k3hdkap3"

	author?: User;									// author: User


	actions?: MessageActions;

	media?: Media;
	resource?: Resource;	// dla PM dodajemy "pm"
	entry_id?: number; 		// przy dodawaniu komentarza pod wpisem, tutaj jest id wpisu
	// x_id?: number;		// x_id based on created_at and 3 letters username 

	device?: string;
	channel?: ChannelType;

	constructor(data: Message<ChannelType, MessageActions>)
	{
		if (data.created_at) this.created_at = data.created_at;

		if (data.content) this.content = data.content || "";
		if (data.photo) this.photo = data.photo;
		if (data.embed) this.embed = data.embed;
		if (data.adult) this.adult = data.adult;
		if (data.survey) this.survey = data.survey;
		if (data.device) this.device = data.device;

		this.media = data.media || { embed: null, photo: null, survey: null };


		// tylko WX, nie wysylane w API przy tworzeniu nowego wpisu
		this.resource = data.resource;
		if (data.entry_id) this.entry_id = data.entry_id; 	// przy dodawaniu komentarza pod wpisem, tutaj jest id wpisu

		this.content_urls = [];
		this.youtube_embeds = [];

		// wywolac w Entry/PM this.content_parse();
	}


	content_parse(): string
	{
		throw new Error('');
	}



	getMessageUser(): User
	{
		throw new Error('');
	}
	getMessageAuthor(): User
	{
		throw new Error('');
	}

	get x_id(): number // getXID(username: string): number
	{
		const timestamp = new Date(this.created_at).getTime();

		console.log(`this.author.username: ${this.author?.username} | X: timestamp: ${timestamp} this.created_at: ${this.created_at}`, this.content);

		const username = this.getMessageAuthor().username;
		const firstThreeChars = username.substring(0, 3); // first 3 letters of username

		// Convert each character to a two-digit value
		const twoDigitValues = firstThreeChars.split('').map(char =>
		{
			return (`0${char.charCodeAt(0) % 100}`).slice(-2); //  ASCII code modulo 100 to get a two-digit number
		}).join('');

		return parseInt(`${timestamp}${twoDigitValues}`); // Combine timestamp and twoDigitValues to form a numerical unique ID
	}

	isMentioningUser(username: string): boolean
	{
		const regex = new RegExp(`@${username}`, 'g');
		return regex.test(this.content);
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
	get created_at_MinutesAgo(): number		// liczba minut
	{
		return differenceInMinutes(new Date(), this.created_at_Date);
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


export class PM extends Message<ChannelPM, PMActions>
{
	type: number;	// OZNACZA AUTORA WIDOMOŚCI 1: wyslana DO ciebie, 0: wyslana OD Ciebie DO KOGOŚ
	read?: boolean;
	key?: string;

	// DODATKOWE:
	id?: string; 		// id generowane na podstawie created_at i nazwy osoby, z którą rozmawiamy
	partner?: User;		// z kim rozmawiamy
	// x_id?: number;	// from timestamp and 3 letters of username
	roomID?: string; 	// base64 encoded from URL for conversation rooms with multiple users ONLY

	constructor(data: PM, author?: User, partner?: User, channel?: ChannelPM)
	{
		super(data);

		this.type = 0 || data.type;			// KTO NAPISAŁ WIADOMOŚĆ
		this.resource = "pm";
		this.read = false || data.read;
		this.key = "" || data.key; 			// "g04G1P9g"


		this.actions = { create: false, delete: false } || data.actions; // TODO, check actions {}
		this.channel = channel;
		this.partner = partner;
		this.author = author;

		this.content_parse();
	}


	getMessageUser(): User
	{
		return this.partner;
	}

	getMessageAuthor(): User
	{
		return this.author;
	}

	content_parse(): string
	{
		// w PM content zawsze "" lub treść;
		if (!this.content || this.content === "")
		{
			this.content_parsed = "";
			this.device = "Wykop"; // brak info, ale nie Mikroczat

			return this.content_parsed;
		}

		let content_parsed: string = this.content;

		const urlRoomInfo: RoomInfoFromPM = fn.parseRoomInfoFromPMbeginning(content_parsed); 	// usuwa początkowy tekst wysłany przez mikroczat

		if (urlRoomInfo.pmIsFromMikroczat)
		{
			this.device = "Mikroczat";
			content_parsed = urlRoomInfo.parsedContent;
			this.roomID = urlRoomInfo.roomID; 				// base64 conversation from URL
			// TODO this.partner ? -> urlRoomInfo.userId
		}

		// if (dev) alert(urlRoomInfo.parsedContent);

		// #PARSING PM - private messages
		// content_parsed = fn.adds_HTTPS_to_all_non_HTTPS_URLS(content_parsed);				// dodaje https:// przed URL bez protokołu
		// content_parsed = fn.replaceAngleBrackets(content_parsed, this);						// changes < to &lt;
		// content_parsed = fn.markdownToANCHOR(content_parsed, this);							// [test](wp.pl) // zawierają już http:// nawet gdy nie był podany
		// this.content_urls = fn.return_HTTPS_URL_Array(content_parsed);						// wszystkie adresy URL z tresci wiadomosci
		// this.youtube_embeds = fn.return_only_youtube_EMBEDS_Array(this.content_urls);		// wszystkie embed youtube w treści wiadomosci
		// content_parsed = fn.parse_HTTP_URLS_to_ANCHOR(content_parsed, this);
		// content_parsed = fn.markdownBacktickToCODE(content_parsed, this); 			// `code`
		// content_parsed = fn.markdownUnderscoreToITALICS(content_parsed, this); 		//_italics_
		// content_parsed = fn.markdownAsteriskToSTRONG(content_parsed, this); 		// **tekst pogrubiony**
		// content_parsed = fn.markdownUsernameToABBR(content_parsed, this);			// @NadiaFrance
		// content_parsed = fn.markdownGtToBLOCKQUOTE(content_parsed, this);			// > cytat
		// content_parsed = fn.markdownNewLineToBR(content_parsed, this); 				// TODO add settings to parse br
		// content_parsed = fn.markdownTextToSPAN(content_parsed, this);				// <span>text</span>


		this.content_parsed = content_parsed;
		return this.content_parsed;
	}
}


export type RoomInfoFromPM =
	{
		parsedContent: string,
		pmIsFromMikroczat: boolean,
		roomID?: string,
		usernamesArray?: string[],
		userId?: string
	}


export type Resource = "entry" | "entry_comment" | "pm";

export interface EntryTemplate
{
	resource?: Resource;		// "entry", "entry_comment"

	id?: number;
	entry_id?: number;

	parent?: Entry | EntryTemplate;

	channel?: ChannelTag;
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




export class Entry extends Message<ChannelTag, EntryActions>
{
	// entry_id?: number;
	// created_at?: string;
	// resource: Resource;								// "entry", "entry_comment"
	// photo?: string;									// NewMessageBodyData
	// embed?: string;									// NewMessageBodyData
	// survey?: string;									// NewMessageBodyData
	// adult?: boolean;
	// content?: string;

	// x_id?: number;


	last_checked_comments_datetime?: Date;			// ostatni czas sprawdzenia wpisu / liczb plusow w komentarzach
	last_checked_comments_count?: number;			// liczba wczytanych komentarzy podczas ostatniego sprawdzania

	id?: number;

	votes?: Votes;
	comments?: Comments;							// comments.items: Comments[] (tylko 2 komentarze) , comments.count: number

	deleted?: boolean;
	archive?: boolean;

	// getter - created_at_Date?: Date;
	editable?: boolean;
	deletable?: boolean;
	blacklist?: boolean;

	favourite?: boolean;

	slug?: string;
	status?: string; 								// "visible"
	tags?: string[];								// ['muzyka', 'toto', 'michaeljackson', '70s', '80s', 'lifelikejukebox']
	voted?: number; 								// 1 / 0

	constructor(entryObject: Message<ChannelTag, EntryActions> | Entry, channel?: ChannelTag)
	{
		super(entryObject);

		if ('id' in entryObject)
		{
			this.resource = entryObject.resource;

			this.id = entryObject.id;
			this.entry_id = entryObject.id

			this.channel = channel;
			this.author = new User(entryObject.author);

			// z tymi w API jest problem, nie zapisuje pustych wartosci tylko undefined

			this.votes = entryObject.votes || { up: 0, down: 0, users: [] };

			// if (dev) console.log(`⛔⛔⛔ constructor ${this.id} Entry: this.votes.up ${this.votes.up}`, this.votes);


			this.deleted = entryObject.deleted || false;
			this.comments = entryObject.comments || { items: [], count: 0 };
			this.status = entryObject.status;	// "visible" tylko dla wpisu i tylko podczas pobierania wpisów ze streamu, a nie szczegolow konkretnego wpisu lub komentarza


			this.archive = entryObject.archive || false;

			this.slug = entryObject.slug;
			this.actions = entryObject.actions;
			this.tags = entryObject.tags || [];

			this.deletable = entryObject.deletable;
			this.editable = entryObject.editable;
			this.blacklist = entryObject.blacklist || false;
			this.favourite = entryObject.favourite || false;

			this.voted = entryObject.voted;



			/* tylko dla wpisów */
			this.last_checked_comments_datetime = null;
			this.last_checked_comments_count = 0;	// liczba wczytanych komentarzy podczas ostatniego sprawdzania


			this.content_parse();
		}

	}



	content_parse(): string
	{
		if (!this.content || this.content === "")
		{
			this.content_parsed = "";
			return this.content_parsed;
		}

		let content_parsed = this.content;

		// REMOVE BLACKLISTED WORDS
		let blacklist = [];
		blacklist.push('✨️ **Obserwuj** #mirkoanonim'); 					// mirkoanonim
		content_parsed = fn.removeBlacklistWords(content_parsed, blacklist);

		// BOT SPLITTERS FOOTER
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



		// if (dev) console.log("🤢")
		// if (dev) console.log("🤢, this.content: ", this.content)

		// #PARSING TAG MESSAGES
		content_parsed = fn.replaceAngleBrackets(content_parsed, this);						// 1. musi być pierwsze changes < to &lt;
		//if (dev) console.log("🤢 1. content_parsed", content_parsed)

		content_parsed = fn.markdownBacktickToCODE(content_parsed, this); 					// `code`
		//if (dev) console.log("🤢 2. content_parsed", content_parsed)

		content_parsed = fn.adds_HTTPS_to_all_non_HTTPS_URLS(content_parsed);				// dodaje https:// przed URL bez protokołu
		//if (dev) console.log("🤢 3. content_parsed", content_parsed)

		content_parsed = fn.markdownToANCHOR(content_parsed, this);							// [test](wp.pl) // zawierają już http:// nawet gdy nie był podany
		content_parsed = fn.parse_HTTP_URLS_to_ANCHOR(content_parsed, this);
		//if (dev) console.log(`🤢 4. content_parsed: [${content_parsed}]`)

		content_parsed = fn.markdownTagsToANCHOR(content_parsed, this);						// #tag

		this.content_urls = fn.return_HTTPS_URL_Array(content_parsed);						// wszystkie adresy URL z tresci wiadomosci
		this.youtube_embeds = fn.return_only_youtube_EMBEDS_Array(this.content_urls);		// wszystkie embed youtube w treści wiadomosci
		// TODO dodać do array entryObject.media?.embed?.type === "youtube" i usunąć z ch.


		// if (dev) console.log(" 🤢, content_parsed: ", content_parsed)
		// if (dev) console.log(" 🤢, this ", this)
		// if (dev) console.log(" 🤢, 	this.content_urls ", this.content_urls)
		// if (dev) console.log(" 🤢, 	this.youtube_embeds ", this.youtube_embeds)

		content_parsed = fn.markdownUnderscoreToITALICS(content_parsed, this); 		// _kursywa_
		content_parsed = fn.markdownAsteriskToSTRONG(content_parsed, this); 		// **tekst pogrubiony**
		content_parsed = fn.markdownUsernameToABBR(content_parsed, this);			// @NadiaFrance
		content_parsed = fn.markdownExclamationMarkToSPOILER(content_parsed, this);	// ! spoiler
		content_parsed = fn.markdownGtToBLOCKQUOTE(content_parsed, this);			// > cytat

		content_parsed = fn.markdownTextToSPAN(content_parsed, this);				// <span>text</span>

		//if (dev) console.log("🤢 99. content_parsed", content_parsed)
		content_parsed = fn.markdownNewLineToBR(content_parsed, this); 				// TODO add settings to parse br
		//if (dev) console.log("🤢 100. content_parsed", content_parsed)

		this.content_parsed = content_parsed;
		return this.content_parsed;
	}


	getMessageUser(): User
	{
		return this.author;
	}


	getMessageAuthor(): User
	{
		return this.author;
	}
}






export class Comment extends Entry
{
	parent?: Entry;
	//parent?: any;
	// x_id?: number;

	constructor(commentObject: Comment, channel?: ChannelTag)
	{
		super(commentObject, channel);

		this.resource = "entry_comment";

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


export type NoteObject = {
	username?: string;
	content?: string;

	dateLastUpdated?: Date;
}

export class BlockDetectorObject
{
	isBlocking?: boolean;
	isBlockingAndCanNotComment?: boolean;
	dateLastChecked?: Date;

	constructor(blockDetectorObject: BlockDetectorObject)
	{
		this.isBlocking = blockDetectorObject.isBlocking ? blockDetectorObject.isBlocking : false;
		this.isBlockingAndCanNotComment = blockDetectorObject.isBlockingAndCanNotComment ? blockDetectorObject.isBlockingAndCanNotComment : blockDetectorObject.isBlocking ? true : false;
		if (blockDetectorObject.dateLastChecked) this.dateLastChecked = blockDetectorObject.dateLastChecked;
	}
}

export interface BlockDetectorCheckOptions
{
	Entry?: Entry;
	Comment?: Comment;
	PM?: PM;

	User?: User;

	entry_id?: number;
	comment_id?: number;

	username?: string;
}


export class User
{
	username: string;
	about?: string;
	avatar?: string;
	background?: string;
	blacklist?: boolean;
	city?: string;
	company?: boolean;
	follow?: boolean;
	followers?: number;
	gender?: string;
	member_since?: string;
	name?: string;
	note?: boolean;
	online?: boolean;
	public_email?: string;

	status?: string; // "active", "banned", "suspended"

	banned?: UserBanned;
	actions?: UserActions;
	color?: UserColor;
	rank?: UserRank;
	summary?: UserSummary;
	social_media?: UserSocialMedia;


	verified?: boolean;
	website?: string;


	channel?: Channel;

	noteObject?: NoteObject;
	blockDetectorObject?: BlockDetectorObject;



	constructor(userObject: User | string, channel?: Channel)
	{
		if (typeof userObject === "string")
		{
			if (userObject === "Gosc")
			{
				this.username = userObject;
				this.name = userObject;
				this.gender = null;
			}
			else
			{
				this.username = userObject;
			}
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
			this.online = userObject.online || false;
			this.public_email = userObject.public_email;
			this.social_media = userObject.social_media;
			this.summary = userObject.summary;
			this.verified = userObject.verified;
			this.website = userObject.website;

			if (typeof userObject.color == "string") this.color = { name: userObject.color }; // || { name: "orange" }; // UserColor
			else if (isUserColor(userObject.color)) this.color = userObject.color;
			this.channel = channel;
		}
		// if (dev) console.log(`💌 User - constructor(): ${this.username}:  `, this)
		// this.initFromAPI();
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

	/*

	let example = new User("username");
	example.initFromAPI().then(() => {
		console.log(example.username);
	}).catch((error) => {
		console.error('Error:', error);
	});
*/
	async initFromAPI(): Promise<void>
	{
		try
		{
			let apiURL = `https://wykop.pl/api/v3/profile/users/${this.username}`;
			let response = await fetch(apiURL, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + window.localStorage.getItem("token"),
				},
			});

			if (dev) console.log(`user: ${this.username} - initFromAPI(): `, apiURL);
			const data = await response.json();

			if (data.data.about) this.about ??= data.data.about;
			if (data.data.avatar) this.avatar ??= data.data.avatar;
			if (data.data.background) this.background ??= data.data.background;
			if (data.data.blacklist) this.blacklist ??= data.data.blacklist;
			if (data.data.city) this.city ??= data.data.city;
			if (data.data.company) this.company ??= data.data.company || false;
			if (data.data.follow) this.follow ??= data.data.follow || false;
			if (data.data.followers) this.followers ??= data.data.followers;
			if (data.data.gender) this.gender ??= data.data.gender || "null";
			if (data.data.member_since) this.member_since ??= data.data.member_since;
			if (data.data.name) this.name ??= data.data.name;
			if (data.data.status) this.status = data.data.status;
			if (data.data.note) this.note ??= data.data.note || false;
			if (data.data.online) this.online ??= data.data.online || false;
			if (data.data.public_email) this.public_email ??= data.data.public_email;
			if (data.data.summary) this.summary ??= data.data.summary;
			if (data.data.verified) this.verified ??= data.data.verified || false;
			if (data.data.website) this.website ??= data.data.website;


			if (data.data.social_media) this.social_media ??= data.data.social_media;
			if (data.data.rank) this.rank ??= data.data.rank || null;


			if (data?.data?.color != null)
			{
				if (typeof data.data.color == "string")
				{
					this.color = { name: data.data.color }; // || { name: "orange" }; // UserColor
				}
				else if (isUserColor(data.data.color)) this.color = data.data.color;
			}

			if (data.data.actions) this.actions ??= data.data.actions;
			// if (dev) console.log("User constructor().init() -> data from API for user:", this);

		} catch (error)
		{
			console.error('Error:', error);
		}
	}

}
export type UserColor = {
	name: string;
	hex?: string;
	hex_dark?: string;
}


export class UserBanned 
{
	reason: string;
	expired: string;

	constructor(bannedJSONObject: object)
	{
		this.reason = bannedJSONObject["reason"];
		this.expired = bannedJSONObject["expired"];
	}


	get banned_Date(): Date						// Date object
	{
		return parse(this.expired, 'yyyy-MM-dd HH:mm:ss', new Date());
	}
}


function isUserColor(obj: any): obj is UserColor
{
	return 'name' in obj && typeof obj.name === 'string' &&
		(!obj.hex || typeof obj.hex === 'string') &&
		(!obj.hex_dark || typeof obj.hex_dark === 'string');
}

export type UserActions = {
	update?: boolean;
	update_gender?: boolean;
	update_note?: boolean;
	blacklist?: boolean;
	follow?: boolean;
	report?: boolean;
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


/* ACTIONS */
export type MessageActions = {
	delete?: boolean;
}

export type PMActions = MessageActions & {
	create?: boolean;
}

export type EntryActions = MessageActions & {
	update?: boolean;
	vote_up?: boolean;
	create_favourite?: boolean;
	delete_favourite?: boolean;
	report?: boolean;
}

export type CommentActions = EntryActions & {
	// TODO check
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
	incoming_pm?: HTMLAudioElement,
	incoming_mention?: HTMLAudioElement,

	outgoing_entry?: HTMLAudioElement,
	outgoing_comment?: HTMLAudioElement
	outgoing_pm?: HTMLAudioElement,
}


export interface channelSpecial
{
	urlPath: string,
	selector: string,

	name?: string,
	description?: string,
	tabTitle?: string,
	hashName?: string
}


export interface CustomEventDiscussionViewState
{
	action: string,
	channelName: string,
	replyEntryId: number | null
}

