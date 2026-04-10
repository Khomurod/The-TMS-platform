/**
 * Mock API — Auth endpoints for local testing without a backend.
 * Users:
 *   1. superadmin@safehaul.test / SuperAdmin1!  (super_admin)
 *   2. admin@wenzetrucking.com  / WenzeAdmin1!  (company_admin)
 */
import { NextRequest, NextResponse } from 'next/server';

const USERS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'superadmin@safehaul.test',
    password: 'SuperAdmin1!',
    first_name: 'Super',
    last_name: 'Admin',
    role: 'super_admin',
    company_id: null,
    company_name: null,
    is_active: true,
    last_login_at: new Date().toISOString(),
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'admin@wenzetrucking.com',
    password: 'WenzeAdmin1!',
    first_name: 'James',
    last_name: 'Wenze',
    role: 'company_admin',
    company_id: '00000000-0000-0000-0000-000000000010',
    company_name: 'Wenze Trucking LLC',
    is_active: true,
    last_login_at: new Date().toISOString(),
    created_at: '2024-01-15T00:00:00Z',
  },
];

function findUser(email: string, password: string) {
  return USERS.find((u) => u.email === email && u.password === password);
}

function makeToken(user: typeof USERS[0]) {
  // Simple base64 token for mock (not cryptographic)
  return Buffer.from(JSON.stringify({ sub: user.id, role: user.role, company_id: user.company_id })).toString('base64');
}

function getUserFromToken(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), 'base64').toString());
    return USERS.find((u) => u.id === payload.sub) ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/mock', '');
  const body = await req.json().catch(() => ({}));

  // POST /auth/login
  if (path === '/auth/login') {
    const user = findUser(body.email, body.password);
    if (!user) return NextResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
    return NextResponse.json({
      access_token: makeToken(user),
      refresh_token: makeToken(user),
      token_type: 'bearer',
    });
  }

  // POST /auth/refresh
  if (path === '/auth/refresh') {
    const user = getUserFromToken(req);
    if (!user) return NextResponse.json({ detail: 'Invalid token' }, { status: 401 });
    return NextResponse.json({
      access_token: makeToken(user),
      token_type: 'bearer',
    });
  }

  // POST /auth/logout
  if (path === '/auth/logout') {
    return NextResponse.json({ message: 'Logged out' });
  }

  // POST /accounting/settlements/generate
  if (path === '/accounting/settlements/generate') {
    return NextResponse.json({
      id: 'st-new', settlement_number: 'S-2024-091', status: 'draft',
      driver_name: 'Mike Johnson', period_start: body.period_start, period_end: body.period_end,
      gross_pay: 3200, net_pay: 2880, load_count: 2,
    });
  }

  // POST /loads/{id}/status
  if (path.match(/^\/loads\/[^/]+\/status$/)) {
    return NextResponse.json({ message: 'Status advanced' });
  }

  // POST /loads
  if (path === '/loads') {
    return NextResponse.json({ id: 'l-new', load_number: 'LD-1027', status: 'offer', ...body });
  }

  // POST /brokers
  if (path === '/brokers') {
    return NextResponse.json({ id: 'b-new', ...body, is_active: true, created_at: new Date().toISOString() });
  }

  // POST /drivers
  if (path === '/drivers') {
    return NextResponse.json({ id: 'd-new', ...body, status: 'active', is_active: true, created_at: new Date().toISOString() });
  }

  // POST /fleet/trucks or /fleet/trailers
  if (path === '/fleet/trucks') {
    return NextResponse.json({ id: 'tk-new', ...body, status: 'available', is_active: true });
  }
  if (path === '/fleet/trailers') {
    return NextResponse.json({ id: 'tl-new', ...body, status: 'available', is_active: true });
  }

  // POST /settings/users
  if (path === '/settings/users') {
    return NextResponse.json({ id: 'u-new', ...body, is_active: true, created_at: new Date().toISOString() });
  }

  // POST /admin/companies
  if (path === '/admin/companies') {
    return NextResponse.json({ id: 'c-new', name: body.company_name, is_active: true });
  }

  // POST /admin/impersonate/{id}
  if (path.match(/^\/admin\/impersonate\/[^/]+$/)) {
    return NextResponse.json({ access_token: makeToken(USERS[1]), token_type: 'bearer' });
  }

  return NextResponse.json({ detail: 'Not found' }, { status: 404 });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api/mock', '');
  const user = getUserFromToken(req);

  // GET /auth/me
  if (path === '/auth/me') {
    if (!user) return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    const safe = { ...user };
    delete (safe as Record<string, unknown>).password;
    return NextResponse.json(safe);
  }

  // GET /dashboard/kpis
  if (path === '/dashboard/kpis') {
    return NextResponse.json({
      gross_revenue: 125750.00,
      avg_rpm: 2.85,
      active_loads: 12,
      fleet_efficiency: 87.5,
      revenue_trend: 8.2,
      rpm_trend: -1.5,
      loads_trend: 15.0,
      efficiency_trend: 3.0,
    });
  }

  // GET /dashboard/fleet-status
  if (path === '/dashboard/fleet-status') {
    return NextResponse.json({
      available: 8, in_use: 12, maintenance: 3, out_of_service: 1,
    });
  }

  // GET /dashboard/compliance-alerts
  if (path === '/dashboard/compliance-alerts') {
    return NextResponse.json({
      items: [],
      alerts: [],
      critical_count: 0,
      total: 0,
    });
  }

  // GET /dashboard/recent-events
  if (path === '/dashboard/recent-events') {
    return NextResponse.json({
      items: [
        { id: '1', event_type: 'load_delivered', description: 'Load #1024 delivered to Chicago, IL', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', event_type: 'driver_dispatched', description: 'Mike Johnson dispatched on Load #1025', timestamp: new Date(Date.now() - 7200000).toISOString() },
        { id: '3', event_type: 'settlement_posted', description: 'Settlement #S-2024-089 posted ($4,250)', timestamp: new Date(Date.now() - 10800000).toISOString() },
      ],
    });
  }

  // GET /loads (live/upcoming/completed)
  if (path === '/loads' || path === '/loads/live' || path === '/loads/upcoming' || path === '/loads/completed') {
    const loads = [
      { id: 'l1', load_number: 'LD-1024', status: 'in_transit', pickup_city: 'Dallas, TX', delivery_city: 'Chicago, IL', pickup_date: '2026-04-05', delivery_date: '2026-04-08', driver_name: 'Mike Johnson', base_rate: 3200, total_rate: 3450 },
      { id: 'l2', load_number: 'LD-1025', status: 'dispatched', pickup_city: 'Houston, TX', delivery_city: 'Atlanta, GA', pickup_date: '2026-04-07', delivery_date: '2026-04-09', driver_name: 'Sarah Williams', base_rate: 2800, total_rate: 2950 },
      { id: 'l3', load_number: 'LD-1026', status: 'booked', pickup_city: 'Los Angeles, CA', delivery_city: 'Phoenix, AZ', pickup_date: '2026-04-10', delivery_date: '2026-04-11', driver_name: null, base_rate: 1800, total_rate: 1800 },
      { id: 'l4', load_number: 'LD-1023', status: 'delivered', pickup_city: 'Miami, FL', delivery_city: 'Nashville, TN', pickup_date: '2026-04-01', delivery_date: '2026-04-03', driver_name: 'Tom Davis', base_rate: 2600, total_rate: 2850 },
    ];
    return NextResponse.json({ items: loads, total: loads.length, page: 1, page_size: 20 });
  }

  // GET /loads/{id}
  if (path.match(/^\/loads\/[^/]+$/)) {
    return NextResponse.json({
      id: 'l1', load_number: 'LD-1024', status: 'in_transit', base_rate: 3200, total_rate: 3450, total_miles: 920,
      broker_name: 'ABC Logistics', broker_load_id: 'BRK-8892', shipment_id: 'SHP-44210', contact_agent: 'John Broker',
      is_locked: false, notes: 'Partial truckload — fragile cargo', created_at: '2026-04-04T10:00:00Z', updated_at: '2026-04-07T14:30:00Z',
      stops: [
        { id: 's1', stop_type: 'pickup', stop_sequence: 1, facility_name: 'Dallas Distribution Center', city: 'Dallas', state: 'TX', address: '1200 Commerce St', zip_code: '75201', scheduled_date: '2026-04-05', arrival_date: '2026-04-05', departure_date: '2026-04-05', notes: null },
        { id: 's2', stop_type: 'delivery', stop_sequence: 2, facility_name: 'Chicago Warehouse', city: 'Chicago', state: 'IL', address: '500 W Madison St', zip_code: '60661', scheduled_date: '2026-04-08', arrival_date: null, departure_date: null, notes: 'Dock 7' },
      ],
      trips: [
        { id: 't1', trip_number: 'TR-1024-1', status: 'in_transit', sequence_number: 1, driver_name: 'Mike Johnson', truck_number: 'TK-101', loaded_miles: 920, driver_gross: 1380 },
      ],
      accessorials: [
        { id: 'a1', type: 'detention', amount: 150, description: 'Pickup detention 2hr' },
        { id: 'a2', type: 'lumper', amount: 100, description: 'Lumper at delivery' },
      ],
    });
  }

  // GET /drivers
  if (path === '/drivers') {
    const drivers = [
      { id: 'd1', first_name: 'Mike', last_name: 'Johnson', status: 'active', employment_type: 'company', phone: '(555) 123-4567', cdl_expiry: '2027-03-15', medical_expiry: '2026-09-30', pay_rate: 0.55, pay_type: 'per_mile' },
      { id: 'd2', first_name: 'Sarah', last_name: 'Williams', status: 'active', employment_type: 'owner_operator', phone: '(555) 987-6543', cdl_expiry: '2026-11-20', medical_expiry: '2026-04-10', pay_rate: 0.70, pay_type: 'per_mile' },
      { id: 'd3', first_name: 'Tom', last_name: 'Davis', status: 'on_leave', employment_type: 'company', phone: '(555) 456-7890', cdl_expiry: '2027-06-01', medical_expiry: '2027-01-15', pay_rate: 1200, pay_type: 'weekly' },
    ];
    return NextResponse.json({ items: drivers, total: drivers.length, page: 1, page_size: 20 });
  }

  // GET /drivers/{id}
  if (path.match(/^\/drivers\/[^/]+$/)) {
    return NextResponse.json({
      id: 'd1', first_name: 'Mike', last_name: 'Johnson', status: 'active', employment_type: 'company',
      phone: '(555) 123-4567', email: 'mike.j@wenzetrucking.com',
      cdl_number: 'CDL-TX-123456', cdl_state: 'TX', cdl_expiry: '2027-03-15',
      medical_card_expiry: '2026-09-30', pay_rate: 0.55, pay_type: 'per_mile',
      address: '1234 Elm St, Dallas, TX 75201', emergency_contact: 'Jane Johnson (555) 111-2222',
      hire_date: '2023-06-15', date_of_birth: '1985-01-20',
      created_at: '2023-06-15T00:00:00Z', updated_at: '2026-04-01T00:00:00Z',
    });
  }

  // GET /fleet/trucks
  if (path === '/fleet/trucks') {
    const trucks = [
      { id: 'tk1', unit_number: 'TK-101', year: 2022, make: 'Freightliner', model: 'Cascadia', vin: '3AKJHHDR5NSLA1234', license_plate: 'TX-8843', ownership_type: 'owned', dot_inspection_expiry: '2026-08-15', status: 'in_use', is_active: true },
      { id: 'tk2', unit_number: 'TK-102', year: 2021, make: 'Kenworth', model: 'T680', vin: '1XKYD49X0MJ4567', license_plate: 'TX-9912', ownership_type: 'leased', dot_inspection_expiry: '2026-04-20', status: 'available', is_active: true },
      { id: 'tk3', unit_number: 'TK-103', year: 2023, make: 'Peterbilt', model: '579', vin: '1NPXGG0X24D7890', license_plate: 'TX-1105', ownership_type: 'owned', dot_inspection_expiry: '2026-12-01', status: 'maintenance', is_active: true },
    ];
    return NextResponse.json({ items: trucks, total: trucks.length, page: 1, page_size: 20 });
  }

  // GET /fleet/trailers
  if (path === '/fleet/trailers') {
    const trailers = [
      { id: 'tl1', unit_number: 'TL-201', year: 2020, make: 'Great Dane', model: 'Champion', trailer_type: 'dry_van', ownership_type: 'owned', dot_inspection_expiry: '2026-07-10', status: 'in_use', is_active: true },
      { id: 'tl2', unit_number: 'TL-202', year: 2019, make: 'Wabash', model: 'DuraPlate', trailer_type: 'reefer', ownership_type: 'leased', dot_inspection_expiry: '2026-05-01', status: 'available', is_active: true },
    ];
    return NextResponse.json({ items: trailers, total: trailers.length, page: 1, page_size: 20 });
  }

  // GET /fleet/trucks/{id} or /fleet/trailers/{id}
  if (path.match(/^\/fleet\/trucks\/[^/]+$/)) {
    return NextResponse.json({
      id: 'tk1', unit_number: 'TK-101', year: 2022, make: 'Freightliner', model: 'Cascadia',
      vin: '3AKJHHDR5NSLA1234', license_plate: 'TX-8843', ownership_type: 'owned',
      dot_inspection_date: '2025-08-15', dot_inspection_expiry: '2026-08-15',
      status: 'in_use', is_active: true,
      created_at: '2023-01-10T00:00:00Z', updated_at: '2026-03-20T00:00:00Z',
    });
  }
  if (path.match(/^\/fleet\/trailers\/[^/]+$/)) {
    return NextResponse.json({
      id: 'tl1', unit_number: 'TL-201', year: 2020, make: 'Great Dane', model: 'Champion',
      vin: '1JJV532D6KL012345', license_plate: 'TX-3301', trailer_type: 'dry_van', ownership_type: 'owned',
      dot_inspection_date: '2025-07-10', dot_inspection_expiry: '2026-07-10',
      status: 'in_use', is_active: true,
      created_at: '2022-06-01T00:00:00Z', updated_at: '2026-02-15T00:00:00Z',
    });
  }

  // GET /settlements or /accounting/settlements
  if (path === '/settlements' || path === '/accounting/settlements') {
    const settlements = [
      { id: 'st1', settlement_number: 'S-2024-089', status: 'posted', driver_name: 'Mike Johnson', period_start: '2026-03-25', period_end: '2026-03-31', load_count: 4, gross_pay: 4250, net_pay: 3820 },
      { id: 'st2', settlement_number: 'S-2024-090', status: 'draft', driver_name: 'Sarah Williams', period_start: '2026-03-25', period_end: '2026-03-31', load_count: 3, gross_pay: 5100, net_pay: 4590 },
    ];
    return NextResponse.json({ items: settlements, total: settlements.length, page: 1, page_size: 20 });
  }

  // GET /settlements/{id} or /accounting/settlements/{id}
  if (path.match(/^\/(settlements|accounting\/settlements)\/[^/]+$/)) {
    return NextResponse.json({
      id: 'st1', settlement_number: 'S-2024-089', status: 'posted',
      driver_name: 'Mike Johnson', driver_id: 'd1',
      period_start: '2026-03-25', period_end: '2026-03-31',
      gross_pay: 4250, accessorial_total: 350, deduction_total: 430, net_pay: 3820,
      line_items: [
        { id: 'li1', category: 'trip_pay', description: 'LD-1020 Dallas→Chicago (920mi)', amount: 1380 },
        { id: 'li2', category: 'trip_pay', description: 'LD-1021 Chicago→Nashville (470mi)', amount: 940 },
        { id: 'li3', category: 'trip_pay', description: 'LD-1022 Nashville→Atlanta (250mi)', amount: 500 },
        { id: 'li4', category: 'trip_pay', description: 'LD-1023 Atlanta→Miami (660mi)', amount: 1080 },
        { id: 'li5', category: 'accessorial', description: 'Detention (LD-1020)', amount: 150 },
        { id: 'li6', category: 'accessorial', description: 'Lumper (LD-1023)', amount: 200 },
        { id: 'li7', category: 'deduction', description: 'Fuel advance', amount: -250 },
        { id: 'li8', category: 'deduction', description: 'Insurance premium', amount: -180 },
      ],
      created_at: '2026-04-01T10:00:00Z', posted_at: '2026-04-02T14:00:00Z', paid_at: null,
    });
  }

  // GET /settings/company
  if (path === '/settings/company') {
    return NextResponse.json({
      id: '00000000-0000-0000-0000-000000000010', name: 'Wenze Trucking LLC',
      mc_number: 'MC-123456', dot_number: 'DOT-789012',
      address: '4500 Commerce St, Dallas, TX 75226', phone: '(214) 555-0100',
      email: 'dispatch@wenzetrucking.com', is_active: true, created_at: '2024-01-15T00:00:00Z',
    });
  }

  // GET /settings/users
  if (path === '/settings/users') {
    const users = USERS.filter((u) => u.company_id === '00000000-0000-0000-0000-000000000010').map((u) => {
      const safe = { ...u };
      delete (safe as Record<string, unknown>).password;
      return safe;
    });
    return NextResponse.json({ items: users, total: users.length });
  }

  // GET /brokers
  if (path === '/brokers' || path === '/brokers/search') {
    const brokers = [
      { id: 'b1', name: 'ABC Logistics', mc_number: 'MC-445566', contact_name: 'John Smith', contact_phone: '(555) 222-3333', contact_email: 'john@abclogistics.com', billing_address: '100 Main St, Dallas, TX', is_active: true, created_at: '2024-02-01T00:00:00Z', updated_at: '2026-03-15T00:00:00Z' },
      { id: 'b2', name: 'FastFreight Inc', mc_number: 'MC-778899', contact_name: 'Lisa Chen', contact_phone: '(555) 444-5555', contact_email: 'lisa@fastfreight.com', billing_address: '200 Oak Ave, Houston, TX', is_active: true, created_at: '2024-03-10T00:00:00Z', updated_at: '2026-03-20T00:00:00Z' },
    ];
    return NextResponse.json({ items: brokers, total: brokers.length, page: 1, page_size: 20 });
  }

  // GET /admin/companies
  if (path === '/admin/companies') {
    return NextResponse.json([
      { id: '00000000-0000-0000-0000-000000000010', name: 'Wenze Trucking LLC', mc_number: 'MC-123456', dot_number: 'DOT-789012', is_active: true },
      { id: '00000000-0000-0000-0000-000000000020', name: 'Summit Freight Co', mc_number: 'MC-998877', dot_number: 'DOT-665544', is_active: true },
    ]);
  }

  // GET /drivers/{id}/compliance
  if (path.match(/^\/drivers\/[^/]+\/compliance$/)) {
    return NextResponse.json({ compliant: true, issues: [] });
  }

  // Available resources for dispatch
  if (path === '/dispatch/available-drivers') return NextResponse.json([{ id: 'd1', name: 'Mike Johnson' }, { id: 'd2', name: 'Sarah Williams' }]);
  if (path === '/dispatch/available-trucks') return NextResponse.json([{ id: 'tk1', unit_number: 'TK-101' }, { id: 'tk2', unit_number: 'TK-102' }]);
  if (path === '/dispatch/available-trailers') return NextResponse.json([{ id: 'tl1', unit_number: 'TL-201' }, { id: 'tl2', unit_number: 'TL-202' }]);

  // GET /accounting/settlements/{id}/pdf — return a stub "PDF" 
  if (path.match(/^\/accounting\/settlements\/[^/]+\/pdf$/)) {
    return new NextResponse('Mock PDF content', {
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="settlement.pdf"' },
    });
  }

  return NextResponse.json({ detail: 'Not found' }, { status: 404 });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function PUT(_req: NextRequest) {
  return NextResponse.json({ message: 'Updated successfully' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function PATCH(_req: NextRequest) {
  return NextResponse.json({ message: 'Updated', is_active: true });
}
