import {Youtube, BookOpen, GraduationCap, ClipboardList, FileCheck2, FileText} from 'lucide-react';

export default function ResourceIcon({type, size = 18}: {type: string; size?: number}) {
  const Icon = type === 'video' ? Youtube : type === 'book' ? BookOpen : type === 'course' ? GraduationCap : type === 'test' ? ClipboardList : type === 'pyq' ? FileCheck2 : FileText;
  return <Icon size={size} />;
}
