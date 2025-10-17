
/**
 * 案件編集ページ
 * クライアントが自分の案件を編集できる
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate, useParams } from 'react-router-dom';

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: string;
  created_at: string;
  client_id: string;
}

export default function ProjectEditPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user) {
      fetchProject();
    }
  }, [user, loading, projectId]);

  const fetchProject = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();

      const response = await fetch(`https://api.task-et.com/api/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('案件の取得に失敗しました');
      }

      const data = await response.json();

      // 自分の案件かチェック
      if (data.project.client_id !== user.uid) {
        throw new Error('この案件を編集する権限がありません');
      }

      setProject(data.project);
      setFormData({
        title: data.project.title || '',
        description: data.project.description || '',
        budget: data.project.budget?.toString() || '',
      });
    } catch (err: any) {
      console.error('Error fetching project:', err);
      setError(err.message);
    } finally {
      setLoadingProject(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    if (!user || !project) return;

    // バリデーション
    if (!formData.title.trim()) {
      setError('タイトルは必須です');
      return;
    }

    if (!formData.description.trim()) {
      setError('案件説明は必須です');
      return;
    }

    const budgetNum = parseInt(formData.budget);
    if (!budgetNum || budgetNum <= 0) {
      setError('予算は正の数で入力してください');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = await user.getIdToken();

      const response = await fetch(`https://api.task-et.com/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          budget: budgetNum,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '案件の更新に失敗しました');
      }

      const data = await response.json();
      setProject(data.project);
      setSuccessMessage('案件を更新しました');

      // 3秒後にメッセージを消す
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error updating project:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/projects/${projectId}`);
  };

  if (loading || loadingProject) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-lg bg-red-50 p-6 shadow">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => navigate('/projects')}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              案件一覧に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">案件編集</h1>
          <p className="mt-2 text-sm text-gray-600">
            案件情報を編集できます（提案受付中のみ）
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* 成功メッセージ */}
        {successMessage && (
          <div className="mb-6 rounded-lg bg-green-50 p-4">
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* 編集不可の警告 */}
        {project.status !== 'draft' && project.status !== 'published' && (
          <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ この案件は{project.status === 'in_progress' ? '進行中' : '完了'}のため、編集できません
            </p>
          </div>
        )}

        {/* 編集フォーム */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="space-y-6">
            {/* タイトル */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                案件タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                disabled={project.status !== 'draft' && project.status !== 'published'}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="例: Excelデータを自動で集計するツールを作成したい"
                required
              />
            </div>

            {/* 予算 */}
            <div>
              <label
                htmlFor="budget"
                className="block text-sm font-medium text-gray-700"
              >
                予算（円） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                disabled={project.status !== 'draft' && project.status !== 'published'}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="例: 500000"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                ※ プラットフォーム手数料3.3%が別途かかります
              </p>
            </div>

            {/* 案件説明 */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                案件説明 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                disabled={project.status !== 'draft' && project.status !== 'published'}
                rows={10}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="自動化したい作業や要件を詳しく記述してください..."
                required
              />
            </div>

            {/* ステータス表示 */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">案件ステータス</h3>
                  <p className="mt-1 text-xs text-gray-500">現在の案件の状態</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                  {project.status === 'draft' && '下書き'}
                  {project.status === 'published' && '公開中'}
                  {project.status === 'in_progress' && '進行中'}
                  {project.status === 'completed' && '完了'}
                </span>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleCancel}
                className="flex-1 rounded-md bg-gray-200 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                キャンセル
              </button>
              {(project.status === 'draft' || project.status === 'published') && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSaving ? '保存中...' : '変更を保存'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
