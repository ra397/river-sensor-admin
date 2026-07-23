import { deleteUser } from "./api.js";
import {refreshTable} from "./ViewManager.js";

export function confirmAction(message, { confirmLabel = 'Delete', cancelLabel = 'Cancel' } = {}) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.innerHTML = `
            <div class="confirm-modal">
                <p class="confirm-message"></p>
                <div class="confirm-actions">
                    <button class="confirm-cancel">${cancelLabel}</button>
                    <button class="confirm-ok">${confirmLabel}</button>
                </div>
            </div>`;
        // set message via textContent to avoid HTML injection
        overlay.querySelector('.confirm-message').textContent = message;
        document.body.appendChild(overlay);

        const close = (result) => {
            overlay.remove();
            resolve(result);
        };
        overlay.querySelector('.confirm-ok').addEventListener('click', () => close(true));
        overlay.querySelector('.confirm-cancel').addEventListener('click', () => close(false));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
    });
}

export async function confirmDeleteUser(userId, { table, view }) {
    const confirmed = await confirmAction('Are you sure you want to delete this user?');
    if (!confirmed) return;

    await deleteUser(userId);

    const newData = await view.getData();
    refreshTable(table, newData);
}