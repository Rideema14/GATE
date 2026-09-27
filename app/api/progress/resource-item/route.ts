import {NextResponse} from 'next/server';import {db} from '@/lib/db';import {authId} from '@/lib/auth';
export async function POST(req:Request){
 const u=await authId();if(!u)return NextResponse.json({error:'Unauthorized'},{status:401});
 const {id,completed,progress}=await req.json();
 // One query instead of three: pull the resource's full item list alongside
 // the item being toggled, so the new completed/total counts can be worked
 // out in memory instead of two separate COUNT round trips.
 const item=await db.resourceItem.findFirst({where:{id},include:{resource:{include:{items:true}}}});
 if(!item||item.resource.userId!==u)return NextResponse.json({error:'Not found'},{status:404});
 const nextCompleted=completed??item.completed;
 const updated=await db.resourceItem.update({where:{id},data:{completed:nextCompleted,progress:Math.max(0,Math.min(100,Number(progress??item.progress)))}});
 const total=item.resource.items.length;
 const count=item.resource.items.filter(x=>x.id===id?nextCompleted:x.completed).length;
 await db.resource.update({where:{id:item.resourceId},data:{completedUnits:count,totalUnits:Math.max(item.resource.totalUnits,total)}});
 return NextResponse.json(updated);
}
