# Getting Started

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Observability](#observability)
- [Database](#database)
  - [Setup Connection to Database](#setup-connection-to-database)

## Prerequisites
- Docker Desktop installed
- Git installed
- [Optional] Postman installed

## Installation
To run Nordic Bank locally, follow these steps:

1. Clone the repository through your terminal:
```bash
   git clone https://github.com/hansen1904/nordic-bank.git
```

2. Run the command below:
```bash
   docker-compose up -d
```

Now everything should be up and running locally.

## Observability

After running the `docker-compose up -d` command, you should be able to go to:
- Jaeger instance at [http://localhost:16686/](http://localhost:16686/) to see traces.
- Prometheus instance at [http://localhost:9090/](http://localhost:9090/) to see metrics.
- Grafana instance at [http://localhost:3000/](http://localhost:3000/) to visualize metrics (default username is 'admin' and password is 'admin').

## Database

To see what is saved inside the database, go to the PGAdmin instance at [http://localhost:5050/](http://localhost:5050/), where the username is 'admin@admin.com' and the password is 'admin'.

If this is your first time going there, you should set up a connection to the database.

### Setup Connection to Database

1. Right-click on "Servers", hover over "Register", and click "Server..."

2. Give it a name; I call mine "Local".

3. Click on the tab called "Connection".

4. Ensure that the following details are correct:
   - Host name/address is 'db'
   - Port is '5432'
   - Database is 'nordic_bank'
   - Username is 'hansen'
   - Password is 'secret'
   Remember to toggle "Save password?".

5. Click Save, and you can now see the schemas that have been created.

You have now set up the Nordic Bank application locally. For further instructions, refer to the project's documentation.