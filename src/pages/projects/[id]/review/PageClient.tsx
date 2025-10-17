
/**
 * レビュー投稿ページ
 * プロジェクト完了後にクライアント・ベンダー相互にレビューを投稿
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const reviewSchema = z.object({
  rating: z.number().min(1, '評価を選択してください').max(5),
  comment: z.string().min(20, 'コメントは20文字以上である必要があります'),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export default function ReviewPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const projectId = params.id as string;

  const [submitting, setSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const onSubmit = async (data: ReviewFormData) => {
    setSubmitting(true);

    try {
      const token = await user?.getIdToken();

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          rating: data.rating,
          comment: data.comment,
        }),
      });

      if (!response.ok) {
        throw new Error('レビューの投稿に失敗しました');
      }

      alert('レビューを投稿しました！');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Review submission error:', error);
      alert(error.message || 'レビューの投稿に失敗しました');
    } finally {
      setSubmitting(false);
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
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                レビューを投稿
              </h1>
              <p className="text-sm text-gray-600">案件ID: {projectId}</p>
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
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow">
          <h2 className="text-xl font-semibold text-gray-900">
            プロジェクトの評価
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            完了したプロジェクトについて、率直な評価とコメントをお願いします。
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            {/* 評価 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                評価 *
              </label>
              <div className="mt-2 flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setSelectedRating(star);
                      setValue('rating', star);
                    }}
                    className={`text-4xl transition ${
                      star <= selectedRating
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    } hover:text-yellow-400`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {errors.rating && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.rating.message}
                </p>
              )}
              <input
                type="hidden"
                {...register('rating', { valueAsNumber: true })}
              />
            </div>

            {/* コメント */}
            <div>
              <label
                htmlFor="comment"
                className="block text-sm font-medium text-gray-700"
              >
                コメント *
              </label>
              <textarea
                id="comment"
                {...register('comment')}
                rows={6}
                className="mt-1 block w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="プロジェクトの進行、コミュニケーション、成果物の品質など、具体的にご記入ください..."
              />
              {errors.comment && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.comment.message}
                </p>
              )}
            </div>

            {/* 注意事項 */}
            <div className="rounded-md bg-blue-50 p-4">
              <h3 className="text-sm font-semibold text-blue-900">
                レビューのガイドライン
              </h3>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-700">
                <li>具体的な事実に基づいて評価してください</li>
                <li>誹謗中傷や個人攻撃は避けてください</li>
                <li>レビューは公開され、他のユーザーが閲覧できます</li>
                <li>一度投稿したレビューは編集できません</li>
              </ul>
            </div>

            {/* 送信ボタン */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-md bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? '投稿中...' : 'レビューを投稿'}
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
      </main>
    </div>
  );
}
