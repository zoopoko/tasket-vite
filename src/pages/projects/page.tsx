
/**
 * 案件一覧ページ
 * ベンダーが公開中の案件を閲覧できる
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline?: string;
  status: string;
  created_at: string;
}

export default function ProjectsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [budgetFilter, setBudgetFilter] = useState('all');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // TODO: 認証実装後にトークンを使用
        // const token = await user?.getIdToken();

        const response = await fetch('https://api.task-et.com/api/projects', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('案件の取得に失敗しました');
        }

        const data = await response.json();
        setProjects(data.projects);
      } catch (error) {
        console.error('Projects fetch error:', error);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading || loadingProjects) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // フィルタリング処理
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesBudget = true;
    if (budgetFilter === 'low') {
      matchesBudget = project.budget < 100000;
    } else if (budgetFilter === 'medium') {
      matchesBudget = project.budget >= 100000 && project.budget < 500000;
    } else if (budgetFilter === 'high') {
      matchesBudget = project.budget >= 500000;
    }

    return matchesSearch && matchesBudget;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">案件一覧</h1>
              <p className="text-sm text-gray-600">
                公開中の案件を検索して、提案を送信できます
              </p>
            </div>
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
        {/* フィルター */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 検索 */}
            <div>
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                キーワード検索
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="タイトルや説明で検索..."
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            {/* 予算フィルター */}
            <div>
              <label
                htmlFor="budget"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                予算で絞り込み
              </label>
              <select
                id="budget"
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="all">すべて</option>
                <option value="low">10万円未満</option>
                <option value="medium">10万円〜50万円</option>
                <option value="high">50万円以上</option>
              </select>
            </div>
          </div>
        </div>

        {/* 案件リスト */}
        {filteredProjects.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="text-gray-600">
              該当する案件が見つかりませんでした
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {project.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                  {project.description}
                </p>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      予算
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      ¥{project.budget.toLocaleString()}
                    </span>
                  </div>

                  {project.deadline && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        納期
                      </span>
                      <span className="text-sm text-gray-600">
                        {new Date(project.deadline).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      投稿日
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(project.created_at).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/projects/${project.id}`}
                  className="mt-4 block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
                >
                  詳細を見る
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
