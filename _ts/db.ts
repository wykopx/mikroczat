import * as T from './types.js';
import * as login from './login.js';



declare var Dexie: any;
declare let dev: boolean;

// Initialize Dexie
export let db: any;

export async function init()
{
	db = new Dexie(login.loggedUser.username);

	db.version(1).stores({
		recentTags: '&name, lastVisited, isFavorite, sendCount, visitedCount, showInRecentList',
		recentPMs: '&name, lastVisited, isFavorite, sendCount, roomID, partner, visitedCount, showInRecentList',
		recentRooms: '&name, lastVisited, isFavorite, sendCount, roomID, visitedCount, showInRecentList',
		blockDetector: '&username, isBlockingAndCanNotComment, dateLastChecked, User',
		notatkowator: '&username, lastChecked, User, note'
	});
	db.open().catch((err) =>
	{
		console.error("Failed to open db: ", err.stack || err);
	});
}




export async function getRecentChannelTypeArray(type: T.ChannelType = "tag")
{
	if (dev) console.log("getRecentTagsArray()");
	try
	{
		let table = db.recentTags;
		if (type == "pm") table = db.recentPMs;
		else if (type == "pm_room") table = db.recentRooms;

		const showInRecentListFilter = channel => channel.showInRecentList == 1;

		// Retrieve favorites
		const favorites = await table.where({ isFavorite: 1 }).toArray();
		// Retrieve 5 latest visited tags
		const latestVisited = await table.orderBy('lastVisited').filter(showInRecentListFilter).limit(5).toArray();
		// Retrieve 3 most visited tags
		const mostVisited = await table.orderBy('visitedCount').filter(showInRecentListFilter).reverse().limit(3).toArray();
		// Merge arrays while ensuring no duplicates based on 'name'
		const mergedTagsArray = mergeArrays(favorites, latestVisited, mostVisited);

		console.log("Merged recent channels buttons: ", mergedTagsArray);

		return mergedTagsArray;

	} catch (error)
	{
		console.error("Error adding recent channels buttons to sidebar: ", error);
	}
}



// Helper function to merge arrays and remove duplicates based on 'name'
function mergeArrays(...arrays)
{
	const merged = [];
	const seen = new Set();

	arrays.forEach(array =>
	{
		array.forEach(item =>
		{
			if (!seen.has(item.name))
			{
				seen.add(item.name);
				merged.push(item);
			}
		});
	});

	return merged;
}





export async function updateRecentlyVisitedChannel(ChannelObject: T.Channel)
{
	if (ChannelObject.type == "tag" && ChannelObject instanceof T.ChannelTag) updateRecentTag(ChannelObject)
	else if (ChannelObject.type == "pm" && ChannelObject instanceof T.ChannelPM) updateRecentPM(ChannelObject);
	else if (ChannelObject.type == "pm_room" && ChannelObject instanceof T.ChannelRoom) updateRecentRoom(ChannelObject);
}

export async function removeRecentlyVisitedChannel(ChannelObject: T.Channel)
{
	if (ChannelObject.type == "tag" && ChannelObject instanceof T.ChannelTag) removeRecentTag(ChannelObject.name)
	else if (ChannelObject.type == "pm" && ChannelObject instanceof T.ChannelPM) removeRecentPM(ChannelObject.name);
	else if (ChannelObject.type == "pm_room" && ChannelObject instanceof T.ChannelRoom) removeRecentRoom(ChannelObject.name);
}




export async function hideOnRecentListTag(name: string) { await db.recentTags.update(name, { showInRecentList: 0, favorite: 0 }); }
export async function hideOnRecentListPM(name: string) { await db.recentPMs.update(name, { showInRecentList: 0, favorite: 0 }); }
export async function hideOnRecentListRoom(name: string) { await db.recentRooms.update(name, { showInRecentList: 0, favorite: 0 }); }

// Remove functions
export async function removeRecentTag(name: string) { await db.recentTags.where({ name }).delete(); }
export async function removeRecentPM(name: string) { await db.recentPMs.where({ name }).delete(); }
export async function removeRecentRoom(name: string) { await db.recentRooms.where({ name }).delete(); }

export async function addRecentTag(ChannelObject: T.ChannelTag)
{
	await db.recentTags.add({
		name: ChannelObject.name,
		lastVisited: new Date(),
		isFavorite: 0,
		sendCount: 0,
		visitedCount: 1,
		showInRecentList: 1
	});
}

export async function updateRecentTag(ChannelObject: T.ChannelTag)
{
	const tag = await db.recentTags.where({ name: ChannelObject.name }).first();

	if (tag)
	{
		await db.recentTags.update(tag.name, {
			lastVisited: new Date(),
			visitedCount: tag.visitedCount + 1,
			showInRecentList: 1
		});
	} else
	{
		addRecentTag(ChannelObject);
	}
}

export async function addRecentPM(ChannelObject: T.ChannelPM)
{
	await db.recentPMs.add({
		name: ChannelObject.name,
		lastVisited: new Date(),
		isFavorite: 0,
		sendCount: 0,
		roomID: ChannelObject.roomID,
		partner: ChannelObject.partner,
		visitedCount: 1,
		showInRecentList: 1
	});
}
export async function updateRecentPM(ChannelObject: T.ChannelPM)
{
	const pm = await db.recentPMs.where({ name: ChannelObject.name }).first();
	if (pm)
	{
		await db.recentPMs.update(pm.name, {
			lastVisited: new Date(),
			visitedCount: pm.visitedCount + 1,
			showInRecentList: 1
		});
	}
	else
	{
		addRecentPM(ChannelObject);
	}
}

export async function addRecentRoom(ChannelObject: T.ChannelPM)
{
	await db.recentRooms.add({
		name: ChannelObject.name,
		lastVisited: new Date(),
		isFavorite: 0,
		sendCount: 0,
		roomID: ChannelObject.roomID,
		visitedCount: 1,
		showInRecentList: 1
	});
}

export async function updateRecentRoom(ChannelObject: T.ChannelRoom)
{
	const room = await db.recentRooms.where({ name: ChannelObject.name }).first();
	if (room)
	{
		await db.recentRooms.update(room.name, {
			lastVisited: new Date(),
			visitedCount: room.visitedCount + 1,
			showInRecentList: 1
		});
	} else
	{
		addRecentRoom(ChannelObject);
	}
}




// Function to add a block detector entry
export async function addBlockDetectorUser(UserObject: T.User)
{
	await db.blockDetector.add({
		username: UserObject.username,
		isBlockingAndCanNotComment: UserObject.blockDetectorObject.isBlockingAndCanNotComment,
		dateLastChecked: new Date(),
		User: UserObject
	});

	UserObject.blockDetectorObject.dateLastChecked = new Date();
}

// Function to update lastChecked in block detector
export async function updateBlockDetectorUser(UserObject: T.User)
{
	const user = await db.blockDetector.where({ username: UserObject.username }).first();

	if (user)
	{
		await db.blockDetector.update(user.username, {
			dateLastChecked: new Date()
		});
	}
	else
	{
		addBlockDetectorUser(UserObject);
	}
}

// Function to retrieve all recent tags sorted by lastVisited date
export async function getRecentTags()
{
	const recentTags = await db.recentTags.orderBy('lastVisited').reverse().toArray();
	console.log("All recent tags sorted by lastVisited: ", recentTags);
}

// Function to retrieve all recent PMs sorted by lastVisited date
export async function getRecentPMs()
{
	const recentPMs = await db.recentPMs.orderBy('lastVisited').reverse().toArray();
	console.log("All recent PMs sorted by lastVisited: ", recentPMs);
}

// Function to retrieve all recent rooms sorted by lastVisited date
export async function getRecentRooms()
{
	const recentRooms = await db.recentRooms.orderBy('lastVisited').reverse().toArray();
	console.log("All recent rooms sorted by lastVisited: ", recentRooms);
}


// Function to retrieve all block detector entries sorted alphabetically by username
export async function getBlockDetectors()
{
	const blockDetectors = await db.blockDetector.orderBy('username').toArray();
	console.log("All block detector entries sorted by username: ", blockDetectors);
}



// Function to add a notatkowator entry
export async function addNotatkowatorEntry(UserObject: T.User, NoteObject: T.NoteObject)
{
	try
	{
		await db.notatkowator.add({
			username: UserObject.username,
			lastChecked: new Date(),
			User: UserObject,
			content: NoteObject.content,
		});
		console.log("Notatkowator entry added!");
	} catch (error)
	{
		console.error("Error adding notatkowator entry: ", error);
	}
}

// Function to update lastChecked in notatkowator
export async function updateNotatkowatorEntry(UserObject: T.User, NoteObject: T.NoteObject)
{
	try
	{
		const user = await db.notatkowator.where({ username: UserObject.username }).first();
		if (user)
		{
			await db.notatkowator.update(user.username, {
				lastChecked: new Date(),
				content: NoteObject.content,
			});
			console.log("Notatkowator entry updated!");
		} else
		{
			await addNotatkowatorEntry(UserObject, NoteObject);
		}
	} catch (error)
	{
		console.error("Error updating notatkowator entry: ", error);
	}
}

// Function to retrieve all notatkowator entries sorted alphabetically by username
export async function getNotatkowators()
{
	try
	{
		const notatkowators = await db.notatkowator.orderBy('username').toArray();
		return notatkowators;
	}
	catch (error)
	{
		console.error("Error retrieving notatkowator entries: ", error);
		return [];
	}
}



