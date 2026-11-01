import * as React from "react";
import { cn } from "@/lib/utils";

const Card=React.forwardRef<HTMLDivElement,React.HTMLAttributes<HTMLDivElement>>(({className,...props},ref)=><div ref={ref} data-slot="card" className={cn("rounded-xl border bg-card text-card-foreground shadow-sm",className)} {...props}/>);
Card.displayName="Card";
const CardHeader=({className,...props}:React.HTMLAttributes<HTMLDivElement>)=><div data-slot="card-header" className={cn("flex flex-col gap-1.5 p-5",className)} {...props}/>;
const CardTitle=({className,...props}:React.HTMLAttributes<HTMLHeadingElement>)=><h3 data-slot="card-title" className={cn("font-semibold leading-none tracking-tight",className)} {...props}/>;
const CardDescription=({className,...props}:React.HTMLAttributes<HTMLParagraphElement>)=><p data-slot="card-description" className={cn("text-sm text-muted-foreground",className)} {...props}/>;
const CardContent=({className,...props}:React.HTMLAttributes<HTMLDivElement>)=><div data-slot="card-content" className={cn("p-5 pt-0",className)} {...props}/>;
const CardFooter=({className,...props}:React.HTMLAttributes<HTMLDivElement>)=><div data-slot="card-footer" className={cn("flex items-center p-5 pt-0",className)} {...props}/>;
export {Card,CardHeader,CardFooter,CardTitle,CardDescription,CardContent};
