import { FC } from 'react';
import { FiFolder, FiFile } from 'react-icons/fi';

interface FileSelectorProps {
  onFileSelect: () => void;
  filePath: string;
}

const FileSelector: FC<FileSelectorProps> = ({ onFileSelect, filePath }) => {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onFileSelect}
        className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        <FiFolder className="mr-2" />
        选择文件
      </button>
      {filePath && (
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
          <FiFile className="mr-2" />
          <span className="truncate max-w-xs">{filePath}</span>
        </div>
      )}
    </div>
  );
};

export default FileSelector;