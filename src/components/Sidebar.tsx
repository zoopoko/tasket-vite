
/**
 * サイドバーコンポーネント
 * すべてのメインページで使用する統一ナビゲーション
 * 開閉可能でレスポンシブ対応
 */
import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useNotifications } from '@/lib/notification-context';

export default function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(true);

  const navigation = [
    { name: 'ダッシュボード', href: '/dashboard', icon: '📊' },
    { name: '案件一覧', href: '/projects', icon: '📋' },
    { name: '案件作成', href: '/projects/new', icon: '➕' },
    { name: 'チャット', href: '/chat', icon: '💬' },
    { name: '提案管理', href: '/proposals', icon: '📝' },
    { name: '通知', href: '/notifications', icon: '🔔', badge: unreadCount },
    { name: 'レビュー', href: '/reviews', icon: '⭐' },
    { name: 'プロフィール', href: '/profile', icon: '👤' },
  ];

  const isActive = (href: string) => {
    // 完全一致を優先
    if (pathname === href) {
      return true;
    }

    // ダッシュボードは完全一致のみ
    if (href === '/dashboard') {
      return false;
    }

    // 特定のパスは完全一致または子パス（IDなど）のみ
    // 例: /projects は /projects/[id] にマッチするが /projects/new にはマッチしない
    if (href === '/projects') {
      // /projects/new や /projects/new-with-ai は除外
      return pathname === '/projects' ||
             (pathname?.startsWith('/projects/') &&
              !pathname.startsWith('/projects/new'));
    }

    // その他のパスは前方一致
    return pathname?.startsWith(href) || false;
  };

  return (
    <>
      {/* モバイル用オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* サイドバー */}
      <div
        className={`fixed left-0 top-0 z-30 flex h-screen flex-col bg-gray-900 text-white transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* ヘッダー: ロゴ + トグルボタン */}
        <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
          <Link
            to="/dashboard"
            className={`text-2xl font-bold text-blue-400 transition-opacity ${
              isOpen ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {isOpen && 'Tasket'}
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg bg-gray-800 p-2 hover:bg-gray-700 transition-colors"
            aria-label="サイドバーを開閉"
          >
            {isOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  title={!isOpen ? item.name : undefined}
                >
                  <span className="text-xl relative">
                    {item.icon}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </span>
                  {isOpen && (
                    <span className="flex items-center gap-2">
                      {item.name}
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ユーザー情報・ログアウト */}
        <div className="border-t border-gray-800 p-4">
          {isOpen ? (
            <>
              <div className="mb-3 rounded-lg bg-gray-800 p-3">
                <p className="text-xs text-gray-400">ログイン中</p>
                <p className="truncate text-sm font-medium">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                ログアウト
              </button>
            </>
          ) : (
            <button
              onClick={logout}
              className="w-full rounded-lg bg-red-600 p-3 text-lg hover:bg-red-700 transition-colors"
              title="ログアウト"
            >
              🚪
            </button>
          )}
        </div>
      </div>

      {/* メインコンテンツ用のスペーサー */}
      <div className={`transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`} />
    </>
  );
}
