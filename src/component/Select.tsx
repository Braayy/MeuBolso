import { JSX } from "solid-js";

export type SelectProps = JSX.SelectHTMLAttributes<HTMLSelectElement> & {};

export function Select(props: SelectProps) {
    const styles = () => ({
        "p-2": true,
        "bg-transparent": true,
        "border-b-2": true,
        "text-xl": true,
        "w-[70%]": true,
        "border-june-bud": true,
    });

    return (
        <select {...props} classList={styles()}>
            {props.children}
        </select>
    );
}