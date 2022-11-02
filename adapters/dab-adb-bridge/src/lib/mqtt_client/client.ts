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

import mqtt, {
    AsyncMqttClient,
    IClientOptions,
    ISubscriptionGrant,
    OnErrorCallback,
    OnMessageCallback
} from "async-mqtt";
import { serializeError } from "serialize-error";
import { v4 as uuidv4 } from "uuid";
import { TimeoutError } from "./error.js";
import { convertPattern } from "./util.js";
import { EventEmitter2, ListenerFn } from "eventemitter2";
import { IClientPublishOptions } from "mqtt";
import { IPublishPacket } from "mqtt-packet";
import { HandlerFunction, HandlerSubscription } from "./index";
import { setTimeout, clearTimeout } from "timers";

export class Client {
    private static readonly DEFAULT_PUBLISH_OPTIONS = { qos: 2, retain: false };
    private client: WrappedMqttClient;
    private emitter: EventEmitter2;
    private handlerSubscriptions: HandlerSubscription[];

    /**
     *  A generic construct that takes in an async mqtt client.
     */
    public constructor(mqttClient: WrappedMqttClient) {
        this.client = mqttClient;
        this.emitter = new EventEmitter2({
            wildcard: true,
            delimiter: "/",
            verboseMemoryLeak: true
        });

        this.handlerSubscriptions = [];

        this.client.setOnMessage(this.handleMessage.bind(this));
    }

    /**
     * Callback when the client receives a message to one of the subscribed topics
     * - the message could be a response from the client / device to the previous request
     * - the message could be a request to the client / device
     */
    private handleMessage(topic: string, msg: Buffer, pkt: IPublishPacket): void {
        let response = {};

        if (msg && msg.length) {
            try {
                response = JSON.parse(msg.toString());
            } catch (error) {
                response = {
                    status: 500,
                    error: "failed to parse msg",
                    msg: msg.toString(),
                    packet: pkt
                };
            }
        }
        this.emitter.emit(topic, response, pkt);
    }

    public async publish(topic: string, msg?: unknown, options: IClientPublishOptions = {}): Promise<void> {
        options = Object.assign({}, Client.DEFAULT_PUBLISH_OPTIONS, options);

        return this.client.publish(topic, msg, options);
    }

    public async subscribe(topic: string, callback: ListenerFn): Promise<HandlerSubscription> {
        const event = convertPattern(topic);
        this.emitter.on(event, callback);
        await this.client.subscribe(topic);

        return {
            end: async () => {
                this.emitter.removeListener(event, callback);
                if (this.emitter.listeners(event).length === 0) {
                    await this.client.unsubscribe(topic);
                }
            }
        };
    }

    /**
     * Makes a request to the DAB-enabled device, using the request/response convention
     * This method will automatically generate the request ID and append it to the request
     * If operation timed-out, it will throw a error.
     */
    public async request(
        topic: string,
        payload: unknown = {},
        options: IClientPublishOptions & { timeoutMs?: number } = {
            qos: 2,
            timeoutMs: 5000
        }
    ): Promise<unknown> {
        const requestId = uuidv4();
        const requestTopic = `${topic}/${requestId}`;
        const timeout = options.timeoutMs || 5000;

        return new Promise((resolve, reject) => {
            const timer = setTimeout(function () {
                reject(new TimeoutError(`Failed to receive response from ${topic} within ${timeout}ms`));
                subscriptionPromise.then(s => s.end());
            }, timeout);
            const subscriptionPromise = this.subscribe(`_response/${requestTopic}`, function (msg) {
                clearTimeout(timer);
                if (msg.status > 299) {
                    reject(msg);
                } else {
                    resolve(msg);
                }
                subscriptionPromise.then(s => s.end());
            });

            this.publish(requestTopic, payload, options).catch(err => {
                subscriptionPromise.then(s => s.end());
                reject(err);
            });
        });
    }

    /**
     * Register a handler for messages to the specified topic.
     */
    public async handle(topic: string, handler: HandlerFunction): Promise<void> {
        const subscription = await this.subscribe(`${topic}/+`, async (msg, { topic: requestTopic }) => {
            if (!requestTopic) {
                return Promise.reject(
                    new Error(`FATAL: Handler for topic (${topic}) failed to receive request topic.`)
                );
            } else {
                const responseTopic = `_response/${requestTopic}`;
                try {
                    const resultMsg = await handler(msg);
                    return this.publish(responseTopic, resultMsg);
                } catch (error) {
                    const status = error.status || 500;
                    return this.publish(responseTopic, {
                        status: status,
                        error: JSON.stringify(serializeError(error)),
                        request: msg
                    });
                }
            }
        });

        this.handlerSubscriptions.push(subscription);
    }

    public async end(): Promise<void> {
        await Promise.all(this.handlerSubscriptions.map(handler => handler.end()));
        await this.client.end();
    }
}

interface WrappedMqttClient {
    setOnMessage: (onMessage: OnMessageCallback) => void;
    subscribe: (topic: string) => Promise<ISubscriptionGrant[]>;
    unsubscribe: (topic: string) => Promise<void>;
    publish: (topic: string, payload?: unknown, options?: IClientPublishOptions) => Promise<void>;
    end: () => Promise<void>;
}
function wrap(mqttClient: AsyncMqttClient): WrappedMqttClient {
    return {
        setOnMessage: function (onMessage: OnMessageCallback): void {
            mqttClient.on("message", onMessage);
        },
        subscribe: function (topic: string): Promise<ISubscriptionGrant[]> {
            return mqttClient.subscribe(topic);
        },
        unsubscribe: function (topic: string): Promise<void> {
            return mqttClient.unsubscribe(topic);
        },
        publish: function (topic: string, payload: unknown, options: IClientPublishOptions = {}): Promise<void> {
            return mqttClient.publish(topic, JSON.stringify(payload), options);
        },
        end: async function (): Promise<void> {
            return mqttClient.end();
        }
    };
}

/**
 * Makes a mqtt connection and returns a async mqtt client.
 */
export function connect(uri: string, options: IClientOptions & { onConnected?: () => unknown } = {}): Promise<Client> {
    return new Promise((resolve, reject) => {
        const { keepalive = 10, ...otherOptions } = options;
        options = Object.assign(
            {
                keepalive: keepalive,
                connectTimeout: 2000,
                resubscribe: true,
                onConnected: () => {}
            },
            otherOptions
        );

        const mqttClient = mqtt.connect(uri, options);
        let connected = false;
        let initialized = false;

        const onError: OnErrorCallback = error => {
            if (!connected && !initialized) {
                mqttClient.end().finally(() => reject(error));
            }
            mqttClient.removeListener("error", onError);
        };

        mqttClient.on("error", onError);
        mqttClient.on("connect", () => {
            if (!initialized) {
                connected = true;
                mqttClient.removeListener("error", onError);
                resolve(new Client(wrap(mqttClient)));
                if (options.onConnected) {
                    options.onConnected();
                }
            }

            initialized = true;
        });
    });
}
