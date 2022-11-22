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

export enum AndroidKeyCode {
    KEYCODE_HOME = 3,
    KEYCODE_BACK = 4,
    KEYCODE_0 = 7,
    KEYCODE_1 = 8,
    KEYCODE_2 = 9,
    KEYCODE_3 = 10,
    KEYCODE_4 = 11,
    KEYCODE_5 = 12,
    KEYCODE_6 = 13,
    KEYCODE_7 = 14,
    KEYCODE_8 = 15,
    KEYCODE_9 = 16,
    KEYCODE_STAR = 17,
    KEYCODE_POUND = 18,
    KEYCODE_DPAD_CENTER = 23,
    KEYCODE_POWER = 26,
    KEYCODE_VOLUME_UP = 24,
    KEYCODE_VOLUME_DOWN = 25,
    KEYCODE_DPAD_UP = 19,
    KEYCODE_DPAD_DOWN = 20,
    KEYCODE_DPAD_LEFT = 21,
    KEYCODE_DPAD_RIGHT = 22,
    KEYCODE_ENTER = 66,
    KEYCODE_MENU = 82,
    KEYCODE_SEARCH = 84,
    KEYCODE_MEDIA_PLAY_PAUSE = 85,
    KEYCODE_MEDIA_STOP = 86,
    KEYCODE_MEDIA_NEXT = 87,
    KEYCODE_MEDIA_PREVIOUS = 88,
    KEYCODE_MEDIA_REWIND = 89,
    KEYCODE_MEDIA_FAST_FORWARD = 90,
    KEYCODE_PAGE_UP = 92,
    KEYCODE_PAGE_DOWN = 93,
    KEYCODE_MOVE_HOME = 122,
    KEYCODE_MOVE_END = 123,
    KEYCODE_MEDIA_PLAY = 126,
    KEYCODE_MEDIA_PAUSE = 127,
    KEYCODE_MEDIA_RECORD = 130,
    KEYCODE_VOLUME_MUTE = 164,
    KEYCODE_INFO = 165,
    KEYCODE_CHANNEL_UP = 166,
    KEYCODE_CHANNEL_DOWN = 167,
    KEYCODE_GUIDE = 172,
    KEYCODE_CAPTIONS = 175,
    KEYCODE_PROG_RED = 183,
    KEYCODE_PROG_GREEN = 184,
    KEYCODE_PROG_YELLOW = 185,
    KEYCODE_PROG_BLUE = 186,
    KEYCODE_WAKEUP = 224,
    KEYCODE_MEDIA_SKIP_FORWARD = 272,
    KEYCODE_MEDIA_SKIP_BACKWARD = 273
}

export enum DabKey {
    KEY_POWER = "KEY_POWER",
    KEY_HOME = "KEY_HOME",
    KEY_VOLUME_UP = "KEY_VOLUME_UP",
    KEY_VOLUME_DOWN = "KEY_VOLUME_DOWN",
    KEY_MUTE = "KEY_MUTE",
    KEY_CHANNEL_UP = "KEY_CHANNEL_UP",
    KEY_CHANNEL_DOWN = "KEY_CHANNEL_DOWN",
    KEY_MENU = "KEY_MENU",
    KEY_EXIT = "KEY_EXIT",
    KEY_INFO = "KEY_INFO",
    KEY_GUIDE = "KEY_GUIDE",
    KEY_CAPTIONS = "KEY_CAPTIONS",
    KEY_UP = "KEY_UP",
    KEY_PAGE_UP = "KEY_PAGE_UP",
    KEY_PAGE_DOWN = "KEY_PAGE_DOWN",
    KEY_RIGHT = "KEY_RIGHT",
    KEY_DOWN = "KEY_DOWN",
    KEY_LEFT = "KEY_LEFT",
    KEY_ENTER = "KEY_ENTER",
    KEY_BACK = "KEY_BACK",
    KEY_PLAY = "KEY_PLAY",
    KEY_PLAY_PAUSE = "KEY_PLAY_PAUSE",
    KEY_PAUSE = "KEY_PAUSE",
    KEY_RECORD = "KEY_RECORD",
    KEY_STOP = "KEY_STOP",
    KEY_REWIND = "KEY_REWIND",
    KEY_FAST_FORWARD = "KEY_FAST_FORWARD",
    KEY_SKIP_REWIND = "KEY_SKIP_REWIND",
    KEY_SKIP_FAST_FORWARD = "KEY_SKIP_FAST_FORWARD",
    KEY_0 = "KEY_0",
    KEY_1 = "KEY_1",
    KEY_2 = "KEY_2",
    KEY_3 = "KEY_3",
    KEY_4 = "KEY_4",
    KEY_5 = "KEY_5",
    KEY_6 = "KEY_6",
    KEY_7 = "KEY_7",
    KEY_8 = "KEY_8",
    KEY_9 = "KEY_9",
    KEY_RED = "KEY_RED",
    KEY_GREEN = "KEY_GREEN",
    KEY_YELLOW = "KEY_YELLOW",
    KEY_BLUE = "KEY_BLUE",
    KEY_CUSTOM_HOME = "KEY_CUSTOM_HOME",
    KEY_CUSTOM_STAR = "KEY_CUSTOM_STAR",
    KEY_CUSTOM_POUND = "KEY_CUSTOM_POUND",
    KEY_CUSTOM_SEARCH = "KEY_CUSTOM_SEARCH",
    KEY_CUSTOM_MOVE_HOME = "KEY_CUSTOM_MOVE_HOME",
    KEY_CUSTOM_MOVE_END = "KEY_CUSTOM_MOVE_END",
    KEY_CUSTOM_MEDIA_NEXT = "KEY_CUSTOM_MEDIA_NEXT",
    KEY_CUSTOM_MEDIA_PREVIOUS = "KEY_CUSTOM_MEDIA_PREVIOUS",
    KEY_CUSTOM_WAKEUP = "KEY_CUSTOM_WAKEUP"
}

export const dabKeysToAndroidKeyCodes: Record<DabKey, AndroidKeyCode> = {
    [DabKey.KEY_POWER]: AndroidKeyCode.KEYCODE_POWER,
    [DabKey.KEY_HOME]: AndroidKeyCode.KEYCODE_HOME,
    [DabKey.KEY_VOLUME_UP]: AndroidKeyCode.KEYCODE_VOLUME_UP,
    [DabKey.KEY_VOLUME_DOWN]: AndroidKeyCode.KEYCODE_VOLUME_DOWN,
    [DabKey.KEY_MUTE]: AndroidKeyCode.KEYCODE_VOLUME_MUTE,
    [DabKey.KEY_CHANNEL_UP]: AndroidKeyCode.KEYCODE_CHANNEL_UP,
    [DabKey.KEY_CHANNEL_DOWN]: AndroidKeyCode.KEYCODE_CHANNEL_DOWN,
    [DabKey.KEY_MENU]: AndroidKeyCode.KEYCODE_MENU,
    [DabKey.KEY_EXIT]: AndroidKeyCode.KEYCODE_HOME,
    [DabKey.KEY_INFO]: AndroidKeyCode.KEYCODE_INFO,
    [DabKey.KEY_GUIDE]: AndroidKeyCode.KEYCODE_GUIDE,
    [DabKey.KEY_CAPTIONS]: AndroidKeyCode.KEYCODE_CAPTIONS,
    [DabKey.KEY_UP]: AndroidKeyCode.KEYCODE_DPAD_UP,
    [DabKey.KEY_PAGE_UP]: AndroidKeyCode.KEYCODE_PAGE_UP,
    [DabKey.KEY_PAGE_DOWN]: AndroidKeyCode.KEYCODE_PAGE_DOWN,
    [DabKey.KEY_RIGHT]: AndroidKeyCode.KEYCODE_DPAD_RIGHT,
    [DabKey.KEY_DOWN]: AndroidKeyCode.KEYCODE_DPAD_DOWN,
    [DabKey.KEY_LEFT]: AndroidKeyCode.KEYCODE_DPAD_LEFT,
    [DabKey.KEY_ENTER]: AndroidKeyCode.KEYCODE_ENTER,
    [DabKey.KEY_BACK]: AndroidKeyCode.KEYCODE_BACK,
    [DabKey.KEY_PLAY]: AndroidKeyCode.KEYCODE_MEDIA_PLAY,
    [DabKey.KEY_PLAY_PAUSE]: AndroidKeyCode.KEYCODE_MEDIA_PLAY_PAUSE,
    [DabKey.KEY_PAUSE]: AndroidKeyCode.KEYCODE_MEDIA_PAUSE,
    [DabKey.KEY_RECORD]: AndroidKeyCode.KEYCODE_MEDIA_RECORD,
    [DabKey.KEY_STOP]: AndroidKeyCode.KEYCODE_MEDIA_STOP,
    [DabKey.KEY_REWIND]: AndroidKeyCode.KEYCODE_MEDIA_REWIND,
    [DabKey.KEY_FAST_FORWARD]: AndroidKeyCode.KEYCODE_MEDIA_FAST_FORWARD,
    [DabKey.KEY_SKIP_REWIND]: AndroidKeyCode.KEYCODE_MEDIA_SKIP_BACKWARD,
    [DabKey.KEY_SKIP_FAST_FORWARD]: AndroidKeyCode.KEYCODE_MEDIA_SKIP_FORWARD,
    [DabKey.KEY_0]: AndroidKeyCode.KEYCODE_0,
    [DabKey.KEY_1]: AndroidKeyCode.KEYCODE_1,
    [DabKey.KEY_2]: AndroidKeyCode.KEYCODE_2,
    [DabKey.KEY_3]: AndroidKeyCode.KEYCODE_3,
    [DabKey.KEY_4]: AndroidKeyCode.KEYCODE_4,
    [DabKey.KEY_5]: AndroidKeyCode.KEYCODE_5,
    [DabKey.KEY_6]: AndroidKeyCode.KEYCODE_6,
    [DabKey.KEY_7]: AndroidKeyCode.KEYCODE_7,
    [DabKey.KEY_8]: AndroidKeyCode.KEYCODE_8,
    [DabKey.KEY_9]: AndroidKeyCode.KEYCODE_9,
    [DabKey.KEY_RED]: AndroidKeyCode.KEYCODE_PROG_RED,
    [DabKey.KEY_GREEN]: AndroidKeyCode.KEYCODE_PROG_GREEN,
    [DabKey.KEY_YELLOW]: AndroidKeyCode.KEYCODE_PROG_YELLOW,
    [DabKey.KEY_BLUE]: AndroidKeyCode.KEYCODE_PROG_BLUE,
    [DabKey.KEY_CUSTOM_HOME]: AndroidKeyCode.KEYCODE_HOME,
    [DabKey.KEY_CUSTOM_STAR]: AndroidKeyCode.KEYCODE_STAR,
    [DabKey.KEY_CUSTOM_POUND]: AndroidKeyCode.KEYCODE_POUND,
    [DabKey.KEY_CUSTOM_SEARCH]: AndroidKeyCode.KEYCODE_SEARCH,
    [DabKey.KEY_CUSTOM_MOVE_HOME]: AndroidKeyCode.KEYCODE_MOVE_HOME,
    [DabKey.KEY_CUSTOM_MOVE_END]: AndroidKeyCode.KEYCODE_MOVE_END,
    [DabKey.KEY_CUSTOM_MEDIA_NEXT]: AndroidKeyCode.KEYCODE_MEDIA_NEXT,
    [DabKey.KEY_CUSTOM_MEDIA_PREVIOUS]: AndroidKeyCode.KEYCODE_MEDIA_PREVIOUS,
    [DabKey.KEY_CUSTOM_WAKEUP]: AndroidKeyCode.KEYCODE_WAKEUP
};
