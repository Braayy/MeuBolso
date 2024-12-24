import { JSX } from "solid-js";

type ThrobberProps = {
    size: number;
};

export function Throbber(props: ThrobberProps) {
    const runtimeStyles: () => JSX.CSSProperties = () => ({
        "width": `${props.size}px`,
        "height": `${props.size}px`
    });

    return (
        <div
            class="border-[6px] border-[#f3f3f3] border-t-[6px] border-t-june-bud rounded-full animate-spin"
            style={runtimeStyles()}
        ></div>
    );
}