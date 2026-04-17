import Plotly from 'plotly.js-dist-min';
import {getReportData} from './api.js';

const plotlyContainerEl = document.querySelector('#plotly-container');
const plotlyCloseBtn = plotlyContainerEl.querySelector('.modal-close');

export function showPlotly() {
    plotlyContainerEl.classList.add('open');
}

function hidePlotly() {
    plotlyContainerEl.classList.remove('open');
}

plotlyCloseBtn.addEventListener('click', hidePlotly);

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
        ],
        showXAxis: false,
    },
    'battery': {
        title: 'Battery',
        yaxis: 'Voltage (V)',
        traces: [
            { key: 'avg', xKey: 'dt', name: 'Average', mode: 'lines+markers', color: 'blue' },
            { key: 'max', xKey: 'dt', name: 'Max', mode: 'lines+markers', color: 'green', },
            { key: 'min', xKey: 'dt', name: 'Min', mode: 'lines+markers', color: 'red' }
        ],
        showXAxis: false,
    },
    'measurements': {
        title: 'Measurements',
        yaxis: 'Value',
        traces: [
            { key: 'primary', xKey: 'validtime', name: 'Primary', mode: 'markers', color: 'blue' }
        ],
        showXAxis: true,
    },
    'moisture': {
        title: 'Moisture',
        yaxis: 'Moisture (%)',
        traces: [
            { key: 'avg', xKey: 'dt', name: 'Average', mode: 'lines+markers', color: 'blue' },
            { key: 'max', xKey: 'dt', name: 'Max', mode: 'lines+markers', color: 'green' },
            { key: 'min', xKey: 'dt', name: 'Min', mode: 'lines+markers', color: 'red' }
        ],
        showXAxis: true,
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


function buildLayout(config, range, showXAxis = true) {
    const now = new Date();
    return {
        margin: {
            l: 35,  // Left margin (px)
            r: 25,  // Right margin (px)
            b: 25,  // Bottom margin (px)
            t: 25,  // Top margin (px)
            pad: 4  // Padding between the plotting area and the axis lines (px)
        },
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
        xaxis: {
            title: showXAxis ? 'Date' : undefined,
            showticklabels: showXAxis,
            showline: true,
            linecolor: 'black',
            range: range,
            autorange: false,
        },
        yaxis: {
            title: config.yaxis,
            showline: true,
            linecolor: 'black',
        },
        legend: {
            x: 0.01,
            y: 0.99,
            xanchor: 'left',
            yanchor: 'top'
        }
    };
}


export async function updateReports(observatoryId) {
    const { startDate, endDate } = getDateRange();

    buildPlotlyBody();

    for (const [variable, config] of Object.entries(PLOT_CONFIG)) {
        const data = await getReportData(variable, observatoryId, startDate, endDate);
        Plotly.newPlot(variable, buildTraces(config, data), buildLayout(config, [toDateStr(startDate), toDateStr(endDate)], config.showXAxis), {
            displayModeBar: false,
            responsive: true,
        });
    }
}

// From 20260415 -> 2026-04-15
function toDateStr(n) {
    const s = String(n);
    return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
}