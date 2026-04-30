import { table } from "./table.js"

let filterState = {};
let searchTerm = '';
let currentFilters = {};

export const SHOW_ALL = 'Show All';

export function resetFilterState(filters) {
    for (const key of Object.keys(filterState)) delete filterState[key];

    for (const [key] of Object.entries(filters)) {
        // Default: only "Show All" is selected
        filterState[key] = [SHOW_ALL];
    }

    currentFilters = filters;
    searchTerm = '';
}

export function toggleFilterOption(category, value, checked) {
    if (checked) {
        if (value === SHOW_ALL) {
            // Selecting Show All clears everything else
            filterState[category] = [SHOW_ALL];
        } else {
            // Selecting any other option removes Show All
            filterState[category] = filterState[category].filter(v => v !== SHOW_ALL);
            filterState[category].push(value);
        }
    } else {
        filterState[category] = filterState[category].filter(v => v !== value);
    }
    syncCheckboxDisabledState(category);
}

/**
 * Greys out / re-enables sibling checkboxes within a single filter category
 * based on whether "Show All" is currently selected.
 */
function syncCheckboxDisabledState(category) {
    const showAllChecked = filterState[category].includes(SHOW_ALL);
    const checkboxes = document.querySelectorAll(
        `input[type="checkbox"][data-filter-category="${category}"]`
    );
    checkboxes.forEach(cb => {
        if (cb.value === SHOW_ALL) return;
        cb.disabled = showAllChecked;
        if (showAllChecked) cb.checked = false;   // <-- new line
        const label = cb.closest('label');
        if (label) label.classList.toggle('filter-option-disabled', showAllChecked);
    });
}

/**
 * Call this once after the filter UI is rendered to set initial disabled states.
 */
export function syncAllCheckboxDisabledStates() {
    for (const category of Object.keys(currentFilters)) {
        syncCheckboxDisabledState(category);
    }
}

export function enableSearch(oldSearchInputEl) {
    let debounceTimer;
    const searchInputEl = oldSearchInputEl.cloneNode(true);
    oldSearchInputEl.replaceWith(searchInputEl);
    searchInputEl.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            searchTerm = e.target.value;
            applyFilters();
        }, 300);
    });
}

export function applyFilters() {
    table.setFilter(buildFilterFunc());
}

function buildFilterFunc() {
    return function (data) {
        // Checkbox filters
        for (const [key, filter] of Object.entries(currentFilters)) {
            const selected = filterState[key];

            // Show All: skip this category entirely
            if (selected && selected.includes(SHOW_ALL)) continue;

            // Nothing selected: hide all rows for this category
            if (!selected || selected.length === 0) return false;

            if (key === 'tools') {
                if (!matchesToolFilter(data, selected)) return false;
                continue;
            }

            const value = data[key];
            if (filter.type === 'range') {
                if (value == null || value === '') return false;
                if (!selected.some(r => matchesRange(value, r))) return false;
            } else {
                if (!selected.includes(String(value ?? ''))) return false;
            }
        }

        // Search filter
        if (searchTerm) {
            const matches = Object.values(data).some(value =>
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            );
            if (!matches) return false;
        }

        return true;
    };
}

function matchesToolFilter(data, selectedTools) {
    for (const tool of selectedTools) {
        if (tool === 'Ticket' && data.tickets && data.tickets.length > 0) return true;
        if (tool === 'Public Note' && data.public_note != null) return true;
    }
    return false;
}

function parseRange(rangeStr) {
    if (rangeStr.startsWith('< '))  return { type: 'lt', val: parseFloat(rangeStr.slice(2)) };
    if (rangeStr.startsWith('> '))  return { type: 'gt', val: parseFloat(rangeStr.slice(2)) };
    const parts = rangeStr.split(' - ');
    if (parts.length === 2) return { type: 'between', lo: parseFloat(parts[0]), hi: parseFloat(parts[1]) };
    return null;
}

function matchesRange(value, rangeStr) {
    const r = parseRange(rangeStr);
    if (!r) return false;
    if (r.type === 'lt')      return value < r.val;
    if (r.type === 'gt')      return value >= r.val;
    if (r.type === 'between') return value >= r.lo && value <= r.hi;
    return false;
}