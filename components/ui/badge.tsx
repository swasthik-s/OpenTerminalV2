import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const badgeVariants=cva("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",{
 variants:{variant:{default:"border-transparent bg-primary/15 text-primary",secondary:"border-transparent bg-secondary text-secondary-foreground",outline:"border-border text-muted-foreground",success:"border-transparent bg-up/10 text-up",danger:"border-transparent bg-down/10 text-down",warning:"border-transparent bg-warn/10 text-warn"}},
 defaultVariants:{variant:"default"}
});
function Badge({className,variant,...props}:React.HTMLAttributes<HTMLSpanElement>&VariantProps<typeof badgeVariants>){return <span className={cn(badgeVariants({variant}),className)} {...props}/>;}
export {Badge,badgeVariants};
