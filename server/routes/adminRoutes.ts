import { Router, Request, Response } from 'express';
import { verifyAdminJwt, verifyAdmin, signAdminToken } from '../middleware/auth';
import {
  createErrorResponse,
  createSuccessResponse,
  getRequestLanguage,
} from '../i18n';
import {
  findUser,
  awardUserPoints,
  createTaskAuditLog,
  getRecentTaskLogs,
  getSubmissionById,
  updateSubmissionStatus,
  createPointLog,
  getAllTaskSubmissions,
  updateProductImage,
  saveProductToDb,
  deleteProductFromDb,
  reorderProductsInDb,
  getAllProductsFromDb,
  getAllUsersFromDb,
  createUserInDb,
  updateUserInDb,
  deleteUserFromDb,
  getAllOrdersFromDb,
  saveOrderToDb,
  updateOrderStatusInDb,
  deleteOrderFromDb,
} from '../firebaseDb';
import { ApproveTaskRequestBody } from '../types';

import { getDb } from '../../src/db';
import { admins } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

export const adminRouter = Router();

// Configured Admin credentials (can be overridden with environment variables)
const DEFAULT_ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Lumimei@2026';
const DEFAULT_ADMIN_PIN = process.env.ADMIN_PIN || '888888';

// Configured Admin phone numbers (Cambodian +855 and local 0...)
const ADMIN_PHONE_WHITELIST = (process.env.ADMIN_PHONES || '+85511223355,+85512345678,+855961234567,+855881234567')
  .split(',')
  .map((p) => p.trim());

/**
 * Normalizes Cambodian phone numbers to E.164 (+855...)
 */
function normalizeCambodianPhone(raw: string): string {
  let cleaned = raw.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+855')) {
    return cleaned;
  }
  if (cleaned.startsWith('855')) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '+855' + cleaned.substring(1);
  }
  return '+855' + cleaned;
}

// Standard point values per task type if not explicitly supplied
const TASK_POINTS_CATALOG: Record<string, { points: number; nameKm: string; nameEn: string; nameZh: string }> = {
  'task-daily-checkin': {
    points: 2,
    nameKm: 'ចុះវត្តមានប្រចាំថ្ងៃ',
    nameEn: 'Daily Check-in',
    nameZh: '每日签到',
  },
  'task-fb-cambodia': {
    points: 2,
    nameKm: 'ចុះវត្តមានប្រចាំថ្ងៃ',
    nameEn: 'Daily Check-in',
    nameZh: '每日签到',
  },
  'task-refer-friend': {
    points: 0,
    nameKm: 'ណែនាំមិត្តភក្ត័មកទិញផលិតផល (ទទួលបានសាប៊ូ Lumimei ១ដុំ)',
    nameEn: 'Refer a Friend to Purchase (Get 1 Lumimei Soap Bar)',
    nameZh: '推荐好友购买产品 (送 Lumimei 天然手工皂 1 块)',
  },
  'task-fb-mei': {
    points: 0,
    nameKm: 'ណែនាំមិត្តភក្ត័មកទិញផលិតផល (ទទួលបានសាប៊ូ Lumimei ១ដុំ)',
    nameEn: 'Refer a Friend to Purchase (Get 1 Lumimei Soap Bar)',
    nameZh: '推荐好友购买产品 (送 Lumimei 天然手工皂 1 块)',
  },
  'task-tiktok-cambodia': {
    points: 15,
    nameKm: 'ចុច follow Tiktok Lumimei Cambodia',
    nameEn: 'Follow TikTok Lumimei Cambodia',
    nameZh: '关注 TikTok Lumimei Cambodia',
  },
  'task-tiktok-mei': {
    points: 15,
    nameKm: 'ចុច follow Tiktok Lumimei Mei',
    nameEn: 'Follow TikTok Lumimei Mei',
    nameZh: '关注 TikTok Lumimei Mei',
  },
  'task-review-fb-cambodia': {
    points: 15,
    nameKm: 'Review facebook page Lumimei Cambodia',
    nameEn: 'Review Facebook Page Lumimei Cambodia',
    nameZh: '评价 Facebook 专页 Lumimei Cambodia',
  },
  'task-review-fb-mei': {
    points: 15,
    nameKm: 'Review facebook page Lumimei Mei',
    nameEn: 'Review Facebook Page Lumimei Mei',
    nameZh: '评价 Facebook 专页 Lumimei Mei',
  },
  task_follow_fb_cambodia: {
    points: 5,
    nameKm: 'ចុច Follow Facebook Page Lumimei Cambodia',
    nameEn: 'Follow Facebook Page Lumimei Cambodia',
    nameZh: '关注 Facebook 页面 Lumimei Cambodia',
  },
  task_follow_fb_mei: {
    points: 5,
    nameKm: 'ចុច Follow Facebook Page Lumimei Mei',
    nameEn: 'Follow Facebook Page Lumimei Mei',
    nameZh: '关注 Facebook 页面 Lumimei Mei',
  },
  task_tiktok_follow: {
    points: 5,
    nameKm: 'ចុច Follow TikTok Lumimei Cambodia',
    nameEn: 'Follow TikTok Lumimei Cambodia',
    nameZh: '关注 TikTok 账号 Lumimei Cambodia',
  },
  task_telegram_join: {
    points: 5,
    nameKm: 'ចូលរួម Telegram Channel Lumimei',
    nameEn: 'Join Telegram Channel Lumimei',
    nameZh: '加入 Telegram 频道 Lumimei',
  },
  task_share_post: {
    points: 10,
    nameKm: 'ស៊ែរ (Share) ការបង្ហោះទៅកាន់ Facebook Profile ឬ Group',
    nameEn: 'Share Post to Facebook Profile or Group',
    nameZh: '分享帖子到 Facebook 个人资料或群组',
  },
  task_review_product: {
    points: 15,
    nameKm: 'សរសេរការវាយតម្លៃ (Review) ផលិតផល',
    nameEn: 'Write a Product Review',
    nameZh: '撰写商品评价',
  },
};

/**
 * 1. POST /api/admin/login
 * Admin Login Endpoint (Username & Password)
 */
adminRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json(
        createErrorResponse(req, 'MISSING_REQUIRED_FIELDS', {
          details: 'Username and password are required',
        })
      );
    }

    const isValidAdmin =
      username.trim() === DEFAULT_ADMIN_USERNAME &&
      password.trim() === DEFAULT_ADMIN_PASSWORD;

    if (!isValidAdmin) {
      return res.status(401).json(createErrorResponse(req, 'INVALID_CREDENTIALS'));
    }

    const adminUser = {
      id: 'admin_1',
      username: username.trim(),
      role: 'superadmin' as const,
    };

    const token = signAdminToken(adminUser);

    return res.json(
      createSuccessResponse(req, 'ADMIN_LOGIN_SUCCESS', {
        token,
        tokenType: 'Bearer',
        expiresIn: '24h',
        admin: adminUser,
      })
    );
  } catch (error: any) {
    console.error('Admin login error:', error);
    return res.status(500).json(createErrorResponse(req, 'INTERNAL_ERROR'));
  }
});

/**
 * 1.1 POST /api/admin/phone-login
 * Admin Login using Cambodian Phone Number + Admin Passcode/PIN
 */
adminRouter.post('/phone-login', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, pin, password } = req.body;

    if (!phoneNumber || (!pin && !password)) {
      return res.status(400).json(
        createErrorResponse(req, 'MISSING_REQUIRED_FIELDS', {
          details: 'Phone number and admin PIN/password are required',
        })
      );
    }

    const formattedPhone = normalizeCambodianPhone(phoneNumber);
    const providedCredential = (pin || password || '').trim();

    // Check if PIN or password matches admin secret
    const isValidSecret =
      providedCredential === DEFAULT_ADMIN_PIN ||
      providedCredential === DEFAULT_ADMIN_PASSWORD;

    // Check if phone number is in Cloud SQL admins table
    let isSqlAdmin = false;
    let sqlRole = 'superadmin';
    try {
      const sqlDb = getDb();
      if (sqlDb) {
        const adminRows = await sqlDb.select().from(admins).where(eq(admins.phone, formattedPhone)).limit(1);
        if (adminRows.length > 0 && adminRows[0].status === 1) {
          isSqlAdmin = true;
          sqlRole = adminRows[0].role === 'super_admin' ? 'superadmin' : (adminRows[0].role || 'auditor');
        }
      }
    } catch (sqlErr) {
      console.warn('Cloud SQL admin query failed, falling back to whitelist:', sqlErr);
    }

    // Check if phone number is in whitelist or user has admin role in Firestore
    const user = await findUser(formattedPhone);
    const isWhitelisted = ADMIN_PHONE_WHITELIST.some((p) => normalizeCambodianPhone(p) === formattedPhone);
    const hasAdminRole = isSqlAdmin || isWhitelisted || user?.role === 'admin' || user?.role === 'superadmin';

    // Allow login if PIN is valid OR phone is whitelisted/in database with correct credentials
    if (!isValidSecret && !hasAdminRole) {
      return res.status(401).json(createErrorResponse(req, 'INVALID_CREDENTIALS'));
    }

    const adminUser = {
      id: user ? user.id : `admin_${formattedPhone.replace(/\D/g, '')}`,
      username: user?.fullName || user?.displayName || `Admin (${formattedPhone})`,
      phoneNumber: formattedPhone,
      role: (sqlRole === 'superadmin' || user?.role === 'superadmin' ? 'superadmin' : 'admin') as 'superadmin' | 'admin',
    };

    const token = signAdminToken(adminUser);

    return res.json(
      createSuccessResponse(req, 'ADMIN_LOGIN_SUCCESS', {
        token,
        tokenType: 'Bearer',
        expiresIn: '24h',
        admin: adminUser,
      })
    );
  } catch (error: any) {
    console.error('Admin phone login error:', error);
    return res.status(500).json(createErrorResponse(req, 'INTERNAL_ERROR'));
  }
});

/**
 * 1.2 POST /api/admin/verify-firebase-admin
 * Verify Firebase Phone Auth user as Admin
 */
adminRouter.post('/verify-firebase-admin', async (req: Request, res: Response) => {
  try {
    const { uid, phoneNumber, adminPasscode } = req.body;

    if (!uid && !phoneNumber) {
      return res.status(400).json(createErrorResponse(req, 'MISSING_REQUIRED_FIELDS'));
    }

    const user = await findUser(uid || phoneNumber);
    const formattedPhone = phoneNumber ? normalizeCambodianPhone(phoneNumber) : user?.phoneNumber || '';

    const isWhitelisted = ADMIN_PHONE_WHITELIST.some((p) => normalizeCambodianPhone(p) === formattedPhone);
    const hasAdminRole = user?.role === 'admin' || user?.role === 'superadmin';
    const isPasscodeValid = adminPasscode && (adminPasscode === DEFAULT_ADMIN_PIN || adminPasscode === DEFAULT_ADMIN_PASSWORD);

    if (!hasAdminRole && !isWhitelisted && !isPasscodeValid) {
      return res.status(403).json(
        createErrorResponse(req, 'UNAUTHORIZED', {
          details: 'This phone number does not have admin permissions.',
        })
      );
    }

    const adminUser = {
      id: uid || (user ? user.id : 'admin_phone'),
      username: user?.fullName || user?.displayName || `Admin (${formattedPhone})`,
      phoneNumber: formattedPhone,
      role: 'superadmin' as const,
    };

    const token = signAdminToken(adminUser);

    return res.json(
      createSuccessResponse(req, 'ADMIN_LOGIN_SUCCESS', {
        token,
        tokenType: 'Bearer',
        expiresIn: '24h',
        admin: adminUser,
      })
    );
  } catch (error: any) {
    console.error('Verify firebase admin error:', error);
    return res.status(500).json(createErrorResponse(req, 'INTERNAL_ERROR'));
  }
});

/**
 * 2. POST /api/admin/approve-task
 * Approve Social Media Task & Award Points to User's Phone Account
 */
adminRouter.post('/approve-task', verifyAdminJwt, async (req: Request, res: Response) => {
  try {
    const body: ApproveTaskRequestBody = req.body;
    const { userId, taskId, points, note, proofImageUrl } = body;

    // Validate required parameters
    if (!userId || !taskId) {
      return res.status(400).json(
        createErrorResponse(req, 'MISSING_REQUIRED_FIELDS', {
          requiredFields: ['userId', 'taskId'],
        })
      );
    }

    // 1. Locate user in Firestore (by UID or by PhoneNumber)
    const user = await findUser(userId);
    if (!user) {
      return res.status(404).json(
        createErrorResponse(req, 'USER_NOT_FOUND', {
          providedUserId: userId,
        })
      );
    }

    // 2. Determine point reward for this task
    const taskInfo = TASK_POINTS_CATALOG[taskId];
    const awardedPoints =
      typeof points === 'number' && points > 0
        ? points
        : taskInfo
        ? taskInfo.points
        : 5;

    const taskName = taskInfo
      ? taskInfo.nameKm
      : `ភារកិច្ចលេខ ${taskId}`;

    // 3. Award points to the user's database document
    const updatedPointsResult = await awardUserPoints(user.id, awardedPoints);

    // 4. Save persistent audit log of approval
    const adminUsername = req.admin?.username || 'admin';
    const auditLog = await createTaskAuditLog({
      userId: user.id,
      taskId,
      taskName,
      phoneNumber: updatedPointsResult.phoneNumber || user.phoneNumber || '',
      userFullName: updatedPointsResult.fullName || user.fullName || user.displayName || '',
      pointsAwarded: awardedPoints,
      previousPoints: updatedPointsResult.previousPoints,
      newPoints: updatedPointsResult.newPoints,
      status: 'approved',
      approvedBy: adminUsername,
      note: note || 'Approved by admin',
      proofImageUrl: proofImageUrl || '',
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
    });

    const lang = getRequestLanguage(req);

    return res.json(
      createSuccessResponse(req, 'TASK_APPROVED_SUCCESS', {
        data: {
          logId: auditLog.id,
          userId: user.id,
          phoneNumber: updatedPointsResult.phoneNumber,
          userFullName: updatedPointsResult.fullName,
          taskId,
          taskName,
          pointsAwarded: awardedPoints,
          previousPoints: updatedPointsResult.previousPoints,
          currentTotalPoints: updatedPointsResult.newPoints,
          approvedBy: adminUsername,
          approvedAt: auditLog.createdAt,
          note: auditLog.note,
        },
      })
    );
  } catch (error: any) {
    console.error('Approve task error:', error);
    return res.status(500).json(
      createErrorResponse(req, 'INTERNAL_ERROR', {
        detail: error.message,
      })
    );
  }
});

/**
 * 3. POST /api/admin/reject-task
 * Reject Task Submission
 */
adminRouter.post('/reject-task', verifyAdminJwt, async (req: Request, res: Response) => {
  try {
    const { userId, taskId, note, reason } = req.body;

    if (!userId || !taskId) {
      return res.status(400).json(createErrorResponse(req, 'MISSING_REQUIRED_FIELDS'));
    }

    const user = await findUser(userId);
    const adminUsername = req.admin?.username || 'admin';

    const auditLog = await createTaskAuditLog({
      userId: user ? user.id : userId,
      taskId,
      taskName: TASK_POINTS_CATALOG[taskId]?.nameKm || taskId,
      phoneNumber: user?.phoneNumber || '',
      userFullName: user?.fullName || user?.displayName || '',
      pointsAwarded: 0,
      previousPoints: user?.points || 0,
      newPoints: user?.points || 0,
      status: 'rejected',
      approvedBy: adminUsername,
      note: reason || note || 'Rejected by admin',
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
    });

    return res.json(
      createSuccessResponse(req, 'TASK_REJECTED_SUCCESS', {
        data: {
          logId: auditLog.id,
          userId,
          taskId,
          status: 'rejected',
          reason: auditLog.note,
        },
      })
    );
  } catch (error: any) {
    console.error('Reject task error:', error);
    return res.status(500).json(createErrorResponse(req, 'INTERNAL_ERROR'));
  }
});

/**
 * 3.1 POST /api/admin/verify-submission
 * Verify Task Submission (Approve / Reject) with verifyAdmin middleware
 */
adminRouter.post('/verify-submission', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const { submissionId, action } = req.body; // action: 'approve' 或 'reject'

    if (!submissionId || !action) {
      return res.status(400).json({
        msg_zh: '缺少必要参数 submissionId 或 action',
        msg_km: 'ខ្វះទិន្នន័យចាំបាច់ submissionId ឬ action',
      });
    }

    // 1. 查询该笔提交记录
    const sub = await getSubmissionById(submissionId);
    if (!sub || sub.status !== 'pending') {
      return res.status(400).json({
        msg_zh: '该记录不存在或已被处理',
        msg_km: 'ទិន្នន័យនេះមិនមាន ឬត្រូវបានដំណើរការរួចរាល់ហើយ',
      });
    }

    const adminUsername = req.admin?.username || 'admin';
    const rewardPoints = typeof sub.reward_points === 'number' && sub.reward_points > 0 ? sub.reward_points : 15;

    if (action === 'approve') {
      // A. 更新提交记录状态为已通过
      await updateSubmissionStatus(submissionId, 'approved', adminUsername);

      // B. 给客户增加积分 (如 15 积分)
      const userResult = await awardUserPoints(sub.user_id, rewardPoints);

      // C. 写入积分日志
      await createPointLog(sub.user_id, rewardPoints, `完成任务: ${sub.task_id}`);

      // D. 同时写入 auditLog 方便后台多重追溯
      await createTaskAuditLog({
        userId: sub.user_id,
        taskId: sub.task_id,
        taskName: TASK_POINTS_CATALOG[sub.task_id]?.nameKm || sub.task_id,
        phoneNumber: userResult.phoneNumber || '',
        userFullName: userResult.fullName || '',
        pointsAwarded: rewardPoints,
        previousPoints: userResult.previousPoints,
        newPoints: userResult.newPoints,
        status: 'approved',
        approvedBy: adminUsername,
        note: `Approved submission ${submissionId}`,
        proofImageUrl: sub.proof_image_url || '',
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
      });

      return res.json({
        msg_zh: '审核通过，积分已发放',
        msg_km: 'បានអនុម័ត និងបន្ថែមពិន្ទុ',
        data: {
          submissionId,
          userId: sub.user_id,
          rewardPoints,
          newPoints: userResult.newPoints,
        },
      });
    } else if (action === 'reject') {
      // 更新状态为已拒绝
      await updateSubmissionStatus(submissionId, 'rejected', adminUsername);

      // 写入 auditLog
      await createTaskAuditLog({
        userId: sub.user_id,
        taskId: sub.task_id,
        taskName: TASK_POINTS_CATALOG[sub.task_id]?.nameKm || sub.task_id,
        phoneNumber: '',
        userFullName: '',
        pointsAwarded: 0,
        previousPoints: 0,
        newPoints: 0,
        status: 'rejected',
        approvedBy: adminUsername,
        note: `Rejected submission ${submissionId}`,
        proofImageUrl: sub.proof_image_url || '',
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
      });

      return res.json({
        msg_zh: '已拒绝该申请',
        msg_km: 'បានបដិសេធ',
        data: {
          submissionId,
          userId: sub.user_id,
          status: 'rejected',
        },
      });
    } else {
      return res.status(400).json({
        msg_zh: '无效的 action 参数，必须为 approve 或 reject',
        msg_km: 'សកម្មភាពមិនត្រឹមត្រូវ (ត្រូវតែជា approve ឬ reject)',
      });
    }
  } catch (error: any) {
    console.error('Verify submission error:', error);
    return res.status(500).json({
      msg_zh: '服务器内部错误',
      msg_km: 'មានបញ្ហាបច្ចេកទេសក្នុងម៉ាស៊ីនមេ',
      error: error.message,
    });
  }
});

/**
 * 3.2 GET /api/admin/submissions
 * Get task submissions list
 */
adminRouter.get('/submissions', verifyAdmin, async (req: Request, res: Response) => {
  try {
    const limitCount = Number(req.query.limit) || 100;
    const submissions = await getAllTaskSubmissions(limitCount);
    return res.json({
      success: true,
      count: submissions.length,
      submissions,
    });
  } catch (error: any) {
    console.error('Fetch submissions error:', error);
    return res.status(500).json(createErrorResponse(req, 'INTERNAL_ERROR'));
  }
});


/**
 * 4. GET /api/admin/logs
 * Retrieve Recent Task Audit Logs
 */
adminRouter.get('/logs', verifyAdminJwt, async (req: Request, res: Response) => {
  try {
    const limitCount = Number(req.query.limit) || 50;
    const logs = await getRecentTaskLogs(limitCount);
    return res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error: any) {
    console.error('Fetch logs error:', error);
    return res.status(500).json(createErrorResponse(req, 'INTERNAL_ERROR'));
  }
});

/**
 * 5. GET /api/admin/profile
 * Get Currently Authenticated Admin Profile
 */
adminRouter.get('/profile', verifyAdminJwt, (req: Request, res: Response) => {
  return res.json({
    success: true,
    admin: req.admin,
  });
});

/**
 * 6. GET /api/admin/users/search
 * Search user by Cambodian phone number or UID
 */
adminRouter.get('/users/search', verifyAdminJwt, async (req: Request, res: Response) => {
  try {
    const queryStr = (req.query.q || req.query.phone || '') as string;
    if (!queryStr) {
      return res.status(400).json(
        createErrorResponse(req, 'MISSING_REQUIRED_FIELDS', {
          detail: 'Query parameter q or phone is required',
        })
      );
    }

    const formattedPhone = normalizeCambodianPhone(queryStr);
    let user = await findUser(queryStr);
    if (!user && formattedPhone !== queryStr) {
      user = await findUser(formattedPhone);
    }

    if (!user) {
      return res.status(404).json(
        createErrorResponse(req, 'USER_NOT_FOUND', {
          queriedPhone: queryStr,
          formattedPhone,
        })
      );
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        uid: user.uid || user.id,
        phoneNumber: user.phoneNumber || formattedPhone,
        fullName: user.fullName || user.displayName || 'អតិថិជន Lumimei',
        displayName: user.displayName || user.fullName || 'អតិថិជន Lumimei',
        points: typeof user.points === 'number' ? user.points : 0,
        totalSpent: typeof user.totalSpent === 'number' ? user.totalSpent : 0,
        tier: user.tier || 'normal',
        isVip: Boolean(user.isVip),
        isVvip: Boolean(user.isVvip),
        isFacebookTopFriend: Boolean(user.isFacebookTopFriend),
        photoURL: user.photoURL || '',
      },
    });
  } catch (error: any) {
    console.error('Search user error:', error);
    return res.status(500).json(createErrorResponse(req, 'INTERNAL_ERROR'));
  }
});

/**
 * 7. POST /api/admin/users/adjust-points
 * Manually add or deduct points for a Cambodian phone number
 */
adminRouter.post('/users/adjust-points', verifyAdminJwt, async (req: Request, res: Response) => {
  try {
    const { userId, phoneNumber, pointsDelta, reason } = req.body;

    if ((!userId && !phoneNumber) || typeof pointsDelta !== 'number') {
      return res.status(400).json(
        createErrorResponse(req, 'MISSING_REQUIRED_FIELDS', {
          detail: 'userId or phoneNumber and numerical pointsDelta are required',
        })
      );
    }

    const targetUser = await findUser(userId || phoneNumber);
    if (!targetUser) {
      return res.status(404).json(createErrorResponse(req, 'USER_NOT_FOUND'));
    }

    const result = await awardUserPoints(targetUser.id, pointsDelta);
    const adminUsername = req.admin?.username || 'admin';

    const auditLog = await createTaskAuditLog({
      userId: targetUser.id,
      taskId: 'manual_point_adjustment',
      taskName: pointsDelta >= 0 ? 'បន្ថែមពិន្ទុដោយផ្ទាល់' : 'កាត់ពិន្ទុ',
      phoneNumber: result.phoneNumber || targetUser.phoneNumber || '',
      userFullName: result.fullName || targetUser.fullName || targetUser.displayName || '',
      pointsAwarded: pointsDelta,
      previousPoints: result.previousPoints,
      newPoints: result.newPoints,
      status: 'approved',
      approvedBy: adminUsername,
      note: reason || 'Manual adjustment by admin',
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
    });

    return res.json({
      success: true,
      message: getRequestLanguage(req) === 'zh'
        ? '积分已成功调整！'
        : getRequestLanguage(req) === 'en'
        ? 'Points successfully adjusted!'
        : 'ពិន្ទុត្រូវបានកែប្រែដោយជោគជ័យ!',
      data: {
        userId: targetUser.id,
        phoneNumber: result.phoneNumber,
        fullName: result.fullName,
        previousPoints: result.previousPoints,
        newPoints: result.newPoints,
        pointsDelta,
        logId: auditLog.id,
      },
    });
  } catch (error: any) {
    console.error('Adjust points error:', error);
    return res.status(500).json(createErrorResponse(req, 'INTERNAL_ERROR'));
  }
});

/**
 * 8. POST /api/admin/product/update
 * Update product image URL or full product info in database
 */
adminRouter.post('/product/update', async (req: Request, res: Response) => {
  try {
    const { id, productId, image_url, imageUrl, product } = req.body;
    const targetId = id || productId || product?.id;
    const newImageUrl = image_url || imageUrl || product?.image;

    if (!targetId) {
      return res.status(400).json({
        success: false,
        msg_km: 'សូមបញ្ជាក់ ID នៃផលិតផល',
        msg_zh: '缺少商品 ID 参数',
        error: 'Product ID is required',
      });
    }

    if (newImageUrl) {
      await updateProductImage(targetId, newImageUrl);
    }

    if (product) {
      await saveProductToDb({ ...product, id: targetId, image: newImageUrl || product.image });
    }

    return res.json({
      success: true,
      msg_km: 'បានធ្វើបច្ចុប្បន្នភាពរូបភាព និងព័ត៌មានទំនិញជោគជ័យ',
      msg_zh: '商品及图片更新成功',
      productId: targetId,
      imageUrl: newImageUrl,
    });
  } catch (error: any) {
    console.error('Product update error:', error);
    return res.status(500).json({
      success: false,
      msg_km: 'មានបញ្ហាបច្ចេកទេសក្នុងការកែប្រែទំនិញ',
      msg_zh: '更新商品失败',
      error: error.message || 'Failed to update product',
    });
  }
});

/**
 * 9. POST /api/admin/product/delete
 * Delete product from database
 */
adminRouter.post('/product/delete', async (req: Request, res: Response) => {
  try {
    const { id, productId } = req.body;
    const targetId = id || productId;

    if (!targetId) {
      return res.status(400).json({
        success: false,
        msg_km: 'សូមបញ្ជាក់ ID នៃផលិតផលដើម្បីលុប',
        msg_zh: '缺少商品 ID 参数',
        error: 'Product ID is required',
      });
    }

    await deleteProductFromDb(targetId);

    return res.json({
      success: true,
      msg_km: 'បានលុបទំនិញជោគជ័យ',
      msg_zh: '商品删除成功',
      productId: targetId,
    });
  } catch (error: any) {
    console.error('Product delete error:', error);
    return res.status(500).json({
      success: false,
      msg_km: 'មានបញ្ហាបច្ចេកទេសក្នុងការលុបទំនិញ',
      msg_zh: '删除商品失败',
      error: error.message || 'Failed to delete product',
    });
  }
});

/**
 * 9.5. POST /api/admin/products/reorder
 * Reorder all products in database
 */
adminRouter.post('/products/reorder', async (req: Request, res: Response) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid products payload, expected array',
      });
    }
    await reorderProductsInDb(products);
    return res.json({
      success: true,
      message: 'Products reordered successfully',
      count: products.length,
    });
  } catch (error: any) {
    console.error('Reorder products error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to reorder products',
    });
  }
});

/**
 * 10. GET /api/admin/products
 * Get all products stored in database
 */
adminRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const products = await getAllProductsFromDb();
    return res.json({
      success: true,
      products,
      count: products.length,
    });
  } catch (error: any) {
    console.error('Get products error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve products',
    });
  }
});

/**
 * 11. GET /api/admin/users
 * Retrieve all customer accounts
 */
adminRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await getAllUsersFromDb();
    return res.json({
      success: true,
      users,
      count: users.length,
      message: 'Customer accounts retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve users',
      msg_km: 'មានបញ្ហាបច្ចេកទេសក្នុងការទាញយកបញ្ជីគណនីអតិថិជន',
    });
  }
});

/**
 * 12. POST /api/admin/users
 * Create a new customer user account
 */
adminRouter.post('/users', async (req: Request, res: Response) => {
  try {
    const {
      phoneNumber,
      fullName,
      email,
      telegram,
      skinConcern,
      gender,
      cityProvince,
      points,
      tier,
      role,
      status,
      note,
    } = req.body;

    if (!phoneNumber || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and full name are required',
        msg_km: 'សូមបញ្ចូលលេខទូរស័ព្ទ និងឈ្មោះអតិថិជន',
        msg_zh: '请输入客户手机号码和姓名',
      });
    }

    const formattedPhone = normalizeCambodianPhone(phoneNumber);
    const existing = await findUser(formattedPhone);

    if (existing && existing.id) {
      return res.status(409).json({
        success: false,
        error: 'A customer account with this phone number already exists',
        msg_km: 'លេខទូរស័ព្ទនេះមានគណនីក្នុងប្រព័ន្ធរួចរាល់ហើយ',
        msg_zh: '该手机号码已存在客户账户',
        existingUser: existing,
      });
    }

    const parsedPoints = Number(points) >= 0 ? Number(points) : 15;
    const determinedTier =
      tier ||
      (parsedPoints >= 500
        ? 'diamond'
        : parsedPoints >= 300
        ? 'platinum'
        : parsedPoints >= 150
        ? 'gold'
        : 'silver');

    const newUser = await createUserInDb({
      id: `usr_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      phoneNumber: formattedPhone,
      fullName: fullName.trim(),
      email: (email || '').trim(),
      telegram: (telegram || '').trim(),
      skinConcern: (skinConcern || '').trim(),
      gender: gender || 'female',
      cityProvince: cityProvince || 'ភ្នំពេញ (Phnom Penh)',
      points: parsedPoints,
      tier: determinedTier,
      role: role || 'customer',
      status: status || 'active',
      totalOrders: 0,
      totalSpentUsd: 0,
      note: note || '',
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: 'Customer account created successfully',
      msg_km: 'បានបង្កើតគណនីអតិថិជនថ្មីដោយជោគជ័យ!',
      msg_zh: '客户账户创建成功！',
      user: newUser,
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create user',
      msg_km: 'មានបញ្ហាបច្ចេកទេសក្នុងការបង្កើតគណនីអតិថិជន',
    });
  }
});

/**
 * 13. POST /api/admin/users/update
 * Update customer details
 */
adminRouter.post('/users/update', async (req: Request, res: Response) => {
  try {
    const { id, userId, ...updateData } = req.body;
    const targetId = id || userId;

    if (!targetId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        msg_km: 'សូមបញ្ជាក់ User ID ដើម្បីកែប្រែ',
      });
    }

    const updated = await updateUserInDb(targetId, updateData);

    return res.json({
      success: true,
      message: 'User updated successfully',
      msg_km: 'បានកែប្រែព័ត៌មានគណនីអតិថិជនជោគជ័យ',
      user: updated,
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update user',
      msg_km: 'មានបញ្ហាបច្ចេកទេសក្នុងការកែប្រែគណនី',
    });
  }
});

/**
 * 14. POST /api/admin/users/delete
 * Delete customer user
 */
adminRouter.post('/users/delete', async (req: Request, res: Response) => {
  try {
    const { id, userId } = req.body;
    const targetId = id || userId;

    if (!targetId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        msg_km: 'សូមបញ្ជាក់ User ID ដើម្បីលុប',
      });
    }

    await deleteUserFromDb(targetId);

    return res.json({
      success: true,
      message: 'User deleted successfully',
      msg_km: 'បានលុបគណនីអតិថិជនជោគជ័យ',
      userId: targetId,
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete user',
      msg_km: 'មានបញ្ហាបច្ចេកទេសក្នុងការលុបគណនី',
    });
  }
});

/**
 * 15. GET /api/admin/orders
 * Retrieve all customer orders
 */
adminRouter.get('/orders', async (req: Request, res: Response) => {
  try {
    const orders = await getAllOrdersFromDb();
    return res.json({
      success: true,
      orders,
      count: orders.length,
      message: 'Orders retrieved successfully',
    });
  } catch (error: any) {
    console.error('Get orders error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve orders',
      msg_km: 'មានបញ្ហាបច្ចេកទេសក្នុងការទាញយកបញ្ជីការកុម្ម៉ង់ទិញ',
    });
  }
});

/**
 * 16. POST /api/admin/orders
 * Create new customer order (for admin manual entry or checkout sync)
 */
adminRouter.post('/orders', async (req: Request, res: Response) => {
  try {
    const orderData = req.body;
    if (!orderData || !orderData.customerInfo) {
      return res.status(400).json({
        success: false,
        error: 'Order details and customerInfo are required',
        msg_km: 'សូមបញ្ចូលព័ត៌មានអតិថិជន និងទំនិញកុម្ម៉ង់',
      });
    }

    const saved = await saveOrderToDb(orderData);

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      msg_km: 'បានបង្កើតការកុម្ម៉ង់ទិញជោគជ័យ',
      order: saved,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create order',
      msg_km: 'មានបញ្ហាបច្ចេកទេសក្នុងការបង្កើតការកុម្ម៉ង់',
    });
  }
});

/**
 * 17. POST /api/admin/orders/update-status
 * Update order tracking, packing, or payment status
 */
adminRouter.post('/orders/update-status', async (req: Request, res: Response) => {
  try {
    const { id, orderId, orderStatus, paymentStatus, trackingCode } = req.body;
    const targetId = id || orderId;

    if (!targetId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required',
        msg_km: 'សូមបញ្ជាក់ Order ID',
      });
    }

    const updated = await updateOrderStatusInDb(
      targetId,
      orderStatus,
      paymentStatus,
      trackingCode
    );

    return res.json({
      success: true,
      message: 'Order status updated successfully',
      msg_km: 'បានកែប្រែស្ថានភាពការកុម្ម៉ង់ទិញជោគជ័យ',
      order: updated,
    });
  } catch (error: any) {
    console.error('Update order status error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update order status',
      msg_km: 'មានបញ្ហាបច្ចេកទេសក្នុងការកែប្រែស្ថានភាពការកុម្ម៉ង់',
    });
  }
});

/**
 * 18. POST /api/admin/orders/delete
 * Delete customer order
 */
adminRouter.post('/orders/delete', async (req: Request, res: Response) => {
  try {
    const { id, orderId } = req.body;
    const targetId = id || orderId;

    if (!targetId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required',
        msg_km: 'សូមបញ្ជាក់ Order ID ដើម្បីលុប',
      });
    }

    await deleteOrderFromDb(targetId);

    return res.json({
      success: true,
      message: 'Order deleted successfully',
      msg_km: 'បានលុបការកុម្ម៉ង់ទិញជោគជ័យ',
      orderId: targetId,
    });
  } catch (error: any) {
    console.error('Delete order error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete order',
      msg_km: 'មានបញ្ហាបច្ចេកទេសក្នុងការលុបការកុម្ម៉ង់',
    });
  }
});

