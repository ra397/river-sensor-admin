import Plotly from 'plotly.js-dist-min';
import {getReportData} from './api.js';

const plotlyContainerEl = document.querySelector('#plotly-container');
const plotlyCloseBtn = plotlyContainerEl.querySelector('.modal-close');

function showPlotly() {
    plotlyContainerEl.classList.add('open');
}

function hidePlotly() {
    plotlyContainerEl.classList.remove('open');
}

plotlyCloseBtn.addEventListener('click', hidePlotly);

plotlyContainerEl.addEventListener('click', (e) => {
    if (e.target === plotlyContainerEl) {
        hidePlotly();
    }
});

function getDateRange() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    const format = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    };

    return { startDate: format(startDate), endDate: format(endDate) };
}

const PLOT_CONFIG = {
    'packet-count': {
        title: 'Packet Count',
        yaxis: 'Count',
        traces: [
            { key: 'pkt_cnt', xKey: 'dt', name: 'Packet Count', mode: 'markers', color: 'blue' }
        ]
    },
    'battery': {
        title: 'Battery',
        yaxis: 'Voltage (V)',
        traces: [
            { key: 'avg', xKey: 'dt', name: 'Average', mode: 'lines+markers', color: 'blue' },
            { key: 'max', xKey: 'dt', name: 'Max', mode: 'lines+markers', color: 'green', },
            { key: 'min', xKey: 'dt', name: 'Min', mode: 'lines+markers', color: 'red' }
        ]
    },
    'measurements': {
        title: 'Measurements',
        yaxis: 'Value',
        traces: [
            { key: 'primary', xKey: 'validtime', name: 'Primary', mode: 'markers', color: 'blue' }
        ]
    },
    'moisture': {
        title: 'Moisture',
        yaxis: 'Moisture (%)',
        traces: [
            { key: 'avg', xKey: 'dt', name: 'Average', mode: 'lines+markers', color: 'blue' },
            { key: 'max', xKey: 'dt', name: 'Max', mode: 'lines+markers', color: 'green' },
            { key: 'min', xKey: 'dt', name: 'Min', mode: 'lines+markers', color: 'red' }
        ]
    }
};

function buildPlotlyBody() {
    const container = document.querySelector('.plotly-body');
    container.innerHTML = '';
    for (const id of Object.keys(PLOT_CONFIG)) {
        const div = document.createElement('div');
        div.className = 'plot';
        div.id = id;
        container.appendChild(div);
    }
}


function buildTraces(config, data) {
    return config.traces.map(t => ({
        x: data.map(d => d[t.xKey]),
        y: data.map(d => d[t.key]),
        type: 'scatter',
        mode: t.mode,
        name: t.name,
        line: { color: t.color, ...(t.dash && { dash: t.dash }) }
    }));
}


function buildLayout(config) {
    const now = new Date();
    return {
        shapes: [
            {
                type: 'line',
                x0: now,
                x1: now,
                y0: 0,
                y1: 1,
                yref: 'paper',
                line: {
                    color: 'red',
                    width: 2,
                }
            }
        ],
        title: config.title,
        xaxis: { title: 'Date' },
        yaxis: { title: config.yaxis }
    };
}


export async function showReports(observatoryId) {
    const { startDate, endDate } = getDateRange();

    showPlotly();
    buildPlotlyBody();

    for (const [variable, config] of Object.entries(PLOT_CONFIG)) {
        const data = await getReportData(variable, observatoryId, startDate, endDate);
        Plotly.newPlot(variable, buildTraces(config, data), buildLayout(config), {
            displayModeBar: false,
        });
    }
}