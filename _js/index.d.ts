import * as T from './types.js';
export declare let wykopDomain: string;
export declare const root: HTMLElement;
export declare const head: HTMLHeadElement;
export declare const body: HTMLElement;
export declare const main: HTMLElement;
export declare const centerHeader: HTMLElement;
export declare const youtubeIframe: HTMLIFrameElement;
export declare const chooseChannelDialog: HTMLDialogElement;
export declare const openedChannels: Map<string, T.Channel>;
export declare const activeChannels: [T.Channel | null, T.Channel | null];
export declare const sounds: T.Sounds;
declare global {
    interface Window {
        logout: () => void;
        youtubeswitch: () => void;
        spotifyswitch: () => void;
    }
}
export declare function generateTabTitle(ChannelObject: T.Channel): string;
//# sourceMappingURL=index.d.ts.map