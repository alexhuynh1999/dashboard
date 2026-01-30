import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer style={{
            textAlign: 'center',
            padding: '0.5rem 1rem 1rem',
            marginTop: '1rem',
            color: 'var(--text-muted)',
            fontSize: '0.7rem',
            width: '100%'
        }}>
            <div>v1.0.0</div>
        </footer>
    );
};

export default Footer;
