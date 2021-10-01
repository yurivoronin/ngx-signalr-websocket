# NgxSignalrWebsocket

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 12.0.1.

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `ng build ngx-signalr-websocket`, go to the dist folder `cd dist/ngx-signalr-websocket` and run `npm publish`.

## Running tests

Run `npm run mock:build` to first build mock SignalR hub docker image named 'signalr-example'
Run `npm run mock:run` to start mock SignalR hub docker container 'signalr-example'
Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

When tests finished run `npm run mock:stop` to stop mock SignalR hub docker container 'signalr-example'

In case of rebuild or remove 'signalr-example' run `npm run mock:clear` to remove both container and image.
