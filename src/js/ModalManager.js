import { VIEWS } from './ViewConfig.js';
import {refreshTable} from "./ViewManager.js";
import { table } from "../main.js";

let initialData = null;

export async function openModal(viewKey, mode, data = {}, id = null) {
    const view = VIEWS[viewKey];
    const config = view.modal[mode];   // { title, method }
    const fields = view.modal.fields;

    // Store initial snapshot for diff on edit
    initialData = mode === 'edit' ? {...data} : null;

    const modal = document.getElementById('modal');
    modal.innerHTML = '';
    modal.classList.add('open');

    const card = document.createElement('div');
    card.className = 'modal-card';

    // Header
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `<span class="modal-title">${config.title}</span>`;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', closeModal);
    header.appendChild(closeBtn);
    card.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'modal-body';

    for (const row of fields) {
        const filteredRow = row.filter(f => !f.mode || f.mode === mode);
        if (filteredRow.length === 0) continue;

        const rowEl = document.createElement('div');
        rowEl.className = 'modal-row';

        for (const field of row) {
            if (field.optionsFrom) {
                field.options = await field.optionsFrom(id);
            }

            const label = document.createElement('label');
            label.className = 'modal-label';
            label.textContent = field.label;

            let input;
            if (field.type === 'select') {
                input = document.createElement('select');
                for (const opt of field.options) {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    input.appendChild(option);
                }
            } else {
                input = document.createElement('input');
                input.type = field.type || 'text';

                if (field.type === 'datetime-local') {
                    input.value = datetimeNow();
                }
            }

            input.name = field.name;
            input.className = 'modal-input';

            // Prefill for edit mode
            if (data[field.name] != null) {
                input.value = data[field.name];
            }

            label.appendChild(input);
            rowEl.appendChild(label);
        }

        body.appendChild(rowEl);
    }

    card.appendChild(body);

    // Submit
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    const submitBtn = document.createElement('button');
    submitBtn.classList.add('modal-btn', 'modal-submit');
    submitBtn.textContent = mode === 'edit' ? 'Save' : 'Submit';

    if (mode === 'edit') {
        submitBtn.disabled = true;

        const resetBtn = document.createElement('button');
        resetBtn.classList.add('modal-btn', 'modal-reset');
        resetBtn.textContent = 'Reset';
        resetBtn.addEventListener('click', () => {
            card.querySelectorAll('.modal-input').forEach(input => {
                input.value = initialData[input.name] ?? '';
            });
            submitBtn.disabled = true;
        });
        footer.appendChild(resetBtn);
    }

    submitBtn.addEventListener('click', async () => {
        const formData = getFormData(card);

        if (mode === 'edit') {
            const diff = getDiff(initialData, formData);
            console.log('PATCH diff:', diff);
            await view.putData(id, diff);
            closeModal();
            const newData = await view.getData();
            console.log(newData);
            refreshTable(table, newData);
            // send only diff
        } else {
            await view.postData(formData);
            closeModal();
            const newData = await view.getData();
            console.log(newData);
            refreshTable(table, newData);
            // send full formData
        }
    });

    footer.appendChild(submitBtn);
    card.appendChild(footer);

    // For edit mode: enable submit only when something changed
    if (mode === 'edit') {
        card.addEventListener('input', () => {
            const formData = getFormData(card);
            const diff = getDiff(initialData, formData);
            submitBtn.disabled = Object.keys(diff).length === 0;
        });
    }

    modal.appendChild(card);
}

function getFormData(card) {
    const data = {};
    card.querySelectorAll('.modal-input').forEach(input => {
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
    const modal = document.getElementById('modal');
    modal.classList.remove('open');
    modal.innerHTML = '';
    initialData = null;
}

function datetimeNow() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000)
        .toISOString()
        .slice(0, 16);
}