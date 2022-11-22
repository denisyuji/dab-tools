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
import { MqttClient } from "./lib/mqtt_client/index.js";
import { DabClient } from "./lib/dab/dab_client.js";
import { sleep } from "./lib/util.js";
import { DabKey } from "./lib/adb/adb_keymap";

async function main() {
    const client = new MqttClient();
    await client.init(config.get("mqttBroker"));
    const dabClientExample = new DabClient(client);

    // Print to console any messages published from the device's DAB implementation
    await dabClientExample.showMessages();

    try {
        console.log(`DAB Version: ${JSON.stringify(await dabClientExample.version())}\n`);

        console.log(`Device Info: ${JSON.stringify(await dabClientExample.deviceInfo(), null, 2)}\n`);

        console.log(`Health Check: ${JSON.stringify(await dabClientExample.healthCheck())}\n`);

        const listAppsResponse = await dabClientExample.listApps();
        console.log(`list apps: ${JSON.stringify(listAppsResponse, null, 2)}\n`);

        await dabClientExample.showDeviceTelemetry();

        const startTelemetryResponse = await dabClientExample.startDeviceTelemetry(5000);
        console.log(`start telemetry: ${JSON.stringify(startTelemetryResponse)}\n`);

        const launchResponse = await dabClientExample.launchApp(
            "youtube",
            "watch?v=dQw4w9WgXcQ&list=PLFuNbp0NQ1D9ZMiyspdMS2hLtliqk9hVn&index=4"
        );
        console.log(`launch app: youtube, response: ${JSON.stringify(launchResponse)}\n`);

        await sleep(10 * 1000); //Let it roll for 10 seconds

        const exitResponse = await dabClientExample.exitApp("youtube", false);
        console.log(`Exit app: youtube, force: false, response: ${JSON.stringify(exitResponse)}\n`);

        const rebootResponse = await dabClientExample.restart();
        console.log(`restart device: ${JSON.stringify(rebootResponse)}\n`);

        let rebooting = true;
        let rebootHealthChecks = 0;
        while (rebooting) {
            if (rebootHealthChecks >= 20) {
                throw new Error("Could not reestablish connection with device after restart");
            }
            console.log("Waiting on reboot to complete...");
            await sleep(10 * 1000);
            const result = await dabClientExample.healthCheck();
            if (result.healthy) rebooting = false;
            rebootHealthChecks++;
        }
        console.log("Reestablished control of device\n");

        const appArr = listAppsResponse.applications;
        for (const app of appArr) {
            const launchResponse = await dabClientExample.launchApp(app.appId);
            console.log(`launch app: ${app.friendlyName}, response: ${JSON.stringify(launchResponse)}\n`);

            let keyResponse;
            if (app.appId === "settings") {
                for (let i = 0; i < 5; i++) {
                    keyResponse = await dabClientExample.pressKey(DabKey.KEY_DOWN);
                    console.log(`press "down": ${app.friendlyName}, response: ${JSON.stringify(keyResponse)}\n`);
                    await sleep(200);
                }
                keyResponse = await dabClientExample.pressKey(DabKey.KEY_CUSTOM_HOME);
                console.log(`press "custom home": ${app.friendlyName}, response: ${JSON.stringify(keyResponse)}\n`);
            } else {
                await sleep(8 * 1000);

                keyResponse = await dabClientExample.pressKey(DabKey.KEY_ENTER);
                console.log(`press "enter": ${app.friendlyName}, response: ${JSON.stringify(keyResponse)}\n`);

                await sleep(3 * 1000);
                keyResponse = await dabClientExample.pressKey(DabKey.KEY_ENTER);
                console.log(`press "enter": ${app.friendlyName}, response: ${JSON.stringify(keyResponse)}\n`);

                await sleep(3 * 1000);

                const exitResponse = await dabClientExample.exitApp(app.appId, true);
                console.log(`exit app: ${app.friendlyName}, response: ${JSON.stringify(exitResponse)}\n`);
            }
        }
        await dabClientExample.stopDeviceTelemetry();
        await dabClientExample.hideDeviceTelemetry();
    } catch (e) {
        console.log(e);
    } finally {
        await client.stop();
        console.log("DAB demonstration is finished");
    }
}

main().catch(console.error);
