
/**
 * ダッシュボードページ
 * ログイン後のメインページ
 */
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

type DashboardStats = {
  activeProjects: number;
  completedProjects: number;
  pendingProposals: number;
  totalReviews: number;
  averageRating: number;
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    completedProjects: 0,
    pendingProposals: 0,
    totalReviews: 0,
    averageRating: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user) {
      fetchDashboardStats();
    }
  }, [user, loading]);

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();

      // プロジェクト統計を取得
      const projectsResponse = await fetch(
        `https://api.task-et.com/api/projects/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setStats((prev) => ({
          ...prev,
          activeProjects: projectsData.stats.activeProjects || 0,
          completedProjects: projectsData.stats.completedProjects || 0,
          pendingProposals: projectsData.stats.pendingProposals || 0,
        }));
      }

      // レビュー統計を取得
      const reviewsResponse = await fetch(
        `https://api.task-et.com/api/reviews?user_id=${user.uid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setStats((prev) => ({
          ...prev,
          totalReviews: reviewsData.total || 0,
          averageRating: reviewsData.average_rating || 0,
        }));
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  if (loading) {
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
      {/* メインコンテンツ */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            ダッシュボード
          </h2>
          <p className="mt-2 text-gray-600">
            ようこそ、{user.displayName || user.email}さん
          </p>
        </div>

        {/* 統計カード */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">進行中の案件</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats.activeProjects}
                </p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">完了した案件</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats.completedProjects}
                </p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">受け取ったレビュー</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats.totalReviews}
                </p>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">平均評価</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {isLoadingStats
                    ? '...'
                    : stats.averageRating > 0
                    ? stats.averageRating.toFixed(1)
                    : '-'}
                </p>
              </div>
              <div className="text-4xl">🌟</div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">審査待ちの提案</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {isLoadingStats ? '...' : stats.pendingProposals}
                </p>
              </div>
              <div className="text-4xl">📩</div>
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">案件を作成</h3>
            <p className="mt-2 text-sm text-gray-600">
              新しい自動化案件を作成し、要件定義を進めます
            </p>
            <Link
              to="/projects/new"
              className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              案件を作成
            </Link>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">案件を探す</h3>
            <p className="mt-2 text-sm text-gray-600">
              公開中の案件を検索し、提案を送信します
            </p>
            <Link
              to="/projects"
              className="mt-4 inline-block rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              案件を探す
            </Link>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">レビュー</h3>
            <p className="mt-2 text-sm text-gray-600">
              あなたが受け取ったレビューを確認
            </p>
            <Link
              to="/reviews"
              className="mt-4 inline-block rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              レビューを見る
            </Link>
          </div>
        </div>

        {/* お知らせ・ヘルプ */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-900">
            はじめに
          </h3>
          <div className="mt-4 rounded-lg bg-white p-6 shadow">
            <p className="text-gray-700 mb-4">
              Tasketへようこそ！このプラットフォームでは自動化したい作業とコードを書けるベンダーをマッチングします。
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>💡 クライアント: 案件作成から案件を簡単に作成できます</li>
              <li>🔍 ベンダー: 案件一覧から興味のある案件を探せます</li>
              <li>⭐ 完了後: お互いにレビューを投稿しましょう</li>
              <li>💰 手数料: 業界最安の3.3%です</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
