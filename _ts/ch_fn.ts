import * as T from './types.js';


// zwraca liczbę użytkowników online na danym kanale
export function getNumberOfOnlineUsersOnChannel(ChannelObject: T.Channel): number
{
	return Array.from(ChannelObject.users.values()).filter(user => user.online).length;
}

