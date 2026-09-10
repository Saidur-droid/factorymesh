import { FactoryMeshDemo } from '@/components/factorymesh-demo';

export const metadata = {
  title: 'Interactive Demo',
  description: 'A safe real-user simulation of the FactoryMesh manufacturing orchestration workflow.',
};

export default function DemoPage() {
  return <FactoryMeshDemo />;
}
