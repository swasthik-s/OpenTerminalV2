const API_BASE=(process.env.NEXT_PUBLIC_API_BASE_URL??"").replace(/\/$/,"");
export class ApiError extends Error {
  constructor(message:string,public readonly status:number){super(message);this.name="ApiError";}
}
export async function apiGet<T>(path:string,init?:RequestInit):Promise<T>{
  if(!path.startsWith("/"))throw new Error("API paths must begin with /");
  const response=await fetch(`${API_BASE}${path}`,{...init,headers:{"Accept":"application/json",...init?.headers},cache:"no-store"});
  if(!response.ok){const body=await response.text().catch(()=>"");throw new ApiError(body||`Request failed (${response.status})`,response.status);}
  return response.json() as Promise<T>;
}
export async function apiPost<T>(path:string,body:unknown,init?:RequestInit):Promise<T>{
  return apiGet<T>(path,{...init,method:"POST",headers:{"Content-Type":"application/json",...init?.headers},body:JSON.stringify(body)});
}
