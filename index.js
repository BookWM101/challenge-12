const inquirer = require('inquirer');
const { Client } = require('pg');

// PostgreSQL client configuration
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'employee_tracker',
  password: 'Theworldis1!',
  port: 5432,
});

// Connect to PostgreSQL
client.connect();

// Main menu
function mainMenu() {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'View all departments',
          'View all roles',
          'View all employees',
          'Add a department',
          'Add a role',
          'Add an employee',
          'Update an employee role',
          'Exit',
        ],
      },
    ])
    .then((answers) => {
      switch (answers.action) {
        case 'View all departments':
          viewAllDepartments();
          break;
        case 'View all roles':
          viewAllRoles();
          break;
        case 'View all employees':
          viewAllEmployees();
          break;
        case 'Add a department':
          addDepartment();
          break;
        case 'Add a role':
          addRole();
          break;
        case 'Add an employee':
          addEmployee();
          break;
        case 'Add a manager':
          addManager();
          break;
        case 'Update an employee role':
          updateEmployeeRole();
          break;
        case 'Exit':
          client.end();
          process.exit();
      }
    });
}

// View all departments
function viewAllDepartments() {
  client.query('SELECT * FROM departments', (err, res) => {
    if (err) throw err;
    console.table(res.rows);
    mainMenu();
  });
}

// View all roles
function viewAllRoles() {
  const query = `
    SELECT roles.id, roles.title, roles.salary, departments.name AS department 
    FROM roles 
    JOIN departments ON roles.department_id = departments.id
  `;
  client.query(query, (err, res) => {
    if (err) throw err;
    console.table(res.rows);
    mainMenu();
  });
}

// View all employees
function viewAllEmployees() {
  const query = `
    SELECT employees.id, employees.first_name, employees.last_name, roles.title, departments.name AS department, roles.salary, 
    CONCAT(manager.first_name, ' ', manager.last_name) AS manager 
    FROM employees 
    JOIN roles ON employees.role_id = roles.id 
    JOIN departments ON roles.department_id = departments.id 
    LEFT JOIN employees manager ON employees.manager_id = manager.id
  `;
  client.query(query, (err, res) => {
    if (err) throw err;
    console.table(res.rows);
    mainMenu();
  });
}

// Add a department
function addDepartment() {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter the name of the department:',
      },
    ])
    .then((answers) => {
      client.query('INSERT INTO departments (name) VALUES ($1)', [answers.name], (err, res) => {
        if (err) throw err;
        console.log('Department added successfully.');
        mainMenu();
      });
    });
}

// Add a role
function addRole() {
  client.query('SELECT * FROM departments', (err, res) => {
    if (err) throw err;

    const departments = res.rows.map((row) => ({
      name: row.name,
      value: row.id,
    }));

    inquirer
      .prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Enter the role title:',
        },
        {
          type: 'input',
          name: 'salary',
          message: 'Enter the salary for the role:',
        },
        {
          type: 'list',
          name: 'departmentId',
          message: 'Select the department for the role:',
          choices: departments,
        },
      ])
      .then((answers) => {
        const { title, salary, departmentId } = answers;
        client.query(
          'INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)',
          [title, salary, departmentId],
          (err, res) => {
            if (err) throw err;
            console.log('Role added successfully.');
            mainMenu();
          }
        );
      });
  });
}

// Add an employee
function addEmployee() {
  client.query('SELECT * FROM roles', (err, res) => {
    if (err) throw err;

    const roles = res.rows.map((row) => ({
      name: row.title,
      value: row.id,
    }));

    client.query('SELECT * FROM employees', (err, res) => {
      if (err) throw err;

      const managers = res.rows.map((row) => ({
        name: `${row.first_name} ${row.last_name}`,
        value: row.id,
      }));

      inquirer
        .prompt([
          {
            type: 'input',
            name: 'firstName',
            message: "Enter the employee's first name:",
          },
          {
            type: 'input',
            name: 'lastName',
            message: "Enter the employee's last name:",
          },
          {
            type: 'list',
            name: 'roleId',
            message: "Select the employee's role:",
            choices: roles,
          },
          //{
           // type: 'input',
           // name: 'managerId',
           // message: "Enter the employee's manager:",
            //choices: managers,
          //},
        ])
        .then((answers) => {
          const { firstName, lastName, roleId, managerId } = answers;
          client.query(
            'INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)',
            [firstName, lastName, roleId, managerId],
            (err, res) => {
              if (err) throw err;
              console.log('Employee added successfully.');
              mainMenu();
            }
          );
        });
    });
  });
}


// Update employee role
function updateEmployeeRole() {
  client.query('SELECT * FROM employees', (err, res) => {
    if (err) throw err;

    const employees = res.rows.map((row) => ({
      name: `${row.first_name} ${row.last_name}`,
      value: row.id,
    }));

    client.query('SELECT * FROM roles', (err, res) => {
      if (err) throw err;

      const roles = res.rows.map((row) => ({
        name: row.title,
        value: row.id,
      }));

      inquirer
        .prompt([
          {
            type: 'list',
            name: 'employeeId',
            message: 'Select the employee to update:',
            choices: employees,
          },
          {
            type: 'list',
            name: 'roleId',
            message: 'Select the new role for the employee:',
            choices: roles,
          },
        ])
        .then((answers) => {
          const { employeeId, roleId } = answers;
          client.query(
            'UPDATE employees SET role_id = $1 WHERE id = $2',
            [roleId, employeeId],
            (err, res) => {
              if (err) throw err;
              console.log('Employee role updated successfully.');
              mainMenu();
            }
          );
        });
    });
  });
}

// Start the application
mainMenu();

