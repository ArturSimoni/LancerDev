import { Suspense } from 'react';
import { Outlet, useNavigation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import PageLoader from './PageLoader';

export default function MainLayout() {
  const navigation = useNavigation();

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-content" aria-busy={navigation.state === 'loading'}>
        {navigation.state === 'loading' ? (
          <PageLoader />
        ) : (
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        )}
      </div>
      <Footer />
    </div>
  );
}