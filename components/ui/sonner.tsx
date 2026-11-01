"use client";
import {Toaster as Sonner, type ToasterProps} from "sonner";
function Toaster(props:ToasterProps){return <Sonner theme="dark" className="toaster group" toastOptions={{classNames:{toast:"!border-border !bg-card !text-foreground",description:"!text-muted-foreground",actionButton:"!bg-primary !text-primary-foreground",cancelButton:"!bg-secondary !text-secondary-foreground"}}} {...props}/>;}
export {Toaster};
