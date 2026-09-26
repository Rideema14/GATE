import {cookies} from 'next/headers'; import {SignJWT,jwtVerify} from 'jose'; import bcrypt from 'bcryptjs'; import {db} from './db';
const secret=new TextEncoder().encode(process.env.AUTH_SECRET||'dev-secret-change-me');
export async function hash(p:string){return bcrypt.hash(p,12)} export async function verify(p:string,h:string){return bcrypt.compare(p,h)}
export async function session(id:string){return new SignJWT({sub:id}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('30d').sign(secret)}
export async function user(){const c=await cookies();const t=c.get('session')?.value;if(!t)return null;try{const {payload}=await jwtVerify(t,secret);if(!payload.sub)return null;return db.user.findUnique({where:{id:String(payload.sub)},include:{profile:true}})}catch{return null}}
export async function setSession(id:string){const c=await cookies();c.set('session',await session(id),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*30})}
export async function clearSession(){const c=await cookies();c.set('session','',{httpOnly:true,expires:new Date(0),path:'/'})}
