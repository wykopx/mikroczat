import * as CONST from './const.js';
import * as T from './types.js';

import * as fn from './fn.js';
// import { dev } from './index.js';
declare let dev: boolean;

import { settings } from './settings.js';

import { sub } from "../../node_modules/date-fns/sub.mjs";
import { openedChannels } from './index.js';



export class NotificationsStatus
{
	tag_notification?: boolean
	tag_notification_count?: number;
	entry_notification?: boolean;
	entry_notification_count?: number;
	pm?: boolean;
	pm_notification?: boolean;
	pm_notification_count?: number

	constructor(NotificationsStatusJSON?: any)
	{
		this.tag_notification = NotificationsStatusJSON?.tag_notification || false;
		this.tag_notification_count = NotificationsStatusJSON?.tag_notification_count || 0;
		this.entry_notification = NotificationsStatusJSON?.entry_notification || false;
		this.entry_notification_count = NotificationsStatusJSON?.entry_notification_count || 0;
		this.pm = NotificationsStatusJSON?.pm || false;
		this.pm_notification = NotificationsStatusJSON?.pm_notification || false;
		this.pm_notification_count = NotificationsStatusJSON?.pm_notification_count || 0;
	}

	// tags_new_entry_with_observed_tag: 0,
	// tags_new_link_with_observed_tag: 0,
	// entries: 0,
	// pm: 0,
	// total: 0,

	async refreshAPI()
	{
		// if (dev) console.log(`🔔 NotificationsStatus.refreshAPI()`)

		return new Promise(async (resolve, reject) =>
		{
			let apiURL: string = `https://wykop.pl/api/v3/notifications/status`;
			// if (dev) console.log(`🔔`, apiURL);

			await fetch(apiURL,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + window.localStorage.getItem("token"),
					},
				})
				.then((response) =>
				{
					// if (dev) console.log("response", response)

					if (!response.ok)
					{
						// if (dev) console.log("HTTP error! status: ${response.status}");
						throw new Error(`HTTP error! status: ${response.status}`);
					}
					return response.json();
				})
				.then((responseJSON) =>
				{
					/* responseJSON.data = {
						tag_notification: true,
						tag_notification_count: 1
						entry_notification: false;
						entry_notification_count: 0
						pm: false,
						pm_notification: false,
						pm_notification_count: 0,
					}
					*/

					// if (dev) console.log("a93 responseJSON.data", responseJSON.data)

					let isNotificationStatusChanged = false;
					if (responseJSON.data.tag_notification != this.tag_notification)
					{
						this.tag_notification = responseJSON.data.tag_notification;
						isNotificationStatusChanged = true;
					}
					if (responseJSON.data.tag_notification_count != this.tag_notification_count)
					{
						this.tag_notification_count = responseJSON.data.tag_notification_count;
						isNotificationStatusChanged = true;
					}
					if (responseJSON.data.entry_notification != this.entry_notification)
					{
						this.entry_notification = responseJSON.data.entry_notification;
						isNotificationStatusChanged = true;
					}
					if (responseJSON.data.entry_notification_count != this.entry_notification_count)
					{
						this.entry_notification_count = responseJSON.data.entry_notification_count;
						isNotificationStatusChanged = true;
					}
					if (responseJSON.data.pm != this.pm)
					{
						this.pm = responseJSON.data.pm;
						isNotificationStatusChanged = true;
					}
					if (responseJSON.data.pm_notification != this.pm_notification)
					{
						this.pm_notification = responseJSON.data.pm_notification;
						isNotificationStatusChanged = true;
					}
					if (responseJSON.data.pm_notification_count != this.pm_notification_count)
					{
						this.pm_notification_count = responseJSON.data.pm_notification_count;
						isNotificationStatusChanged = true;
					}

					resolve(isNotificationStatusChanged);

				}).catch((error) =>
				{
					if (error instanceof TypeError)
					{
						console.error('xxx Network error:', error); // AWARIA SERWERA
					} else
					{
						console.error('Other error:', error);
					}
					reject(error);
				});
		});
	}

}

export const notificationsStatus: NotificationsStatus = new NotificationsStatus(null);




