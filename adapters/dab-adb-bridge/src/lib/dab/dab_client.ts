/**
 Copyright 2019 Amazon.com, Inc. or its affiliates.
 Copyright 2019 Netflix Inc.
 Copyright 2019 Google LLC
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import  * as topics  from './dab_topics.js';
import {HandlerSubscription, MqttClient} from "../mqtt_client";
import {DabKey} from "../adb/adb_keymap";
import {
    DeviceInformationResponse,
    ExitApplicationResponse,
    HealthCheckResponse,
    KeyPressResponse,
    LaunchApplicationResponse,
    ListApplicationsResponse,
    RestartResponse,
    StartApplicationTelemetryResponse,
    StartDeviceTelemetryResponse,
    StopApplicationTelemetryResponse,
    StopDeviceTelemetryResponse,
    VersionResponse
} from "./dab_responses";

export class DabClient {
    private client: MqttClient;
    private messagesSub?: HandlerSubscription;
    private deviceTelemetrySub?: HandlerSubscription;
    private appTelemetrySub?: HandlerSubscription;
    /**
     Sample DAB client based on the DabMqttClient implementation
     */
    constructor(dab_mqtt_client: MqttClient) {
        this.client = dab_mqtt_client;
    }

    async showMessages(): Promise<void> {
        this.messagesSub = await this.client.subscribe(
            topics.DAB_MESSAGES, async (message) => {
                console.log(`DAB message: ${JSON.stringify(message)}\n`);
            }
        );
    }

    async hideMessages() {
        if (this.messagesSub) await this.messagesSub.end();
    }

    async showDeviceTelemetry(): Promise<void> {
        this.deviceTelemetrySub = await this.client.subscribe(
            topics.TELEMETRY_METRICS_TOPIC, async (message) => {
                console.log(`Device telemetry: ${JSON.stringify(message, null, 2)}\n`);
            }
        );
    }

    async hideDeviceTelemetry() {
        if (this.deviceTelemetrySub) await this.deviceTelemetrySub.end();
    }

    async showAppTelemetry(): Promise<void> {
        this.appTelemetrySub = await this.client.subscribe(
            `topics.TELEMETRY_METRICS_TOPIC/+`, async (message) => {
                console.log(`App telemetry: ${JSON.stringify(message, null, 2)}\n`);
            }
        );
    }

    async hideAppTelemetry() {
        if (this.appTelemetrySub) await this.appTelemetrySub.end();
    }

    async version(): Promise<VersionResponse> {
        return await this.client.subscribeOnce(topics.DAB_VERSION_TOPIC);
    }

    async deviceInfo(): Promise<DeviceInformationResponse> {
        return await this.client.subscribeOnce(topics.DEVICE_INFO_TOPIC);
    }

    async listApps(): Promise<ListApplicationsResponse> {
        return await this.client.request(
            topics.APPLICATIONS_LIST_TOPIC
        )
    }

    async exitApp(appId: string, force=false): Promise<ExitApplicationResponse> {
        return await this.client.request(
            topics.APPLICATIONS_EXIT_TOPIC,
            {
                appId: appId,
                force: force
            }
        )
    }

    async launchApp(appId: string, parameters?: string[] | string): Promise<LaunchApplicationResponse> {
        return await this.client.request(
            topics.APPLICATIONS_LAUNCH_TOPIC,
            {
                appId: appId,
                parameters: parameters
            }
        )
    }

    async pressKey(keyCode: DabKey): Promise<KeyPressResponse> {
        return await this.client.request(
            topics.INPUT_KEY_PRESS_TOPIC,
            {
                keyCode: keyCode
            }
        )
    }

    async pressKeyLong(keyCode: DabKey, durationMs: number): Promise<KeyPressResponse> {
        return await this.client.request(
            topics.INPUT_LONG_KEY_PRESS_TOPIC,
            {
                keyCode: keyCode,
                durationMs: durationMs
            }
        )
    }

    async startDeviceTelemetry(frequency: number): Promise<StartDeviceTelemetryResponse> {
        return await this.client.request(
            topics.DEVICE_TELEMETRY_START_TOPIC,
            {
                frequency: frequency
            }
        )
    }

    async stopDeviceTelemetry(): Promise<StopDeviceTelemetryResponse> {
        return await this.client.request(
            topics.DEVICE_TELEMETRY_STOP_TOPIC
        )
    }

    async startAppTelemetry(appId: string, frequency: number): Promise<StartApplicationTelemetryResponse> {
        return await this.client.request(
            topics.APP_TELEMETRY_START_TOPIC,
            {
                appId: appId,
                frequency: frequency
            }
        )
    }

    async stopAppTelemetry(appId: string): Promise<StopApplicationTelemetryResponse> {
        return await this.client.request(
            topics.APP_TELEMETRY_STOP_TOPIC,
            {
                appId: appId
            }
        )
    }

    async restart(): Promise<RestartResponse> {
        return await this.client.request(
            topics.SYSTEM_RESTART_TOPIC
        )
    }

    async healthCheck(): Promise<HealthCheckResponse> {
        return await this.client.request(
            topics.HEALTH_CHECK_TOPIC
        )
    }
}
