import * as React from "react";

import { cn } from "../lib";

const Table = ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
	<div className="w-full overflow-auto">
		<table className={cn("w-full caption-bottom text-ui", className)} {...props} />
	</div>
);

const TableHeader = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
	<thead className={cn("[&_tr]:border-b", className)} {...props} />
);

const TableBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
	<tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);

const TableFooter = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
	<tfoot className={cn("border-t border-border", className)} {...props} />
);

const TableRow = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
	<tr
		className={cn(
			"border-b border-border transition-colors hover:bg-accent/60 data-[state=selected]:bg-accent",
			className,
		)}
		{...props}
	/>
);

const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
	<th
		className={cn(
			"h-11 px-3 [&:has([role=checkbox])]:pr-0 text-left align-middle label-caps text-muted-foreground",
			className,
		)}
		{...props}
	/>
);

const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
	<td
		className={cn("px-3 py-3 [&:has([role=checkbox])]:pr-0 align-middle", className)}
		{...props}
	/>
);

const TableCaption = ({ className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) => (
	<caption className={cn("mt-4 text-meta text-muted-foreground", className)} {...props} />
);

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
