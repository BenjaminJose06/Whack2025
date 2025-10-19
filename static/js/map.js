// Map.js - Interactive map functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects and animations to zones
    const zones = document.querySelectorAll('.zone');
    
    zones.forEach(zone => {
        zone.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) scale(1.02)';
            this.style.boxShadow = '0 25px 50px rgba(0,0,0,0.5)';
        });
        
        zone.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
        });
    });
    
    // Add click animation
    zones.forEach(zone => {
        zone.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('div');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255,255,255,0.3)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s linear';
            ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add floating animation to clouds
    const clouds = document.querySelectorAll('.cloud');
    clouds.forEach((cloud, index) => {
        // Randomize initial position and speed
        cloud.style.animationDelay = (index * 5) + 's';
        cloud.style.animationDuration = (25 + index * 5) + 's';
    });
    
    // Add particle system
    createParticleSystem();
});

function createParticleSystem() {
    const container = document.querySelector('.map-container');
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        setTimeout(() => {
            createParticle(container);
        }, i * 200);
    }
    
    // Continue creating particles
    setInterval(() => {
        if (document.querySelectorAll('.particle').length < particleCount) {
            createParticle(container);
        }
    }, 3000);
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    const size = Math.random() * 4 + 2;
    const duration = Math.random() * 10 + 10;
    const delay = Math.random() * 5;
    
    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        pointer-events: none;
        left: ${Math.random() * 100}%;
        top: 100%;
        animation: floatUp ${duration}s linear ${delay}s infinite;
        opacity: 0.7;
    `;
    
    container.appendChild(particle);
    
    // Remove particle after animation
    setTimeout(() => {
        if (particle.parentNode) {
            particle.remove();
        }
    }, (duration + delay) * 1000);
}

// Add CSS for particle animation
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.7;
        }
        50% {
            opacity: 1;
        }
        100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    @keyframes ripple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);