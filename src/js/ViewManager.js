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
export async function renderView(viewKey, tableData) {
    const view = VIEWS[viewKey];
    if (!view) return;

    if (previousView === viewKey) return;
    previousView = viewKey;

    renderNavbar(viewKey);
    renderActionButton(view);

    resetFilterState(view.filters);
    renderFilters(view);

    await renderTable(table, view.columns, tableData);

    table.off('rowDblClick');
    table.off('rowClick');

    if (view.getRowData) {
        table.on('rowDblClick', async (e, row) => {
            const id = row.getData().id;
            const rowData = await view.getRowData(id);
            await openModal(viewKey, 'edit', rowData, id);
        });

        table.on('rowClick', (e, row) => {
            if (viewKey !== 'observatories') return;

            const isSelected = row.isSelected();

            document.querySelectorAll('.graph-icon-btn').forEach(el => {
                el.remove();
            });

            if (isSelected) {
                table.deselectRow(row);
                return;
            }

            table.deselectRow();
            table.selectRow(row);

            const cell = row.getCell('name');
            const el = cell.getElement();

            const graphIcon = `
                <svg class="graph-icon-btn" width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 5V19C4 19.5523 4.44772 20 5 20H19" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M18 9L13 13.9999L10.5 11.4998L7 14.9998" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;

            el.insertAdjacentHTML('beforeend', graphIcon);

            const iconEl = el.querySelector('.graph-icon-btn');

            iconEl.addEventListener('click', (e) => {
                e.stopPropagation();
                showReports(row.getData().id);
            });
        });
    }

    enableSearch(document.getElementById('search-input'));
    renderColumnToggles(view);

    const usernameEl = document.querySelector('#user-name');
    if (usernameEl) usernameEl.textContent = sessionStorage.getItem('user-email');
}