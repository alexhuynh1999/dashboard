import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import Header from './components/Header';
import TodoList from './components/TodoList';
import KanbanBoard from './components/KanbanBoard';
import Footer from './components/Footer';

// Placeholder for other components

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Listen for theme changes
  useEffect(() => {
    const checkTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(currentTheme);
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sidebar Overlay for Mobile */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Pastel Cover Banner - Only in Light Mode */}
      {theme === 'light' && (
        <div style={{
          width: '100%',
          height: '160px',
          background: 'linear-gradient(135deg, #d6ffd7, #fff9c4, #d6e9ff, #e6d6ff, #d6ffd7)',
          backgroundSize: '300% 300%',
          animation: 'gradientShift 90s ease infinite',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0
        }} />
      )}

      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <main className="main-content">
        <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
            <TodoList />

            <div className="mobile-only" style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Theme</span>
                <button
                  onClick={() => {
                    const nextTheme = theme === 'light' ? 'dark' : 'light';
                    document.documentElement.setAttribute('data-theme', nextTheme);
                    localStorage.setItem('theme', nextTheme);
                    setTheme(nextTheme);
                  }}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                  }}
                >
                  {theme === 'light' ? <><Moon size={16} /> Dark</> : <><Sun size={16} /> Light</>}
                </button>
              </div>
            </div>
          </div>
        </aside>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center' }}>
          <KanbanBoard />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
