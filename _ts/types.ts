import * as CONST from './const.js';
import { tokensObject, checkAndInsertNewCommentsInEntry, updateCSSPropertyOnMessageArticleElement } from './index.js';

import { pl } from "../node_modules/date-fns/locale.mjs";
import { parse } from "../node_modules/date-fns/parse.mjs";
import { format } from "../node_modules/date-fns/format.mjs";
import { subDays } from "../node_modules/date-fns/subDays.mjs";
import { parseJSON } from "../node_modules/date-fns/parseJSON.mjs";
import { getUnixTime } from "../node_modules/date-fns/getUnixTime.mjs";
import { formatDistance } from "../node_modules/date-fns/formatDistance.mjs";

import * as fn from './fn.js';


export const proxies = new WeakSet(); // do usunięcia


export type TokensObject = {
	token?: string;
	refresh_token?: string;
	username?: string;
};

type TokenType = "token" | "userKeep" | "refresh_token";
export interface UnknownToken
{
	tokenValue: string;
	tokenType?: TokenType;
}

interface TagObject
{
	name: string;
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
// let tag = new Tag(tagObject)
export class Tag 
{
	name: string;
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
			this.name = tag;
		}
		else
		{
			this.name = tag.name;
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
			let response = await fetch(`${CONST.apiPrefixURL}/tags/${this.name}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + tokensObject.token,
				},
			});
			let data = await response.json();
			if (data.data.name) this.name ??= data.data.name
			if (data.data.created_at) this.created_at ??= data.data.created_at
			if (data.data.author) this.author ??= new User(data.data.author);
			if (data.data.personal) this.personal ??= data.data.personal
			if (data.data.description) this.description ??= data.data.description
			if (data.data.blacklist) this.blacklist ??= data.data.blacklist
			if (data.data.editable) this.editable ??= data.data.editable
			if (data.data.followers) this.followers ??= data.data.followers
			if (data.data.follow) this.follow ??= data.data.follow
			if (data.data.notifications) this.notifications ??= data.data.notifications
			if (data.data.promoted) this.promoted ??= data.data.promoted
			if (data.data.media) this.media ??= data.data.media
			if (data.data.actions) this.actions ??= data.data.actions
			console.log("Tag constructor().init() -> data from API for tag", this)
		} catch (error)
		{
			console.error('Error:', error);
		}
	}

}

export class Channel
{

	pagination: {
		next: string,
		prev: string
	};

	tag: Tag;
	name: string;

	entries: Map<number, Entry>;	// <1234567, Entry>
	comments: Map<number, Comment>;	// <2345678912, Comment>

	users: Map<string, User>;
	element: HTMLElement;
	messagesContainer: HTMLElement;

	constructor(tag: Tag)
	{
		this.tag = tag;
		this.name = tag.name;

		this.entries = new Map<number, Entry>();
		this.comments = new Map<number, Comment>();

		this.users = new Map<string, User>();
		this.element = null;
		this.messagesContainer = null;

		this.pagination = {
			next: null,
			prev: null
		}
		this.printChannelDetails();
	}

	printChannelDetails()
	{
		console.log(`Channel name: ${this.name}`);
	}

	addEntryOrCommentToChannelObject(ChannelObject: Channel, EntryObject: Entry | Comment)
	{
		console.log(`T.Channel.addEntryOrCommentToChannelObject(EntryObject)`, EntryObject);

		function createProxyHandler(ChannelObject: Channel, EntryObject: Entry | Comment)
		{
			return {
				// get: function (originalObject: Votes | Comments, property: string, proxyObject: any)
				// {
				// 	console.log(`Proxy (get) of property: [${property}]`);
				// 	return originalObject[property];
				// },

				set: function (originalObject: Votes | Comments, propertyName: string, newValue: any)
				{
					// console.log(`🎃 PROXY handler`);
					// console.log(`🎃 proxyObject`, originalObject);						// { items: [2 items], count: 8 }
					// console.log(`🎃 EntryObject.votes`, EntryObject.votes);
					// console.log(`🎃 EntryObject.comments`, EntryObject.comments);
					// console.log(`🎃 propertyName`, propertyName);										// "count" / "up"
					// console.log(`🎃 proxyObject[propertyName]`, originalObject[propertyName]);				// 8 - wartosc przed zmianą
					// console.log(`🎃 newValue`, newValue);												// 9 - wartosc po zmianie
					// console.log(`🎃 proxyObject[propertyName] !== value`, originalObject[propertyName] !== newValue);	// czy nastąpiła nastąpiła zmiana


					if (originalObject[propertyName] !== newValue)
					{

						if (propertyName === 'count' && EntryObject.resource === "entry")
						{
							console.log(`🎃 PROXY - ZMIENIŁA SIĘ LICZBA komentarzy WE WPISIE: ${newValue}`);
							console.log("EntryObject", EntryObject);
							console.log("ChannelObject", ChannelObject);

							originalObject[propertyName] = newValue;

							updateCSSPropertyOnMessageArticleElement(EntryObject, originalObject);	// aktualizacja var(--commentsCount);

							// wczytanie nowych komentarzy pod wpisem
							checkAndInsertNewCommentsInEntry(ChannelObject, EntryObject);
						}

						if (propertyName === 'up' && originalObject[propertyName] !== newValue)
						{
							console.log(`🎃 PROXY - ZMIENIŁA SIĘ LICZBA PLUSÓW WE WPISIE/KOMENTARZU: ${newValue}`);
							originalObject[propertyName] = newValue;

							updateCSSPropertyOnMessageArticleElement(EntryObject, originalObject);	// aktualizacja var(--votesUp);
						}


						return true;
					}
				}
			};
		}


		if (EntryObject.resource === "entry_comment")
		{
			// Proxy obserwujące  liczbę plusów
			EntryObject.votes = new Proxy(EntryObject.votes, createProxyHandler(ChannelObject, EntryObject)) as Votes;
			proxies.add(EntryObject.votes);

			this.comments.set(EntryObject.id, EntryObject);
		}

		if (EntryObject.resource === "entry")
		{
			// Proxy obserwujące liczbę komentarzy i liczbę plusów
			EntryObject.votes = new Proxy(EntryObject.votes, createProxyHandler(ChannelObject, EntryObject)) as Votes;
			EntryObject.comments = new Proxy(EntryObject.comments, createProxyHandler(ChannelObject, EntryObject)) as Comments;

			proxies.add(EntryObject.votes);
			proxies.add(EntryObject.comments);

			this.entries.set(EntryObject.id, EntryObject);
			// this.entries.set(EntryObject.entry_id, EntryObject);

		}
	}
}








export class Entry
{
	last_checked_comments_datetime: string;
	last_checked_comments_count?: number;	// liczba wczytanych komentarzy podczas ostatniego sprawdzania

	id: number;
	entry_id: number;
	resource: string;		// "entry", "entry_comment"

	channel?: Channel;
	author: User;			// author: User
	media?: Media;
	votes?: Votes;
	comments?: Comments;	// comments.items: Comments[] (tylko 2 komentarze) , comments.count: number

	actions?: EntryActions;

	deleted?: boolean;
	adult?: boolean;
	archive?: boolean;

	content?: string;
	created_at?: string;
	// getter - created_at_Date?: Date;
	deletable?: boolean;
	device?: string;
	editable?: boolean;
	favourite?: boolean;

	slug?: string;
	status?: string; 		// "visible"
	tags?: [string];		// ['muzyka', 'toto', 'michaeljackson', '70s', '80s', 'lifelikejukebox']
	voted?: number; 		// 1 / 0

	constructor(entryObject: any, channel?: Channel)
	{
		this.id = entryObject.id;
		this.entry_id = entryObject.id;
		this.resource = entryObject.resource;

		this.channel = channel;
		this.author = new User(entryObject.author);
		this.media = entryObject.media;
		this.votes = entryObject.votes;

		this.comments = entryObject.comments;
		this.last_checked_comments_count = 0;

		this.actions = entryObject.actions;

		this.deleted = entryObject.deleted;
		this.adult = entryObject.adult;
		this.archive = entryObject.archive;
		this.content = entryObject.content;
		this.created_at = entryObject.created_at;
		this.deletable = entryObject.deletable;
		this.device = entryObject.device;
		this.editable = entryObject.editable;
		this.favourite = entryObject.favourite;
		this.slug = entryObject.slug;
		this.status = entryObject.status;
		this.tags = entryObject.tags;
		this.voted = entryObject.voted;
	}

	content_parsed(): string
	{
		let content_parsed = this.content;
		let blacklist = []; // replace with your blacklist words
		blacklist.push('✨️ **Obserwuj** #mirkoanonim'); // mirkoanonim

		let removeBlacklistWords = (text: string, blacklist: string[]) => (blacklist.forEach(word => text = text.split(word).join('')), text);
		content_parsed = removeBlacklistWords(content_parsed, blacklist);



		const splitters = ["---"]; // standardowa stopka Wykopu
		splitters.push("─────────────────────");	// mikroanonim
		splitters.push("_______________________________________"); // wykop-gpt
		splitters.push("Wpis został dodany za pomocą"); // skrypt https://barylkakrwi.org/skrypt
		splitters.push("[Regulamin](https://barylkakrwi.org/regulamin)"); // KrwawyBot
		splitters.push("! #januszowybot <- obserwuj/czarnolistuj"); // JanuszowyBot



		for (let splitter of splitters)
		{
			const parts = content_parsed?.split(splitter);
			if (parts && parts.length > 1)
			{
				content_parsed = parts[0];
			}
		}

		content_parsed = fn.replaceAngleBrackets(content_parsed);	// change < to &lt;
		content_parsed = fn.markdownBacktickToCode(content_parsed);
		content_parsed = fn.markdownUnderscoreToItalics(content_parsed);
		content_parsed = fn.markdownAsteriskToStrong(content_parsed);
		content_parsed = fn.markdownUsernameToAbbr(content_parsed);
		content_parsed = fn.markdownGtToBlockquote(content_parsed);
		content_parsed = fn.markdownExclamationMarkToSpoiler(content_parsed);
		content_parsed = fn.markdownToLink(content_parsed);
		content_parsed = fn.parseURLToLink(content_parsed);
		content_parsed = fn.markdownNewLineToBr(content_parsed); // TODO add settings to parse br
		content_parsed = fn.markdownTagsToLink(content_parsed, this.channel.name);
		content_parsed = fn.markdownTextToSpan(content_parsed);



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
		return formatDistance(this.created_at_Date, new Date(), { addSuffix: false, locale: pl })
	}

	get created_at_FormatDistanceSuffix(): string	// "5 minut temu"
	{
		return formatDistance(this.created_at_Date, new Date(), { addSuffix: true, locale: pl })
	}

	// https://github.com/date-fns/date-fns/blob/main/CHANGELOG.md
	// created_at_Format("HH:mm:ss") -> // "23:59:59"
	created_at_Format(formatString: string): string
	{
		return format(this.created_at_Date, formatString, { locale: pl });
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
		return format(this.created_at_Date, 'e', { locale: pl });
	}
	get created_at_ee(): string	// 01
	{
		return format(this.created_at_Date, 'ee', { locale: pl });
	}
	get created_at_eee(): string // pon.
	{
		return format(this.created_at_Date, 'eee', { locale: pl });
	}
	get created_at_eeee(): string	// poniedziałek
	{
		return format(this.created_at_Date, 'eeee', { locale: pl });
	}
}






export class Comment extends Entry
{
	parent?: Entry;

	constructor(commentObject: any, channel?: Channel)
	{
		super(commentObject, channel);
		this.entry_id = commentObject.parent.id;
		this.parent = new Entry(commentObject.parent, channel);
	}
}

export type Comments = {
	items: Comments[];
	count: number;
}

export type Votes = {
	up: number;
	down: number;
	users?: [object]; // [User]
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
	gender?: string;
	avatar?: string;
	status?: string; // "active", "banned", "suspended"
	note?: boolean;
	online?: boolean;
	verified?: boolean;
	follow?: boolean;
	color?: UserColor;
	rank?: UserRank;
	actions?: UserActions;
}

export class User
{
	username: string;
	gender?: string;
	avatar?: string;
	status?: string; // "active", "banned", "suspended"
	note?: boolean;
	online?: boolean;
	verified?: boolean;
	follow?: boolean;
	color?: UserColor;
	rank?: UserRank;
	actions?: UserActions;

	constructor(userObject: UserObject)
	{
		this.username = userObject.username;
		this.gender = userObject.gender || null;
		this.avatar = userObject.avatar;
		this.status = userObject.status;
		this.note = userObject.note || false;
		this.online = userObject.online;
		this.verified = userObject.verified;
		this.follow = userObject.follow || false;
		if (typeof userObject.color == "string") this.color = { name: userObject.color }; // || { name: "orange" }; // UserColor
		else if (isUserColor(userObject.color)) this.color = userObject.color;

		this.rank = userObject.rank || null;
		this.actions = userObject.actions;
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


export type UserRank = {
	position: number;
	trend: number;
}

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