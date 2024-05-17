export declare class NotificationsStatus {
    tag_notification?: boolean;
    tag_notification_count?: number;
    entry_notification?: boolean;
    entry_notification_count?: number;
    pm?: boolean;
    pm_notification?: boolean;
    pm_notification_count?: number;
    constructor(NotificationsStatusJSON?: any);
    refreshAPI(): Promise<unknown>;
}
export declare const notificationsStatus: NotificationsStatus;
//# sourceMappingURL=wykop_notifications.d.ts.map