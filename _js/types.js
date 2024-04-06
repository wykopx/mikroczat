import * as CONST from './const.js';
import { tokensObject } from './index.js';
import { pl } from "../node_modules/date-fns/locale.mjs";
import { parse } from "../node_modules/date-fns/parse.mjs";
import { format } from "../node_modules/date-fns/format.mjs";
import { getUnixTime } from "../node_modules/date-fns/getUnixTime.mjs";
import { formatDistance } from "../node_modules/date-fns/formatDistance.mjs";
import * as fn from './fn.js';
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
            console.log("Channel constructor().init() -> data from API", this);
        }
        catch (error) {
            console.error('Error:', error);
        }
    }
}
export class Channel {
    name;
    tag;
    entries;
    users;
    element;
    constructor(tag) {
        this.tag = tag;
        this.name = tag.name;
        this.entries = new Map();
        this.users = new Map();
        this.element = null;
        this.printDetails();
    }
    printDetails() {
        console.log(`Channel name: ${this.name}`);
    }
    addEntry(id, EntryObject) {
        this.entries.set(id, EntryObject);
    }
}
export class Entry {
    id;
    entry_id;
    resource;
    adult;
    archive;
    author;
    content;
    created_at;
    deletable;
    device;
    editable;
    favourite;
    media;
    slug;
    status;
    tags;
    voted;
    votes;
    channel;
    constructor(entryObject, channel) {
        this.id = entryObject.id;
        this.entry_id = entryObject.id;
        this.resource = entryObject.resource;
        this.author = new User(entryObject.author);
        this.created_at = entryObject.created_at;
        this.channel = channel;
        this.content = entryObject.content;
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
        console.log("💚 content_parsed: ", content_parsed);
        content_parsed = fn.markdownBacktickToCode(content_parsed);
        content_parsed = fn.markdownUnderscoreToItalics(content_parsed);
        content_parsed = fn.markdownAsteriskToStrong(content_parsed);
        content_parsed = fn.markdownExclamationMarkToSpoiler(content_parsed);
        content_parsed = fn.markdownGtToBlackquote(content_parsed);
        content_parsed = fn.parseURLToLink(content_parsed);
        console.log("💙 PARSED CODE:");
        console.log(content_parsed);
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
    gender;
    avatar;
    status;
    note;
    online;
    verified;
    follow;
    color;
    rank;
    actions;
    constructor(userObject) {
        this.username = userObject.username;
        this.gender = userObject.gender || null;
        this.avatar = userObject.avatar;
        this.status = userObject.status;
        this.note = userObject.note || false;
        this.online = userObject.online;
        this.verified = userObject.verified;
        this.follow = userObject.follow || false;
        if (typeof userObject.color == "string")
            this.color = { name: userObject.color };
        else if (isUserColor(userObject.color))
            this.color = userObject.color;
        this.rank = userObject.rank || null;
        this.actions = userObject.actions;
    }
}
function isUserColor(obj) {
    return 'name' in obj && typeof obj.name === 'string' &&
        (!obj.hex || typeof obj.hex === 'string') &&
        (!obj.hex_dark || typeof obj.hex_dark === 'string');
}
//# sourceMappingURL=types.js.map