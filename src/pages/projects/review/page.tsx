
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

type Requirements = {
  title: string;
  description: string;
  requirements: string[];
  technologies: string[];
  budget: number;
  deadline_days: number;
  background: string;
};

function ReviewRequirementsPageContent() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get('conversationId');

  const [requirements, setRequirements] = useState<Requirements | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const fetchRequirements = useCallback(async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ai/generate-requirements`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ conversationId }),
        }
      );

      if (!response.ok) {
        throw new Error('要件定義書の生成に失敗しました');
      }

      const data = await response.json();
      setRequirements(data.requirements);
    } catch (err: any) {
      console.error('Error fetching requirements:', err);
      setError(err.message || '要件定義書の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [user, conversationId]);

  // 要件定義書を取得
  useEffect(() => {
    if (!conversationId) {
      setError('会話IDが見つかりません');
      setIsLoading(false);
      return;
    }

    if (!authLoading && user) {
      fetchRequirements();
    }
  }, [conversationId, authLoading, user, fetchRequirements]);

  const handlePublish = async () => {
    if (!requirements || !user) return;

    setIsPublishing(true);
    setError('');

    try {
      const token = await user.getIdToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: requirements.title,
          description: requirements.description,
          budget: requirements.budget,
          deadline_days: requirements.deadline_days,
          requirements: requirements.requirements,
          technologies: requirements.technologies,
          background: requirements.background,
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('案件の公開に失敗しました');
      }

      const result = await response.json();
      navigate(`/projects/${result.project.id}`);
    } catch (err: any) {
      console.error('Error publishing project:', err);
      setError(err.message || '案件の公開に失敗しました');
    } finally {
      setIsPublishing(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <div className="text-center">
          <p className="text-gray-600">要件定義書を生成中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !requirements) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || '要件定義書が見つかりません'}</p>
          <button
            onClick={() => navigate('/projects/new')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            最初からやり直す
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">要件定義書の確認</h1>
        <p className="text-gray-600 mt-2">
          AIが生成した要件定義書を確認・編集してください。問題なければ公開できます。
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {/* タイトル */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            案件タイトル
          </label>
          <input
            type="text"
            value={requirements.title}
            onChange={(e) =>
              setRequirements({ ...requirements, title: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 説明 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            案件の説明
          </label>
          <textarea
            value={requirements.description}
            onChange={(e) =>
              setRequirements({ ...requirements, description: e.target.value })
            }
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 背景 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            背景・目的
          </label>
          <textarea
            value={requirements.background}
            onChange={(e) =>
              setRequirements({ ...requirements, background: e.target.value })
            }
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 必要な機能 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            必要な機能
          </label>
          <div className="space-y-2">
            {requirements.requirements.map((req, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={req}
                  onChange={(e) => {
                    const newReqs = [...requirements.requirements];
                    newReqs[index] = e.target.value;
                    setRequirements({ ...requirements, requirements: newReqs });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    const newReqs = requirements.requirements.filter(
                      (_, i) => i !== index
                    );
                    setRequirements({ ...requirements, requirements: newReqs });
                  }}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  削除
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setRequirements({
                  ...requirements,
                  requirements: [...requirements.requirements, ''],
                })
              }
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              + 機能を追加
            </button>
          </div>
        </div>

        {/* 想定技術 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            想定される技術
          </label>
          <div className="space-y-2">
            {requirements.technologies.map((tech, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={tech}
                  onChange={(e) => {
                    const newTechs = [...requirements.technologies];
                    newTechs[index] = e.target.value;
                    setRequirements({
                      ...requirements,
                      technologies: newTechs,
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    const newTechs = requirements.technologies.filter(
                      (_, i) => i !== index
                    );
                    setRequirements({
                      ...requirements,
                      technologies: newTechs,
                    });
                  }}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  削除
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setRequirements({
                  ...requirements,
                  technologies: [...requirements.technologies, ''],
                })
              }
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              + 技術を追加
            </button>
          </div>
        </div>

        {/* 予算 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            予算（円）
          </label>
          <input
            type="number"
            value={requirements.budget}
            onChange={(e) =>
              setRequirements({
                ...requirements,
                budget: parseInt(e.target.value) || 0,
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            プラットフォーム手数料3.3%が別途かかります
          </p>
        </div>

        {/* 納期 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            希望納期（日数）
          </label>
          <input
            type="number"
            value={requirements.deadline_days}
            onChange={(e) =>
              setRequirements({
                ...requirements,
                deadline_days: parseInt(e.target.value) || 0,
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            案件公開から何日以内に完了を希望するか
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* アクション */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={() => navigate('/projects/new')}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            キャンセル
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isPublishing ? '公開中...' : '案件を公開'}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function ReviewRequirementsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p>読み込み中...</p></div>}>
      <ReviewRequirementsPageContent />
    </Suspense>
  );
}
