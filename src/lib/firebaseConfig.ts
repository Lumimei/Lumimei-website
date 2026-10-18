/**
 * Global Firestore Configuration & Immutable Constants
 * 
 * 核心安全规则（单一真理源）：
 * 1. 唯一合法 Firestore Database ID 为 FIRESTORE_DB_ID
 * 2. 严禁传入 "default"、"(default)"、空字符串或未指定的数据库 ID
 * 3. 运行时强校验：任何地方尝试用 "default" 初始化 Firestore，直接 throw Error 阻止启动
 */

export const FIRESTORE_DB_ID = "ai-studio-lumimei-7c9bf061-363f-4616-997f-7ddb5ae1f0b3";
export const FIRESTORE_DATABASE_ID = FIRESTORE_DB_ID;
export const FIREBASE_PROJECT_ID = "lumimei-production-168";

/**
 * 运行时强校验函数：
 * 如果任何地方尝试用 "default", "(default)", 空字符串或非目标数据库初始化 Firestore，
 * 直接 throw Error 阻止执行，避免静默降级或连接到错误的数据库。
 */
export function assertValidFirestoreDatabaseId(dbId?: string | null): string {
  const normalized = (dbId ?? '').trim();

  if (!normalized || normalized.toLowerCase() === 'default' || normalized.toLowerCase() === '(default)') {
    const errorMsg = `[CRITICAL_FIRESTORE_SECURITY_ERROR] 严禁使用 "default" 或空值初始化 Firestore！必须使用命名数据库 "${FIRESTORE_DB_ID}"。检测到非法输入: "${dbId}"`;
    console.error(`%c${errorMsg}`, 'color: white; background: #dc2626; font-size: 16px; font-weight: bold; padding: 6px;');
    throw new Error(errorMsg);
  }

  if (normalized !== FIRESTORE_DB_ID) {
    const errorMsg = `[CRITICAL_FIRESTORE_SECURITY_ERROR] 数据库 ID 校验不匹配！期望: "${FIRESTORE_DB_ID}", 实际: "${dbId}"`;
    console.error(`%c${errorMsg}`, 'color: white; background: #dc2626; font-size: 16px; font-weight: bold; padding: 6px;');
    throw new Error(errorMsg);
  }

  return normalized;
}

// 模块加载时立即执行启动时自检
assertValidFirestoreDatabaseId(FIRESTORE_DB_ID);
