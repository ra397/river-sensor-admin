import { clearToken, getToken, setToken } from './auth.js';
import apiConfig from './api-config.json';

const baseUrl = apiConfig[apiConfig.mode];

function buildUrl(endpoint, pathParams = {}, queryParams = {}) {
    let path = endpoint;

    for (const [key, value] of Object.entries(pathParams)) {
        path = path.replace(`:${key}`, encodeURIComponent(value));
    }

    const query = new URLSearchParams(queryParams).toString();
    return `${baseUrl}${path}${query ? `?${query}` : ''}`;
}

async function request(name, { pathParams = {}, queryParams = {}, body = null } = {}) {
    const config = apiConfig.requests[name];
    if (!config) {
        throw new Error(`Unknown request: ${name}`);
    }

    const headers = {};
    const token = getToken();

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
        headers['Content-Type'] = 'application/json';
    }

    const url = buildUrl(config.endpoint, pathParams, queryParams);

    const response = await fetch(url, {
        method: config.method,
        headers,
        body: body ? JSON.stringify(body) : null,
    });

    const refreshed = response.headers.get('X-New-Token');
    if (refreshed) {
        setToken(refreshed);
    }

    if (response.status === 401) {
        clearToken();
        window.location.reload();
    }

    if (!response.ok) {
        throw new Error(`${name} failed: ${response.status}`);
    }

    return response.json();
}

export async function getObservatoryTableData() {
    const [
        observatories,
        sensors,
        latestObservations,
        noPcktDays,
        wetnessAnomalies,
        misreads,
        dailyMinVoltage,
        tickets,
    ] = await Promise.all([
        request('observatories'),
        request('sensors'),
        request('latest_observation'),
        request('no_packet_days'),
        request('wetness_anomalies'),
        request('misreads'),
        request('daily_min_voltage'),
        request('tickets'),
    ]);

    const sensorMap    = new Map(sensors.map(s => [s.sid, s]));
    const latestObsMap = new Map(latestObservations.map(lo => [lo.oid, lo.dt_time]));
    const noPcktMap    = new Map(noPcktDays.map(np => [np.oid, np.days]));
    const wetnessMap   = new Map(wetnessAnomalies.map(w => [w.oid, w.anomaly_percentage]));
    const misreadMap   = new Map(misreads.map(m => [m.oid, m]));
    const voltageMap   = new Map(dailyMinVoltage.map(v => [v.sid, v.minV_14]));

    const ticketsMap = new Map();
    for (const ticket of tickets) {
        if (!ticketsMap.has(ticket.observatory)) {
            ticketsMap.set(ticket.observatory, []);
        }
        ticketsMap.get(ticket.observatory).push(ticket);
    }

    return observatories.map(obs => {
        const sensor   = sensorMap.get(obs.sid);
        const latestDt = latestObsMap.get(obs.oid);
        const misread  = misreadMap.get(obs.oid);

        return {
            id: obs.oid,
            name: obs.name,
            nwsli: obs.nwsli,
            status: obs.status,
            sensor: obs.sid,
            river: obs.river,
            town: obs.town,
            gps: `${obs.latitude}, ${obs.longitude}`,
            rate: sensor?.sampling_rate ?? '',
            firmware: sensor?.firmware_version ?? '',
            date: latestDt ? new Date(latestDt).toLocaleString() : '',
            no_pckt_days: noPcktMap.get(obs.oid) ?? '',
            wet: wetnessMap.get(obs.oid) ?? '',
            misread: misread ? `${misread.percent}/${misread.lastRead}` : '',
            voltage: obs.sid ? voltageMap.get(obs.sid) ?? '' : '',
            public_note: obs.public_note ?? null,
            tickets: ticketsMap.get(obs.name) ?? [],
        };
    });
}

export async function getSensorTableData() {
    const sensors = await request('sensors');

    return sensors.map(sensor => ({
        id: sensor.sid,
        status: sensor.status,
        firmware: sensor.firmware_version ?? '',
        imei: sensor.imei ?? '',
        rate: sensor.sampling_rate ?? '',
        creationDate: sensor.creation_date
            ? new Date(sensor.creation_date).toLocaleDateString()
            : '',
        retirementDate: sensor.retirement_date
            ? new Date(sensor.retirement_date).toLocaleDateString()
            : '',
    }));
}

export async function getTicketTableData() {
    const tickets = await request('tickets');

    return tickets.map(ticket => ({
        id: ticket.ticket_id,
        bridge: ticket.observatory ?? '',
        sensor: ticket.sensor_id ?? '',
        status: ticket.status,
        createdAt: ticket.created_at
            ? new Date(ticket.created_at).toLocaleDateString()
            : '',
        createdBy: ticket.created_by ?? '',
        assignedTo: ticket.assignee ?? '',
        problem: ticket.problem ?? '',
    }));
}

export async function getTicketData(id) {
    return request('ticket', { pathParams: { id } });
}

export async function getObservatoryData(id) {
    return request('observatory', { pathParams: { id } });
}

export async function getSensorData(id) {
    return request('sensor', { pathParams: { id } });
}

export async function getSensorOptions(rowData) {
    const sensors = await request('unused_sensors');

    const currentSensor = rowData?.sid;
    if (currentSensor) {
        return [currentSensor, '', ...sensors];
    }

    return ['', ...sensors];
}

export async function getMaintenanceCrew() {
    const crew = await request('maintenance_crew');
    return crew.map(item => item.fullname);
}

export async function createNewObservatory(data) {
    return request('create_observatory', { body: data });
}

export async function editObservatory(id, data) {
    return request('edit_observatory', { pathParams: { id }, body: data });
}

export async function createNewSensor(data) {
    return request('create_sensor', { body: data });
}

export async function editSensor(id, data) {
    return request('edit_sensor', { pathParams: { id }, body: data });
}

export async function createNewTicket(data) {
    return request('create_ticket', { body: data });
}

export async function editTicket(id, data) {
    return request('edit_ticket', { pathParams: { id }, body: data });
}

export async function getReportData(variable, observatoryId, startDate, endDate) {
    return request('report', {
        pathParams: { variable, observatoryId },
        queryParams: { bdt: startDate, edt: endDate },
    });
}

export async function changeSamplingRates(sensorIds, samplingRate) {
    return request('change_sampling_rates', {
        body: {
            sensor_ids: sensorIds,
            sampling_rate: samplingRate,
        },
    });
}

export async function getUsersTableData() {
    const users = await request('users');

    return users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.fullname ?? '',
    }));
}

export async function createUser(data) {
    return request('create_user', { body: data });
}

export async function getUserData(id) {
    const users = await request('users');
    return users.find(user => user.id === id);
}

export async function updateUserPermissions(id, permissions) {
    return request('update_user_permissions', { pathParams: { id }, body: permissions });
}