"use client";

import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";

import { cn } from "../lib";
import { Button } from "./button";

type ToasterProps = React.ComponentProps<typeof Sonner>;

interface ToastProps {
	id: number | string;
	title?: string;
	description?: string;
	action?: {
		label: string;
		onClick: () => void;
	};
	cancel?: {
		label: string;
		onClick?: () => void;
	};
	icon?: React.ReactNode;
	type?: "success" | "error" | "info" | "warning" | "loading" | "default";
}

function Toast({ id, title, description, action, cancel, icon, type = "default" }: ToastProps) {
	// A slip, not a toast: flat paper with a 1px edge, words first, no decorative icons. An error
	// or a warning also carries its glyph, so the edge colour is never the only signal.
	const edge =
		type === "error"
			? "border-destructive"
			: type === "warning"
				? "border-warning"
				: type === "success"
					? "border-foreground"
					: "border-border";
	const glyph =
		icon ??
		(type === "error" ? (
			<CircleAlertIcon className="size-5 text-destructive" aria-hidden="true" />
		) : type === "warning" ? (
			<TriangleAlertIcon className="size-5 text-warning" aria-hidden="true" />
		) : null);

	return (
		<div
			role={type === "error" ? "alert" : "status"}
			className={cn(
				"group gap-3 px-4 py-3 sm:min-w-[22rem] pointer-events-auto relative flex w-full items-start border bg-popover text-popover-foreground",
				edge,
			)}
		>
			{glyph !== undefined && glyph !== null && (
				<div className="mt-0.5 flex shrink-0 items-center">{glyph}</div>
			)}
			<div className="gap-1 flex flex-1 flex-col">
				{title && <div className="font-display text-letter">{title}</div>}
				{description && (
					<div className="text-meta text-muted-foreground">{description}</div>
				)}
				{(action || cancel) && (
					<div className="mt-1 gap-4 flex">
						{action && (
							<Button variant="link" size="sm" onClick={action.onClick}>
								{action.label}
							</Button>
						)}
						{cancel && (
							<Button
								variant="link"
								size="sm"
								className="text-muted-foreground"
								onClick={() => {
									cancel.onClick?.();
									sonnerToast.dismiss(id);
								}}
							>
								{cancel.label}
							</Button>
						)}
					</div>
				)}
			</div>
			{type === "loading" && <span className="sr-only">…</span>}
		</div>
	);
}

const Toaster = ({ ...props }: ToasterProps) => {
	return (
		<Sonner
			className="toaster group"
			toastOptions={{
				duration: 5000,
			}}
			{...props}
		/>
	);
};

type ToastOptions = Omit<Parameters<typeof sonnerToast.custom>[1], "description" | "title">;

interface ToastFunctionProps extends Omit<ToastProps, "id"> {
	description?: string;
}

function toast({
	title,
	description,
	action,
	cancel,
	icon,
	type = "default",
	...props
}: ToastFunctionProps & ToastOptions) {
	return sonnerToast.custom(
		(id) => (
			<Toast
				id={id}
				title={title}
				description={description}
				action={action}
				cancel={cancel}
				icon={icon}
				type={type}
			/>
		),
		props,
	);
}

const toastSuccess = (
	title: string,
	description?: string,
	options?: ToastOptions,
): ReturnType<typeof sonnerToast.custom> => {
	return toast({ title, description, type: "success", ...options });
};

const toastError = (
	title: string,
	description?: string,
	options?: ToastOptions,
): ReturnType<typeof sonnerToast.custom> => {
	return toast({ title, description, type: "error", ...options });
};

const toastInfo = (
	title: string,
	description?: string,
	options?: ToastOptions,
): ReturnType<typeof sonnerToast.custom> => {
	return toast({ title, description, type: "info", ...options });
};

const toastWarning = (
	title: string,
	description?: string,
	options?: ToastOptions,
): ReturnType<typeof sonnerToast.custom> => {
	return toast({ title, description, type: "warning", ...options });
};

const toastLoading = (
	title: string,
	description?: string,
	options?: ToastOptions,
): ReturnType<typeof sonnerToast.custom> => {
	return toast({ title, description, type: "loading", ...options });
};

const dismiss = (toastId?: number | string) => {
	sonnerToast.dismiss(toastId);
};

type PromiseOptions<T> = {
	loading: string | (() => string);
	success: string | ((data: T) => string);
	error: string | ((error: unknown) => string);
};

const toastPromise = <T,>(
	promise: Promise<T> | (() => Promise<T>),
	options: PromiseOptions<T>,
): ReturnType<typeof sonnerToast.promise> => {
	return sonnerToast.promise(promise, {
		loading: typeof options.loading === "function" ? options.loading() : options.loading,
		success: (data: T) =>
			typeof options.success === "function" ? options.success(data) : options.success,
		error: (error: unknown) =>
			typeof options.error === "function" ? options.error(error) : options.error,
	});
};

export {
	Toaster,
	toast,
	toastSuccess,
	toastError,
	toastInfo,
	toastWarning,
	toastLoading,
	toastPromise,
	dismiss,
};
