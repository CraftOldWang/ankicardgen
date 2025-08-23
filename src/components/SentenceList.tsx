import { FC } from 'react';
import { Sentence } from '../types';
import { FiCheck, FiClock } from 'react-icons/fi';

interface SentenceListProps {
  sentences: Sentence[];
  selectedSentence: Sentence | null;
  onSentenceSelect: (sentence: Sentence) => void;
}

const SentenceList: FC<SentenceListProps> = ({ 
  sentences, 
  selectedSentence, 
  onSentenceSelect 
}) => {
  if (sentences.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
        <FiClock className="text-4xl mb-2" />
        <p className="text-center">请选择一个Markdown文件以加载句子</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sentences.map((sentence) => (
        <div
          key={sentence.id}
          className={`p-3 rounded-md cursor-pointer transition-colors ${selectedSentence?.id === sentence.id
            ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500'
            : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
          onClick={() => onSentenceSelect(sentence)}
        >
          <div className="flex items-start">
            <div className="flex-1 mr-2">
              <p className="text-sm text-gray-800 dark:text-gray-200 break-words">
                {sentence.text.length > 100
                  ? `${sentence.text.substring(0, 100)}...`
                  : sentence.text}
              </p>
            </div>
            <div className="flex-shrink-0">
              {sentence.processed ? (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <FiCheck className="mr-1" />
                  已处理
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  <FiClock className="mr-1" />
                  未处理
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SentenceList;