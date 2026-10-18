import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { adminRouter } from './server/routes/adminRoutes';
import { getPendingSubmission, createTaskSubmission, getUserSubmissions } from './server/firebaseDb';

async function startServer() {
  const app = express();
  const PORT = process.env.DEFAULT_APP_PORT
    ? Number(process.env.DEFAULT_APP_PORT)
    : (process.env.PORT && !process.env.NGINX_PORT ? Number(process.env.PORT) : 3000);

  // Health check endpoints for Cloud Run & load balancers
  app.get('/health', (_req, res) => res.status(200).send('OK'));
  app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 4. Serve static files from /uploads
  app.use('/uploads', express.static(uploadsDir));

  // Configure Multer storage for uploaded product & task images
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1e9);
      const cleanExt = (path.extname(file.originalname) || '.png').toLowerCase();
      cb(null, `${timestamp}-${randomSuffix}${cleanExt}`);
    },
  });

  const fileFilter = (_req: any, file: any, cb: any) => {
    const allowedExtensions = /\.(png|jpg|jpeg|webp)$/i;
    const isAllowedExt = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const isAllowedMime = /image\/(png|jpeg|jpg|webp)/.test(file.mimetype);

    if (isAllowedExt || isAllowedMime) {
      return cb(null, true);
    }
    return cb(new Error('គាំទ្រតែប្រភេទរូបភាព .png, .jpg, .jpeg, .webp ប៉ុណ្ណោះ (Only .png, .jpg, .jpeg, .webp allowed)'));
  };

  const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
    fileFilter,
  });

  // 1. POST /api/upload - Direct Image Upload API
  app.post('/api/upload', (req, res) => {
    upload.single('image')(req, res, (err: any) => {
      if (err) {
        console.error('Multer upload error:', err);
        return res.status(400).json({
          success: false,
          msg_km: err.message || 'ការអាប់ឡូតរូបភាពមិនបានជោគជ័យ',
          msg_zh: err.message || '上传图片失败',
          error: err.message,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          msg_km: 'សូមជ្រើសរើសរូបភាពដើម្បីអាប់ឡូត',
          msg_zh: '请选择要上传的图片',
          error: 'No image file provided',
        });
      }

      // Build complete image URL accessible via web
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:3000';
      const fullUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
      const relativeUrl = `/uploads/${req.file.filename}`;

      return res.json({
        success: true,
        url: fullUrl,
        imageUrl: fullUrl,
        image_url: fullUrl,
        relativeUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        msg_km: 'អាប់ឡូតរូបភាពជោគជ័យ',
        msg_zh: '图片上传成功',
      });
    });
  });

  // Mount Admin API Routes (Login, JWT Auth Middleware, Task Approval, Submissions, Product Updates)
  app.use('/api/admin', adminRouter);

  // Direct aliases for verify-login endpoint
  app.use('/api/users/verify-login', (req, res, next) => {
    req.url = '/users/verify-login';
    adminRouter(req, res, next);
  });
  app.use('/users/verify-login', (req, res, next) => {
    req.url = '/users/verify-login';
    adminRouter(req, res, next);
  });

  // Public Products List API
  app.get('/api/products', async (_req, res) => {
    try {
      const { getAllProductsFromDb } = await import('./server/firebaseDb');
      const products = await getAllProductsFromDb();
      return res.json({
        success: true,
        products,
        count: products.length,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ----------------------------------------------------
  // Task Submission Endpoint
  // ----------------------------------------------------
  app.post('/api/task/submit', async (req, res) => {
    try {
      const { userId, taskId, imageUrl, rewardPoints, phoneNumber, userFullName, taskName } = req.body;

      if (!userId || !taskId) {
        return res.status(400).json({
          msg_zh: "缺少必要参数 userId 或 taskId",
          msg_km: "ខ្វះទិន្នន័យចាំបាច់ userId ឬ taskId",
        });
      }

      // 1. 检查是否已经提交过且在审核中
      const existing = await getPendingSubmission(userId, taskId);
      if (existing) {
        return res.status(400).json({ 
          msg_zh: "您已提交过，请等待管理员审核", 
          msg_km: "អ្នកបានផ្ញើរួចហើយ សូមរង់ចាំការពិនិត្យ",
          status: 'pending',
          submissionId: existing.id
        });
      }

      // 2. 写入待审核表
      const submission = await createTaskSubmission(
        userId,
        taskId,
        imageUrl,
        rewardPoints || 15,
        { phoneNumber, userFullName, taskName }
      );

      return res.json({ 
        msg_zh: "提交成功，等待审核", 
        msg_km: "បានផ្ញើដោយជោគជ័យ សូមរង់ចាំការពិនិត្យ",
        submissionId: submission.id,
        status: 'pending'
      });
    } catch (error: any) {
      console.error('Task submission error:', error);
      return res.status(500).json({
        msg_zh: "提交失败，请稍后重试",
        msg_km: "ការផ្ញើមិនបានជោគជ័យ សូមព្យាយាមម្តងទៀត",
        error: error.message,
      });
    }
  });

  // ----------------------------------------------------
  // User Task Submissions Status Endpoint
  // ----------------------------------------------------
  app.get('/api/task/user-submissions/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const submissions = await getUserSubmissions(userId);
      return res.json({
        success: true,
        submissions,
      });
    } catch (error: any) {
      console.error('Fetch user submissions error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });


  // DEVELOPMENT SWITCH: Set to false in Dev mode to prevent any Gemini API calls
  const GEMINI_ENABLED = false;

  // Lumimei Store System Knowledge Prompt
  const LUMIMEI_SYSTEM_PROMPT = `You are Lumimei AI (លូមីម៉ី AI), the official, friendly, and expert skincare & cosmetics chatbot for Lumimei Cambodia (ហាង Lumimei Cambodia).

STORE & PRODUCT KNOWLEDGE BASE:
1. ឈុតថែរក្សាមុខមុន(ធំ) [Acne Care Set - Large]: $33.00
   - Origin: ផលិតនៅប្រទេសកម្ពុជា (Made in Cambodia) 100% Organic Khmer Natural Product.
   - Ingredients (គ្រឿងផ្សំ): អង្ករ (Rice), ប្រទាលកន្ទុយក្រពើ (Aloe Vera), ប្រេងដូង (Coconut Oil), ទឹកឃ្មុំ (Honey).
   - Benefits (អត្ថប្រយោជន៍):
     * ជួយបឺតជាតិពុល និងជម្រុះកោសិកាចាស់ៗ
     * ជួយព្យាបាលមុខមុន មុនរលាក មុខរោល និងមុខមានសរសៃក្រហម
     * ជួយអោយមុខខ្មៅស្រអាប់ មុនមានរន្ធញើសធំទៅជាភ្លឺថ្លាម៉តរលោង
     * កាន់តែប្រើជួយអោយស្បែកមុខភ្លឺថ្លាម៉តរលោងចេញពីខាងក្នុង
     * ជួយគ្រប់គ្រងជាតិខ្លាញ់បានល្អប្រសើរ
   - Suitable for (សាកសមចំពោះ):
     * អ្នកមានមុខមុន មុនរលាក មុខរោល មុខមានសរសៃក្រហម មុខខ្មៅស្រអាប់ មុនមានរន្ធញើសធំ
     * អ្នកធ្លាប់ផាត់ម្សៅក្រាស់ៗ ផាត់មុខអត់ចូល ចង់ជម្រុះកោសិកាចាស់ៗ បឺតជាតិពុល
     * អ្នកចង់បានស្បែកមុខភ្លឺថ្លាម៉តរលោងចេញពីខាងក្នុង
     * អ្នកដែលឧស្សាហ៍មុខឡើងខ្លាញ់
   - Not suitable for (មិនសាកសមចំពោះ):
     * អ្នកដែលចង់ជាពីមុខមុនក្នុងរយៈពេលខ្លីរហ័សពេក
     * អ្នកដែលប្រើប្រាស់តែមួយមុខតែចង់ជាពីមុខមុនបានគ្រប់ប្រភេទ
   - Who can use (អ្នកណាអាចប្រើបាន):
     * ទាំងប្រុស និងទាំងស្រី
     * ចាប់ពីក្មេងអាយុ 12 ឆ្នាំឡើងទៅ
     * ស្ត្រីមានផ្ទៃពោះ និងម្តាយបំបៅដោះកូន
     * អ្នកដែលមានមុខស្តើង សរសៃក្រហម ឬមុខងាយមានប្រតិកម្ម
   - Who cannot use (អ្នកណាមិនអាចប្រើបាន):
     * ក្មេងក្រោមអាយុ 12 ឆ្នាំ
   - Storage (របៀបទុកដាក់):
     * ទុកនៅកន្លែងស្ងួត មិនត្រូវទុកនៅកន្លែងសើម
     * ទុកក្នុងផ្ទះសីតុណ្ហភាពធម្មតា មិនក្តៅពេក មិនត្រជ�GUIDELINES:
- Respond primarily in Khmer (ភាសាខ្មែរ) when the user speaks Khmer or asks in Khmer. If asked in English or Chinese, respond in that language.
- Keep answers helpful, warm, polite, and concise. Use emojis naturally (🌸, ✨, 🌿, 💧).
- Suggest relevant Lumimei products with prices ($) when appropriate.`;

  // API endpoint for Lumimei Chatbot
  app.post('/api/chat', async (req, res) => {
    try {
      if (!GEMINI_ENABLED) {
        return res.json({
          reply: 'AI ជំនួយការថែរក្សាស្បែកកំពុងត្រូវបានរៀបចំ។ មុខងារនេះនឹងអាចប្រើបានក្នុងពេលឆាប់ៗនេះ។'
        });
      }

      const { message, history, language } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10) {
        try {
          const ai = new GoogleGenAI({
            apiKey: apiKey.trim(),
          });

          const contents = [];
          if (history && Array.isArray(history)) {
            for (const h of history) {
              contents.push({
                role: h.role === 'model' ? 'model' : 'user',
                parts: [{ text: h.content }]
              });
            }
          }
          contents.push({
            role: 'user',
            parts: [{ text: message }]
          });

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
              systemInstruction: LUMIMEI_SYSTEM_PROMPT,
              temperature: 0.7,
            }
          });

          if (response && response.text) {
            return res.json({ reply: response.text });
          }
        } catch (genErr) {
          console.warn('Gemini chat fallback (API token/key unavailable or 401):', (genErr as any)?.message || genErr);
        }
      }

      // High quality rule-based response when API key is missing or errored
      const msgLower = (message || '').toLowerCase();
      let reply = '';

      if (msgLower.includes('មុន(ធំ)') || msgLower.includes('ធំ') || msgLower.includes('acne care set (large)') || msgLower.includes('clay')) {
        reply = '🌸 ឈុតថែរក្សាមុខមុន(ធំ) តម្លៃ $33 ជួយបឺតជាតិពុល ព្យាបាលមុខមុនគ្រប់ប្រភេទ ជម្រុះកោសិកាចាស់ៗ និងធ្វើឲ្យស្បែកមុខភ្លឺថ្លាម៉ត់រលោង! ✨';
      } else if (msgLower.includes('មុន(តូច)') || msgLower.includes('តូច') || msgLower.includes('acne care set (small)') || msgLower.includes('សេរ៉ូម')) {
        reply = '💧 ឈុតថែរក្សាមុខមុន(តូច) តម្លៃ $21 ជួយបំបាត់ស្នាមមុន ផ្តល់សំណើមជ្រៅ និងជួយឲ្យស្បែកមុខតឹងណែន! 🌿';
      } else if (msgLower.includes('លាងមុខ') || msgLower.includes('២ តង់') || msgLower.includes('double cleansing')) {
        reply = '🥥 ឈុតលាងមុខ ២ តង់ តម្លៃ $15 (🚚 Free ដឹកជញ្ជូន) ជួយសម្អាតស្បែកយ៉ាងជ្រៅ ផ្តល់សំណើមដល់ស្បែក ការពារស្បែកស្ងួតប្រេះ! ✨';
      } else if (msgLower.includes('៣ដុំ') || msgLower.includes('3 bars') || msgLower.includes('៣ ដុំ')) {
        reply = '🧼 Lumimei សាប៊ូ (៣ដុំ) តម្លៃ $10 ផលិតពីរុក្ខជាតិធម្មជាតិ ជួយសម្អាតស្បែក និងបំបាត់មុនខ្នង មុនមុខ! 🌿';
      } else if (msgLower.includes('៦ដុំ') || msgLower.includes('6 bars') || msgLower.includes('៦ ដុំ')) {
        reply = '🧼 Lumimei សាប៊ូ (៦ដុំ) តម្លៃ $18 (🚚 Free ដឹកជញ្ជូន) ឈុតសន្សំសំចៃខ្ពស់ ជួយសម្អាតស្បែក និងផ្ដល់សំណើម! ✨';
      } else if (msgLower.includes('ថ្លៃ') || msgLower.includes('តម្លៃ') || msgLower.includes('price')) {
        reply = '🛍️ បញ្ជីតម្លៃផលិតផល Lumimei Cambodia:\n1. ឈុតថែរក្សាមុខមុន(ធំ): $33\n2. ឈុតថែរក្សាមុខមុន(តូច): $21\n3. ឈុតលាងមុខ ២ តង់: $15 (Free ដឹក)\n4. Lumimei សាប៊ូ (៣ដុំ): $10\n5. Lumimei សាប៊ូ (៦ដុំ): $18 (Free ដឹក)\n✨ ដឹកជញ្ជូនឥតគិតថ្លៃសម្រាប់ការទិញចាប់ពី $25 ឡើងទៅ ឬទិញមុខទំនិញ Free ដឹក!';
      } else if (msgLower.includes('ដឹក') || msgLower.includes('delivery') || msgLower.includes('ship')) {
        reply = '🚚 Lumimei មានសេវាដឹកជញ្ជូនលឿនរហ័ស ២៤ ខេត្ត/ក្រុង ទូទាំងប្រទេសកម្ពុជា! ដឹកជញ្ជូនឥតគិតថ្លៃសម្រាប់ការទិញផលិតផល Free ដឹក ឬកុម្ម៉ង់ចាប់ពី $25 ឡើងទៅ។ 📦';
      } else {
        reply = language === 'km'
          ? 'ជម្រាបសួរចាស! នាងខ្ញុំជា Lumimei AI ជំនួយការថែរក្សាស្បែក Lumimei Cambodia 🌸\nតើលោកអ្នកមានចម្ងល់ ឬចង់សាកសួរព័ត៌មានអំពីផលិតផល Lumimei ណាមួយដែរឬទេចាស? (ឈុតថែរក្សាមុខមុន(ធំ) $33, ឈុតថែរក្សាមុខមុន(តូច) $21, ឈុតលាងមុខ ២ តង់ $15 Free ដឹក, សាប៊ូ ៣ដុំ $10, សាប៊ូ ៦ដុំ $18 Free ដឹក)'
          : 'Hello! I am Lumimei AI Assistant. How can I help you with Lumimei Khmer natural skincare products today? ✨';
      }

      return res.json({ reply });
    } catch (error) {
      console.error('Lumimei Chatbot error:', error);
      return res.status(500).json({
        reply: 'សូមអភ័យទោស ប្រព័ន្ធកំពុងមានបញ្ហាបច្ចេកទេសបន្តិចបន្តួច។ សូមសាកល្បងម្តងទៀត ឬឆាតមកកាន់ Telegram: @lumimeicambodia'
      });
    }
  });

  // API endpoint for AI Skincare Advisor powered by Gemini
  app.post('/api/ai-advisor', async (req, res) => {
    try {
      if (!GEMINI_ENABLED) {
        return res.json({
          disabled: true,
          routine: 'មុខងារវិភាគស្បែកដោយ AI កំពុងត្រូវបានរៀបចំ។ សូមព្យាយាមម្ដងទៀតនៅពេលក្រោយ។',
          advice: ''
        });
      }

      const { skinType, skinConcerns, budget, language } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 10) {
        try {
          const ai = new GoogleGenAI({
            apiKey: apiKey.trim(),
          });

          const prompt = `You are Lumimei AI Skincare Consultant.
User Skin Profile:
- Skin Type: ${skinType}
- Main Concerns: ${skinConcerns ? skinConcerns.join(', ') : 'General glow'}
- Preferred Budget level: ${budget || 'Flexible'}

Suggest a personalized 3-step routine using Lumimei Cambodia products:
1. Lumimei Clay Mask ($10)
2. Lumimei Serum ($11)
3. Lumimei Coconut Oil ($5)
4. Lumimei Soap ($3)
5. Eyebrow Pencil ($3.50)

Write in ${language === 'km' ? 'Khmer (ភាសាខ្មែរ)' : language === 'zh' ? 'Chinese' : 'English'}. Keep tone warm, encouraging and clear.`;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });

          if (response && response.text) {
            return res.json({
              routine: response.text,
              advice: language === 'km' ? 'លទ្ធផលពី Lumimei AI Specialist' : 'Result from Lumimei AI Specialist'
            });
          }
        } catch (genErr) {
          console.warn('Gemini advisor fallback (API token/key error):', (genErr as any)?.message || genErr);
        }
      }

      // Default high quality structured routine
      return res.json({
        routine: language === 'km' 
          ? 'ឈុតថែរក្សាស្បែក Lumimei Cambodia ដែលស័ក្តិសមបំផុតសម្រាប់ស្បែករបស់អ្នក៖\n1. លាងសម្អាតមុខជាមួយ Lumimei សាប៊ូធម្មជាតិ ($3)\n2. ប្រើប្រាស់ Lumimei Clay Mask ($10) ជួយជម្រុះកោសិកាចាស់ៗ\n3. លាប Lumimei សេរ៉ូម ($11) ដើម្បីបំបាត់ស្នាមមុន និងផ្តល់សំណើមជ្រៅ'
          : 'Recommended Lumimei Skincare Routine:\n1. Cleanse with Lumimei Natural Soap ($3)\n2. Exfoliate gently with Lumimei Clay Mask ($10)\n3. Hydrate & Repair with Lumimei Serum ($11)',
        recommendedProducts: ['p1', 'p2', 'p4'],
        advice: language === 'km'
          ? 'គួរញ៉ាំទឹកឲ្យបានច្រើន ២លីត្រក្នុងមួយថ្ងៃ និងប្រើប្រាស់ Lumimei Clay Mask ២-៣ដងក្នុងមួយសប្តាហ៍។'
          : 'Drink plenty of water and apply Lumimei Clay Mask 2-3 times per week.'
      });
    } catch (error) {
      console.error('AI Advisor error:', error);
      return res.status(500).json({ error: 'Failed to process AI request' });
    }
  });

  // In-memory store for orders and preparation status
  const ordersStore = new Map<string, any>();

  // Helper to ensure Telegram Webhook is registered for callback query buttons
  async function ensureTelegramWebhook(req: express.Request) {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken || botToken === 'MY_TELEGRAM_BOT_TOKEN') return;

      const protocol = req.protocol || 'https';
      const host = req.get('host');
      const appUrl = process.env.APP_URL || (host ? `${protocol}://${host}` : '');

      if (!appUrl || appUrl.includes('localhost')) return;

      const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/telegram-webhook`;

      await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['callback_query', 'message'],
        }),
      });
    } catch (err) {
      console.error('Error registering Telegram webhook:', err);
    }
  }

  // Telegram Webhook setup endpoint
  app.get('/api/setup-telegram-webhook', async (req, res) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken || botToken === 'MY_TELEGRAM_BOT_TOKEN') {
      return res.status(400).json({ error: 'TELEGRAM_BOT_TOKEN environment variable is not set' });
    }

    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/telegram-webhook`;

    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['callback_query', 'message'],
        }),
      });
      const tgData = await tgRes.json();
      return res.json({ webhookUrl, result: tgData });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Telegram Webhook endpoint to handle button clicks (callback_query)
  app.post('/api/telegram-webhook', async (req, res) => {
    // Always return 200 OK immediately to Telegram
    res.status(200).send('OK');

    try {
      const update = req.body;
      if (!update || !update.callback_query) {
        return;
      }

      const callbackQuery = update.callback_query;
      const callbackId = callbackQuery.id;
      const data = callbackQuery.data || '';
      const message = callbackQuery.message;
      const fromUser = callbackQuery.from;

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const configuredChatId = process.env.TELEGRAM_CHAT_ID;

      if (!botToken || botToken === 'MY_TELEGRAM_BOT_TOKEN') {
        return;
      }

      const answerCallback = async (text: string, showAlert = false) => {
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: callbackId,
              text,
              show_alert: showAlert,
            }),
          });
        } catch (e) {
          console.error('Error in answerCallbackQuery:', e);
        }
      };

      // Verify authorized Telegram Admin
      if (configuredChatId && configuredChatId !== 'MY_TELEGRAM_CHAT_ID') {
        const fromIdStr = String(fromUser?.id || '');
        const chatIdStr = String(message?.chat?.id || '');
        const confChatIdStr = String(configuredChatId);

        const isAuthorized = fromIdStr === confChatIdStr || chatIdStr === confChatIdStr;
        if (!isAuthorized) {
          console.warn(`Unauthorized callback click by user ${fromIdStr} in chat ${chatIdStr}`);
          await answerCallback('❌ អ្នកមិនមានសិទ្ធិ (Unauthorized Admin)', true);
          return;
        }
      }

      // Handle button click for completed/noop status
      if (data === 'ORDER_COMPLETED_NOOP') {
        await answerCallback('✅ ការបញ្ជាទិញនេះបានរៀបចំរួចរាល់ហើយ!', false);
        return;
      }

      // Handle button click: ORDER_READY:<ORDER_ID>
      if (data.startsWith('ORDER_READY:')) {
        const orderId = data.replace('ORDER_READY:', '');

        // 1. Update Order in database / memory store
        const existingOrder = ordersStore.get(orderId);
        if (existingOrder) {
          existingOrder.preparation_status = 'ready';
          existingOrder.updatedAt = new Date().toISOString();
        }

        // 2. Build updated Telegram message caption/text
        const originalText = message?.caption || message?.text || '';
        let updatedText = originalText;

        if (updatedText.includes('📦 Order Preparation: Pending')) {
          updatedText = updatedText.replace('📦 Order Preparation: Pending', '✅ Order Preparation: បានរៀបចំរួចរាល់ហើយ');
        } else if (updatedText.includes(' Order Preparation: Pending')) {
          updatedText = updatedText.replace(' Order Preparation: Pending', ' Order Preparation: បានរៀបចំរួចរាល់ហើយ');
        } else if (!updatedText.includes('បានរៀបចំរួចរាល់ហើយ')) {
          updatedText += '\n✅ Order Preparation: បានរៀបចំរួចរាល់ហើយ';
        }

        // 3. Updated Inline Keyboard Button
        const updatedReplyMarkup = {
          inline_keyboard: [
            [
              {
                text: '✅ បានរៀបចំរួចរាល់ហើយ',
                callback_data: 'ORDER_COMPLETED_NOOP',
              },
            ],
          ],
        };

        const chatId = message.chat.id;
        const messageId = message.message_id;
        const isMediaMessage = Boolean(message.photo || message.document || message.caption);

        // 4. Update Telegram message via editMessageCaption or editMessageText
        if (isMediaMessage) {
          const editRes = await fetch(`https://api.telegram.org/bot${botToken}/editMessageCaption`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: messageId,
              caption: updatedText,
              reply_markup: updatedReplyMarkup,
            }),
          });
          const editData = await editRes.json();
          if (!editData.ok) {
            console.error('editMessageCaption failed:', editData);
            await fetch(`https://api.telegram.org/bot${botToken}/editMessageReplyMarkup`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                reply_markup: updatedReplyMarkup,
              }),
            });
          }
        } else {
          const editRes = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: messageId,
              text: updatedText,
              reply_markup: updatedReplyMarkup,
            }),
          });
          const editData = await editRes.json();
          if (!editData.ok) {
            console.error('editMessageText failed:', editData);
            await fetch(`https://api.telegram.org/bot${botToken}/editMessageReplyMarkup`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                reply_markup: updatedReplyMarkup,
              }),
            });
          }
        }

        // 5. Answer callback query to resolve button loading state
        await answerCallback('✅ ការបញ្ជាទិញត្រូវបានប្តូរទៅជា: បានរៀបចំរួចរាល់ហើយ', false);
      } else {
        await answerCallback('OK');
      }
    } catch (err) {
      console.error('Error handling Telegram webhook update:', err);
    }
  });

  // API endpoint to send customer payment receipt & order notification to Telegram Bot
  app.post('/api/send-receipt', async (req, res) => {
    try {
      const { order, receiptDataUrl, receiptFileName, uploadTime } = req.body;

      if (!order) {
        return res.status(400).json({ error: 'Order details are required' });
      }

      // Automatically register webhook if process.env.APP_URL is present
      ensureTelegramWebhook(req).catch(() => {});

      const orderId = order.id || `ORD-${Date.now()}`;
      ordersStore.set(orderId, {
        ...order,
        id: orderId,
        preparation_status: 'pending',
        createdAt: uploadTime || new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' }),
      });

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      // Build Telegram caption
      const customer = order.customerInfo || {};
      const fullName = customer.fullName || 'មិនមាន (Not specified)';
      const phone = customer.phone || 'មិនមាន';
      const notes = customer.notes || 'មិនមាន';

      const addressParts = [
        customer.cityProvince,
        customer.districtSangkat,
        customer.sangkatCommune,
        customer.addressDetail,
      ].filter(Boolean);
      const fullAddress = addressParts.join(', ') || 'មិនមាន';
      const telegramPhoneStr = customer.telegramPhone ? `✈️ Telegram: ${customer.telegramPhone}\n` : '';
      const skinConcernStr = customer.skinConcern ? `🌸 បញ្ហាស្បែកមុខ: ${customer.skinConcern}\n` : '';

      const itemsText = (order.items || [])
        .map((item: any, idx: number) => {
          const pName = item.product?.nameKm || item.product?.name || 'ទំនិញ';
          return `${idx + 1}. ${pName} (ចំនួន: ${item.quantity || 1})`;
        })
        .join('\n');

      const nowStr = uploadTime || new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' });
      const totalUsdStr = Number(order.totalUsd || 0).toFixed(2);
      const totalKhrStr = Math.round(Number(order.totalKhr || (order.totalUsd || 0) * 4100)).toLocaleString();

      const caption = `👤 ឈ្មោះ៖ ${fullName}
📞 លេខទូរស័ព្ទ៖ ${phone}
${telegramPhoneStr}${skinConcernStr}
📍 ទីតាំង៖ ${fullAddress}

🛍️ ទំនិញដែលបានទិញ៖
${itemsText || 'មិនមាន'}

💵 សរុបទឹកប្រាក់៖ $${totalUsdStr} (៛${totalKhrStr})

📝 កំណត់សម្គាល់របស់អតិថិជន៖ ${notes}

⏰ Upload Date / Time: ${nowStr}

💳 Payment Status: Pending Verification
📦 Order Preparation: Pending`;

      const replyMarkup = {
        inline_keyboard: [
          [
            {
              text: '📦 Pending',
              callback_data: `ORDER_READY:${orderId}`,
            },
          ],
        ],
      };

      if (!botToken || !chatId || botToken === 'MY_TELEGRAM_BOT_TOKEN' || chatId === 'MY_TELEGRAM_CHAT_ID') {
        console.warn('⚠️ [Telegram Bot Warning] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured in environment variables.');
        return res.json({
          success: true,
          warning: 'TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID secrets need to be configured in Settings -> Secrets to send live notifications to Telegram.',
          caption,
        });
      }

      // If receipt file data URL is attached
      if (receiptDataUrl && typeof receiptDataUrl === 'string') {
        const matches = receiptDataUrl.match(/^data:(.+);base64,(.+)$/);
        let mimeType = 'image/jpeg';
        let base64Data = receiptDataUrl;

        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const isImage = (mimeType.startsWith('image/') && !mimeType.includes('pdf')) ||
                        /\.(jpg|jpeg|png|webp)$/i.test(receiptFileName || '');

        let tgData: any = null;

        // 1. Try sendPhoto first for images, fallback to sendDocument if Telegram rejects dimensions
        if (isImage) {
          try {
            const formData = new FormData();
            formData.append('chat_id', chatId);
            formData.append('caption', caption);
            formData.append('reply_markup', JSON.stringify(replyMarkup));
            const fileBlob = new Blob([buffer], { type: mimeType });
            formData.append('photo', fileBlob, receiptFileName || 'receipt.jpg');

            const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
              method: 'POST',
              body: formData,
            });
            tgData = await tgRes.json();
          } catch (_e) {
            // Ignore fetch error and proceed to sendDocument fallback
          }
        }

        // 2. If not an image or if sendPhoto failed (e.g. PHOTO_INVALID_DIMENSIONS), send as document
        if (!tgData || !tgData.ok) {
          try {
            const formData = new FormData();
            formData.append('chat_id', chatId);
            formData.append('caption', caption);
            formData.append('reply_markup', JSON.stringify(replyMarkup));
            const fileBlob = new Blob([buffer], { type: mimeType });
            formData.append('document', fileBlob, receiptFileName || (isImage ? 'receipt.jpg' : 'receipt.pdf'));

            const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
              method: 'POST',
              body: formData,
            });
            tgData = await tgRes.json();
          } catch (_e) {
            // Ignore error and proceed to sendMessage text fallback
          }
        }

        // 3. Final fallback: send text message so order is never lost
        if (!tgData || !tgData.ok) {
          try {
            const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: caption,
                reply_markup: replyMarkup,
              }),
            });
            tgData = await tgRes.json();
          } catch (e) {
            console.error('sendMessage fallback error:', e);
          }
        }

        if (!tgData || !tgData.ok) {
          console.error('Telegram Bot API Error:', tgData);
          return res.status(500).json({ error: tgData?.description || 'Failed to send receipt to Telegram Bot' });
        }

        return res.json({
          success: true,
          message: 'Receipt sent to Telegram Bot successfully!',
          telegramResult: tgData,
        });
      } else {
        // No file attached: Send text message to Telegram Bot
        const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const tgRes = await fetch(tgUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: caption,
            reply_markup: replyMarkup,
          }),
        });

        const tgData = await tgRes.json();

        if (!tgData.ok) {
          console.error('Telegram Bot API Error:', tgData);
          return res.status(500).json({ error: tgData.description || 'Failed to send message to Telegram Bot' });
        }

        return res.json({
          success: true,
          message: 'Order notification sent to Telegram Bot successfully!',
          telegramResult: tgData,
        });
      }
    } catch (error: any) {
      console.error('Error in /api/send-receipt:', error);
      return res.status(500).json({ error: error.message || 'Internal server error processing receipt' });
    }
  });

  // Vite middleware for development vs static files for production
  const isProduction = process.env.NODE_ENV === 'production' ||
    (typeof __dirname !== 'undefined' && fs.existsSync(path.join(__dirname, 'index.html')));

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = (typeof __dirname !== 'undefined' && fs.existsSync(path.join(__dirname, 'index.html')))
      ? __dirname
      : (fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))
        ? path.join(process.cwd(), 'dist')
        : process.cwd());

    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lumimei Store App running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
