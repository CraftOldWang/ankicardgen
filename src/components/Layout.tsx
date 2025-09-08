import { FC, ReactNode } from 'react';
import Sidebar from './Sidebar';
import { useAppStore } from '../store/globalStore';

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  const { currentPage, setCurrentPage } = useAppStore();
  
  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* 侧边导航栏 */}
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
      />
      
      {/* 主要内容区域 */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default Layout;
