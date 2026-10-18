import { Request } from 'express';
import { SupportedLanguage } from './types';

export const MESSAGES = {
  // Authentication
  UNAUTHORIZED: {
    km: 'មិនមានការអនុញ្ញាត៖ សូមចូលប្រព័ន្ធជា Admin ជាមុនសិន។',
    en: 'Unauthorized: Admin authentication required.',
    zh: '未授权：请先以管理员身份登录。',
  },
  MISSING_TOKEN: {
    km: 'សូមផ្តល់ Token ដើម្បីផ្ទៀងផ្ទាត់សិទ្ធិ (Missing Authorization Token)។',
    en: 'Missing authorization token in request header.',
    zh: '请求头中缺少授权令牌 (Token)。',
  },
  INVALID_TOKEN: {
    km: 'Token មិនត្រឹមត្រូវ ឬបានផុតកំណត់។ សូមចូលប្រព័ន្ធម្តងទៀត។',
    en: 'Invalid or expired authorization token.',
    zh: '授权令牌无效或已过期，请重新登录。',
  },
  ADMIN_LOGIN_SUCCESS: {
    km: 'ចូលប្រព័ន្ធ Admin បានជោគជ័យ!',
    en: 'Admin login successful!',
    zh: '管理员登录成功！',
  },
  INVALID_CREDENTIALS: {
    km: 'ឈ្មោះគណនី ឬលេខសម្ងាត់ Admin មិនត្រឹមត្រូវទេ។',
    en: 'Invalid admin username or password.',
    zh: '管理员用户名或密码错误。',
  },

  // Task Approval & Processing
  MISSING_REQUIRED_FIELDS: {
    km: 'សូមបំពេញព័ត៌មានដែលត្រូវការ៖ userId និង taskId ត្រូវបានទាមទារ។',
    en: 'Missing required parameters: userId and taskId are required.',
    zh: '缺少必要参数：userId 和 taskId 均为必填项。',
  },
  USER_NOT_FOUND: {
    km: 'រកមិនឃើញទិន្នន័យគណនីអ្នកប្រើប្រាស់នៅក្នុងប្រព័ន្ធទេ។',
    en: 'User account not found in database.',
    zh: '在数据库中未找到该用户账户。',
  },
  TASK_NOT_FOUND: {
    km: 'រកមិនឃើញភារកិច្ចដែលបានស្នើសុំទេ។',
    en: 'Specified task not found or invalid.',
    zh: '未找到指定任务或任务无效。',
  },
  TASK_ALREADY_APPROVED: {
    km: 'ភារកិច្ចនេះត្រូវបានពិនិត្យ និងអនុម័តផ្តល់ពិន្ទុរួចរាល់ហើយ។',
    en: 'This task has already been approved and points awarded.',
    zh: '该任务已通过审核并发放积分，无需重复审核。',
  },
  TASK_APPROVED_SUCCESS: {
    km: 'បានអនុម័តភារកិច្ច និងបន្ថែមពិន្ទុជូនលេខទូរស័ព្ទជោគជ័យ!',
    en: 'Task approved and points successfully credited to user phone account!',
    zh: '任务审核通过，积分已成功增加至用户手机账户！',
  },
  TASK_REJECTED_SUCCESS: {
    km: 'បានបដិសេធភារកិច្ចជោគជ័យ។',
    en: 'Task submission rejected successfully.',
    zh: '任务提交已被成功驳回。',
  },

  // Server & General
  INTERNAL_ERROR: {
    km: 'មានបញ្ហាបច្ចេកទេសក្នុងម៉ាស៊ីនមេ។ សូមព្យាយាមម្តងទៀត។',
    en: 'Internal server error occurred while processing request.',
    zh: '处理请求时发生内部服务器错误。',
  },
} as const;

export type MessageKey = keyof typeof MESSAGES;

/**
 * Extract preferred language from request (query, header, or body)
 */
export function getRequestLanguage(req: Request): SupportedLanguage {
  const queryLang = req.query.lang as string;
  if (queryLang === 'km' || queryLang === 'en' || queryLang === 'zh') {
    return queryLang;
  }

  const bodyLang = req.body?.lang as string;
  if (bodyLang === 'km' || bodyLang === 'en' || bodyLang === 'zh') {
    return bodyLang;
  }

  const acceptLang = req.headers['accept-language'] || '';
  if (acceptLang.includes('zh')) return 'zh';
  if (acceptLang.includes('en')) return 'en';
  return 'km'; // default to Khmer
}

/**
 * Get localized string for a specific message key
 */
export function getMessage(key: MessageKey, lang: SupportedLanguage = 'km'): string {
  const entry = MESSAGES[key];
  if (!entry) return key;
  return entry[lang] || entry.km || entry.en;
}

/**
 * Format standard error response with multilingual support
 */
export function createErrorResponse(
  req: Request,
  key: MessageKey,
  extra?: Record<string, any>
) {
  const lang = getRequestLanguage(req);
  return {
    success: false,
    error: {
      code: key,
      message: getMessage(key, lang),
      messages: {
        km: MESSAGES[key].km,
        en: MESSAGES[key].en,
        zh: MESSAGES[key].zh,
      },
      ...extra,
    },
  };
}

/**
 * Format standard success response with multilingual support
 */
export function createSuccessResponse(
  req: Request,
  key: MessageKey,
  data?: Record<string, any>
) {
  const lang = getRequestLanguage(req);
  return {
    success: true,
    message: getMessage(key, lang),
    messages: {
      km: MESSAGES[key].km,
      en: MESSAGES[key].en,
      zh: MESSAGES[key].zh,
    },
    ...data,
  };
}
