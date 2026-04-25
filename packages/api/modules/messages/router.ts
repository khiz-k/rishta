import { listMessages } from "./procedures/list-messages";
import { sendMessage } from "./procedures/send-message";

export const messagesRouter = {
	send: sendMessage,
	list: listMessages,
};
