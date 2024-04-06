import * as T from './types.js';
export declare function fetchAPIrefreshTokens(tokensObject?: T.TokensObject): Promise<T.TokensObject | boolean>;
export declare function saveTokensToDatabase(tokensObject: T.TokensObject): boolean;
export declare function saveToken(unknownToken: T.TokensObject | T.UnknownToken): false | T.TokensObject;
export declare function getTokenFromDatabase(username?: string): T.TokensObject;
export declare function getEntriesFromChannel(ChannelObject: T.Channel, limit?: number): Promise<T.Entry[]>;
export declare function getCommentsFromEntry(entryId: number, limit?: number, page?: number): Promise<T.Comment[]>;
//# sourceMappingURL=wykop_api.d.ts.map