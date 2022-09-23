# RESTful API Node Server with User Auth Boilerplate


A boilerplate/starter project for quickly building RESTful APIs using Node.js, Express, and Postgres SQL.

By running following command, you will get a  Node.js app installed and fully configured on your machine. The app comes with many built-in features, such as authentication using JWT , Forgot and Reset Password etc. For more details, check the features list below.

## Installation

If you want to do the installation , follow these steps:

Clone the repo:
```bash
git clone URL
```
Install the dependencies:

```bash
npm install
```
Set the environment variables:

```bash
# open .env and modify the environment variables (if needed)
```

```bash
npm run sync:db
npm run seed:db
npm start
```


## Features

- **Authentication and authorization**: using [passport](http://www.passportjs.org)
- **Error handling**: centralized error handling mechanism
- **Process management**: advanced production process management using [PM2](https://pm2.keymetrics.io)
- **Environment variables**: using [dotenv](https://github.com/motdotla/dotenv)
- **CORS**: Cross-Origin Resource-Sharing enabled using [cors](https://github.com/expressjs/cors)

## Commands

Running locally:

```bash
npm start
```

Running in production:

```bash
npm run prod
```

## Environment Variables

The environment variables can be found and modified in the `.env` file. They come with these default values:

```bash
# Port number
PORT=8000

# URL of the Postgres DB
DB_HOST=localhost

# JWT
# JWT secret key
JWT_SECRET=smart-key
# SMTP configuration options for the email service
# For testing, you can use a fake SMTP service like Ethereal: https://ethereal.email/create
SMTP_HOST=email-server
SMTP_PORT=587
SMTP_USERNAME=email-server-username
SMTP_PASSWORD=email-server-password
EMAIL_FROM=support@yourapp.com
```

## Project Structure

```
src\
 |--config\         # Environment variables and configuration related things
 |--controllers\    # Route controllers (controller layer)
 |--middlewares\    # Custom express middlewares
 |--models\         # {Postgres} models (data layer)
 |--routes\         # Routes
 |--utils\          # Utility classes and functions
 |--app.js          # Express app
 |--bin
    |--www        # App entry point
```

### API Endpoints

List of available routes:

#### Postman Collection
https://www.getpostman.com/collections/5a44fa118e99cda49a79


## Inspirations

- [danielfsousa/express-rest-es2017-boilerplate](https://github.com/danielfsousa/express-rest-es2017-boilerplate)
- [madhums/node-express-mongoose](https://github.com/madhums/node-express-mongoose)
- [hagopj13/node-express-boilerplate](https://github.com/hagopj13/node-express-boilerplate)
## License

[MIT](LICENSE)
