"use client";
import {useEffect} from "react";
import {Button} from "@/components/ui/button";
export default function Error({error,reset}:{error:Error&{digest?:string};reset:()=>void}){useEffect(()=>{console.error(error)},[error]);return <main className="flex min-h-screen items-center justify-center bg-[var(--page)] p-6"><div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center"><h2 className="text-lg font-semibold">Workspace error</h2><p className="mt-2 text-sm text-muted-foreground">The interface encountered an unexpected error.</p><Button className="mt-5" onClick={()=>reset()}>Try again</Button></div></main>}
