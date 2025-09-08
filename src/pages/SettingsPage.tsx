import { FC, useState, useEffect } from 'react';
import { FiKey, FiSave } from 'react-icons/fi';
import { useAppStore } from '../store/globalStore';

const SettingsPage: FC = () => {
  const { apiKey, setApiKey: saveApiKey } = useAppStore();
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

  const handleSave = () => {
    saveApiKey(localApiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          设置
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          配置应用程序的各项设置
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <FiKey className="mr-2 text-blue-500" size={24} />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            API密钥设置
          </h2>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Google Gemini API密钥
          </label>
          <input
            type="password"
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            placeholder="输入您的API密钥"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            您可以在{' '}
            <a 
              href="https://ai.google.dev/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-500 hover:underline"
            >
              Google AI Studio
            </a>{' '}
            获取API密钥
          </p>
        </div>

        <button
          onClick={handleSave}
          className={`inline-flex items-center px-6 py-2 rounded-lg font-medium transition-colors ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          <FiSave className="mr-2" />
          {saved ? '已保存!' : '保存设置'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;