/**
 * Module to fetch and combine data from multiple JSON sources
 * for different tables.
 */

async function fetchJson(path) {
  const response = await fetch(path);
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
    observatoriesSensors,
    latestObservations,
    dailyMinVoltage,
    noPcktDays,
    wetnessAnomalies,
    misreads,
  ] = await Promise.all([
    fetchJson('/observatories.json'),
    fetchJson('/sensors.json'),
    fetchJson('/observatories_sensors.json'),
    fetchJson('/latest_observation.json'),
    fetchJson('/daily_min_voltage.json'),
    fetchJson('/no_pckt_days.json'),
    fetchJson('/wetness_anomalies.json'),
    fetchJson('/misreads.json'),
  ]);

  // Create lookup maps for efficient joining
  const sensorMap = new Map(sensors.map(s => [s.sid, s]));
  const obsSensorMap = new Map(observatoriesSensors.map(os => [os.oid, os.sid]));
  const latestObsMap = new Map(latestObservations.map(lo => [lo.oid, lo.dt_time]));
  const voltageMap = new Map(dailyMinVoltage.map(v => [v.sid, v.minV_01]));
  const noPcktMap = new Map(noPcktDays.map(np => [np.oid, np.days]));
  const misreadsMap = new Map(misreads.map(m => [m.oid, m]));  const wetnessMap = new Map(wetnessAnomalies.map(w => [w.oid, w.wet]));

  // Combine data for each observatory
  return observatories.map(obs => {
    const sid = obsSensorMap.get(obs.oid);
    const sensor = sid ? sensorMap.get(sid) : null;
    const latestDt = latestObsMap.get(obs.oid);

    return {
      id: obs.oid,
      name: obs.name,
      nwsli: obs.NWSLI,
      status: sensor?.status ?? '',
      sensor: sid ?? '',
      river: obs.river,
      town: obs.town,
      gps: `${obs.lat}, ${obs.lng}`,
      rate: sensor?.sampling_rate ?? '',
      voltage: sid ? voltageMap.get(sid) ?? '' : '',
      firmware: sensor?.firmware_version ?? '',
      date: latestDt ? new Date(latestDt).toLocaleString() : '',
      no_pckt_days: noPcktMap.get(obs.oid) ?? '',
      wet: wetnessMap.get(obs.oid) ?? '',
      misreads: misreadsMap.has(obs.oid)
        ? `${misreadsMap.get(obs.oid).percent}/${misreadsMap.get(obs.oid).last_read}`
        : '',
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
  const sensors = await fetchJson('/sensors.json');

  return sensors.map(sensor => ({
    sid: sensor.sid,
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
  const [
    tickets,
    observatories,
    observatoriesSensors,
    sensors,
    users,
  ] = await Promise.all([
    fetchJson('/tickets.json'),
    fetchJson('/observatories.json'),
    fetchJson('/observatories_sensors.json'),
    fetchJson('/sensors.json'),
    fetchJson('/users.json'),
  ]);

  // Create lookup maps for efficient joining
  const obsMap = new Map(observatories.map(o => [o.oid, o.name]));
  const obsSensorMap = new Map(observatoriesSensors.map(os => [os.oid, os.sid]));
  const userMap = new Map(users.map(u => [u.uid, u.fullname]));
  const sensorMap = new Map(sensors.map(s => [s.sid, s.status]));

  return tickets.map(ticket => {
    const sid = obsSensorMap.get(ticket.oid);
    return {
      tid: ticket.tid,
      bridge: obsMap.get(ticket.oid) ?? '',
      sensor: sid ?? '',
      status: sid ? sensorMap.get(sid) ?? '' : '',
      createdAt: ticket.created_at
        ? new Date(ticket.created_at).toLocaleDateString()
        : '',
      createdBy: userMap.get(ticket.created_by) ?? '',
      assignedTo: userMap.get(ticket.assigned_to) ?? '',
      problem: ticket.problem ?? '',
    };
  });
}

export async function getObservatoryData(id) {
    return fetchJson(`/observatories/${id}.json`);
}

export async function getSensorOptions() {
    const res = await fetch('/hints.json');
    const data = await res.json();
    return ['', ...data.sensors];
}