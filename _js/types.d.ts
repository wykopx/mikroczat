export declare const proxies: WeakSet<object>;
export type TokensObject = {
    token?: string;
    refresh_token?: string;
    username?: string;
};
type TokenType = "token" | "userKeep" | "refresh_token" | "guest";
export interface UnknownToken {
    tokenValue: string;
    tokenType?: TokenType;
}
interface TagObject {
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
export declare class Tag {
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
    constructor(tag: TagObject | string);
    initFromAPI(): Promise<void>;
}
type LoadingStatus = "before" | "preloaded" | "loaded";
export declare class Channel {
    loadingStatus?: LoadingStatus;
    discussionViewEntryId?: number;
    pagination: {
        next: string;
        prev: string;
    };
    tag: Tag;
    name: string;
    nameUnderscore?: string;
    entries: Map<number, Entry>;
    comments: Map<number, Comment>;
    unreadMessagesCount: number;
    unreadMentionsCount: number;
    users: Map<string, User>;
    elements: {
        channelFeed: HTMLElement;
        messagesContainer: HTMLElement;
        usersListContainer: HTMLElement;
        newMessageTextarea: HTMLElement;
        newMessageTextareaContainer: HTMLElement;
    };
    constructor(tag: Tag);
    printChannelDetails(): void;
    addEntryOrCommentToChannelObject(ChannelObject: Channel, EntryObject: Entry | Comment): void;
}
export interface NewMessageBodyData {
    content?: string;
    photo?: string;
    embed?: string;
    survey?: string;
    adult?: boolean;
    resource?: Resource;
    entry_id?: number;
}
export interface MessageTemplate {
    resource?: Resource;
    id?: number;
    entry_id?: number;
    parent?: Entry | MessageTemplate;
    channel?: Channel;
    author?: User;
    media?: Media;
    photo?: string;
    embed?: string;
    survey?: string;
    votes?: Votes;
    comments?: Comments;
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
    status?: string;
    tags?: string[];
    voted?: number;
}
export type Resource = "entry" | "entry_comment";
export declare class Entry {
    last_checked_comments_datetime?: Date;
    last_checked_comments_count?: number;
    id?: number;
    entry_id?: number;
    resource: Resource;
    channel?: Channel;
    author?: User;
    media?: Media;
    photo?: string;
    embed?: string;
    survey?: string;
    votes?: Votes;
    comments?: Comments;
    actions?: EntryActions;
    deleted?: boolean;
    adult?: boolean;
    archive?: boolean;
    content?: string;
    created_at?: string;
    editable?: boolean;
    deletable?: boolean;
    blacklist?: boolean;
    device?: string;
    favourite?: boolean;
    slug?: string;
    status?: string;
    tags?: string[];
    voted?: number;
    constructor(entryObject: Entry | NewMessageBodyData | MessageTemplate, channel?: Channel);
    isMentioningUser(username: string): boolean;
    content_parsed(): string;
    get created_at_Date(): Date;
    get created_at_Timestamp(): number;
    get created_at_FormatDistance(): string;
    get created_at_FormatDistanceSuffix(): string;
    get created_at_SecondsAgo(): number;
    created_at_Format(formatString: string): string;
    get created_at_Time(): string;
    get created_at_YYYY_MM_DD(): string;
    get created_at_e(): string;
    get created_at_ee(): string;
    get created_at_eee(): string;
    get created_at_eeee(): string;
}
export declare class Comment extends Entry {
    parent?: Entry;
    constructor(commentObject: Comment | MessageTemplate, channel?: Channel);
}
export type Comments = {
    items: Comment[];
    count: number;
};
export type Votes = {
    up: number;
    down: number;
    users?: User[];
};
export type Media = {
    embed?: MediaEmbed;
    photo?: MediaPhoto;
    survey?: MediaSurvey;
};
export type MediaPhoto = {
    key?: string;
    label?: string;
    mime_type?: string;
    url?: string;
    size?: number;
    width?: number;
    height?: number;
};
export type MediaEmbed = {
    key?: string;
    type?: string;
    thumbnail?: string;
    url?: string;
    age_category?: string;
};
export type MediaSurvey = {
    key?: string;
    TODO?: null;
};
interface UserObject {
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
    status?: string;
    verified?: boolean;
    website?: string;
}
export declare class User {
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
    status?: string;
    verified?: boolean;
    website?: string;
    channel?: Channel;
    constructor(userObject: UserObject | string, channel?: Channel);
    get numericalOrder(): number;
}
export type UserColor = {
    name: string;
    hex?: string;
    hex_dark?: string;
};
export type UserSocialMedia = {
    facebook?: string;
    instagram?: string;
    twitter?: string;
};
export type UserRank = {
    position: number;
    trend: number;
};
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
};
export type UserActions = {
    update?: boolean;
    update_gender?: boolean;
    update_note?: boolean;
    blacklist?: boolean;
    follow?: boolean;
};
export type TagActions = {
    report?: boolean;
    delete?: boolean;
    create_coauthor: boolean;
    delete_coauthor: boolean;
    update: boolean;
    blacklist: boolean;
};
export declare class HTTPError extends Error {
    status: number;
    constructor(message: string, status: number);
}
export interface Sounds {
    logged_in?: HTMLAudioElement;
    logged_out?: HTMLAudioElement;
    incoming_entry?: HTMLAudioElement;
    incoming_comment?: HTMLAudioElement;
    incoming_mention?: HTMLAudioElement;
    outgoing_entry?: HTMLAudioElement;
    outgoing_comment?: HTMLAudioElement;
}
export interface channelSpecial {
    urlPath: string;
    selector: string;
    name?: string;
    description?: string;
    tabTitle?: string;
}
export {};
//# sourceMappingURL=types.d.ts.map