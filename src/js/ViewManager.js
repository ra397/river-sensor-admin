import { table } from "./table.js"
import { VIEWS } from "./ViewConfig.js";
import { openModal } from "./ModalManager.js";
import { resetFilterState, toggleFilterOption, applyFilters, enableSearch } from './filter.js';
import {showReports} from "./plotly.js";

function renderNavbar(viewKey) {
    const navTabsEl = document.querySelector('.nav-tabs');
    if (!navTabsEl) return;
    navTabsEl.innerHTML = '';

    for (const key in VIEWS) {
        const tabEl = document.createElement('button');
        tabEl.type = 'button';
        tabEl.textContent = VIEWS[key].title;
        tabEl.className = 'nav-tab';
        if (key === viewKey) tabEl.classList.add('active');
        tabEl.addEventListener('click', async () => {
            const tableData = await VIEWS[key].getData();
            await renderView(key, tableData);
        });
        navTabsEl.appendChild(tabEl);
    }
}

function renderActionButton(view) {
    const oldBtn = document.querySelector('#nav-action-btn');
    const btn = oldBtn.cloneNode(true);
    oldBtn.replaceWith(btn);
    btn.textContent = view.action.label;
    btn.addEventListener('click', () => view.action.handler());
}

function renderFilters(view) {
    const container = document.querySelector('#filter-groups');
    if (!container) return;
    container.innerHTML = '';

    for (const [key, filter] of Object.entries(view.filters)) {
        const groupEl = document.createElement('div');
        groupEl.className = 'filter-group';

        const titleEl = document.createElement('div');
        titleEl.className = 'filter-title';
        titleEl.innerHTML = `<svg class="chevron" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"></path></svg><span>${filter.label}</span>`;
        titleEl.addEventListener('click', () => groupEl.classList.toggle('open'));
        groupEl.appendChild(titleEl);

        const optionsEl = document.createElement('div');
        optionsEl.className = 'filter-options';

        for (const option of filter.options) {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = option;
            checkbox.checked = true;
            checkbox.dataset.category = key;

            checkbox.addEventListener('change', (e) => {
                toggleFilterOption(e.target.dataset.category, e.target.value, e.target.checked);
                applyFilters();
            });

            label.append(checkbox, ' ', option);
            label.className = 'filter-option';
            optionsEl.append(label);
        }

        groupEl.appendChild(optionsEl);
        container.appendChild(groupEl);
    }
}

function renderColumnToggles(view) {
    const container = document.querySelector('#column-toggle-container');
    if (!container) return;
    container.innerHTML = '';

    for (const column of view.columns) {
        if (column.visible === false) continue;
        const btn = document.createElement('span');
        btn.className = 'column-toggle';
        btn.textContent = column.title;
        btn.addEventListener('click', () => {
            table.toggleColumn(column.field);
            btn.classList.toggle('hidden');
        });
        container.appendChild(btn);
    }
}

function renderRowActionButtons(view, rowData) {
    const wrapper = document.createElement('div');
    wrapper.className = 'action-btn-wrapper';

    const facade = document.createElement('span');
    facade.className = 'action-btn facade';
    facade.textContent = '...';
    wrapper.appendChild(facade);

    for (const action of view.rowActions.buttons) {
        const btn = document.createElement('span');
        btn.className = 'action-btn action-child';
        btn.innerHTML = action.icon;
        btn.addEventListener('click',(e) => {
            e.stopPropagation();
            action.handler(rowData);
        });
        wrapper.appendChild(btn);
    }

    return wrapper;
}

// Resets sorters and header filters
function renderTable(table, columns, data) {
    table.setColumns(columns);
    table.setData(data);
}

// Preserves filters, search, and order
export function refreshTable(table, newData) {
    table.setData(newData);
}

// Full page render (switching views)
let previousView = null;
export function renderView(viewKey, tableData) {
    const view = VIEWS[viewKey];
    if (!view) return;

    if (previousView === viewKey) return;
    previousView = viewKey;

    renderNavbar(viewKey);
    renderActionButton(view);

    resetFilterState(view.filters);
    renderFilters(view);

    renderTable(table, view.columns, tableData);

    table.off('rowClick');
    if (view.getRowData) {
        table.on('rowClick', async (e, row) => {
            table.deselectRow();
            row.select();

            const existing = document.querySelector('.action-btn-wrapper');
            if (existing) existing.remove();

            const id = row.getData().id;
            const rowData = await view.getRowData(id);
            const cellEl = row.getCell(view.rowActions.column).getElement();
            cellEl.appendChild(renderRowActionButtons(view, rowData));
        });
    }

    enableSearch(document.getElementById('search-input'));
    renderColumnToggles(view);

    const usernameEl = document.querySelector('#user-name');
    if (usernameEl) usernameEl.textContent = sessionStorage.getItem('user-email');
}