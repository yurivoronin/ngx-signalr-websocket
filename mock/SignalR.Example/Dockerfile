ARG BUILDER_IMG=mcr.microsoft.com/dotnet/sdk:9.0
ARG BASE_IMG=mcr.microsoft.com/dotnet/runtime:9.0


FROM ${BUILDER_IMG} AS builder

WORKDIR /app

COPY . /app

RUN dotnet publish \
        --output /app/publish \
        --configuration Release \
        --runtime linux-x64 \
        --self-contained true \
        /app/SignalR.Example.csproj


FROM ${BASE_IMG}

RUN ln -fs /usr/share/zoneinfo/Europe/Moscow /etc/localtime \
 && dpkg-reconfigure --frontend noninteractive tzdata

WORKDIR /app

COPY --from=builder /app/publish/ ./

ENTRYPOINT ["./SignalR.Example"]
