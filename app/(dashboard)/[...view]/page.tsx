import DashboardView from '../views/dashboard-view';
import ProductsView from '../views/products-view';
import OrdersView from '../views/orders-view';
import ProfileView from '../views/profile-view';
import SettingsView from '../views/settings-view';

interface Props {
  params: Promise<{ view?: string[] }>;
}

export default async function DashboardPage({ params }: Props) {
  const { view } = await params;
  const viewName = view?.[0] || 'dashboard';

  switch (viewName) {
    case 'products':
      return <ProductsView />;
    case 'orders':
      return <OrdersView />;
    case 'profile':
      return <ProfileView />;
    case 'settings':
      return <SettingsView />;
    default:
      return <DashboardView />;
  }
}
