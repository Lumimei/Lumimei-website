import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Award,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Settings,
  Layers,
  HelpCircle,
  CalendarCheck,
  Users,
  Gift,
  Gamepad2,
} from 'lucide-react';
import { Language } from '../types';

export interface DynamicMissionTask {
  id: string;
  titleKm: string;
  titleEn: string;
  titleZh: string;
  points: number;
  rewardTextKm?: string;
  rewardTextEn?: string;
  rewardTextZh?: string;
  iconType: 'user' | 'facebook' | 'tiktok' | 'review' | 'calendar' | 'users' | 'gift' | 'gamepad' | 'other';
  requiresPhoto: boolean;
  active?: boolean;
}

const DEFAULT_TASKS: DynamicMissionTask[] = [
  {
    id: 'task-quiz-game',
    titleKm: 'លេង Game ឆ្លើយសំនួរ',
    titleEn: 'Play Quiz Game',
    titleZh: '玩问答游戏',
    points: 60,
    rewardTextKm: '+60 ពិន្ទុ (១០ពិន្ទុ/១សំនួរ)',
    rewardTextEn: '+60 pts (10 pts/question)',
    rewardTextZh: '+60 积分 (每题10分)',
    iconType: 'gamepad',
    requiresPhoto: false,
    active: true,
  },
  {
    id: 'task-refer-friend',
    titleKm: 'ណែនាំមិត្តភក្ត័មកទិញផលិតផល',
    titleEn: 'Refer a Friend to Purchase',
    titleZh: '推荐好友购买产品',
    points: 0,
    rewardTextKm: 'ផលិតផល Lumimei សាប៊ូមួយដុំ',
    rewardTextEn: '1 Free Lumimei Natural Soap Bar',
    rewardTextZh: 'Lumimei 天然手工皂 1 块',
    iconType: 'gift',
    requiresPhoto: false,
    active: true,
  },
];

const LOCAL_STORAGE_KEY = 'lumimei_dynamic_mission_tasks';

const REMOVED_TASK_IDS = new Set([
  'task-daily-checkin',
  'task-fb-cambodia',
  'task-fb-follow-cambodia',
  'task-tiktok-cambodia',
  'task-tiktok-mei',
  'task-review-fb-cambodia',
  'task-review-fb-mei',
  'task-new-user',
]);

export function getStoredMissionTasks(): DynamicMissionTask[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Automatically filter out removed tasks and migrate old tasks
        let hasChanges = false;
        const filtered = parsed.filter((t: DynamicMissionTask) => {
          if (REMOVED_TASK_IDS.has(t.id)) {
            hasChanges = true;
            return false;
          }
          if (
            t.titleKm?.includes('ចុះវត្តមាន') ||
            t.titleKm?.includes('follow Tiktok') ||
            t.titleKm?.includes('Review facebook page') ||
            t.titleKm?.includes('Follow Facebook Page: Lumimei Cambodia') ||
            t.titleKm?.includes('follow facebook page Lumimei Cambodia')
          ) {
            hasChanges = true;
            return false;
          }
          return true;
        });

        // Ensure quiz game and refer friend exist
        let hasQuiz = false;
        let hasRefer = false;
        const migrated = filtered.map((t: DynamicMissionTask) => {
          if (t.id === 'task-quiz-game' || t.titleKm?.includes('ឆ្លើយសំនួរ')) {
            hasQuiz = true;
            return {
              id: 'task-quiz-game',
              titleKm: 'លេង Game ឆ្លើយសំនួរ',
              titleEn: 'Play Quiz Game',
              titleZh: '玩问答游戏',
              points: 6,
              rewardTextKm: '+6 ពិន្ទុ (១ពិន្ទុ/១សំនួរ)',
              rewardTextEn: '+6 pts (1 pt/question)',
              rewardTextZh: '+6 积分 (每题1分)',
              iconType: 'gamepad' as const,
              requiresPhoto: false,
              active: true,
            };
          }
          if (t.id === 'task-fb-mei' || t.id === 'task-refer-friend' || t.titleKm?.includes('ចុច follow facebook page Lumimei Mei') || t.titleKm?.includes('ណែនាំមិត្តភក្ត')) {
            hasRefer = true;
            return {
              id: 'task-refer-friend',
              titleKm: 'ណែនាំមិត្តភក្ត័មកទិញផលិតផល',
              titleEn: 'Refer a Friend to Purchase',
              titleZh: '推荐好友购买产品',
              points: 0,
              rewardTextKm: 'ផលិតផល Lumimei សាប៊ូមួយដុំ',
              rewardTextEn: '1 Free Lumimei Natural Soap Bar',
              rewardTextZh: 'Lumimei 天然手工皂 1 块',
              iconType: 'gift' as const,
              requiresPhoto: false,
              active: true,
            };
          }
          return t;
        });

        if (!hasQuiz) {
          migrated.splice(1, 0, {
            id: 'task-quiz-game',
            titleKm: 'លេង Game ឆ្លើយសំនួរ',
            titleEn: 'Play Quiz Game',
            titleZh: '玩问答游戏',
            points: 6,
            rewardTextKm: '+6 ពិន្ទុ (១ពិន្ទុ/១សំនួរ)',
            rewardTextEn: '+6 pts (1 pt/question)',
            rewardTextZh: '+6 积分 (每题1分)',
            iconType: 'gamepad' as const,
            requiresPhoto: false,
            active: true,
          });
          hasChanges = true;
        }

        if (!hasRefer) {
          migrated.push({
            id: 'task-refer-friend',
            titleKm: 'ណែនាំមិត្តភក្ត័មកទិញផលិតផល',
            titleEn: 'Refer a Friend to Purchase',
            titleZh: '推荐好友购买产品',
            points: 0,
            rewardTextKm: 'ផលិតផល Lumimei សាប៊ូមួយដុំ',
            rewardTextEn: '1 Free Lumimei Natural Soap Bar',
            rewardTextZh: 'Lumimei 天然手工皂 1 块',
            iconType: 'gift' as const,
            requiresPhoto: false,
            active: true,
          });
          hasChanges = true;
        }

        if (hasChanges) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(migrated));
        }
        return migrated;
      }
    }
  } catch (err) {
    console.error('Failed to load mission tasks:', err);
  }
  return DEFAULT_TASKS;
}

export function saveStoredMissionTasks(tasks: DynamicMissionTask[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    window.dispatchEvent(new Event('lumimei_tasks_updated'));
  } catch (err) {
    console.error('Failed to save mission tasks:', err);
  }
}

export const AdminTaskEditor: React.FC<{ language?: Language }> = ({ language = 'km' }) => {
  const [tasks, setTasks] = useState<DynamicMissionTask[]>(() => getStoredMissionTasks());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<DynamicMissionTask>({
    id: '',
    titleKm: '',
    titleEn: '',
    titleZh: '',
    points: 15,
    iconType: 'facebook',
    requiresPhoto: true,
    active: true,
  });

  const handleStartEdit = (task: DynamicMissionTask) => {
    setEditingTaskId(task.id);
    setFormData({ ...task });
    setShowAddForm(false);
  };

  const handleStartAdd = () => {
    const newId = `task-custom-${Date.now()}`;
    setFormData({
      id: newId,
      titleKm: '',
      titleEn: '',
      titleZh: '',
      points: 15,
      iconType: 'facebook',
      requiresPhoto: true,
      active: true,
    });
    setEditingTaskId(null);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setEditingTaskId(null);
    setShowAddForm(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titleKm.trim() && !formData.titleZh.trim() && !formData.titleEn.trim()) {
      alert('សូមបញ្ចូលចំណងជើងបេសកកម្ម / 请输入任务名称 / Please enter task title');
      return;
    }

    let updated: DynamicMissionTask[];
    if (editingTaskId) {
      updated = tasks.map((t) => (t.id === editingTaskId ? { ...formData } : t));
    } else {
      updated = [...tasks, { ...formData }];
    }

    setTasks(updated);
    saveStoredMissionTasks(updated);
    setEditingTaskId(null);
    setShowAddForm(false);
    setSaveSuccess('បានរក្សាទុកបេសកកម្មជោគជ័យ! / 任务保存成功！');
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('តើអ្នកពិតជាចង់លុបបេសកកម្មនេះមែនទេ? / 确定要删除该任务吗？')) {
      const updated = tasks.filter((t) => t.id !== id);
      setTasks(updated);
      saveStoredMissionTasks(updated);
      setSaveSuccess('បានលុបបេសកកម្មជោគជ័យ / 任务已删除');
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('តើអ្នកចង់កំណត់បេសកកម្មទាំងអស់ត្រឡប់ទៅជាដើមវិញមែនទេ? / 确定恢复默认任务设置？')) {
      setTasks(DEFAULT_TASKS);
      saveStoredMissionTasks(DEFAULT_TASKS);
      setSaveSuccess('បានកំណត់ឡើងវិញរួចរាល់ / 已恢复默认');
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
            <Award className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
              <span>គ្រប់គ្រងបេសកកម្ម និងពិន្ទុ (Lumimei Tasks & Points)</span>
              <span className="text-xs bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30 font-medium">
                Admin
              </span>
            </h3>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              កែប្រែចំណងជើងបេសកកម្ម ចំនួនពិន្ទុរង្វាន់ និងលក្ខខណ្ឌផ្ទៀងផ្ទាត់
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-emerald-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-white/10"
            title="កំណត់ជាដើម (Reset)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">កំណត់ជាដើម</span>
          </button>
          <button
            type="button"
            onClick={handleStartAdd}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>បន្ថែមបេសកកម្មថ្មី</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Add / Edit Form Modal/Drawer */}
      {(showAddForm || editingTaskId) && (
        <form onSubmit={handleSave} className="p-5 sm:p-6 bg-slate-50 border-b border-emerald-100 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-700" />
              <span>{editingTaskId ? 'កែប្រែបេសកកម្ម' : 'បន្ថែមបេសកកម្មថ្មី'}</span>
            </h4>
            <button
              type="button"
              onClick={handleCancel}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ចំណងជើង (ភាសាខ្មែរ) *
              </label>
              <input
                type="text"
                required
                value={formData.titleKm}
                onChange={(e) => setFormData({ ...formData, titleKm: e.target.value })}
                placeholder="ឧ. ចុច follow facebook..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ចំណងជើង (English)
              </label>
              <input
                type="text"
                value={formData.titleEn}
                onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                placeholder="e.g. Follow Facebook Page..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ចំណងជើង (中文)
              </label>
              <input
                type="text"
                value={formData.titleZh}
                onChange={(e) => setFormData({ ...formData, titleZh: e.target.value })}
                placeholder="例如：关注 Facebook 专页..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ចំនួនពិន្ទុរង្វាន់ (Points)
              </label>
              <input
                type="number"
                min="0"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ប្រភេទបណ្តាញសង្គម / Icon
              </label>
              <select
                value={formData.iconType}
                onChange={(e) => setFormData({ ...formData, iconType: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="gamepad">លេង Game ឆ្លើយសំនួរ (Quiz Game)</option>
                <option value="users">ណែនាំមិត្តភក្តិ (Referral / Friends)</option>
                <option value="gift">រង្វាន់កាដូ / សាប៊ូ (Gift / Product)</option>
                <option value="calendar">ចុះវត្តមានប្រចាំថ្ងៃ (Daily Check-in)</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
                <option value="review">Review / Rate</option>
                <option value="user">User / Sign up</option>
                <option value="other">ផ្សេងៗ (Other)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ការផ្ទៀងផ្ទាត់រូបភាព
              </label>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiresPhoto}
                  onChange={(e) => setFormData({ ...formData, requiresPhoto: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs text-slate-700 font-medium">
                  តម្រូវឱ្យអាប់ឡូតរូបភាពបញ្ជាក់ (Screenshot)
                </span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                រង្វាន់ផលិតផលពិសេស (ភាសាខ្មែរ)
              </label>
              <input
                type="text"
                value={formData.rewardTextKm || ''}
                onChange={(e) => setFormData({ ...formData, rewardTextKm: e.target.value })}
                placeholder="ឧ. ផលិតផល Lumimei សាប៊ូមួយដុំ"
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                រង្វាន់ផលិតផលពិសេស (English)
              </label>
              <input
                type="text"
                value={formData.rewardTextEn || ''}
                onChange={(e) => setFormData({ ...formData, rewardTextEn: e.target.value })}
                placeholder="e.g. 1 Free Lumimei Soap Bar"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                រង្វាន់ផលិតផលពិសេស (中文)
              </label>
              <input
                type="text"
                value={formData.rewardTextZh || ''}
                onChange={(e) => setFormData({ ...formData, rewardTextZh: e.target.value })}
                placeholder="例如：送 Lumimei 天然手工皂 1 块"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              បោះបង់ (Cancel)
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>រក្សាទុកបេសកកម្ម (Save)</span>
            </button>
          </div>
        </form>
      )}

      {/* Tasks Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">បេសកកម្ម (Task Name)</th>
              <th className="py-3 px-4 text-center">ពិន្ទុ (Points)</th>
              <th className="py-3 px-4 text-center">ប្រភេទ (Type)</th>
              <th className="py-3 px-4 text-center">តម្រូវរូបភាព</th>
              <th className="py-3 px-4 text-right">សកម្មភាព</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-slate-50/80 transition">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900">{task.titleKm}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {task.titleZh || task.titleEn}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center">
                  {task.rewardTextKm ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                      <Gift className="w-3 h-3 text-amber-700 shrink-0" />
                      <span>{task.rewardTextKm}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                      +{task.points} pts
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="capitalize text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    {task.iconType}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  {task.requiresPhoto ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      តម្រូវឱ្យមាន
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">ស្វ័យប្រវត្តិ</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(task)}
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                      title="កែប្រែ (Edit)"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="លុប (Delete)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
