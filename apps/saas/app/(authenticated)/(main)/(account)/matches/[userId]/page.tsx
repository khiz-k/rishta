"use client";

import { useSession } from "@auth/hooks/use-session";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, SendIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function ChatPage() {
	const params = useParams<{ userId: string }>();
	const { user } = useSession();
	const queryClient = useQueryClient();
	const [msg, setMsg] = useState("");
	const bottomRef = useRef<HTMLDivElement>(null);

	const { data: profile } = useQuery(
		orpc.profiles.get.queryOptions({ input: { userId: params.userId } }),
	);

	const { data: messages = [], isLoading } = useQuery({
		...orpc.messages.list.queryOptions({ input: { withUserId: params.userId } }),
		refetchInterval: 3000,
	});

	// Mark messages as read when conversation opens
	const markReadMutation = useMutation(orpc.messages.markRead.mutationOptions());
	useEffect(() => {
		if (messages.length > 0) {
			markReadMutation.mutate({ fromUserId: params.userId });
		}
	}, [messages.length, params.userId]);

	const sendMutation = useMutation({
		...orpc.messages.send.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orpc.messages.list.queryKey({ input: { withUserId: params.userId } }) });
			setMsg("");
		},
	});

	const handleSend = () => {
		if (!msg.trim()) return;
		sendMutation.mutate({ toUserId: params.userId, content: msg.trim() });
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	// Auto-scroll to bottom
	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages.length]);

	return (
		<div className="flex flex-col h-[calc(100vh-120px)] max-w-lg mx-auto">
			{/* Header */}
			<div className="flex items-center gap-3 pb-4 border-b border-border">
				<Link href="/matches" className="size-8 rounded-full hover:bg-accent flex items-center justify-center">
					<ArrowLeftIcon className="size-4" />
				</Link>
				<div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
					<span className="font-display font-bold text-primary">{profile?.displayName?.charAt(0) || "?"}</span>
				</div>
				<div>
					<p className="font-display font-semibold text-sm">{profile?.displayName || "Loading..."}</p>
					<p className="text-xs text-muted-foreground">Matched</p>
				</div>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto py-4 space-y-3">
				{isLoading ? (
					<div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted rounded-xl animate-pulse max-w-[60%]" style={{ marginLeft: i % 2 ? "auto" : 0 }} />)}</div>
				) : messages.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-center">
						<p className="text-muted-foreground text-sm">No messages yet</p>
						<p className="text-muted-foreground/60 text-xs mt-1">Say hello to start the conversation</p>
					</div>
				) : (
					messages.map((m: any, i: number) => {
						const isMe = m.fromUserId === user?.id;
						return (
							<motion.div
								key={m.id}
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: i * 0.02 }}
								className={`flex ${isMe ? "justify-end" : "justify-start"}`}
							>
								<div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
									isMe
										? "bg-primary text-primary-foreground rounded-br-md"
										: "bg-muted text-foreground rounded-bl-md"
								}`}>
									<p>{m.content}</p>
								<div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : ""}`}>
									<p className={`text-[10px] ${isMe ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>
										{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
									</p>
									{isMe && (
										<span className={`text-[10px] ${m.read ? "text-primary-foreground/80" : "text-primary-foreground/40"}`}>
											{m.read ? "✓✓" : "✓"}
										</span>
									)}
								</div>
								</div>
							</motion.div>
						);
					})
				)}
				<div ref={bottomRef} />
			</div>

			{/* Input */}
			<div className="pt-3 border-t border-border">
				<div className="flex gap-2">
					<Input
						placeholder="Type a message..."
						value={msg}
						onChange={(e) => setMsg(e.target.value)}
						onKeyDown={handleKeyDown}
						className="flex-1"
					/>
					<Button
						onClick={handleSend}
						disabled={!msg.trim()}
						loading={sendMutation.isPending}
						size="icon"
					>
						<SendIcon className="size-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
