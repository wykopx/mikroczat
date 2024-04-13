import * as CONST from './const.js';
import { tokensObject, checkAndInsertNewCommentsInEntry, updateCSSPropertyOnMessageArticleElement } from './index.js';
import { pl } from "../node_modules/date-fns/locale.mjs";
import { parse } from "../node_modules/date-fns/parse.mjs";
import { format } from "../node_modules/date-fns/format.mjs";
import { getUnixTime } from "../node_modules/date-fns/getUnixTime.mjs";
import { formatDistance } from "../node_modules/date-fns/formatDistance.mjs";
import * as fn from './fn.js';
export const proxies = new WeakSet();
export class Tag {
    name;
    created_at;
    author;
    personal;
    description;
    blacklist;
    editable;
    followers;
    follow;
    notifications;
    promoted;
    media;
    actions;
    constructor(tag) {
        if (typeof tag === "string") {
            this.name = tag;
        }
        else {
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
    async initFromAPI() {
        try {
            let response = await fetch(`${CONST.apiPrefixURL}/tags/${this.name}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + tokensObject.token,
                },
            });
            let data = await response.json();
            if (data.data.name)
                this.name ??= data.data.name;
            if (data.data.created_at)
                this.created_at ??= data.data.created_at;
            if (data.data.author)
                this.author ??= new User(data.data.author);
            if (data.data.personal)
                this.personal ??= data.data.personal;
            if (data.data.description)
                this.description ??= data.data.description;
            if (data.data.blacklist)
                this.blacklist ??= data.data.blacklist;
            if (data.data.editable)
                this.editable ??= data.data.editable;
            if (data.data.followers)
                this.followers ??= data.data.followers;
            if (data.data.follow)
                this.follow ??= data.data.follow;
            if (data.data.notifications)
                this.notifications ??= data.data.notifications;
            if (data.data.promoted)
                this.promoted ??= data.data.promoted;
            if (data.data.media)
                this.media ??= data.data.media;
            if (data.data.actions)
                this.actions ??= data.data.actions;
            console.log("Tag constructor().init() -> data from API for tag", this);
        }
        catch (error) {
            console.error('Error:', error);
        }
    }
}
export class Channel {
    pagination;
    tag;
    name;
    entries;
    comments;
    users;
    element;
    messagesContainer;
    usersListContainer;
    constructor(tag) {
        this.tag = tag;
        this.name = tag.name;
        this.entries = new Map();
        this.comments = new Map();
        this.users = new Map();
        this.element = null;
        this.messagesContainer = null;
        this.usersListContainer = null;
        this.pagination = {
            next: null,
            prev: null
        };
        this.printChannelDetails();
    }
    printChannelDetails() {
        console.log(`Channel name: ${this.name}`);
    }
    addEntryOrCommentToChannelObject(ChannelObject, EntryObject) {
        console.log(`T.Channel.addEntryOrCommentToChannelObject(EntryObject)`, EntryObject);
        function createProxyHandler(ChannelObject, EntryObject) {
            return {
                get: function (target, prop) {
                    if (typeof target[prop] === 'object' && target[prop] !== null) {
                        return new Proxy(target[prop], this);
                    }
                    else {
                        return target[prop];
                    }
                },
                set: function (originalProperty, changedPropertyName, newValue) {
                    if (originalProperty[changedPropertyName] !== newValue) {
                        if (EntryObject.resource === "entry" && changedPropertyName === 'count') {
                            console.log(`🎃 PROXY - ZMIENIŁA SIĘ LICZBA komentarzy WE WPISIE: ${newValue}`);
                            console.log("EntryObject", EntryObject);
                            console.log("ChannelObject", ChannelObject);
                            originalProperty[changedPropertyName] = newValue;
                            updateCSSPropertyOnMessageArticleElement(EntryObject, changedPropertyName, originalProperty);
                            checkAndInsertNewCommentsInEntry(ChannelObject, EntryObject);
                        }
                        if (changedPropertyName === 'up') {
                            console.log(`🎃 PROXY - ZMIENIŁA SIĘ LICZBA PLUSÓW WE WPISIE/KOMENTARZU: ${newValue}`);
                            originalProperty[changedPropertyName] = newValue;
                            updateCSSPropertyOnMessageArticleElement(EntryObject, changedPropertyName, originalProperty);
                        }
                        if (changedPropertyName === 'voted') {
                            console.log(`🎃 PROXY - UŻYTKOWNIK DAŁ PLUSA: ${newValue}`);
                            originalProperty[changedPropertyName] = newValue;
                            updateCSSPropertyOnMessageArticleElement(EntryObject, changedPropertyName, originalProperty);
                        }
                        return true;
                    }
                }
            };
        }
        EntryObject = new Proxy(EntryObject, createProxyHandler(ChannelObject, EntryObject));
        if (EntryObject.resource === "entry_comment") {
            this.comments.set(EntryObject.id, EntryObject);
        }
        if (EntryObject.resource === "entry") {
            this.entries.set(EntryObject.id, EntryObject);
        }
    }
}
export class Entry {
    last_checked_comments_datetime;
    last_checked_comments_count;
    id;
    entry_id;
    resource;
    channel;
    author;
    media;
    votes;
    comments;
    actions;
    deleted;
    adult;
    archive;
    content;
    created_at;
    deletable;
    device;
    editable;
    favourite;
    slug;
    status;
    tags;
    voted;
    constructor(entryObject, channel) {
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
    content_parsed() {
        let content_parsed = this.content;
        let blacklist = [];
        blacklist.push('✨️ **Obserwuj** #mirkoanonim');
        let removeBlacklistWords = (text, blacklist) => (blacklist.forEach(word => text = text.split(word).join('')), text);
        content_parsed = removeBlacklistWords(content_parsed, blacklist);
        const splitters = ["---"];
        splitters.push("─────────────────────");
        splitters.push("_______________________________________");
        splitters.push("Wpis został dodany za pomocą");
        splitters.push("[Regulamin](https://barylkakrwi.org/regulamin)");
        splitters.push("! #januszowybot <- obserwuj/czarnolistuj");
        for (let splitter of splitters) {
            const parts = content_parsed?.split(splitter);
            if (parts && parts.length > 1) {
                content_parsed = parts[0];
            }
        }
        content_parsed = fn.replaceAngleBrackets(content_parsed);
        content_parsed = fn.markdownBacktickToCode(content_parsed);
        content_parsed = fn.markdownUnderscoreToItalics(content_parsed);
        content_parsed = fn.markdownAsteriskToStrong(content_parsed);
        content_parsed = fn.markdownUsernameToAbbr(content_parsed);
        content_parsed = fn.markdownGtToBlockquote(content_parsed);
        content_parsed = fn.markdownExclamationMarkToSpoiler(content_parsed);
        content_parsed = fn.markdownToLink(content_parsed);
        content_parsed = fn.parseURLToLink(content_parsed);
        content_parsed = fn.markdownNewLineToBr(content_parsed);
        content_parsed = fn.markdownTagsToLink(content_parsed, this.channel.name);
        content_parsed = fn.markdownTextToSpan(content_parsed);
        return content_parsed;
    }
    get created_at_Date() {
        return parse(this.created_at, 'yyyy-MM-dd HH:mm:ss', new Date());
    }
    get created_at_Timestamp() {
        return getUnixTime(this.created_at_Date);
    }
    get created_at_FormatDistance() {
        return formatDistance(this.created_at_Date, new Date(), { addSuffix: false, locale: pl });
    }
    get created_at_FormatDistanceSuffix() {
        return formatDistance(this.created_at_Date, new Date(), { addSuffix: true, locale: pl });
    }
    created_at_Format(formatString) {
        return format(this.created_at_Date, formatString, { locale: pl });
    }
    get created_at_Time() {
        return format(this.created_at_Date, 'HH:mm');
    }
    get created_at_YYYY_MM_DD() {
        return format(this.created_at_Date, 'yyyy-MM-dd');
    }
    get created_at_e() {
        return format(this.created_at_Date, 'e', { locale: pl });
    }
    get created_at_ee() {
        return format(this.created_at_Date, 'ee', { locale: pl });
    }
    get created_at_eee() {
        return format(this.created_at_Date, 'eee', { locale: pl });
    }
    get created_at_eeee() {
        return format(this.created_at_Date, 'eeee', { locale: pl });
    }
}
export class Comment extends Entry {
    parent;
    constructor(commentObject, channel) {
        super(commentObject, channel);
        this.entry_id = commentObject.parent.id;
        this.parent = new Entry(commentObject.parent, channel);
    }
}
export class User {
    username;
    about;
    avatar;
    actions;
    background;
    blacklist;
    city;
    color;
    company;
    follow;
    followers;
    gender;
    member_since;
    name;
    note;
    online;
    public_email;
    rank;
    summary;
    social_media;
    status;
    verified;
    website;
    channel;
    constructor(userObject, channel) {
        if (typeof userObject === "string") {
        }
        else if (typeof userObject === "object") {
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
            if (typeof userObject.color == "string")
                this.color = { name: userObject.color };
            else if (isUserColor(userObject.color))
                this.color = userObject.color;
            this.channel = channel;
        }
    }
    get numericalOrder() {
        let numerical = 0;
        let usernameFirst5 = this.username.substring(0, 5).toLowerCase().padEnd(5, 'a').replaceAll("_", "z").replaceAll("-", "z");
        numerical = usernameFirst5.charCodeAt(0) * 10000 + usernameFirst5.charCodeAt(1) * 1000 + usernameFirst5.charCodeAt(2) * 100 + usernameFirst5.charCodeAt(3) * 10 + usernameFirst5.charCodeAt(4);
        console.log(`user.numericalOrder()`);
        console.log(`username`, this.username);
        console.log(`usernameFirst5`, usernameFirst5);
        console.log(`numerical`, numerical);
        return numerical;
    }
}
function isUserColor(obj) {
    return 'name' in obj && typeof obj.name === 'string' &&
        (!obj.hex || typeof obj.hex === 'string') &&
        (!obj.hex_dark || typeof obj.hex_dark === 'string');
}
//# sourceMappingURL=types.js.map