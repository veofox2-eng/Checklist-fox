import React from 'react';
import { motion } from 'framer-motion';
import { CheckSquare } from 'lucide-react';

const Logo = () => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
            }}
        >
            <div style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                borderRadius: '12px',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 15px var(--accent-glow)'
            }}>
                <CheckSquare size={28} strokeWidth={2.5} />
            </div>
            <span style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: '800',
                fontSize: '1.75rem',
                letterSpacing: '-0.03em',
                background: 'linear-gradient(to right, var(--text-primary), var(--accent-primary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                Checkify
            </span>
        </motion.div>
    );
};

export default Logo;
