
/**
 * プロフィールページ
 * ユーザー情報の表示と編集
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  bio: string | null;
  phone: string | null;
  address: string | null;
  stripe_account_id: string | null;
  stripe_account_status: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user) {
      fetchProfile();
    }
  }, [user, loading]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('プロフィール情報の取得に失敗しました');
      }

      const data = await response.json();
      setProfile(data.user);
      setFormData({
        name: data.user.name || '',
        bio: data.user.bio || '',
        phone: data.user.phone || '',
        address: data.user.address || '',
      });
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setIsLoadingProfile(false);
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
    if (!user) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = await user.getIdToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'プロフィール更新に失敗しました');
      }

      const data = await response.json();
      setProfile(data.user);
      setIsEditing(false);
      setSuccessMessage('プロフィールを更新しました');

      // 3秒後にメッセージを消す
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
    setIsEditing(false);
    setError(null);
  };

  if (loading || isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">プロフィール</h1>
          <p className="mt-2 text-sm text-gray-600">
            アカウント情報の確認と編集
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

        {/* プロフィールカード */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">基本情報</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                編集
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? '保存中...' : '保存'}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* メールアドレス（編集不可） */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <div className="mt-1 rounded-md bg-gray-50 px-3 py-2 text-gray-900">
                {profile.email}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                メールアドレスは変更できません
              </p>
            </div>

            {/* 名前 */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                名前 <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  required
                />
              ) : (
                <div className="mt-1 rounded-md bg-gray-50 px-3 py-2 text-gray-900">
                  {profile.name || '-'}
                </div>
              )}
            </div>

            {/* 自己紹介 */}
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700"
              >
                自己紹介
              </label>
              {isEditing ? (
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="スキルや経験を記入してください"
                />
              ) : (
                <div className="mt-1 min-h-[100px] rounded-md bg-gray-50 px-3 py-2 text-gray-900 whitespace-pre-wrap">
                  {profile.bio || '-'}
                </div>
              )}
            </div>

            {/* 電話番号 */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                電話番号
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="090-1234-5678"
                />
              ) : (
                <div className="mt-1 rounded-md bg-gray-50 px-3 py-2 text-gray-900">
                  {profile.phone || '-'}
                </div>
              )}
            </div>

            {/* 住所 */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700"
              >
                住所
              </label>
              {isEditing ? (
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="東京都渋谷区..."
                />
              ) : (
                <div className="mt-1 rounded-md bg-gray-50 px-3 py-2 text-gray-900">
                  {profile.address || '-'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* アカウント情報 */}
        <div className="mt-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            アカウント情報
          </h2>

          <div className="space-y-4">
            {/* Stripe連携状態 */}
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Stripe連携状態
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    ベンダーとして報酬を受け取るには連携が必要です
                  </p>
                </div>
                <div>
                  {profile.stripe_account_id ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                      連携済み
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">
                      未連携
                    </span>
                  )}
                </div>
              </div>
              {!profile.stripe_account_id && (
                <button
                  className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  onClick={() => alert('Stripe連携は本番環境でのみ利用可能です')}
                >
                  Stripeと連携する
                </button>
              )}
            </div>

            {/* 登録日 */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900">登録日</h3>
              <p className="mt-1 text-sm text-gray-600">
                {new Date(profile.created_at).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            {/* ユーザーID */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900">ユーザーID</h3>
              <p className="mt-1 break-all text-xs font-mono text-gray-600">
                {profile.id}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
