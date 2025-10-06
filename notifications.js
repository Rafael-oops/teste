
// Sistema de notificações acessível e reutilizável
export const notify = {
    success(message, options = {}) {
        showToast(message, { ...options, type: 'success' });
    },
    error(message, options = {}) {
        showToast(message, { ...options, type: 'error' });
    },
    warning(message, options = {}) {
        showToast(message, { ...options, type: 'warning' });
    },
    info(message, options = {}) {
        showToast(message, { ...options, type: 'info' });
    }
};

function showToast(message, { title = '', duration = 3500, type = 'info' } = {}) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = title ? `${title} - ${message}` : message;
    toast.classList.remove('hidden');
    toast.classList.remove('bg-gray-900', 'bg-green-600', 'bg-red-600', 'bg-yellow-500');
    switch (type) {
        case 'success': toast.classList.add('bg-green-600'); break;
        case 'error': toast.classList.add('bg-red-600'); break;
        case 'warning': toast.classList.add('bg-yellow-500'); break;
        default: toast.classList.add('bg-gray-900'); break;
    }
    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}