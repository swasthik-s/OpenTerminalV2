import * as React from "react";
import {cva,type VariantProps} from "class-variance-authority";
import {cn} from "@/lib/utils";
const alertVariants=cva("relative w-full rounded-xl border px-4 py-3 text-sm",[ ] as any);
function Alert({className,...props}:React.HTMLAttributes<HTMLDivElement>){return <div role="alert" className={cn("relative w-full rounded-xl border px-4 py-3 text-sm",className)} {...props}/>;}
function AlertTitle({className,...props}:React.HTMLAttributes<HTMLHeadingElement>){return <h5 className={cn("mb-1 font-semibold leading-none tracking-tight",className)} {...props}/>;}
function AlertDescription({className,...props}:React.HTMLAttributes<HTMLParagraphElement>){return <div className={cn("text-sm text-muted-foreground [&_p]:leading-relaxed",className)} {...props}/>;}
export {Alert,AlertTitle,AlertDescription};
