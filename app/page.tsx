import {redirect} from 'next/navigation';import {user} from '@/lib/auth';
export default async function Home(){const u=await user();redirect(u?(u.profile?'/dashboard':'/setup'):'/login')}
