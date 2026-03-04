import React, { useEffect, useState } from 'react';
import { Sun, Moon, Key, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMaster } from '../contexts/MasterContext';

const ThemeToggle = () => {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('app-theme');
        if (savedTheme) return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.documentElement.style.colorScheme = 'dark';
        } else {
            document.documentElement.removeAttribute('data-theme');
            document.documentElement.style.colorScheme = 'light';
        }
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const { isMaster, setIsMaster } = useMaster();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authInput, setAuthInput] = useState('');
    const [authError, setAuthError] = useState('');

    const handleAuthSubmit = (e) => {
        e.preventDefault();
        if (authInput === 'FoxDigitalMaster') {
            setIsMaster(true);
            setShowAuthModal(false);
            setAuthInput('');
            setAuthError('');
        } else {
            setAuthError('Invalid Master Key');
        }
    };

    const handleLock = () => {
        if (isMaster) {
            setIsMaster(false);
        } else {
            setShowAuthModal(true);
        }
    };

    return (
        <>
            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                gap: '10px'
            }}>
                {/* Master Authentication Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleLock}
                    style={{
                        background: isMaster ? 'var(--primary-color)' : 'var(--bg-glass)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '50%',
                        width: '45px',
                        height: '45px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isMaster ? '#fff' : 'var(--text-primary)',
                        boxShadow: 'var(--shadow-sm)',
                        backdropFilter: 'blur(10px)',
                        cursor: 'pointer'
                    }}
                    title={isMaster ? "Master Mode Active (Click to Lock)" : "Unlock Master Mode"}
                >
                    {isMaster ? <ShieldCheck size={20} /> : <Key size={20} />}
                </motion.button>

                {/* Standard Theme Toggle */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleTheme}
                    style={{
                        background: 'var(--bg-glass)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '50%',
                        width: '45px',
                        height: '45px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-primary)',
                        boxShadow: 'var(--shadow-sm)',
                        backdropFilter: 'blur(10px)',
                        cursor: 'pointer'
                    }}
                    title="Toggle Theme"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </motion.button>
            </div>

            {/* Floating Auth Modal */}
            <AnimatePresence>
                {showAuthModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ zIndex: 100000 }}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            style={{ maxWidth: '400px', width: '90%' }}
                        >
                            <div className="modal-header">
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Key size={20} className="icon-purple" />
                                    Master Authentication
                                </h3>
                                <button
                                    className="icon-button"
                                    onClick={() => { setShowAuthModal(false); setAuthError(''); setAuthInput(''); }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAuthSubmit}>
                                <div style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                        Secure Key
                                    </label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        value={authInput}
                                        onChange={(e) => setAuthInput(e.target.value)}
                                        placeholder="Enter master key..."
                                        style={{ width: '100%', boxSizing: 'border-box' }}
                                        autoFocus
                                    />
                                    {authError && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>{authError}</p>}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => { setShowAuthModal(false); setAuthError(''); setAuthInput(''); }}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary" style={{ padding: '0 24px' }}>
                                        Authenticate
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ThemeToggle;
