export let settings = {
    tabTitle: {
        unreadMessagesBadge: {
            enabled: false,
            icon: "🕭",
            showIcon: false,
            showCount: false,
        },
        unreadMentionsBadge: {
            enabled: true,
            icon: "🔔",
            showIcon: true,
            showCount: true
        }
    }
};
settings.highlightQuick = false;
settings.discussionView = true;
settings.newMessageSendButton = true;
settings.rightClickOnUsernameCopiesToClipboard = false;
settings.rightClickOnUsernameShowContextMenu = false;
settings.rightClickOnUsernameSetsReplyEntry = true;
settings.rightClickOnUsernameInsertsToNewMessage = true;
settings.leftClickOnUsernameInsertsToNewMessage = false;
settings.leftClickCTRLOnUsernameInsertsToNewMessage = false;
settings.leftClickALTOnUsernameInsertsToNewMessage = false;
settings.leftClickSHIFTOnUsernameInsertsToNewMessage = false;
settings.leftClickOnYouTubeLoadsToIframe = true;
settings.promoFooter = {};
settings.promoFooter.emoji = true;
settings.promoFooter.label = true;
settings.promoFooter.roomInfo = false;
settings.promoFooter.mikroczatLinks = false;
settings.editorSendHotkey = {};
settings.editorSendHotkey.enter = false;
settings.editorSendHotkey.ctrl_enter = true;
settings.editorSendHotkey.ctrl_s = false;
settings.fetch = {};
settings.fetch.numberOfEntries1stPreload = 5;
settings.fetch.numberOfEntries2ndPreload = 10;
settings.fetch.numbersOfCommentsToLoad = 50;
settings.fetch.hoursToLoad = 4;
settings.refreshIntervals = {};
settings.refreshIntervals.allEntriesAndComments = 15000;
settings.refreshIntervals.timeoutForEntriesPagesOver50 = 500;
settings.refreshIntervals.timeoutForCommentsOver50 = 500;
settings.usersList = {};
settings.usersList.showOfflineUsers = true;
settings.usersList.sortAlphabetically = true;
settings.sounds = {};
settings.sounds.incoming_entry =
    {
        enabled: false,
        file: "iphone-message-received.mp3",
    };
settings.sounds.incoming_comment =
    {
        enabled: false,
        file: "iphone-message-received.mp3"
    };
settings.sounds.incoming_mention =
    {
        enabled: true,
        file: "iphone-message-received.mp3"
    };
settings.sounds.incoming_pm =
    {
        enabled: true,
        file: "iphone-message-received.mp3"
    };
settings.sounds.outgoing_entry =
    {
        enabled: true,
        file: "iphone-message-sent.mp3"
    };
settings.sounds.outgoing_comment =
    {
        enabled: true,
        file: "iphone-message-sent.mp3"
    };
settings.sounds.outgoing_pm =
    {
        enabled: true,
        file: "iphone-message-sent.mp3"
    };
settings.sounds.logged_in =
    {
        enabled: true,
        file: "tiktok.mp3"
    };
settings.sounds.logged_out =
    {
        enabled: true,
        file: "mirkoczat.mp3"
    };
settings.css = { main: {}, chatArea: {} };
settings.css.main.channelStats = "fetching";
settings.css.chatArea.plusButtonShow = true;
settings.css.chatArea.scrollSnap = false;
settings.css.chatArea.msgFilterMikroczat = false;
export function setSettings(settingName, settingValue) {
    if (settingName.startsWith("settings.")) {
        settingName = settingName.substring("settings.".length);
    }
    const keys = settingName.split('.');
    let obj = settings;
    for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = settingValue;
    if (settingName.startsWith("css.")) {
        applyCSSsetting(settingName);
    }
}
export function applyCSSsetting(settingName) {
    if (settingName.startsWith("settings.")) {
        settingName = settingName.substring("settings.".length);
    }
    if (settingName.startsWith("css.")) {
        settingName = settingName.substring("css.".length);
    }
    const keys = settingName.split('.');
    if (settings.css[keys[0]]) {
        const element = document.getElementById(keys[0]);
        if (element) {
            element.dataset[keys[1]] = settings.css[keys[0]][keys[1]];
        }
    }
}
//# sourceMappingURL=settings.js.map