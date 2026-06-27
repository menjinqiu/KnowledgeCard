import { useState, type FormEvent } from 'react';

type TopNavProps = {
  currentPath: string;
  onNavigate: (path: string) => void;
};

const navItems = [
  { path: '/', label: '首页', description: '总览与入口' },
  { path: '/directory', label: '目录', description: '固定位置' },
  { path: '/library', label: '卡片库', description: '搜索与筛选' },
  { path: '/collections', label: '专题集', description: '资料包与手册' },
  { path: '/print', label: '打印中心', description: '生成手册' },
  { path: '/data', label: '数据管理', description: '备份与导入' },
  { path: '/style-lab', label: 'Style Lab', description: '设计系统' },
];

export function TopNav({ currentPath, onNavigate }: TopNavProps) {
  const [sidebarSearch, setSidebarSearch] = useState('');

  const handleSidebarSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = sidebarSearch.trim();
    const path = query ? `/library?searchBox=1&q=${encodeURIComponent(query)}` : '/library?searchBox=1';
    onNavigate(path);
  };

  return (
    <aside className="workspace-sidebar no-print compact-sidebar">
      <div className="sidebar-top-group">
        <button className="brand-button" onClick={() => onNavigate('/')}>
          <span className="brand-mark">KC</span>
          <span className="brand-text">
            <strong>KnowledgeCard</strong>
            <small>高价值内容卡片库</small>
          </span>
        </button>

        <div className="sidebar-quick-actions" aria-label="快捷操作">
          <form className="sidebar-search-form" onSubmit={handleSidebarSearch}>
            <input
              type="search"
              value={sidebarSearch}
              placeholder="搜索卡片"
              onChange={(event) => setSidebarSearch(event.target.value)}
              onFocus={() => {
                if (currentPath !== '/library') onNavigate('/library?searchBox=1');
              }}
            />
            <kbd>↵</kbd>
          </form>
          <button className="sidebar-create-button" type="button" onClick={() => onNavigate('/new')}>
            ＋ 新建卡片
          </button>
        </div>
      </div>

      <nav className="nav-links" aria-label="主导航">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={currentPath === item.path ? 'nav-link active' : 'nav-link'}
            onClick={() => onNavigate(item.path)}
          >
            <span>{item.label}</span>
            <small>{item.description}</small>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span>Local first</span>
        <small>IndexedDB · JSON Backup · A4 Print</small>
      </div>
    </aside>
  );
}
