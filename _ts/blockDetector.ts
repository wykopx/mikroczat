import * as index from './index.js';
import * as db from './db.js';
import * as fn from './fn.js';
import * as login from './login.js';
import * as T from './types.js';
import * as CONST from './const.js';
import * as api from './wykop_api.js';

declare let dev: boolean;
declare var $folder: string;

let openBlockDetectorButtons: NodeListOf<HTMLButtonElement>;
let blockDetectorUsernamesArray: string[];

// export const init = () => true;
export const init = async () => 
{
	openBlockDetectorButtons = document.querySelectorAll("button.openBlockDetector");
	blockDetectorUsernamesArray = await getAllBlockDetectorUsernamesArray();

	if (blockDetectorUsernamesArray.length > 0) fn.show(openBlockDetectorButtons);

	openBlockDetectorButtons.forEach(button =>
	{
		let blockingCountVar: HTMLElement = button.querySelector("var");
		if (blockingCountVar) blockingCountVar.innerText = String(blockDetectorUsernamesArray.length);
		button.addEventListener("click", () => showBlockDetector())
	});
};





export async function showBlockDetector(): Promise<void>
{
	if (blockDetectorUsernamesArray.length == 0) alert("Gratulacje!\n\nMikroczat nie wykrył jeszcze nikogo, kto dodałby Ciebie na czarną listę.\n\nTak trzymać!")
	else alert(`Oto lista osób, które mają Cię na czarnej liście: \n\n@  ${blockDetectorUsernamesArray.join("\n@")}\n\n- nie możesz wysyłać do nich wiadomości prywatnych\n- nie dostają powiadomienia o Twoich wpisach\n- nie dostaną powiadomienia, gdy zawołasz ich we wpisie lub komentarzu\n- mogą włączyć w ustawieniach, że nie możesz odpisywać w ich dyskusjach`);

}


export async function getAllBlockDetectorUsernamesArray(): Promise<string[]>
{
	try
	{
		const table = db.db.blockDetector;
		const usernames = await table
			.orderBy('username')
			.toArray()
			.then(records => records.map(record => record.username));

		return usernames;
	} catch (error)
	{
		console.error("Failed to retrieve usernames:", error);
		return [];
	}
}




// BLOCK DETECTOR
export async function getBlockingStatus(params: T.BlockDetectorCheckOptions, Channel: T.Channel): Promise<T.BlockDetectorObject | null>
{
	if (login.loggedUser.status == "banned") return null;

	const newMessageBodyPackageCheckIfCanComment: T.NewMessageBodyPackage =
	{
		bodyData: { content: "" },
		options:
		{
			resource: "entry_comment",
			blockDetectorEntryId: null,
			blockDetector: true,
		}
	}

	const newMessageBodyPackageCheckIfBlocked: T.NewMessageBodyPackage =
	{
		bodyData: { content: "" },
		options:
		{
			resource: "pm",
			blockDetector: true,
		}
	}

	// SPRAWDZAMY CZY MOŻEMY KOMENTOWAĆ POD WPISAMI UŻYTKOWNIKA

	// podano ID komentarza
	if (Channel.type == "tag" && Channel instanceof T.ChannelTag)
	{
		if (params.comment_id)
		{
			if (typeof params.comment_id === "string")
			{
				if (!isNaN(parseInt(params.comment_id))) params.comment_id = parseInt(params.comment_id);
				else return null; // podano comment_id który jest stringiem, ale nie można go zamienić na integer
			}

			params.Comment = Channel.comments.get(params.comment_id);
		}
		if (params.Comment)
		{
			if (!params.User) params.User = params.Comment.author;
		}
	}



	// entry_id - podany entry ID, więc wyciągamy z Entry użytkownika i entry_id już mamy
	if (params.entry_id)
	{
		if (typeof params.entry_id === "string")
		{
			if (!isNaN(parseInt(params.entry_id))) params.entry_id = parseInt(params.entry_id);
			else return null; // podano entry_id który jest stringiem, ale nie można go zamienić na integer
		}
	}




	// podano tez id komentarza, więc będziemy sprawdzać autora komentarza, a nie wpisu czyli przechodzimy proces szukania wpisu
	if (params.comment_id) // && typeof params.comment_id === "number" && params.comment_id > 0 && Channel.type == "tag" && Channel instanceof T.ChannelTag)
	{
		if (typeof params.entry_id === "string")
		{
			if (!isNaN(parseInt(params.entry_id))) params.entry_id = parseInt(params.entry_id);
			else return null; // podano entry_id który jest stringiem, ale nie można go zamienić na integer


		}
	}
	// podano tylko id wpisu, więc ustawiamy Entry
	else if (Channel.type == "tag" && Channel instanceof T.ChannelTag)
	{
		params.Entry = Channel.entries.get(params.entry_id);
	}
	else
	{
		newMessageBodyPackageCheckIfCanComment.options.blockDetectorEntryId = params.entry_id;
	}

	// ENTRY, nie komentarz
	if (params.Entry && typeof params.Entry == "object" && params.Entry.resource == "entry" && params.Entry.id != null && params.Entry.id > 0)
	{
		newMessageBodyPackageCheckIfCanComment.options.resource = "entry_comment";
		newMessageBodyPackageCheckIfCanComment.options.blockDetectorEntryId = params.Entry.entry_id;
	}
	else if (params.Comment && typeof params.Comment == "object" && params.Comment.resource == "entry_comment" && params.Comment.id != null && params.Comment.id > 0)
	{
		newMessageBodyPackageCheckIfCanComment.options.resource = "entry_comment";
		// skoro jest podany komentarz, to musimy ustalić użytkownika i jego najnowszy wpis
		// newMessageBodyPackage.options.blockDetectorEntryId = params.Entry.entry_id;
	}


	const resultBlockDetectorObject: T.BlockDetectorObject = null;
	// TODO - tutaj sprawdzić czy mozna odpisać pod tym wpisem bo mamy gotowe ENTRY
	// TODO 
	// resultBlockDetectorObject.isBlocking = checkIfYouCanCommentInUsersEntry();
	// resultBlockDetectorObject.isBlockingAndCanNotComment = checkIfYouCanCommentInUsersEntry();
	// NIE MAMY GOTOWEGO ENTRY

	if (resultBlockDetectorObject)
	{
		if (resultBlockDetectorObject.isBlockingAndCanNotComment == true)
		{
			// UŻYTKOWNIK BLOKUJE I NIE MOŻNA ODPOWIADAĆ W JEGO WPISACH
			return resultBlockDetectorObject;
		}
		else
		{
			// TODO sprawdzić czy mozemy wyslac wiadomosc do uzytkownika czyli czy nas blokuje, ale mozemy pisać pod jego wpisami
		}
	}


	// T.BlockDetectorObject
	// export class BlockDetectorObject
	// {
	// 	isBlocking?: boolean;
	// 	isBlockingAndCanNotComment?: boolean;
	// 	dateLastChecked?: Date;

	// 	constructor(blockDetectorObject: BlockDetectorObject)
	// 	{
	// 		this.isBlocking = blockDetectorObject.isBlocking ? blockDetectorObject.isBlocking : false;
	// 		this.isBlockingAndCanNotComment = blockDetectorObject.isBlockingAndCanNotComment ? blockDetectorObject.isBlockingAndCanNotComment : blockDetectorObject.isBlocking ? true : false;
	// 		if (blockDetectorObject.dateLastChecked) this.dateLastChecked = blockDetectorObject.dateLastChecked;
	// 	}
	// }

	// SPRAWDZAMY CZY UŻYTKOWNIK NAS BLOKUJE PRZEZ PM
	// username:
	if (params.username && typeof params.username == "string" && params.username.length >= CONST.minimum_username_length && params.username.length <= CONST.maximum_username_length)
	{
		newMessageBodyPackageCheckIfCanComment.options.resource = "pm";
		newMessageBodyPackageCheckIfCanComment.options.blockDetectorUsername = params.username;
	}
	// User
	else if (params.User && typeof params.User == "object" && params.User.username != null && params.User.username.length >= CONST.minimum_username_length && params.User.username.length <= CONST.maximum_username_length)
	{
		newMessageBodyPackageCheckIfCanComment.options.resource = "pm";
		newMessageBodyPackageCheckIfCanComment.options.blockDetectorUsername = params.User.username;
	}
	// PM
	else if (params.PM && typeof params.PM == "object" && params.PM.partner != null && params.PM.partner.username != null && params.PM.partner.username.length >= CONST.minimum_username_length && params.PM.partner.username.length <= CONST.maximum_username_length)
	{
		newMessageBodyPackageCheckIfCanComment.options.resource = "pm";
		newMessageBodyPackageCheckIfCanComment.options.blockDetectorUsername = params.PM.partner.username;
	}


}


export async function checkIfYouCanSendPMToUser(User: T.User)  			//params: T.BlockDetectorCheckOptions, ChannelObject?: T.Channel): Promise<boolean>
{

}
export async function checkIfYouCanCommentInUsersEntry(Entry: T.Entry)  //params: T.BlockDetectorCheckOptions, ChannelObject?: T.Channel): Promise<boolean>
{
	if (login.loggedUser.status == "banned") return true;

	const newMessageBodyPackage: T.NewMessageBodyPackage =
	{
		bodyData: { content: "" },
		options:
		{
			blockDetector: true,
		}
	}

	if (dev) console.log(`checkIfYouCanPost() - resource: ${newMessageBodyPackage.options.resource} / username: ${newMessageBodyPackage.options.blockDetectorUsername} / entry_id: ${newMessageBodyPackage.options.blockDetectorEntryId}`);

	try
	{
		let canPostCommentInEntry = await api.postNewMessage(null, newMessageBodyPackage);
		// error.status = 400 (jestes blokowany)
		// error.status = 409 (pusta tresc)
		// error.status = 429 (wykorzystano limit)

		if (canPostCommentInEntry == 400)
		{
			db.updateBlockDetectorUser(new T.User(newMessageBodyPackage.options.blockDetectorUsername));
			return false;
		}
		else
		{

		}
	}
	catch (error: unknown)
	{
		let httpError = error as T.HTTPError;

		switch (httpError.status)
		{
			case 400:
				// UZYTKOWNIK CIĘ BLOKUJE
				return false;
				break;
			case 409:
				// MOZED ODPISYWAĆ - WSZYSTKO OK (po prostu za krotka wiadomosc)
				return true;
				break;
			case 429:
				// INNY BLAD - ZA DUZO REQUESTOW
				break;
			default:
			// Other status codes
		}
	}
}


