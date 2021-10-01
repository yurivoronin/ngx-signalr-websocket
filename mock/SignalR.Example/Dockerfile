ARG BUILDER_IMG=mcr.microsoft.com/dotnet/sdk:5.0
ARG BASE_IMG=mcr.microsoft.com/dotnet/aspnet:5.0


FROM ${BUILDER_IMG} AS builder

WORKDIR /app

COPY . /app

RUN dotnet publish \
        --output /app/publish \
        --configuration Release \
        --runtime linux-x64 \
        /app/SignalR.Example.csproj


FROM ${BASE_IMG}

WORKDIR /app

COPY --from=builder /app/publish/ ./

ENTRYPOINT ["./SignalR.Example"]
