
/**
 * 管理画面ダッシュボード
 * プラットフォーム運営者が全体の状況を確認できる
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';

interface Stats {
  totalProjects: number;
  totalProposals: number;
  totalUsers: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    totalProposals: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!user) return;

        const token = await user.getIdToken();

        // 実際の統計データをAPIから取得
        const response = await fetch('https://api.task-et.com/api/admin/statistics', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('統計情報の取得に失敗しました');
        }

        const data = await response.json();
        const { statistics } = data;

        setStats({
          totalProjects: statistics.projects.total,
          totalProposals: statistics.proposals.total,
          totalUsers: statistics.users.total,
          totalRevenue: statistics.payments.platform_fee_revenue,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        // エラー時はモックデータを表示
        setStats({
          totalProjects: 0,
          totalProposals: 0,
          totalUsers: 0,
          totalRevenue: 0,
        });
      } finally {
        setLoadingStats(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (loading || loadingStats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">管理画面</h1>
            <Link
              to="/dashboard"
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              ダッシュボードに戻る
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 統計情報カード */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* 総案件数 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-700">総案件数</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {stats.totalProjects}
            </p>
            <p className="mt-1 text-sm text-gray-600">件</p>
          </div>

          {/* 総提案数 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-700">総提案数</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {stats.totalProposals}
            </p>
            <p className="mt-1 text-sm text-gray-600">件</p>
          </div>

          {/* 総ユーザー数 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-700">総ユーザー数</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {stats.totalUsers}
            </p>
            <p className="mt-1 text-sm text-gray-600">人</p>
          </div>

          {/* 総収益 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-700">総収益（手数料）</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              ¥{stats.totalRevenue.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-gray-600">プラットフォーム手数料3.3%</p>
          </div>
        </div>

        {/* 機能リンク */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* ユーザー管理 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">ユーザー管理</h3>
            <p className="mt-2 text-sm text-gray-600">
              ユーザーの一覧表示、アカウント管理
            </p>
            <button
              onClick={() => alert('ユーザー管理機能は今後実装予定です')}
              className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              管理する
            </button>
          </div>

          {/* 案件管理 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">案件管理</h3>
            <p className="mt-2 text-sm text-gray-600">
              案件の一覧表示、ステータス確認
            </p>
            <button
              onClick={() => alert('案件管理機能は今後実装予定です')}
              className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              管理する
            </button>
          </div>

          {/* 決済管理 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">決済管理</h3>
            <p className="mt-2 text-sm text-gray-600">
              決済履歴の確認、収益分析
            </p>
            <button
              onClick={() => alert('決済管理機能は今後実装予定です')}
              className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              管理する
            </button>
          </div>

          {/* レビュー管理 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">レビュー管理</h3>
            <p className="mt-2 text-sm text-gray-600">
              不適切なレビューの削除、通報管理
            </p>
            <button
              onClick={() => alert('レビュー管理機能は今後実装予定です')}
              className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              管理する
            </button>
          </div>

          {/* 通知管理 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">通知管理</h3>
            <p className="mt-2 text-sm text-gray-600">
              メール通知の送信、テンプレート管理
            </p>
            <button
              onClick={() => alert('通知管理機能は今後実装予定です')}
              className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              管理する
            </button>
          </div>

          {/* システム設定 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">システム設定</h3>
            <p className="mt-2 text-sm text-gray-600">
              プラットフォーム手数料、利用規約など
            </p>
            <button
              onClick={() => alert('システム設定機能は今後実装予定です')}
              className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              管理する
            </button>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <h3 className="text-lg font-semibold text-blue-900">MVP版について</h3>
          <p className="mt-2 text-sm text-blue-800">
            現在表示されているのは基本的な統計情報のみです。詳細な管理機能は今後実装予定です。
          </p>
        </div>
      </main>
    </div>
  );
}
