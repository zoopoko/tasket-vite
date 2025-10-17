/**
 * API呼び出しヘルパー関数
 * Firebase認証トークンを自動的にヘッダーに含める
 */
import { auth } from './firebase';

/**
 * 認証ヘッダーを取得する
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return {
      'Content-Type': 'application/json',
    };
  }

  try {
    const token = await currentUser.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  } catch (error) {
    console.error('Failed to get ID token:', error);
    return {
      'Content-Type': 'application/json',
    };
  }
}

/**
 * 認証付きGETリクエスト
 */
export async function authenticatedGet(url: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });
  return response;
}

/**
 * 認証付きPOSTリクエスト
 */
export async function authenticatedPost(url: string, body: any) {
  const headers = await getAuthHeaders();
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return response;
}

/**
 * 認証付きPUTリクエスト
 */
export async function authenticatedPut(url: string, body: any) {
  const headers = await getAuthHeaders();
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  return response;
}

/**
 * 認証付きDELETEリクエスト
 */
export async function authenticatedDelete(url: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(url, {
    method: 'DELETE',
    headers,
  });
  return response;
}
