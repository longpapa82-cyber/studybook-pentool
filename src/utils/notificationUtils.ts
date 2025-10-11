// Phase 3-4: Visual feedback utilities for clipboard operations

export function showNotification(message: string, duration: number = 2000) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.className =
    'fixed top-20 right-4 bg-gray-900/90 text-white px-4 py-3 rounded-lg shadow-lg z-50 text-sm font-medium pointer-events-none animate-slide-in-right';

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slide-out-right 0.3s ease-in-out';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, duration);
}

// CSS 애니메이션 추가 (한 번만 실행)
if (typeof document !== 'undefined' && !document.getElementById('notification-style')) {
  const style = document.createElement('style');
  style.id = 'notification-style';
  style.textContent = `
    @keyframes slide-in-right {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slide-out-right {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }

    .animate-slide-in-right {
      animation: slide-in-right 0.3s ease-out;
    }
  `;
  document.head.appendChild(style);
}
