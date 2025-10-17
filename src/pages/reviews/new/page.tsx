
/**
 * レビュー投稿ページ
 * 完了した案件のレビューを投稿する
 */
import { useState, useEffect, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

function NewReviewPageContent() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project_id');
  const revieweeId = searchParams.get('reviewee_id');

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!projectId || !revieweeId) {
      setError('案件IDまたは評価対象者IDが指定されていません');
    }
  }, [projectId, revieweeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !projectId || !revieweeId) return;

    if (!comment.trim()) {
      setError('コメントを入力してください');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = await user.getIdToken();
      const response = await fetch('${import.meta.env.VITE_API_URL}/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          reviewee_id: revieweeId,
          rating,
          comment: comment.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'レビューの投稿に失敗しました');
      }

      navigate('/reviews');
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.message || 'レビューの投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (currentRating: number) => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="text-4xl transition-transform hover:scale-110 focus:outline-none"
          >
            {star <= currentRating ? '⭐' : '☆'}
          </button>
        ))}
      </div>
    );
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
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">レビューを投稿</h2>
          <p className="mt-2 text-gray-600">
            案件の相手を評価してください
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow">
          {/* 評価 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              評価（1〜5）
            </label>
            {renderStars(rating)}
            <p className="mt-2 text-sm text-gray-600">
              現在の評価: {rating}
            </p>
          </div>

          {/* コメント */}
          <div className="mb-6">
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              コメント
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="案件の進行や相手の対応について、具体的なフィードバックを記入してください"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              {comment.length}文字
            </p>
          </div>

          {/* アクション */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '投稿中...' : 'レビューを投稿'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function NewReviewPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p>読み込み中...</p></div>}>
      <NewReviewPageContent />
    </Suspense>
  );
}
