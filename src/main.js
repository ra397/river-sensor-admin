import { renderView } from "./js/ViewManager.js";
import { TabulatorFull as Tabulator } from "tabulator-tables";

const table = new Tabulator("#table-container", {
    layout: "fitColumns",
    pagination: true,
    paginationSize: 50,
});
globalThis.table = table;

renderView('observatories');