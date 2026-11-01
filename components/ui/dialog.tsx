"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {X} from "lucide-react";
import {cn} from "@/lib/utils";
function Dialog(props:React.ComponentProps<typeof DialogPrimitive.Root>){return <DialogPrimitive.Root data-slot="dialog" {...props}/>;}
function DialogTrigger(props:React.ComponentProps<typeof DialogPrimitive.Trigger>){return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props}/>;}
function DialogContent({className,children,...props}:React.ComponentProps<typeof DialogPrimitive.Content>){return <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out"/><DialogPrimitive.Content data-slot="dialog-content" className={cn("fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border bg-popover p-6 text-popover-foreground shadow-2xl",className)} {...props}>{children}<DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground opacity-70 hover:bg-accent hover:opacity-100"><X className="size-4"/><span className="sr-only">Close</span></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal>;}
function DialogHeader(props:React.HTMLAttributes<HTMLDivElement>){return <div className="flex flex-col gap-1.5 text-left" {...props}/>;}
function DialogTitle(props:React.ComponentProps<typeof DialogPrimitive.Title>){return <DialogPrimitive.Title className="text-lg font-semibold tracking-tight" {...props}/>;}
function DialogDescription(props:React.ComponentProps<typeof DialogPrimitive.Description>){return <DialogPrimitive.Description className="text-sm text-muted-foreground" {...props}/>;}
export {Dialog,DialogTrigger,DialogContent,DialogHeader,DialogTitle,DialogDescription};
