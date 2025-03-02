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

import { MqttClient } from "../mqtt_client/index.js";
import * as topics from "./dab_topics.js";
import { readFileSync } from "fs";
import {
    AdbBridgeLaunchApplicationRequest,
    ExitApplicationRequest,
    GetApplicationStateRequest,
    KeyPressRequest,
    LongKeyPressRequest,
    SetLanguageRequest,
    StartApplicationTelemetryRequest,
    StartDeviceTelemetryRequest,
    StopApplicationTelemetryRequest
} from "./dab_requests";
import {
    DabResponse,
    DeviceInformationResponse,
    GetApplicationStateResponse,
    KeyPressResponse,
    ListApplicationsResponse,
    RestartResponse,
    StartApplicationTelemetryResponse,
    StartDeviceTelemetryResponse,
    StopApplicationTelemetryResponse,
    StopDeviceTelemetryResponse,
    VersionResponse,
    HealthCheckResponse
} from "./dab_responses";

export type NotificationLevel = "info" | "warn" | "debug" | "trace" | "error";

interface Telemetry {
    [appId: string]: NodeJS.Timer | undefined;
    device?: NodeJS.Timer;
}

export abstract class DabDeviceBase {
    private readonly telemetry: Telemetry;
    private client!: MqttClient;
    /**
     * Constructor for DabDeviceInterface
     * Don't construct this interface directly.
     */
    protected constructor() {
        this.telemetry = {};
    }

    /**
     * Init to be called once at application startup, unless following stop
     */
    public async init(uri: string) {
        this.client = new MqttClient();

        //Pre-Init Handler Registration
        this.client.handle(topics.APPLICATIONS_LIST_TOPIC, this.listApps);
        this.client.handle(topics.APPLICATIONS_LAUNCH_TOPIC, this.launchApp);
        this.client.handle(topics.APPLICATIONS_EXIT_TOPIC, this.exitApp);
        this.client.handle(topics.APPLICATIONS_GET_STATE_TOPIC, this.getAppState);
        this.client.handle(topics.SYSTEM_RESTART_TOPIC, this.restartDevice);
        this.client.handle(topics.INPUT_KEY_PRESS_TOPIC, this.keyPress);
        this.client.handle(topics.INPUT_LONG_KEY_PRESS_TOPIC, this.keyPressLong);
        this.client.handle(topics.SYSTEM_LANGUAGE_SET_TOPIC, this.setSystemLanguage);
        this.client.handle(topics.SYSTEM_LANGUAGE_GET_TOPIC, this.getSystemLanguage);
        this.client.handle(topics.DEVICE_TELEMETRY_START_TOPIC, this.startDeviceTelemetry);
        this.client.handle(topics.DEVICE_TELEMETRY_STOP_TOPIC, this.stopDeviceTelemetry);
        this.client.handle(topics.APP_TELEMETRY_START_TOPIC, this.startAppTelemetry);
        this.client.handle(topics.APP_TELEMETRY_STOP_TOPIC, this.stopAppTelemetry);
        this.client.handle(topics.HEALTH_CHECK_TOPIC, this.healthCheck);

        //Start MQTT Client
        await this.client.init(uri);

        //Post-Init publishing of retained messages and initial notifications
        await Promise.all([
            this.client.publishRetained(topics.DAB_VERSION_TOPIC, this.version()),
            this.client.publishRetained(topics.DEVICE_INFO_TOPIC, await this.deviceInfo()),
            this.notify("info", "DAB service is online")
        ]);

        return this.client;
    }

    /**
     * Cleanly shuts down the MQTT client, clearing retained messages for version and device info
     */
    async stop() {
        await Promise.all([
            this.notify("warn", "DAB service is shutting down"),
            this.client.clearRetained(topics.DEVICE_INFO_TOPIC),
            this.client.clearRetained(topics.DAB_VERSION_TOPIC)
        ]);

        return await this.client.stop();
    }

    /**
     * Publishes notifications to the message topic
     */
    async notify(level: NotificationLevel, message: string) {
        return await this.client.publish(topics.DAB_MESSAGES, {
            timestamp: +new Date(),
            level: level,
            message: message
        });
    }

    /**
     * Publish as retained message to version topic the major version and the minor
     * version delimited by a full stop character . Major and minor versions are
     * non-negative integers.
     */
    version(): VersionResponse {
        const packageVersion = JSON.parse(readFileSync("./package.json", "utf8")).version;
        const dabVersion = packageVersion.substring(packageVersion, packageVersion.lastIndexOf(".")); // remove patch version
        return { status: 200, versions: [dabVersion] };
    }

    dabResponse(status = 200, error?: string): DabResponse {
        const response: DabResponse = { status: status };
        if (Math.floor(status / 100) !== 2) {
            if (!error) throw new Error("Error message must be returned for non 2XX status results");
            response.error = error;
        }
        return response;
    }

    /**
     * `TelemetryCallback` is an async function which returns generated/collected telemetry.
     *
     * @callback TelemetryCallback
     */

    /**
     * Device telemetry allows the connected clients to gather metrics about the device.
     * Once the telemetry is started the device will start publishing metrics to the assigned
     * telemetry delivery topic until requested to stop. This can be called from the impl of
     * startDeviceTelemetry(data) by forwarding data and passing in a callback function and
     * returning this result.
     *
     * @param {Object} data - request object
     * @param {number} data.frequency - telemetry update frequency in milliseconds
     * @param {TelemetryCallback} cb - callback to generate/collect telemetry
     * @returns {Promise<DabResponse>}
     */
    async startDeviceTelemetryImpl(
        data: StartDeviceTelemetryRequest,
        cb: () => unknown
    ): Promise<StartDeviceTelemetryResponse | DabResponse> {
        if (!Number.isInteger(data.frequency))
            return this.dabResponse(400, "'frequency' must be set as number of milliseconds between updates");

        if (this.telemetry.device) return this.dabResponse(400, `Device telemetry is already started, stop it first`);

        await this.client.publish(topics.TELEMETRY_METRICS_TOPIC, await cb());

        this.telemetry.device = setInterval(async () => {
            await this.client.publish(topics.TELEMETRY_METRICS_TOPIC, await cb());
        }, data.frequency);
        return { ...this.dabResponse(), ...{ frequency: data.frequency } };
    }

    async startAppTelemetryImpl(
        data: StartApplicationTelemetryRequest,
        cb: () => Promise<void>
    ): Promise<StartApplicationTelemetryResponse | DabResponse> {
        if (typeof cb !== "function") return this.dabResponse(400, "App telemetry callback is not a function");

        if (typeof data.appId !== "string")
            return this.dabResponse(400, "'app' must be set as the application id to start sending telemetry");

        if (typeof data.frequency !== "number" || !Number.isInteger(data.frequency))
            return this.dabResponse(400, "'frequency' must be set as number of milliseconds between updates");

        if (this.telemetry[data.appId])
            return this.dabResponse(400, `App telemetry is already started for ${data.appId}, stop it first`);

        await this.client.publish(`${topics.TELEMETRY_METRICS_TOPIC}/${data.appId}`, await cb);

        this.telemetry[data.appId] = setInterval(async () => {
            await this.client.publish(`${topics.TELEMETRY_METRICS_TOPIC}/${data.appId}`, await cb);
        }, data.frequency);
        return { ...this.dabResponse(), ...{ frequency: data.frequency } };
    }
    // TO BE IMPLEMENTED FOR DEVICE
    //-----------------------------

    /**
     * @typedef {Object} DeviceInformation
     * @property {string} make - Manufacturer
     * @property {string} model - Model name
     * @property {string} serialNumber - Serial Number
     * @property {string} year - Production year
     * @property {string} chipset - Chipset
     * @property {string} firmware - Firmware version
     * @property {string} networkConnectivityMode - 'ethernet' | 'wifi' | 'bluetooth'
     * @property {string} macAddress - MAC Address
     */

    /**
     * Publishes a retained message to the device info topic
     */
    async deviceInfo(): Promise<DeviceInformationResponse | DabResponse> {
        return { status: 501, error: "Device info not implemented" };
    }

    /**
     * @typedef {Object} AppDetail
     * @property {string} id - Application id
     * @property {string} [friendlyName] - Application friendly name
     * @property {string} [version] - Application version
     */

    /**
     * @typedef {Object} AppListResponse
     * @property {number} status - Response status code
     * @property {Array.<AppDetail>} app - Array of installed application details
     */

    /**
     * Lists all the installed applications on the device.
     *
     * @abstract
     * @returns {Promise<DabResponse|AppListResponse>}
     */
    async listApps(): Promise<ListApplicationsResponse | DabResponse> {
        return { status: 501, error: "List apps not implemented" };
    }

    /**
     * Launches an application.
     *
     * @abstract
     * @param {Object} data - request object
     * @param {string} data.app - application id to launch
     * @param {string} [data.parameters] - parameters to pass to application
     * @returns {Promise<DabResponse>}
     */
    async launchApp(_data: AdbBridgeLaunchApplicationRequest): Promise<DabResponse> {
        return { status: 501, error: "Launch app not implemented" };
    }

    /**
     * Exits the application. If the optional force parameter is set and attempt is made
     * to force stop the application. If the force parameter is omitted or set to false
     * then the OS may decide which state to put the application into (background,
     * suspended, quit, etc.).
     *
     * @abstract
     * @param {Object} data - request object
     * @param {string} data.app - application id to exit
     * @param {boolean} [data.force] - force exit, default to false
     * @returns {Promise<DabResponse>}
     */
    async exitApp(_data: ExitApplicationRequest): Promise<DabResponse> {
        return { status: 501, error: "Exit app not implemented" };
    }

    async getAppState(_data: GetApplicationStateRequest): Promise<DabResponse | GetApplicationStateResponse> {
        return { status: 501, error: "Get app state not implemented" };
    }

    /**
     * Request to restart the device.
     *
     * @abstract
     * @returns {Promise<DabResponse>}
     */
    async restartDevice(): Promise<RestartResponse> {
        return { status: 501, error: "Restart not implemented" };
    }

    /**
     * Key press is an action that can be associated with the key press on the remote control.
     * A key code represents button name / function name typically found on the remote control device.
     *
     * @abstract
     * @param {Object} data - request object
     * @param {string} data.keyCode - string literal, prefixed with KEY_ or KEY_CUSTOM_ per spec
     * @returns {Promise<DabResponse>}
     */
    async keyPress(_data: KeyPressRequest): Promise<KeyPressResponse> {
        return { status: 501, error: "Key press not implemented" };
    }

    /**
     * Long key press is an action that can be associated with an extended key press on the remote control.
     * A key code represents button name / function name typically found on the remote control device.
     *
     * @abstract
     * @param {Object} data - request object
     * @param {string} data.keyCode - string literal, prefixed with KEY_ or KEY_CUSTOM_ per spec
     * @param {string} [data.durationMs] - delay between key down and up events
     * @returns {Promise<DabResponse>}
     */
    async keyPressLong(_data: LongKeyPressRequest): Promise<KeyPressResponse> {
        return { status: 501, error: "Long key press not implemented" };
    }

    /**
     * Set the current device's system language.
     *
     * @abstract
     * @param {Object} data - request object
     * @param {string} data.language - rcf_5646_language_tag
     * @returns {Promise<DabResponse>}
     */
    async setSystemLanguage(_data: SetLanguageRequest): Promise<DabResponse> {
        return { status: 501, error: "Set system language not implemented" };
    }

    /**
     * @typedef {Object} GetSystemLanguageResponse
     * @property {number} status - Response status code
     * @property {string} [language] - rcf_5646_language_tag
     */

    /**
     * Get the current device's system language.
     *
     * @abstract
     * @returns {Promise<DabResponse|GetSystemLanguageResponse>}
     */
    async getSystemLanguage(): Promise<DabResponse> {
        return { status: 501, error: "Get system language not implemented" };
    }

    /**
     * Device telemetry allows the connected clients to gather metrics about the device.
     * Once the telemetry is started the device will start publishing metrics to the assigned
     * telemetry delivery topic until requested to stop. Can delegate to default impl by simply
     * "return await this._startDeviceTelemetry(data, cb)" - see _startDeviceTelemetry for details.
     *
     * @abstract
     * @param {Object} data - request object
     * @param {number} data.frequency - telemetry update frequency in milliseconds
     * @returns {Promise<DabResponse>}
     */
    async startDeviceTelemetry(_data: StartDeviceTelemetryRequest): Promise<DabResponse> {
        return { status: 501, error: "Device telemetry not implemented" };
    }

    /**
     * Stops publishing device telemetry. Can delegate to default impl by simply
     * "return await this._stopDeviceTelemetry();"
     *
     * @abstract
     * @returns {Promise<DabResponse>}
     */
    async stopDeviceTelemetry(): Promise<DabResponse> {
        return { status: 501, error: "Device telemetry not implemented" };
    }

    /**
     * Application telemetry allows the connected clients to gather metrics about a specific app.
     * Once the telemetry is started the application will start publishing metrics to the assigned
     * telemetry delivery topic until requested to stop. Can delegate to default impl by simply
     * "return await this._startAppTelemetry(data, cb)" - see _startAppTelemetry for details.
     *
     * @abstract
     * @param {Object} data - request object
     * @param {string} data.app - application id to start sending telemetry
     * @param {number} data.frequency - telemetry update frequency in milliseconds
     * @returns {Promise<DabResponse>}
     */
    async startAppTelemetry(_data: StartApplicationTelemetryRequest): Promise<DabResponse> {
        return { status: 501, error: "App telemetry not implemented" };
    }

    /**
     * Returns the health status
     */
    async healthCheck(): Promise<DabResponse | HealthCheckResponse> {
        return { status: 501, error: "Health check not implemented" };
    }
    /**
     * Stops publishing device telemetry. This can be called from the impl of
     * stopDeviceTelemetry().
     *
     * @returns {Promise<DabResponse>}
     */
    stopDeviceTelemetryImpl = async (): Promise<StopDeviceTelemetryResponse> => {
        if (!this.telemetry.device) {
            return this.dabResponse(400, "Device telemetry not started");
        } else {
            clearInterval(this.telemetry.device);
            delete this.telemetry.device;
            return this.dabResponse();
        }
    };

    /**
     * Application telemetry allows the connected clients to gather metrics about a specific app.
     * Once the telemetry is started the application will start publishing metrics to the assigned
     * telemetry delivery topic until requested to stop. This can be called from the impl of
     * startAppTelemetry(data) by forwarding data and passing in a callback function and returning
     * this result.
     *
     * @param {Object} data - request object
     * @param {string} data.app - application id to start sending telemetry
     * @param {number} data.frequency - telemetry update frequency in milliseconds
     * @param {TelemetryCallback} cb - callback to generate/collect telemetry
     * @returns {Promise<DabResponse>}
     */

    /**
     * Stops publishing app telemetry. This can be called from the impl of
     * stopAppTelemetry(data) by forwarding and returning this function.
     *
     * @param {Object} data - request object
     * @param {string} data.app - application id to stop sending telemetry
     * @returns {Promise<DabResponse>}
     */
    stopAppTelemetry = async (data: StopApplicationTelemetryRequest): Promise<StopApplicationTelemetryResponse> => {
        if (typeof data.appId !== "string")
            return this.dabResponse(400, "'app' must be set as the application id to stop sending telemetry");

        if (!this.telemetry[data.appId]) {
            return this.dabResponse(400, "Device telemetry for ${data.app} not started");
        } else {
            clearInterval(this.telemetry[data.appId]);
            delete this.telemetry[data.appId];
            return this.dabResponse();
        }
    };
}
