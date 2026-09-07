CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    salary NUMERIC(12,2) NOT NULL
);

INSERT INTO employees (name, department, salary)
VALUES
    ('Ravi Kumar', 'Engineering', 75000.00),
    ('Priya Sharma', 'HR', 65000.00),
    ('Arun Patel', 'Finance', 70000.00);
