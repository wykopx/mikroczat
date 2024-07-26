import * as api from './wykop_api.js';
import * as CONST from './const.js';
import * as chs from './chs.js';
import * as T from './types.js';
import * as fn from './fn.js';
import * as login from './login.js';
import * as ch_fn from './ch_fn.js';
import * as index from './index.js';
import { action } from './action.js';

import * as db from './db.js';


declare var openChannelsFromURLArray: string[];
declare var openPMFromURLArray: string[];
declare let dev: boolean;
declare var $folder: string;
import { settings, setSettings } from './settings.js';
import { getNumberOfOnlineUsersOnChannel } from './ch_fn.js';
export const sidebarElement = document.getElementById("sidebar") as HTMLElement;
export const sidebarPMsSection = sidebarElement.querySelector("#sidebarPMsSection") as HTMLElement;
export const sidebarRoomsSection = sidebarElement.querySelector("#sidebarRoomsSection") as HTMLElement;
export const sidebarChannelsSection = sidebarElement.querySelector("#sidebarChannelsSection") as HTMLElement;
const templates = document.getElementById("templates") as HTMLElement;

export const template_sidebarButtonChannel = templates.querySelector("#template_sidebarButtonChannel") as HTMLTemplateElement;

declare let ZingTouch;




// import * as ZingTouch from '../_js-lib/zingtouch.js';
// https://www.akselipalen.com/2022/05/24/design-of-gesture-recognition-libraries-for-web/#htoc-custom-gesture
const zingtouchSidebarRegion = new ZingTouch.Region(document.body, null, false);

const ztTwoFingerTap = new ZingTouch.Tap({ numInputs: 2, maxDelay: 500 })
const ztSwipe = new ZingTouch.Swipe({
	numInputs: 1,
	maxRestTime: 100,
	escapeVelocity: 0.25
});

zingtouchSidebarRegion.bind(sidebarElement, ztSwipe, function (e)
{

	if (dev) console.log("e.target: ", e.target);
	if (dev) console.log("e.detail: ", e.detail);

	if (e.target === sidebarElement)
	{
		if (sidebarElement.classList.contains("hover")) sidebarElement.classList.remove("hover");
		else sidebarElement.classList.add("hover");
	}

	/* 
	e.detail.data[0] = 
	{
		currentDirection: 360,
		distance: 5,
		duration: 8,
		velocity: 0.625
	}
	*/
});








document.addEventListener('DOMContentLoaded', (DOMContentLoadedEvent) =>
{
	document.body.addEventListener("click", function (e: MouseEvent)
	{
		let target = e.target as HTMLElement;
		if (target.matches(".removeFromRecentList"))
		{
			target.closest(".sidebarButtonRow").remove();
			if (target.dataset.type == "tag") db.hideOnRecentListTag(target.dataset.channel)
			else if (target.dataset.type == "pm") db.hideOnRecentListPM(target.dataset.channel)
			else if (target.dataset.type == "pm_room") db.hideOnRecentListRoom(target.dataset.channel)
		}
	});
});

export async function addRecentChannelButtonsToSidebarFromDB()
{
	db.getRecentChannelTypeArray("tag").then(async (channels) =>
	{
		for (let ch of channels)
		{
			addChannelButtonToSidebar(new T.ChannelTag(ch), "tag");
		}
	});
	db.getRecentChannelTypeArray("pm").then(async (channels) =>
	{
		for (let ch of channels)
		{
			addChannelButtonToSidebar(new T.ChannelPM(ch), "pm");
		}
	});
	db.getRecentChannelTypeArray("pm_room").then(async (channels) =>
	{
		for (let ch of channels)
		{
			addChannelButtonToSidebar(new T.ChannelRoom(ch), "pm_room");
		}
	});
}


export async function addChannelButtonToSidebar(ChannelObject: T.Channel | string, type: T.ChannelType = "tag"): Promise<void>
{

	console.log("addChannelButtonToSidebar", ChannelObject, type);
	if (typeof ChannelObject == "string")
	{
		if (type == "tag") ChannelObject = new T.ChannelTag(new T.Tag(ChannelObject));
		else if (type == "pm") ChannelObject = new T.ChannelPM(ChannelObject);
		else if (type == "pm_room") ChannelObject = new T.ChannelRoom(ChannelObject);
	}




	if (!(ChannelObject instanceof T.Channel)) return;

	if (sidebarElement.querySelector(".sidebarButtonRow [data-channel='" + ChannelObject.name + "']")) return;

	let appropriateSection: HTMLElement;

	if (ChannelObject.type == "tag")
	{
		appropriateSection = sidebarChannelsSection;
	}
	else if (ChannelObject.type == "pm")
	{
		appropriateSection = sidebarPMsSection;
	}
	else if (ChannelObject.type == "pm_room")
	{
		appropriateSection = sidebarRoomsSection;
	}

	var headerOpenedChannelsElement = appropriateSection.querySelector(`header.openedChannels`);
	// headerOpenedChannelsElement.insertAdjacentElement('afterend', channelButtonHTML);



	appropriateSection.append(await getChannelButtonHTML(ChannelObject));
}

export async function getChannelButtonHTML(ChannelObject: T.Channel): Promise<Element>
{
	// TEMPLATE
	const templateNode = template_sidebarButtonChannel.content.cloneNode(true) as Element;

	const sidebarButtonRowDiv = templateNode.querySelector('.sidebarButtonRow') as HTMLAnchorElement;
	const sidebarButtonChannelDiv = templateNode.querySelector('.sidebarButtonChannel') as HTMLAnchorElement;
	const openInCurrentTabHref = templateNode.querySelector('.openInCurrentTab') as HTMLAnchorElement;
	const openInNewTabHref = templateNode.querySelector('.openInNewTab') as HTMLAnchorElement;
	const removeFromRecentListButton = templateNode.querySelector('.removeFromRecentList') as HTMLAnchorElement;

	if (ChannelObject.visitedCount)
	{
		sidebarButtonRowDiv.style.order = `${10000 - ChannelObject.visitedCount}`;
		// sidebarButtonRowDiv.dataset.visitedCount = ChannelObject.visitedCount.toString();
	}
	if (ChannelObject.isFavorite)
	{
		sidebarButtonRowDiv.dataset.isFavorite = "true";
		sidebarButtonRowDiv.style.order = "1";
	}



	if (ChannelObject.type == "tag")
	{
		sidebarButtonRowDiv.dataset.channel = ChannelObject.name;
		sidebarButtonRowDiv.dataset.type = "tag";
		removeFromRecentListButton.dataset.type = "tag";
		removeFromRecentListButton.dataset.channel = ChannelObject.name;

		openInCurrentTabHref.href = `/czat/${ChannelObject.name}`;
		openInNewTabHref.href = `/czat/${ChannelObject.name}`;

		openInCurrentTabHref.innerText = ChannelObject.name;
		if (chs.ChannelsSpecialMap.has(ChannelObject.name)) openInCurrentTabHref.innerText = chs.ChannelsSpecialMap.get(ChannelObject.name).hashName;
	}
	else if (ChannelObject.type == "pm" && ChannelObject instanceof T.ChannelPM)
	{
		sidebarButtonRowDiv.dataset.channel = ChannelObject.name;
		sidebarButtonRowDiv.dataset.type = "pm";
		removeFromRecentListButton.dataset.channel = ChannelObject.name;
		removeFromRecentListButton.dataset.type = "pm";

		openInCurrentTabHref.innerText = `@${ChannelObject.name}`;
		openInCurrentTabHref.href = `/pm/${ChannelObject.name}`;
		openInNewTabHref.href = `/pm/${ChannelObject.name}`;
	}

	else if (ChannelObject.type == "pm_room" && ChannelObject instanceof T.ChannelRoom)
	{
		sidebarButtonRowDiv.dataset.channel = ChannelObject.name;
		sidebarButtonRowDiv.dataset.type = "pm_room";
		removeFromRecentListButton.dataset.channel = ChannelObject.name;
		removeFromRecentListButton.dataset.type = "pm_room";


		openInCurrentTabHref.innerText = ChannelObject.name;
		openInCurrentTabHref.href = `/room/${ChannelObject.nameBase64}`;
		openInNewTabHref.href = `/room/${ChannelObject.nameBase64}`;
	}

	return templateNode;
}
export async function selectActiveChannel(ChannelObject: T.Channel | string): Promise<void>
{
	fn.removeClass(sidebarElement.querySelectorAll(`.sidebarButtonRow.active`), "active");

	if (typeof ChannelObject == "string") fn.addClass(sidebarElement.querySelector(`.sidebarButtonRow[data-channel="${ChannelObject}"]`), "active");

	else if (typeof ChannelObject == "object" && ChannelObject.name)
	{
		fn.addClass(sidebarElement.querySelector(`.sidebarButtonRow[data-channel="${ChannelObject.name}"]`), "active");
	}
}