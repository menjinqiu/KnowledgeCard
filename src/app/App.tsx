import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { seedSampleCardsIfEmpty } from '../db/db';
import { CollectionsPage } from '../pages/CollectionsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { DataManagementPage } from '../pages/DataManagementPage';
import { DetailPage } from '../pages/DetailPage';
import { DirectoryPage } from '../pages/DirectoryPage';
import { EditorPage } from '../pages/EditorPage';
import { LibraryPage } from '../pages/LibraryPage';
import { PrintCenterPage } from '../pages/PrintCenterPage';
import { StyleLabPage } from '../pages/StyleLabPage';

type Route =
  | { name: 'dashboard'; path: '/' }
  | { name: 'library'; path: '/library'; domain?: string; focusSearch?: boolean; query?: string }
  | { name: 'directory'; path: '/directory'; directoryId?: string }
  | { name: 'collections'; path: '/collections'; collectionId?: string }
  | { name: 'data'; path: '/data' }
  | { name: 'detail'; path: '/cards'; id: string }
  | { name: 'new'; path: '/new' }
  | { name: 'edit'; path: '/edit'; id: string }
  | {
      name: 'print';
      path: '/print';
      collectionId?: string;
      directoryId?: string;
      directoryScope?: 'direct' | 'deep';
    }
  | { name: 'styleLab'; path: '/style-lab' };

function getHashPath() {
  return window.location.hash.replace(/^#/, '') || '/';
}

function parseRoute(): Route {
  const hashPath = getHashPath();
  const [pathPart, queryPart] = hashPath.split('?');
  const params = new URLSearchParams(queryPart ?? '');

  if (pathPart === '/library') {
    return {
      name: 'library',
      path: '/library',
      domain: params.get('domain') ?? undefined,
      focusSearch: params.get('searchBox') === '1',
      query: params.get('q') ?? undefined,
    };
  }

  if (pathPart === '/directory') {
    return {
      name: 'directory',
      path: '/directory',
      directoryId: params.get('directory') ?? undefined,
    };
  }

  if (pathPart === '/collections') {
    return {
      name: 'collections',
      path: '/collections',
      collectionId: params.get('collection') ?? undefined,
    };
  }
  if (pathPart === '/data') return { name: 'data', path: '/data' };

  if (pathPart.startsWith('/cards/')) {
    return {
      name: 'detail',
      path: '/cards',
      id: decodeURIComponent(pathPart.replace('/cards/', '')),
    };
  }

  if (pathPart.startsWith('/edit/')) {
    return {
      name: 'edit',
      path: '/edit',
      id: decodeURIComponent(pathPart.replace('/edit/', '')),
    };
  }

  if (pathPart === '/new') return { name: 'new', path: '/new' };
  if (pathPart === '/print') {
    return {
      name: 'print',
      path: '/print',
      collectionId: params.get('collection') ?? undefined,
      directoryId: params.get('directory') ?? undefined,
      directoryScope: params.get('scope') === 'deep' ? 'deep' : 'direct',
    };
  }
  if (pathPart === '/style-lab') return { name: 'styleLab', path: '/style-lab' };

  return { name: 'dashboard', path: '/' };
}

function navigate(path: string) {
  window.location.hash = path;
}

export function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    seedSampleCardsIfEmpty()
      .then(() => setReady(true))
      .catch((err) => {
        setError(err instanceof Error ? err.message : '初始化失败');
        setReady(true);
      });
  }, []);

  useEffect(() => {
    const handleHashChange = () => setRoute(parseRoute());
    window.addEventListener('hashchange', handleHashChange);

    if (!window.location.hash) {
      window.location.hash = '/';
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const currentPath = useMemo(() => {
    if (route.name === 'library' || route.name === 'detail' || route.name === 'new' || route.name === 'edit') {
      return '/library';
    }
    if (route.name === 'directory') return '/directory';
    if (route.name === 'collections') return '/collections';
    if (route.name === 'data') return '/data';
    if (route.name === 'print') return '/print';
    if (route.name === 'styleLab') return '/style-lab';
    return '/';
  }, [route]);

  if (!ready) {
    return <div className="boot-screen">KnowledgeCard 启动中...</div>;
  }

  if (error) {
    return <div className="boot-screen error">{error}</div>;
  }

  return (
    <Layout currentPath={currentPath} onNavigate={navigate}>
      {route.name === 'dashboard' ? <DashboardPage onNavigate={navigate} /> : null}
      {route.name === 'library' ? (
        <LibraryPage
          initialDomain={route.domain}
          initialQuery={route.query}
          focusSearch={route.focusSearch}
          onNavigate={navigate}
        />
      ) : null}
      {route.name === 'directory' ? (
        <DirectoryPage initialDirectoryId={route.directoryId} onNavigate={navigate} />
      ) : null}
      {route.name === 'collections' ? (
        <CollectionsPage initialCollectionId={route.collectionId} onNavigate={navigate} />
      ) : null}
      {route.name === 'data' ? <DataManagementPage onNavigate={navigate} /> : null}
      {route.name === 'detail' ? <DetailPage id={route.id} onNavigate={navigate} /> : null}
      {route.name === 'new' ? <EditorPage onNavigate={navigate} /> : null}
      {route.name === 'edit' ? <EditorPage id={route.id} onNavigate={navigate} /> : null}
      {route.name === 'print' ? (
        <PrintCenterPage
          initialCollectionId={route.collectionId}
          initialDirectoryId={route.directoryId}
          initialDirectoryScope={route.directoryScope}
          onNavigate={navigate}
        />
      ) : null}
      {route.name === 'styleLab' ? <StyleLabPage /> : null}
    </Layout>
  );
}
