import { settings } from './settings.js';
import * as ch from './ch.js';
import { setDefaultOptions } from "../../node_modules/date-fns/setDefaultOptions.mjs";
import { pl } from "../../node_modules/date-fns/locale.mjs";
setDefaultOptions({ locale: pl });
import { parse } from "../../node_modules/date-fns/parse.mjs";
import { format } from "../../node_modules/date-fns/format.mjs";
import { getUnixTime } from "../../node_modules/date-fns/getUnixTime.mjs";
import { formatDistance } from "../../node_modules/date-fns/formatDistance.mjs";
import { differenceInSeconds } from "../../node_modules/date-fns/differenceInSeconds.mjs";
import * as fn from './fn.js';
export const proxies = new WeakSet();
export class Tag {
    name;
    nameUnderscore;
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
            if (tag.endsWith("_")) {
                this.name = tag.replaceAll(/_+$/g, "");
                this.nameUnderscore = tag;
            }
            else
                this.name = tag;
        }
        else {
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
    async initFromAPI() {
        try {
            let response = await fetch(`https://wykop.pl/api/v3/tags/${this.name}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + window.localStorage.getItem("token"),
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
            if (dev)
                console.log("Tag constructor().init() -> data from API for tag", this);
        }
        catch (error) {
            console.error('Error:', error);
        }
    }
}
export class Channel {
    loadingStatus;
    discussionViewEntryId;
    pagination;
    tag;
    name;
    nameUnderscore;
    entries;
    comments;
    unreadMessagesCount;
    unreadMentionsCount;
    users;
    elements;
    constructor(tag) {
        this.loadingStatus = "before";
        this.tag = tag;
        this.name = tag.name;
        this.nameUnderscore = tag.nameUnderscore || tag.name;
        this.entries = new Map();
        this.comments = new Map();
        this.unreadMessagesCount = 0;
        this.unreadMentionsCount = 0;
        this.users = new Map();
        this.elements =
            {
                channelFeed: null,
                messagesContainer: null,
                usersListContainer: null,
                newMessageTextarea: null,
                newMessageTextareaContainer: null
            };
        this.pagination = {
            next: null,
            prev: null
        };
        this.printChannelDetails();
    }
    printChannelDetails() {
        if (dev)
            console.log(`Channel name: ${this.name}`);
    }
    addEntryOrCommentToChannelObject(ChannelObject, EntryObject) {
        if (dev)
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
                    if (newValue != null && originalProperty != null) {
                        if (changedPropertyName === 'up') {
                            if (newValue != originalProperty[changedPropertyName]) {
                                if (dev)
                                    console.log(`🎃 PROXY - ZMIENIŁA SIĘ LICZBA PLUSÓW WE WPISIE/KOMENTARZU: ${newValue}`);
                                originalProperty[changedPropertyName] = newValue;
                                ch.updateCSSPropertyOnMessageArticleElement(EntryObject, changedPropertyName, originalProperty);
                            }
                        }
                        if (changedPropertyName === 'voted') {
                            if (newValue != originalProperty[changedPropertyName]) {
                                if (dev)
                                    console.log(`🎃 PROXY - UŻYTKOWNIK DAŁ PLUSA: ${newValue}`);
                                originalProperty[changedPropertyName] = newValue;
                                ch.updateCSSPropertyOnMessageArticleElement(EntryObject, changedPropertyName, originalProperty);
                            }
                        }
                        if (EntryObject.resource === "entry") {
                            if (changedPropertyName === 'count') {
                                if (dev)
                                    console.log(`🎃 PROXY - ZMIENIŁA SIĘ LICZBA komentarzy WE WPISIE: ${newValue}`);
                                if (dev)
                                    console.log("EntryObject", EntryObject);
                                if (dev)
                                    console.log("ChannelObject", ChannelObject);
                                originalProperty[changedPropertyName] = newValue;
                                ch.updateCSSPropertyOnMessageArticleElement(EntryObject, changedPropertyName, originalProperty);
                                ch.checkAndInsertNewCommentsInEntry(ChannelObject, EntryObject);
                            }
                            else if (changedPropertyName === 'last_checked_comments_count') {
                                if (dev)
                                    console.log(`🎃 PROXY - AKTUALIZUJEMY OSTATNIĄ LICZBĘ KOMENTARZY WE WPISIE last_checked_comments_count: ${newValue}`);
                                originalProperty[changedPropertyName] = newValue;
                            }
                            else if (changedPropertyName === 'last_checked_comments_datetime') {
                                if (dev)
                                    console.log(`🎃 PROXY - AKTUALIZUJEMY OSTATNI CZAS SPRAWDZENIA WPISU last_checked_comments_datetime: ${newValue}`);
                                if (typeof newValue === "string")
                                    originalProperty[changedPropertyName] = new Date(newValue);
                                else if (newValue instanceof Date)
                                    originalProperty[changedPropertyName] = newValue;
                            }
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
            if (settings.css.main.channelStats != "disabled")
                fn.innerText(`.${ChannelObject.name}_entriesCount`, String(ChannelObject.entries.size));
        }
        if (settings.css.main.channelStats != "disabled") {
            fn.innerText(`.${ChannelObject.name}_messagesCount`, String(ChannelObject.entries.size + ChannelObject.comments.size));
            fn.innerText(`.${ChannelObject.name}_plusesCount`, String([...ChannelObject.entries.values(), ...ChannelObject.comments.values()].reduce((sum, obj) => sum + obj.votes.up, 0)));
            fn.innerText(`.${ChannelObject.name}_timespan`, String(Array.from(ChannelObject.entries.values())
                .reduce((oldest, entry) => new Date(entry.created_at) < new Date(oldest) ? entry.created_at : oldest, new Date())));
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
    photo;
    embed;
    survey;
    votes;
    comments;
    actions;
    deleted;
    adult;
    archive;
    content;
    created_at;
    editable;
    deletable;
    blacklist;
    device;
    favourite;
    slug;
    status;
    tags;
    voted;
    constructor(entryObject, channel) {
        if ('id' in entryObject) {
            this.resource = entryObject.resource;
            this.id = entryObject.id;
            this.entry_id = entryObject.id;
            this.channel = channel;
            this.author = new User(entryObject.author);
            this.media = entryObject.media || { embed: null, photo: null, survey: null };
            this.votes = entryObject.votes || { up: 0, down: 0, users: [] };
            if (dev)
                console.log(`⛔⛔⛔ constructor ${this.id} Entry: this.votes.up ${this.votes.up}`, this.votes);
            this.deleted = entryObject.deleted || false;
            this.comments = entryObject.comments || { items: [], count: 0 };
            this.status = entryObject.status;
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
            this.last_checked_comments_datetime = null;
            this.last_checked_comments_count = 0;
        }
        else {
            this.resource = entryObject.resource;
            this.content = entryObject.content;
            this.adult = entryObject.adult;
            this.entry_id = entryObject.entry_id;
            this.photo = entryObject.photo;
            this.embed = entryObject.embed;
            this.survey = entryObject.survey;
        }
    }
    isMentioningUser(username) {
        const regex = new RegExp(`@${username}`, 'g');
        return regex.test(this.content);
    }
    content_parsed() {
        if (!this.content)
            return "";
        let content_parsed = this.content;
        let blacklist = [];
        blacklist.push('✨️ **Obserwuj** #mirkoanonim');
        content_parsed = fn.removeBlacklistWords(content_parsed, blacklist);
        const splitters = ["---"];
        splitters.push("─────────────────────");
        splitters.push("_______________________________________");
        splitters.push("Wpis został dodany za pomocą");
        splitters.push("[Regulamin](https://barylkakrwi.org/regulamin)");
        splitters.push("! #januszowybot <- obserwuj/czarnolistuj");
        splitters.push("\n[Więcej info](https://wykop.pl/wpis/71002147)");
        for (let splitter of splitters) {
            const parts = content_parsed?.split(splitter);
            if (parts && parts.length > 1) {
                content_parsed = parts[0];
            }
        }
        content_parsed = fn.replaceAngleBrackets(content_parsed, this);
        content_parsed = fn.markdownBacktickToCODE(content_parsed, this);
        content_parsed = fn.markdownUnderscoreToITALICS(content_parsed, this);
        content_parsed = fn.markdownAsteriskToSTRONG(content_parsed, this);
        content_parsed = fn.markdownToANCHOR(content_parsed, this);
        content_parsed = fn.parseURLToANCHOR(content_parsed, this);
        content_parsed = fn.markdownUsernameToABBR(content_parsed, this);
        content_parsed = fn.markdownGtToBLOCKQUOTE(content_parsed, this);
        content_parsed = fn.markdownExclamationMarkToSPOILER(content_parsed, this);
        content_parsed = fn.markdownNewLineToBR(content_parsed, this);
        content_parsed = fn.markdownTagsToANCHOR(content_parsed, this);
        content_parsed = fn.markdownTextToSPAN(content_parsed, this);
        return content_parsed;
    }
    get created_at_Date() {
        return parse(this.created_at, 'yyyy-MM-dd HH:mm:ss', new Date());
    }
    get created_at_Timestamp() {
        return getUnixTime(this.created_at_Date);
    }
    get created_at_FormatDistance() {
        return formatDistance(this.created_at_Date, new Date(), { addSuffix: false });
    }
    get created_at_FormatDistanceSuffix() {
        return formatDistance(this.created_at_Date, new Date(), { addSuffix: true });
    }
    get created_at_SecondsAgo() {
        return differenceInSeconds(new Date(), this.created_at_Date);
    }
    created_at_Format(formatString) {
        return format(this.created_at_Date, formatString);
    }
    get created_at_Time() {
        return format(this.created_at_Date, 'HH:mm');
    }
    get created_at_YYYY_MM_DD() {
        return format(this.created_at_Date, 'yyyy-MM-dd');
    }
    get created_at_e() {
        return format(this.created_at_Date, 'e');
    }
    get created_at_ee() {
        return format(this.created_at_Date, 'ee');
    }
    get created_at_eee() {
        return format(this.created_at_Date, 'eee');
    }
    get created_at_eeee() {
        return format(this.created_at_Date, 'eeee');
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
            if (userObject === "Gosc") {
                this.username = userObject;
                this.name = userObject;
                this.gender = null;
            }
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
        return numerical;
    }
}
function isUserColor(obj) {
    return 'name' in obj && typeof obj.name === 'string' &&
        (!obj.hex || typeof obj.hex === 'string') &&
        (!obj.hex_dark || typeof obj.hex_dark === 'string');
}
export class HTTPError extends Error {
    status;
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}
//# sourceMappingURL=types.js.map