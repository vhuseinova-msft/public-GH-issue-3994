# syntax=docker/dockerfile:1

FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

ENV REACT_APP_ACS_ENDPOINT = https://chat-communication.communication.azure.com/
ENV REACT_APP_PATIENT_SERVICE_API = https://patient-service.calmbay-07fbcdc7.eastus.azurecontainerapps.io

WORKDIR /playground

COPY . ./

RUN rm -rf node_modules
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install
# RUN NODE_OPTIONS=--max-old-space-size=8192 pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "start"]