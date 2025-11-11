/**
 * Theme Management Module
 */
const ThemeManager = (() => {
  const THEME_KEY = 'theme';
  const THEME_DARK = 'dark';
  const THEME_LIGHT = 'light';
  
  const getSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? THEME_DARK 
      : THEME_LIGHT;
  };
  
  const getCurrentTheme = () => {
    return localStorage.getItem(THEME_KEY) || getSystemTheme();
  };
  
  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateFavicon(theme);
    updateThemeIcon(theme);
  };
  
  const updateFavicon = (theme) => {
    const favicon = document.querySelector("link[rel='icon']");
    if (favicon) {
      const iconPath = theme === THEME_DARK 
        ? '/assets/img/static/favicon-dark.png'
        : '/assets/img/static/favicon-light.png';
      favicon.setAttribute('href', window.location.origin + iconPath);
    }
  };
  
  const updateThemeIcon = (theme) => {
    const themeIcons = document.querySelectorAll('.theme-toggle i');
    const iconClass = theme === THEME_DARK 
      ? 'fa-sun' 
      : 'fa-moon';
    
    themeIcons.forEach(icon => {
      icon.className = `fa-regular ${iconClass}`;
    });
  };
  
  const toggle = () => {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    setTheme(newTheme);
  };
  
  const init = () => {
    const theme = getCurrentTheme();
    setTheme(theme);
    
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (!localStorage.getItem(THEME_KEY)) {
          setTheme(e.matches ? THEME_DARK : THEME_LIGHT);
        }
      });
  };
  
  return {
    init,
    toggle
  };
})();

/**
 * Navigation Module
 * Handles mobile menu toggle and scroll behavior
 */
const NavigationManager = (() => {
  let mobileNav = null;
  let backdrop = null;
  const body = document.body;
  
  const toggle = () => {
    mobileNav = document.getElementById('nav-mobile');
    backdrop = document.getElementById('nav-mobile-backdrop');
    
    if (!mobileNav || !backdrop) {
      console.log('Menu elements not found');
      return;
    }
    
    const isOpen = mobileNav.classList.contains('show-nav-mobile');
    
    if (isOpen) {
      close();
    } else {
      open();
    }
  };
  
  const open = () => {
    mobileNav = document.getElementById('nav-mobile');
    backdrop = document.getElementById('nav-mobile-backdrop');
    
    if (!mobileNav || !backdrop) return;
    
    mobileNav.classList.add('show-nav-mobile');
    backdrop.classList.add('active');
    backdrop.style.display = 'block';
    body.style.overflow = 'hidden';
    
    console.log('Menu opened');
  };
  
  const close = () => {
    mobileNav = document.getElementById('nav-mobile');
    backdrop = document.getElementById('nav-mobile-backdrop');
    
    if (!mobileNav || !backdrop) return;
    
    mobileNav.classList.remove('show-nav-mobile');
    backdrop.classList.remove('active');
    
    setTimeout(() => {
      backdrop.style.display = 'none';
    }, 300);
    
    body.style.overflow = '';
    
    console.log('Menu closed');
  };
  
  const handleResize = () => {
    if (window.innerWidth > 700) {
      close();
    }
  };
  
  const init = () => {
    window.addEventListener('resize', handleResize);
    
    setTimeout(() => {
      mobileNav = document.getElementById('nav-mobile');
      backdrop = document.getElementById('nav-mobile-backdrop');
      
      if (mobileNav) {
        const navLinks = mobileNav.querySelectorAll('a');
        navLinks.forEach(link => {
          link.addEventListener('click', close);
        });
      }
      
      if (backdrop) {
        backdrop.addEventListener('click', close);
      }
      
    }, 100);
  };
  
  return {
    init,
    toggle,
    open,
    close
  };
})();

/**
 * Scroll Management Module
 * Handles scroll to top and scroll effects
 */
const ScrollManager = (() => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  const handleScroll = () => {
    const header = document.querySelector('.header-desktop');
    if (!header) return;
    
    if (window.scrollY > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  
  const init = () => {
    window.addEventListener('scroll', handleScroll);
  };
  
  return {
    init,
    scrollToTop
  };
})();

/**
 * Animation Module
 * Handles scroll animations and intersection observers
 */
const AnimationManager = (() => {
  const observeElements = () => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          
          if (entry.target.classList.contains('skill-card')) {
            const levelFill = entry.target.querySelector('.level-fill');
            if (levelFill) {
              levelFill.style.width = levelFill.style.width || '0%';
            }
          }
        }
      });
    }, observerOptions);
    
    document.querySelectorAll('.skill-card').forEach(card => {
      observer.observe(card);
    });
    
    document.querySelectorAll('.timeline-item').forEach(item => {
      observer.observe(item);
    });
    
    document.querySelectorAll('.blog-card').forEach(card => {
      observer.observe(card);
    });
  };
  
  const init = () => {
    if ('IntersectionObserver' in window) {
      observeElements();
    }
  };
  
  return {
    init
  };
})();

/**
 * Performance Monitor (Development only)
 */
// const PerformanceMonitor = (() => {
//   const log = () => {
//     if (window.performance && console.table) {
//       const perfData = window.performance.getEntriesByType('navigation')[0];
//       if (perfData) {
//         console.table({
//           'DNS Lookup': `${perfData.domainLookupEnd - perfData.domainLookupStart}ms`,
//           'TCP Connection': `${perfData.connectEnd - perfData.connectStart}ms`,
//           'Request Time': `${perfData.responseStart - perfData.requestStart}ms`,
//           'Response Time': `${perfData.responseEnd - perfData.responseStart}ms`,
//           'DOM Processing': `${perfData.domComplete - perfData.domLoading}ms`,
//           'Load Complete': `${perfData.loadEventEnd - perfData.loadEventStart}ms`
//         });
//       }
//     }
//   };
  
//   return {
//     log
//   };
// })();

/**
 * Initialize all modules
 */
const initializeApp = () => {
  ThemeManager.init();
  NavigationManager.init();
  ScrollManager.init();
  AnimationManager.init();
  
  // if (window.location.hostname === 'localhost') {
  //   window.addEventListener('load', () => {
  //     setTimeout(PerformanceMonitor.log, 0);
  //   });
  // }
};

function themeToggle() {
  ThemeManager.toggle();
}

function menuToggle() {
  NavigationManager.toggle();
}

function goTop() {
  ScrollManager.scrollToTop();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

const style = document.createElement('style');
style.textContent = `
  .skill-card,
  .timeline-item,
  .blog-card {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  
  .skill-card.animate-in,
  .timeline-item.animate-in,
  .blog-card.animate-in {
    opacity: 1;
    transform: translateY(0);
  }
  
  .header-desktop.scrolled {
    box-shadow: 0 4px 20px rgba(0, 255, 65, 0.1);
  }
  
  .level-fill {
    transition: width 1.5s ease;
  }
`;
document.head.appendChild(style);