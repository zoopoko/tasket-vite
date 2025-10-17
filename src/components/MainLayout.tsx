
/**
 * メインレイアウトコンポーネント
 * サイドバー付きのレイアウトを提供
 */
import Sidebar from './Sidebar';
import { NotificationProvider } from '@/lib/notification-context';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <NotificationProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </NotificationProvider>
  );
}
