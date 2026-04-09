/**
 * CUE Movilidad — notificaciones entre modulos (campana en la barra).
 *
 * Las notificaciones se guardan en localStorage bajo LS_NOTIFICATIONS. Cualquier pantalla puede llamar
 * pushCueNotification(roles, mensaje); los dashboards que incluyen cue-core.js y el HTML de la campana
 * inicializan initCueNotificationUI(codigoRol) para filtrar lo que ve cada rol.
 */
(function (global) {
    'use strict';

    const LS_NOTIFICATIONS = 'CUE_NOTIFICATIONS';

    function getCueNotifications() {
        try {
            const raw = localStorage.getItem(LS_NOTIFICATIONS);
            const data = raw ? JSON.parse(raw) : [];
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    }

    function pushCueNotification(targetRoles, message) {
        const roles = Array.isArray(targetRoles) ? targetRoles : [targetRoles];
        if (!roles.length || !message) return;
        const current = getCueNotifications();
        const now = new Date().toISOString();
        roles.forEach(role => {
            current.push({ role, message, date: now, read: false });
        });
        localStorage.setItem(LS_NOTIFICATIONS, JSON.stringify(current));
    }

    function markNotificationsRead(roleCode) {
        const current = getCueNotifications();
        const updated = current.map(n => n.role === roleCode ? { ...n, read: true } : n);
        localStorage.setItem(LS_NOTIFICATIONS, JSON.stringify(updated));
    }

    function getUnreadCount(roleCode) {
        return getCueNotifications().filter(n => n.role === roleCode && !n.read).length;
    }

    function escapeAttr(str) {
        if (str == null) return '';
        return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function escapeHtml(str) {
        if (str == null) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function initCueNotificationUI(roleCode) {
        const bell = document.getElementById('notificationBell');
        const dot = document.getElementById('notificationDot');
        const dropdown = document.getElementById('notificationDropdown');
        const list = document.getElementById('notificationList');
        if (!bell || !dot || !dropdown || !list) return;

        function renderList() {
            const all = getCueNotifications();
            const mine = all.filter(n => n.role === roleCode);
            if (mine.length === 0) {
                dot.classList.add('hidden');
                list.innerHTML = '<p class="px-4 py-3 text-xs text-gray-500">No tienes notificaciones.</p>';
                return;
            }
            const unreadCount = mine.filter(n => !n.read).length;
            if (unreadCount > 0) {
                dot.classList.remove('hidden');
            } else {
                dot.classList.add('hidden');
            }
            const sorted = [...mine].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
            list.innerHTML = sorted.map(n => {
                const date = n.date ? new Date(n.date) : null;
                const formatted = date && !isNaN(date.getTime())
                    ? date.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
                    : '';
                return `
                    <div class="px-4 py-2 border-b border-gray-100 last:border-b-0 ${!n.read ? 'bg-blue-50/50' : ''}">
                        <p class="text-xs text-gray-800">${escapeHtml(n.message || '')}</p>
                        ${formatted ? `<p class="mt-0.5 text-[10px] text-gray-400">${escapeHtml(formatted)}</p>` : ''}
                    </div>
                `;
            }).join('');
        }

        bell.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = dropdown.classList.contains('hidden');
            if (isHidden) {
                markNotificationsRead(roleCode);
                renderList();
                dropdown.classList.remove('hidden');
            } else {
                dropdown.classList.add('hidden');
            }
        });

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && e.target !== bell && !bell.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });

        renderList();
    }

    global.CUECore = {
        getCueNotifications,
        pushCueNotification,
        markNotificationsRead,
        getUnreadCount,
        escapeHtml,
        escapeAttr,
        initCueNotificationUI,
        LS_NOTIFICATIONS
    };
})(typeof window !== 'undefined' ? window : this);
