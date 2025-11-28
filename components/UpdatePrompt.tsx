import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';

const UpdatePrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 min-w-80">
      {offlineReady && (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">오프라인 사용 가능</p>
            <p className="text-xs text-gray-600">인터넷 없이도 앱을 사용할 수 있습니다</p>
          </div>
          <button onClick={close} className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
            확인
          </button>
        </div>
      )}

      {needRefresh && (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">새 버전 사용 가능</p>
            <p className="text-xs text-gray-600">더 나은 경험을 위해 업데이트하세요</p>
          </div>
          <button
            onClick={() => updateServiceWorker(true)}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            업데이트
          </button>
          <button onClick={close} className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
            나중에
          </button>
        </div>
      )}
    </div>
  );
};

export default UpdatePrompt;
