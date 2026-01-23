import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Search from './components/Search';
import DetailPage from './components/DetailPage';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import LogViewer from './components/LogViewer';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('search');
  const [selectedData, setSelectedData] = useState(null);
  const [searchData, setSearchData] = useState([]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleNavigateToDetail = (data) => {
    // Redirect ไปหน้า form พร้อม id
    window.location.href = `${import.meta.env.VITE_DATABASE_URL}/form?id=${data.id}`;
  };

  const handleBackToSearch = () => {
    setCurrentPage('search');
    setSelectedData(null);
  };

  const handleToUserManagement = () => {
    setCurrentPage('users');
  };

  const handleToLogs = () => {
    setCurrentPage('logs');
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'users':
        return <UserManagement onBack={handleBackToSearch} />;
      case 'logs':
        return <LogViewer onBack={handleBackToSearch} />;
      case 'detail':
        return <DetailPage data={selectedData} onBack={handleBackToSearch} />;
      default:
        return (
          <Search
            onNavigate={handleNavigateToDetail}
            searchData={searchData}
            setSearchData={setSearchData}
            onToUsers={handleToUserManagement}
            onToLogs={handleToLogs}
          />
        );
    }
  };

  return (
    <>
      {renderContent()}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

