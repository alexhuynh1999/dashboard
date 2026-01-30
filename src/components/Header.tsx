import React, { useEffect, useState } from 'react';
import { Sun, Moon, Menu } from 'lucide-react';

interface HeaderProps {
    onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <header style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem 1rem',
            marginBottom: '3rem',
            position: 'relative',
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto'
        }}>
            <div style={{ position: 'absolute', left: '2rem', top: '50%', transform: 'translateY(-50%)' }} className="mobile-only">
                <button
                    onClick={onToggleSidebar}
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '50%',
                        width: '44px',
                        height: '44px',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-main)',
                    }}
                >
                    <Menu size={20} />
                </button>
            </div>

            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
                Welcome, Alex
            </h1>
            <div style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)' }}>
                <button
                    onClick={toggleTheme}
                    aria-label="Toggle Theme"
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '50%',
                        width: '44px',
                        height: '44px',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-main)',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>
        </header>
    );
};

export default Header;
