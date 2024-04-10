import * as T from './types.js';
declare global {
    interface Window {
        logout: () => void;
        youtubeswitch: () => void;
        spotifyswitch: () => void;
        activateChannel: (channel: string | T.Channel) => void;
    }
}
export declare let user: T.User;
export declare let tokensObject: T.TokensObject;
export declare function updateCSSPropertyOnMessageArticleElement(entryOrCommentObject: T.Entry | T.Comment, commentOrVotesObject: T.Votes | T.Comments | number): void;
export declare function checkAndInsertNewCommentsInEntry(ChannelObject: T.Channel, EntryObject: T.Entry): Promise<void>;
//# sourceMappingURL=index.d.ts.map