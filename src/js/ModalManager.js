import { VIEWS } from './ViewConfig.js';
import { refreshTable } from "./ViewManager.js";
import { table } from "./table.js";

let initialData = null;

export async function openModal(viewKey, mode, data = {}, id = null) {
    const view = VIEWS[viewKey];

    // Deep clone modal so event listeners don't stack
    let oldModal = document.getElementById(view.modal.templateId);
    const modal = oldModal.cloneNode(true);
    oldModal.replaceWith(modal);
    // Open modal
    modal.classList.add('open');

    // Store initial state of form
    if (mode === 'edit') {
        // Flatten permissions into the initial data for comparison
        initialData = { ...data, ...data.permissions };
    } else {
        initialData = getFormData(modal);
    }

    // Add title based on view and mode
    const title = view.modal[mode].title;
    const titleEl = modal.querySelector(".modal-title");
    titleEl.textContent = title;

    // Wire closeModal to closeBtn
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Hide all the fields that do not belong to this mode
    modal.querySelectorAll('[data-mode]').forEach(el => {
        if (el.dataset.mode !== mode) el.classList.add('hidden');
    });

    // Populate prefills
    const prefill = view.modal.prefill || {};
    for (const el of modal.querySelectorAll('[data-prefill]')) {
        const key = el.dataset.prefill;
        const source = prefill[key];
        if (!source) continue;

        const value = typeof source === 'function' ? await source(data) : source;

        if (el.tagName === 'SELECT') {
            el.innerHTML = '';
            for (const opt of value) {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                el.appendChild(option);
            }
        } else {
            el.value = value;
        }
    }

    function getNestedValue(obj, path) {
        return path.split('.').reduce((acc, key) => acc?.[key], obj);
    }

    // Prefill data on edit mode
    if (mode === 'edit') {
        modal.querySelectorAll('.modal-input').forEach(input => {
            const value = getNestedValue(data, input.name);
            if (value != null) {
                input.value = value;
            }
        });
    }

    // Handle user display for users modal
    const userDisplay = modal.querySelector('.user-display');
    if (userDisplay && mode === 'edit') {
        userDisplay.textContent = `${data.fullname ?? 'No name'} (${data.email})`;
    }

    // Handle checkbox prefill for permissions
    if (data.permissions) {
        for (const [key, value] of Object.entries(data.permissions)) {
            const checkbox = modal.querySelector(`.modal-input[name="${key}"]`);
            if (checkbox && checkbox.type === 'checkbox') {
                checkbox.checked = value;
            }
        }
    }

    // Create submit based on mode
    const submitBtn = modal.querySelector('.submit-btn');
    submitBtn.textContent = mode === 'edit' ? 'Save' : 'Submit';
    submitBtn.disabled = true;

    // Enable submit when form differs from initial
    const inputHandler = () => {
        const diff = getDiff(initialData, getFormData(modal));
        submitBtn.disabled = Object.keys(diff).length === 0;
    };
    modal.addEventListener('input', inputHandler);

    const resetBtn = modal.querySelector('.reset-btn');
    resetBtn.addEventListener('click', () => {
        modal.querySelectorAll('.modal-input').forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = initialData[input.name] ?? false;
            } else {
                input.value = initialData[input.name] ?? '';
            }
        });
        submitBtn.disabled = true;
    });

    submitBtn.addEventListener('click', () => {
        enterConfirm(modal, mode);
    });

    // Wire up confirm buttons (approve/cancel)
    const approveBtn = modal.querySelector('.approve-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');

    approveBtn.addEventListener('click', async () => {
        const formData = getFormData(modal);
        if (mode === 'edit') {
            const diff = getDiff(initialData, formData);
            await view.modal[mode].method(id, diff);
        } else {
            await view.modal[mode].method(formData);
        }
        const newData = await view.getData();
        refreshTable(table, newData);
        closeModal();
    });

    cancelBtn.addEventListener('click', () => {
        exitConfirm(modal);
    });
}

// --- Confirmation flow ---

function enterConfirm(modal, mode) {
    modal.classList.add('confirming');

    // Disable all inputs
    modal.querySelectorAll('.modal-input').forEach(input => {
        input.disabled = true;
    });

    // For edit mode, show original values above changed fields
    if (mode === 'edit') {
        const diff = getDiff(initialData, getFormData(modal));
        for (const key of Object.keys(diff)) {
            const input = modal.querySelector(`.modal-input[name="${key}"]`);
            if (!input) continue;
            const orig = document.createElement('div');
            orig.className = 'original-value';
            if (input.type === 'checkbox') {
                orig.textContent = initialData[key] ? '✓ Enabled' : '✗ Disabled';
            } else {
                orig.textContent = initialData[key] || '(empty)';
            }
            input.parentNode.insertBefore(orig, input);
        }
    }
}

function exitConfirm(modal) {
    modal.classList.remove('confirming');

    // Re-enable all inputs
    modal.querySelectorAll('.modal-input').forEach(input => {
        input.disabled = false;
    });

    // Remove any injected original-value elements
    modal.querySelectorAll('.original-value').forEach(el => el.remove());
}

// --- Helpers ---

function getFormData(card) {
    const data = {};
    const permissions = {};
    const permissionFields = ['create_bridge', 'update_bridge', 'create_sensor', 'update_sensor', 'sync_fields', 'manage_permissions'];

    card.querySelectorAll('.modal-input').forEach(input => {
        if (input.closest('[data-mode].hidden')) return;

        const name = input.name;
        let value;

        if (input.type === 'checkbox') {
            value = input.checked;
        } else {
            const trimmed = input.value.trim();
            value = trimmed === '' ? null : trimmed;
        }

        if (permissionFields.includes(name)) {
            permissions[name] = value;
        } else {
            data[name] = value;
        }
    });

    if (Object.keys(permissions).length > 0) {
        data.permissions = permissions;
    }

    return data;
}

function getDiff(initial, current) {
    const diff = {};
    for (const key of Object.keys(current)) {
        const initialVal = initial[key];
        const currentVal = current[key];

        if (typeof currentVal === 'boolean') {
            if (currentVal !== initialVal) {
                diff[key] = currentVal;
            }
        } else if (currentVal !== String(initialVal ?? '')) {
            diff[key] = currentVal;
        }
    }
    return diff;
}

export function closeModal() {
    const modal = document.querySelector('.modal.open');
    modal.classList.remove('open');
    modal.classList.remove('confirming');
    modal.querySelectorAll('[data-mode]').forEach(el => {
        el.classList.remove('hidden');
    });
    modal.querySelectorAll('.modal-input').forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = false;
        } else {
            input.value = '';
        }
        input.disabled = false;
    });
    modal.querySelectorAll('.original-value').forEach(el => el.remove());

    // Reset user display
    const userDisplay = modal.querySelector('.user-display');
    if (userDisplay) {
        userDisplay.textContent = '';
    }

    initialData = null;
}

export function datetimeNow() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000)
        .toISOString()
        .slice(0, 16);
}