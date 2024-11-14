import type { ActionReturn } from "svelte/action";

export function outsideClick(
    node: HTMLElement,
    excludeNode?: HTMLElement,
): ActionReturn {
    let hasExclusion = typeof excludeNode !== "undefined";
    let _excludeNode = excludeNode;

    function handleClick(event: MouseEvent): void {
        if (
            node !== undefined &&
            !node.contains(event.target as Node) &&
            !event.defaultPrevented &&
            ((hasExclusion &&
                event.target !== _excludeNode &&
                !_excludeNode!.contains(event.target as Node)) ||
                !hasExclusion)
        ) {
            node.dispatchEvent(new CustomEvent("clickOutside", event));
        }
    }

    document.addEventListener("click", handleClick, true);

    return {
        update(excludeNode) {
            _excludeNode = excludeNode as unknown as HTMLElement;
            hasExclusion = typeof _excludeNode !== "undefined";
        },
        destroy() {
            document.removeEventListener("click", handleClick, true);
        },
    };
}

declare namespace svelteHTML {
    interface HTMLAttributes<T> {
        "on:clickOutside"?: (event: MouseEvent) => unknown;
    }
}
