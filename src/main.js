import { renderView } from "./js/ViewManager.js";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import {VIEWS} from "./js/ViewConfig.js";

export const table = new Tabulator("#table", {
    layout: "fitDataStretch",
    pagination: true,
    paginationSize: 50,
});

const tableData = await VIEWS['observatories'].getData();
await renderView('observatories', tableData);