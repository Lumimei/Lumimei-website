/**
 * Universal async loading wrapper with 30s timeout protection and error alerting.
 * Guarantees that buttons will never spin indefinitely.
 */

export interface RunWithLoadingOptions {
  timeoutMs?: number; // Defaults to 30000 (30 seconds)
  errorMessage?: string;
  showErrorAlert?: boolean; // Defaults to true
  showAlert?: (message: string) => void; // Optional custom toast / notification handler
  onError?: (error: any) => void;
}

export async function runWithLoading<T = any>(
  asyncFn: () => Promise<T>,
  setLoading: (loading: boolean) => void,
  options?: RunWithLoadingOptions
): Promise<T | null> {
  const timeoutMs = options?.timeoutMs ?? 30000;
  const showErrorAlert = options?.showErrorAlert ?? true;

  try {
    setLoading(true);

    let timer: any = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error('ប្រតិបត្តិការចំណាយពេលយូរពេក (លើសពី 30 វិនាទី) សូមព្យាយាមម្តងទៀត / 操作超时（超过30秒），请检查网络后重试'));
      }, timeoutMs);
    });

    const result = await Promise.race([
      asyncFn().finally(() => {
        if (timer) clearTimeout(timer);
      }),
      timeoutPromise,
    ]);

    return result as T;
  } catch (e: any) {
    console.warn('【runWithLoading 提示】:', e?.message || e);

    const friendlyText =
      options?.errorMessage ||
      e?.friendlyKm ||
      e?.friendlyZh ||
      e?.message ||
      'ប្រតិបត្តិការមិនបានសម្រេច សូមព្យាយាមម្តងទៀត / 操作未完成，请重试';

    if (showErrorAlert && options?.showAlert) {
      options.showAlert(friendlyText);
    }

    if (options?.onError) {
      options.onError(e);
    }

    return null;
  } finally {
    setLoading(false);
  }
}
