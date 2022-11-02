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

import config from "config";
import { DabDeviceBase } from "./dab/dab_device_base";
import { AdbCommands } from "./adb/adb_commands.js";
import { adbAppStatusToDabAppState, getLogger } from "./util.js";
import { AndroidApplicationStatus } from "./adb/app_status";
import {
    AdbBridgeLaunchApplicationRequest,
    ExitApplicationRequest,
    GetApplicationStateRequest,
    KeyPressRequest,
    StartDeviceTelemetryRequest
} from "./dab/dab_requests";
import {
    Application,
    DabResponse,
    DeviceInformationResponse,
    ExitApplicationResponse,
    GetApplicationStateResponse,
    LaunchApplicationResponse,
    ListApplicationsResponse,
    NetworkInterface,
    RestartResponse,
    StartDeviceTelemetryResponse
} from "./dab/dab_responses";
import { ApplicationState } from "./dab/dab_constants";

const logger = getLogger();

export class DabDevice extends DabDeviceBase {
    private readonly adb: AdbCommands;
    private readonly appMap: Record<string, any>;

    constructor(deviceId: string) {
        super();
        this.adb = new AdbCommands(deviceId);
        this.appMap = config.get("appMap");
    }

    override deviceInfo = async (): Promise<DeviceInformationResponse> => {
        const deviceInfo = await this.adb.getDeviceDetails();

        let networkInterfaces: NetworkInterface[];
        if (Array.isArray(deviceInfo.ip)) {
            networkInterfaces = deviceInfo.ip.map((ip, i) => ({
                connected: deviceInfo.networkType !== "other",
                macAddress: (deviceInfo.mac as string[])[i],
                ipAddress: ip,
                type: deviceInfo.networkType
            }));
        } else {
            networkInterfaces = [
                {
                    connected: deviceInfo.networkType !== "other",
                    macAddress: deviceInfo.mac as string,
                    ipAddress: deviceInfo.ip as string,
                    type: deviceInfo.networkType
                }
            ];
        }
        return {
            ...this.dabResponse(),
            manufacturer: deviceInfo.properties?.["ro.product.manufacturer"] || "unknown",
            model: deviceInfo.properties?.["ro.product.model"] || "unknown",
            serialNumber: deviceInfo.serial!,
            chipset: deviceInfo.properties?.["ro.product.cpu.abi"] || "unknown",
            firmwareVersion: deviceInfo.properties?.["ro.build.fingerprint"] || "unknown",
            firmwareBuild: deviceInfo.properties?.["ro.build.fingerprint"] || "unknown",
            networkInterfaces: networkInterfaces,
            screenWidthPixels: deviceInfo.resolution.x!,
            screenHeightPixels: deviceInfo.resolution.y!,
            uptimeSince: await this.adb.getDeviceUptimeSeconds()
        };
    };

    override listApps = async (): Promise<ListApplicationsResponse | DabResponse> => {
        try {
            const appArr: Application[] = [];
            const packageArr = await this.adb.getPackages();
            for (let appId of Object.keys(this.appMap)) {
                if (Array.isArray(this.appMap[appId])) {
                    for (const implObj of this.appMap[appId]) {
                        logger.debug(`Checking packages for appId: ${appId} with package ${implObj.package}`);
                        if (packageArr.includes(implObj.package)) {
                            this.appMap[appId] = implObj;
                            logger.debug("App found, pushing to appArr");
                            appArr.push({
                                appId: appId,
                                friendlyName: this.appMap[appId].friendlyName,
                                version: "unknown"
                            });
                            break;
                        } else {
                            logger.debug("App not found, ignoring");
                        }
                    }
                } else {
                    logger.debug(`Checking packages for appId: ${appId} with package ${this.appMap[appId].package}`);
                    if (packageArr.includes(this.appMap[appId].package)) {
                        logger.debug("App found, pushing to appArr");
                        appArr.push({
                            appId: appId,
                            friendlyName: this.appMap[appId].friendlyName,
                            version: "unknown"
                        });
                    } else {
                        logger.debug("App not found, ignoring");
                    }
                }
            }
            return { ...this.dabResponse(), ...{ applications: appArr } };
        } catch (e) {
            logger.error(e);
            return this.dabResponse(500, e.message);
        }
    };

    override launchApp = async (data: AdbBridgeLaunchApplicationRequest): Promise<LaunchApplicationResponse> => {
        if (typeof data.appId !== "string")
            return this.dabResponse(400, "'appId' must be set as the application id to launch");

        try {
            data.appId = data.appId.toLowerCase();
            if (!this.appMap[data.appId] || !this.appMap[data.appId].intent)
                return this.dabResponse(404, `Couldn't find data for app ${data.appId} in config file`);

            let intent: string[] = this.appMap[data.appId].intent.slice();
            if (Array.isArray(data.parameters)) {
                if (this.appMap[data.appId].optionsPrefix) {
                    logger.debug("Adding optionsPrefix to intent array");
                    intent = [...intent, ...this.appMap[data.appId].optionsPrefix];
                }
                intent = [...intent, ...data.parameters];
            } else if (data.parameters) {
                logger.debug("Appending parameters to last intent array value");
                intent[intent.length - 1] = intent[intent.length - 1] + data.parameters;
            }

            await this.adb.start(intent);
            return this.dabResponse();
        } catch (e) {
            logger.error(e);
            return this.dabResponse(500, e.message);
        }
    };

    override exitApp = async (data: ExitApplicationRequest): Promise<ExitApplicationResponse | DabResponse> => {
        if (typeof data.appId !== "string")
            return this.dabResponse(400, "'appId' must be set as the application id to exit");

        try {
            data.appId = data.appId.toLowerCase();
            const appPackage: string | undefined = this.appMap[data.appId]?.package;
            if (!appPackage) return this.dabResponse(404, `Couldn't find data for app ${data.appId} in config file`);

            const appStatus = (await this.adb.status(appPackage))?.state;
            if (data.force) {
                if (appStatus !== AndroidApplicationStatus.Stopped) {
                    await this.adb.stop(appPackage);
                }
                return { ...this.dabResponse(), state: ApplicationState.Stopped };
            }

            if (appStatus === AndroidApplicationStatus.Running) {
                try {
                    await this.adb.backgroundApp(appPackage);
                    return { ...this.dabResponse(), state: ApplicationState.Background };
                } catch (e) {
                    logger.warn(`Failed to background ${data.appId}, will try force closing it instead.`);
                    await this.adb.stop(appPackage);
                    return { ...this.dabResponse(), state: ApplicationState.Stopped };
                }
            }
            return {
                ...this.dabResponse(),
                state: adbAppStatusToDabAppState(appStatus)
            };
        } catch (e) {
            return this.dabResponse(500, e.message);
        }
    };

    override getAppState = async (
        data: GetApplicationStateRequest
    ): Promise<GetApplicationStateResponse | DabResponse> => {
        if (typeof data.appId !== "string")
            return this.dabResponse(400, "'appId' must be set as the application id to query");
        try {
            data.appId = data.appId.toLowerCase();
            const appPackage = this.appMap[data.appId]?.package;
            if (!appPackage) return this.dabResponse(404, `Couldn't find data for app ${data.appId} in config file`);

            const appStatus = (await this.adb.status(appPackage)).state;
            return {
                ...this.dabResponse(),
                state: adbAppStatusToDabAppState(appStatus)
            };
        } catch (e) {
            return this.dabResponse(500, e.message);
        }
    };

    override restartDevice = async (): Promise<RestartResponse> => {
        const handleReboot = async () => {
            await this.notify("warn", "Device is rebooting and will be temporarily offline");
            await this.adb.reboot();
            await this.notify("info", "Device is back online following reboot");
        };
        handleReboot().catch(err => {
            logger.error(err);
        });
        return this.dabResponse(202);
    };

    override keyPress = async (data: KeyPressRequest) => {
        if (typeof data.keyCode !== "string") return this.dabResponse(400, "'keyCode' must be set");

        try {
            await this.adb.sendKey(data.keyCode);
            return this.dabResponse();
        } catch (e) {
            if (e.message.startsWith("Unrecognized keyCode")) {
                return this.dabResponse(401, e.message);
            }
            return this.dabResponse(500, e.message);
        }
    };

    override startDeviceTelemetry = async (
        data: StartDeviceTelemetryRequest
    ): Promise<StartDeviceTelemetryResponse | DabResponse> => {
        if (typeof data.frequency !== "number" || !Number.isInteger(data.frequency))
            return this.dabResponse(400, "'frequency' must be set as number of milliseconds between updates");

        const platformMinFrequency: number = config.get("adb.minTelemetryMillis");
        if (data.frequency < platformMinFrequency) {
            data.frequency = platformMinFrequency; //Setting minimum frequency for Android
            logger.info(`Increased device telemetry frequency to minimum allowed: ${platformMinFrequency}ms`);
        }

        return await this.startDeviceTelemetryImpl(data, async () => {
            return await this.adb.top();
        });
    };

    override stopDeviceTelemetry = async () => {
        return await this.stopDeviceTelemetryImpl();
    };

    override healthCheck = async () => {
        try {
            await this.adb.getDeviceUptimeSeconds();
            return { ...this.dabResponse(), healthy: true };
        } catch (err) {
            return { ...this.dabResponse(), healthy: false };
        }
    };
}
