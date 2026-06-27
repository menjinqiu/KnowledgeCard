import type { ReactNode } from 'react';
import { TopNav } from './TopNav';

type LayoutProps = {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: ReactNode;
};

export function Layout({ currentPath, onNavigate, children }: LayoutProps) {
  return (
    <div className="app-shell workspace-shell compact-shell">
      <TopNav currentPath={currentPath} onNavigate={onNavigate} />
      <div className="workspace-body">
        <main className="main-shell">{children}</main>
      </div>
    </div>
  );
}
