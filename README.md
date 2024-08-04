# jumbo
Jumbo

# requirements
- Install `node`, `mongodb`, `mongodb-compass`
- Or if you have `docker` installed then you can use `docker-compose.yaml`
- At the time of building this project `node v20` was used

# Steps to run
## Step 1: clone repo
```sh
git clone https://github.com/NeuronEnix/jumbo
```
- `cd` to the project

## Step 2: run `script` and `npm`
- Creates a `.env` copy from `.env.example`
```sh
sh setup.sh
```
- Install npm packages
```sh
npm i
```
## Step 3: setup `.env `and run project
- open `.env` file, update it with values thats running on your machine
  - Specifically `monogdb`
- Populate the database
```sh
node populate.mjs
```
- Run server
```sh
npm run dev
```
- API Endpoint: http://127.0.0.1:3000
- WS  Endpoint: ws://127.0.0.1:3001

## Optionally if you want to use docker-compose.yaml
- First make sure that `DB_HOST` in `.env` is set to
```sh
DB_HOST = mongo
```
- Run this command to run project in docker
```sh
docker compose up -d
```
- Before calling any API run this command to populate `monogdb`  with questions
```sh
docker exec jumbo-api node populate.mjs
```


# Methods
| Method | API | Request Data |
| --- | --- | --- |
| GET | /ping |  |
| POST | /user/register | `{ "email": "k@k.com", "pass": "pass@1234", "name": "kaushik"}` |
| POST | /user/login | `{ "email": "k@k.com", "pass": "pass@1234"}` |
| GET | /user/get-token | `{}` |
| POST | /game/start | `{}` |
| GET | /game/getSession | `{}`  |

# Websocket
| Events | Description
| --- | --- |
| `game:init` | When game start this event is sent to all involved players |
| `question:send` | On submission of question this event is used to send another question right after |
| `answer:submit` | To submit the answer of the question |
| `game:submit` | One user finishes attempting all question, this event is sent to server |
| `user:submitted` | This event is sent to other users stating a user has submitted all answers |
| `game:end` | This is sent to all involved user once every finishes submitting or session is timed out |

# How to use api
- Register / Login the user at `POST /user/register` | `POST /user/login`
  - Server will return `refreshToken` as `http only` cookie ( in both API )
- Get `accessToken` at `GET /user/get-token`
  - Server will return `accessToken` in response payload
- Send the `accessToken` as `Bearer <token>` in `Authorization` header to call other API

# Few additional features added to project
- The `cors` package was used to handle CORS, currently set to *. In production, it will need to be set to allowed domains and allowed headers.
- The `helmet` package was utilized to help mitigate commonly known vulnerabilities.
- A `Dockerfile` was added so that the app can be run in Kubernetes or other distributed systems.
