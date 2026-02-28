import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground = () => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -1,
            overflow: 'hidden',
            pointerEvents: 'none',
            background: 'var(--bg-primary)'
        }}>
            {/* Decorative Ribbon Blob 1 */}
            <motion.div
                animate={{
                    rotate: [0, 360],
                    borderRadius: [
                        "60% 40% 30% 70% / 60% 30% 70% 40%",
                        "30% 60% 70% 40% / 50% 60% 30% 60%",
                        "60% 40% 30% 70% / 60% 30% 70% 40%"
                    ]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                style={{
                    position: 'absolute',
                    top: '-15%',
                    left: '-10%',
                    width: '60vw',
                    height: '60vw',
                    background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(79, 70, 229, 0.02))',
                    filter: 'blur(40px)',
                    opacity: 0.8
                }}
            />

            {/* Decorative Ribbon Blob 2 */}
            <motion.div
                animate={{
                    rotate: [360, 0],
                    borderRadius: [
                        "40% 60% 60% 40% / 60% 30% 70% 40%",
                        "50% 50% 40% 60% / 40% 60% 40% 60%",
                        "40% 60% 60% 40% / 60% 30% 70% 40%"
                    ],
                    x: ['0%', '10%', '0%'],
                    y: ['0%', '-10%', '0%']
                }}
                transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
                style={{
                    position: 'absolute',
                    bottom: '-20%',
                    right: '-10%',
                    width: '70vw',
                    height: '70vw',
                    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12), rgba(236, 72, 153, 0.02))',
                    filter: 'blur(50px)',
                    opacity: 0.8
                }}
            />

            {/* Soft Light Orb */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute',
                    top: '20%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '40vw',
                    height: '40vw',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    borderRadius: '50%',
                    filter: 'blur(80px)',
                }}
            />
        </div>
    );
};

export default AnimatedBackground;
