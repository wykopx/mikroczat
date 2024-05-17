import * as T from './types.js';
export declare const loginDialog: HTMLDialogElement;
export declare let mikroczatLoggedIn: boolean;
export declare let mikroczatLoggedByWykopCzatButton: boolean;
export declare let loggedUser: T.User;
export declare let tokensObject: T.TokensObject;
export declare function getTokenObjectFromLocalStorage(username?: string): T.TokensObject;
export declare function processLoginData(pastedData: string): boolean;
export declare function logIn(): Promise<boolean | any>;
export declare function loginAsGuest(): Promise<boolean>;
export declare function confirmLoggedIn(): Promise<void>;
//# sourceMappingURL=login.d.ts.map