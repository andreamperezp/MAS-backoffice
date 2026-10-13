import type { Metadata } from 'next';
import { PanelView } from '@/features/panel/PanelView';

export const metadata: Metadata = { title: 'Panel' };

export default function PanelPage() {
  return <PanelView />;
}
