export function enableSearch(searchInputEl, table) {
    let debounceTimer;
    searchInputEl.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const searchTerm = e.target.value;
            if (searchTerm) {
                table.setFilter((data) => {
                    return Object.values(data).some(value =>
                        String(value).toLowerCase().includes(searchTerm.toLowerCase())
                    );
                });
            } else {
                table.clearFilter();
            }
        }, 300);
    });
}