import { VIEWS } from './ViewConfig.js';
import { refreshTable } from "./ViewManager.js";
import { table } from "../main.js";

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
    initialData = mode === 'edit' ? { ...data } : getFormData(modal);

    // Add title based on view and mode
    const title = view.modal[mode].title;
    const titleEl = modal.querySelector(".modal-title");
    titleEl.textContent = title;

    // Wire closeModal to closeBtn
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', closeModal);

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

    // Prefill data on edit mode
    if (mode === 'edit') {
        modal.querySelectorAll('.modal-input').forEach(input => {
            if (data[input.name] != null) {
                input.value = data[input.name];
            }
        });
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
            input.value = initialData[input.name];
        });
        submitBtn.disabled = true;
    });

    submitBtn.addEventListener('click', async () => {
        const formData = getFormData(modal);
        if (mode === 'edit') {
            const diff = getDiff(initialData, formData);
            await view.modal[mode].method(id, diff);
            const newData = await view.getData();
            refreshTable(table, newData);
            closeModal();
        } else if (mode === 'create') {
            await view.modal[mode].method(formData);
            const newData = await view.getData();
            refreshTable(table, newData);
            closeModal();
        }
    })
}

function getFormData(card) {
    const data = {};
    card.querySelectorAll('.modal-input').forEach(input => {
        if (input.closest('[data-mode].hidden')) return;
        data[input.name] = input.value.trim();
    });
    return data;
}

function getDiff(initial, current) {
    const diff = {};
    for (const key of Object.keys(current)) {
        if (current[key] !== String(initial[key] ?? '')) {
            diff[key] = current[key];
        }
    }
    return diff;
}

export function closeModal() {
    const modal = document.querySelector('.modal.open');
    // Close modal
    modal.classList.remove('open');
    // Show all elements again
    modal.querySelectorAll('[data-mode]').forEach(el => {
        el.classList.remove('hidden');
    });
    // Unfill all data
    modal.querySelectorAll('.modal-input').forEach(input => {
        input.value = '';
    });
    initialData = null;
}

export function datetimeNow() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000)
        .toISOString()
        .slice(0, 16);
}