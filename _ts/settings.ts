
export let settings: Settings =
{
	tabTitle:
	{
		unreadMentionsBadge:
		{
			enabled: true,
			icon: "🔔",
			showIcon: true,
			showCount: true
		},

		unreadMessagesBadge:
		{
			enabled: false,
			icon: "🕭", // *★☆✪✵٭✭✭✭🌟⚝✸✶✴✳✲✱⍟✫🎆🆕🔔⚠️🕭
			showIcon: false,
			showCount: false,
		}
	}
}

settings.nightMode = "1";

settings.highlightQuick = false;
settings.discussionView = true;
settings.newMessageSendButton = true;

settings.rightClickOnUsernameCopiesToClipboard = false;
settings.rightClickOnUsernameShowContextMenu = true;

settings.leftClickOnUsernameSetsReplyEntry = true;
settings.leftClickOnUsernameInsertsToNewMessage = true;

settings.leftClickCTRLOnUsernameInsertsToNewMessage = false;	// TODO
settings.leftClickALTOnUsernameInsertsToNewMessage = false;	// TODO
settings.leftClickSHIFTOnUsernameInsertsToNewMessage = false;	// TODO
settings.leftClickOnYouTubeLoadsToIframe = true;

settings.promoFooter = {};
settings.promoFooter.enable = true;

settings.promoFooter.emoji = false;
settings.promoFooter.label = false;
settings.promoFooter.roomInfo = false;
settings.promoFooter.mikroczatLinks = false;



settings.editorSendHotkey = {};
settings.editorSendHotkey.enter = false;
settings.editorSendHotkey.ctrl_enter = true;
settings.editorSendHotkey.ctrl_s = false;


settings.fetch = {};
settings.fetch.numberOfEntries1stPreload = 5; // max 50
settings.fetch.numberOfEntries2ndPreload = 35; // max 50
settings.fetch.numbersOfCommentsToLoad = 50 // max 50
settings.fetch.hoursToLoad = 6 // wpisy z ostatnich 13 godzin


settings.refreshIntervals = {};

settings.refreshIntervals.allEntriesAndComments = 15000;				// 20 sekund
settings.refreshIntervals.timeoutForEntriesPagesOver50 = 500; 			// 200 milisekund pomiedzy pobieraniem kolejny stron wpisów jesli gdy jest ich ponad 50
settings.refreshIntervals.timeoutForCommentsOver50 = 500;
settings.refreshIntervals.notificationsCheck = 10000;					// 10 sekund

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
/* outgoing */
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
settings.css.main.channelStats = "fetching"; // "disabled" | "show" | "hide" | "fetching"	// <main data-channel-stats="fetching"
settings.css.chatArea.plusButtonShow = true;
settings.css.chatArea.scrollSnap = false;
settings.css.chatArea.msgFilterMikroczat = false;









type ChannelStats = "disabled" | "show" | "hide" | "fetching";
type Hotkey = "enter" | "ctrl_enter" | "ctrl_s";
type Icon = "🕭" | "🔔";
type File = "iphone-message-received.mp3" | "iphone-message-sent.mp3" | "tiktok.mp3" | "mirkoczat.mp3";

type EditorSendHotkey =
	{
		[key in Hotkey]?: boolean;
	}


interface PromoFooter
{
	enable?: boolean;
	emoji?: boolean;
	label?: boolean;
	roomInfo?: boolean;
	mikroczatLinks?: boolean;
}


interface Fetch
{
	numberOfEntries1stPreload?: number;
	numberOfEntries2ndPreload?: number;
	numbersOfCommentsToLoad?: number;
	hoursToLoad?: number;
}

interface UsersList
{
	showOfflineUsers?: boolean;
	sortAlphabetically?: boolean;
}

interface Sound
{
	enabled?: boolean;
	file?: File;
}

interface Sounds
{
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

interface Badge
{
	enabled?: boolean;
	icon?: Icon;
	showIcon?: boolean;
	showCount?: boolean;
}

interface TabTitle
{
	unreadMessagesBadge?: Badge;
	unreadMentionsBadge?: Badge;
}

interface RefreshIntervals
{
	allEntriesAndComments?: number;
	timeoutForEntriesPagesOver50?: number;
	timeoutForCommentsOver50?: number;
	notificationsCheck?: number;
}

interface Main
{
	[key: string]: ChannelStats;
}

interface ChatArea
{
	plusButtonShow?: boolean;
	scrollSnap?: boolean;
	msgFilterMikroczat?: boolean;
}

interface CSS
{
	main?: Main;
	chatArea?: ChatArea;
}

interface Settings
{
	nightMode?: "0" | "1";
	highlightQuick?: boolean;
	discussionView?: boolean;
	newMessageSendButton?: boolean;
	rightClickOnUsernameCopiesToClipboard?: boolean;
	rightClickOnUsernameShowContextMenu?: boolean;

	leftClickOnUsernameSetsReplyEntry?: boolean;
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





// setSettings("settings.css.main.channelStats", "show");
// setSettings("css.main.channelStats", "show");
export function setSettings(settingName: string, settingValue: any)
{
	if (settingName.startsWith("settings."))
	{
		settingName = settingName.substring("settings.".length);
	}

	const keys = settingName.split('.');
	let obj = settings;

	for (let i = 0; i < keys.length - 1; i++)
	{
		obj = obj[keys[i]];
	}

	obj[keys[keys.length - 1]] = settingValue;

	if (settingName.startsWith("css."))
	{
		applyCSSsetting(settingName);
	}

}


export function applyCSSsetting(settingName)
{
	if (settingName.startsWith("settings."))
	{
		settingName = settingName.substring("settings.".length);
	}
	if (settingName.startsWith("css."))
	{
		settingName = settingName.substring("css.".length);
	}

	const keys = settingName.split('.');
	if (settings.css[keys[0]])
	{
		const element = document.getElementById(keys[0]);
		if (element)
		{
			element.dataset[keys[1]] = settings.css[keys[0]][keys[1]];	// settings.css.chatArea.plusButtonShow = true -> <div id="chatArea" data-plus-button-show="true">
		}
	}



}

