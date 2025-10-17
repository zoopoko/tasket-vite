
/**
 * レビュー一覧ページ
 * ユーザーの受け取ったレビューを表示
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

type Review = {
  id: string;
  project_id: string;
  reviewer_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

export default function ReviewsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user) {
      fetchReviews();
    }
  }, [user, loading]);

  const fetchReviews = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `https://api.task-et.com/api/reviews?user_id=${user.uid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('レビューの取得に失敗しました');
      }

      const data = await response.json();
      setReviews(data.reviews);
      setAverageRating(data.average_rating);
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      setError(err.message || 'レビューの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading || isLoading) {
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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">レビュー</h2>
          <p className="mt-2 text-gray-600">
            あなたが受け取ったレビューの一覧です
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* 平均評価カード */}
        {reviews.length > 0 && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">平均評価</h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-4xl font-bold text-blue-600">
                {averageRating.toFixed(1)}
              </span>
              <div>
                <div className="text-2xl">{renderStars(Math.round(averageRating))}</div>
                <p className="text-sm text-gray-600">{reviews.length}件のレビュー</p>
              </div>
            </div>
          </div>
        )}

        {/* レビュー一覧 */}
        {reviews.length === 0 ? (
          <div className="rounded-lg bg-white p-6 shadow text-center">
            <p className="text-gray-600">まだレビューがありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-lg bg-white p-6 shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-gray-900">
                        {review.reviewer_name}
                      </p>
                      <span className="text-xl">{renderStars(review.rating)}</span>
                    </div>
                    <p className="mt-2 text-gray-700">{review.comment}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        {new Date(review.created_at).toLocaleDateString('ja-JP')}
                      </span>
                      <Link
                        to={`/projects/${review.project_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        案件を見る
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
