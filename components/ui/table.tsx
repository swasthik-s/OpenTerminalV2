import * as React from "react";
import {cn} from "@/lib/utils";
const Table=React.forwardRef<HTMLTableElement,React.HTMLAttributes<HTMLTableElement>>(({className,...props},ref)=><div className="relative w-full overflow-auto"><table ref={ref} className={cn("w-full caption-bottom text-sm",className)} {...props}/></div>);Table.displayName="Table";
const TableHeader=({className,...props}:React.HTMLAttributes<HTMLTableSectionElement>)=><thead className={cn("[&_tr]:border-b [&_tr]:border-border",className)} {...props}/>;
const TableBody=({className,...props}:React.HTMLAttributes<HTMLTableSectionElement>)=><tbody className={cn("[&_tr:last-child]:border-0",className)} {...props}/>;
const TableRow=({className,...props}:React.HTMLAttributes<HTMLTableRowElement>)=><tr className={cn("border-b border-border/60 transition-colors hover:bg-accent/40",className)} {...props}/>;
const TableHead=({className,...props}:React.ThHTMLAttributes<HTMLTableCellElement>)=><th className={cn("h-10 px-3 text-left align-middle text-xs font-medium text-muted-foreground",className)} {...props}/>;
const TableCell=({className,...props}:React.TdHTMLAttributes<HTMLTableCellElement>)=><td className={cn("px-3 py-3 align-middle text-sm",className)} {...props}/>;
export {Table,TableHeader,TableBody,TableHead,TableRow,TableCell};
