import { FC, useState } from 'react';
import { Card, Sentence } from '../types';
import { FiEdit2, FiSave, FiTrash2, FiPlus } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';

interface CardEditorProps {
  sentence: Sentence | null;
  cards: Card[];
  onUpdateCard: (index: number, updatedCard: Card) => void;
}

const CardEditor: FC<CardEditorProps> = ({ sentence, cards, onUpdateCard }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedCard, setEditedCard] = useState<Card | null>(null);

  // 开始编辑卡片
  const handleEditCard = (index: number) => {
    setEditingIndex(index);
    setEditedCard({ ...cards[index] });
  };

  // 保存编辑的卡片
  const handleSaveCard = () => {
    if (editingIndex !== null && editedCard) {
      onUpdateCard(editingIndex, editedCard);
      setEditingIndex(null);
      setEditedCard(null);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedCard(null);
  };

  // 添加新卡片
  const handleAddCard = () => {
    if (!sentence) return;
    
    const newCard: Card = {
      id: uuidv4(),
      word: '',
      reading: '',
      meaning: '',
      sentence: sentence.text,
      explanation: ''
    };
    
    onUpdateCard(cards.length, newCard);
    handleEditCard(cards.length);
  };

  // 更新编辑中的卡片字段
  const handleCardFieldChange = (field: keyof Card, value: string) => {
    if (editedCard) {
      setEditedCard({ ...editedCard, [field]: value });
    }
  };

  if (!sentence) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <p className="text-center">请从左侧列表选择一个句子</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900 rounded-md">
          <h3 className="font-medium text-yellow-800 dark:text-yellow-200">选中的句子</h3>
          <p className="mt-2 text-yellow-700 dark:text-yellow-300">{sentence.text}</p>
        </div>
        
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md">
          <p className="mb-4 text-gray-500 dark:text-gray-400">尚未生成卡片</p>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
            onClick={handleAddCard}
          >
            <FiPlus className="mr-2" />
            手动添加卡片
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900 rounded-md">
        <h3 className="font-medium text-yellow-800 dark:text-yellow-200">选中的句子</h3>
        <p className="mt-2 text-yellow-700 dark:text-yellow-300">{sentence.text}</p>
      </div>

      <div className="flex justify-end">
        <button
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 flex items-center text-sm"
          onClick={handleAddCard}
        >
          <FiPlus className="mr-1" />
          添加卡片
        </button>
      </div>

      <div className="space-y-6">
        {cards.map((card, index) => (
          <div 
            key={card.id} 
            className="border dark:border-gray-700 rounded-md overflow-hidden"
          >
            {editingIndex === index && editedCard ? (
              // 编辑模式
              <div className="p-4 space-y-3 bg-blue-50 dark:bg-blue-900">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    单词/短语
                  </label>
                  <input
                    type="text"
                    value={editedCard.word}
                    onChange={(e) => handleCardFieldChange('word', e.target.value)}
                    className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    假名读音
                  </label>
                  <input
                    type="text"
                    value={editedCard.reading}
                    onChange={(e) => handleCardFieldChange('reading', e.target.value)}
                    className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    中文意思
                  </label>
                  <input
                    type="text"
                    value={editedCard.meaning}
                    onChange={(e) => handleCardFieldChange('meaning', e.target.value)}
                    className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    额外解释（可选）
                  </label>
                  <textarea
                    value={editedCard.explanation || ''}
                    onChange={(e) => handleCardFieldChange('explanation', e.target.value)}
                    className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    onClick={handleCancelEdit}
                  >
                    取消
                  </button>
                  <button
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
                    onClick={handleSaveCard}
                  >
                    <FiSave className="mr-1" />
                    保存
                  </button>
                </div>
              </div>
            ) : (
              // 查看模式
              <div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 flex justify-between items-center">
                  <h3 className="font-medium text-gray-800 dark:text-white">{card.word}</h3>
                  <div className="flex space-x-2">
                    <button
                      className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      onClick={() => handleEditCard(index)}
                      title="编辑卡片"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      title="删除卡片"
                      onClick={() => {
                        // 过滤掉当前卡片
                        const newCards = cards.filter((_, i) => i !== index);
                        // 更新所有卡片
                        newCards.forEach((card, i) => onUpdateCard(i, card));
                      }}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">假名读音</p>
                      <p className="text-gray-800 dark:text-gray-200">{card.reading}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">中文意思</p>
                      <p className="text-gray-800 dark:text-gray-200">{card.meaning}</p>
                    </div>
                  </div>
                  
                  {card.explanation && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">额外解释</p>
                      <p className="text-gray-800 dark:text-gray-200">{card.explanation}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">原句</p>
                    <p className="text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      {card.sentence}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardEditor;