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
//# sourceMappingURL=index.d.ts.map