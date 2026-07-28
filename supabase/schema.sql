-- ==========================================
-- StoreFlow Database Schema for Supabase (PostgreSQL)
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. App Users Table
CREATE TABLE IF NOT EXISTS app_users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('supervisor', 'cajero')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#0ea5e9',
    icon VARCHAR(50) DEFAULT 'Package'
);

-- 3. Brands Table
CREATE TABLE IF NOT EXISTS brands (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(50) UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    brand_id VARCHAR(50) REFERENCES brands(id) ON DELETE SET NULL,
    cost NUMERIC(12, 2) DEFAULT 0,
    price NUMERIC(12, 2) DEFAULT 0,
    stock NUMERIC(12, 2) DEFAULT 0,
    min_stock NUMERIC(12, 2) DEFAULT 5,
    unit VARCHAR(20) DEFAULT 'pza',
    active BOOLEAN DEFAULT true,
    favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    document VARCHAR(50),
    phone VARCHAR(30),
    email VARCHAR(100),
    address TEXT,
    balance NUMERIC(12, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact VARCHAR(100),
    phone VARCHAR(30),
    email VARCHAR(100),
    address TEXT,
    tax_id VARCHAR(50),
    balance NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Purchases & Items Table
CREATE TABLE IF NOT EXISTS purchases (
    id VARCHAR(50) PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    supplier_id VARCHAR(50) REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(150),
    invoice_number VARCHAR(50),
    total NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'recibida', 'cancelada')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_id VARCHAR(50) REFERENCES purchases(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(150),
    quantity NUMERIC(12, 2) DEFAULT 1,
    cost NUMERIC(12, 2) DEFAULT 0,
    subtotal NUMERIC(12, 2) DEFAULT 0
);

-- 8. Sales & Items Table
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(50) PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) DEFAULT 'Público general',
    subtotal NUMERIC(12, 2) DEFAULT 0,
    discount NUMERIC(12, 2) DEFAULT 0,
    tax NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) DEFAULT 0,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('efectivo', 'tarjeta', 'transferencia', 'credito')),
    cash_received NUMERIC(12, 2) DEFAULT 0,
    change NUMERIC(12, 2) DEFAULT 0,
    user_id VARCHAR(50) REFERENCES app_users(id) ON DELETE SET NULL,
    user_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completada' CHECK (status IN ('completada', 'anulada')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sale_id VARCHAR(50) REFERENCES sales(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(150),
    quantity NUMERIC(12, 2) DEFAULT 1,
    price NUMERIC(12, 2) DEFAULT 0,
    discount NUMERIC(12, 2) DEFAULT 0,
    subtotal NUMERIC(12, 2) DEFAULT 0
);

-- 9. Cash Sessions & Movements Table
CREATE TABLE IF NOT EXISTS cash_sessions (
    id VARCHAR(50) PRIMARY KEY,
    opening_amount NUMERIC(12, 2) DEFAULT 0,
    closing_amount NUMERIC(12, 2),
    status VARCHAR(20) DEFAULT 'abierta' CHECK (status IN ('abierta', 'cerrada')),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    user_id VARCHAR(50) REFERENCES app_users(id) ON DELETE SET NULL,
    user_name VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS cash_movements (
    id VARCHAR(50) PRIMARY KEY,
    session_id VARCHAR(50) REFERENCES cash_sessions(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    concept TEXT,
    reference VARCHAR(50),
    details JSONB,
    user_id VARCHAR(50) REFERENCES app_users(id) ON DELETE SET NULL,
    user_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Inventory Adjustments Table
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(150),
    previous_stock NUMERIC(12, 2) DEFAULT 0,
    new_stock NUMERIC(12, 2) DEFAULT 0,
    reason TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('entrada', 'salida', 'ajuste')),
    user_id VARCHAR(50) REFERENCES app_users(id) ON DELETE SET NULL,
    user_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Company Settings Table
CREATE TABLE IF NOT EXISTS company_settings (
    id INT PRIMARY KEY DEFAULT 1,
    name VARCHAR(150) NOT NULL,
    legal_name VARCHAR(150),
    tax_id VARCHAR(50),
    address TEXT,
    phone VARCHAR(30),
    email VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'MXN',
    currency_symbol VARCHAR(5) DEFAULT '$',
    tax_rate NUMERIC(5, 2) DEFAULT 16,
    logo_text VARCHAR(50) DEFAULT 'StoreFlow',
    theme VARCHAR(10) DEFAULT 'dark',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- 12. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(50) PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    detail TEXT,
    user_id VARCHAR(50) REFERENCES app_users(id) ON DELETE SET NULL,
    user_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow public access via anon key for client-side app
CREATE POLICY "Public Read/Write for app_users" ON app_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for brands" ON brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for purchases" ON purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for purchase_items" ON purchase_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for sale_items" ON sale_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for cash_sessions" ON cash_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for cash_movements" ON cash_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for inventory_adjustments" ON inventory_adjustments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for company_settings" ON company_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write for activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- SEED INITIAL DATA
-- ==========================================

-- Insert Users
INSERT INTO app_users (id, name, email, password, role, active) VALUES
('user_super', 'Sofía Supervisor', 'supervisor@storeflow.com', 'super123', 'supervisor', true),
('user_cajero', 'Carlos Cajero', 'cajero@storeflow.com', 'cajero123', 'cajero', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Categories
INSERT INTO categories (id, name, color, icon) VALUES
('cat_bebidas', 'Bebidas', '#0ea5e9', 'CupSoda'),
('cat_lacteos', 'Lácteos', '#14b8a6', 'Milk'),
('cat_abarrotes', 'Abarrotes', '#f59e0b', 'Wheat'),
('cat_snacks', 'Snacks', '#ef4444', 'Cookie'),
('cat_limpieza', 'Limpieza', '#8b5cf6', 'SprayCan'),
('cat_cuidado', 'Cuidado Personal', '#ec4899', 'HeartPulse')
ON CONFLICT (id) DO NOTHING;

-- Insert Brands
INSERT INTO brands (id, name) VALUES
('br_coca', 'Coca-Cola'),
('br_pepsi', 'Pepsi'),
('br_nestle', 'Nestlé'),
('br_lala', 'Lala'),
('br_gamesa', 'Gamesa'),
('br_sabritas', 'Sabritas'),
('br_p&g', 'Procter & Gamble'),
('br_colgate', 'Colgate'),
('br_unilever', 'Unilever'),
('br_bimbo', 'Bimbo')
ON CONFLICT (id) DO NOTHING;

-- Insert Products
INSERT INTO products (id, sku, barcode, name, description, category_id, brand_id, cost, price, stock, min_stock, unit, favorite, active) VALUES
('prod_001', 'COCA-600', '7501057530015', 'Coca-Cola 600ml', 'Refresco de cola 600ml', 'cat_bebidas', 'br_coca', 2800.00, 4500.00, 120.00, 24.00, 'pza', true, true),
('prod_002', 'COCA-2L', '7501057530022', 'Coca-Cola 2L', 'Refresco de cola 2 litros', 'cat_bebidas', 'br_coca', 5800.00, 8500.00, 60.00, 12.00, 'pza', true, true),
('prod_003', 'PEPSI-600', '7501057530039', 'Pepsi 600ml', 'Refresco de cola 600ml', 'cat_bebidas', 'br_pepsi', 2500.00, 4200.00, 80.00, 24.00, 'pza', false, true),
('prod_004', 'SPRITE-600', '7501057530046', 'Sprite 600ml', 'Refresco de limón 600ml', 'cat_bebidas', 'br_coca', 2800.00, 4500.00, 8.00, 24.00, 'pza', false, true),
('prod_005', 'AGUA-1L', '7501057530053', 'Agua Ciel 1L', 'Agua pura 1 litro', 'cat_bebidas', 'br_coca', 1500.00, 3000.00, 90.00, 24.00, 'pza', false, true),
('prod_006', 'LECHE-1L', '7501057530060', 'Leche Colanta Entera 1L', 'Leche entera pasteurizada', 'cat_lacteos', 'br_lala', 3200.00, 4800.00, 40.00, 12.00, 'pza', true, true),
('prod_007', 'YOGURT-1K', '7501057530077', 'Yogurt Nestlé 1kg', 'Yogurt de fresa', 'cat_lacteos', 'br_nestle', 8500.00, 13500.00, 25.00, 6.00, 'pza', false, true),
('prod_008', 'QUESO-500', '7501057530084', 'Queso Alpina 500g', 'Queso sabana rebanado', 'cat_lacteos', 'br_lala', 12000.00, 18500.00, 15.00, 6.00, 'pza', false, true),
('prod_009', 'ARROZ-1K', '7501057530091', 'Arroz Roa 1kg', 'Arroz blanco grano largo', 'cat_abarrotes', 'br_nestle', 3200.00, 4800.00, 50.00, 12.00, 'pza', false, true),
('prod_010', 'FRIJOL-1K', '7501057530107', 'Frijol Cargamanto 1kg', 'Frijol seleccionado', 'cat_abarrotes', 'br_nestle', 4500.00, 7200.00, 35.00, 12.00, 'pza', false, true),
('prod_011', 'ACEITE-1L', '7501057530114', 'Aceite Premier 1L', 'Aceite vegetal', 'cat_abarrotes', 'br_unilever', 7500.00, 11500.00, 28.00, 10.00, 'pza', true, true),
('prod_012', 'AZUCAR-1K', '7501057530121', 'Azúcar Incauca 1kg', 'Azúcar refinada', 'cat_abarrotes', 'br_nestle', 3500.00, 5200.00, 45.00, 12.00, 'pza', false, true),
('prod_013', 'PAPAS-SAB', '7501057530138', 'Papas Margarita 45g', 'Papas fritas clásicas', 'cat_snacks', 'br_sabritas', 2200.00, 3500.00, 100.00, 24.00, 'pza', true, true),
('prod_014', 'DORITOS', '7501057530145', 'Doritos Nacho 65g', 'Totopos de nacho', 'cat_snacks', 'br_sabritas', 2800.00, 4500.00, 70.00, 24.00, 'pza', false, true),
('prod_015', 'GALLETAS', '7501057530152', 'Galletas Festival', 'Galletas de chocolate', 'cat_snacks', 'br_gamesa', 1800.00, 3000.00, 60.00, 24.00, 'pza', false, true),
('prod_016', 'TORTILLAS', '7501057530169', 'Tortillas Bimbo 1kg', 'Tortillas de maíz', 'cat_abarrotes', 'br_bimbo', 2500.00, 4000.00, 5.00, 12.00, 'pza', false, true),
('prod_017', 'PAN-BIMBO', '7501057530176', 'Pan Bimbo Grande', 'Pan blanco rebanado', 'cat_abarrotes', 'br_bimbo', 5500.00, 8500.00, 20.00, 8.00, 'pza', false, true),
('prod_018', 'JABON', '7501057530183', 'Jabón Rey 250g', 'Jabón de lavandería', 'cat_limpieza', 'br_p&g', 2800.00, 4500.00, 55.00, 12.00, 'pza', false, true),
('prod_019', 'CLOROX-1L', '7501057530190', 'Clorox 1L', 'Cloro concentrado', 'cat_limpieza', 'br_p&g', 3200.00, 5000.00, 30.00, 12.00, 'pza', false, true),
('prod_020', 'PASTA-DENT', '7501057530206', 'Pasta Dental Colgate', 'Pasta dental 100ml', 'cat_cuidado', 'br_colgate', 4500.00, 7500.00, 40.00, 12.00, 'pza', false, true),
('prod_021', 'SHAMPOO', '7501057530213', 'Shampoo Savital 400ml', 'Shampoo hidratante', 'cat_cuidado', 'br_unilever', 8500.00, 14000.00, 25.00, 8.00, 'pza', false, true),
('prod_022', 'JABON-TOALLA', '7501057530220', 'Jabón Palmolive', 'Jabón de tocador 150g', 'cat_cuidado', 'br_colgate', 2200.00, 3800.00, 48.00, 12.00, 'pza', false, true),
('prod_023', 'PAPEL-HIG', '7501057530237', 'Papel Higiénico Familia', 'Paquete 4 rollos', 'cat_limpieza', 'br_p&g', 5500.00, 9200.00, 32.00, 10.00, 'pza', false, true)
ON CONFLICT (id) DO NOTHING;

-- Insert Customers
INSERT INTO customers (id, name, document, phone, email, address, balance, notes) VALUES
('cus_001', 'María González', '1.012.345.678', '3101234567', 'maria.g@email.com', 'Calle 100 # 15-20, Bogotá', 0.00, 'Cliente frecuente'),
('cus_002', 'Juan Pérez', '1.098.765.432', '3159876543', 'juan.p@email.com', 'Av. El Dorado # 68-90, Bogotá', 120000.00, 'Crédito pendiente'),
('cus_003', 'Ana Martínez', '1.044.556.677', '3004455667', 'ana.m@email.com', 'Carrera 7 # 45-12, Bogotá', 0.00, ''),
('cus_004', 'Carlos Ruiz', '1.022.334.455', '3202233445', 'carlos.r@email.com', 'Cl. 53 # 13-24, Bogotá', 0.00, 'Paga siempre en efectivo'),
('cus_005', 'Laura Sánchez', '1.066.778.899', '3186677889', 'laura.s@email.com', 'Cra. 15 # 93-60, Bogotá', 0.00, '')
ON CONFLICT (id) DO NOTHING;

-- Insert Suppliers
INSERT INTO suppliers (id, name, contact, phone, email, address, tax_id, balance) VALUES
('sup_001', 'Distribuidora Central Colombia', 'Roberto Díaz', '6015551122', 'ventas@distcentro.co', 'Zona Industrial Calle 13, Bogotá', '800.101.001-1', 0.00),
('sup_002', 'Coca-Cola FEMSA Colombia', 'Patricia Luna', '6015553344', 'pedidos@cocafemsa.co', 'Av. 68 # 12-40, Bogotá', '860.002.002-2', 0.00),
('sup_003', 'Grupo Bimbo de Colombia', 'Miguel Torres', '6015555566', 'comercial@bimbo.co', 'Autopista Norte Km 18, Chía', '860.780.303-3', 0.00),
('sup_004', 'Nestlé de Colombia S.A.', 'Sofía Vega', '6015557788', 'contacto@nestle.co', 'Carrera 7 # 123-55, Bogotá', '860.900.404-4', 0.00)
ON CONFLICT (id) DO NOTHING;

-- Insert Company Settings
INSERT INTO company_settings (id, name, legal_name, tax_id, address, phone, email, currency, currency_symbol, tax_rate, logo_text, theme) VALUES
(1, 'Supermercado StoreFlow', 'StoreFlow Colombia S.A.S.', '901.234.567-8', 'Calle 100 # 15-20, Bogotá, Colombia', '+57 601 555 1234', 'contacto@storeflow.co', 'COP', '$', 19.00, 'StoreFlow', 'light')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    legal_name = EXCLUDED.legal_name,
    tax_id = EXCLUDED.tax_id,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    currency = EXCLUDED.currency,
    tax_rate = EXCLUDED.tax_rate;
