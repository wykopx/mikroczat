export type TokensObject = {
    token?: string;
    refresh_token?: string;
    username?: string;
};
type TokenType = "token" | "userKeep" | "refresh_token";
export interface UnknownToken {
    tokenValue: string;
    tokenType?: TokenType;
}
interface TagObject {
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
export declare class Tag {
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
    constructor(tag: TagObject | string);
    initFromAPI(): Promise<void>;
}
export declare class Channel {
    pagination: {
        next: string;
        prev: string;
    };
    tag: Tag;
    name: string;
    entries: Map<number, Entry>;
    comments: Map<number, Comment>;
    users: Map<string, User>;
    element: HTMLElement;
    messagesContainer: HTMLElement;
    constructor(tag: Tag);
    printChannelDetails(): void;
    addEntryOrCommentToChannelObject(EntryObject: Entry): void;
}
export declare class Entry {
    last_checked_comments_datetime: string;
    last_checked_comments_count?: number;
    id: number;
    entry_id: number;
    resource: string;
    channel?: Channel;
    author: User;
    media?: Media;
    votes?: Votes;
    comments?: Comments;
    actions?: EntryActions;
    deleted?: boolean;
    adult?: boolean;
    archive?: boolean;
    content?: string;
    created_at?: string;
    deletable?: boolean;
    device?: string;
    editable?: boolean;
    favourite?: boolean;
    slug?: string;
    status?: string;
    tags?: [string];
    voted?: number;
    constructor(entryObject: any, channel?: Channel);
    content_parsed(): string;
    get created_at_Date(): Date;
    get created_at_Timestamp(): number;
    get created_at_FormatDistance(): string;
    get created_at_FormatDistanceSuffix(): string;
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
    constructor(commentObject: any, channel?: Channel);
}
export type Comments = {
    items: Comments[];
    count: number;
};
export type Votes = {
    up: number;
    down: number;
    users?: [object];
};
export type Media = {
    embed?: object;
    photo?: MediaPhoto;
    survey?: object;
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
interface UserObject {
    username: string;
    gender?: string;
    avatar?: string;
    status?: string;
    note?: boolean;
    online?: boolean;
    verified?: boolean;
    follow?: boolean;
    color?: UserColor;
    rank?: UserRank;
    actions?: UserActions;
}
export declare class User {
    username: string;
    gender?: string;
    avatar?: string;
    status?: string;
    note?: boolean;
    online?: boolean;
    verified?: boolean;
    follow?: boolean;
    color?: UserColor;
    rank?: UserRank;
    actions?: UserActions;
    constructor(userObject: UserObject);
}
export type UserColor = {
    name: string;
    hex?: string;
    hex_dark?: string;
};
export type UserRank = {
    position: number;
    trend: number;
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
export {};
//# sourceMappingURL=types.d.ts.map