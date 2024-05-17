export declare let settings: Settings;
type ChannelStats = "disabled" | "show" | "hide" | "fetching";
type Hotkey = "enter" | "ctrl_enter" | "ctrl_s";
type Icon = "🕭" | "🔔";
type File = "iphone-message-received.mp3" | "iphone-message-sent.mp3" | "tiktok.mp3" | "mirkoczat.mp3";
type EditorSendHotkey = {
    [key in Hotkey]?: boolean;
};
interface PromoFooter {
    emoji?: boolean;
    label?: boolean;
    roomInfo?: boolean;
    mikroczatLinks?: boolean;
}
interface Fetch {
    numberOfEntries1stPreload?: number;
    numberOfEntries2ndPreload?: number;
    numbersOfCommentsToLoad?: number;
    hoursToLoad?: number;
}
interface UsersList {
    showOfflineUsers?: boolean;
    sortAlphabetically?: boolean;
}
interface Sound {
    enabled?: boolean;
    file?: File;
}
interface Sounds {
    incoming_entry?: Sound;
    incoming_comment?: Sound;
    incoming_mention?: Sound;
    incoming_pm?: Sound;
    outgoing_entry?: Sound;
    outgoing_comment?: Sound;
    outgoing_pm?: Sound;
    logged_in?: Sound;
    logged_out?: Sound;
}
interface Badge {
    enabled?: boolean;
    icon?: Icon;
    showIcon?: boolean;
    showCount?: boolean;
}
interface TabTitle {
    unreadMessagesBadge?: Badge;
    unreadMentionsBadge?: Badge;
}
interface RefreshIntervals {
    allEntriesAndComments?: number;
    timeoutForEntriesPagesOver50?: number;
    timeoutForCommentsOver50?: number;
}
interface Main {
    [key: string]: ChannelStats;
}
interface ChatArea {
    plusButtonShow?: boolean;
    scrollSnap?: boolean;
    msgFilterMikroczat?: boolean;
}
interface CSS {
    main?: Main;
    chatArea?: ChatArea;
}
interface Settings {
    highlightQuick?: boolean;
    discussionView?: boolean;
    newMessageSendButton?: boolean;
    rightClickOnUsernameCopiesToClipboard?: boolean;
    rightClickOnUsernameShowContextMenu?: boolean;
    rightClickOnUsernameSetsReplyEntry?: boolean;
    rightClickOnUsernameInsertsToNewMessage?: boolean;
    leftClickOnUsernameInsertsToNewMessage?: boolean;
    leftClickCTRLOnUsernameInsertsToNewMessage?: boolean;
    leftClickALTOnUsernameInsertsToNewMessage?: boolean;
    leftClickSHIFTOnUsernameInsertsToNewMessage?: boolean;
    leftClickOnYouTubeLoadsToIframe?: boolean;
    promoFooter?: PromoFooter;
    editorSendHotkey?: EditorSendHotkey;
    fetch?: Fetch;
    usersList?: UsersList;
    sounds?: Sounds;
    tabTitle?: TabTitle;
    refreshIntervals?: RefreshIntervals;
    css?: CSS;
}
export declare function setSettings(settingName: string, settingValue: any): void;
export declare function applyCSSsetting(settingName: any): void;
export {};
//# sourceMappingURL=settings.d.ts.map