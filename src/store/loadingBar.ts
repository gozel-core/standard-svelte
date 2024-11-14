import type { Writable } from "svelte/store";

import { writable } from "svelte/store";

function createLoadingBarStore(): Writable<boolean> & {
    enable: () => void;
    disable: () => void;
} {
    const { subscribe, set, update } = writable(false);

    function enable() {
        set(true);
    }

    function disable() {
        set(false);
    }

    return { subscribe, set, update, enable, disable };
}

export const loadingBar = createLoadingBarStore();
