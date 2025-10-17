/**
 * Firebase Admin SDK（サーバー側）の設定
 * トークン検証に使用
 */
import * as admin from 'firebase-admin';

/**
 * Firebase Adminを初期化する（遅延初期化）
 * ビルド時には実行されず、ランタイムでのみ実行される
 */
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    // 環境変数が存在しない場合はスキップ（ビルド時）
    if (!process.env.FIREBASE_PROJECT_ID) {
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
}

/**
 * Firebase Admin Authインスタンスを取得（遅延初期化）
 */
function getAdminAuth() {
  initializeFirebaseAdmin();
  return admin.auth();
}

/**
 * Firebase ID トークンを検証する
 * @param token - Firebase ID トークン
 * @returns デコードされたトークン
 * @throws {Error} トークンが無効な場合
 */
export async function verifyIdToken(token: string) {
  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Unauthorized');
  }
}

/**
 * ユーザーIDからユーザー情報を取得する
 * @param uid - Firebase UID
 * @returns ユーザー情報
 */
export async function getUser(uid: string) {
  try {
    const auth = getAdminAuth();
    const user = await auth.getUser(uid);
    return user;
  } catch (error) {
    console.error('Get user error:', error);
    throw new Error('User not found');
  }
}
