 # Pit Stop :red_car:

![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/leialoha/pit-stop?style=flat-square)
![GitHub package.json version](https://img.shields.io/github/package-json/v/leialoha/pit-stop?style=flat-square)


> A smart, all-in-one tracker for your car's maintenance, expenses, and service history, keeping every vehicle running smoothly and on schedule.

## :pushpin: Features

- Track all your vehicle maintenance and service history.
- Record expenses and upcoming service schedules.
- Manage multiple users, groups, and vehicles easily.
- Secure authentication with OTP login.

## :hammer_and_wrench: API Endpoints

| Method | Path                  | Auth Required      | Description                                   |
|-------:|-----------------------|:------------------:|-----------------------------------------------|
| `GET`  | `/users/NUMBER/login` |                    | Log into an account.                          |
| `POST` | `/users/NUMBER/login` |                    | Creates a One-Time Password.                  |
| `GET`  | `/users/lookup`       |                    | Fetch a specific user by query parameters.    |
| `GET`  | `/groups`             | :white_check_mark: | Fetch a list of all groups.                   |
| `POST` | `/groups`             | :white_check_mark: | Create a new group.                           |
| `GET`  | `/groups/lookup`      | :white_check_mark: | Fetch a specific group by query parameters.   |
| `POST` | `/vehicles`           | :white_check_mark: | Create a new vehicle.                         |
| `GET`  | `/vehicles/lookup`    | :white_check_mark: | Fetch a specific vehicle by query parameters. |
| `GET`  | `/vehicles/vin`       | :white_check_mark: | Fetch vehicle model.                          |



## :zap: Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Yarn](https://yarnpkg.com/)

### Installation

```sh
./yarn build
./yarn start
```

### Development

```sh
./yarn dev
```


## :pencil: Environment Variables

| Variable         | Description                                                     | Default Value |
|------------------|-----------------------------------------------------------------|---------------|
| `DB_PROTOCOL`    | The Protocol of the MongoDB database                            | `mongodb`     |
| `DB_HOSTNAME`    | The IP / Hostname of the MongoDB database                       |               |
| `DB_PORT`        | The port of the MongoDB database                                |               |
| `DB_NAME`        | The database name                                               |               |
| `DB_USERNAME`    | The database username                                           |               |
| `DB_PASSWORD`    | The database password                                           |               |
| `HOST`           | The webserver hostname                                          | `0.0.0.0`     |
| `PORT`           | The webserver port                                              | `3000`        |

## :open_file_folder: License
All Right Reserved © 2025
