export function getNumberOfOnlineUsersOnChannel(ChannelObject) {
    return Array.from(ChannelObject.users.values()).filter(user => user.online).length;
}
//# sourceMappingURL=ch_fn.js.map