import type { Writable } from "svelte/store";
import { writable } from "svelte/store";

function createNotificationStore(): Writable<Notification[]> & {
    send: (notification: Notification) => void;
} {
    const { subscribe, set, update }: Writable<Notification[]> = writable([]);

    function send(notification: Notification): void {
        update((arr) => {
            notification.id =
                "notification-" + Math.floor(Math.random() * 100).toString();
            return [notification].concat(arr);
        });

        scheduleRemoval(notification);
    }

    function scheduleRemoval(notification: Notification): void {
        setTimeout(
            () => {
                update((arr) => {
                    return arr.filter((item) => item.id !== notification.id);
                });
            },
            (typeof notification.timeout === "number"
                ? notification.timeout
                : 3000) + 1000,
        );
    }

    return { subscribe, set, update, send };
}

export const notifications: Writable<Notification[]> & {
    send: (notification: Notification) => void;
} = createNotificationStore();

export interface Notification {
    id?: string;
    kind: "success" | "error";
    message: string;
    timeout?: number;
    title?: string;
}
