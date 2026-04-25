import { listMessages } from "./procedures/list-messages";
import { markRead } from "./procedures/mark-read";
import { sendMessage } from "./procedures/send-message";
import { unreadCount } from "./procedures/unread-count";

export const messagesRouter = {
	send: sendMessage,
	list: listMessages,
	markRead: markRead,
	unreadCount: unreadCount,
};
