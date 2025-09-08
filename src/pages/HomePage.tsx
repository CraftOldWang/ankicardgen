import { FC, useState } from 'react';
import { FiUpload, FiFile, FiPlay } from 'react-icons/fi';
import { useAppStore } from '../store/globalStore';

const HomePage: FC = () => {
  const { processFile } = useAppStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleStartProcessing = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    try {
      await processFile(selectedFile);
    } catch (error) {
      console.error('处理文件时出错:', error);
      alert('处理文件时出错，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 p-8">
      {/* 应用名称 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Anki卡片生成器
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          从日语文本中提取句子并生成学习卡片
        </p>
      </div>

      {/* 文件选择区域 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          选择文件
        </h2>
        
        {!selectedFile ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <FiUpload className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              选择一个Markdown文件来开始处理
            </p>
            <label className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-600 transition-colors">
              <input
                type="file"
                accept=".md,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              选择文件
            </label>
          </div>
        ) : (
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center">
              <FiFile className="text-blue-500 mr-3" size={24} />
              <div>
                <p className="font-medium text-gray-800 dark:text-white">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="ml-auto text-red-500 hover:text-red-700 px-3 py-1 rounded"
              >
                移除
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 开始处理按钮 */}
      <div className="text-center">
        <button
          onClick={handleStartProcessing}
          disabled={!selectedFile || isProcessing}
          className={`inline-flex items-center px-8 py-3 rounded-lg font-medium transition-colors ${
            selectedFile && !isProcessing
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <FiPlay className="mr-2" />
          {isProcessing ? '正在处理...' : '开始扫描与处理'}
        </button>
      </div>
    </div>
  );
};

export default HomePage;