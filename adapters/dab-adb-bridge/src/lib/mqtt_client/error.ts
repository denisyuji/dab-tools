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

export class ErrorWithStatus extends Error {
    private readonly status: number;
    constructor(status = 500, message: string) {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
    }
}

export class TimeoutError extends Error {
    private readonly status: 408;
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        this.status = 408;
    }
}
