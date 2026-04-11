import {clearToken, getToken, setToken} from "./auth.js";

/**
 * Module to fetch and combine data from multiple JSON sources
 * for different tables.
 */

async function request(method, path, body = null) {
    const headers = {};
    const token = getToken();

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`/hydroiowa/api${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
    });

    const refreshed = response.headers.get('X-New-Token');
    if (refreshed) {
        setToken(refreshed);
    }

    if (response.status === 401) {
        clearToken();
        window.location.reload(); // Forces back to login view
    }

    if (!response.ok) {
        throw new Error(`${method} ${path} failed: ${response.status}`);
    }

    return response.json();
}

/**
 * Fetches all data sources and combines them into a single array
 * suitable for the observatory table.
 *
 * @returns {Promise<Array>} Combined observatory table data
 */
export async function getObservatoryTableData() {
    const [
        observatories,
        sensors,
        latestObservations,
        noPcktDays,
        wetnessAnomalies,
        misreads,
        dailyMinVoltage
    ] = await Promise.all([
        request('GET', '/observatories'),
        request('GET', '/sensors'),
        request('GET', '/packets/latest_observation'),
        request('GET', '/packets/no-packet-days'),
        request('GET', '/packets/wetness-anomalies'),
        request('GET', '/packets/misreads'),
        request('GET', '/packets/daily-min-voltage'),
    ]);

    const sensorMap = new Map(sensors.map(s => [s.sid, s]));
    const latestObsMap = new Map(latestObservations.map(lo => [lo.oid, lo.dt_time]));
    const noPcktMap = new Map(noPcktDays.map(np => [np.oid, np.days]));
    const wetnessMap = new Map(wetnessAnomalies.map(w => [w.oid, w.anomaly_percentage]));
    const misreadMap = new Map(misreads.map(m => [m.oid, m]));
    const voltageMap = new Map(dailyMinVoltage.map(v => [v.sid, v.minV_14]));

    return observatories.map(obs => {
        const sensor = sensorMap.get(obs.sid);
        const latestDt = latestObsMap.get(obs.oid);
        const misread = misreadMap.get(obs.oid);

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
        };
    });
}

/**
 * Fetches all data sources and combines them into a single array
 * suitable for the sensor table.
 *
 * @returns {Promise<Array>} Combined sensor table data
 */
export async function getSensorTableData() {
    const sensors = await request('GET', '/sensors');

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

/**
 * Fetches all data sources and combines them into a single array
 * suitable for the ticket table.
 *
 * @returns {Promise<Array>} Combined ticket table data
 */
export async function getTicketTableData() {
    const tickets = await request('GET', '/tickets');

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
    return request('GET', `/tickets/${id}`);
}
export async function getObservatoryData(id) {
    return request('GET', `/observatories/${id}`);
}

export async function getSensorData(id) {
    return request('GET', `/sensors/${id}`);
}

export async function getSensorOptions(rowData) {
    const sensors = await request('GET', '/unused-sensors');

    const currentSensor = rowData?.sid;
    if (currentSensor) {
        return [currentSensor, '', ...sensors];
    }

    return ['', ...sensors];
}

export async function getMaintenanceCrew() {
    const crew = await request('GET', '/users/role/maintenance');
    return crew.map(item => item.fullname);
}

export async function createNewObservatory(data) {
    return request('POST', `/observatories`, data);
}

export async function editObservatory(id, data) {
    return request('PUT', `/observatories/${id}`, data);
}

export async function createNewSensor(data) {
    return request('POST', `/sensors`, data);
}

export async function editSensor(id, data) {
    return request('PUT', `/sensors/${id}`, data);
}

export async function createNewTicket(data) {
    return request('POST', `/tickets`, data);
}

export async function editTicket(id, data) {
    return request('PUT', `/tickets/${id}`, data);
}