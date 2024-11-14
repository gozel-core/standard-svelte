import { type Writable } from "svelte/store";
import { writable } from "svelte/store";

function createPromptStore(): Writable<Prompt> & {
    show: (config: PromptConfig) => void;
    hide: (approved: boolean) => void;
} {
    const initialValue: Prompt = {
        active: false,
        kind: "danger",
        onResponse: (_approved: boolean): void => {},
        messages: {
            title: "",
            description: "",
            approve: "",
            cancel: "",
            close: "",
        },
    };
    const { subscribe, set, update } = writable(initialValue);

    function show(config: PromptConfig): void {
        update((value) => Object.assign({}, value, config, { active: true }));
    }

    function hide(approved: boolean): void {
        update((value) => {
            value.onResponse(approved);
            return Object.assign({}, value, initialValue);
        });
    }

    return { subscribe, set, update, show, hide };
}

export const prompt = createPromptStore();

interface Prompt {
    active: boolean;
    kind: "danger" | "info" | "success";
    onResponse: (approved: boolean) => void;
    messages: {
        title: string;
        description: string;
        approve: string;
        cancel: string;
        close: string;
    };
}

interface PromptConfig {
    kind: "danger" | "info" | "success";
    onResponse: (approved: boolean) => void;
    messages: {
        title: string;
        description: string;
        approve: string;
        cancel: string;
        close: string;
    };
}
