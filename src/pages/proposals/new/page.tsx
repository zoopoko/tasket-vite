
/**
 * 提案送信ページ
 * ベンダーが案件に対して提案を送信
 */
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const proposalSchema = z.object({
  budget: z.number().min(10000, '提案金額は10,000円以上である必要があります'),
  timeline: z.number().min(1, '納期は1日以上である必要があります'),
  message: z.string().min(50, 'メッセージは50文字以上である必要があります'),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

function NewProposalPageContent() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');

  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [loadingProject, setLoadingProject] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        setLoadingProject(false);
        return;
      }

      try {
        const token = await user?.getIdToken();

        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('案件の取得に失敗しました');
        }

        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error('Project fetch error:', error);
      } finally {
        setLoadingProject(false);
      }
    };

    if (user) {
      fetchProject();
    }
  }, [user, projectId]);

  const onSubmit = async (data: ProposalFormData) => {
    if (!projectId) {
      alert('案件IDが指定されていません');
      return;
    }

    setSubmitting(true);

    try {
      const token = await user?.getIdToken();

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          budget: data.budget,
          timeline: data.timeline,
          message: data.message,
        }),
      });

      if (!response.ok) {
        throw new Error('提案の送信に失敗しました');
      }

      const result = await response.json();

      alert('提案を送信しました！');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Proposal submission error:', error);
      alert(error.message || '提案の送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
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

  if (!projectId || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>案件が見つかりませんでした</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">提案を送信</h1>
              <p className="text-sm text-gray-600">
                案件: {project.title}
              </p>
            </div>
            <Link
              to={`/projects/${projectId}`}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              案件詳細に戻る
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左側: 提案フォーム */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-xl font-semibold text-gray-900">
                提案内容
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
                {/* 提案金額 */}
                <div>
                  <label
                    htmlFor="budget"
                    className="block text-sm font-medium text-gray-700"
                  >
                    提案金額 (円) *
                  </label>
                  <input
                    type="number"
                    id="budget"
                    {...register('budget', { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="300000"
                  />
                  {errors.budget && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.budget.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    クライアントの予算: ¥{project.budget.toLocaleString()}
                  </p>
                </div>

                {/* 納期 */}
                <div>
                  <label
                    htmlFor="timeline"
                    className="block text-sm font-medium text-gray-700"
                  >
                    納期 (日数) *
                  </label>
                  <input
                    type="number"
                    id="timeline"
                    {...register('timeline', { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="30"
                  />
                  {errors.timeline && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.timeline.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    完了までの日数を入力してください
                  </p>
                </div>

                {/* 提案メッセージ */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700"
                  >
                    提案メッセージ *
                  </label>
                  <textarea
                    id="message"
                    {...register('message')}
                    rows={8}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="あなたの経験やスキル、この案件に対するアプローチ方法を詳しく説明してください..."
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                {/* 送信ボタン */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-md bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? '送信中...' : '提案を送信'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="rounded-md bg-gray-200 px-4 py-3 text-gray-700 hover:bg-gray-300"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* 右側: 案件サマリー */}
          <div className="lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="text-lg font-semibold text-gray-900">
                案件情報
              </h3>

              <div className="mt-4 space-y-4">
                <div>
                  <span className="block text-sm font-medium text-gray-700">
                    タイトル
                  </span>
                  <span className="mt-1 block text-sm text-gray-900">
                    {project.title}
                  </span>
                </div>

                <div>
                  <span className="block text-sm font-medium text-gray-700">
                    予算
                  </span>
                  <span className="mt-1 block text-lg font-bold text-blue-600">
                    ¥{project.budget.toLocaleString()}
                  </span>
                </div>

                {project.deadline && (
                  <div>
                    <span className="block text-sm font-medium text-gray-700">
                      希望納期
                    </span>
                    <span className="mt-1 block text-sm text-gray-900">
                      {new Date(project.deadline).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-md bg-yellow-50 p-4">
                <h4 className="text-sm font-semibold text-yellow-900">
                  提案のヒント
                </h4>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-yellow-700">
                  <li>具体的な実績を示す</li>
                  <li>技術スタックへの理解を示す</li>
                  <li>実装計画を明確に説明する</li>
                  <li>コミュニケーション方法を提案する</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


export default function NewProposalPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p>読み込み中...</p></div>}>
      <NewProposalPageContent />
    </Suspense>
  );
}
