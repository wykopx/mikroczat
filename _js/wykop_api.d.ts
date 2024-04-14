import * as T from './types.js';
export declare function getXNewestEntriesFromChannel(ChannelObject: T.Channel, limit?: number, FETCH_DELAY_MILLISECONDS?: number): Promise<T.Entry[]>;
export declare function getXNewestEntriesFromChannelFromPageHash(ChannelObject: T.Channel, pageHash: string, limit?: number): Promise<T.Entry[]>;
export declare function getAllCommentsFromEntry(entry: T.Entry, FETCH_DELAY_MILLISECONDS?: number): Promise<T.Comment[]>;
export declare function getCommentsFromEntryFromPageNumber(entry: T.Entry, page?: number, limit?: number): Promise<T.Comment[]>;
export declare function postNewMessageToChannel(ChannelObject: T.Channel, message: T.Entry): Promise<T.Entry>;
export declare function fetchAPIrefreshTokens(tokensObject?: T.TokensObject): Promise<T.TokensObject | boolean>;
export declare function saveTokensToDatabase(tokensObject: T.TokensObject): boolean;
export declare function saveToken(unknownToken: T.TokensObject | T.UnknownToken): false | T.TokensObject;
export declare function getTokenFromDatabase(username?: string): T.TokensObject;
//# sourceMappingURL=wykop_api.d.ts.map