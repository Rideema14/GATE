import {NextResponse} from 'next/server';import {db} from '@/lib/db';import {user} from '@/lib/auth';
export async function POST(req:Request){
 const u=await user();if(!u)return NextResponse.json({error:'Unauthorized'},{status:401});
 const {id,completed,progress}=await req.json();
 const item=await db.resourceItem.findFirst({where:{id},include:{resource:true}});if(!item||item.resource.userId!==u.id)return NextResponse.json({error:'Not found'},{status:404});
 const updated=await db.resourceItem.update({where:{id},data:{completed:completed??item.completed,progress:Math.max(0,Math.min(100,Number(progress??item.progress)))}});
 const count=await db.resourceItem.count({where:{resourceId:item.resourceId,completed:true}}); const total=await db.resourceItem.count({where:{resourceId:item.resourceId}});
 await db.resource.update({where:{id:item.resourceId},data:{completedUnits:count,totalUnits:Math.max(item.resource.totalUnits,total)}});
 return NextResponse.json(updated);
}
