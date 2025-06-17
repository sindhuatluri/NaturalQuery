import { BenchmarkCase } from './types';

const SCHEMA_POSTGRES = `
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    country VARCHAR(50),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    category VARCHAR(50),
    price DECIMAL(10,2),
    stock_quantity INT
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT,
    order_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2),
    status VARCHAR(20),
    CONSTRAINT fk_customer FOREIGN KEY (customer_id) 
        REFERENCES customers(customer_id)
);

CREATE TABLE order_items (
    order_id INT,
    product_id INT,
    quantity INT,
    unit_price DECIMAL(10,2),
    PRIMARY KEY (order_id, product_id),
    CONSTRAINT fk_order FOREIGN KEY (order_id) 
        REFERENCES orders(order_id),
    CONSTRAINT fk_product FOREIGN KEY (product_id) 
        REFERENCES products(product_id)
);`;

const SCHEMA_MYSQL = [
  `CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    country VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`,
  
  `CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    category VARCHAR(50),
    price DECIMAL(10,2),
    stock_quantity INT
  );`,
  
  `CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2),
    status VARCHAR(20),
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) 
        REFERENCES customers(customer_id)
  );`,
  
  `CREATE TABLE order_items (
    order_id INT,
    product_id INT,
    quantity INT,
    unit_price DECIMAL(10,2),
    PRIMARY KEY (order_id, product_id),
    CONSTRAINT fk_orderitems_order FOREIGN KEY (order_id) 
        REFERENCES orders(order_id),
    CONSTRAINT fk_orderitems_product FOREIGN KEY (product_id) 
        REFERENCES products(product_id)
  );`
];

const SCHEMA_MSSQL = `
CREATE TABLE customers (
    customer_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    country VARCHAR(50),
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE products (
    product_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100),
    category VARCHAR(50),
    price DECIMAL(10,2),
    stock_quantity INT
);

CREATE TABLE orders (
    order_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT,
    order_date DATETIME2 DEFAULT GETDATE(),
    total_amount DECIMAL(10,2),
    status VARCHAR(20),
    CONSTRAINT FK_Orders_Customer FOREIGN KEY (customer_id) 
        REFERENCES customers(customer_id)
);

CREATE TABLE order_items (
    order_id INT,
    product_id INT,
    quantity INT,
    unit_price DECIMAL(10,2),
    CONSTRAINT PK_OrderItems PRIMARY KEY (order_id, product_id),
    CONSTRAINT FK_OrderItems_Order FOREIGN KEY (order_id) 
        REFERENCES orders(order_id),
    CONSTRAINT FK_OrderItems_Product FOREIGN KEY (product_id) 
        REFERENCES products(product_id)
);`;

export const SCHEMA_SETUP = {
  postgres: SCHEMA_POSTGRES,
  mysql: SCHEMA_MYSQL,
  mssql: SCHEMA_MSSQL
};

const TEST_DATA_COMMON = `
INSERT INTO customers (name, email, country) VALUES
('John Doe', 'john@example.com', 'USA'),
('Jane Smith', 'jane@example.com', 'Canada'),
('Alice Johnson', 'alice@example.com', 'UK');

INSERT INTO products (name, category, price, stock_quantity) VALUES
('Laptop Pro', 'Electronics', 1299.99, 50),
('Smartphone X', 'Electronics', 799.99, 100),
('Wireless Headphones', 'Accessories', 199.99, 200);

INSERT INTO orders (customer_id, total_amount, status) VALUES
(1, 1299.99, 'completed'),
(2, 999.98, 'pending'),
(1, 199.99, 'completed');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 1299.99),
(2, 2, 1, 799.99),
(2, 3, 1, 199.99),
(3, 3, 1, 199.99);
`;

export const TEST_DATA = {
  postgres: TEST_DATA_COMMON,
  mysql: [
    `INSERT INTO customers (name, email, country) VALUES
    ('John Doe', 'john@example.com', 'USA'),
    ('Jane Smith', 'jane@example.com', 'Canada'),
    ('Alice Johnson', 'alice@example.com', 'UK');`,
    
    `INSERT INTO products (name, category, price, stock_quantity) VALUES
    ('Laptop Pro', 'Electronics', 1299.99, 50),
    ('Smartphone X', 'Electronics', 799.99, 100),
    ('Wireless Headphones', 'Accessories', 199.99, 200);`,
    
    `INSERT INTO orders (customer_id, total_amount, status) VALUES
    (1, 1299.99, 'completed'),
    (2, 999.98, 'pending'),
    (1, 199.99, 'completed');`,
    
    `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (1, 1, 1, 1299.99),
    (2, 2, 1, 799.99),
    (2, 3, 1, 199.99),
    (3, 3, 1, 199.99);`
  ],
  mssql: TEST_DATA_COMMON
};

export const BENCHMARK_CASES: BenchmarkCase[] = [
  {
    name: "Simple Select",
    question: "Show all customers from USA",
    expectedQuery: "SELECT customer_id, name, email, country FROM customers WHERE country = 'USA'",
    expectedResult: [
      {
        customer_id: 1,
        name: "John Doe",
        email: "john@example.com",
        country: "USA"
      }
    ],
    expectedStructure: "{ customer_id, name, email, country }"
  },
  {
    name: "Join with Aggregation",
    question: "What is the total amount spent by each customer, including their name?",
    expectedQuery: `
      SELECT c.name, COALESCE(SUM(o.total_amount), 0) as total_spent
      FROM customers c
      LEFT JOIN orders o ON c.customer_id = o.customer_id
      GROUP BY c.name
      ORDER BY total_spent DESC
    `,
    expectedResult: [
      { name: "John Doe", total_spent: 1499.98 },
      { name: "Jane Smith", total_spent: 999.98 },
      { name: "Alice Johnson", total_spent: 0.00 }
    ],
    expectedStructure: "{ name, total_spent }"
  },
  {
    name: "Complex Multi-Join",
    question: "List all products purchased by customer 'John Doe' with quantities",
    expectedQuery: `
      SELECT p.name as product_name, SUM(oi.quantity) as total_quantity
      FROM customers c
      JOIN orders o ON c.customer_id = o.customer_id
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN products p ON oi.product_id = p.product_id
      WHERE c.name = 'John Doe'
      GROUP BY p.name
      ORDER BY p.name
    `,
    expectedResult: [
      { product_name: "Laptop Pro", total_quantity: 1 },
      { product_name: "Wireless Headphones", total_quantity: 1 }
    ],
    expectedStructure: "{ product_name, total_quantity }"
  }
];
