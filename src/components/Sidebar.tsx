import { FC } from 'react';
import { FiHome, FiSettings } from 'react-icons/fi';

interface SidebarProps {
  currentPage: 'home' | 'settings' | 'card-processor' | 'card-review';
  onPageChange: (page: 'home' | 'settings' | 'card-processor') => void;
}

const Sidebar: FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const menuItems = [
    {
      id: 'home' as const,
      label: '主界面',
      icon: FiHome
    },
    {
      id: 'settings' as const,
      label: '设置',
      icon: FiSettings
    }
  ];

  return (
    <div className="w-64 bg-gray-100 dark:bg-gray-800 h-full flex flex-col">
      {/* 应用标题 */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
          Anki卡片生成器
        </h1>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="mr-3" size={20} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;