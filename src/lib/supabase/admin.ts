'use server';

import { createClient } from '@supabase/supabase-js';

// Admin client with service role key (for server-side only)
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// =============================================
// ユーザー招待・管理
// =============================================

export type UserType = 'internal' | 'client';
export type UserRole = 'admin' | 'staff';

interface InviteUserParams {
  email: string;
  name: string;
  type: UserType;
  role?: UserRole;
  company?: string;
}

interface InviteResult {
  success: boolean;
  message: string;
  userId?: string;
}

// ユーザーを招待（招待メールを送信）
export async function inviteUser(params: InviteUserParams): Promise<InviteResult> {
  try {
    const admin = getAdminClient();
    
    // Supabase Authでユーザーを招待
    const { data, error } = await admin.auth.admin.inviteUserByEmail(params.email, {
      data: {
        name: params.name,
        type: params.type,
        role: params.role || 'staff',
        company: params.company,
      },
    });

    if (error) {
      console.error('Error inviting user:', error);
      return {
        success: false,
        message: error.message || '招待に失敗しました',
      };
    }

    // プロファイルを作成（トリガーが失敗した場合のバックアップ）
    if (data.user) {
      await admin.from('profiles').upsert({
        id: data.user.id,
        name: params.name,
        email: params.email,
        type: params.type,
        role: params.role || 'staff',
        company: params.company,
      });
    }

    return {
      success: true,
      message: `${params.email} に招待メールを送信しました`,
      userId: data.user?.id,
    };
  } catch (err) {
    console.error('Error in inviteUser:', err);
    return {
      success: false,
      message: '招待処理中にエラーが発生しました',
    };
  }
}

// ユーザーを直接作成（パスワード付き - テスト用）
export async function createUserWithPassword(
  params: InviteUserParams & { password: string }
): Promise<InviteResult> {
  try {
    const admin = getAdminClient();
    
    const { data, error } = await admin.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true, // メール確認をスキップ
      user_metadata: {
        name: params.name,
        type: params.type,
        role: params.role || 'staff',
        company: params.company,
      },
    });

    if (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        message: error.message || 'ユーザー作成に失敗しました',
      };
    }

    // プロファイルを作成
    if (data.user) {
      await admin.from('profiles').upsert({
        id: data.user.id,
        name: params.name,
        email: params.email,
        type: params.type,
        role: params.role || 'staff',
        company: params.company,
      });
    }

    return {
      success: true,
      message: `${params.name} を作成しました`,
      userId: data.user?.id,
    };
  } catch (err) {
    console.error('Error in createUserWithPassword:', err);
    return {
      success: false,
      message: 'ユーザー作成中にエラーが発生しました',
    };
  }
}

// プロファイルを更新
export async function updateUserProfile(
  userId: string,
  updates: Partial<{
    name: string;
    type: UserType;
    role: UserRole;
    company: string;
  }>
): Promise<InviteResult> {
  try {
    const admin = getAdminClient();
    
    const { error } = await admin
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        message: error.message || 'プロファイル更新に失敗しました',
      };
    }

    return {
      success: true,
      message: 'プロファイルを更新しました',
    };
  } catch (err) {
    console.error('Error in updateUserProfile:', err);
    return {
      success: false,
      message: 'プロファイル更新中にエラーが発生しました',
    };
  }
}

// ユーザーを削除
export async function deleteUser(userId: string): Promise<InviteResult> {
  try {
    const admin = getAdminClient();
    
    // プロファイルは CASCADE で自動削除される
    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        message: error.message || 'ユーザー削除に失敗しました',
      };
    }

    return {
      success: true,
      message: 'ユーザーを削除しました',
    };
  } catch (err) {
    console.error('Error in deleteUser:', err);
    return {
      success: false,
      message: 'ユーザー削除中にエラーが発生しました',
    };
  }
}

// 全ユーザーを取得（Admin用）
export async function getAllUsers() {
  try {
    const admin = getAdminClient();
    
    const { data, error } = await admin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data;
  } catch (err) {
    console.error('Error in getAllUsers:', err);
    return [];
  }
}
