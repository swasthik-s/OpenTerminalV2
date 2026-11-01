import {NextRequest,NextResponse} from "next/server";

const API_URL=process.env.API_URL?.replace(/\/+$/,"");
const API_KEY=process.env.API_KEY;

async function proxy(req:NextRequest,path:string[]):Promise<NextResponse>{
 if(!API_URL)return NextResponse.json({error:"Backend is not configured. Set API_URL to the existing OpenTerminal server URL."},{status:503});
 try{
  const headers=new Headers();
  const type=req.headers.get("content-type");if(type)headers.set("content-type",type);
  if(API_KEY)headers.set("x-api-key",API_KEY);
  const forwarded=req.headers.get("x-forwarded-for");if(forwarded)headers.set("x-forwarded-for",forwarded);
  const body=["GET","HEAD","DELETE"].includes(req.method)?undefined:await req.arrayBuffer();
  const upstream=await fetch(`${API_URL}/api/${path.join("/")}${req.nextUrl.search}`,{method:req.method,headers,body,cache:"no-store",signal:AbortSignal.timeout(15000)});
  const payload=upstream.status===204?null:await upstream.arrayBuffer();
  return new NextResponse(payload,{status:upstream.status,headers:{"content-type":upstream.headers.get("content-type")??"application/json"}});
 }catch(error){const message=error instanceof Error?error.message:"Unknown upstream error";console.error("[OpenTerminal proxy]",message);return NextResponse.json({error:"Could not reach the OpenTerminal backend."},{status:502});}
}
type RouteContext={params:Promise<{path:string[]}>};
export async function GET(req:NextRequest,ctx:RouteContext){return proxy(req,(await ctx.params).path);}
export async function POST(req:NextRequest,ctx:RouteContext){return proxy(req,(await ctx.params).path);}
export async function PUT(req:NextRequest,ctx:RouteContext){return proxy(req,(await ctx.params).path);}
export async function PATCH(req:NextRequest,ctx:RouteContext){return proxy(req,(await ctx.params).path);}
export async function DELETE(req:NextRequest,ctx:RouteContext){return proxy(req,(await ctx.params).path);}
