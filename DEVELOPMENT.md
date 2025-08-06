# NgxSignalrWebsocket

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 12.0.1.

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `npm run build`, run `npm publish`.

## Running tests

Run `npm run mock:build` to first build mock SignalR hub docker image named 'signalr-example'.

Run `npm run mock:run` to create and start mock SignalR hub docker container 'signalr-example'.

Run `npm test` to execute the unit tests via [Karma](https://karma-runner.github.io).

When tests finished run `npm run mock:stop` to stop mock SignalR hub docker container 'signalr-example'.

To rerun mock container use `npm run mock:start`.

In case of remove 'signalr-example' run `npm run mock:rm` to remove container.

In case of rebuild or remove 'signalr-example' run `npm run mock:clear` to remove both container and image.
