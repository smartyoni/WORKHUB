import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, CheckCircle } from 'lucide-react';

const UpdatePrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] Service Worker registered:', r);
    },
    onRegisterError(error) {
      console.error('[PWA] Service Worker registration error:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-50 border border-gray-200 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        {needRefresh && (
          <>
            <RefreshCw className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1 animate-spin" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">업데이트 사용 가능</h3>
              <p className="text-sm text-gray-600 mb-3">
                새로운 버전이 있습니다. 새로고침하시겠습니까?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  새로고침
                </button>
                <button
                  onClick={close}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  나중에
                </button>
              </div>
            </div>
          </>
        )}
        {offlineReady && (
          <>
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">오프라인 준비 완료</h3>
              <p className="text-sm text-gray-600">
                이제 오프라인에서도 앱을 사용할 수 있습니다
              </p>
              <button
                onClick={close}
                className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                닫기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UpdatePrompt;
